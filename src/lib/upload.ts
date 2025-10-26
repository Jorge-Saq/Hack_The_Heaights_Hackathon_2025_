// Use the specific auth import for v6+
import { fetchAuthSession } from 'aws-amplify/auth';

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL;

export async function uploadFile(
  file: File,
  key: string,
  onProgress?: (progress: number) => void // Note: Progress simulation is basic
): Promise<void> {
  try {
    // --- Get authentication token (v6+ style) ---
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString(); // Access idToken JWT string

    // --- Add console log for debugging ---
    console.log("Retrieved ID Token:", token ? `Token found (length ${token.length})` : "Token NOT found");

    if (!token) {
      throw new Error('Authentication token not found. User might not be logged in.');
    }
    if (!API_GATEWAY_URL) {
       throw new Error('API Gateway URL is not configured. Check NEXT_PUBLIC_API_GATEWAY_URL environment variable.');
    }
     if (!process.env.NEXT_PUBLIC_USER_PROFILES_BUCKET) {
       throw new Error('User profiles bucket name is not configured. Check NEXT_PUBLIC_USER_PROFILES_BUCKET environment variable.');
     }
    // --- End Token Retrieval ---

    // Get presigned URL from API Gateway
    const response = await fetch(`${API_GATEWAY_URL}/upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // Standard Bearer token header
      },
      body: JSON.stringify({
        bucket: process.env.NEXT_PUBLIC_USER_PROFILES_BUCKET,
        key,
        contentType: file.type,
      }),
    }); // <-- Fixed parenthesis was here

    if (!response.ok) {
       const errorBody = await response.text(); // Get more details from the API response
      throw new Error(`Failed to get presigned URL: ${response.status} ${response.statusText}. Body: ${errorBody}`);
    }

    const { presignedUrl } = await response.json();

    if (!presignedUrl) {
        throw new Error('Presigned URL not received from API.');
    }

    console.log(`Received presigned URL for ${key}:`, presignedUrl.substring(0, 100) + '...'); // Log start of URL

    // Upload file directly to S3 using presigned URL
    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type, // S3 needs Content-Type for PUT via presigned URL
      },
      // mode: 'cors' // Might be needed depending on S3 CORS, but often not for PUT
    });

    if (!uploadResponse.ok) {
      const errorBody = await uploadResponse.text(); // Get details from S3 response
      throw new Error(`S3 Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}. Body: ${errorBody}`);
    }

    // Simulate progress for better UX (Real progress requires XHR/fetch ReadableStream)
    if (onProgress) {
      onProgress(100);
    }

    console.log(`Successfully uploaded ${key}`);
  } catch (error) {
    console.error('Upload error in uploadFile:', error);
    // Re-throw the error so the calling component knows it failed
    throw error;
  }
}

export async function uploadEventPhoto(
  file: File,
  eventId: string,
  onProgress?: (progress: number) => void // Note: Progress simulation is basic
): Promise<void> {
  try {
    // --- Get authentication token (v6+ style) ---
     const session = await fetchAuthSession();
     const token = session.tokens?.idToken?.toString(); // Access idToken JWT string

     console.log("Retrieved ID Token for event photo:", token ? `Token found (length ${token.length})` : "Token NOT found");

     if (!token) {
       throw new Error('Authentication token not found. User might not be logged in.');
     }
     if (!API_GATEWAY_URL) {
        throw new Error('API Gateway URL is not configured. Check NEXT_PUBLIC_API_GATEWAY_URL environment variable.');
     }
      if (!process.env.NEXT_PUBLIC_EVENT_PHOTOS_BUCKET) {
        throw new Error('Event photos bucket name is not configured. Check NEXT_PUBLIC_EVENT_PHOTOS_BUCKET environment variable.');
      }
    // --- End Token Retrieval ---

    const key = `event-photos/${eventId}/${file.name}`;

    // Get presigned URL from API Gateway
    const response = await fetch(`${API_GATEWAY_URL}/upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        bucket: process.env.NEXT_PUBLIC_EVENT_PHOTOS_BUCKET,
        key,
        contentType: file.type,
      }),
    }); // <-- Fixed parenthesis was here

    if (!response.ok) {
       const errorBody = await response.text();
      throw new Error(`Failed to get presigned URL for event photo: ${response.status} ${response.statusText}. Body: ${errorBody}`);
    }

    const { presignedUrl } = await response.json();

     if (!presignedUrl) {
         throw new Error('Presigned URL for event photo not received from API.');
     }

     console.log(`Received presigned URL for event photo ${key}:`, presignedUrl.substring(0, 100) + '...');

    // Upload file directly to S3 using presigned URL
    const uploadResponse = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
      // mode: 'cors'
    });

    if (!uploadResponse.ok) {
       const errorBody = await uploadResponse.text();
      throw new Error(`S3 Upload failed for event photo: ${uploadResponse.status} ${uploadResponse.statusText}. Body: ${errorBody}`);
    }

    // Simulate progress for better UX
    if (onProgress) {
      onProgress(100);
    }

    console.log(`Successfully uploaded event photo ${key}`);
  } catch (error) {
    console.error('Event photo upload error:', error);
    throw error;
  }
}
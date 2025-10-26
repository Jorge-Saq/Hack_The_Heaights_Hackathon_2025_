// Use the specific auth import for v6+
import { fetchAuthSession } from 'aws-amplify/auth';

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL;

async function makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}) {
  // --- Updated Authentication ---
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();

  if (!token) {
      throw new Error('Authentication token not found for API request.');
  }
   if (!API_GATEWAY_URL) {
       throw new Error('API Gateway URL not configured for API request.');
   }
  // --- End Update ---

  const response = await fetch(`${API_GATEWAY_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`, // Use standard Authorization header
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText}. Body: ${errorBody}`);
  }

  // Handle cases where response might be empty (like a successful POST/PUT with no body)
  const contentType = response.headers.get("content-type");
  if (response.status === 204 || !contentType || !contentType.includes("application/json")) {
    return null; // Or return { success: true } or similar if appropriate
  }

  return response.json();
}

// --- Functions using the helper ---
// Note: Unused functions (getGalleryPhotos, updateMatchStatus, getNotifications) have been removed
// The makeAuthenticatedRequest function is kept for potential future API calls
'use client'

// React and Next.js imports
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Amplify imports
import { useAuthenticator } from '@aws-amplify/ui-react';

// Local utility import - Make absolutely sure this path is correct
import { uploadFile } from '../../lib/upload';

export default function UploadPage() {
  const { user } = useAuthenticator(); // This hook requires context from <Authenticator>
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [dragActive, setDragActive] = useState(false);

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      // Filter for common image types
      const imageFiles = newFiles.filter(file =>
         file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg'
      );
      setFiles(prev => [...prev, ...imageFiles].slice(0, 10)); // Max 10 files
    }
  }, []);

  // File input handler
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
       // Filter for common image types
      const imageFiles = newFiles.filter(file =>
          file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg'
      );
      setFiles(prev => [...prev, ...imageFiles].slice(0, 10)); // Max 10 files
    }
  };

  // Remove file handler
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // File upload logic
  const uploadFiles = async () => {
    // Check user exists before accessing username
    if (files.length !== 10 || !user || !user.username) {
        alert("Please select exactly 10 photos. Also ensure you are logged in.");
        return;
    }


    setUploading(true);
    setUploadProgress({});
    const uploadPromises: Promise<void>[] = []; // Store promises for parallel upload (optional)

    try {
      const username = user.username; // Use username (email) from authenticator

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Ensure consistent naming convention, e.g., using original extension might be better if Lambda handles it
        // Or enforce JPG on upload/Lambda side. Assuming JPG for now.
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg'; // Basic extension extraction
        const key = `user-profiles/${username}/${i + 1}.${fileExtension}`;

        // Update progress state immediately for this file
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        // Create a promise for each upload
        const uploadPromise = uploadFile(file, key, (progress) => {
          // Update progress for the specific file
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
        })
        .then(() => {
            // Mark as complete on success
            setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        })
        .catch(error => {
            console.error(`Error uploading ${file.name}:`, error);
            setUploadProgress(prev => ({ ...prev, [file.name]: -1 })); // Indicate error with -1 or similar
            // Optionally, re-throw or collect errors to show user
            throw new Error(`Failed to upload ${file.name}`);
        });

        uploadPromises.push(uploadPromise);
      }

       // Wait for all uploads to complete
       await Promise.all(uploadPromises);

       // Check if any upload failed (progress is -1)
       const failedUploads = Object.values(uploadProgress).some(p => p === -1);
       if (failedUploads) {
           alert("One or more uploads failed. Please check the console and try again.");
           // Reset progress for failed files if needed
           // setUploadProgress(prev => /* logic to reset errors */);
       } else {
           // Redirect only if all uploads succeeded
           console.log("All uploads successful, redirecting...");
           router.push('/upload-complete');
       }

    } catch (error) {
      // This catch block might handle errors from Promise.all or initial setup
      console.error('Overall upload process error:', error);
       if (!alert.name) alert('An unexpected error occurred during upload. Please try again.'); // Avoid double alerts
    } finally {
      // Only set uploading to false after all promises resolve/reject
      setUploading(false);
    }
  };

  // Component rendering
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4"> {/* Lighter gray background */}
      <div className="w-full max-w-2xl"> {/* Slightly smaller max-width */}
        <div className="bg-white shadow-lg rounded-lg"> {/* Increased shadow */}
          <div className="px-6 py-8 sm:px-10 sm:py-10"> {/* Adjusted padding */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 text-center"> {/* Responsive text */}
              Upload Your Profile Photos
            </h1>
            <p className="text-gray-600 mb-6 text-center text-sm sm:text-base"> {/* Responsive text */}
              Welcome — please upload exactly 10 clear photos (JPG/PNG) for face recognition.
            </p>

            {/* --- Dropzone Div with Tailwind Classes --- */}
            <div
              // Centered, less vertical padding, adjusted hover/active states
              className={`upload-dropzone max-w-xl mx-auto border-2 border-dashed border-gray-300 rounded-lg py-6 px-6 text-center transition-colors duration-200 cursor-pointer hover:border-blue-600 hover:bg-blue-50 ${dragActive ? 'border-blue-700 bg-blue-100' : 'bg-gray-50'}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload')?.click()} // Make clickable via label or div
            >
              <div className="space-y-2 pointer-events-none">
                <svg className="mx-auto h-10 w-10 text-gray-400" width="64" height="64" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div>
                    <span className="mt-2 block text-sm font-semibold text-gray-700">
                      Drop 10 photos here or click to upload
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      PNG, JPG, JPEG only. Max 10MB each.
                    </span>
                   {/* Visually hidden Input */}
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    multiple // Allow selecting multiple files
                    accept="image/png, image/jpeg, image/jpg" // Specific types
                    onChange={handleFileInput}
                  />
                </div>
              </div>
            </div>
            {/* --- End Dropzone Div --- */}


            {files.length > 0 && (
              <div className="mt-6">
                <h3 className="text-base font-semibold text-gray-800 mb-3">
                  Selected Files ({files.length}/10)
                   {files.length !== 10 && <span className="text-red-600 ml-2">(Please select exactly 10)</span>}
                </h3>
                
                {/* Photo Grid Layout */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 max-h-96 overflow-y-auto border border-gray-200 rounded-md p-4 bg-gray-50">
                  {files.map((file, index) => (
                    <div key={index} className="relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      {/* Photo Label */}
                      <div className="absolute top-1 left-1 z-10 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        Photo {index + 1}
                      </div>
                      
                      {/* Remove Button */}
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute top-1 right-1 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-red-500"
                        disabled={uploading}
                        aria-label={`Remove Photo ${index + 1}`}
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Photo Preview */}
                      <div className="aspect-square relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                          onLoad={(e) => URL.revokeObjectURL((e.target as HTMLImageElement).src)}
                        />
                        
                        {/* Progress Bar */}
                        {uploadProgress[file.name] !== undefined && uploadProgress[file.name] >= 0 && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gray-200 h-1">
                            <div
                              className={`h-1 transition-all duration-300 ${uploadProgress[file.name] === 100 ? 'bg-green-500' : 'bg-blue-600'}`}
                              style={{ width: `${uploadProgress[file.name]}%` }}
                            />
                          </div>
                        )}
                        
                        {/* Error Indicator */}
                        {uploadProgress[file.name] === -1 && (
                          <div className="absolute inset-0 bg-red-500 bg-opacity-70 flex items-center justify-center">
                            <span className="text-white text-xs font-semibold">Error</span>
                          </div>
                        )}
                      </div>
                      
                      {/* File Info */}
                      <div className="p-2 text-center">
                        <p className="text-xs text-gray-600 truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={uploadFiles}
                // --- Updated disabled condition ---
                disabled={files.length !== 10 || uploading}
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading ({Object.values(uploadProgress).filter(p=>p===100).length}/{files.length})... {/* Show progress count */}
                  </span>
                ) : (
                   // --- Updated button text ---
                  `Upload ${files.length === 10 ? '10 Photos' : `(${files.length}/10 selected)`}`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
       {/* Spinner CSS - Needs to be global or in a CSS file */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  )
}
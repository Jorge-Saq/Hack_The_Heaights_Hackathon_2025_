'use client'; // Use client for potential future links or actions

import Link from 'next/link'; // Import Link for navigation
import { useAuthenticator } from '@aws-amplify/ui-react';

export default function UploadCompletePage() {
  const { user } = useAuthenticator();
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-8 text-center">
        {/* Checkmark Icon */}
        <svg className="upload-complete-icon mx-auto h-12 w-12 text-green-500" width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          Upload Complete!
        </h1>
        <p className="mt-2 text-gray-600">
          Great job! Your profile photos have been successfully uploaded.
        </p>
        {/* Optional: Add a link back home or elsewhere */}
        <div className="mt-6">
           <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
             Go back home
           </Link>
         </div>
      </div>
    </div>
  );
}

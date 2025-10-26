"use client";

import './globals.css'
import { Inter } from 'next/font/google'
import { Amplify } from 'aws-amplify'
// Import both Authenticator and AuthenticatorProvider if needed, but often just Authenticator suffices
import { Authenticator } from '@aws-amplify/ui-react'
import { I18n } from 'aws-amplify/utils'
import '@aws-amplify/ui-react/styles.css'
// Removed useEffect/useState related to isClient, relying on "use client" behavior

const inter = Inter({ subsets: ['latin'] })

// --- Safely handle environment variables ---
const amplifyConfig = {
  Auth: {
    Cognito: {
      region: process.env.NEXT_PUBLIC_AWS_REGION || '',
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || '',
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || '',
    }
  },
  Storage: {
    S3: {
      bucket: process.env.NEXT_PUBLIC_USER_PROFILES_BUCKET || '',
      region: process.env.NEXT_PUBLIC_AWS_REGION || '',
    },
  },
};

const isAmplifyConfigured =
  !!amplifyConfig.Auth.Cognito.userPoolId &&
  !!amplifyConfig.Auth.Cognito.userPoolClientId &&
  !!amplifyConfig.Auth.Cognito.region &&
  !!amplifyConfig.Storage.S3.bucket;

let amplifyConfiguredSuccessfully = false; // Flag to track successful configuration
if (isAmplifyConfigured) {
  try {
    // Only configure once if not already configured (optional safety)
    Amplify.configure(amplifyConfig, { ssr: true });
    amplifyConfiguredSuccessfully = true;
    console.log("Amplify configured successfully.");
  } catch (error) {
     console.error("Error configuring Amplify:", error);
  }
} else {
  console.error("Amplify configuration is missing required environment variables.");
  // Add detailed logging here if needed
}
// --- End Configuration Handling ---

// Custom signup form with name field
I18n.putVocabularies({
  en: {
    'Create Account': 'Create Account',
    'Create your account': 'Create your account',
    'Name': 'Name',
    'Enter your name': 'Enter your name',
    'Username': 'Username',
    'Enter your username': 'Enter your username',
    'Email': 'Email',
    'Enter your email': 'Enter your email',
    'Password': 'Password',
    'Enter your password': 'Enter your password',
    'Confirm Password': 'Confirm Password',
    'Enter your password again': 'Enter your password again',
  }
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  // Show error immediately if configuration failed
  // This check might run during SSR and client-side, ensuring error is shown if needed
  if (!amplifyConfiguredSuccessfully) {
     return (
       <html lang="en">
         <body className={inter.className}>
           <div style={{ padding: '20px', color: 'red', textAlign: 'center' }}>
             Error: Application not configured correctly. Check console.
           </div>
         </body>
       </html>
    );
  }

  // Render Authenticator directly since we are in a "use client" file
  // and have checked configuration
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* The Authenticator component provides context to its children */}
        <Authenticator
          formFields={{
            signUp: {
              name: {
                label: 'Name',
                placeholder: 'Enter your name',
                required: true,
                order: 1
              },
              username: {
                label: 'Username',
                placeholder: 'Enter your username',
                required: true,
                order: 2
              },
              email: {
                label: 'Email',
                placeholder: 'Enter your email',
                required: true,
                order: 3
              },
              password: {
                label: 'Password',
                placeholder: 'Enter your password',
                required: true,
                order: 4
              },
              confirm_password: {
                label: 'Confirm Password',
                placeholder: 'Enter your password again',
                required: true,
                order: 5
              }
            }
          }}
        >
            {children}
        </Authenticator>
      </body>
    </html>
  )
}
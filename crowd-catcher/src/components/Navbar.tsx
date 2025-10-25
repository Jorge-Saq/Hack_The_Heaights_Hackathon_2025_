'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Camera, Home, Upload, Image, LogOut } from 'lucide-react';
import { Button } from './Button';
import { fakeApi } from '@/lib/fakeApi';
import { useEffect, useState } from 'react';

export function Navbar() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const user = await fakeApi.getCurrentUser();
      setCurrentUser(user);
    };
    checkAuth();
  }, []);

  const handleLogout = async () => {
    await fakeApi.logout();
    setCurrentUser(null);
    router.push('/');
  };

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Camera className="h-8 w-8 text-sky-600" />
            <span className="text-xl font-bold text-slate-900">
              📸 Crowd Catcher
            </span>
          </Link>

          {/* Navigation Links */}
          {currentUser ? (
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
              <Link
                href="/upload"
                className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <Upload className="h-4 w-4" />
                <span>Upload</span>
              </Link>
              <Link
                href="/gallery"
                className="flex items-center space-x-1 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <Image className="h-4 w-4" />
                <span>Gallery</span>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-1"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log In
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

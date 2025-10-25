'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Toast } from '@/components/Toast';
import { fakeApi } from '@/lib/fakeApi';
import { Check, X, SkipForward, ArrowLeft } from 'lucide-react';

interface Match {
  id: string;
  photoId: string;
  similarity: number;
  photo?: {
    id: string;
    url: string;
    filename: string;
  };
}

export default function ReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const loadMatches = async () => {
      try {
        // In a real app, this would use the token from URL params
        const token = searchParams.get('token');
        if (!token) {
          // For demo purposes, get matches for current user
          const user = await fakeApi.getCurrentUser();
          if (!user) {
            router.push('/login');
            return;
          }
          
          const userMatches = await fakeApi.proposeMatchesForUser(user.id);
          setMatches(userMatches);
        }
      } catch (error) {
        setToast({ 
          message: 'Failed to load matches', 
          type: 'error' 
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadMatches();
  }, [router, searchParams]);

  const handleConfirm = async () => {
    if (currentIndex >= matches.length) return;

    setIsProcessing(true);
    try {
      const match = matches[currentIndex];
      const user = await fakeApi.getCurrentUser();
      
      if (user && match.photoId) {
        await fakeApi.confirmMatch({ userId: user.id, photoId: match.photoId });
      }

      setCurrentIndex(currentIndex + 1);
    } catch (error) {
      setToast({ 
        message: 'Failed to confirm match', 
        type: 'error' 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (currentIndex >= matches.length) return;

    setIsProcessing(true);
    try {
      const match = matches[currentIndex];
      const user = await fakeApi.getCurrentUser();
      
      if (user && match.photoId) {
        await fakeApi.rejectMatch({ userId: user.id, photoId: match.photoId });
      }

      setCurrentIndex(currentIndex + 1);
    } catch (error) {
      setToast({ 
        message: 'Failed to reject match', 
        type: 'error' 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkip = () => {
    setCurrentIndex(currentIndex + 1);
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'y' || e.key === 'Y') {
      handleConfirm();
    } else if (e.key === 'n' || e.key === 'N') {
      handleReject();
    } else if (e.key === 's' || e.key === 'S') {
      handleSkip();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, matches.length]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your matches...</p>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">No Matches Found</h1>
          <p className="text-slate-600 mb-6">
            We couldn't find any potential matches for you at this time.
          </p>
          <Button onClick={() => router.push('/gallery')}>
            Go to My Gallery
          </Button>
        </Card>
      </div>
    );
  }

  if (currentIndex >= matches.length) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Thanks for confirming!</h1>
          <p className="text-slate-600 mb-6">
            You've reviewed all your potential matches. Check your gallery to see your confirmed photos.
          </p>
          <Button onClick={() => router.push('/gallery')}>
            Go to My Gallery
          </Button>
        </Card>
      </div>
    );
  }

  const currentMatch = matches[currentIndex];
  const progress = ((currentIndex + 1) / matches.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Review Your Photos</h1>
          <p className="text-slate-600">
            Is this you in the photo? Help us confirm your matches.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-700">
              {currentIndex + 1} of {matches.length}
            </span>
            <span className="text-sm text-slate-500">
              {Math.round(progress)}% complete
            </span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-sky-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Photo Review */}
        <Card className="p-8">
          <div className="text-center">
            <div className="mb-6">
              <img
                src={currentMatch.photo?.url || '/placeholder.jpg'}
                alt="Potential match"
                className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg object-cover"
              />
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Is this you?
              </h2>
              <p className="text-slate-600">
                We found this photo that might contain you. Please confirm if this is you.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleConfirm}
                disabled={isProcessing}
                className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <Check className="h-4 w-4" />
                <span>It's me</span>
              </Button>

              <Button
                onClick={handleReject}
                disabled={isProcessing}
                variant="secondary"
                className="flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Not me</span>
              </Button>

              <Button
                onClick={handleSkip}
                disabled={isProcessing}
                variant="ghost"
                className="flex items-center space-x-2"
              >
                <SkipForward className="h-4 w-4" />
                <span>Skip</span>
              </Button>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="mt-6 text-sm text-slate-500">
              <p>Keyboard shortcuts: <kbd className="px-2 py-1 bg-slate-100 rounded text-xs">Y</kbd> for "It's me", <kbd className="px-2 py-1 bg-slate-100 rounded text-xs">N</kbd> for "Not me", <kbd className="px-2 py-1 bg-slate-100 rounded text-xs">S</kbd> to skip</p>
            </div>
          </div>
        </Card>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={() => router.push('/gallery')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Gallery</span>
          </Button>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

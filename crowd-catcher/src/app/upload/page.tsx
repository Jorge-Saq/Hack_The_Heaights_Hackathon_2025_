'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { FileDropzone } from '@/components/FileDropzone';
import { Toast } from '@/components/Toast';
import { fakeApi } from '@/lib/fakeApi';
import { Upload, CheckCircle, Clock, Users, Camera } from 'lucide-react';

interface UploadStatus {
  id: string;
  filename: string;
  status: 'queued' | 'processing' | 'done';
}

export default function UploadPage() {
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [stats, setStats] = useState({
    uploadedCount: 0,
    facesDetected: 0,
    matchesFound: 0,
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const user = await fakeApi.getCurrentUser();
      if (!user) {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsData = await fakeApi.getUploadStats();
        setStats(statsData);
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    };
    loadStats();
  }, []);

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadStatuses([]);

    // Initialize upload statuses
    const initialStatuses: UploadStatus[] = selectedFiles.map((file, index) => ({
      id: `upload-${index}`,
      filename: file.name,
      status: 'queued',
    }));
    setUploadStatuses(initialStatuses);

    try {
      // Simulate processing each file
      for (let i = 0; i < selectedFiles.length; i++) {
        // Update status to processing
        setUploadStatuses(prev => 
          prev.map((status, index) => 
            index === i ? { ...status, status: 'processing' } : status
          )
        );

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Upload files to fake API
      const uploadedPhotos = await fakeApi.uploadPhotos(selectedFiles);

      // Update all statuses to done
      setUploadStatuses(prev => 
        prev.map(status => ({ ...status, status: 'done' }))
      );

      // Simulate sending emails to matched students
      const matches = uploadedPhotos.length * 2; // Simulate some matches
      await fakeApi.sendReviewEmail({ userId: 'current-user', count: matches });

      // Update stats
      const newStats = await fakeApi.getUploadStats();
      setStats(newStats);

      setToast({ 
        message: `Emails sent to ${matches} matched students!`, 
        type: 'success' 
      });

      // Clear selected files
      setSelectedFiles([]);
      setUploadStatuses([]);

    } catch (error) {
      setToast({ 
        message: error instanceof Error ? error.message : 'Upload failed', 
        type: 'error' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusIcon = (status: UploadStatus['status']) => {
    switch (status) {
      case 'queued':
        return <Clock className="h-4 w-4 text-slate-400" />;
      case 'processing':
        return <div className="h-4 w-4 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />;
      case 'done':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
    }
  };

  const getStatusText = (status: UploadStatus['status']) => {
    switch (status) {
      case 'queued':
        return 'Queued';
      case 'processing':
        return 'Processing';
      case 'done':
        return 'Done';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Upload Event Photos</h1>
          <p className="text-slate-600">Upload photos from events to find students in the crowd</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Select Photos</h2>
              <FileDropzone
                onFilesSelected={handleFilesSelected}
                maxFiles={50}
                acceptedTypes={['image/*']}
              />
              
              {selectedFiles.length > 0 && (
                <div className="mt-6">
                  <Button 
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="w-full"
                  >
                    {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} Photos`}
                  </Button>
                </div>
              )}
            </Card>

            {/* Upload Progress */}
            {uploadStatuses.length > 0 && (
              <Card className="p-6 mt-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Upload Progress</h3>
                <div className="space-y-3">
                  {uploadStatuses.map((status) => (
                    <div key={status.id} className="flex items-center space-x-3">
                      {getStatusIcon(status.status)}
                      <span className="text-sm text-slate-600 flex-1 truncate">
                        {status.filename}
                      </span>
                      <span className="text-sm font-medium text-slate-900">
                        {getStatusText(status.status)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Stats Section */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Upload Statistics</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Camera className="h-5 w-5 text-slate-400" />
                    <span className="text-sm text-slate-600">Photos Uploaded</span>
                  </div>
                  <span className="font-semibold text-slate-900">{stats.uploadedCount}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-slate-400" />
                    <span className="text-sm text-slate-600">Faces Detected</span>
                  </div>
                  <span className="font-semibold text-slate-900">{stats.facesDetected}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-slate-400" />
                    <span className="text-sm text-slate-600">Matches Found</span>
                  </div>
                  <span className="font-semibold text-slate-900">{stats.matchesFound}</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">How it works</h3>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center text-xs font-medium">1</span>
                  <span>Upload event photos using the dropzone</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                  <span>Our system detects faces in each photo</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center text-xs font-medium">3</span>
                  <span>We match faces with enrolled students</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center text-xs font-medium">4</span>
                  <span>Students receive emails to confirm matches</span>
                </div>
              </div>
            </Card>
          </div>
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

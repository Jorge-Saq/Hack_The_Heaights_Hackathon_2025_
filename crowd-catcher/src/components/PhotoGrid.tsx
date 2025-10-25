'use client';

import { useState } from 'react';
import { Heart, Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Photo {
  id: string;
  url: string;
  filename: string;
  confirmedAt?: Date;
}

interface PhotoGridProps {
  photos: Photo[];
  className?: string;
}

export function PhotoGrid({ photos, className }: PhotoGridProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const toggleFavorite = (photoId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(photoId)) {
        newFavorites.delete(photoId);
      } else {
        newFavorites.add(photoId);
      }
      return newFavorites;
    });
  };

  if (photos.length === 0) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="text-slate-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">No photos yet</h3>
        <p className="text-slate-500">You haven't confirmed any photos yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
        {photos.map((photo) => (
          <div key={photo.id} className="group relative">
            <div className="aspect-square rounded-lg overflow-hidden bg-slate-100">
              <img
                src={photo.url}
                alt={photo.filename}
                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                onClick={() => setSelectedPhoto(photo)}
              />
            </div>
            
            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(photo.id);
                  }}
                  className={cn(
                    'p-2 rounded-full transition-colors',
                    favorites.has(photo.id)
                      ? 'bg-red-500 text-white'
                      : 'bg-white text-slate-600 hover:bg-red-50'
                  )}
                >
                  <Heart className={cn('h-4 w-4', favorites.has(photo.id) && 'fill-current')} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // In a real app, this would download the image
                    console.log('Download', photo.filename);
                  }}
                  className="p-2 rounded-full bg-white text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Saved badge */}
            <div className="absolute top-2 right-2">
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                Saved
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="relative max-w-4xl max-h-[90vh] mx-4">
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.filename}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-75 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { PhotoGrid } from '@/components/PhotoGrid';
import { fakeApi } from '@/lib/fakeApi';
import { Filter, Upload, Heart } from 'lucide-react';

interface GalleryPhoto {
  id: string;
  photoId: string;
  photo?: {
    id: string;
    url: string;
    filename: string;
  };
  confirmedAt: Date;
}

type FilterType = 'all' | 'confirmed' | 'favorites';

export default function GalleryPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadGallery = async () => {
      try {
        const user = await fakeApi.getCurrentUser();
        if (!user) {
          router.push('/login');
          return;
        }

        const galleryPhotos = await fakeApi.getMyGallery(user.id);
        setPhotos(galleryPhotos);
      } catch (error) {
        console.error('Failed to load gallery:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGallery();
  }, [router]);

  const filteredPhotos = photos.filter(photo => {
    switch (filter) {
      case 'confirmed':
        return true; // All photos in gallery are confirmed
      case 'favorites':
        return favorites.has(photo.id);
      case 'all':
      default:
        return true;
    }
  });

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">My Gallery</h1>
            <p className="text-slate-600">
              Your confirmed photos from events
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button onClick={() => router.push('/upload')}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Photos
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-8">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'all' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All ({photos.length})
            </Button>
            <Button
              variant={filter === 'confirmed' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('confirmed')}
            >
              Confirmed ({photos.length})
            </Button>
            <Button
              variant={filter === 'favorites' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('favorites')}
            >
              <Heart className="h-4 w-4 mr-1" />
              Favorites ({favorites.size})
            </Button>
          </div>
        </Card>

        {/* Gallery */}
        <PhotoGrid 
          photos={filteredPhotos.map(photo => ({
            id: photo.id,
            url: photo.photo?.url || '/placeholder.jpg',
            filename: photo.photo?.filename || 'Unknown',
            confirmedAt: photo.confirmedAt,
          }))}
        />

        {/* Empty State */}
        {filteredPhotos.length === 0 && (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {filter === 'favorites' ? 'No favorites yet' : 'No photos yet'}
            </h3>
            <p className="text-slate-600 mb-6">
              {filter === 'favorites' 
                ? 'Start favoriting photos to see them here.'
                : 'You haven\'t confirmed any photos yet. Upload event photos to get started.'
              }
            </p>
            {filter !== 'favorites' && (
              <Button onClick={() => router.push('/upload')}>
                Upload Event Photos
              </Button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

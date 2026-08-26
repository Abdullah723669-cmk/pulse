import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaItem } from '../../types';

interface MediaLightboxProps {
  media: MediaItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export const MediaLightbox: React.FC<MediaLightboxProps> = ({
  media,
  currentIndex,
  onClose,
  onNavigate,
}) => {
  const currentItem = media[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === 'ArrowRight' && currentIndex < media.length - 1) onNavigate(currentIndex + 1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, media.length, onClose, onNavigate]);

  if (!currentItem) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Prev button */}
      {currentIndex > 0 && (
        <button
          onClick={() => onNavigate(currentIndex - 1)}
          className="absolute left-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Next button */}
      {currentIndex < media.length - 1 && (
        <button
          onClick={() => onNavigate(currentIndex + 1)}
          className="absolute right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Content */}
      <div className="max-w-5xl max-h-[85vh] flex items-center justify-center">
        {currentItem.type === 'video' ? (
          <video
            src={currentItem.url}
            controls
            autoPlay
            className="max-h-[80vh] max-w-full rounded-xl shadow-2xl"
          />
        ) : (
          <img
            src={currentItem.url}
            alt="Enlarged media"
            className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl"
          />
        )}
      </div>

      {/* Counter */}
      {media.length > 1 && (
        <div className="absolute bottom-6 px-4 py-1.5 rounded-full bg-white/10 text-white text-xs font-medium">
          {currentIndex + 1} / {media.length}
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import { MediaItem } from '../../types';
import { getMediaUrl } from '../../utils/media';

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
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [currentIndex, currentItem?.url]);

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

  const resolvedUrl = getMediaUrl(currentItem.url);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Top action bar */}
      <div className="absolute top-5 right-5 flex items-center gap-3 z-20">
        <a
          href={resolvedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all shadow-lg backdrop-blur-sm"
          title="Open original media in new tab"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="w-5 h-5" />
        </a>
        <a
          href={resolvedUrl}
          download
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all shadow-lg backdrop-blur-sm"
          title="Download"
          onClick={(e) => e.stopPropagation()}
        >
          <Download className="w-5 h-5" />
        </a>
        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-white/10 hover:bg-rose-600 text-white transition-all shadow-lg backdrop-blur-sm"
          title="Close (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Prev button */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(currentIndex - 1);
          }}
          className="absolute left-4 sm:left-8 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-20 shadow-xl backdrop-blur-sm"
          title="Previous (Left Arrow)"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Next button */}
      {currentIndex < media.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(currentIndex + 1);
          }}
          className="absolute right-4 sm:right-8 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all z-20 shadow-xl backdrop-blur-sm"
          title="Next (Right Arrow)"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Content Container */}
      <div className="relative max-w-6xl max-h-[85vh] w-full flex items-center justify-center p-2">
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center text-brand-400">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        )}

        {hasError ? (
          <div className="flex flex-col items-center justify-center p-8 bg-slate-900/90 border border-slate-800 rounded-2xl text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-rose-400 mb-3" />
            <h4 className="text-base font-bold text-slate-100 mb-1">Unable to Load Media</h4>
            <p className="text-xs text-slate-400 mb-4">
              The media file could not be displayed or the source URL is unreachable.
            </p>
            <a
              href={resolvedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold"
            >
              Open Direct Link
            </a>
          </div>
        ) : currentItem.type === 'video' ? (
          <video
            src={resolvedUrl}
            controls
            autoPlay
            playsInline
            onLoadedData={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
            className="max-h-[80vh] max-w-full rounded-2xl shadow-2xl bg-black"
          />
        ) : (
          <img
            src={resolvedUrl}
            alt="Enlarged view"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
            className={`max-h-[82vh] max-w-full object-contain rounded-2xl shadow-2xl transition-opacity duration-300 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
          />
        )}
      </div>

      {/* Counter */}
      {media.length > 1 && (
        <div className="absolute bottom-6 px-4 py-1.5 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-md border border-white/10 shadow-lg">
          {currentIndex + 1} / {media.length}
        </div>
      )}
    </div>
  );
};

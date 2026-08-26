import React, { useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, poster, className = '' }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // default muted for autoplay friendly
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(false);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const total = videoRef.current.duration;
    if (total > 0) {
      setProgress((current / total) * 100);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newProgress = (clickX / width) * videoRef.current.duration;
    videoRef.current.currentTime = newProgress;
  };

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <div
      className={`relative group rounded-2xl overflow-hidden bg-black/90 cursor-pointer shadow-lg border border-slate-800 ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted={isMuted}
        playsInline
        loop
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="w-full max-h-[480px] object-contain mx-auto"
      />

      {/* Play/Pause Center Indicator */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] transition-all">
          <div className="w-16 h-16 rounded-full bg-brand-600/90 text-white flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
            <Play className="w-8 h-8 fill-current ml-1" />
          </div>
        </div>
      )}

      {/* Overlay Video Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-200 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bar */}
        <div
          className="w-full h-1.5 bg-white/20 rounded-full mb-3 cursor-pointer overflow-hidden relative"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button
              onClick={toggleMute}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide bg-brand-500/30 text-brand-300 border border-brand-500/40">
              HD VIDEO
            </span>
          </div>

          <button
            onClick={handleFullscreen}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

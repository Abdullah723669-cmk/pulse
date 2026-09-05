import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Play, Pause, Loader2, Mic } from 'lucide-react';

interface VoiceMessagePlayerProps {
  src: string;
  isOwn?: boolean;
}

// Generate a deterministic voice-like waveform pattern based on the audio URL
const generateWaveformBars = (seedString: string, barCount = 28): number[] => {
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0;
  }
  const bars: number[] = [];
  // Authentic voice contour: lower at ends, dynamic speech peaks in middle
  for (let i = 0; i < barCount; i++) {
    const pseudoRand = Math.abs(Math.sin(hash + i * 1.618));
    const envelope = Math.sin((i / (barCount - 1)) * Math.PI); // arch envelope
    // Height between 25% and 100%
    const height = Math.floor(25 + (pseudoRand * 0.55 + envelope * 0.45) * 75);
    bars.push(Math.min(100, Math.max(25, height)));
  }
  return bars;
};

const formatSeconds = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({
  src,
  isOwn = false,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playerIdRef = useRef<string>(`voice_${Math.random().toString(36).substring(2, 9)}`);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Generate waveform bars for visualizer
  const bars = useMemo(() => generateWaveformBars(src, 28), [src]);

  // Handle single-playback synchronization across voice notes
  useEffect(() => {
    const handleGlobalStop = (e: CustomEvent<{ activeId: string }>) => {
      if (e.detail.activeId !== playerIdRef.current && audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };

    window.addEventListener('pulse:voice-play', handleGlobalStop as EventListener);
    return () => {
      window.removeEventListener('pulse:voice-play', handleGlobalStop as EventListener);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // Notify other voice players to pause
      window.dispatchEvent(
        new CustomEvent('pulse:voice-play', {
          detail: { activeId: playerIdRef.current },
        })
      );

      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.error('Audio playback failed:', err);
        setIsPlaying(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const dur = audioRef.current.duration;
      if (!isNaN(dur) && isFinite(dur)) {
        setDuration(dur);
      }
      setIsLoading(false);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleSeek = (index: number) => {
    if (!audioRef.current || duration === 0) return;
    const targetFraction = (index + 0.5) / bars.length;
    const targetTime = targetFraction * duration;
    audioRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const cyclePlaybackRate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextRate = playbackRate === 1.0 ? 1.5 : playbackRate === 1.5 ? 2.0 : 1.0;
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const progressFraction = duration > 0 ? currentTime / duration : 0;

  return (
    <div className="w-full min-w-[200px] sm:min-w-[260px] max-w-[340px] select-none py-1">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        onCanPlay={() => setIsLoading(false)}
      />

      {/* Voice Player Body */}
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          disabled={hasError}
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all shadow-md active:scale-95 ${
            isOwn
              ? 'bg-white text-brand-600 hover:bg-brand-50 hover:shadow-lg'
              : 'bg-gradient-to-tr from-brand-600 to-cyan-500 text-white hover:from-brand-500 hover:to-cyan-400'
          }`}
          title={isPlaying ? 'Pause' : 'Play voice message'}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current translate-x-0.5" />
          )}
        </button>

        {/* Waveform & Scrubber */}
        <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
          {/* Waveform Bar Track */}
          <div
            className="flex items-center gap-[3px] h-7 cursor-pointer group py-1"
            title="Click bar to seek"
          >
            {bars.map((height, i) => {
              const barFraction = (i + 0.5) / bars.length;
              const isPlayed = progressFraction >= barFraction;

              return (
                <div
                  key={i}
                  onClick={() => handleSeek(i)}
                  className="flex-1 h-full flex items-center justify-center"
                >
                  <div
                    style={{ height: `${height}%` }}
                    className={`w-full rounded-full transition-all duration-100 ${
                      isOwn
                        ? isPlayed
                          ? 'bg-white shadow-sm'
                          : 'bg-white/35 group-hover:bg-white/50'
                        : isPlayed
                        ? 'bg-brand-400 shadow-sm'
                        : 'bg-slate-600 group-hover:bg-slate-500'
                    }`}
                  />
                </div>
              );
            })}
          </div>

          {/* Time & Speed Controls */}
          <div
            className={`flex items-center justify-between text-[11px] font-mono leading-none ${
              isOwn ? 'text-brand-100' : 'text-slate-400'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Mic className="w-3 h-3 opacity-70" />
              <span>{isPlaying ? formatSeconds(currentTime) : formatSeconds(duration)}</span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Playback speed toggle */}
              <button
                type="button"
                onClick={cyclePlaybackRate}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-tight transition-colors ${
                  isOwn
                    ? 'bg-white/20 hover:bg-white/30 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
                title="Change playback speed"
              >
                {playbackRate}x
              </button>
            </div>
          </div>
        </div>
      </div>

      {hasError && (
        <p className="text-[10px] text-rose-300 mt-1">
          Unable to play voice message.
        </p>
      )}
    </div>
  );
};

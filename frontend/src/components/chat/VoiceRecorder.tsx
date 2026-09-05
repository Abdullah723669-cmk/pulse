import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic,
  Square,
  Trash2,
  Send,
  Play,
  Pause,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface VoiceRecorderProps {
  onSendVoice: (blob: Blob, mimeType: string) => Promise<void>;
  onCancel: () => void;
  isUploading?: boolean;
}

const formatTimer = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onSendVoice,
  onCancel,
  isUploading = false,
}) => {
  const [recordingState, setRecordingState] = useState<'recording' | 'preview' | 'error'>('recording');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>(new Array(16).fill(15));

  // Preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [previewMimeType, setPreviewMimeType] = useState<string>('audio/webm');
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const [previewDuration, setPreviewDuration] = useState(0);

  // Refs
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Stop tracks and release microphone
  const cleanupMediaStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (err) {
        // ignore
      }
      audioContextRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupMediaStream();
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [cleanupMediaStream, previewUrl]);

  // Start recording when component mounts
  useEffect(() => {
    let isCancelled = false;

    const startRecording = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Your browser does not support audio recording.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        mediaStreamRef.current = stream;

        // Choose best supported mime type
        let selectedMime = 'audio/webm';
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          selectedMime = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          selectedMime = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          selectedMime = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          selectedMime = 'audio/ogg';
        }

        setPreviewMimeType(selectedMime);

        const recorder = new MediaRecorder(stream, {
          mimeType: selectedMime,
        });

        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.start(100); // 100ms slices
        mediaRecorderRef.current = recorder;

        // Timer
        setRecordingSeconds(0);
        timerIntervalRef.current = setInterval(() => {
          setRecordingSeconds((prev) => {
            if (prev >= 300) {
              // 5 minutes max limit
              handleStopToPreview();
              return 300;
            }
            return prev + 1;
          });
        }, 1000);

        // Real-time Audio Visualizer
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            analyser.smoothingTimeConstant = 0.7;
            source.connect(analyser);

            audioContextRef.current = ctx;
            analyserRef.current = analyser;

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const updateWaveform = () => {
              if (!analyserRef.current) return;
              analyserRef.current.getByteFrequencyData(dataArray);

              // Downsample to 16 bars
              const bars: number[] = [];
              const step = Math.max(1, Math.floor(bufferLength / 16));
              for (let i = 0; i < 16; i++) {
                const val = dataArray[i * step] || 0;
                // Normalize 0-255 to percentage 15% - 100%
                const pct = Math.floor(15 + (val / 255) * 85);
                bars.push(pct);
              }
              setAudioLevels(bars);
              animFrameRef.current = requestAnimationFrame(updateWaveform);
            };

            animFrameRef.current = requestAnimationFrame(updateWaveform);
          }
        } catch (visErr) {
          console.warn('Audio visualizer init error:', visErr);
        }
      } catch (err: any) {
        console.error('Failed to access microphone:', err);
        setErrorMessage(
          err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
            ? 'Microphone access was denied. Please allow microphone permissions in your browser.'
            : err.message || 'Could not access microphone.'
        );
        setRecordingState('error');
      }
    };

    startRecording();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleStopToPreview = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;

    recorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, { type: previewMimeType });
      const url = URL.createObjectURL(blob);
      setPreviewBlob(blob);
      setPreviewUrl(url);
      setRecordingState('preview');
      cleanupMediaStream();
    };

    recorder.stop();
  };

  const handleDirectSend = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    if (recorder.state !== 'inactive') {
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: previewMimeType });
        cleanupMediaStream();
        await onSendVoice(blob, previewMimeType);
      };
      recorder.stop();
    } else if (previewBlob) {
      onSendVoice(previewBlob, previewMimeType);
    }
  };

  const handleDiscard = () => {
    cleanupMediaStream();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    onCancel();
  };

  const togglePreviewPlay = () => {
    const audio = previewAudioRef.current;
    if (!audio) return;
    if (isPlayingPreview) {
      audio.pause();
      setIsPlayingPreview(false);
    } else {
      audio.play();
      setIsPlayingPreview(true);
    }
  };

  return (
    <div className="w-full bg-slate-900/95 border-t border-brand-500/30 p-3 backdrop-blur-md transition-all animate-in fade-in duration-200">
      {/* Error state */}
      {recordingState === 'error' ? (
        <div className="flex items-center justify-between gap-3 text-rose-300 text-xs py-1">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <p>{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      ) : recordingState === 'recording' ? (
        /* Active Recording View */
        <div className="flex items-center justify-between gap-3">
          {/* Discard recording */}
          <button
            type="button"
            onClick={handleDiscard}
            disabled={isUploading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-800/60 transition-all flex items-center justify-center flex-shrink-0"
            title="Cancel & Discard voice note"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Recording pulse & live visualizer */}
          <div className="flex-1 flex items-center gap-3 bg-slate-800/80 px-3.5 py-2 rounded-2xl border border-slate-700/80 min-w-0">
            {/* Blinking red beacon */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
              </span>
              <Mic className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-xs font-mono font-bold text-rose-400 tabular-nums">
                {formatTimer(recordingSeconds)}
              </span>
            </div>

            {/* Real-time speech equalizer bars */}
            <div className="flex-1 flex items-center justify-center gap-[3px] h-6 px-1">
              {audioLevels.map((lvl, idx) => (
                <div
                  key={idx}
                  style={{ height: `${lvl}%` }}
                  className="flex-1 bg-gradient-to-t from-brand-500 to-cyan-400 rounded-full transition-all duration-75 min-h-[4px]"
                />
              ))}
            </div>

            <span className="text-[11px] text-slate-400 hidden sm:inline flex-shrink-0">
              Recording voice note...
            </span>
          </div>

          {/* Action buttons: Stop & Review OR Direct Send */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Stop & Review */}
            <button
              type="button"
              onClick={handleStopToPreview}
              disabled={isUploading}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Stop & Review"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>

            {/* Instant Send */}
            <button
              type="button"
              onClick={handleDirectSend}
              disabled={isUploading}
              className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/30 transition-all active:scale-95 flex items-center justify-center"
              title="Send Voice Note"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      ) : (
        /* Preview View (Listen before sending) */
        <div className="flex items-center justify-between gap-3">
          {previewUrl && (
            <audio
              ref={previewAudioRef}
              src={previewUrl}
              onTimeUpdate={() => {
                if (previewAudioRef.current) {
                  setPreviewCurrentTime(previewAudioRef.current.currentTime);
                }
              }}
              onLoadedMetadata={() => {
                if (previewAudioRef.current) {
                  setPreviewDuration(previewAudioRef.current.duration);
                }
              }}
              onEnded={() => {
                setIsPlayingPreview(false);
                setPreviewCurrentTime(0);
              }}
            />
          )}

          {/* Discard preview */}
          <button
            type="button"
            onClick={handleDiscard}
            disabled={isUploading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-800/60 transition-all flex items-center justify-center flex-shrink-0"
            title="Discard recording"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Playback bar */}
          <div className="flex-1 flex items-center gap-3 bg-slate-800/80 px-3.5 py-2 rounded-2xl border border-slate-700/80 min-w-0">
            <button
              type="button"
              onClick={togglePreviewPlay}
              className="w-7 h-7 rounded-full bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 flex items-center justify-center flex-shrink-0 transition-colors"
            >
              {isPlayingPreview ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
              )}
            </button>

            {/* Scrubber progress */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${
                      previewDuration > 0
                        ? (previewCurrentTime / previewDuration) * 100
                        : 0
                    }%`,
                  }}
                  className="bg-brand-400 h-full rounded-full transition-all duration-100"
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1">
                <span>
                  {formatTimer(Math.floor(isPlayingPreview ? previewCurrentTime : previewDuration))}
                </span>
                <span className="text-emerald-400 font-medium">Voice note ready</span>
              </div>
            </div>
          </div>

          {/* Confirm & Send Button */}
          <button
            type="button"
            onClick={handleDirectSend}
            disabled={isUploading}
            className="p-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold text-xs shadow-lg shadow-brand-600/30 transition-all active:scale-95 flex items-center gap-1.5 flex-shrink-0"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Send</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

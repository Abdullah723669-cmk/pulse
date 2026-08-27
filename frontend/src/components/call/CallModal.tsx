import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Monitor,
  Maximize2,
  Minimize2,
  ShieldCheck,
  AlertCircle,
  Volume2,
} from 'lucide-react';
import { useCall } from '../../context/CallContext';
import { useAuth } from '../../context/AuthContext';

export const CallModal: React.FC = () => {
  const { user } = useAuth();
  const {
    callState,
    callType,
    callerUser,
    recipientUser,
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    isScreenSharing,
    callDuration,
    errorMessage,
    endCall,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const otherUser = callerUser?.id === user?.id ? recipientUser : callerUser;

  // Attach local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoOff]);

  // Attach remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (callState === 'idle') return null;

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 animate-fade-in select-none"
    >
      {/* Hidden audio element for remote audio stream playback */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Top Bar Header */}
      <div className="flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
            {callType === 'video' ? <Video className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm sm:text-base flex items-center gap-2">
              <span>{otherUser?.name || 'Pulse User'}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                @{otherUser?.username}
              </span>
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>End-to-End P2P WebRTC Encrypted</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {callState === 'connected' && (
            <div className="px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-brand-400 text-xs font-mono font-bold tracking-wider animate-pulse">
              {formatDuration(callDuration)}
            </div>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-800"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Call View Area */}
      <div className="flex-1 my-4 relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shadow-2xl">
        {/* Error Notification Banner */}
        {errorMessage && (
          <div className="absolute top-6 z-30 px-5 py-3 rounded-2xl bg-rose-950/90 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2.5 shadow-2xl animate-slide-up">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Video Mode */}
        {callType === 'video' ? (
          <div className="w-full h-full relative flex items-center justify-center">
            {/* Remote Video Stream (Main) */}
            {remoteStream && callState === 'connected' ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="relative">
                  <img
                    src={
                      otherUser?.avatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser?.username}`
                    }
                    alt={otherUser?.name}
                    className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover border-4 border-brand-500/40 ring-8 ring-brand-500/10 shadow-2xl animate-pulse"
                  />
                  <div className="absolute -bottom-2 -right-2 p-2 rounded-full bg-brand-600 text-white shadow-lg">
                    <Video className="w-4 h-4" />
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-slate-100">{otherUser?.name}</h4>
                  <p className="text-xs text-brand-400 font-medium mt-1">
                    {callState === 'calling' ? 'Ringing and connecting...' : 'Waiting for video stream...'}
                  </p>
                </div>
              </div>
            )}

            {/* Local Video Stream (Picture-in-Picture) */}
            <div className="absolute bottom-4 right-4 w-32 h-44 sm:w-44 sm:h-60 rounded-2xl overflow-hidden bg-black/80 border-2 border-brand-500/50 shadow-2xl z-20 group">
              {isVideoOff ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-500 text-xs">
                  <VideoOff className="w-6 h-6 mb-1 text-slate-600" />
                  <span>Camera Off</span>
                </div>
              ) : (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
              )}
              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-semibold text-white">
                You {isScreenSharing ? '(Screen)' : ''}
              </span>
            </div>
          </div>
        ) : (
          /* Audio Mode */
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-6">
            <div className="relative">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-tr from-brand-600/30 to-indigo-600/30 flex items-center justify-center p-1.5 animate-pulse">
                <img
                  src={
                    otherUser?.avatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser?.username}`
                  }
                  alt={otherUser?.name}
                  className="w-full h-full rounded-full object-cover border-4 border-slate-700 shadow-2xl"
                />
              </div>

              {callState === 'connected' && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold border border-emerald-500/40">
                  Audio Active
                </div>
              )}
            </div>

            <div>
              <h4 className="text-xl font-bold text-slate-100">{otherUser?.name}</h4>
              <p className="text-xs text-brand-400 font-medium mt-1.5">
                {callState === 'calling'
                  ? 'Calling...'
                  : callState === 'connected'
                  ? 'In Audio Call'
                  : 'Connecting...'}
              </p>
            </div>

            {/* Audio Wave Visualizer Simulation */}
            {callState === 'connected' && (
              <div className="flex items-center gap-1.5 h-8">
                {[40, 75, 55, 90, 60, 80, 45, 70, 85, 50, 65, 95, 40].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-brand-500/80 rounded-full animate-pulse"
                    style={{
                      height: `${h}%`,
                      animationDelay: `${(i % 5) * 0.15}s`,
                      animationDuration: '0.8s',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 z-20 py-2">
        {/* Mute Microphone */}
        <button
          onClick={toggleMute}
          className={`p-4 rounded-2xl transition-all shadow-xl ${
            isMuted
              ? 'bg-rose-600 text-white hover:bg-rose-500'
              : 'bg-slate-800/90 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700'
          }`}
          title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Video Toggle (If Video Call) */}
        {callType === 'video' && (
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-2xl transition-all shadow-xl ${
              isVideoOff
                ? 'bg-rose-600 text-white hover:bg-rose-500'
                : 'bg-slate-800/90 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700'
            }`}
            title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
        )}

        {/* Screen Share (If Video Call) */}
        {callType === 'video' && (
          <button
            onClick={toggleScreenShare}
            className={`p-4 rounded-2xl transition-all shadow-xl ${
              isScreenSharing
                ? 'bg-brand-600 text-white hover:bg-brand-500'
                : 'bg-slate-800/90 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700'
            }`}
            title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
          >
            <Monitor className="w-5 h-5" />
          </button>
        )}

        {/* End Call Button */}
        <button
          onClick={endCall}
          className="p-4 px-8 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-600/40 transition-all transform active:scale-95 flex items-center gap-2"
          title="End Call"
        >
          <PhoneOff className="w-5 h-5" />
          <span className="hidden sm:inline">End Call</span>
        </button>
      </div>
    </div>
  );
};

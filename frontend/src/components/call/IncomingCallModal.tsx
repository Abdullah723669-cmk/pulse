import React from 'react';
import { Phone, PhoneOff, Video, Volume2, ShieldCheck } from 'lucide-react';
import { useCall } from '../../context/CallContext';

export const IncomingCallModal: React.FC = () => {
  const { incomingCall, answerCall, rejectCall } = useCall();

  if (!incomingCall) return null;

  const { fromUser, callType } = incomingCall;

  return (
    <div className="fixed top-6 right-6 z-50 max-w-sm w-full glass-panel rounded-3xl p-5 border-2 border-brand-500/50 shadow-2xl shadow-brand-600/30 animate-bounce-short">
      <div className="flex items-center gap-4">
        {/* Caller Avatar with Pulse Halo */}
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-brand-500/30 flex items-center justify-center p-0.5 animate-pulse">
            <img
              src={
                fromUser.avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${fromUser.username}`
              }
              alt={fromUser.name}
              className="w-full h-full rounded-full object-cover border-2 border-brand-400"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-brand-600 text-white shadow-md">
            {callType === 'video' ? <Video className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-slate-100 text-sm truncate">{fromUser.name}</h4>
          <p className="text-xs text-brand-400 font-medium capitalize flex items-center gap-1 mt-0.5">
            <span>Incoming {callType} Call</span>
          </p>
          <div className="flex items-center gap-1 text-[10px] text-emerald-400 mt-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Follower Verified</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-800">
        {/* Decline */}
        <button
          onClick={rejectCall}
          className="flex-1 py-2.5 px-3 rounded-xl bg-rose-950/80 hover:bg-rose-900/90 text-rose-300 hover:text-white border border-rose-800/80 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
        >
          <PhoneOff className="w-4 h-4" />
          <span>Decline</span>
        </button>

        {/* Accept */}
        <button
          onClick={answerCall}
          className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-95 animate-pulse"
        >
          {callType === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
          <span>Accept</span>
        </button>
      </div>
    </div>
  );
};

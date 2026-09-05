import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Zap, Search, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

export const MobileHeader: React.FC = () => {
  const { user } = useAuth();
  const { activeConversation } = useChat();
  const location = useLocation();

  // Hide mobile header when an active chat conversation is open on mobile
  const isChatOpenOnMobile = location.pathname.startsWith('/chat') && activeConversation !== null;
  if (isChatOpenOnMobile) {
    return null;
  }

  return (
    <header className="md:hidden sticky top-0 z-30 w-full bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between">
      {/* Brand Logo & Name */}
      <Link to="/" className="flex items-center gap-2.5 group">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-md shadow-brand-500/25">
          <Zap className="w-4 h-4 text-white fill-white" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-base font-black tracking-tight text-white">
            PULSE
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
        </div>
      </Link>

      {/* Right Quick Actions */}
      <div className="flex items-center gap-2">
        <Link
          to="/explore"
          className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors"
          title="Search & Explore"
        >
          <Search className="w-4 h-4" />
        </Link>

        {user ? (
          <Link
            to={`/profile/${user.username}`}
            className="flex items-center p-0.5 rounded-full border border-slate-700 hover:border-brand-500 transition-colors"
          >
            <img
              src={
                user.avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
              }
              alt={user.name}
              className="w-7 h-7 rounded-full object-cover"
            />
          </Link>
        ) : (
          <Link
            to="/login"
            className="px-3 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
};

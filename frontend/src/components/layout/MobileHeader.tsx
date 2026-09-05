import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Zap, Search, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

export const MobileHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const { activeConversation } = useChat();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Hide mobile header when an active chat conversation is open on mobile
  const isChatOpenOnMobile = location.pathname.startsWith('/chat') && activeConversation !== null;
  if (isChatOpenOnMobile) {
    return null;
  }

  return (
    <header className="md:hidden sticky top-0 z-30 w-full bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 px-3.5 py-2.5 flex items-center justify-between">
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
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Link
          to="/explore"
          className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors"
          title="Search & Explore"
        >
          <Search className="w-4 h-4" />
        </Link>

        {user ? (
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              to={`/profile/${user.username}`}
              className="flex items-center p-0.5 rounded-full border border-slate-700 hover:border-brand-500 transition-colors"
              title={`Profile: ${user.name}`}
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

            {/* Mobile Sign Out Button */}
            <button
              onClick={handleLogout}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-brand-600/25 active:scale-95 transition-all"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
};

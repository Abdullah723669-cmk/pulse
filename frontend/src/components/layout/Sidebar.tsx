import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Home,
  Compass,
  MessageSquare,
  Bell,
  User as UserIcon,
  LogOut,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { totalUnreadCount } = useChat();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Feed', icon: Home },
    { to: '/explore', label: 'Explore', icon: Compass },
    {
      to: '/chat',
      label: 'Messages',
      icon: MessageSquare,
      badge: totalUnreadCount > 0 ? totalUnreadCount : null,
    },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    ...(user
      ? [{ to: `/profile/${user.username}`, label: 'Profile', icon: UserIcon }]
      : []),
  ];

  return (
    <aside className="w-20 md:w-64 h-screen sticky top-0 flex flex-col justify-between p-3 md:p-5 border-r border-slate-800/80 bg-slate-950/80 backdrop-blur-xl z-30">
      {/* Brand Logo */}
      <div>
        <Link to="/" className="flex items-center gap-3 px-3 py-2.5 mb-6 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <div className="hidden md:block">
            <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              PULSE
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            </span>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider block -mt-1">
              SOCIAL & CHAT
            </span>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-center md:justify-between px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30 font-bold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                  }`
                }
              >
                <div className="flex items-center gap-3.5">
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="hidden md:inline">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="hidden md:flex px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-500 text-white shadow-sm">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Card / Sign In Button */}
      <div className="pt-4 border-t border-slate-800/80">
        {user ? (
          <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-900/60 border border-slate-800">
            <Link
              to={`/profile/${user.username}`}
              className="flex items-center gap-2.5 min-w-0 flex-1 group"
            >
              <img
                src={
                  user.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
                }
                alt={user.name}
                className="w-9 h-9 rounded-full object-cover border border-slate-700 group-hover:border-brand-400 transition-colors"
              />
              <div className="hidden md:block truncate">
                <p className="text-xs font-bold text-slate-200 group-hover:text-brand-300 truncate">
                  {user.name}
                </p>
                <p className="text-[11px] text-slate-500 truncate">@{user.username}</p>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Link
              to="/login"
              className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden md:inline">Sign In</span>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
};

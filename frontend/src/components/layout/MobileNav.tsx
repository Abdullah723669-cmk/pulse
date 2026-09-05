import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Compass, MessageSquare, Bell, User as UserIcon, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

export const MobileNav: React.FC = () => {
  const { user } = useAuth();
  const { totalUnreadCount, activeConversation } = useChat();
  const location = useLocation();

  // Hide mobile bottom nav when inside an active chat thread to maximize conversation screen space
  const isChatThreadOpen = location.pathname.startsWith('/chat') && activeConversation !== null;
  if (isChatThreadOpen) {
    return null;
  }

  const navItems = [
    { to: '/', label: 'Feed', icon: Home },
    { to: '/explore', label: 'Explore', icon: Compass },
    {
      to: '/chat',
      label: 'Messages',
      icon: MessageSquare,
      badge: totalUnreadCount > 0 ? totalUnreadCount : null,
    },
    { to: '/notifications', label: 'Alerts', icon: Bell },
    {
      to: user ? `/profile/${user.username}` : '/login',
      label: user ? 'Profile' : 'Sign In',
      icon: user ? UserIcon : LogIn,
      isAvatar: Boolean(user?.avatar),
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around select-none">
      {navItems.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all relative ${
                isActive
                  ? 'text-brand-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  {item.isAvatar && user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt="Profile"
                      className={`w-5 h-5 rounded-full object-cover border ${
                        isActive ? 'border-brand-400 ring-2 ring-brand-400/20' : 'border-slate-600'
                      }`}
                    />
                  ) : (
                    <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                  )}

                  {/* Badge */}
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-md leading-tight">
                      {item.badge}
                    </span>
                  )}
                </div>

                <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                  {item.label}
                </span>

                {/* Active bottom indicator line */}
                {isActive && (
                  <span className="absolute bottom-0 w-4 h-0.5 rounded-full bg-brand-400 shadow-sm shadow-brand-400" />
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};

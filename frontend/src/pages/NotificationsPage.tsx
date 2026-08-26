import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Heart, MessageCircle, UserPlus, CheckCheck, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { NotificationItem } from '../types';
import { notificationApi } from '../api/notification.api';
import { useAuth } from '../context/AuthContext';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const data = await notificationApi.getNotifications();
        setNotifications(data.notifications);
        if (data.unreadCount > 0) {
          await notificationApi.markAsRead();
        }
      } catch (err) {
        console.error('Failed to load notifications:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [user?.id]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'FOLLOW':
        return <UserPlus className="w-4 h-4 text-brand-400" />;
      case 'LIKE':
        return <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />;
      case 'COMMENT':
        return <MessageCircle className="w-4 h-4 text-cyan-400" />;
      default:
        return <Bell className="w-4 h-4 text-amber-400" />;
    }
  };

  const getText = (item: NotificationItem) => {
    switch (item.type) {
      case 'FOLLOW':
        return 'started following you.';
      case 'LIKE':
        return 'liked your post.';
      case 'COMMENT':
        return 'commented on your post.';
      case 'MESSAGE':
        return 'sent you a new message.';
      default:
        return 'interacted with your profile.';
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-8 text-center py-32">
        <h2 className="text-base font-bold text-slate-200">Please Sign In</h2>
        <p className="text-xs text-slate-400 mt-1">Sign in to view your activity and alerts.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-20">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
        <h1 className="text-lg font-black text-slate-100 flex items-center gap-2">
          <Bell className="w-5 h-5 text-brand-400" />
          <span>Notifications</span>
        </h1>
        <button
          onClick={() => notificationApi.markAsRead()}
          className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
        >
          <CheckCheck className="w-4 h-4" />
          <span>Mark all as read</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center text-xs text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500 mr-2" />
          Loading activity...
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-3xl p-8 border border-slate-800">
          <Bell className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-300">No notifications yet</p>
          <p className="text-[11px] text-slate-500 mt-1">
            When people follow you or interact with your posts, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border flex items-center gap-3.5 transition-all ${
                item.isRead
                  ? 'bg-slate-900/40 border-slate-800/60'
                  : 'bg-brand-600/10 border-brand-500/30 shadow-md'
              }`}
            >
              <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/60 flex-shrink-0">
                {getIcon(item.type)}
              </div>

              <Link to={`/profile/${item.actor.username}`} className="flex-shrink-0">
                <img
                  src={
                    item.actor.avatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.actor.username}`
                  }
                  alt={item.actor.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-700"
                />
              </Link>

              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-200">
                  <Link
                    to={`/profile/${item.actor.username}`}
                    className="font-bold text-slate-100 hover:text-brand-400"
                  >
                    {item.actor.name}
                  </Link>{' '}
                  <span className="text-slate-300">{getText(item)}</span>
                </p>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

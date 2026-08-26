import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X, CheckCircle2, UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { User } from '../../types';
import { userApi } from '../../api/user.api';
import { useAuth } from '../../context/AuthContext';

interface FollowListModalProps {
  userId: string;
  type: 'followers' | 'following';
  onClose: () => void;
}

export const FollowListModal: React.FC<FollowListModalProps> = ({
  userId,
  type,
  onClose,
}) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        if (type === 'followers') {
          const res = await userApi.getFollowers(userId);
          setUsers(res.followers);
        } else {
          const res = await userApi.getFollowing(userId);
          setUsers(res.following);
        }
      } catch (err) {
        console.error('Failed to load follow list:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [userId, type]);

  const handleToggleFollow = async (targetId: string, isCurrentlyFollowing: boolean) => {
    if (!currentUser) return;
    try {
      if (isCurrentlyFollowing) {
        await userApi.unfollowUser(targetId);
        setUsers((prev) =>
          prev.map((u) => (u.id === targetId ? { ...u, isFollowing: false } : u))
        );
      } else {
        await userApi.followUser(targetId);
        setUsers((prev) =>
          prev.map((u) => (u.id === targetId ? { ...u, isFollowing: true } : u))
        );
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-100 text-sm uppercase tracking-wider">
            {type === 'followers' ? 'Followers' : 'Following'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User list */}
        <div className="p-4 max-h-96 overflow-y-auto divide-y divide-slate-800/60">
          {isLoading ? (
            <div className="py-8 flex justify-center items-center text-xs text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin text-brand-500 mr-2" />
              Loading...
            </div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No users found.
            </div>
          ) : (
            users.map((item) => {
              const isSelf = currentUser?.id === item.id;

              return (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                  <Link
                    to={`/profile/${item.username}`}
                    onClick={onClose}
                    className="flex items-center gap-3 min-w-0 flex-1 group"
                  >
                    <img
                      src={
                        item.avatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.username}`
                      }
                      alt={item.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-700 group-hover:border-brand-500 transition-colors"
                    />
                    <div className="truncate">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-xs text-slate-200 group-hover:text-brand-400 transition-colors truncate">
                          {item.name}
                        </span>
                        {item.isVerified && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">@{item.username}</p>
                    </div>
                  </Link>

                  {!isSelf && currentUser && (
                    <button
                      onClick={() => handleToggleFollow(item.id, !!item.isFollowing)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        item.isFollowing
                          ? 'bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700'
                          : 'bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/20'
                      }`}
                    >
                      {item.isFollowing ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

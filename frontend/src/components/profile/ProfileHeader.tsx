import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Calendar,
  MapPin,
  Link as LinkIcon,
  MessageSquare,
  UserPlus,
  UserCheck,
  Edit3,
  Loader2,
  Lock,
} from 'lucide-react';
import { format } from 'date-fns';
import { User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { userApi } from '../../api/user.api';
import { EditProfileModal } from './EditProfileModal';
import { FollowListModal } from './FollowListModal';

interface ProfileHeaderProps {
  user: User;
  onProfileUpdated: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  onProfileUpdated,
}) => {
  const { user: currentUser } = useAuth();
  const { openChatWithUser } = useChat();
  const navigate = useNavigate();

  const [isFollowing, setIsFollowing] = useState(user.isFollowing || false);
  const [followersCount, setFollowersCount] = useState(user.followersCount || 0);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [followModalType, setFollowModalType] = useState<'followers' | 'following' | null>(null);

  const isSelf = currentUser?.id === user.id;

  const handleToggleFollow = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        await userApi.unfollowUser(user.id);
        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
      } else {
        await userApi.followUser(user.id);
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
      }
      onProfileUpdated();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating follow status.');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleDirectMessage = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      await openChatWithUser(user.id);
      navigate('/chat');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cannot initiate chat.');
    }
  };

  return (
    <>
      <div className="glass-panel rounded-3xl overflow-hidden mb-6 border border-slate-800 shadow-2xl">
        {/* Cover Banner */}
        <div className="h-32 sm:h-44 md:h-56 w-full relative bg-gradient-to-r from-slate-900 via-brand-950 to-indigo-950">
          {user.coverImage && (
            <img
              src={user.coverImage}
              alt="Cover Banner"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
        </div>

        {/* Profile Details Container */}
        <div className="px-4 sm:px-6 pb-5 sm:pb-6 pt-0 relative">
          {/* Avatar and Top Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-12 sm:-mt-16 md:-mt-20 mb-4 gap-3 sm:gap-4">
            <div className="relative inline-block">
              <img
                src={
                  user.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
                }
                alt={user.name}
                className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full object-cover border-4 border-slate-950 shadow-2xl bg-slate-900"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              {isSelf ? (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all border border-slate-700"
                >
                  <Edit3 className="w-4 h-4 text-brand-400" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <>
                  {/* Follow Button */}
                  <button
                    onClick={handleToggleFollow}
                    disabled={isFollowLoading}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 ${
                      isFollowing
                        ? 'bg-slate-800/90 hover:bg-rose-950/40 text-slate-200 hover:text-rose-400 border border-slate-700'
                        : 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-lg shadow-brand-600/30'
                    }`}
                  >
                    {isFollowLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>

                  {/* Direct Message Button */}
                  <button
                    onClick={handleDirectMessage}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all border border-slate-700"
                    title="Direct Message"
                  >
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                    <span className="hidden sm:inline">Message</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* User Bio & Meta info */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-100">{user.name}</h1>
                {user.isVerified && (
                  <CheckCircle2 className="w-5 h-5 text-brand-400 fill-brand-500/20" />
                )}
              </div>
              <p className="text-xs text-brand-400 font-medium mt-0.5">@{user.username}</p>
            </div>

            {user.bio && (
              <p className="text-slate-300 text-sm leading-relaxed max-w-2xl whitespace-pre-line">
                {user.bio}
              </p>
            )}

            {/* Meta Tags (Location, Website, Joined Date) */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              {user.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{user.location}</span>
                </div>
              )}
              {user.website && (
                <div className="flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-brand-400" />
                  <a
                    href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-400 hover:underline"
                  >
                    {user.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {user.createdAt && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Joined {format(new Date(user.createdAt), 'MMMM yyyy')}</span>
                </div>
              )}
            </div>

            {/* Follower Relation Notice (for non-self) */}
            {!isSelf && (
              <div className="pt-2">
                {user.isMutual ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <UserCheck className="w-3.5 h-3.5" /> You and {user.name} follow each other
                  </span>
                ) : user.isFollower ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Follows you
                  </span>
                ) : isFollowing ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                    You follow this user
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Lock className="w-3 h-3" /> Follow to unlock direct messaging
                  </span>
                )}
              </div>
            )}

            {/* Stats Row */}
            <div className="flex items-center justify-around sm:justify-start gap-3 sm:gap-8 pt-3 border-t border-slate-800/80">
              <div className="text-xs">
                <span className="font-extrabold text-slate-100 text-sm mr-1">
                  {user.postsCount || 0}
                </span>
                <span className="text-slate-400">Posts</span>
              </div>

              <button
                onClick={() => setFollowModalType('followers')}
                className="text-xs hover:text-brand-400 transition-colors"
              >
                <span className="font-extrabold text-slate-100 text-sm mr-1">
                  {followersCount}
                </span>
                <span className="text-slate-400">Followers</span>
              </button>

              <button
                onClick={() => setFollowModalType('following')}
                className="text-xs hover:text-brand-400 transition-colors"
              >
                <span className="font-extrabold text-slate-100 text-sm mr-1">
                  {user.followingCount || 0}
                </span>
                <span className="text-slate-400">Following</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onUpdated={onProfileUpdated}
        />
      )}

      {/* Followers / Following Modal */}
      {followModalType && (
        <FollowListModal
          userId={user.id}
          type={followModalType}
          onClose={() => setFollowModalType(null)}
        />
      )}
    </>
  );
};

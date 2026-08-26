import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Grid, Image, Heart, Loader2 } from 'lucide-react';
import { User, Post } from '../types';
import { userApi } from '../api/user.api';
import { postApi } from '../api/post.api';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { PostCard } from '../components/feed/PostCard';

export const ProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'media' | 'likes'>('posts');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!username) return;
    try {
      setIsLoadingProfile(true);
      setError(null);
      const res = await userApi.getProfile(username);
      setProfileUser(res.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'User not found.');
    } finally {
      setIsLoadingProfile(false);
    }
  }, [username]);

  const fetchUserPosts = useCallback(async () => {
    if (!username) return;
    try {
      setIsLoadingPosts(true);
      const res = await postApi.getUserPosts(username, activeTab);
      setPosts(res.posts);
    } catch (err) {
      console.error('Failed to load user posts:', err);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [username, activeTab]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profileUser) {
      fetchUserPosts();
    }
  }, [profileUser?.id, activeTab, fetchUserPosts]);

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  if (isLoadingProfile) {
    return (
      <div className="py-32 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        <p className="text-xs font-medium">Loading profile...</p>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center py-20">
        <h2 className="text-xl font-bold text-slate-200">User Not Found</h2>
        <p className="text-xs text-slate-400 mt-2">
          The user @{username} does not exist or may have changed their handle.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-20">
      {/* Profile Header Card */}
      <ProfileHeader
        user={profileUser}
        onProfileUpdated={fetchProfile}
      />

      {/* Profile Tabs */}
      <div className="flex border-b border-slate-800 mb-6">
        {[
          { id: 'posts', label: 'Posts', icon: Grid },
          { id: 'media', label: 'Media (Photos & Clips)', icon: Image },
          { id: 'likes', label: 'Liked', icon: Heart },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
                isActive
                  ? 'border-brand-500 text-brand-400 bg-brand-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Stream */}
      {isLoadingPosts ? (
        <div className="py-12 flex justify-center text-xs text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500 mr-2" />
          Loading content...
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-xs">
          No {activeTab} to show yet.
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={handlePostDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
};

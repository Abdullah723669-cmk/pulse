import React, { useEffect, useState } from 'react';
import { Sparkles, Users, Loader2, RefreshCw } from 'lucide-react';
import { Post } from '../types';
import { postApi } from '../api/post.api';
import { useAuth } from '../context/AuthContext';
import { CreatePostCard } from '../components/feed/CreatePostCard';
import { PostCard } from '../components/feed/PostCard';

export const FeedPage: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou');

  const fetchFeed = async (pageNum = 1, append = false) => {
    try {
      if (!append) setIsLoading(true);
      const data = await postApi.getFeed(pageNum, 15, activeTab);
      if (append) {
        setPosts((prev) => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts);
      }
      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed(1, false);
  }, [user?.id, activeTab]);

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-20">
      {/* Feed Header with Tabs */}
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mb-6 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('foryou')}
            className={`text-sm font-bold pb-1 transition-all relative ${
              activeTab === 'foryou'
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-400" />
              <span>For You</span>
            </div>
            {activeTab === 'foryou' && (
              <div className="absolute -bottom-3 left-0 right-0 h-0.5 bg-brand-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('following')}
            className={`text-sm font-bold pb-1 transition-all relative ${
              activeTab === 'following'
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-400" />
              <span>Following</span>
            </div>
            {activeTab === 'following' && (
              <div className="absolute -bottom-3 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />
            )}
          </button>
        </div>

        <button
          onClick={() => fetchFeed(1, false)}
          className="p-2 rounded-xl text-slate-400 hover:text-brand-300 hover:bg-slate-900 transition-colors"
          title="Refresh Feed"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Post Creator Box */}
      <CreatePostCard onPostCreated={handlePostCreated} />

      {/* Post Stream */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
          <p className="text-xs font-medium">Loading your timeline...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-3xl p-8 border border-slate-800">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-8 h-8 text-brand-400" />
          </div>
          <h3 className="text-base font-bold text-slate-200">No posts in your feed yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Be the first to publish a post or explore creators and follow them to customize your feed!
          </p>
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

          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={() => fetchFeed(page + 1, true)}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 transition-all"
              >
                Load More Posts
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

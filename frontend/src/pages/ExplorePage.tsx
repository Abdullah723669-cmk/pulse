import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  UserPlus,
  UserCheck,
  Loader2,
  Flame,
  X,
  Users,
  FileText,
  Sparkles,
} from 'lucide-react';
import { User, Post } from '../types';
import { userApi } from '../api/user.api';
import { postApi } from '../api/post.api';
import { useAuth } from '../context/AuthContext';
import { PostCard } from '../components/feed/PostCard';

const TRENDING_TAGS = [
  { tag: '#FullStackDev', label: 'FullStackDev', desc: 'Real-time architecture' },
  { tag: '#DesignSystems', label: 'DesignSystems', desc: 'Modern UI aesthetic' },
  { tag: '#Cinematography', label: 'Cinematography', desc: 'Drone & camera clips' },
  { tag: '#GenerativeArt', label: 'GenerativeArt', desc: 'Blender & Shaders' },
];

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(urlQuery);
  const [userResults, setUserResults] = useState<User[]>([]);
  const [postResults, setPostResults] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'creators' | 'posts'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Keep query input in sync if URL search param changes (e.g. clicking trending tag in RightBar)
  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    let isCancelled = false;

    const performSearch = async () => {
      setIsLoading(true);
      try {
        if (!query.trim()) {
          const [suggestedRes, feedRes] = await Promise.all([
            userApi.getSuggested(),
            postApi.getFeed(1, 10, 'foryou'),
          ]);
          if (!isCancelled) {
            setUserResults(suggestedRes.users);
            setPostResults(feedRes.posts);
          }
        } else {
          const [usersRes, postsRes] = await Promise.all([
            userApi.searchUsers(query),
            postApi.searchPosts(query),
          ]);
          if (!isCancelled) {
            setUserResults(usersRes.users);
            setPostResults(postsRes.posts);
          }
        }
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    const timer = setTimeout(performSearch, 250);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const handleSelectTag = (tag: string) => {
    if (query === tag) {
      setQuery('');
      setSearchParams({});
    } else {
      setQuery(tag);
      setSearchParams({ q: tag });
    }
  };

  const handleClearSearch = () => {
    setQuery('');
    setSearchParams({});
  };

  const handleToggleFollow = async (targetId: string, isFollowing: boolean) => {
    if (!user) return;
    try {
      if (isFollowing) {
        await userApi.unfollowUser(targetId);
        setUserResults((prev) =>
          prev.map((u) => (u.id === targetId ? { ...u, isFollowing: false } : u))
        );
      } else {
        await userApi.followUser(targetId);
        setUserResults((prev) =>
          prev.map((u) => (u.id === targetId ? { ...u, isFollowing: true } : u))
        );
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    }
  };

  const handleDeletePost = (postId: string) => {
    setPostResults((prev) => prev.filter((p) => p.id !== postId));
  };

  const totalResultsCount = userResults.length + postResults.length;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-24">
      {/* Search Input Header */}
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 mb-4 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchParams(e.target.value ? { q: e.target.value } : {});
            }}
            placeholder="Search creators, hashtags, communities (#FullStackDev)..."
            className="w-full bg-slate-900 text-xs text-slate-100 rounded-2xl pl-11 pr-10 py-3.5 border border-slate-800 focus:border-brand-500 outline-none transition-all shadow-inner"
          />
          {query && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Community Tag Chips */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none text-xs">
          <div className="flex items-center gap-1 text-slate-400 text-[11px] font-medium shrink-0 pr-1">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Trending:</span>
          </div>
          {TRENDING_TAGS.map((item) => {
            const isSelected = query.toLowerCase() === item.tag.toLowerCase();
            return (
              <button
                key={item.tag}
                onClick={() => handleSelectTag(item.tag)}
                className={`px-3 py-1.5 rounded-full shrink-0 font-medium text-xs transition-all border ${
                  isSelected
                    ? 'bg-brand-600 text-white border-brand-500 shadow-md shadow-brand-600/30'
                    : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 hover:text-slate-100'
                }`}
              >
                {item.tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'all'
                ? 'bg-slate-800 text-brand-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>All</span>
          </button>
          <button
            onClick={() => setActiveTab('creators')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'creators'
                ? 'bg-slate-800 text-brand-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Creators ({userResults.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'posts'
                ? 'bg-slate-800 text-brand-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Posts ({postResults.length})</span>
          </button>
        </div>

        {query && (
          <span className="text-[11px] text-slate-500 font-medium">
            {totalResultsCount} result{totalResultsCount === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="py-20 flex flex-col justify-center items-center text-xs text-slate-400 gap-2">
          <Loader2 className="w-7 h-7 animate-spin text-brand-500" />
          <span>Searching community discussions & creators...</span>
        </div>
      ) : totalResultsCount === 0 ? (
        <div className="text-center py-16 text-xs text-slate-400 glass-panel rounded-3xl p-8 border border-slate-800/80">
          <p className="text-sm font-semibold text-slate-300 mb-1">No matches found</p>
          <p className="text-slate-500">
            No creators or community posts matched &ldquo;{query}&rdquo;. Try another hashtag or keyword.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Creators Section */}
          {(activeTab === 'all' || activeTab === 'creators') && userResults.length > 0 && (
            <div>
              {activeTab === 'all' && (
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-brand-400" />
                  <span>Creators ({userResults.length})</span>
                </h3>
              )}
              <div className="space-y-3">
                {userResults.map((item) => (
                  <div
                    key={item.id}
                    className="glass-panel rounded-2xl p-4 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
                  >
                    <Link
                      to={`/profile/${item.username}`}
                      className="flex items-center gap-3.5 min-w-0 flex-1 group"
                    >
                      <img
                        src={
                          item.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.username}`
                        }
                        alt={item.name}
                        className="w-12 h-12 rounded-full object-cover border border-slate-700 group-hover:border-brand-500 transition-colors shrink-0"
                      />
                      <div className="truncate min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-100 group-hover:text-brand-400 truncate">
                            {item.name}
                          </span>
                          {item.isVerified && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-brand-400/90 font-medium">@{item.username}</p>
                        {item.bio && (
                          <p className="text-xs text-slate-400 truncate mt-0.5 max-w-md">
                            {item.bio}
                          </p>
                        )}
                      </div>
                    </Link>

                    {user && user.id !== item.id && (
                      <button
                        onClick={() => handleToggleFollow(item.id, !!item.isFollowing)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                          item.isFollowing
                            ? 'bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700'
                            : 'bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/25'
                        }`}
                      >
                        {item.isFollowing ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
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
                ))}
              </div>
            </div>
          )}

          {/* Posts / Discussions Section */}
          {(activeTab === 'all' || activeTab === 'posts') && postResults.length > 0 && (
            <div>
              {activeTab === 'all' && (
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5 pt-2">
                  <FileText className="w-3.5 h-3.5 text-brand-400" />
                  <span>Community Posts & Discussions ({postResults.length})</span>
                </h3>
              )}
              <div className="space-y-4">
                {postResults.map((post) => (
                  <PostCard key={post.id} post={post} onDelete={handleDeletePost} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

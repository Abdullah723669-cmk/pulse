import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, CheckCircle2, UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { User } from '../types';
import { userApi } from '../api/user.api';
import { useAuth } from '../context/AuthContext';

export const ExplorePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        const res = await userApi.getSuggested();
        setResults(res.users);
        return;
      }

      setIsLoading(true);
      try {
        const res = await userApi.searchUsers(query);
        setResults(res.users);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(performSearch, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleToggleFollow = async (targetId: string, isFollowing: boolean) => {
    if (!user) return;
    try {
      if (isFollowing) {
        await userApi.unfollowUser(targetId);
        setResults((prev) =>
          prev.map((u) => (u.id === targetId ? { ...u, isFollowing: false } : u))
        );
      } else {
        await userApi.followUser(targetId);
        setResults((prev) =>
          prev.map((u) => (u.id === targetId ? { ...u, isFollowing: true } : u))
        );
      }
    } catch (err) {
      console.error('Failed to toggle follow:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-20">
      {/* Search Input Header */}
      <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 mb-6 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearchParams(e.target.value ? { q: e.target.value } : {});
            }}
            placeholder="Search creators, designers, developers..."
            className="w-full bg-slate-900 text-xs text-slate-100 rounded-2xl pl-11 pr-4 py-3.5 border border-slate-800 focus:border-brand-500 outline-none"
          />
        </div>
      </div>

      <h2 className="text-sm font-bold text-slate-200 mb-4 uppercase tracking-wider">
        {query ? `Search Results for "${query}"` : 'Recommended Creators'}
      </h2>

      {isLoading ? (
        <div className="py-20 flex justify-center items-center text-xs text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500 mr-2" />
          Searching...
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-16 text-xs text-slate-500 glass-panel rounded-3xl p-8 border border-slate-800">
          No creators found matching "{query}".
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((item) => (
            <div
              key={item.id}
              className="glass-panel rounded-2xl p-4 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-all"
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
                  className="w-12 h-12 rounded-full object-cover border border-slate-700 group-hover:border-brand-500 transition-colors"
                />
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-100 group-hover:text-brand-400 truncate">
                      {item.name}
                    </span>
                    {item.isVerified && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />
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
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
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
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, CheckCircle2, UserPlus, UserCheck, Flame, Server, Database, Cloud } from 'lucide-react';
import { User } from '../../types';
import { userApi } from '../../api/user.api';
import { useAuth } from '../../context/AuthContext';

export const RightBar: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchSuggested = async () => {
      try {
        const res = await userApi.getSuggested();
        setSuggestedUsers(res.users);
      } catch (err) {
        console.error('Failed to load suggestions:', err);
      }
    };

    fetchSuggested();
  }, [user?.id]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleToggleFollow = async (targetId: string, isCurrentlyFollowing: boolean) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      if (isCurrentlyFollowing) {
        await userApi.unfollowUser(targetId);
        setSuggestedUsers((prev) =>
          prev.map((u) => (u.id === targetId ? { ...u, isFollowing: false } : u))
        );
      } else {
        await userApi.followUser(targetId);
        setSuggestedUsers((prev) =>
          prev.map((u) => (u.id === targetId ? { ...u, isFollowing: true } : u))
        );
      }
    } catch (err) {
      console.error('Failed to follow suggestion:', err);
    }
  };

  return (
    <aside className="hidden lg:block w-80 h-screen sticky top-0 p-5 space-y-5 overflow-y-auto border-l border-slate-800/80 bg-slate-950/40">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit}>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search creators & posts..."
            className="w-full bg-slate-900/90 text-xs text-slate-100 rounded-2xl pl-10 pr-4 py-3 border border-slate-800 focus:border-brand-500 outline-none placeholder-slate-500 shadow-inner"
          />
        </div>
      </form>

      {/* Suggested Users / Who to Follow */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800/80">
        <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-3">
          Who to Follow
        </h3>

        <div className="space-y-3">
          {suggestedUsers.length === 0 ? (
            <p className="text-xs text-slate-500 py-2">No new suggestions right now.</p>
          ) : (
            suggestedUsers.slice(0, 4).map((suggested) => (
              <div key={suggested.id} className="flex items-center justify-between gap-2">
                <Link
                  to={`/profile/${suggested.username}`}
                  className="flex items-center gap-2.5 min-w-0 flex-1 group"
                >
                  <img
                    src={
                      suggested.avatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${suggested.username}`
                    }
                    alt={suggested.name}
                    className="w-9 h-9 rounded-full object-cover border border-slate-700 group-hover:border-brand-500 transition-colors"
                  />
                  <div className="truncate">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-xs text-slate-200 group-hover:text-brand-400 truncate">
                        {suggested.name}
                      </span>
                      {suggested.isVerified && (
                        <CheckCircle2 className="w-3 h-3 text-brand-400" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">@{suggested.username}</p>
                  </div>
                </Link>

                <button
                  onClick={() => handleToggleFollow(suggested.id, !!suggested.isFollowing)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold flex items-center gap-1 transition-all ${
                    suggested.isFollowing
                      ? 'bg-slate-800 text-slate-400 hover:text-rose-400'
                      : 'bg-brand-600 hover:bg-brand-500 text-white'
                  }`}
                >
                  {suggested.isFollowing ? (
                    <>
                      <UserCheck className="w-3 h-3 text-emerald-400" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3 h-3" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Trending Topics */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800/80">
        <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-amber-400" />
          <span>Trending Communities</span>
        </h3>

        <div className="space-y-2.5 text-xs">
          {[
            { tag: '#FullStackDev', count: '14.2K posts', desc: 'Real-time architecture' },
            { tag: '#DesignSystems', count: '8.9K posts', desc: 'Modern UI aesthetic' },
            { tag: '#Cinematography', count: '6.4K posts', desc: 'Drone & camera clips' },
            { tag: '#GenerativeArt', count: '5.1K posts', desc: 'Blender & Shaders' },
          ].map((item) => (
            <div
              key={item.tag}
              onClick={() => navigate(`/explore?q=${encodeURIComponent(item.tag)}`)}
              className="p-2 rounded-xl hover:bg-slate-800/50 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-brand-300">{item.tag}</span>
                <span className="text-[10px] text-slate-500">{item.count}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cloud Architecture Info Badge */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-2">
        <p className="font-bold text-slate-200 text-xs">Architecture Stack</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-slate-300">
            <Cloud className="w-3.5 h-3.5 text-amber-400" />
            <span>Frontend: <strong>Firebase Hosting</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>Backend: <strong>Render Web Service</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Database: <strong>Neon PostgreSQL</strong></span>
          </div>
        </div>
      </div>
    </aside>
  );
};

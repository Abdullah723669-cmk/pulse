import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Lock, Mail, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loginOrEmail, setLoginOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginOrEmail || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await login({ loginOrEmail, password });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (email: string) => {
    setLoginOrEmail(email);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4">
      {/* Background glow circles */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md glass-panel rounded-3xl p-8 border border-slate-800 shadow-2xl relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-400 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-brand-500/25">
            <Zap className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Welcome back to Pulse</h1>
          <p className="text-xs text-slate-400 mt-1">
            Social feed & follower-gated real-time chat platform
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Username or Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={loginOrEmail}
                onChange={(e) => setLoginOrEmail(e.target.value)}
                placeholder="alex@example.com or alex_rivera"
                className="w-full bg-slate-900/90 text-xs text-slate-100 rounded-xl pl-10 pr-4 py-3 border border-slate-800 focus:border-brand-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900/90 text-xs text-slate-100 rounded-xl pl-10 pr-4 py-3 border border-slate-800 focus:border-brand-500 outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Fill Demo Accounts */}
        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <p className="text-[11px] font-semibold text-slate-400 mb-2">
            🚀 Quick 1-Click Demo Accounts:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: 'Alex (Creator)', email: 'alex@example.com' },
              { name: 'Sarah (Designer)', email: 'sarah@example.com' },
              { name: 'David (Filmmaker)', email: 'david@example.com' },
              { name: 'Elena (3D Artist)', email: 'elena@example.com' },
            ].map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleQuickLogin(acc.email)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-brand-600/20 text-slate-300 hover:text-brand-300 text-[11px] font-medium transition-colors border border-slate-700/60"
              >
                {acc.name}
              </button>
            ))}
          </div>
        </div>

        {/* Register link */}
        <div className="mt-6 text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-400 font-semibold hover:underline">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

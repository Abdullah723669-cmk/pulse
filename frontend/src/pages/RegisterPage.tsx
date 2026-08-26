import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Lock, Mail, User, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await register({
        name,
        username,
        email,
        password,
        bio,
      });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-panel rounded-3xl p-8 border border-slate-800 shadow-2xl relative z-10">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-cyan-400 flex items-center justify-center mx-auto mb-3 shadow-xl shadow-brand-500/25">
            <Zap className="w-8 h-8 text-white fill-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Join Pulse</h1>
          <p className="text-xs text-slate-400 mt-1">
            Create your profile and start sharing rich media & messaging
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                className="w-full bg-slate-900/90 text-xs text-slate-100 rounded-xl pl-10 pr-4 py-2.5 border border-slate-800 focus:border-brand-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Username
            </label>
            <div className="relative">
              <span className="text-xs text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 font-bold">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="alex_rivera"
                className="w-full bg-slate-900/90 text-xs text-slate-100 rounded-xl pl-10 pr-4 py-2.5 border border-slate-800 focus:border-brand-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full bg-slate-900/90 text-xs text-slate-100 rounded-xl pl-10 pr-4 py-2.5 border border-slate-800 focus:border-brand-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-slate-900/90 text-xs text-slate-100 rounded-xl pl-10 pr-4 py-2.5 border border-slate-800 focus:border-brand-500 outline-none"
                required
                minLength={6}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Bio (Optional)
            </label>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others what you build, create or share..."
              className="w-full bg-slate-900/90 text-xs text-slate-100 rounded-xl px-4 py-2.5 border border-slate-800 focus:border-brand-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-brand-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

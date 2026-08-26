import React, { useState, useRef } from 'react';
import { X, Upload, Loader2, Check } from 'lucide-react';
import { User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { uploadApi } from '../../api/upload.api';

interface EditProfileModalProps {
  user: User;
  onClose: () => void;
  onUpdated: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  user,
  onClose,
  onUpdated,
}) => {
  const { updateUser } = useAuth();
  const [name, setName] = useState(user.name || '');
  const [bio, setBio] = useState(user.bio || '');
  const [website, setWebsite] = useState(user.website || '');
  const [location, setLocation] = useState(user.location || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [coverImage, setCoverImage] = useState(user.coverImage || '');

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const res = await uploadApi.uploadSingle(file);
      setAvatar(res.url);
    } catch {
      setError('Failed to upload avatar.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    try {
      const res = await uploadApi.uploadSingle(file);
      setCoverImage(res.url);
    } catch {
      setError('Failed to upload cover banner.');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await updateUser({
        name,
        bio,
        website,
        location,
        avatar,
        coverImage,
      });
      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-100 text-base">Edit Profile</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Cover Photo Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Cover Banner
            </label>
            <div className="relative h-28 rounded-2xl overflow-hidden bg-slate-800 border border-slate-700">
              {coverImage ? (
                <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-brand-900/40 to-purple-900/40" />
              )}
              <input
                type="file"
                ref={coverInputRef}
                onChange={handleCoverUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={isUploadingCover}
                className="absolute inset-0 bg-black/40 hover:bg-black/60 text-white flex items-center justify-center gap-2 text-xs font-medium transition-colors"
              >
                {isUploadingCover ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Change Cover</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Avatar Photo Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Avatar Image
            </label>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-brand-500">
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <input
                type="file"
                ref={avatarInputRef}
                onChange={handleAvatarUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-2 transition-colors"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload New Photo</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 border border-slate-700 focus:border-brand-500 outline-none"
              required
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full bg-slate-800/80 rounded-xl px-3.5 py-2 text-xs text-slate-100 border border-slate-700 focus:border-brand-500 outline-none resize-none"
            />
          </div>

          {/* Location & Website */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA"
                className="w-full bg-slate-800/80 rounded-xl px-3.5 py-2 text-xs text-slate-100 border border-slate-700 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Website
              </label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://..."
                className="w-full bg-slate-800/80 rounded-xl px-3.5 py-2 text-xs text-slate-100 border border-slate-700 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/30 transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

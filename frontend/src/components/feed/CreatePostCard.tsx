import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Video, Sparkles, X, Loader2, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { uploadApi } from '../../api/upload.api';
import { postApi } from '../../api/post.api';
import { MediaItem, Post } from '../../types';
import { getMediaUrl } from '../../utils/media';

interface CreatePostCardProps {
  onPostCreated: (newPost: Post) => void;
}

export const CreatePostCard: React.FC<CreatePostCardProps> = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handleImageFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setIsUploading(true);
    try {
      const uploaded = await uploadApi.uploadMultiple(Array.from(files));
      if (uploaded && uploaded.length > 0) {
        setMediaList((prev) => [...prev, ...uploaded]);
      } else {
        setError('No media was uploaded. Please try again.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to upload image(s). Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setError('Video file exceeds the 50MB limit.');
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      const uploaded = await uploadApi.uploadSingle(file);
      if (uploaded && uploaded.url) {
        setMediaList((prev) => [...prev, uploaded]);
      } else {
        setError('Failed to upload video. Please try again.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to upload video. Please try again.');
    } finally {
      setIsUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const removeMedia = (index: number) => {
    setMediaList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && mediaList.length === 0) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await postApi.createPost({
        content,
        media: mediaList,
      });
      setContent('');
      setMediaList([]);
      onPostCreated(res.post);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to publish post.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-5 mb-6 shadow-xl border border-slate-800/80">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-4 items-start">
          <img
            src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
            alt={user.name}
            className="w-11 h-11 rounded-full object-cover border-2 border-brand-500/40 ring-2 ring-brand-500/10"
          />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`What's on your mind, ${user.name.split(' ')[0]}? Share thoughts, photos, or clips...`}
              rows={3}
              className="w-full bg-transparent resize-none border-0 focus:ring-0 text-slate-100 placeholder-slate-500 text-base leading-relaxed outline-none"
            />

            {/* Media Previews Grid */}
            {mediaList.length > 0 && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {mediaList.map((item, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-xl overflow-hidden bg-slate-900 border border-slate-800 max-h-48"
                  >
                    {item.type === 'video' ? (
                      <video
                        src={getMediaUrl(item.url)}
                        className="w-full h-full object-cover max-h-44"
                        controls
                      />
                    ) : (
                      <img
                        src={getMediaUrl(item.url)}
                        alt="Upload preview"
                        className="w-full h-full object-cover max-h-44"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeMedia(idx)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {item.type === 'video' && (
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-semibold text-brand-400">
                        VIDEO
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="mt-2 text-rose-400 text-xs bg-rose-950/40 border border-rose-800/40 rounded-lg p-2.5">
                {error}
              </div>
            )}

            {/* Uploading progress indicator */}
            {isUploading && (
              <div className="mt-3 flex items-center gap-2 text-brand-400 text-xs font-medium">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading media file to storage...</span>
              </div>
            )}

            {/* Bottom Actions Bar */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Image upload button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageFiles}
                  multiple
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-brand-300 text-xs font-medium transition-all"
                >
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  <span>Photo</span>
                </button>

                {/* Video upload button */}
                <input
                  type="file"
                  ref={videoInputRef}
                  onChange={handleVideoFile}
                  accept="video/mp4,video/webm,video/quicktime"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-brand-300 text-xs font-medium transition-all"
                >
                  <Video className="w-4 h-4 text-purple-400" />
                  <span>Video</span>
                </button>

                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 pl-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Rich Media Support</span>
                </div>
              </div>

              {/* Submit Post Button */}
              <button
                type="submit"
                disabled={isSubmitting || isUploading || (!content.trim() && mediaList.length === 0)}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs tracking-wide shadow-lg shadow-brand-600/25 transition-all transform active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <span>Post</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

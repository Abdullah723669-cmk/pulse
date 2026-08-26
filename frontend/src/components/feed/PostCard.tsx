import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  CheckCircle2,
  Trash2,
  Send,
  MessageSquare,
  Bookmark,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Post, Comment } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { postApi } from '../../api/post.api';
import { VideoPlayer } from './VideoPlayer';
import { MediaLightbox } from '../ui/MediaLightbox';

interface PostCardProps {
  post: Post;
  onDelete?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onDelete }) => {
  const { user } = useAuth();
  const { openChatWithUser } = useChat();
  const navigate = useNavigate();

  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [comments, setComments] = useState<Comment[]>(post.recentComments || []);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount((prev) => (nextLiked ? prev + 1 : prev - 1));

    try {
      await postApi.likePost(post.id);
    } catch {
      setIsLiked(!nextLiked);
      setLikesCount((prev) => (!nextLiked ? prev + 1 : prev - 1));
    }
  };

  const handleToggleComments = async () => {
    const nextState = !showComments;
    setShowComments(nextState);

    if (nextState && comments.length < commentsCount) {
      try {
        const data = await postApi.getComments(post.id);
        setComments(data.comments);
      } catch (err) {
        console.error('Failed to load comments:', err);
      }
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;

    setIsSubmittingComment(true);
    try {
      const res = await postApi.addComment(post.id, commentText);
      setComments((prev) => [...prev, res.comment]);
      setCommentsCount((prev) => prev + 1);
      setCommentText('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await postApi.deletePost(post.id);
      onDelete?.(post.id);
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  const handleStartChat = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await openChatWithUser(post.author.id);
      navigate('/chat');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cannot start chat with this user.');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/profile/${post.author.username}`);
    alert('Profile link copied to clipboard!');
  };

  const isAuthor = user?.id === post.author.id;

  return (
    <>
      <article className="glass-panel rounded-2xl p-5 mb-5 shadow-xl border border-slate-800/80 hover:border-slate-700/80 transition-all">
        {/* Post Header */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-3">
            <Link to={`/profile/${post.author.username}`} className="group">
              <img
                src={
                  post.author.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.username}`
                }
                alt={post.author.name}
                className="w-11 h-11 rounded-full object-cover border-2 border-slate-700 group-hover:border-brand-500 transition-colors"
              />
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <Link
                  to={`/profile/${post.author.username}`}
                  className="font-bold text-slate-100 hover:text-brand-400 text-sm transition-colors"
                >
                  {post.author.name}
                </Link>
                {post.author.isVerified && (
                  <CheckCircle2 className="w-4 h-4 text-brand-400 fill-brand-500/20" />
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>@{post.author.username}</span>
                <span>•</span>
                <span>
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>

          {/* Options Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-1 w-44 glass-dropdown rounded-xl shadow-2xl py-1.5 z-20 border border-slate-700">
                {!isAuthor && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleStartChat();
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-slate-200 hover:bg-brand-600/20 hover:text-brand-300 flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4 text-brand-400" />
                    <span>Direct Message</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleShare();
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-slate-200 hover:bg-slate-800/80 flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4 text-slate-400" />
                  <span>Copy Link</span>
                </button>
                {isAuthor && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleDelete();
                    }}
                    className="w-full px-4 py-2 text-left text-xs text-rose-400 hover:bg-rose-950/40 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>Delete Post</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Content text */}
        {post.content && (
          <p className="text-slate-200 text-[15px] leading-relaxed mb-3.5 whitespace-pre-line break-words">
            {post.content}
          </p>
        )}

        {/* Media rendering */}
        {post.media && post.media.length > 0 && (
          <div className="mb-4">
            {post.media.map((item, idx) => {
              if (item.type === 'video') {
                return (
                  <div key={idx} className="mb-2">
                    <VideoPlayer src={item.url} poster={item.thumbnail} />
                  </div>
                );
              }
              return null;
            })}

            {/* Images Grid */}
            {post.media.filter((m) => m.type === 'image').length > 0 && (
              <div
                className={`grid gap-2 rounded-2xl overflow-hidden ${
                  post.media.filter((m) => m.type === 'image').length === 1
                    ? 'grid-cols-1'
                    : post.media.filter((m) => m.type === 'image').length === 2
                    ? 'grid-cols-2'
                    : 'grid-cols-2 sm:grid-cols-3'
                }`}
              >
                {post.media
                  .filter((m) => m.type === 'image')
                  .map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setLightboxIndex(idx)}
                      className="cursor-pointer overflow-hidden rounded-xl bg-slate-900 border border-slate-800/80 aspect-video sm:aspect-square relative group"
                    >
                      <img
                        src={img.url}
                        alt="Post attachment"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-semibold px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm">
                          Zoom
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Actions Row */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-slate-400">
          <div className="flex items-center gap-6">
            {/* Like */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 text-xs font-medium group transition-colors ${
                isLiked ? 'text-rose-500 font-semibold' : 'hover:text-rose-400'
              }`}
            >
              <div
                className={`p-2 rounded-full transition-all ${
                  isLiked
                    ? 'bg-rose-500/10'
                    : 'group-hover:bg-rose-500/10'
                }`}
              >
                <Heart
                  className={`w-4 h-4 transition-transform group-active:scale-125 ${
                    isLiked ? 'fill-rose-500 text-rose-500' : ''
                  }`}
                />
              </div>
              <span>{likesCount}</span>
            </button>

            {/* Comment */}
            <button
              onClick={handleToggleComments}
              className="flex items-center gap-2 text-xs font-medium hover:text-brand-400 group transition-colors"
            >
              <div className="p-2 rounded-full group-hover:bg-brand-500/10 transition-colors">
                <MessageCircle className="w-4 h-4" />
              </div>
              <span>{commentsCount}</span>
            </button>

            {/* Direct Message (if not own post) */}
            {!isAuthor && (
              <button
                onClick={handleStartChat}
                className="flex items-center gap-2 text-xs font-medium hover:text-cyan-400 group transition-colors"
                title="Message author (Followers only)"
              >
                <div className="p-2 rounded-full group-hover:bg-cyan-500/10 transition-colors">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                </div>
                <span className="hidden sm:inline">Message</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={`p-2 rounded-full hover:bg-slate-800 transition-colors ${
                isBookmarked ? 'text-amber-400' : 'hover:text-amber-400'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-full hover:bg-slate-800 hover:text-slate-200 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expandable Comments Drawer */}
        {showComments && (
          <div className="mt-4 pt-4 border-t border-slate-800 animate-slide-up">
            {/* New Comment Input */}
            {user ? (
              <form onSubmit={handleAddComment} className="flex gap-2.5 items-center mb-4">
                <img
                  src={
                    user.avatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
                  }
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full bg-slate-900/90 text-slate-100 text-xs rounded-xl px-3.5 py-2.5 pr-10 border border-slate-800 focus:border-brand-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim() || isSubmittingComment}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-brand-400 hover:text-brand-300 disabled:opacity-30 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-xs text-slate-400 mb-3 text-center">
                <Link to="/login" className="text-brand-400 hover:underline">
                  Log in
                </Link>{' '}
                to leave a comment.
              </div>
            )}

            {/* Comment List */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {comments.length === 0 ? (
                <div className="text-center py-3 text-xs text-slate-500">
                  No comments yet. Be the first to share your thoughts!
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-2.5">
                    <Link to={`/profile/${comment.user.username}`}>
                      <img
                        src={
                          comment.user.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user.username}`
                        }
                        alt={comment.user.name}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    </Link>
                    <div className="flex-1 bg-slate-900/70 rounded-xl px-3 py-2 border border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <Link
                          to={`/profile/${comment.user.username}`}
                          className="font-semibold text-xs text-slate-200 hover:text-brand-400"
                        >
                          {comment.user.name}
                        </Link>
                        <span className="text-[10px] text-slate-500">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </article>

      {/* Lightbox for zooming photos */}
      {lightboxIndex !== null && (
        <MediaLightbox
          media={post.media}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(newIdx) => setLightboxIndex(newIdx)}
        />
      )}
    </>
  );
};

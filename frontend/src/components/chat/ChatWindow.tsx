import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Lock,
  UserPlus,
  ShieldAlert,
  Loader2,
  ExternalLink,
  MessageSquare,
  Phone,
  Video,
  ArrowLeft,
} from 'lucide-react';
import { Conversation, Message } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useCall } from '../../context/CallContext';
import { userApi } from '../../api/user.api';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';

interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  isLoadingMessages: boolean;
  typingUsers: { id: string; name: string; username: string }[];
  onSendMessage: (
    text?: string,
    mediaUrl?: string,
    mediaType?: 'image' | 'video' | 'file' | 'audio'
  ) => Promise<void>;
  onTypingStart: () => void;
  onTypingStop: () => void;
  onFollowUnlocked?: () => void;
  onBack?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  messages,
  isLoadingMessages,
  typingUsers,
  onSendMessage,
  onTypingStart,
  onTypingStop,
  onFollowUnlocked,
  onBack,
}) => {
  const { user } = useAuth();
  const { isUserOnline } = useSocket();
  const { startCall, callState } = useCall();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isCallActive = callState !== 'idle';

  const [isFollowingTarget, setIsFollowingTarget] = useState(
    conversation.chatPermission?.isFollowing || false
  );
  const [canChat, setCanChat] = useState(
    conversation.chatPermission?.canChat ?? true
  );
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const otherUser = conversation.otherUser;
  const isOnline = isUserOnline(otherUser.id);
  const isRecipientTyping = typingUsers.some((u) => u.id === otherUser.id);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isRecipientTyping]);

  useEffect(() => {
    setIsFollowingTarget(conversation.chatPermission?.isFollowing || false);
    setCanChat(conversation.chatPermission?.canChat ?? true);
  }, [conversation]);

  const handleUnlockFollow = async () => {
    setIsFollowLoading(true);
    try {
      await userApi.followUser(otherUser.id);
      setIsFollowingTarget(true);
      setCanChat(true);
      onFollowUnlocked?.();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to follow user.');
    } finally {
      setIsFollowLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1322]">
      {/* Top Header */}
      <div className="p-3 sm:p-3.5 px-3.5 sm:px-5 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="md:hidden p-2 -ml-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
              title="Back to conversations"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <Link to={`/profile/${otherUser.username}`} className="relative group flex-shrink-0">
            <img
              src={
                otherUser.avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.username}`
              }
              alt={otherUser.name}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-slate-700 group-hover:border-brand-500 transition-colors"
            />
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
            )}
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              <Link
                to={`/profile/${otherUser.username}`}
                className="font-bold text-slate-100 hover:text-brand-400 text-xs sm:text-sm transition-colors truncate"
              >
                {otherUser.name}
              </Link>
              {otherUser.isVerified && (
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-400 fill-brand-500/20 flex-shrink-0" />
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
              <span className={isOnline ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
                {isOnline ? 'Active' : 'Offline'}
              </span>
              <span className="hidden sm:inline text-slate-500">•</span>
              <span className="text-slate-400 hidden sm:inline truncate">@{otherUser.username}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Follow status badge (hidden on small screens to fit call buttons) */}
          <div className="hidden lg:block">
            {conversation.chatPermission?.isMutual ? (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Mutual Followers
              </span>
            ) : isFollowingTarget ? (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                Following
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Gated
              </span>
            )}
          </div>

          {/* Audio Call Button */}
          {canChat && (
            <button
              onClick={() => startCall(otherUser as any, 'audio')}
              disabled={isCallActive || !isOnline}
              className="p-2 rounded-xl text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title={!isOnline ? `${otherUser.name} is offline` : isCallActive ? 'Call in progress' : 'Audio Call'}
            >
              <Phone className="w-4 h-4" />
            </button>
          )}

          {/* Video Call Button */}
          {canChat && (
            <button
              onClick={() => startCall(otherUser as any, 'video')}
              disabled={isCallActive || !isOnline}
              className="p-2 rounded-xl text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title={!isOnline ? `${otherUser.name} is offline` : isCallActive ? 'Call in progress' : 'Video Call'}
            >
              <Video className="w-4 h-4" />
            </button>
          )}

          <Link
            to={`/profile/${otherUser.username}`}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="View Profile"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Message List Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full text-xs text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2 text-brand-500" />
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-3">
              <MessageSquare className="w-7 h-7 text-brand-400" />
            </div>
            <h3 className="text-sm font-bold text-slate-200">
              Direct Chat with {otherUser.name}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Messages are secure, real-time, and restricted strictly to followers.
              Say hello or share photos and clips!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === user?.id}
            />
          ))
        )}

        {/* Typing indicator */}
        {isRecipientTyping && (
          <div className="flex items-center gap-2 text-xs text-brand-300 py-1 px-3 rounded-full bg-brand-500/10 w-fit border border-brand-500/20 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" />
            <span>{otherUser.name} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Follower Gating Banner vs Chat Input */}
      {!canChat ? (
        <div className="p-5 bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-amber-950/40 border-t border-amber-800/40 text-center">
          <div className="flex items-center justify-center gap-2 text-amber-400 font-semibold text-sm mb-1.5">
            <ShieldAlert className="w-5 h-5" />
            <span>Follower-Gated Direct Messaging</span>
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-3">
            To ensure a trusted, high-quality community, you can only exchange messages with users you follow or who follow you.
          </p>
          <button
            onClick={handleUnlockFollow}
            disabled={isFollowLoading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-xl shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {isFollowLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Unlocking Chat...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Follow @{otherUser.username} to Unlock Chat</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <ChatInput
          onSendMessage={onSendMessage}
          onTypingStart={onTypingStart}
          onTypingStop={onTypingStop}
        />
      )}
    </div>
  );
};

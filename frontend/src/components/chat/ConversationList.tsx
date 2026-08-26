import React, { useState } from 'react';
import { Search, CheckCircle2, UserCheck, Users, Lock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Conversation } from '../../types';
import { useSocket } from '../../context/SocketContext';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  onSelectConversation: (conv: Conversation) => void;
  isLoading: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  activeConversation,
  onSelectConversation,
  isLoading,
}) => {
  const [search, setSearch] = useState('');
  const { isUserOnline } = useSocket();

  const filtered = conversations.filter(
    (c) =>
      c.otherUser.name.toLowerCase().includes(search.toLowerCase()) ||
      c.otherUser.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-slate-900/60 border-r border-slate-800">
      {/* Header & Search */}
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-lg font-bold text-slate-100 mb-3 flex items-center justify-between">
          <span>Messages</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-400 font-semibold border border-brand-500/30">
            Followers Gated
          </span>
        </h2>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-slate-800/80 text-xs rounded-xl pl-9 pr-3.5 py-2 text-slate-200 placeholder-slate-500 border border-slate-700/70 focus:border-brand-500 outline-none"
          />
        </div>
      </div>

      {/* Conversation List Stream */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
        {isLoading ? (
          <div className="p-6 text-center text-xs text-slate-500">
            Loading conversations...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-medium">No messages yet</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Connect with users you follow or who follow you to start a chat!
            </p>
          </div>
        ) : (
          filtered.map((conv) => {
            const isOnline = isUserOnline(conv.otherUser.id);
            const isActive = activeConversation?.id === conv.id;
            const canChat = conv.chatPermission?.canChat ?? true;

            return (
              <div
                key={conv.id}
                onClick={() => onSelectConversation(conv)}
                className={`p-3.5 flex items-center gap-3 cursor-pointer transition-all ${
                  isActive
                    ? 'bg-brand-600/15 border-l-4 border-l-brand-500'
                    : 'hover:bg-slate-800/40'
                }`}
              >
                {/* Avatar with Online Status */}
                <div className="relative flex-shrink-0">
                  <img
                    src={
                      conv.otherUser.avatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.otherUser.username}`
                    }
                    alt={conv.otherUser.name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-700"
                  />
                  {isOnline ? (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                  ) : (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-slate-600 border-2 border-slate-900" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-semibold text-xs text-slate-200 truncate">
                        {conv.otherUser.name}
                      </span>
                      {conv.otherUser.isVerified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                      )}
                    </div>
                    {conv.lastMessage && (
                      <span className="text-[10px] text-slate-500 flex-shrink-0">
                        {formatDistanceToNow(new Date(conv.lastMessage.createdAt), {
                          addSuffix: false,
                        })}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400 truncate pr-2">
                      {conv.lastMessage?.text ||
                        (conv.lastMessage?.mediaUrl ? '📷 [Media attachment]' : 'Started conversation')}
                    </p>

                    <div className="flex items-center gap-1">
                      {!canChat && (
                        <span title="Follow required to message">
                          <Lock className="w-3 h-3 text-amber-400" />
                        </span>
                      )}
                      {conv.unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Follower Relation Badge */}
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                    {conv.chatPermission?.isMutual ? (
                      <span className="text-emerald-400/90 flex items-center gap-1">
                        <UserCheck className="w-3 h-3" /> Mutual Follower
                      </span>
                    ) : conv.chatPermission?.isFollowing ? (
                      <span className="text-brand-400/90">Following</span>
                    ) : conv.chatPermission?.isFollower ? (
                      <span className="text-cyan-400/90">Follows You</span>
                    ) : (
                      <span className="text-amber-400/90 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Follow to unlock
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

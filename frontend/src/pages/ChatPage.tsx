import React, { useState } from 'react';
import { ArrowLeft, MessageSquare, ShieldCheck } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { ConversationList } from '../components/chat/ConversationList';
import { ChatWindow } from '../components/chat/ChatWindow';

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    typingUsers,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
    loadConversations,
  } = useChat();

  const [mobileShowChat, setMobileShowChat] = useState(false);

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-8 text-center py-32">
        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-3">
          <MessageSquare className="w-8 h-8 text-brand-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-100">Sign in to Access Messages</h2>
        <p className="text-xs text-slate-400 mt-1 mb-4">
          Chat with creators and followers in real time.
        </p>
      </div>
    );
  }

  const handleSelectConversation = (conv: any) => {
    setActiveConversation(conv);
    setMobileShowChat(true);
  };

  return (
    <div className="h-screen flex flex-col bg-[#090d16]">
      {/* Mobile back header */}
      {mobileShowChat && (
        <div className="md:hidden p-3 bg-slate-900 border-b border-slate-800 flex items-center gap-2">
          <button
            onClick={() => setMobileShowChat(false)}
            className="p-1.5 rounded-lg text-slate-300 hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold text-slate-200">Back to Conversations</span>
        </div>
      )}

      {/* Main Chat Interface */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Conversation List */}
        <div
          className={`w-full md:w-80 lg:w-96 flex-shrink-0 h-full ${
            mobileShowChat ? 'hidden md:block' : 'block'
          }`}
        >
          <ConversationList
            conversations={conversations}
            activeConversation={activeConversation}
            onSelectConversation={handleSelectConversation}
            isLoading={isLoadingConversations}
          />
        </div>

        {/* Right: Active Chat Window */}
        <div
          className={`flex-1 h-full flex flex-col ${
            !mobileShowChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConversation ? (
            <ChatWindow
              conversation={activeConversation}
              messages={messages}
              isLoadingMessages={isLoadingMessages}
              typingUsers={typingUsers}
              onSendMessage={sendMessage}
              onTypingStart={sendTypingStart}
              onTypingStop={sendTypingStop}
              onFollowUnlocked={loadConversations}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0b101c]">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-brand-600/20 to-cyan-500/20 border border-brand-500/30 flex items-center justify-center mb-4 shadow-2xl">
                <MessageSquare className="w-10 h-10 text-brand-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-100">Select a Conversation</h2>
              <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
                Direct messages on Pulse are private, end-to-end synchronized, and restricted strictly to followers.
              </p>

              <div className="mt-6 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-left max-w-sm space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Follower Privacy Rules</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  You can message users who follow you or whom you follow. Follow any user to unlock instant real-time messaging with them.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

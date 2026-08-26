import React, { useState } from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import { Message } from '../../types';
import { VideoPlayer } from '../feed/VideoPlayer';
import { MediaLightbox } from '../ui/MediaLightbox';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn }) => {
  const [showLightbox, setShowLightbox] = useState(false);

  const formattedTime = message.createdAt
    ? format(new Date(message.createdAt), 'h:mm a')
    : '';

  return (
    <div className={`flex flex-col mb-3.5 ${isOwn ? 'items-end' : 'items-start'}`}>
      <div
        className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-3.5 shadow-md ${
          isOwn
            ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-br-xs'
            : 'glass-panel text-slate-100 rounded-bl-xs border border-slate-800'
        }`}
      >
        {/* Media attachment */}
        {message.mediaUrl && (
          <div className="mb-2 rounded-xl overflow-hidden">
            {message.mediaType === 'video' ? (
              <VideoPlayer src={message.mediaUrl} className="max-h-64" />
            ) : (
              <img
                src={message.mediaUrl}
                alt="Attachment"
                onClick={() => setShowLightbox(true)}
                className="max-h-64 w-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              />
            )}
          </div>
        )}

        {/* Text content */}
        {message.text && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message.text}
          </p>
        )}

        {/* Meta (time + read status) */}
        <div
          className={`flex items-center justify-end gap-1 mt-1.5 text-[10px] ${
            isOwn ? 'text-brand-200' : 'text-slate-400'
          }`}
        >
          <span>{formattedTime}</span>
          {isOwn && (
            <span>
              {message.isRead ? (
                <CheckCheck className="w-3.5 h-3.5 text-cyan-300 inline" />
              ) : (
                <Check className="w-3.5 h-3.5 text-brand-200 inline" />
              )}
            </span>
          )}
        </div>
      </div>

      {showLightbox && message.mediaUrl && (
        <MediaLightbox
          media={[{ url: message.mediaUrl, type: (message.mediaType as any) || 'image' }]}
          currentIndex={0}
          onClose={() => setShowLightbox(false)}
          onNavigate={() => {}}
        />
      )}
    </div>
  );
};

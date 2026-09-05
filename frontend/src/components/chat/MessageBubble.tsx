import React, { useState } from 'react';
import { Check, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';
import { Message } from '../../types';
import { VideoPlayer } from '../feed/VideoPlayer';
import { MediaLightbox } from '../ui/MediaLightbox';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import { getMediaUrl } from '../../utils/media';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn }) => {
  const [showLightbox, setShowLightbox] = useState(false);

  const formattedTime = message.createdAt
    ? format(new Date(message.createdAt), 'h:mm a')
    : '';

  const mediaUrl = getMediaUrl(message.mediaUrl);
  const isAudio =
    message.mediaType === 'audio' ||
    /\.(webm|ogg|mp3|wav|m4a|aac|weba|flac)$/i.test(message.mediaUrl || '') ||
    /voice-message/i.test(message.mediaUrl || '');

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
        {mediaUrl && (
          <div className="mb-2 rounded-xl overflow-hidden">
            {isAudio ? (
              <VoiceMessagePlayer src={mediaUrl} isOwn={isOwn} />
            ) : message.mediaType === 'video' ? (
              <div className="bg-slate-900/80 rounded-xl overflow-hidden">
                <VideoPlayer src={mediaUrl} className="max-h-64 rounded-xl" />
              </div>
            ) : (
              <div
                onClick={() => setShowLightbox(true)}
                className="cursor-pointer group relative overflow-hidden rounded-xl bg-slate-900/80"
              >
                <img
                  src={mediaUrl}
                  alt="Attachment"
                  className="max-h-72 w-full object-cover rounded-xl group-hover:scale-102 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs font-semibold px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm">
                    Click to enlarge
                  </span>
                </div>
              </div>
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

      {showLightbox && mediaUrl && !isAudio && (
        <MediaLightbox
          media={[{ url: mediaUrl, type: (message.mediaType as any) || 'image' }]}
          currentIndex={0}
          onClose={() => setShowLightbox(false)}
          onNavigate={() => {}}
        />
      )}
    </div>
  );
};


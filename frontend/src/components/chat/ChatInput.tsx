import React, { useState, useRef } from 'react';
import { Send, Image as ImageIcon, Video, Mic, Loader2, X } from 'lucide-react';
import { uploadApi } from '../../api/upload.api';
import { MediaItem } from '../../types';
import { getMediaUrl } from '../../utils/media';
import { VoiceRecorder } from './VoiceRecorder';

interface ChatInputProps {
  onSendMessage: (
    text?: string,
    mediaUrl?: string,
    mediaType?: 'image' | 'video' | 'file' | 'audio'
  ) => Promise<void>;
  onTypingStart: () => void;
  onTypingStop: () => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onTypingStart,
  onTypingStop,
  disabled = false,
}) => {
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<MediaItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isVoiceUploading, setIsVoiceUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);

    // Typing debounce
    onTypingStart();
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      onTypingStop();
    }, 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadApi.uploadSingle(file);
      setAttachment(res);
    } catch (err) {
      console.error('Attachment upload failed:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSendVoice = async (blob: Blob, mimeType: string) => {
    setIsVoiceUploading(true);
    try {
      const ext = mimeType.includes('mp4')
        ? 'mp4'
        : mimeType.includes('ogg')
        ? 'ogg'
        : 'webm';
      const file = new File([blob], `voice-message-${Date.now()}.${ext}`, {
        type: mimeType,
      });

      const res = await uploadApi.uploadSingle(file);
      await onSendMessage(undefined, res.url, 'audio');
      setIsRecordingVoice(false);
    } catch (err) {
      console.error('Failed to send voice message:', err);
      alert('Failed to send voice message. Please try again.');
    } finally {
      setIsVoiceUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !attachment) || isSending || isUploading || disabled) return;

    setIsSending(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    onTypingStop();

    try {
      await onSendMessage(
        text.trim() || undefined,
        attachment?.url,
        attachment?.type
      );
      setText('');
      setAttachment(null);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  if (isRecordingVoice) {
    return (
      <VoiceRecorder
        onSendVoice={handleSendVoice}
        onCancel={() => setIsRecordingVoice(false)}
        isUploading={isVoiceUploading}
      />
    );
  }

  return (
    <div className="p-3 bg-slate-900/90 border-t border-slate-800 backdrop-blur-md">
      {/* Attachment Preview */}
      {attachment && (
        <div className="mb-2 p-2 rounded-xl bg-slate-800/80 border border-slate-700 inline-flex items-center gap-3 relative">
          {attachment.type === 'video' ? (
            <video src={getMediaUrl(attachment.url)} className="w-14 h-14 object-cover rounded-lg" />
          ) : (
            <img src={getMediaUrl(attachment.url)} alt="Attached" className="w-14 h-14 object-cover rounded-lg" />
          )}
          <div className="text-xs">
            <p className="font-medium text-slate-200 uppercase">{attachment.type} attachment</p>
            <p className="text-[10px] text-emerald-400">Ready to send</p>
          </div>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            className="p-1 rounded-full bg-slate-700 hover:bg-rose-600 text-white transition-colors ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* Attachment buttons */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*,video/mp4,video/webm"
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-brand-300 disabled:opacity-40 transition-colors"
          title="Attach Image or Video"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-brand-400" />
          ) : (
            <div className="flex items-center gap-1">
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              <Video className="w-4 h-4 text-purple-400 hidden sm:inline" />
            </div>
          )}
        </button>

        {/* Message Input */}
        <input
          type="text"
          value={text}
          onChange={handleTextChange}
          disabled={disabled}
          placeholder={
            disabled
              ? 'Follow this user to unlock messaging...'
              : 'Write a message...'
          }
          className="flex-1 bg-slate-800/70 disabled:opacity-50 text-slate-100 text-sm rounded-xl px-4 py-2.5 border border-slate-700/80 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none placeholder-slate-500"
        />

        {/* Record Voice Note Button */}
        {!text.trim() && !attachment && !disabled && (
          <button
            type="button"
            onClick={() => setIsRecordingVoice(true)}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-brand-500/20 text-slate-300 hover:text-brand-400 border border-slate-700/60 hover:border-brand-500/40 transition-all active:scale-95"
            title="Record Voice Message"
          >
            <Mic className="w-4 h-4 text-brand-400" />
          </button>
        )}

        {/* Send Button */}
        {(text.trim() || attachment || disabled) && (
          <button
            type="submit"
            disabled={(!text.trim() && !attachment) || disabled || isSending || isUploading}
            className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg shadow-brand-600/30 transition-all active:scale-95"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        )}
      </form>
    </div>
  );
};


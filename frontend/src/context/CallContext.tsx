import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { User } from '../types';

export type CallState = 'idle' | 'calling' | 'ringing' | 'connected' | 'ended';
export type CallType = 'audio' | 'video';

interface IncomingCallData {
  callId: string;
  fromUser: User;
  offer: RTCSessionDescriptionInit;
  callType: CallType;
}

interface CallContextType {
  callState: CallState;
  callType: CallType;
  callId: string | null;
  callerUser: User | null;
  recipientUser: User | null;
  incomingCall: IncomingCallData | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  callDuration: number;
  errorMessage: string | null;
  startCall: (targetUser: User, type: CallType) => Promise<void>;
  answerCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => Promise<void>;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

const CallContext = createContext<CallContextType | undefined>(undefined);

// Web Audio Ringtone Synthesizer (Zero asset dependency)
class RingtoneManager {
  private audioCtx: AudioContext | null = null;
  private intervalId: number | null = null;

  private initCtx() {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  // Ringing for outgoing call
  startOutgoingRingtone() {
    this.stop();
    this.initCtx();
    if (!this.audioCtx) return;

    const playBeep = () => {
      if (!this.audioCtx || this.audioCtx.state === 'closed') return;
      try {
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc1.frequency.setValueAtTime(440, this.audioCtx.currentTime); // A4
        osc2.frequency.setValueAtTime(480, this.audioCtx.currentTime); // ~B4

        gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 1.2);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(this.audioCtx.currentTime + 1.2);
        osc2.stop(this.audioCtx.currentTime + 1.2);
      } catch {}
    };

    playBeep();
    this.intervalId = window.setInterval(playBeep, 3000);
  }

  // Melodic chime for incoming call
  startIncomingRingtone() {
    this.stop();
    this.initCtx();
    if (!this.audioCtx) return;

    const playChime = () => {
      if (!this.audioCtx || this.audioCtx.state === 'closed') return;
      try {
        const now = this.audioCtx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          if (!this.audioCtx) return;
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          const time = now + idx * 0.18;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, time);

          gain.gain.setValueAtTime(0.12, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

          osc.connect(gain);
          gain.connect(this.audioCtx.destination);

          osc.start(time);
          osc.stop(time + 0.35);
        });
      } catch {}
    };

    playChime();
    this.intervalId = window.setInterval(playChime, 2500);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        this.audioCtx.close().catch(() => {});
      } catch {}
      this.audioCtx = null;
    }
  }
}

const ringtone = new RingtoneManager();

export const CallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [callState, setCallState] = useState<CallState>('idle');
  const [callType, setCallType] = useState<CallType>('video');
  const [callId, setCallId] = useState<string | null>(null);
  const [callerUser, setCallerUser] = useState<User | null>(null);
  const [recipientUser, setRecipientUser] = useState<User | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);
  const timerRef = useRef<number | null>(null);

  // Clean up streams & peer connection
  const cleanupCall = useCallback(() => {
    ringtone.stop();

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setLocalStream(null);
    setRemoteStream(null);
    setCallState('idle');
    setCallId(null);
    setCallerUser(null);
    setRecipientUser(null);
    setIncomingCall(null);
    setIsMuted(false);
    setIsVideoOff(false);
    setIsScreenSharing(false);
    setCallDuration(0);
  }, []);

  // Initialize WebRTC PeerConnection
  const createPeerConnection = useCallback(
    (targetUserId: string, currentCallId: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionRef.current = pc;

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('ice_candidate', {
            targetUserId,
            candidate: event.candidate,
            callId: currentCallId,
          });
        }
      };

      // Handle Incoming Remote Stream
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          ringtone.stop();
          setCallState('connected');
          // Start call duration timer
          if (!timerRef.current) {
            timerRef.current = window.setInterval(() => {
              setCallDuration((prev) => prev + 1);
            }, 1000);
          }
        } else if (
          pc.connectionState === 'disconnected' ||
          pc.connectionState === 'failed' ||
          pc.connectionState === 'closed'
        ) {
          cleanupCall();
        }
      };

      return pc;
    },
    [socket, cleanupCall]
  );

  // Acquire Camera / Microphone
  const getMediaStream = async (type: CallType): Promise<MediaStream> => {
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video:
        type === 'video'
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'user',
            }
          : false,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  };

  // Start Call (Outgoing)
  const startCall = async (targetUser: User, type: CallType) => {
    if (!socket || !user) return;
    setErrorMessage(null);

    try {
      const newCallId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      setCallId(newCallId);
      setCallType(type);
      setCallerUser(user);
      setRecipientUser(targetUser);
      setCallState('calling');
      ringtone.startOutgoingRingtone();

      const stream = await getMediaStream(type);
      const pc = createPeerConnection(targetUser.id, newCallId);

      // Add local tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Create WebRTC Offer
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: type === 'video',
      });
      await pc.setLocalDescription(offer);

      // Send offer over Socket.io signaling
      socket.emit('call_user', {
        targetUserId: targetUser.id,
        offer,
        callType: type,
        callId: newCallId,
      });
    } catch (err: any) {
      console.error('Failed to start call:', err);
      setErrorMessage(err.message || 'Failed to access camera/microphone.');
      cleanupCall();
    }
  };

  // Answer Call (Incoming)
  const answerCall = async () => {
    if (!incomingCall || !socket || !user) return;
    ringtone.stop();
    setErrorMessage(null);

    const { callId: currentCallId, fromUser, offer, callType: type } = incomingCall;

    try {
      setCallId(currentCallId);
      setCallType(type);
      setCallerUser(fromUser);
      setRecipientUser(user);
      setCallState('connected');
      setIncomingCall(null);

      const stream = await getMediaStream(type);
      const pc = createPeerConnection(fromUser.id, currentCallId);

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // Send answer to caller
      socket.emit('answer_call', {
        toUserId: fromUser.id,
        answer,
        callId: currentCallId,
      });

      // Start duration timer
      if (!timerRef.current) {
        timerRef.current = window.setInterval(() => {
          setCallDuration((prev) => prev + 1);
        }, 1000);
      }
    } catch (err: any) {
      console.error('Failed to answer call:', err);
      setErrorMessage('Failed to answer call.');
      cleanupCall();
    }
  };

  // Reject Call (Incoming)
  const rejectCall = () => {
    if (!incomingCall || !socket) return;
    socket.emit('reject_call', {
      toUserId: incomingCall.fromUser.id,
      callId: incomingCall.callId,
      reason: 'Call declined.',
    });
    ringtone.stop();
    setIncomingCall(null);
  };

  // End Current Call
  const endCall = () => {
    const peerUser = callerUser?.id === user?.id ? recipientUser : callerUser;
    if (socket && peerUser && callId) {
      socket.emit('end_call', {
        targetUserId: peerUser.id,
        callId,
      });
    }
    cleanupCall();
  };

  // Toggle Microphone
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle Camera
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  // Screen Share Toggle
  const toggleScreenShare = async () => {
    if (!peerConnectionRef.current) return;

    if (isScreenSharing) {
      // Revert to camera
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newTrack = stream.getVideoTracks()[0];
        const sender = peerConnectionRef.current
          .getSenders()
          .find((s) => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(newTrack);
        }
        setIsScreenSharing(false);
      } catch {}
    } else {
      // Start Screen Share
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        const sender = peerConnectionRef.current
          .getSenders()
          .find((s) => s.track && s.track.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        }
        setIsScreenSharing(true);
      } catch (err) {
        console.error('Screen sharing error:', err);
      }
    }
  };

  // Socket.io Signaling Listeners
  useEffect(() => {
    if (!socket) return;

    // Incoming Call
    socket.on('incoming_call', (data: IncomingCallData) => {
      // If already in a call, auto-reject with busy
      if (callState !== 'idle') {
        socket.emit('reject_call', {
          toUserId: data.fromUser.id,
          callId: data.callId,
          reason: 'User is currently on another call.',
        });
        return;
      }

      setIncomingCall(data);
      setCallType(data.callType);
      ringtone.startIncomingRingtone();
    });

    // Call Answered by Recipient
    socket.on('call_answered', async (data: { callId: string; answer: RTCSessionDescriptionInit; fromUser: User }) => {
      ringtone.stop();
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          setCallState('connected');
        } catch (err) {
          console.error('Failed to set remote answer:', err);
        }
      }
    });

    // Call Rejected
    socket.on('call_rejected', (data: { callId: string; reason: string }) => {
      ringtone.stop();
      setErrorMessage(data.reason || 'User declined the call.');
      setTimeout(() => {
        cleanupCall();
      }, 2500);
    });

    // Call Failed
    socket.on('call_failed', (data: { callId: string; reason: string }) => {
      ringtone.stop();
      setErrorMessage(data.reason || 'Call could not be connected.');
      setTimeout(() => {
        cleanupCall();
      }, 2500);
    });

    // ICE Candidate from Peer
    socket.on('ice_candidate', async (data: { candidate: RTCIceCandidateInit; callId: string }) => {
      if (peerConnectionRef.current && data.candidate) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      }
    });

    // Call Ended
    socket.on('call_ended', () => {
      ringtone.stop();
      cleanupCall();
    });

    return () => {
      socket.off('incoming_call');
      socket.off('call_answered');
      socket.off('call_rejected');
      socket.off('call_failed');
      socket.off('ice_candidate');
      socket.off('call_ended');
    };
  }, [socket, callState, cleanupCall]);

  return (
    <CallContext.Provider
      value={{
        callState,
        callType,
        callId,
        callerUser,
        recipientUser,
        incomingCall,
        localStream,
        remoteStream,
        isMuted,
        isVideoOff,
        isScreenSharing,
        callDuration,
        errorMessage,
        startCall,
        answerCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
        toggleScreenShare,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = (): CallContextType => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

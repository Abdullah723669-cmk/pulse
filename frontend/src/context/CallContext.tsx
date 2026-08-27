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
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

const CallContext = createContext<CallContextType | undefined>(undefined);

// Web Audio Ringtone Synthesizer (Zero external asset dependency)
class RingtoneManager {
  private audioCtx: AudioContext | null = null;
  private intervalId: number | null = null;

  private initCtx() {
    try {
      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
    } catch {}
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
  const [callType, setCallType] = useState<CallType>('audio');
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
  const ringingTimeoutRef = useRef<number | null>(null);
  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

  // Clean up streams & peer connection
  const cleanupCall = useCallback(() => {
    ringtone.stop();

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (ringingTimeoutRef.current) {
      clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = null;
    }

    pendingIceCandidatesRef.current = [];

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
      peerConnectionRef.current.onconnectionstatechange = null;
      try {
        peerConnectionRef.current.close();
      } catch {}
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

  // Flush queued ICE candidates after setRemoteDescription
  const drainPendingIceCandidates = useCallback(async (pc: RTCPeerConnection) => {
    if (!pc.remoteDescription) return;
    while (pendingIceCandidatesRef.current.length > 0) {
      const candidate = pendingIceCandidatesRef.current.shift();
      if (candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('Error adding queued ICE candidate:', err);
        }
      }
    }
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
          if (ringingTimeoutRef.current) {
            clearTimeout(ringingTimeoutRef.current);
            ringingTimeoutRef.current = null;
          }
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

  // Acquire Camera / Microphone with multi-level fallback
  const getMediaStream = async (type: CallType): Promise<MediaStream> => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('WebRTC / media devices are not supported on this browser or requires HTTPS.');
    }

    try {
      // First attempt: optimal constraints
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
    } catch (err: any) {
      console.warn('Initial getUserMedia failed, attempting basic constraint fallback:', err);
      // Fallback: minimal constraints
      const basicConstraints: MediaStreamConstraints = {
        audio: true,
        video: type === 'video' ? true : false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(basicConstraints);
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    }
  };

  // Start Call (Outgoing)
  const startCall = async (targetUser: User, type: CallType) => {
    if (!socket) {
      alert('Real-time connection is reconnecting. Please wait a moment and try again.');
      return;
    }
    if (!user) return;

    setErrorMessage(null);

    try {
      const newCallId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      setCallId(newCallId);
      setCallType(type);
      setCallerUser(user);
      setRecipientUser(targetUser);
      setCallState('calling');
      ringtone.startOutgoingRingtone();

      // Ringing timeout (40 seconds)
      ringingTimeoutRef.current = window.setTimeout(() => {
        ringtone.stop();
        setErrorMessage('No answer.');
        setTimeout(() => cleanupCall(), 3000);
      }, 40000);

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
      ringtone.stop();
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Please allow microphone access in your browser settings.'
          : err.name === 'NotFoundError'
          ? 'No microphone / camera device found on this system.'
          : err.message || 'Failed to initialize audio call.'
      );
      setTimeout(() => {
        cleanupCall();
      }, 4000);
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
      await drainPendingIceCandidates(pc);

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
      setErrorMessage(err.message || 'Failed to answer call.');
      setTimeout(() => cleanupCall(), 3000);
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
    const handleIncomingCall = (data: IncomingCallData) => {
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
    };

    // Call Answered by Recipient
    const handleCallAnswered = async (data: { callId: string; answer: RTCSessionDescriptionInit; fromUser: User }) => {
      ringtone.stop();
      if (ringingTimeoutRef.current) {
        clearTimeout(ringingTimeoutRef.current);
        ringingTimeoutRef.current = null;
      }

      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          await drainPendingIceCandidates(peerConnectionRef.current);
          setCallState('connected');
        } catch (err) {
          console.error('Failed to set remote answer:', err);
        }
      }
    };

    // Call Rejected
    const handleCallRejected = (data: { callId: string; reason: string }) => {
      ringtone.stop();
      if (ringingTimeoutRef.current) {
        clearTimeout(ringingTimeoutRef.current);
        ringingTimeoutRef.current = null;
      }
      setErrorMessage(data.reason || 'User declined the call.');
      setTimeout(() => {
        cleanupCall();
      }, 3000);
    };

    // Call Failed
    const handleCallFailed = (data: { callId: string; reason: string }) => {
      ringtone.stop();
      if (ringingTimeoutRef.current) {
        clearTimeout(ringingTimeoutRef.current);
        ringingTimeoutRef.current = null;
      }
      setErrorMessage(data.reason || 'Call could not be connected.');
      setTimeout(() => {
        cleanupCall();
      }, 3000);
    };

    // ICE Candidate from Peer
    const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit; callId: string }) => {
      if (!data.candidate) return;
      const pc = peerConnectionRef.current;
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      } else {
        // Queue until remote description is set
        pendingIceCandidatesRef.current.push(data.candidate);
      }
    };

    // Call Ended
    const handleCallEnded = () => {
      ringtone.stop();
      cleanupCall();
    };

    socket.on('incoming_call', handleIncomingCall);
    socket.on('call_answered', handleCallAnswered);
    socket.on('call_rejected', handleCallRejected);
    socket.on('call_failed', handleCallFailed);
    socket.on('ice_candidate', handleIceCandidate);
    socket.on('call_ended', handleCallEnded);

    return () => {
      socket.off('incoming_call', handleIncomingCall);
      socket.off('call_answered', handleCallAnswered);
      socket.off('call_rejected', handleCallRejected);
      socket.off('call_failed', handleCallFailed);
      socket.off('ice_candidate', handleIceCandidate);
      socket.off('call_ended', handleCallEnded);
    };
  }, [socket, callState, cleanupCall, drainPendingIceCandidates]);

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

import { useState, useEffect, useRef } from 'react';
import { Bot, Mic, MicOff, StopCircle, Send, Volume2, MessageSquare, X } from 'lucide-react';

type CallState = 'idle' | 'connecting' | 'connected' | 'speaking' | 'listening';

interface Transcript {
  speaker: 'user' | 'agent';
  text: string;
  timestamp: string;
}

export default function NxtGenVoiceAgent() {
  const [callState, setCallState] = useState<CallState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [typedMessage, setTypedMessage] = useState('');
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [statusText, setStatusText] = useState('');
  const [showChatDrawer, setShowChatDrawer] = useState(false);

  // Dynamic config loaded from DB
  const [agentDisplayImage, setAgentDisplayImage] = useState('/assets/pavy_receptionist.jpg');

  const roomRef = useRef<any | null>(null);
  const audioElRef = useRef<HTMLDivElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Fetch public About Us / Agent config
    fetch('/api/guest/about-us-config')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config?.AGENT_DISPLAY_IMAGE) {
          setAgentDisplayImage(data.config.AGENT_DISPLAY_IMAGE);
        }
      })
      .catch(() => {
        // Fallback to default asset
      });
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  useEffect(() => {
    return () => {
      if (roomRef.current) roomRef.current.disconnect?.();
    };
  }, []);

  const addTranscript = (speaker: 'user' | 'agent', text: string) => {
    setTranscripts((prev) => [
      ...prev,
      { speaker, text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);
  };

  const checkGoodbye = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('goodbye') || lower.includes('bye') || lower.includes('have a great day')) {
      setTimeout(() => {
        roomRef.current?.disconnect?.();
        roomRef.current = null;
        setCallState('idle');
        setStatusText('');
        setShowChatDrawer(false);
      }, 2500);
    }
  };

  const handleStartCall = async () => {
    if (callState !== 'idle') {
      roomRef.current?.disconnect?.();
      roomRef.current = null;
      setCallState('idle');
      setStatusText('');
      setShowChatDrawer(false);
      return;
    }

    try {
      setCallState('connecting');
      setStatusText('Requesting microphone permission...');

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        setCallState('idle');
        setStatusText('Microphone access denied. Please allow microphone to talk.');
        alert('Microphone access required to speak with PAVY AI Receptionist.');
        return;
      }

      setStatusText('Connecting to PAVY AI Receptionist...');

      const res = await fetch('/api/livekit/token?room=nxtgen-contact-room');
      const data = await res.json();

      if (!data.token) throw new Error(data.error || 'Failed to get session token');

      // Dynamically import livekit-client
      const { Room, RoomEvent, Track } = await import('livekit-client');

      const room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, (track: any) => {
        if (track.kind === Track.Kind.Audio) {
          const el = track.attach();
          if (audioElRef.current) audioElRef.current.appendChild(el);
          setCallState('speaking');
          setStatusText('PAVY AI Receptionist is speaking...');
        }
      });

      room.on(RoomEvent.ActiveSpeakersChanged, (speakers: any[]) => {
        if (speakers.length > 0) {
          const isAgent = speakers.some((s) => s.identity.includes('agent') || s.identity.includes('worker'));
          setCallState(isAgent ? 'speaking' : 'listening');
          setStatusText(isAgent ? 'PAVY AI Receptionist is speaking...' : 'Listening to your voice...');
        }
      });

      room.on(RoomEvent.Disconnected, () => {
        setCallState('idle');
        setStatusText('');
        setShowChatDrawer(false);
      });

      await room.connect(data.wsUrl || 'wss://avatar-smh2w45h.livekit.cloud', data.token);
      await room.localParticipant.setMicrophoneEnabled(true);

      setCallState('connected');
      setStatusText('Connected to PAVY AI Receptionist');
      setShowChatDrawer(true);

      const greeting =
        'Hello! Welcome to NxtGen Academy by PAVY. I am your AI Receptionist. How can I help you today with courses, certifications, internships, or corporate services?';
      addTranscript('agent', greeting);
      checkGoodbye(greeting);
    } catch (err) {
      console.error('Voice connection failed:', err);
      setCallState('idle');
      setStatusText('Connection failed. Please try again.');
    }
  };

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || callState === 'idle') return;

    const text = typedMessage.trim();
    setTypedMessage('');
    addTranscript('user', text);
    checkGoodbye(text);

    // Send to LiveKit room if connected
    if (roomRef.current) {
      try {
        const encoder = new TextEncoder();
        await roomRef.current.localParticipant.publishData(encoder.encode(text), { reliable: true });
      } catch (e) {
        console.warn('Data publish warning:', e);
      }
    }

    // Also fetch real AI reply from Gemini backend endpoint
    try {
      const historyForApi = transcripts.map((t) => ({
        role: t.speaker === 'user' ? ('user' as const) : ('model' as const),
        text: t.text,
      }));

      const res = await fetch('/api/guest/coordinator-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, conversationHistory: historyForApi }),
      });
      const data = await res.json();

      const reply =
        data.success && data.reply
          ? data.reply
          : `Thank you for reaching out regarding "${text}". Our admissions and technical team will guide you with exact program details.`;

      addTranscript('agent', reply);
      setCallState('speaking');
      checkGoodbye(reply);
      setTimeout(() => setCallState((curr) => (curr !== 'idle' ? 'listening' : curr)), 3500);
    } catch {
      const reply = `Thank you for your message. How else can I assist you with NxtGen Academy's programs?`;
      addTranscript('agent', reply);
      setCallState('speaking');
    }
  };

  const toggleMute = async () => {
    if (!roomRef.current) return;
    const next = !isMuted;
    await roomRef.current.localParticipant.setMicrophoneEnabled(!next);
    setIsMuted(next);
  };

  const isConnected = callState !== 'idle';
  const barScales = [0.4, 0.8, 1.2, 0.6, 1.4, 0.9, 1.1, 0.5, 1.3, 0.7, 1.0, 0.4];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 mb-8">
      <div ref={audioElRef} className="hidden" />

      {/* ─── PAVY RECEPTIONIST SCREEN CONTAINER ─── */}
      <div className="relative rounded-3xl border border-amber-500/30 bg-black/90 shadow-[0_0_50px_rgba(234,179,8,0.15)] overflow-hidden">
        
        {/* Receptionist Display Image Container */}
        <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] overflow-hidden">
          <img
            src={agentDisplayImage}
            alt="PAVY Academy AI Receptionist"
            className={`w-full h-full object-cover transition-transform duration-700 ${
              callState === 'speaking' ? 'scale-[1.02]' : 'scale-100'
            }`}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/assets/pavy_receptionist.jpg';
            }}
          />

          {/* Vignette Overlay & Ambient Glow */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40 pointer-events-none" />

          {/* Speaking Audio Glow Pulse behind reception */}
          {callState === 'speaking' && (
            <div className="absolute inset-0 bg-amber-500/10 animate-pulse pointer-events-none" />
          )}

          {/* Top Status Badge */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-black/70 px-4 py-1.5 backdrop-blur-md shadow-lg">
              <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-200">
                {callState === 'idle'
                  ? 'PAVY 24/7 AI Receptionist'
                  : callState === 'connecting'
                  ? 'Connecting...'
                  : callState === 'speaking'
                  ? 'PAVY Speaking...'
                  : 'Listening...'}
              </span>
            </div>

            {/* Active Control Action Tools (Mute / Chat / End) */}
            {isConnected && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowChatDrawer(!showChatDrawer)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white hover:bg-white/20 transition-all backdrop-blur-md"
                  title="Toggle Chat Drawer"
                >
                  <MessageSquare size={16} />
                </button>
                <button
                  type="button"
                  onClick={toggleMute}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all backdrop-blur-md ${
                    isMuted
                      ? 'border-red-500/50 bg-red-500/20 text-red-400'
                      : 'border-white/20 bg-black/70 text-white hover:bg-white/20'
                  }`}
                  title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
                >
                  {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
                <button
                  type="button"
                  onClick={handleStartCall}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-red-500/40 bg-red-500/30 text-red-300 hover:bg-red-500/50 transition-all backdrop-blur-md"
                  title="End Call"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Bottom Desktop Overlay: TALK TO PAVY CTA Button */}
          <div className="absolute bottom-4 sm:bottom-6 inset-x-0 flex flex-col items-center justify-center z-20 px-4">
            <button
              type="button"
              onClick={handleStartCall}
              className={`group relative flex items-center justify-center gap-3 rounded-full border transition-all duration-300 ${
                isConnected
                  ? 'border-red-500/50 bg-gradient-to-r from-red-600 to-rose-700 text-white px-8 py-3.5 shadow-[0_0_30px_rgba(225,29,72,0.6)] hover:scale-105'
                  : 'border-amber-400/50 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white px-9 py-4 shadow-[0_0_35px_rgba(245,158,11,0.7)] hover:shadow-[0_0_50px_rgba(245,158,11,0.9)] hover:scale-105 active:scale-95'
              }`}
            >
              {isConnected ? (
                <>
                  <StopCircle size={20} className="animate-pulse" />
                  <span className="text-sm sm:text-base font-extrabold uppercase tracking-widest font-display">
                    END VOICE CALL
                  </span>
                </>
              ) : (
                <>
                  <Volume2 size={20} className="animate-bounce text-amber-100" />
                  <span className="text-sm sm:text-base font-extrabold uppercase tracking-widest font-display drop-shadow">
                    TALK TO PAVY
                  </span>
                </>
              )}
            </button>

            {statusText && (
              <p className="text-[11px] font-semibold text-amber-200/90 mt-2 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-amber-500/20">
                {statusText}
              </p>
            )}
          </div>
        </div>

        {/* ─── EXPANDABLE CHAT DRAWER FOR LIVE TEXT INTERACTION ─── */}
        {isConnected && showChatDrawer && (
          <div className="border-t border-amber-500/20 bg-black/95 p-4 space-y-3 backdrop-blur-xl animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  PAVY AI Receptionist Live Chat
                </span>
                {/* Audio Visualizer */}
                <div className="inline-flex items-end gap-0.5 h-4">
                  {barScales.map((_, i) => (
                    <span
                      key={i}
                      className={`w-0.5 rounded-full transition-all duration-200 ${
                        callState === 'speaking'
                          ? 'bg-amber-400 animate-bounce'
                          : callState === 'listening'
                          ? 'bg-emerald-400'
                          : 'bg-white/20'
                      }`}
                      style={{
                        height:
                          callState === 'speaking'
                            ? `${8 + (i % 5) * 4}px`
                            : callState === 'listening'
                            ? `${6 + (i % 3) * 3}px`
                            : '4px',
                        animationDelay: `${i * 50}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowChatDrawer(false)}
                className="text-text-muted hover:text-white text-xs"
              >
                Hide
              </button>
            </div>

            {/* Transcript List */}
            <div ref={chatScrollRef} className="h-40 overflow-y-auto space-y-3 text-xs pr-1">
              {transcripts.map((t, idx) => (
                <div key={idx} className={`flex flex-col ${t.speaker === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className={`text-[10px] font-bold ${
                        t.speaker === 'agent' ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {t.speaker === 'agent' ? '👩‍💼 PAVY Receptionist:' : '👤 You:'}
                    </span>
                    <span className="text-[9px] text-text-muted">{t.timestamp}</span>
                  </div>
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl leading-relaxed shadow text-xs ${
                      t.speaker === 'agent'
                        ? 'bg-white/[0.08] text-slate-100 border border-white/[0.1] rounded-tl-none'
                        : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium rounded-tr-none'
                    }`}
                  >
                    {t.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Text Input Form */}
            <form onSubmit={handleSendText} className="flex gap-2 border-t border-white/10 pt-2">
              <input
                type="text"
                placeholder="Type your message to PAVY Receptionist..."
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                className="flex-1 rounded-xl border border-white/15 bg-white/[0.05] px-3.5 py-2 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={!typedMessage.trim()}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold text-xs hover:from-orange-600 hover:to-amber-500 transition-all shadow disabled:opacity-40 flex items-center gap-1"
              >
                <Send size={13} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, StopCircle, Send, Volume2, MessageSquare, X, Headphones } from 'lucide-react';

type CallState = 'idle' | 'connecting' | 'connected' | 'speaking' | 'listening';

interface Transcript {
  speaker: 'user' | 'agent';
  text: string;
  timestamp: string;
}

/**
 * Global floating AI Voice Coordinator widget.
 *
 * Rendered at 600px x 500px in bottom right corner.
 * Integrates with LiveKit WebRTC and Gemini AI Coordinator for voice and text chat.
 */
export default function VoiceAgentWidget() {
  const [open, setOpen] = useState(false);
  const [callState, setCallState] = useState<CallState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [typedMessage, setTypedMessage] = useState('');
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [statusText, setStatusText] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [hovered, setHovered] = useState(false);

  const [agentDisplayImage, setAgentDisplayImage] = useState('/assets/pavy_receptionist.jpg');

  const roomRef = useRef<any | null>(null);
  const audioElRef = useRef<HTMLDivElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Fetch agent display config once
  useEffect(() => {
    fetch('/api/guest/about-us-config')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.config?.AGENT_DISPLAY_IMAGE) {
          setAgentDisplayImage(data.config.AGENT_DISPLAY_IMAGE);
        }
      })
      .catch(() => {});
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomRef.current) roomRef.current.disconnect?.();
    };
  }, []);

  const addTranscript = useCallback((speaker: 'user' | 'agent', text: string) => {
    setTranscripts((prev) => [
      ...prev,
      { speaker, text, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);
  }, []);

  const checkGoodbye = useCallback(
    (text: string) => {
      const lower = text.toLowerCase();
      if (lower.includes('goodbye') || lower.includes('bye') || lower.includes('have a great day')) {
        setTimeout(() => {
          roomRef.current?.disconnect?.();
          roomRef.current = null;
          setCallState('idle');
          setStatusText('');
        }, 2500);
      }
    },
    [],
  );

  const handleStartCall = async () => {
    if (callState !== 'idle') {
      roomRef.current?.disconnect?.();
      roomRef.current = null;
      setCallState('idle');
      setStatusText('');
      return;
    }

    try {
      setCallState('connecting');
      setStatusText('Requesting microphone permission…');

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        setCallState('idle');
        setStatusText('Microphone access denied.');
        return;
      }

      setStatusText('Connecting to NxtGen AI Coordinator…');

      const res = await fetch('/api/livekit/token?room=nxtgen-contact-room');
      const data = await res.json();
      if (!data.token) throw new Error(data.error || 'Token failed');

      const { Room, RoomEvent, Track } = await import('livekit-client');

      const room = new Room({ adaptiveStream: true, dynacast: true });
      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, (track: any) => {
        if (track.kind === Track.Kind.Audio) {
          const el = track.attach();
          if (audioElRef.current) audioElRef.current.appendChild(el);
          setCallState('speaking');
          setStatusText('AI Coordinator is speaking…');
        }
      });

      room.on(RoomEvent.ActiveSpeakersChanged, (speakers: any[]) => {
        if (speakers.length > 0) {
          const isAgent = speakers.some(
            (s) => s.identity.includes('agent') || s.identity.includes('worker'),
          );
          setCallState(isAgent ? 'speaking' : 'listening');
          setStatusText(isAgent ? 'AI Coordinator is speaking…' : 'Listening…');
        }
      });

      room.on(RoomEvent.Disconnected, () => {
        setCallState('idle');
        setStatusText('');
      });

      await room.connect(data.wsUrl || 'wss://avatar-smh2w45h.livekit.cloud', data.token);
      await room.localParticipant.setMicrophoneEnabled(true);

      setCallState('connected');
      setStatusText('Connected to AI Coordinator');
      setShowChat(true);

      // Auto-greeting immediately upon connection
      const greeting =
        'Hello! Welcome to NxtGen Academy by PAVY. I am your AI Coordinator. How can I assist you today with our courses, certifications, internships, or job support?';
      addTranscript('agent', greeting);
      setCallState('speaking');
      checkGoodbye(greeting);
      setTimeout(() => setCallState((c) => (c !== 'idle' ? 'listening' : c)), 3000);
    } catch (err) {
      console.error('Voice connection failed:', err);
      setCallState('idle');
      setStatusText('Connection failed. Try again.');
    }
  };

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || callState === 'idle') return;

    const text = typedMessage.trim();
    setTypedMessage('');
    addTranscript('user', text);
    checkGoodbye(text);

    if (roomRef.current) {
      try {
        const encoder = new TextEncoder();
        await roomRef.current.localParticipant.publishData(encoder.encode(text), { reliable: true });
      } catch (e) {
        console.warn('Data publish warning:', e);
      }
    }

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
          : `Thank you for your inquiry regarding "${text}". Our admissions team will guide you with exact program details.`;

      addTranscript('agent', reply);
      setCallState('speaking');
      checkGoodbye(reply);
      setTimeout(() => setCallState((c) => (c !== 'idle' ? 'listening' : c)), 3500);
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
  const barScales = [0.4, 0.8, 1.2, 0.6, 1.4, 0.9, 1.1, 0.5, 1.2, 0.7];

  return (
    <>
      {/* ── FLOATING ACTION BUTTON ── */}
      {!open && (
        <button
          id="voice-agent-widget-btn"
          type="button"
          onClick={() => setOpen(true)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          aria-label="Talk to NxtGen AI Coordinator"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #F59E0B 0%, #EA580C 100%)',
            boxShadow: hovered
              ? '0 6px 28px rgba(245,158,11,0.55), 0 0 0 4px rgba(245,158,11,0.18)'
              : '0 4px 18px rgba(245,158,11,0.35)',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(.4,0,.2,1)',
            transform: hovered ? 'scale(1.12)' : 'scale(1)',
            position: 'relative',
            color: '#fff',
          }}
        >
          <Headphones size={26} />

          {/* Tooltip */}
          <span
            style={{
              position: 'absolute',
              right: 68,
              top: '50%',
              transform: 'translateY(-50%)',
              whiteSpace: 'nowrap',
              background: 'rgba(0,0,0,0.85)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              padding: '6px 12px',
              borderRadius: 8,
              pointerEvents: 'none',
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.2s ease',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            Talk to AI Coordinator
          </span>

          {/* Pulse ring */}
          <span
            style={{
              position: 'absolute',
              inset: -4,
              borderRadius: '50%',
              border: '2px solid rgba(245,158,11,0.4)',
              animation: 'voicePulseRing 2s ease-out infinite',
            }}
          />
        </button>
      )}

      {/* ── POPUP CARD (600px x 500px) ── */}
      {open && (
        <div
          id="voice-agent-widget-popup"
          style={{
            width: 600,
            height: 500,
            borderRadius: 20,
            overflow: 'hidden',
            background: 'rgba(12,12,16,0.96)',
            border: '1px solid rgba(245,158,11,0.3)',
            boxShadow: '0 16px 64px rgba(0,0,0,0.7), 0 0 50px rgba(245,158,11,0.18)',
            backdropFilter: 'blur(24px)',
            display: 'flex',
            flexDirection: 'column',
            animation: 'voiceSlideUp 0.35s cubic-bezier(.4,0,.2,1)',
          }}
        >
          {/* Hidden audio container */}
          <div ref={audioElRef} style={{ display: 'none' }} />

          {/* ── Header Bar ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: isConnected ? '#34D399' : '#FBBF24',
                  boxShadow: isConnected ? '0 0 10px #34D399' : 'none',
                }}
              />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fde68a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                NxtGen AI Coordinator (PAVY)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isConnected && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowChat(!showChat)}
                    title="Toggle Chat"
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      border: '1px solid rgba(255,255,255,0.15)',
                      background: showChat ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)',
                      color: showChat ? '#fde68a' : '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MessageSquare size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={toggleMute}
                    title={isMuted ? 'Unmute' : 'Mute'}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      border: `1px solid ${isMuted ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.15)'}`,
                      background: isMuted ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)',
                      color: isMuted ? '#f87171' : '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isMuted ? <MicOff size={15} /> : <Mic size={15} />}
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  if (isConnected) {
                    roomRef.current?.disconnect?.();
                    roomRef.current = null;
                    setCallState('idle');
                    setStatusText('');
                  }
                  setOpen(false);
                }}
                title="Close"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Body Split layout */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Left side: Receptionist Screen */}
            <div
              style={{
                flex: isConnected && showChat ? '0 0 52%' : '1 0 100%',
                position: 'relative',
                transition: 'flex 0.3s ease',
                overflow: 'hidden',
                background: '#000',
              }}
            >
              <img
                src={agentDisplayImage}
                alt="NxtGen AI Coordinator"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.7s ease',
                  transform: callState === 'speaking' ? 'scale(1.03)' : 'scale(1)',
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/pavy_receptionist.jpg';
                }}
              />

              {/* Gradient overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.3) 100%)',
                  pointerEvents: 'none',
                }}
              />

              {/* Visualizer overlay when connected */}
              {isConnected && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 64,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 3,
                    height: 32,
                  }}
                >
                  {barScales.map((_, i) => (
                    <span
                      key={i}
                      style={{
                        width: 4,
                        borderRadius: 2,
                        background:
                          callState === 'speaking'
                            ? '#FBBF24'
                            : callState === 'listening'
                              ? '#34D399'
                              : 'rgba(255,255,255,0.3)',
                        height:
                          callState === 'speaking'
                            ? `${10 + (i % 5) * 6}px`
                            : callState === 'listening'
                              ? `${6 + (i % 3) * 5}px`
                              : '4px',
                        transition: 'all 0.2s ease',
                        animation:
                          callState === 'speaking'
                            ? `voiceBar 0.6s ease-in-out ${i * 0.08}s infinite alternate`
                            : 'none',
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Start/Stop CTA Button */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 16,
                  left: 0,
                  right: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  zIndex: 10,
                }}
              >
                <button
                  type="button"
                  onClick={handleStartCall}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    borderRadius: 9999,
                    border: `1px solid ${isConnected ? 'rgba(239,68,68,0.6)' : 'rgba(245,158,11,0.6)'}`,
                    background: isConnected
                      ? 'linear-gradient(to right, #DC2626, #E11D48)'
                      : 'linear-gradient(to right, #F59E0B, #EA580C, #F59E0B)',
                    color: '#fff',
                    padding: '12px 28px',
                    cursor: 'pointer',
                    boxShadow: isConnected
                      ? '0 0 24px rgba(225,29,72,0.5)'
                      : '0 0 28px rgba(245,158,11,0.6)',
                    transition: 'all 0.3s ease',
                    fontSize: 12,
                    fontWeight: 800,
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.1em',
                  }}
                >
                  {isConnected ? (
                    <>
                      <StopCircle size={16} />
                      <span>End Call</span>
                    </>
                  ) : (
                    <>
                      <Volume2 size={16} />
                      <span>Talk to PAVY</span>
                    </>
                  )}
                </button>

                {statusText && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#fde68a',
                      marginTop: 6,
                      background: 'rgba(0,0,0,0.65)',
                      padding: '4px 12px',
                      borderRadius: 9999,
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(245,158,11,0.2)',
                    }}
                  >
                    {statusText}
                  </span>
                )}
              </div>
            </div>

            {/* Right side: Interactive Chat Drawer */}
            {isConnected && showChat && (
              <div
                style={{
                  flex: '0 0 48%',
                  borderLeft: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(0,0,0,0.95)',
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: '#FBBF24', letterSpacing: '0.05em' }}>
                  CONVERSATION TRANSCRIPT
                </div>

                {/* Transcript messages */}
                <div
                  ref={chatScrollRef}
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    paddingRight: 4,
                  }}
                >
                  {transcripts.map((t, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: t.speaker === 'user' ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: t.speaker === 'agent' ? '#FBBF24' : '#34D399',
                          }}
                        >
                          {t.speaker === 'agent' ? '👩‍💼 PAVY AI:' : '👤 You:'}
                        </span>
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>{t.timestamp}</span>
                      </div>
                      <div
                        style={{
                          maxWidth: '92%',
                          padding: '9px 13px',
                          borderRadius: 14,
                          lineHeight: 1.45,
                          fontSize: 12,
                          ...(t.speaker === 'agent'
                            ? {
                                background: 'rgba(255,255,255,0.06)',
                                color: '#e2e8f0',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderTopLeftRadius: 4,
                              }
                            : {
                                background: 'linear-gradient(to right, #F59E0B, #EA580C)',
                                color: '#fff',
                                fontWeight: 500,
                                borderTopRightRadius: 4,
                              }),
                        }}
                      >
                        {t.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Text input form */}
                <form
                  onSubmit={handleSendText}
                  style={{
                    display: 'flex',
                    gap: 8,
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    paddingTop: 10,
                  }}
                >
                  <input
                    type="text"
                    placeholder="Type your query…"
                    value={typedMessage}
                    onChange={(e) => setTypedMessage(e.target.value)}
                    style={{
                      flex: 1,
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(255,255,255,0.05)',
                      padding: '9px 12px',
                      fontSize: 12,
                      color: '#fff',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!typedMessage.trim()}
                    style={{
                      padding: '9px 14px',
                      borderRadius: 10,
                      border: 'none',
                      background: 'linear-gradient(to right, #F59E0B, #EA580C)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: typedMessage.trim() ? 'pointer' : 'default',
                      opacity: typedMessage.trim() ? 1 : 0.4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Send size={13} />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Keyframe Animations ── */}
      <style>{`
        @keyframes voiceSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes voicePulseRing {
          0%   { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.6); }
        }
        @keyframes voiceBar {
          0%   { transform: scaleY(1); }
          100% { transform: scaleY(1.8); }
        }
      `}</style>
    </>
  );
}

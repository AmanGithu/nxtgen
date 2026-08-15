import { useState, useRef, useEffect } from 'react';
import { X, Send, ExternalLink, MessageCircle } from 'lucide-react';

const WHATSAPP_NUMBER = '919673000450';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}

export default function WhatsAppWidget() {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      text: 'Hello! 👋 Welcome to NxtGen Academy on WhatsApp! How can we help you today with our courses, certifications, or internships?',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setInput('');

    setMessages((prev) => [...prev, { sender: 'user', text: userMsg, time: now }]);
    setLoading(true);

    try {
      const res = await fetch('/api/whatsapp/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();

      const replyText =
        data.success && data.reply
          ? data.reply
          : 'Thank you for reaching out! You can also chat directly with our representative at +91 96730-04500.';

      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Thank you for your message! Direct chat is also available on WhatsApp.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── FLOATING ACTION BUTTON ── */}
      {!open && (
        <button
          id="whatsapp-widget-btn"
          type="button"
          onClick={() => setOpen(true)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          aria-label="Chat on WhatsApp"
          className="whatsapp-fab"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
            boxShadow: hovered
              ? '0 6px 28px rgba(37,211,102,0.55), 0 0 0 4px rgba(37,211,102,0.18)'
              : '0 4px 18px rgba(37,211,102,0.35)',
            cursor: 'pointer',
            border: 'none',
            transition: 'all 0.3s cubic-bezier(.4,0,.2,1)',
            transform: hovered ? 'scale(1.12)' : 'scale(1)',
            position: 'relative',
            color: '#fff',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>

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
            Chat on WhatsApp
          </span>
        </button>
      )}

      {/* ── WHATSAPP CHAT WINDOW ── */}
      {open && (
        <div
          id="whatsapp-chat-window"
          style={{
            width: 360,
            height: 480,
            borderRadius: 16,
            overflow: 'hidden',
            background: '#0b141a',
            border: '1px solid rgba(37,211,102,0.3)',
            boxShadow: '0 12px 48px rgba(0,0,0,0.7), 0 0 30px rgba(37,211,102,0.15)',
            display: 'flex',
            flexDirection: 'column',
            animation: 'waSlideUp 0.3s cubic-bezier(.4,0,.2,1)',
          }}
        >
          {/* Header */}
          <div
            style={{
              background: '#1f2c34',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <MessageCircle size={20} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#e9edef' }}>
                  NxtGen Academy
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00a884' }} />
                  <span style={{ fontSize: 11, color: '#8696a0' }}>Online • WhatsApp Automaton</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#8696a0',
                cursor: 'pointer',
                padding: 4,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Banner CTA to launch WhatsApp app */}
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#00a884',
              color: '#111b21',
              padding: '8px 16px',
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              textDecoration: 'none',
              transition: 'background 0.2s',
            }}
          >
            <span>Open in WhatsApp App (+91 96730-04500)</span>
            <ExternalLink size={13} />
          </a>

          {/* Message Area */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              padding: 14,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 0)',
              backgroundSize: '16px 16px',
            }}
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  background: m.sender === 'user' ? '#005c4b' : '#202c33',
                  color: '#e9edef',
                  borderRadius: m.sender === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  padding: '8px 12px',
                  fontSize: 12,
                  lineHeight: 1.45,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                }}
              >
                <div>{m.text}</div>
                <div
                  style={{
                    fontSize: 9,
                    color: '#8696a0',
                    textAlign: 'right',
                    marginTop: 4,
                  }}
                >
                  {m.time}
                </div>
              </div>
            ))}

            {loading && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  background: '#202c33',
                  color: '#8696a0',
                  borderRadius: 12,
                  padding: '8px 14px',
                  fontSize: 12,
                  fontStyle: 'italic',
                }}
              >
                Typing response…
              </div>
            )}
          </div>

          {/* Input Form */}
          <form
            onSubmit={handleSend}
            style={{
              background: '#202c33',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <input
              type="text"
              placeholder="Type a message…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{
                flex: 1,
                background: '#2a3942',
                border: 'none',
                borderRadius: 8,
                padding: '9px 14px',
                fontSize: 13,
                color: '#e9edef',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              style={{
                background: '#00a884',
                border: 'none',
                borderRadius: '50%',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#111b21',
                cursor: input.trim() && !loading ? 'pointer' : 'default',
                opacity: input.trim() && !loading ? 1 : 0.5,
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes waSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, Copy, Download, Sliders, Volume2 } from 'lucide-react';

// The real-time service is deployed separately from the REST API (Render/VPS),
// so it gets its own env var rather than being derived from VITE_API_URL.
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws/i-assist';

const IAssistTeleprompter = () => {
  const [isListening, setIsListening] = useState(false);
  const [fontSize, setFontSize] = useState(18);
  const [transcripts, setTranscripts] = useState<string[]>([
    'Interviewer: Welcome to the technical interview round.',
    'Interviewer: Can you explain how you handle race conditions and deadlocks in multi-agent vector search pipelines?'
  ]);

  const [activeStarHint, setActiveStarHint] = useState({
    questionDetected: 'How do you handle race conditions in vector search pipelines?',
    starHint: {
      situation: 'Handling peak write loads across distributed vector index shards.',
      action: 'Implemented strict lock ordering, optimistic concurrency control, and exponential backoff retries.',
      result: 'Reduced deadlock incidents by 95% and improved transaction throughput by 30%.'
    }
  });

  const wsRef = useRef<WebSocket | null>(null);

  // Initialize WebSocket connection to /ws/i-assist
  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => console.log('Connected to I-Assist WebSocket');
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'STAR_HINT_UPDATE') {
          setActiveStarHint(payload.data);
        }
      } catch (err) {
        console.error('WS parse error:', err);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  // Simulate Speech Recognition streaming
  useEffect(() => {
    let interval: any;
    if (isListening) {
      const simulatedQuestions = [
        'Interviewer: How do you design high-availability database replication across hybrid cloud environments?',
        'Interviewer: Describe a situation where you had to optimize slow SQL queries under strict SLA limits.',
        'Interviewer: What is your approach to fine-tuning LLMs with LoRA and QLoRA for domain-specific tasks?'
      ];

      let idx = 0;
      interval = setInterval(() => {
        const nextQ = simulatedQuestions[idx % simulatedQuestions.length];
        setTranscripts(prev => [...prev, nextQ]);

        // Send via WebSocket to server
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'SPEECH_CHUNK',
            transcript: nextQ,
            roleContext: 'Senior AI & Database Architect'
          }));
        }

        idx++;
      }, 7000);
    }

    return () => clearInterval(interval);
  }, [isListening]);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-bg-canvas text-strong">
      
      {/* Top Teleprompter Toolbar */}
      <div className="flex h-16 items-center justify-between border-b border-line bg-bg-surface px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsListening(!isListening)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all shadow-md ${
              isListening ? 'bg-red-500 animate-pulse text-on-brand' : 'bg-brand-orange text-on-brand hover:bg-brand-orange/90'
            }`}
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            <span>{isListening ? 'Stop Listening' : 'Start I-Assist Listening'}</span>
          </button>

          {isListening && (
            <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-[10px] font-semibold text-green-400 border border-green-500/30">
              <Volume2 size={12} /> Live Speech Streaming Active
            </div>
          )}
        </div>

        {/* Font Size & Export Toolbar */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <Sliders size={14} />
            <span>Font Size: {fontSize}px</span>
            <input
              type="range" min={14} max={28} value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-24 accent-brand-orange cursor-pointer"
            />
          </div>

          <button
            onClick={() => navigator.clipboard.writeText(transcripts.join('\n'))}
            className="flex items-center gap-1.5 text-xs text-brand-orange hover:underline font-semibold"
          >
            <Copy size={14} /> Copy Full Transcript
          </button>
        </div>
      </div>

      {/* Main 2-Pane Split Workspace */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Pane (55%): Live Speech Transcript Teleprompter */}
        <div className="flex-1 border-r border-line p-6 overflow-y-auto space-y-4">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Live Interview Speech Stream</span>

          <div className="space-y-4">
            {transcripts.map((t, idx) => (
              <div key={idx} className="rounded-lg border border-line-subtle bg-bg-surface p-4 shadow-sm">
                <p className="font-sans leading-relaxed text-strong" style={{ fontSize: `${fontSize}px` }}>
                  {t}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane (45%): Glowing AI STAR Answer Hint Co-Pilot */}
        <div className="w-[450px] bg-bg-surface p-6 overflow-y-auto space-y-6">
          <div className="flex items-center gap-2 border-b border-line pb-3">
            <Sparkles className="text-brand-orange animate-pulse" size={20} />
            <h3 className="font-display text-base font-bold text-strong">Live STAR Co-Pilot Hint</h3>
          </div>

          {activeStarHint && (
            <div className="space-y-4 rounded-xl border-2 border-brand-orange/60 bg-gradient-to-b from-brand-orange/10 via-bg-card to-bg-card p-5 shadow-xl">
              
              <div>
                <span className="text-[10px] font-bold text-brand-orange uppercase">Detected Question</span>
                <p className="text-xs font-semibold text-strong mt-1">{activeStarHint.questionDetected}</p>
              </div>

              {/* STAR Cards */}
              <div className="space-y-3 pt-2 text-xs">
                <div className="rounded-lg bg-bg-canvas p-3 border border-yellow-500/30">
                  <span className="font-bold text-yellow-400 block mb-1">S — Situation Context</span>
                  <p className="text-text-muted">{activeStarHint.starHint.situation}</p>
                </div>

                <div className="rounded-lg bg-bg-canvas p-3 border border-blue-500/30">
                  <span className="font-bold text-blue-400 block mb-1">A — Technical Action</span>
                  <p className="text-text-muted">{activeStarHint.starHint.action}</p>
                </div>

                <div className="rounded-lg bg-bg-canvas p-3 border border-green-500/30">
                  <span className="font-bold text-green-400 block mb-1">R — Quantifiable Result</span>
                  <p className="text-text-muted">{activeStarHint.starHint.result}</p>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default IAssistTeleprompter;

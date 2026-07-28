import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { aiService } from '../services/aiService';

export function setupWebSocketServer(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: '/ws/i-assist' });

  console.log('⚡ Real-time WebSocket server attached at /ws/i-assist');

  wss.on('connection', (ws: WebSocket) => {
    console.log('📡 Client connected to I-Assist real-time WebSocket');

    ws.on('message', async (message: Buffer | string) => {
      try {
        const payload = JSON.parse(message.toString());

        if (payload.type === 'SPEECH_CHUNK') {
          const { transcript, roleContext } = payload;
          console.log(`[WS I-Assist Speech]: "${transcript}"`);

          // Call Gemini AI to generate live STAR hint card
          const prompt = `You are a real-time AI interview co-pilot (I-Assist). The interviewer just said:
"${transcript}"

Context: Candidate applying for "${roleContext || 'Senior AI Engineer'}".

Generate a 2-sentence STAR answer hint card for the candidate to read on their teleprompter screen.
Return JSON format:
{
  "questionDetected": "<extracted core question>",
  "starHint": {
    "situation": "<brief situation>",
    "action": "<technical action>",
    "result": "<quantifiable metric result>"
  }
}`;

          try {
            const starResponse = await aiService.generateJSON(prompt);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'STAR_HINT_UPDATE',
                data: starResponse,
                timestamp: new Date().toISOString()
              }));
            }
          } catch (aiErr) {
            // Fallback hint generator
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'STAR_HINT_UPDATE',
                data: {
                  questionDetected: transcript,
                  starHint: {
                    situation: 'Handling production incidents under high concurrency load.',
                    action: 'Architected distributed caching and decoupled async worker queues.',
                    result: 'Reduced query latency by 45% and eliminated deadlocks.'
                  }
                },
                timestamp: new Date().toISOString()
              }));
            }
          }
        }
      } catch (err) {
        console.error('WebSocket message handling error:', err);
      }
    });

    ws.on('close', () => {
      console.log('🔌 Client disconnected from I-Assist WebSocket');
    });
  });
}

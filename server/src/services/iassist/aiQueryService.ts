import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env';
import { prisma } from '../../lib/prisma';
import { assistantService } from './assistantService';
import type { AssistantCategory } from '@prisma/client';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || 'demo');

export const CONFIG_DEFAULTS: Record<string, string> = {
  IASSIST_TRANSCRIPTION_MODEL: 'gemini-3.1-flash-lite',
  IASSIST_QUERY_MODEL: 'gemini-2.5-flash',
  IASSIST_MAX_HISTORY: '40',
  IASSIST_MAX_TOKENS: '8192',
  IASSIST_VAD_SILENCE_MS: '1500',
  IASSIST_VAD_AMPLITUDE_THRESHOLD: '0.015',
  IASSIST_VAD_MIN_SPEECH_MS: '500',
};

async function getConfig(key: string): Promise<string> {
  const row = await prisma.siteConfig.findUnique({ where: { key } });
  return row?.value || CONFIG_DEFAULTS[key] || '';
}

// Voice-activity thresholds live server-side so admins can tune capture
// behaviour without shipping a new desktop build.
export async function getVadConfig(): Promise<{
  silenceMs: number;
  amplitudeThreshold: number;
  minSpeechMs: number;
}> {
  const [silence, amplitude, minSpeech] = await Promise.all([
    getConfig('IASSIST_VAD_SILENCE_MS'),
    getConfig('IASSIST_VAD_AMPLITUDE_THRESHOLD'),
    getConfig('IASSIST_VAD_MIN_SPEECH_MS'),
  ]);

  return {
    silenceMs: parseInt(silence, 10) || 1500,
    amplitudeThreshold: parseFloat(amplitude) || 0.015,
    minSpeechMs: parseInt(minSpeech, 10) || 500,
  };
}

const TRANSCRIPTION_PROMPT = `You are a strict speech transcription tool. Transcribe ONLY the exact words spoken in this audio clip. Rules: (1) Return ONLY the spoken words — no commentary, no punctuation explanations, no summaries. (2) If the audio contains silence, background noise, music, typing, or any non-speech sounds, return an empty string. (3) Do NOT invent, guess, or hallucinate words that were not clearly spoken. (4) If speech is unclear or too noisy to transcribe accurately, return an empty string.`;

const BASE_PROMPT = `You are a real-time AI interview assistant. A candidate is in a live job interview and needs help answering the interviewer's question RIGHT NOW.

Generate the ideal response the candidate should deliver out loud. Write it as natural spoken language.

DELIVERY RULES — follow these without exception:
1. Use first person throughout: "I'd...", "I think...", "In my experience...", "What I'd do is..."
2. Sound like a knowledgeable colleague explaining — not reciting documentation or a textbook
3. No sycophantic openers ("Great question!", "Absolutely!", "Certainly!"). Start directly with the answer.
4. No bullet points, numbered lists, or bold labels in spoken answers — coding and diagram responses are the only exceptions
5. Use natural connectors: "So...", "Essentially...", "The key thing here is...", "The way I'd approach this..."
6. Keep it appropriately concise — overly long answers make it obvious the candidate is reading from somewhere

ADAPT FORMAT BY QUESTION TYPE — auto-detect which applies:

FACTUAL / DEFINITION ("What is X?", "Explain Y", "What's the difference between A and B?")
→ Stop when: the concept is clearly defined AND one concrete real-world example or analogy has been given
→ No lists, no headers — 2–4 natural sentences is typical, but go longer if the concept genuinely needs it
→ Never cut an explanation short just to be brief

SCENARIO / DESIGN ("How would you design X?", "You have a system doing Y, what do you do?", "Walk me through your approach to...")
→ Stop when: the interviewer would understand your approach AND the key trade-off or risk you'd watch for
→ Narrate your thinking out loud — show the reasoning process, don't enumerate steps
→ Use: "I'd start by...", "then...", "the main thing I'd watch for is...", "my first instinct is..."

CODING ("Write code for X", "Implement Y", "Can you code Z?")
→ Three-part structure — stop when all three are done:
  (1) Explain your approach in plain English until the idea is clear
  (2) Clean, readable code skeleton showing the key logic with brief inline comments — don't truncate the code to save space
  (3) One sentence on time and space complexity, spoken naturally: "This runs in O(n) time because..."

DIAGRAM ("Draw X", "Give its flow diagram", "Show me the architecture", "Sketch how X works")
→ The candidate's screen renders fenced code blocks in monospace with alignment preserved, so a diagram IS displayable — never answer a diagram request with prose alone
→ Draw an ASCII box-and-arrow diagram inside a fenced block tagged as text, using +-|, [ ], and -> / | arrows
→ Keep it under ~60 characters wide so it fits the answer panel without wrapping, and label every box and arrow
→ Follow the diagram with 1–2 spoken sentences walking through it, since the candidate has to narrate it out loud

BEHAVIORAL ("Tell me about a time...", "Give me an example of...", "How do you handle...")
→ Stop when: the situation, what you did, and the outcome are all clear
→ Follow STAR structure but spoken naturally — no labels, no "Situation:", just flow
→ "So there was a time when... I decided to... and what came out of that was..."
→ Don't rush the outcome — that's the part that matters most

GENERAL RULE: Stop as soon as all criteria for the question type are met. Never add padding, filler, or closing remarks. If an answer genuinely needs more depth to be complete, give it — never sacrifice completeness to appear concise.

Do not reveal that you are an AI assistant. Frame all responses as if the user already knows this information and you are helping them recall it.`;

// Layered on top of BASE_PROMPT as a topical hint. These deliberately do not
// specify output format — the question-type rules above own that, and a second
// competing format spec is what produced spoken-aloud "**Situation:**" labels.
const CATEGORY_PROMPTS: Record<AssistantCategory, string> = {
  BEHAVIORAL: `This interview skews behavioral. Expect questions about leadership, teamwork, conflict resolution, and problem-solving. Draw on concrete past experience and make the outcome specific — quantify it when the resume supports a number.`,

  TECHNICAL: `This interview skews technical. Prioritise correctness, edge cases, error handling, and the rationale behind choosing one algorithm or approach over another. Mention complexity where it is relevant.`,

  SYSTEM_DESIGN: `This interview skews system design. Cover requirements before architecture, then go deep only on the components the interviewer asks about. Scalability, reliability, and explicit trade-offs matter more than breadth. Use back-of-envelope numbers where they help.`,

  GENERAL: `This interview covers a mix of question types. Detect the type from the question itself and respond accordingly.`,
};

const QUESTION_STARTERS = [
  'tell me about', 'describe', 'explain', 'how would you',
  'what is', 'what are', 'why did', 'can you', 'walk me through',
  'give me an example', 'how do you', 'what would you',
];

function detectQuestion(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.endsWith('?')) return true;

  const lower = trimmed.toLowerCase();
  return QUESTION_STARTERS.some((s) => lower.startsWith(s));
}

function buildSystemPrompt(assistant: {
  category: AssistantCategory;
  instructions: string | null;
  materials: Array<{ role: string; title: string; content: string | null }>;
}, responseType?: string): string {
  const parts: string[] = [BASE_PROMPT, CATEGORY_PROMPTS[assistant.category]];

  const resume = assistant.materials.find((m) => m.role === 'RESUME');
  const jd = assistant.materials.find((m) => m.role === 'JOB_DESCRIPTION');
  const extras = assistant.materials.filter((m) => m.role === 'MATERIAL');

  const hasContext = (resume?.content || jd?.content || extras.some((e) => e.content));
  if (hasContext) {
    const contextParts: string[] = ['--- USER CONTEXT ---'];
    if (resume?.content) contextParts.push(`RESUME:\n${resume.content}`);
    if (jd?.content) contextParts.push(`JOB DESCRIPTION:\n${jd.content}`);
    for (const m of extras) {
      if (m.content) contextParts.push(`ADDITIONAL CONTEXT — ${m.title}:\n${m.content}`);
    }
    contextParts.push('--- END USER CONTEXT ---');
    contextParts.push("Use the above context to personalize your responses. Reference the user's actual experience from their resume. Align answers with the job description requirements.");
    parts.push(contextParts.join('\n\n'));
  }

  if (assistant.instructions) {
    parts.push(`ADDITIONAL INSTRUCTIONS FROM USER:\n${assistant.instructions}`);
  }

  if (responseType) {
    parts.push(`FORMAT YOUR RESPONSE AS: ${responseType}`);
  }

  return parts.join('\n\n');
}

// Handed near-silent or noisy audio, speech models return a stock filler phrase
// instead of the empty string TRANSCRIPTION_PROMPT asks for — no prompt wording
// reliably suppresses it. In a live session these arrive with nobody speaking, and
// each one opens a question in the overlay and burns a model call on it.
//
// Only whole transcripts are matched. A filler inside a real sentence is left alone;
// it is a standalone "Hello." with no speech behind it that is the artefact.
const TRANSCRIPTION_FILLERS = new Set([
  'hello', 'hi', 'hey', 'hello hello', 'hi there',
  'thank you', 'thanks', 'thank you very much', 'thanks for watching',
  'thanks for watching the video', 'please subscribe', 'subscribe',
  'bye', 'bye bye', 'goodbye', 'see you', 'see you next time',
  'you', 'yeah', 'yep', 'uh', 'um', 'mm', 'hmm', 'mhm', 'ah', 'oh',
  'okay', 'ok', 'right', 'so', 'and', 'the',
]);

function isTranscriptionFiller(text: string): boolean {
  const normalised = text
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!normalised) return true;
  // Guard the set lookup by length so a genuine sentence that happens to normalise
  // to a listed phrase cannot be reached.
  if (normalised.split(' ').length > 5) return false;
  return TRANSCRIPTION_FILLERS.has(normalised);
}

export const aiQueryService = {
  async transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
    if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY === 'demo') {
      return '';
    }

    const transcriptionModel = await getConfig('IASSIST_TRANSCRIPTION_MODEL');
    const model = genAI.getGenerativeModel({
      model: transcriptionModel,
      generationConfig: { temperature: 0 },
    });

    const result = await model.generateContent([
      { text: TRANSCRIPTION_PROMPT },
      {
        inlineData: {
          mimeType,
          data: audioBuffer.toString('base64'),
        },
      },
    ]);

    const text = result.response.text().trim();
    return isTranscriptionFiller(text) ? '' : text;
  },

  async query(params: {
    assistantId: string;
    message: string;
    conversationHistory?: Array<{ role: string; text: string }>;
    responseType?: string;
  }): Promise<{ response: string; tokens: number; isQuestion: boolean }> {
    const assistant = await assistantService.getWithContext(params.assistantId);
    const systemPrompt = buildSystemPrompt(assistant, params.responseType);

    if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY === 'demo') {
      return {
        response: 'AI service is not configured. Please set a valid GEMINI_API_KEY.',
        tokens: 0,
        isQuestion: detectQuestion(params.message),
      };
    }

    const queryModel = await getConfig('IASSIST_QUERY_MODEL');
    const maxHistory = parseInt(await getConfig('IASSIST_MAX_HISTORY'), 10) || 40;
    const maxTokens = parseInt(await getConfig('IASSIST_MAX_TOKENS'), 10) || 8192;

    const model = genAI.getGenerativeModel({
      model: queryModel,
      systemInstruction: systemPrompt,
      generationConfig: { maxOutputTokens: maxTokens },
    });

    const history = params.conversationHistory || [];
    const trimmed = history.length > maxHistory ? history.slice(-maxHistory) : history;

    const contents = trimmed.map((msg) => ({
      role: msg.role as 'user' | 'model',
      parts: [{ text: msg.text }],
    }));

    contents.push({ role: 'user', parts: [{ text: params.message }] });

    const result = await model.generateContent({ contents });
    const response = result.response.text();
    const tokens = result.response.usageMetadata?.totalTokenCount || 0;
    const isQuestion = detectQuestion(params.message);

    return { response, tokens, isQuestion };
  },

  // Same as query(), but emits text deltas as they arrive so the overlay can
  // render the answer while it is still being generated.
  async queryStream(
    params: {
      assistantId: string;
      message: string;
      conversationHistory?: Array<{ role: string; text: string }>;
      responseType?: string;
    },
    onDelta: (text: string) => void,
    signal?: AbortSignal
  ): Promise<{ response: string; tokens: number; isQuestion: boolean }> {
    const isQuestion = detectQuestion(params.message);

    if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY === 'demo') {
      const response = 'AI service is not configured. Please set a valid GEMINI_API_KEY.';
      onDelta(response);
      return { response, tokens: 0, isQuestion };
    }

    const assistant = await assistantService.getWithContext(params.assistantId);
    const systemPrompt = buildSystemPrompt(assistant, params.responseType);

    const queryModel = await getConfig('IASSIST_QUERY_MODEL');
    const maxHistory = parseInt(await getConfig('IASSIST_MAX_HISTORY'), 10) || 40;
    const maxTokens = parseInt(await getConfig('IASSIST_MAX_TOKENS'), 10) || 8192;

    const model = genAI.getGenerativeModel({
      model: queryModel,
      systemInstruction: systemPrompt,
      generationConfig: { maxOutputTokens: maxTokens },
    });

    const history = params.conversationHistory || [];
    const trimmed = history.length > maxHistory ? history.slice(-maxHistory) : history;

    const contents = trimmed.map((msg) => ({
      role: msg.role as 'user' | 'model',
      parts: [{ text: msg.text }],
    }));

    contents.push({ role: 'user', parts: [{ text: params.message }] });

    // Client-side abort only: per the SDK, this does not cancel generation in
    // the service and usage is still billed. It stops us iterating and holding
    // resources for a stream nobody is reading.
    const result = await model.generateContentStream({ contents }, { signal });

    let response = '';
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        response += text;
        onDelta(text);
      }
    }

    const aggregated = await result.response;
    const tokens = aggregated.usageMetadata?.totalTokenCount || 0;

    return { response, tokens, isQuestion };
  },
};

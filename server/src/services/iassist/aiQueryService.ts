import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env';
import { prisma } from '../../lib/prisma';
import { assistantService } from './assistantService';
import type { AssistantCategory } from '@prisma/client';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || 'demo');

const CONFIG_DEFAULTS: Record<string, string> = {
  IASSIST_TRANSCRIPTION_MODEL: 'gemini-2.0-flash',
  IASSIST_QUERY_MODEL: 'gemini-2.5-flash',
  IASSIST_MAX_HISTORY: '40',
  IASSIST_MAX_TOKENS: '8192',
};

async function getConfig(key: string): Promise<string> {
  const row = await prisma.siteConfig.findUnique({ where: { key } });
  return row?.value || CONFIG_DEFAULTS[key] || '';
}

const BASE_PROMPT = `You are an AI interview co-pilot helping the user prepare for job interviews. You are listening to a live interview and providing real-time assistance.

Keep responses concise and actionable. The user is in a live interview — they need quick, usable answers, not essays.

Do not reveal that you are an AI assistant. Frame all responses as if the user already knows this information and you are helping them recall it.`;

const CATEGORY_PROMPTS: Record<AssistantCategory, string> = {
  BEHAVIORAL: `This is a behavioral interview. Structure your responses using the STAR format:
- **Situation:** Set the context
- **Task:** Describe your responsibility
- **Action:** Explain what you did (use "I", not "we")
- **Result:** Quantify the outcome with metrics when possible

Focus on leadership, teamwork, conflict resolution, and problem-solving examples.`,

  TECHNICAL: `This is a technical interview. Focus on:
- Clear, correct code explanations
- Time and space complexity analysis
- Edge cases and error handling
- Algorithm selection rationale

Use concise code snippets when helpful. Explain trade-offs between approaches.`,

  SYSTEM_DESIGN: `This is a system design interview. Structure responses around:
- Requirements clarification (functional + non-functional)
- High-level architecture
- Component deep-dives
- Scalability, reliability, and trade-offs
- Back-of-envelope calculations when relevant

Start broad, then drill into the components the interviewer asks about.`,

  GENERAL: `Adapt your response format to match the question type. Use STAR format for behavioral questions, code snippets for technical questions, and structured breakdowns for system design questions.`,
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

export const aiQueryService = {
  async transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
    if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY === 'demo') {
      return '';
    }

    const transcriptionModel = await getConfig('IASSIST_TRANSCRIPTION_MODEL');
    const model = genAI.getGenerativeModel({ model: transcriptionModel });

    const result = await model.generateContent([
      {
        text: 'Transcribe the following audio. Return only the transcribed text, nothing else. If no speech is detected, return an empty string.',
      },
      {
        inlineData: {
          mimeType,
          data: audioBuffer.toString('base64'),
        },
      },
    ]);

    return result.response.text().trim();
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
};

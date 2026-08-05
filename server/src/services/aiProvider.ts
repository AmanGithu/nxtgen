import { aiService } from './aiService';
import { logger } from '../lib/logger';

export interface AIQueryOptions {
  json?: boolean;
  temperature?: number;
}

export interface AIQueryResult {
  answer: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
}

interface ChatMessage {
  role: string;
  content: string;
}

/**
 * Adapter that gives the ported resume services the provider-agnostic `query`
 * surface they expect, backed by NxtGen's own Gemini service.
 *
 * Delegating to `aiService.generateText` rather than calling Gemini directly
 * means the resume tools inherit its model config and its deterministic
 * fallback, so they work before a real GEMINI_API_KEY is configured and start
 * producing live output the moment one is.
 */
export class AIService {
  async query(
    _provider: string,
    model: string,
    messages: ChatMessage[],
    _apiKey?: string,
    options?: AIQueryOptions
  ): Promise<AIQueryResult> {
    const system = messages.find((m) => m.role === 'system')?.content ?? '';
    const user = messages
      .filter((m) => m.role !== 'system')
      .map((m) => m.content)
      .join('\n\n');

    const prompt = [system, user].filter(Boolean).join('\n\n');
    const answer = await aiService.generateText(
      options?.json ? `${prompt}\n\nRespond ONLY with valid, raw JSON.` : prompt,
      model
    );

    // The underlying SDK call doesn't surface token counts; report zeros so
    // callers that log usage keep working without inventing numbers.
    logger.debug(`[aiProvider] model=${model} json=${!!options?.json}`);
    return {
      answer,
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
    };
  }
}

import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { enqueueAiTask } from '../lib/aiQueue';

const apiKey = env.GEMINI_API_KEY || 'demo';
const genAI = new GoogleGenerativeAI(apiKey);

const PRIMARY_MODEL = env.GEMINI_PRIMARY_MODEL || 'gemini-1.5-flash';
const FALLBACK_MODEL = env.GEMINI_FALLBACK_MODEL || 'gemini-1.5-pro';

export const aiService = {
  /**
   * Helper to execute Gemini prompts with automatic fallback
   */
  async generateText(prompt: string, modelName: string = PRIMARY_MODEL): Promise<string> {
    if (!env.GEMINI_API_KEY || env.GEMINI_API_KEY === 'your-gemini-api-key' || env.GEMINI_API_KEY === 'demo') {
      console.log('Gemini API key is placeholder; using deterministic fallback responder.');
      return this.getFallbackTextResponse(prompt);
    }

    // Every Gemini call in the app reaches this method, so the queue is
    // applied here once rather than at each of the ~15 call sites. It caps
    // concurrency and retries 429/503s with backoff before we give up and
    // try the fallback model.
    try {
      return await enqueueAiTask(`generateText:${modelName}`, async () => {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      });
    } catch (primaryError) {
      console.warn(`Primary Gemini model (${modelName}) failed, attempting fallback (${FALLBACK_MODEL}):`, primaryError);
      try {
        return await enqueueAiTask(`generateText:${FALLBACK_MODEL}`, async () => {
          const fallbackModel = genAI.getGenerativeModel({ model: FALLBACK_MODEL });
          const result = await fallbackModel.generateContent(prompt);
          const response = await result.response;
          return response.text();
        });
      } catch (fallbackError) {
        console.error('All Gemini AI model attempts failed, falling back to mock generator:', fallbackError);
        return this.getFallbackTextResponse(prompt);
      }
    }
  },

  /**
   * Helper to parse clean JSON from Gemini output
   */
  async generateJSON<T>(prompt: string): Promise<T> {
    const rawText = await this.generateText(`${prompt}\n\nIMPORTANT: Respond ONLY with valid, raw JSON.`);
    const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
      return JSON.parse(cleaned) as T;
    } catch (err) {
      console.error('Failed to parse Gemini JSON output:', cleaned);
      throw new Error('AI output parsing error.');
    }
  },

  getFallbackTextResponse(prompt: string): string {
    if (prompt.includes('Enhance the following resume bullet')) {
      return 'Architected high-throughput RAG retrieval pipelines reducing query latency by 45% for enterprise clients.';
    }
    if (prompt.includes('ATS')) {
      return JSON.stringify({
        score: 88,
        formattingScore: 92,
        keywordScore: 82,
        sectionScore: 90,
        missingKeywords: ['RAG', 'LangChain', 'Vector Database', 'PEFT', 'LoRA'],
        summaryFeedback: 'Excellent single-column layout with high keyword density. Recommend adding specific vector database names (Pinecone/Chroma).'
      });
    }
    if (prompt.includes('Compare this Candidate Resume')) {
      return JSON.stringify({
        matchPercentage: 78,
        matchedKeywords: ['PyTorch', 'REST APIs', 'SQL'],
        missingKeywords: ['RAG Pipelines', 'LangGraph', 'Pinecone', 'Multi-Agent Systems'],
        suggestedBulletInjections: [
          'Architected RAG pipelines and vector retrieval engines using Pinecone, improving document retrieval accuracy by 40%.',
          'Orchestrated multi-agent stateful graphs with LangGraph for autonomous workflow execution.'
        ]
      });
    }
    if (prompt.includes('Cover Letter')) {
      return JSON.stringify({
        coverLetterText: 'Dear Hiring Manager,\n\nI am writing to express my strong interest in the Senior AI Engineer position. With over 6 years of experience architecting multi-agent AI systems, high-throughput RAG pipelines, and vector search databases, I am eager to contribute to your core AI alignment and engineering teams.\n\nThank you for your consideration.\n\nSincerely,\nJohn Doe',
        wordCount: 185
      });
    }
    if (prompt.includes('LinkedIn')) {
      return JSON.stringify({
        headlineScore: 90,
        aboutScore: 75,
        experienceScore: 85,
        keywordScore: 78,
        overallScore: 82,
        suggestedHeadlines: [
          'Senior AI Engineer | Building Scalable RAG Pipelines & Multi-Agent Swarms | PyTorch & LangGraph Specialist',
          'Lead AI Systems Architect | Generative AI & Vector Search (Pinecone/Chroma)'
        ],
        summaryRecommendations: ['Add quantifiable metric benchmarks', 'Highlight vector database tools']
      });
    }
    if (prompt.includes('Interview Prep')) {
      return JSON.stringify({
        questions: [
          {
            id: 1,
            category: 'Technical',
            question: 'How do you handle race conditions and deadlocks in complex distributed vector databases?',
            starAnswer: {
              situation: 'Describe a production deadlock incident involving multi-threaded vector indexing under peak write loads.',
              action: 'Implemented strict lock ordering, configured read-committed isolation levels, and added exponential backoff retry logic.',
              result: 'Reduced deadlock incidents by 95% and improved transaction throughput by 30% under peak load.'
            }
          }
        ]
      });
    }
    /* Last resort. The old catch-all returned '{"status":"ok"}', which got
       written straight into a user's résumé when the model was unavailable.
       Never emit JSON here: callers that want structured data go through
       generateJSON, and everything else renders this as prose. */
    if (/summary|profile|about/i.test(prompt)) {
      return 'Experienced professional with a track record of delivering measurable results. ' +
        'Add two or three sentences describing what you do, who you do it for, and your strongest outcome.';
    }
    return 'The AI service is unavailable right now — please try again in a moment.';
  },

  async enhanceBulletPoint(bullet: string, mode: 'stronger' | 'shorten' | 'metrics' = 'stronger'): Promise<string> {
    const prompt = `You are an expert executive resume writer. Enhance the following resume bullet point using strong action verbs, technical clarity, and quantitative metric impact.
Mode: ${mode}
Original Bullet: "${bullet}"
Provide ONLY the single improved bullet point without extra commentary or quote marks.`;
    return (await this.generateText(prompt)).trim();
  },

  async calculateATSScore(resumeText: string, jobDescription?: string): Promise<{
    score: number;
    formattingScore: number;
    keywordScore: number;
    sectionScore: number;
    missingKeywords: string[];
    summaryFeedback: string;
  }> {
    const prompt = `Analyze the following resume text against ATS rules ${jobDescription ? 'and JD' : ''}.\nResume Text:\n"""${resumeText.substring(0, 4000)}"""\nEvaluate ATS score.`;
    return this.generateJSON(prompt);
  },

  async tailorResumeToJD(resumeText: string, jobDescription: string): Promise<{
    matchPercentage: number;
    missingKeywords: string[];
    suggestedBulletInjections: string[];
    matchedKeywords: string[];
  }> {
    const prompt = `Compare this Candidate Resume against the Job Description.\nResume:\n"""${resumeText.substring(0, 4000)}"""\nJD:\n"""${jobDescription.substring(0, 3000)}"""`;
    return this.generateJSON(prompt);
  },

  async generateCoverLetter(resumeText: string, targetRole: string, companyName: string, jobDescription?: string): Promise<{
    coverLetterText: string;
    wordCount: number;
  }> {
    const prompt = `Write a Cover Letter for "${targetRole}" at "${companyName}".\nResume:\n"""${resumeText.substring(0, 3000)}"""`;
    return this.generateJSON(prompt);
  },

  async analyseLinkedInProfile(profileText: string): Promise<{
    headlineScore: number;
    aboutScore: number;
    experienceScore: number;
    keywordScore: number;
    overallScore: number;
    suggestedHeadlines: string[];
    summaryRecommendations: string[];
  }> {
    const prompt = `Analyze this LinkedIn profile text.\nProfile:\n"""${profileText.substring(0, 4000)}"""`;
    return this.generateJSON(prompt);
  },

  async generateInterviewPrepKit(resumeText: string, jobDescription: string): Promise<{
    questions: Array<{
      id: number;
      category: 'Technical' | 'Behavioral' | 'Architecture' | 'Problem Solving' | 'Leadership';
      question: string;
      starAnswer: {
        situation: string;
        action: string;
        result: string;
      };
    }>;
  }> {
    const prompt = `Generate an Interview Prep Deck for Resume:\n"""${resumeText.substring(0, 3000)}"""\nJD:\n"""${jobDescription.substring(0, 2000)}"""`;
    return this.generateJSON(prompt);
  }
};

import { Router, Request, Response, NextFunction } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';

const router = Router();

/* ─────────────────────────────────────────────────────────────────────────────
 * Meta WhatsApp Cloud API Webhook
 *
 * Handles two responsibilities:
 * 1. GET  /api/whatsapp/webhook — subscription verification (hub.challenge)
 * 2. POST /api/whatsapp/webhook — incoming message handler → AI auto-reply
 *
 * Required environment variables:
 *   WHATSAPP_VERIFY_TOKEN      — arbitrary string matching Meta's dashboard
 *   WHATSAPP_ACCESS_TOKEN      — Meta system-user / page token
 *   WHATSAPP_PHONE_NUMBER_ID   — Meta-assigned phone-number id
 * ───────────────────────────────────────────────────────────────────────────── */

const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'nxtgen_whatsapp_verify_2024';
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';

const WHATSAPP_SYSTEM_PROMPT_FALLBACK = `You are NxtGen Academy's WhatsApp AI Assistant. You respond to prospective students and professionals inquiring about academy services via WhatsApp.

=== BRAND & SERVICES KNOWLEDGE ===
- Company: NxtGen Academy — a flagship product by PAVY Consultancy Services Pvt Ltd
- Mission: "Where Careers Are Born, Not Found."

INDIVIDUAL SERVICES:
1. Courses: Data Analytics & AI, Database Management, Cyber Security
2. Certifications: Microsoft Azure, AWS, Google Cloud, Cisco, CompTIA, PMI, IBM, Oracle, Red Hat, VMware, Salesforce, Linux Foundation
3. Internships (36-Week Programs): Data Analytics, Generative AI, Agentic AI, Database Management
4. AI Tools Store: AI Resume Builder, ATS Score Checker, JD Resume Tailor, LinkedIn Profile Analyser, Cover Letter Builder, Interview Prep Kit, I-Assist, AI Mock Interview
5. Technical Job Support: Data Analytics & AI, Data Engineering, Database Management

CORPORATE PROGRAMS:
1. Upskilling & Reskilling Training
2. Bulk Enrollments
3. AI & Tech Consulting
4. Custom AI Solutions

=== CONVERSATIONAL RULES ===
1. Respond in short, clear, WhatsApp-friendly messages (2-4 sentences max).
2. Use plain text only — no markdown, no bullet points, no asterisks.
3. Be warm, professional, and helpful.
4. If asked about pricing, say: "Our advisors can share detailed pricing for your specific program. Please visit https://nxtgenacademy.in/connect-us or call us at +91 96730-04500."
5. Always end by asking if there's anything else you can help with.
6. For detailed inquiries, direct them to visit the website at https://nxtgenacademy.in or call +91 96730-04500.`;

/** Fetch the admin-configured WhatsApp system prompt, falling back to hardcoded. */
async function getWhatsAppPrompt(): Promise<string> {
  try {
    const row = await prisma.siteConfig.findUnique({ where: { key: 'WHATSAPP_SYSTEM_PROMPT' } });
    if (row?.value) return row.value;
  } catch (e) {
    console.warn('Failed to fetch WHATSAPP_SYSTEM_PROMPT from DB, using fallback:', e);
  }
  return WHATSAPP_SYSTEM_PROMPT_FALLBACK;
}

/* ─── 1. Webhook Verification (Meta subscription handshake) ─────────────── */
router.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'] as string;
  const token = req.query['hub.verify_token'] as string;
  const challenge = req.query['hub.challenge'] as string;

  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
    console.log('[WhatsApp] Webhook verified successfully');
    return res.status(200).send(challenge);
  }

  console.warn('[WhatsApp] Webhook verification failed — token mismatch');
  res.sendStatus(403);
});

/* ─── 2. Incoming Message Handler ───────────────────────────────────────── */
router.post('/webhook', async (req: Request, res: Response, _next: NextFunction) => {
  // Meta requires 200 within 20 seconds or it retries. Always acknowledge first.
  res.sendStatus(200);

  try {
    const body = req.body;

    // Validate structure — Meta sends various event types
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value?.messages?.length) return; // Not a message event (e.g., status update)

    const message = value.messages[0];
    const senderPhone = message.from; // E.164 format
    const messageType = message.type;

    // Only process text messages
    if (messageType !== 'text') {
      await sendWhatsAppReply(
        senderPhone,
        'Thank you for reaching out to NxtGen Academy! Currently I can only process text messages. Please type your question and I will be happy to help you.'
      );
      return;
    }

    const userText = message.text?.body || '';
    if (!userText.trim()) return;

    console.log(`[WhatsApp] Incoming from ${senderPhone}: "${userText.substring(0, 80)}..."`);

    // Generate AI response
    const aiReply = await generateAIResponse(userText);

    // Send reply back via Meta Cloud API
    await sendWhatsAppReply(senderPhone, aiReply);

    console.log(`[WhatsApp] Replied to ${senderPhone}: "${aiReply.substring(0, 80)}..."`);
  } catch (err) {
    console.error('[WhatsApp] Error processing incoming message:', err);
  }
});

/* ─── 3. On-Site Web Chat Endpoint for WhatsApp Drawer ──────────────────── */
router.post('/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const aiReply = await generateAIResponse(message);
    res.json({ success: true, reply: aiReply });
  } catch (err) {
    next(err);
  }
});

/* ─── AI Response Generation ────────────────────────────────────────────── */
async function generateAIResponse(userMessage: string): Promise<string> {
  const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey || apiKey === 'demo') {
    return `Thank you for reaching out to NxtGen Academy! We offer courses in Data Analytics & AI, Database Management, and Cyber Security, along with certification prep, internships, and AI career tools. For detailed information, please visit https://nxtgenacademy.in or call +91 96730-04500. How can I help you further?`;
  }

  try {
    const systemPrompt = await getWhatsAppPrompt();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(userMessage);
    const reply = result.response.text().trim();

    // Safety: Cap reply length for WhatsApp readability
    if (reply.length > 1000) {
      return reply.substring(0, 997) + '...';
    }

    return reply;
  } catch (err) {
    console.error('[WhatsApp] Gemini API error:', err);
    return `Thank you for your message! Our team is currently unavailable for an instant response. Please visit https://nxtgenacademy.in/connect-us or call us at +91 96730-04500 for immediate assistance.`;
  }
}

/* ─── Send reply via Meta Cloud API ─────────────────────────────────────── */
async function sendWhatsAppReply(to: string, text: string): Promise<void> {
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.warn('[WhatsApp] Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID — skipping reply');
    return;
  }

  const url = `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { preview_url: true, body: text },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error(`[WhatsApp] Meta API error ${response.status}:`, errBody);
    }
  } catch (err) {
    console.error('[WhatsApp] Failed to send reply via Meta API:', err);
  }
}

export default router;

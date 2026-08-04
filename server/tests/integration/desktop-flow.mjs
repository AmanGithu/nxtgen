// Integration test — exercises the desktop app's exact API integration surface
// (auth handoff, session lifecycle, transcript persistence, ownership checks)
// against a live server, mirroring desktop/main.js's BackendService calls.
//
// Usage: npm run test:integration:desktop
// Requires: dev server running (defaults to http://localhost:3001, override with API_BASE_URL)

import crypto from 'crypto';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const BASE = `${process.env.API_BASE_URL || 'http://localhost:3001'}/api`;
const EMAIL = 'iassist-integration-test@nxtgen.local';
const PASSWORD = 'IntegrationTest123!';

async function ensureTestUser() {
  const hash = await bcrypt.hash(PASSWORD, 10);
  await prisma.user.upsert({
    where: { email: EMAIL },
    update: { passwordHash: hash, role: UserRole.STUDENT, mustChangePassword: false },
    create: {
      email: EMAIL,
      passwordHash: hash,
      firstName: 'Integration',
      lastName: 'Test',
      role: UserRole.STUDENT,
      mustChangePassword: false,
    },
  });
}

let passed = 0;
let failed = 0;
const failures = [];

function ok(cond, label, detail) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    failures.push(label);
    console.log(`  ✗ ${label}${detail ? ' — ' + JSON.stringify(detail) : ''}`);
  }
}

async function req(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

async function main() {
  await ensureTestUser();

  console.log('\n=== 1. Web login (as the user would in-browser) ===');
  const login = await req('POST', '/auth/login', { email: EMAIL, password: PASSWORD });
  ok(login.status === 200 && login.data?.tokens?.accessToken, 'web login succeeds', login.data);
  const webToken = login.data?.tokens?.accessToken;

  console.log('\n=== 2. Desktop auth handoff (browser tab → localhost callback) ===');
  const state = crypto.randomBytes(32).toString('hex');

  // Unauthenticated authorize should be rejected
  const unauth = await req('POST', '/iassist/desktop/authorize', { state });
  ok(unauth.status === 401, 'authorize without web session is rejected', unauth.data);

  const authorize = await req('POST', '/iassist/desktop/authorize', { state }, webToken);
  ok(authorize.status === 200 && authorize.data?.code, 'authorize (logged-in) issues one-time code', authorize.data);
  const code = authorize.data?.code;

  // Wrong state should be rejected
  const wrongState = await req('POST', '/iassist/desktop/token', { code, state: crypto.randomBytes(32).toString('hex') });
  ok(wrongState.status === 401, 'token exchange rejects state mismatch', wrongState.data);

  const tokenExchange = await req('POST', '/iassist/desktop/token', { code, state });
  ok(
    tokenExchange.status === 200 && tokenExchange.data?.accessToken && tokenExchange.data?.refreshToken && tokenExchange.data?.user?.email === EMAIL,
    'token exchange returns desktop access + refresh token + user',
    tokenExchange.data
  );
  const desktopToken = tokenExchange.data?.accessToken;
  const desktopRefresh = tokenExchange.data?.refreshToken;

  // Code is single-use — replay must fail
  const replay = await req('POST', '/iassist/desktop/token', { code, state });
  ok(replay.status === 401, 'used code cannot be replayed', replay.data);

  console.log('\n=== 3. Assistant setup (desktop app loads assistants on sign-in) ===');
  const createAssistant = await req('POST', '/iassist/assistants', {
    name: 'Integration Test Assistant',
    category: 'TECHNICAL',
    targetRole: 'Backend Engineer',
    experienceYears: 3,
  }, desktopToken);
  ok(createAssistant.status === 201 && createAssistant.data?.assistant?.id, 'create assistant via desktop token', createAssistant.data);
  const assistantId = createAssistant.data?.assistant?.id;

  const listAssistants = await req('GET', '/iassist/assistants', null, desktopToken);
  ok(
    listAssistants.status === 200 && listAssistants.data?.assistants?.some(a => a.id === assistantId),
    'list assistants includes the new one',
    listAssistants.data
  );

  console.log('\n=== 4. Session lifecycle (start → transcript → end) ===');
  const createSession = await req('POST', '/iassist/sessions', { assistantId, platform: 'desktop' }, desktopToken);
  ok(createSession.status === 201 && createSession.data?.session?.id, 'create session (platform=desktop)', createSession.data);
  const sessionId = createSession.data?.session?.id;

  const badPlatform = await req('POST', '/iassist/sessions', { assistantId, platform: 'web' }, desktopToken);
  ok(badPlatform.status !== 201, 'session creation rejects non-desktop platform', badPlatform.data);

  const addTranscript = await req('POST', `/iassist/sessions/${sessionId}/transcript`, {
    speaker: 'user',
    text: 'Tell me about a time you resolved a production incident.',
    isQuestion: true,
    response: 'Use the **STAR** format: describe the Situation, Task, Action, Result.',
    tokens: 128,
    timestamp: 12,
  }, desktopToken);
  ok(addTranscript.status === 200, 'transcript persisted (fire-and-forget pattern)', addTranscript.data);

  const endSession = await req('PATCH', `/iassist/sessions/${sessionId}/end`, {
    durationSeconds: 245,
    questionsAnswered: 1,
    tokensUsed: 128,
  }, desktopToken);
  ok(endSession.status === 200, 'end session with stats', endSession.data);

  console.log('\n=== 5. Ownership & isolation checks ===');
  // A second user must not be able to touch the first user's session
  const intruderEmail = `iassist-intruder-${Date.now()}@nxtgen.local`;
  const other = await req('POST', '/auth/register', {
    email: intruderEmail,
    password: 'IntruderPass123!',
    firstName: 'Intruder',
    lastName: 'User',
  });
  const intruderToken = other.data?.tokens?.accessToken;
  if (intruderToken) {
    const intrude = await req('POST', `/iassist/sessions/${sessionId}/transcript`, {
      speaker: 'user', text: 'nope',
    }, intruderToken);
    ok(intrude.status === 404, 'foreign user cannot post transcript to session they do not own', intrude.data);
  } else {
    ok(false, 'could not create intruder user to test isolation', other.data);
  }

  console.log('\n=== 6. Read-back consistency (web dashboard reads what desktop wrote) ===');
  const getSession = await req('GET', `/iassist/sessions/${sessionId}`, null, desktopToken);
  const s = getSession.data?.session;
  ok(
    getSession.status === 200 &&
    s?.status === 'COMPLETED' &&
    s?.durationSeconds === 245 &&
    s?.questionsAnswered === 1 &&
    s?.tokensUsed === 128 &&
    s?.transcripts?.length === 1,
    'session detail reflects desktop-reported stats + transcript',
    s
  );

  const analytics = await req('GET', '/iassist/analytics', null, desktopToken);
  ok(
    analytics.status === 200 && analytics.data?.analytics?.totalSessions >= 1,
    'analytics aggregate picks up the completed session',
    analytics.data?.analytics
  );

  console.log('\n=== 7. Refresh token flow (desktop 401 → auto-refresh, as main.js does) ===');
  const refresh = await req('POST', '/auth/refresh', { refreshToken: desktopRefresh });
  ok(refresh.status === 200 && refresh.data?.accessToken, 'refresh token issued at desktop auth exchange is valid', refresh.data);

  console.log('\n=== 8. Sign-out semantics (blocked mid-session in the real app) ===');
  // Not directly testable via HTTP (client-side guard in main.js), but verify
  // an ended session cannot be ended again (mirrors the "no active session" guard).
  const doubleEnd = await req('PATCH', `/iassist/sessions/${sessionId}/end`, {
    durationSeconds: 10, questionsAnswered: 0, tokensUsed: 0,
  }, desktopToken);
  ok(doubleEnd.status === 404, 'ending an already-completed session is rejected (no active session found)', doubleEnd.data);

  console.log('\n=== Cleanup ===');
  const del = await req('DELETE', `/iassist/assistants/${assistantId}`, null, desktopToken);
  ok(del.status === 200, 'cleanup: delete test assistant', del.data);
  await prisma.user.delete({ where: { email: intruderEmail } }).catch(() => {});

  console.log(`\n${'='.repeat(50)}`);
  console.log(`RESULT: ${passed} passed, ${failed} failed`);
  await prisma.$disconnect();
  if (failed > 0) {
    console.log('Failed checks:', failures.join('; '));
    process.exit(1);
  }
}

main().catch(async err => {
  console.error('Fatal error running integration test:', err);
  await prisma.$disconnect();
  process.exit(1);
});

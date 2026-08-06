const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  ipcMain,
  globalShortcut,
  shell,
  screen,
  nativeImage,
  desktopCapturer,
  session: electronSession,
} = require('electron');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const IS_DEV = process.env.IS_DEV === 'true';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const AUTH_FILE = path.join(app.getPath('userData'), 'auth.json');
const SETTINGS_FILE = path.join(app.getPath('userData'), 'settings.json');

function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    }
  } catch {}
  return {};
}

function saveSettings(settings) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
}

function getApiBaseUrl() {
  const settings = loadSettings();
  return settings.apiBaseUrl || process.env.API_BASE_URL || 'http://localhost:3001/api';
}

function getWebAppUrl() {
  const settings = loadSettings();
  return settings.webAppUrl || process.env.WEB_APP_URL || 'http://localhost:5173';
}

// ---------------------------------------------------------------------------
// Logger
// ---------------------------------------------------------------------------

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLogLevel = LOG_LEVELS[LOG_LEVEL] ?? LOG_LEVELS.info;

const logger = {
  debug: (...args) => { if (currentLogLevel <= 0) console.log('[DEBUG]', ...args); },
  info:  (...args) => { if (currentLogLevel <= 1) console.log('[INFO]', ...args); },
  warn:  (...args) => { if (currentLogLevel <= 2) console.warn('[WARN]', ...args); },
  error: (...args) => { if (currentLogLevel <= 3) console.error('[ERROR]', ...args); },
};

// ---------------------------------------------------------------------------
// Auth token persistence
// ---------------------------------------------------------------------------

let authToken = null;
let refreshToken = null;
let currentUser = null;

function loadAuth() {
  try {
    if (fs.existsSync(AUTH_FILE)) {
      const data = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
      authToken = data.accessToken || null;
      refreshToken = data.refreshToken || null;
      currentUser = data.user || null;
      logger.info('Auth loaded for', currentUser?.email);
    }
  } catch (err) {
    logger.error('Failed to load auth', err.message);
  }
}

function saveAuth() {
  const data = { accessToken: authToken, refreshToken, user: currentUser };
  fs.writeFileSync(AUTH_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function clearAuth() {
  authToken = null;
  refreshToken = null;
  currentUser = null;
  try { fs.unlinkSync(AUTH_FILE); } catch {}
}

function isAuthenticated() {
  return !!authToken;
}

// ---------------------------------------------------------------------------
// BackendService — all REST calls to NxtGen
// ---------------------------------------------------------------------------

// The API reports failures as { success: false, message }. Surfacing that message
// instead of a generic one is what lets callers tell "this assistant was deleted"
// apart from "the request failed", so they can react differently.
async function readErrorMessage(response, fallback) {
  try {
    const data = await response.json();
    return data.message || fallback;
  } catch {
    return fallback;
  }
}

function isAssistantGone(err) {
  return /assistant not found/i.test(err?.message || '');
}

// Streaming answers have no natural end-of-request, so these bound it: the idle
// timer covers a stalled model mid-generation, the hard cap a stream that keeps
// trickling forever.
const STREAM_IDLE_TIMEOUT_MS = 30000;
const STREAM_MAX_MS = 120000;

// A transcript row is the only durable record of an exchange — the overlay's copy
// dies with the session window. Losing one to a transient network blip is silent and
// unrecoverable, so writes retry before giving up, and in-flight writes are tracked
// so session teardown can wait for them.
const TRANSCRIPT_WRITE_ATTEMPTS = 3;
const TRANSCRIPT_RETRY_DELAY_MS = 500;
const TRANSCRIPT_FLUSH_TIMEOUT_MS = 5000;
const pendingTranscriptWrites = new Set();

const BackendService = {
  async _fetch(endpoint, options = {}) {
    const url = `${getApiBaseUrl()}${endpoint}`;
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (authToken && options.auth !== false) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    logger.debug(`${options.method || 'GET'} ${url}`);
    const response = await fetch(url, { ...options, headers });

    if (response.status === 401 && options.auth !== false) {
      const refreshed = await this._tryRefresh();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${authToken}`;
        const retry = await fetch(url, { ...options, headers });
        return retry;
      }
      broadcastAuthState();
    }

    return response;
  },

  async _tryRefresh() {
    if (!refreshToken) return false;
    try {
      const url = `${getApiBaseUrl()}/auth/refresh`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) {
        logger.warn('Refresh token rejected, clearing auth');
        clearAuth();
        return false;
      }
      const data = await response.json();
      authToken = data.accessToken;
      saveAuth();
      logger.info('Token refreshed');
      return true;
    } catch (err) {
      logger.error('Token refresh failed', err.message);
      clearAuth();
      return false;
    }
  },

  async getAssistants() {
    const res = await this._fetch('/iassist/assistants');
    if (!res.ok) throw new Error('Failed to fetch assistants');
    const data = await res.json();
    return data.assistants;
  },

  async createSession(assistantId) {
    const res = await this._fetch('/iassist/sessions', {
      method: 'POST',
      body: JSON.stringify({ assistantId, platform: 'desktop' }),
    });
    if (!res.ok) throw new Error(await readErrorMessage(res, 'Failed to create session'));
    const data = await res.json();
    return data.session;
  },

  async endSession(sessionId, stats) {
    const res = await this._fetch(`/iassist/sessions/${sessionId}/end`, {
      method: 'PATCH',
      body: JSON.stringify(stats),
    });
    if (!res.ok) logger.error('Failed to end session');
  },

  // Deliberately not awaited by callers — a slow write must never delay an answer
  // reaching the overlay. The promise is registered in pendingTranscriptWrites so
  // stopSession can wait for it; without that, ending a session raced its own last
  // rows and the transcript came back short (or empty on a short session).
  addTranscript(sessionId, entry) {
    const write = (async () => {
      for (let attempt = 1; attempt <= TRANSCRIPT_WRITE_ATTEMPTS; attempt++) {
        try {
          const res = await this._fetch(`/iassist/sessions/${sessionId}/transcript`, {
            method: 'POST',
            body: JSON.stringify(entry),
          });
          if (res.ok) return;
          // 4xx is a bad payload — retrying sends the same bytes to the same rejection.
          if (res.status < 500) {
            logger.error('Transcript rejected', res.status, entry.text?.slice(0, 60));
            return;
          }
          logger.error('Transcript persist failed', res.status, `attempt ${attempt}`);
        } catch (err) {
          logger.error('Transcript persist failed', err.message, `attempt ${attempt}`);
        }
        if (attempt < TRANSCRIPT_WRITE_ATTEMPTS) {
          await new Promise(r => setTimeout(r, TRANSCRIPT_RETRY_DELAY_MS * attempt));
        }
      }
      logger.error('Transcript lost after retries', entry.text?.slice(0, 60));
    })();

    pendingTranscriptWrites.add(write);
    write.finally(() => pendingTranscriptWrites.delete(write));
    return write;
  },

  async getConfig() {
    const res = await this._fetch('/iassist/config');
    if (!res.ok) throw new Error('Config fetch failed');
    return await res.json();
  },

  async transcribe(audio, mimeType, sessionId) {
    const res = await this._fetch('/iassist/transcribe', {
      method: 'POST',
      body: JSON.stringify({ audio, mimeType, sessionId }),
    });
    if (!res.ok) throw new Error('Transcription failed');
    const data = await res.json();
    return data.text;
  },

  async query(sessionId, assistantId, message, conversationHistory, responseType) {
    const res = await this._fetch('/iassist/query', {
      method: 'POST',
      body: JSON.stringify({ sessionId, assistantId, message, conversationHistory, responseType }),
    });
    if (!res.ok) throw new Error(await readErrorMessage(res, 'AI query failed'));
    return await res.json();
  },

  // Streams the answer via SSE, invoking onDelta for each fragment as it arrives.
  // Resolves with the same shape as query() once the `done` event lands.
  //
  // Both timeouts exist to guarantee this promise always settles. processAiQueue
  // only clears isAiProcessing in a `finally`, which never runs on a promise
  // that hangs forever — a single stalled response would otherwise silently
  // drop every remaining question in the session.
  async queryStream(sessionId, assistantId, message, conversationHistory, responseType, onDelta) {
    const controller = new AbortController();
    let timedOut = false;
    let idleTimer = null;

    const abortNow = () => { timedOut = true; controller.abort(); };
    const armIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(abortNow, STREAM_IDLE_TIMEOUT_MS);
    };
    const hardTimer = setTimeout(abortNow, STREAM_MAX_MS);

    try {
      armIdleTimer();

      const res = await this._fetch('/iassist/query/stream', {
        method: 'POST',
        headers: { Accept: 'text/event-stream' },
        body: JSON.stringify({ sessionId, assistantId, message, conversationHistory, responseType }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(await readErrorMessage(res, 'AI query failed'));

      const decoder = new TextDecoder();
      let buffer = '';
      let result = null;
      let streamError = null;

      const reader = res.body.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Progress resets the idle clock; the hard cap still applies.
        armIdleTimer();
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by a blank line. Tolerate CRLF — a proxy in
        // front of the server may normalise line endings, and splitting on LF
        // alone would then never find a frame boundary.
        const frames = buffer.split(/\r?\n\r?\n/);
        buffer = frames.pop();

        for (const frame of frames) {
          const lines = frame.split(/\r?\n/);
          const eventLine = lines.find(l => l.startsWith('event: '));
          const dataLine = lines.find(l => l.startsWith('data: '));
          if (!eventLine || !dataLine) continue;

          const event = eventLine.slice(7).trim();
          const payload = JSON.parse(dataLine.slice(6));

          if (event === 'delta') onDelta(payload.text);
          else if (event === 'done') result = payload;
          else if (event === 'error') streamError = new Error(payload.message);
        }
      }

      if (streamError) throw streamError;
      if (!result) throw new Error('AI stream ended before completing');
      return result;
    } catch (err) {
      if (timedOut) throw new Error('AI response timed out');
      throw err;
    } finally {
      clearTimeout(idleTimer);
      clearTimeout(hardTimer);
    }
  },
};

// ---------------------------------------------------------------------------
// Synced state — shared across windows
// ---------------------------------------------------------------------------

let currentOpacity = 0.9;
let currentTheme = 'dark';
let currentVisibilityMode = 'visible'; // 'visible' | 'invisible' | 'undetectable'
let currentAssistant = null;
let currentAssistants = [];

// ---------------------------------------------------------------------------
// Session state
// ---------------------------------------------------------------------------

let currentBackendSessionId = null;
let currentSessionQuestionsCount = 0;
let currentSessionTokensUsed = 0;
let sessionStartTime = null;
let isSessionActive = false;

// AI request queue — serial execution, max 1 pending, stale dropping
let aiRequestQueue = [];
let isAiProcessing = false;

// ---------------------------------------------------------------------------
// Windows
// ---------------------------------------------------------------------------

let mainWindow = null;
let sessionWindow = null;
let settingsWindow = null;
let shortcutsWindow = null;
let tray = null;

const BAR_WIDTH = 650;
const BAR_HEIGHT = 55;
const SESSION_WIDTH = 1105;
const SESSION_HEIGHT = 680;
// Vertical gap between the bar and the panel docked beneath it.
const DOCK_GAP = 2;

function getLiveWindows(...windows) {
  return windows.filter(w => w && !w.isDestroyed());
}

function broadcastToLiveWindows(channel, data) {
  for (const win of getLiveWindows(mainWindow, sessionWindow, settingsWindow, shortcutsWindow)) {
    win.webContents.send(channel, data);
  }
}

// Screen-share exclusion: 'invisible' hides the window from capture/recording,
// 'undetectable' additionally makes it click-through (keyboard shortcuts only).
function applyVisibilityMode(win, mode) {
  if (!win || win.isDestroyed()) return;
  // Settings is the one window that keeps its mouse in undetectable mode. Content
  // protection still hides it from screen shares and recordings, so nothing leaks —
  // but a click-through settings panel cannot be scrolled, changed, or closed, which
  // leaves no way back out of the mode except a shortcut the user has to already know.
  const clickThroughExempt = win === settingsWindow;
  switch (mode) {
    case 'invisible':
      win.setContentProtection(true);
      win.setIgnoreMouseEvents(false);
      break;
    case 'undetectable':
      win.setContentProtection(true);
      win.setIgnoreMouseEvents(!clickThroughExempt);
      break;
    default: // 'visible'
      win.setContentProtection(false);
      win.setIgnoreMouseEvents(false);
      break;
  }
}

// Every BrowserWindow must go through this instead of calling applyVisibilityMode
// directly at creation. A window that opts out — or one added later that simply
// forgets the call — stays capturable while the rest of the app is hidden, which is
// worse than no stealth at all: the user believes they are covered and they are not.
// The re-assert on 'show' is because content protection does not reliably survive a
// hide/show cycle on Windows, and the bar, session and settings windows all get hidden.
function trackVisibilityMode(win) {
  if (!win || win.isDestroyed()) return;
  applyVisibilityMode(win, currentVisibilityMode);
  win.on('show', () => applyVisibilityMode(win, currentVisibilityMode));
}

function setVisibilityMode(mode) {
  currentVisibilityMode = mode;
  for (const win of getLiveWindows(mainWindow, sessionWindow, settingsWindow, shortcutsWindow)) {
    applyVisibilityMode(win, mode);
  }
  broadcastToLiveWindows('visibility-update', mode);
  const settings = loadSettings();
  settings.visibilityMode = mode;
  saveSettings(settings);
}

function broadcastAuthState() {
  const state = {
    isAuthenticated: isAuthenticated(),
    user: currentUser,
  };
  broadcastToLiveWindows('auth-state-changed', state);
}

function createMainWindow() {
  const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize;
  const winWidth = BAR_WIDTH;
  const winHeight = BAR_HEIGHT;

  mainWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: Math.floor((screenWidth - winWidth) / 2),
    y: 20,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.setOpacity(currentOpacity);
  trackVisibilityMode(mainWindow);

  mainWindow.on('move', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const mainBounds = mainWindow.getBounds();
    if (sessionWindow && !sessionWindow.isDestroyed()) {
      const sessionBounds = sessionWindow.getBounds();
      const targetX = mainBounds.x - Math.round((sessionBounds.width - mainBounds.width) / 2);
      const targetY = mainBounds.y + mainBounds.height + DOCK_GAP;
      if (sessionBounds.x !== targetX || sessionBounds.y !== targetY) {
        sessionWindow.setBounds({ x: targetX, y: targetY, width: sessionBounds.width, height: sessionBounds.height }, false);
      }
    }
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      const settingsBounds = settingsWindow.getBounds();
      const targetX = mainBounds.x - Math.round((settingsBounds.width - mainBounds.width) / 2);
      const targetY = mainBounds.y + mainBounds.height + DOCK_GAP;
      if (settingsBounds.x !== targetX || settingsBounds.y !== targetY) {
        settingsWindow.setBounds({ x: targetX, y: targetY, width: settingsBounds.width, height: settingsBounds.height }, false);
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (sessionWindow && !sessionWindow.isDestroyed()) sessionWindow.close();
    if (settingsWindow && !settingsWindow.isDestroyed()) settingsWindow.close();
  });
}

function createSessionWindow() {
  if (sessionWindow && !sessionWindow.isDestroyed()) {
    sessionWindow.focus();
    return;
  }

  const mainBounds = mainWindow.getBounds();
  const winWidth = SESSION_WIDTH;
  const winHeight = SESSION_HEIGHT;

  sessionWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: mainBounds.x - Math.round((winWidth - mainBounds.width) / 2),
    y: mainBounds.y + mainBounds.height + DOCK_GAP,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  sessionWindow.loadFile(path.join(__dirname, 'src', 'session-window.html'));
  sessionWindow.setAlwaysOnTop(true, 'screen-saver');
  sessionWindow.once('ready-to-show', () => {
    sessionWindow.show();
    sessionWindow.setOpacity(currentOpacity);
  });
  trackVisibilityMode(sessionWindow);

  sessionWindow.on('resize', () => {
    if (mainWindow && !mainWindow.isDestroyed() && sessionWindow && !sessionWindow.isDestroyed()) {
      const mBounds = mainWindow.getBounds();
      const sBounds = sessionWindow.getBounds();
      const targetX = sBounds.x + Math.round((sBounds.width - mBounds.width) / 2);
      const targetY = sBounds.y - mBounds.height - DOCK_GAP;
      if (mBounds.x !== targetX || mBounds.y !== targetY) {
        mainWindow.setBounds({ x: targetX, y: targetY, width: mBounds.width, height: mBounds.height }, false);
      }
    }
  });

  // The bar's restore button only exists while the session window is off screen,
  // so every path that shows or hides it has to report back — button clicks,
  // global shortcuts and visibility-mode changes alike.
  sessionWindow.on('show', notifySessionWindowVisibility);
  sessionWindow.on('hide', notifySessionWindowVisibility);

  sessionWindow.on('closed', () => {
    sessionWindow = null;
    notifySessionWindowVisibility();
  });
}

function notifySessionWindowVisibility() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const visible = !!(sessionWindow && !sessionWindow.isDestroyed() && sessionWindow.isVisible());
  mainWindow.webContents.send('session-window-visibility', { visible });
}

function createSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return;
  }

  const mainBounds = mainWindow.getBounds();

  settingsWindow = new BrowserWindow({
    width: mainBounds.width,
    height: 500,
    x: mainBounds.x,
    y: mainBounds.y + mainBounds.height + DOCK_GAP,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: true,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  settingsWindow.loadFile(path.join(__dirname, 'src', 'settings.html'));
  settingsWindow.setAlwaysOnTop(true, 'screen-saver');
  settingsWindow.once('ready-to-show', () => settingsWindow.show());
  trackVisibilityMode(settingsWindow);

  settingsWindow.on('resize', () => {
    if (mainWindow && !mainWindow.isDestroyed() && settingsWindow && !settingsWindow.isDestroyed()) {
      const mBounds = mainWindow.getBounds();
      const stBounds = settingsWindow.getBounds();
      const targetX = stBounds.x + Math.round((stBounds.width - mBounds.width) / 2);
      const targetY = stBounds.y - mBounds.height - DOCK_GAP;
      if (mBounds.x !== targetX || mBounds.y !== targetY) {
        mainWindow.setBounds({ x: targetX, y: targetY, width: mBounds.width, height: mBounds.height }, false);
      }
    }
  });

  settingsWindow.on('closed', () => { settingsWindow = null; });
}

function toggleSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.close();
    return;
  }
  createSettingsWindow();
}

function createShortcutsWindow() {
  if (shortcutsWindow && !shortcutsWindow.isDestroyed()) {
    shortcutsWindow.focus();
    return;
  }

  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
  const width = 780;
  const height = 640;

  shortcutsWindow = new BrowserWindow({
    width,
    height,
    x: Math.floor((screenWidth - width) / 2),
    y: Math.floor((screenHeight - height) / 2),
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  shortcutsWindow.loadFile(path.join(__dirname, 'src', 'shortcuts.html'));
  shortcutsWindow.setAlwaysOnTop(true, 'screen-saver');
  shortcutsWindow.once('ready-to-show', () => shortcutsWindow.show());
  trackVisibilityMode(shortcutsWindow);

  shortcutsWindow.on('closed', () => { shortcutsWindow = null; });
}

function toggleShortcutsWindow() {
  if (shortcutsWindow && !shortcutsWindow.isDestroyed()) {
    shortcutsWindow.close();
  } else {
    createShortcutsWindow();
  }
}

// ---------------------------------------------------------------------------
// Tray
// ---------------------------------------------------------------------------

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
  let trayIcon;
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
  } catch {
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('NxtGen I-Assist');
  updateTrayMenu();
}

function updateTrayMenu() {
  const template = [
    { label: 'NxtGen I-Assist', enabled: false },
    { type: 'separator' },
    {
      label: isAuthenticated() ? `Signed in as ${currentUser?.email || 'user'}` : 'Not signed in',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Show Bar',
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: 'Settings',
      click: () => createSettingsWindow(),
    },
    { type: 'separator' },
    {
      label: isAuthenticated() ? 'Sign Out' : 'Sign In',
      click: () => {
        if (isAuthenticated()) {
          handleSignOut();
        } else {
          handleSignIn();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit(),
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  tray.setContextMenu(menu);
}

// ---------------------------------------------------------------------------
// Desktop auth flow — localhost callback pattern
// ---------------------------------------------------------------------------

let authCallbackServer = null;
let authState = null;

function handleSignIn() {
  if (authCallbackServer) return;

  authState = crypto.randomBytes(32).toString('hex');

  authCallbackServer = http.createServer((req, res) => {
    const url = new URL(req.url, `http://127.0.0.1`);
    if (url.pathname !== '/callback') {
      res.writeHead(404);
      res.end();
      return;
    }

    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (state !== authState) {
      logger.error('Auth callback state mismatch');
      res.writeHead(400);
      res.end('State mismatch. Please try again.');
      shutdownAuthServer();
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<html><body style="background:#0a0a0f;color:#fff;font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h2 style="color:#f5820b">Authorization Successful</h2><p>You can close this tab and return to I-Assist.</p></div></body></html>');

    shutdownAuthServer();
    exchangeAuthCode(code, state);
  });

  authCallbackServer.listen(0, '127.0.0.1', () => {
    const port = authCallbackServer.address().port;
    logger.info(`Auth callback server on port ${port}`);

    const webUrl = getWebAppUrl();
    const authorizeUrl = `${webUrl}/desktop-authorize?port=${port}&state=${authState}`;
    shell.openExternal(authorizeUrl);
  });
}

function shutdownAuthServer() {
  if (authCallbackServer) {
    authCallbackServer.close();
    authCallbackServer = null;
  }
  authState = null;
}

async function exchangeAuthCode(code, state) {
  try {
    const url = `${getApiBaseUrl()}/iassist/desktop/token`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, state }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Token exchange failed');
    }

    const data = await response.json();
    authToken = data.accessToken;
    refreshToken = data.refreshToken;
    currentUser = data.user;
    saveAuth();

    logger.info('Authenticated as', currentUser.email);
    broadcastAuthState();
    updateTrayMenu();
    loadAssistants();
  } catch (err) {
    logger.error('Auth code exchange failed', err.message);
    broadcastToLiveWindows('auth-state-changed', {
      isAuthenticated: false,
      error: err.message,
    });
  }
}

function handleSignOut() {
  if (isSessionActive) {
    logger.warn('Cannot sign out during active session');
    return;
  }
  clearAuth();
  currentAssistant = null;
  broadcastAuthState();
  broadcastToLiveWindows('assistants-availability', { assistants: [] });
  updateTrayMenu();
  logger.info('Signed out');
}

// ---------------------------------------------------------------------------
// Assistant loading
// ---------------------------------------------------------------------------

async function loadAssistants() {
  if (!isAuthenticated()) return [];
  try {
    const assistants = await BackendService.getAssistants();
    currentAssistants = assistants;
    broadcastToLiveWindows('assistants-availability', { assistants });

    // Reconcile the selection against what the server actually still has. Without
    // this a selection deleted on the web stays cached here and every session
    // start fails with a 404 that the user has no way to clear.
    const stillExists = currentAssistant && assistants.some(a => a.id === currentAssistant.id);
    if (!stillExists) {
      currentAssistant = assistants[0] || null;
      broadcastToLiveWindows('assistant-update', currentAssistant);
    }

    logger.info(`Loaded ${assistants.length} assistants`);
    return assistants;
  } catch (err) {
    logger.error('Failed to load assistants', err.message);
    return currentAssistants;
  }
}

// ---------------------------------------------------------------------------
// Session lifecycle
// ---------------------------------------------------------------------------

async function startSession(assistantId) {
  if (isSessionActive) {
    logger.warn('Session already active');
    return;
  }

  if (!isAuthenticated()) {
    broadcastToLiveWindows('session-start-failed', { error: 'Not authenticated' });
    return;
  }

  const assistant = currentAssistant;
  if (!assistant) {
    broadcastToLiveWindows('session-start-failed', { error: 'No assistant selected' });
    return;
  }

  try {
    const session = await BackendService.createSession(assistant.id);
    currentBackendSessionId = session.id;
    currentSessionQuestionsCount = 0;
    currentSessionTokensUsed = 0;
    sessionStartTime = Date.now();
    isSessionActive = true;

    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.close();
    }

    createSessionWindow();

    broadcastToLiveWindows('session-state-changed', {
      active: true,
      sessionId: currentBackendSessionId,
      assistant,
    });

    // Admin-tuned capture thresholds. A failure here must not block the session,
    // so fall back to the renderer's built-in defaults.
    let vad = null;
    try {
      ({ vad } = await BackendService.getConfig());
    } catch (err) {
      logger.warn('VAD config fetch failed, using defaults', err.message);
    }

    if (sessionWindow && !sessionWindow.isDestroyed()) {
      sessionWindow.webContents.once('did-finish-load', () => {
        sessionWindow.webContents.send('start-audio-capture', {
          sessionId: currentBackendSessionId,
          assistant,
          vad,
        });
      });
    }

    registerSessionShortcuts();
    logger.info('Session started', currentBackendSessionId);
  } catch (err) {
    logger.error('Failed to start session', err.message);

    if (isAssistantGone(err)) {
      // Deleted on the web since we last fetched — resync so the stale entry
      // disappears from the bar and the Settings dropdown.
      await loadAssistants();
      broadcastToLiveWindows('session-start-failed', {
        error: 'That assistant was deleted — pick another in Settings',
      });
      return;
    }

    broadcastToLiveWindows('session-start-failed', { error: err.message });
  }
}

async function stopSession() {
  if (!isSessionActive) return;

  const sessionId = currentBackendSessionId;

  unregisterSessionShortcuts();

  // Tell renderer to flush pending transcription — keep isSessionActive true
  // so the flush query isn't dropped by the custom-query handler
  if (sessionWindow && !sessionWindow.isDestroyed()) {
    sessionWindow.webContents.send('stop-audio-capture');
  }

  // Wait for the renderer's flush IPC to arrive
  await new Promise((r) => setTimeout(r, 200));

  isSessionActive = false;
  const durationSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);

  broadcastToLiveWindows('session-state-changed', { active: false });

  // Drain the AI queue so the final query's tokens/questions are counted
  const drainStart = Date.now();
  while (isAiProcessing && Date.now() - drainStart < 5000) {
    await new Promise((r) => setTimeout(r, 100));
  }

  if (sessionWindow && !sessionWindow.isDestroyed()) {
    sessionWindow.close();
  }

  // A question left queued when the drain timed out still gets a row: it was heard
  // and displayed, so silently discarding it is the same lost-history bug.
  for (const queued of aiRequestQueue) persistExchange(queued);
  aiRequestQueue = [];

  // Before the counts are reported, so questionsAnswered can't describe rows that
  // are still in flight — and before sessionStartTime is cleared, which persistExchange
  // needs to stamp timestamps.
  await flushTranscriptWrites();

  if (sessionId) {
    try {
      await BackendService.endSession(sessionId, {
        durationSeconds,
        questionsAnswered: currentSessionQuestionsCount,
        tokensUsed: currentSessionTokensUsed,
      });
      logger.info('Session ended', sessionId, `${durationSeconds}s`);
    } catch (err) {
      logger.error('Failed to end session on backend', err.message);
    }
  }

  currentBackendSessionId = null;
  sessionStartTime = null;
  aiRequestQueue = [];
  isAiProcessing = false;
}

// Bounded: a write wedged behind an unreachable server must not hold the session
// open. Anything still pending past the timeout is left to finish or fail on its own.
async function flushTranscriptWrites() {
  if (pendingTranscriptWrites.size === 0) return;
  await Promise.race([
    Promise.allSettled([...pendingTranscriptWrites]),
    new Promise(r => setTimeout(r, TRANSCRIPT_FLUSH_TIMEOUT_MS)),
  ]);
}

// ---------------------------------------------------------------------------
// AI request queue — serial, max 1 pending, stale dropping
// ---------------------------------------------------------------------------

// The question was heard, transcribed and shown in the overlay, so it belongs in the
// history whether or not an answer came back. `response: null` renders as a question
// with no answer on the session detail page, which is the truth — better than the
// exchange vanishing and leaving a gap the user cannot account for.
function persistExchange(request, { response = null, tokens = 0, isQuestion = false } = {}) {
  if (!request || !request.sessionId || !sessionStartTime) return;

  // Counted here rather than at the call sites so the dashboard's number is by
  // construction the number of rows written, whatever the outcome of the query.
  currentSessionQuestionsCount++;

  BackendService.addTranscript(request.sessionId, {
    speaker: 'user',
    text: request.message,
    isQuestion,
    response,
    tokens,
    timestamp: Math.floor((Date.now() - sessionStartTime) / 1000),
  });
}

function enqueueAiRequest(request) {
  // Max 1 pending: a newer question replaces one that never started. The dropped
  // question is already on screen in the Questions pane, so record it too — otherwise
  // the pane and the saved transcript disagree by however many questions arrived
  // faster than the model could answer them.
  const dropped = aiRequestQueue[0];
  if (dropped) persistExchange(dropped);

  aiRequestQueue = [request];
  processAiQueue();
}

async function processAiQueue() {
  if (isAiProcessing || aiRequestQueue.length === 0) return;

  isAiProcessing = true;
  const request = aiRequestQueue.shift();
  let assistantGone = false;

  try {
    broadcastToLiveWindows('ai-thinking', { thinking: true });

    const result = await BackendService.queryStream(
      request.sessionId,
      request.assistantId,
      request.message,
      request.conversationHistory,
      request.responseType,
      (text) => broadcastToLiveWindows('llm-answer-delta', { text })
    );

    currentSessionTokensUsed += result.tokens || 0;

    broadcastToLiveWindows('llm-answer', {
      response: result.response,
      tokens: result.tokens,
      isQuestion: result.isQuestion,
    });

    persistExchange(request, {
      response: result.response,
      tokens: result.tokens,
      isQuestion: result.isQuestion,
    });
  } catch (err) {
    logger.error('AI query error', err.message);
    assistantGone = isAssistantGone(err);
    persistExchange(request);
    broadcastToLiveWindows('llm-answer', {
      response: assistantGone
        ? 'This assistant was deleted on the web. Ending the session.'
        : 'Error: Could not get a response. Please try again.',
      error: true,
    });
  } finally {
    isAiProcessing = false;
    broadcastToLiveWindows('ai-thinking', { thinking: false });

    if (assistantGone) {
      // Every further question would fail the same way, so end the session
      // rather than filling the transcript with identical errors. Anything queued
      // still gets a row — stopSession persists the queue before clearing it.
      loadAssistants();
      stopSession();
    } else {
      processAiQueue();
    }
  }
}

// ---------------------------------------------------------------------------
// Global shortcuts
// ---------------------------------------------------------------------------

function registerPersistentShortcuts() {
  globalShortcut.register('CommandOrControl+Shift+Alt+I', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    }
  });

  // Toggle, not open: in undetectable mode the window is click-through, so this
  // shortcut is the only way to dismiss it.
  globalShortcut.register('CommandOrControl+Shift+Alt+S', () => {
    toggleSettingsWindow();
  });

  // Escape hatch out of undetectable, whose click-through makes every window
  // unusable by mouse. It always lands on 'invisible', never 'visible': this is the
  // panic key, pressed mid-interview without looking, and a branch that could turn
  // content protection off would expose the overlay on a live screen share.
  // Going fully visible stays a deliberate choice in the settings panel.
  globalShortcut.register('CommandOrControl+Shift+Alt+Escape', () => {
    setVisibilityMode('invisible');
  });

  globalShortcut.register('CommandOrControl+Shift+Alt+J', () => {
    toggleShortcutsWindow();
  });

  globalShortcut.register('CommandOrControl+Shift+Alt+L', () => {
    if (currentAssistant) startSession(currentAssistant.id);
  });

  // Bar only. The session window runs with skipTaskbar, so minimizing it leaves
  // nothing to restore it from — it hides instead, via Ctrl+Shift+Alt+T.
  globalShortcut.register('CommandOrControl+Shift+Alt+M', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isMinimized()) mainWindow.restore(); else mainWindow.minimize();
  });

  globalShortcut.register('CommandOrControl+Shift+Alt+Up', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const { x, y } = mainWindow.getBounds();
    mainWindow.setPosition(x, y - 10);
  });
  globalShortcut.register('CommandOrControl+Shift+Alt+Down', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const { x, y } = mainWindow.getBounds();
    mainWindow.setPosition(x, y + 10);
  });
  globalShortcut.register('CommandOrControl+Shift+Alt+Left', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const { x, y } = mainWindow.getBounds();
    mainWindow.setPosition(x - 10, y);
  });
  globalShortcut.register('CommandOrControl+Shift+Alt+Right', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const { x, y } = mainWindow.getBounds();
    mainWindow.setPosition(x + 10, y);
  });

  globalShortcut.register('CommandOrControl+Shift+Alt+[', () => {
    currentOpacity = Math.max(0.3, Math.round((currentOpacity - 0.05) * 100) / 100);
    for (const win of getLiveWindows(mainWindow, sessionWindow, settingsWindow)) {
      win.setOpacity(currentOpacity);
    }
    broadcastToLiveWindows('opacity-update', currentOpacity);
    const settings = loadSettings();
    settings.opacity = currentOpacity;
    saveSettings(settings);
  });
  globalShortcut.register('CommandOrControl+Shift+Alt+]', () => {
    currentOpacity = Math.min(1, Math.round((currentOpacity + 0.05) * 100) / 100);
    for (const win of getLiveWindows(mainWindow, sessionWindow, settingsWindow)) {
      win.setOpacity(currentOpacity);
    }
    broadcastToLiveWindows('opacity-update', currentOpacity);
    const settings = loadSettings();
    settings.opacity = currentOpacity;
    saveSettings(settings);
  });

  globalShortcut.register('CommandOrControl+Shift+Alt+B', () => {
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    currentTheme = nextTheme;
    broadcastToLiveWindows('theme-update', nextTheme);
    const settings = loadSettings();
    settings.theme = nextTheme;
    saveSettings(settings);
  });
}

function registerSessionShortcuts() {
  globalShortcut.register('CommandOrControl+Shift+Alt+K', () => {
    stopSession();
  });

  globalShortcut.register('CommandOrControl+Shift+Alt+T', () => {
    if (sessionWindow && !sessionWindow.isDestroyed()) {
      sessionWindow.isVisible() ? sessionWindow.hide() : sessionWindow.show();
    }
  });

  globalShortcut.register('CommandOrControl+Shift+Alt+=', () => {
    if (sessionWindow && !sessionWindow.isDestroyed()) {
      sessionWindow.webContents.send('adjust-font-size', 'inc');
    }
  });
  globalShortcut.register('CommandOrControl+Shift+Alt+-', () => {
    if (sessionWindow && !sessionWindow.isDestroyed()) {
      sessionWindow.webContents.send('adjust-font-size', 'dec');
    }
  });

  globalShortcut.register('CommandOrControl+Alt+X', () => {
    if (!sessionWindow || sessionWindow.isDestroyed()) return;
    const bounds = sessionWindow.getBounds();
    sessionWindow.setBounds({ width: Math.max(600, bounds.width - 50) });
  });
  globalShortcut.register('CommandOrControl+Shift+Alt+X', () => {
    if (!sessionWindow || sessionWindow.isDestroyed()) return;
    const bounds = sessionWindow.getBounds();
    sessionWindow.setBounds({ width: Math.min(1600, bounds.width + 50) });
  });
  globalShortcut.register('CommandOrControl+Alt+Y', () => {
    if (!sessionWindow || sessionWindow.isDestroyed()) return;
    const bounds = sessionWindow.getBounds();
    sessionWindow.setBounds({ height: Math.max(300, bounds.height - 10) });
  });
  globalShortcut.register('CommandOrControl+Shift+Alt+Y', () => {
    if (!sessionWindow || sessionWindow.isDestroyed()) return;
    const bounds = sessionWindow.getBounds();
    sessionWindow.setBounds({ height: Math.min(900, bounds.height + 10) });
  });
}

function unregisterSessionShortcuts() {
  globalShortcut.unregisterAll();
  registerPersistentShortcuts();
}

// ---------------------------------------------------------------------------
// IPC handlers
// ---------------------------------------------------------------------------

function setupIPC() {
  ipcMain.handle('get-initial-settings', () => ({
    isAuthenticated: isAuthenticated(),
    user: currentUser,
    opacity: currentOpacity,
    theme: currentTheme,
    visibilityMode: currentVisibilityMode,
    assistant: currentAssistant,
    assistants: currentAssistants,
    isSessionActive,
    apiBaseUrl: getApiBaseUrl(),
    webAppUrl: getWebAppUrl(),
  }));

  ipcMain.on('start-session', () => {
    if (currentAssistant) {
      startSession(currentAssistant.id);
    }
  });

  ipcMain.on('stop-session', () => {
    stopSession();
  });

  ipcMain.on('audio-chunk', async (_event, { audio, mimeType }) => {
    if (!isSessionActive || !currentBackendSessionId) return;
    try {
      const text = await BackendService.transcribe(audio, mimeType, currentBackendSessionId);
      if (text) {
        broadcastToLiveWindows('transcription-update', { text });
      }
    } catch (err) {
      logger.error('Transcription error', err.message);
    }
  });

  ipcMain.on('custom-query', (_event, { message, conversationHistory, responseType }) => {
    if (!isSessionActive || !currentBackendSessionId || !currentAssistant) return;
    enqueueAiRequest({
      sessionId: currentBackendSessionId,
      assistantId: currentAssistant.id,
      message,
      conversationHistory,
      responseType,
    });
  });

  ipcMain.on('set-assistant', (_event, assistant) => {
    currentAssistant = assistant;
    broadcastToLiveWindows('assistant-update', assistant);
  });

  ipcMain.on('set-opacity', (_event, opacity) => {
    currentOpacity = opacity;
    for (const win of getLiveWindows(mainWindow, sessionWindow)) {
      win.setOpacity(opacity);
    }
    broadcastToLiveWindows('opacity-update', opacity);
    const settings = loadSettings();
    settings.opacity = opacity;
    saveSettings(settings);
  });

  ipcMain.on('set-visibility-mode', (_event, mode) => {
    setVisibilityMode(mode);
  });

  ipcMain.on('set-theme', (_event, theme) => {
    currentTheme = theme;
    broadcastToLiveWindows('theme-update', theme);
    const settings = loadSettings();
    settings.theme = theme;
    saveSettings(settings);
  });

  ipcMain.on('sign-out', () => {
    handleSignOut();
  });

  ipcMain.handle('get-theme', () => currentTheme);

  ipcMain.handle('refresh-assistants', async () => {
    const assistants = await loadAssistants();
    return { assistants, assistant: currentAssistant };
  });

  ipcMain.on('open-sign-in', () => {
    handleSignIn();
  });

  ipcMain.on('open-settings', () => {
    createSettingsWindow();
  });

  ipcMain.on('close-settings', () => {
    if (settingsWindow && !settingsWindow.isDestroyed()) {
      settingsWindow.close();
    }
  });

  ipcMain.on('open-web-dashboard', () => {
    shell.openExternal(`${getWebAppUrl()}/dashboard/student/tools/i-assist`);
  });

  ipcMain.on('open-shortcuts-window', () => {
    createShortcutsWindow();
  });

  ipcMain.on('close-shortcuts-window', () => {
    if (shortcutsWindow && !shortcutsWindow.isDestroyed()) {
      shortcutsWindow.close();
    }
  });

  ipcMain.on('show-session-window', () => {
    if (sessionWindow && !sessionWindow.isDestroyed()) sessionWindow.show();
  });

  ipcMain.on('hide-session-window', () => {
    if (sessionWindow && !sessionWindow.isDestroyed()) sessionWindow.hide();
  });

  ipcMain.on('hide-bar', () => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.hide();
  });

  ipcMain.on('quit-app', () => {
    app.quit();
  });
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    loadAuth();

    const savedSettings = loadSettings();
    if (savedSettings.opacity !== undefined) currentOpacity = savedSettings.opacity;
    if (savedSettings.theme) currentTheme = savedSettings.theme;
    if (savedSettings.visibilityMode) currentVisibilityMode = savedSettings.visibilityMode;

    electronSession.defaultSession.setDisplayMediaRequestHandler((_request, callback) => {
      desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
        callback({ video: sources[0], audio: 'loopback' });
      });
    });

    setupIPC();
    createMainWindow();
    createTray();
    registerPersistentShortcuts();

    if (isAuthenticated()) {
      loadAssistants();
    }

    logger.info('NxtGen I-Assist started');
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });

  app.on('window-all-closed', (e) => {
    e.preventDefault();
  });
}

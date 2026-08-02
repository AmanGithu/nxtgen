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
    if (!res.ok) throw new Error('Failed to create session');
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

  async addTranscript(sessionId, entry) {
    this._fetch(`/iassist/sessions/${sessionId}/transcript`, {
      method: 'POST',
      body: JSON.stringify(entry),
    }).catch(err => logger.error('Transcript persist failed', err.message));
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
    if (!res.ok) throw new Error('AI query failed');
    return await res.json();
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
  switch (mode) {
    case 'invisible':
      win.setContentProtection(true);
      win.setIgnoreMouseEvents(false);
      break;
    case 'undetectable':
      win.setContentProtection(true);
      win.setIgnoreMouseEvents(true);
      break;
    default: // 'visible'
      win.setContentProtection(false);
      win.setIgnoreMouseEvents(false);
      break;
  }
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
  applyVisibilityMode(mainWindow, currentVisibilityMode);

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
  applyVisibilityMode(sessionWindow, currentVisibilityMode);

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

  sessionWindow.on('closed', () => { sessionWindow = null; });
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
  applyVisibilityMode(settingsWindow, currentVisibilityMode);

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
  applyVisibilityMode(shortcutsWindow, currentVisibilityMode);

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
  if (!isAuthenticated()) return;
  try {
    const assistants = await BackendService.getAssistants();
    currentAssistants = assistants;
    broadcastToLiveWindows('assistants-availability', { assistants });
    if (assistants.length > 0 && !currentAssistant) {
      currentAssistant = assistants[0];
      broadcastToLiveWindows('assistant-update', currentAssistant);
    }
    logger.info(`Loaded ${assistants.length} assistants`);
  } catch (err) {
    logger.error('Failed to load assistants', err.message);
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

    if (sessionWindow && !sessionWindow.isDestroyed()) {
      sessionWindow.webContents.once('did-finish-load', () => {
        sessionWindow.webContents.send('start-audio-capture', {
          sessionId: currentBackendSessionId,
          assistant,
        });
      });
    }

    registerSessionShortcuts();
    logger.info('Session started', currentBackendSessionId);
  } catch (err) {
    logger.error('Failed to start session', err.message);
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

// ---------------------------------------------------------------------------
// AI request queue — serial, max 1 pending, stale dropping
// ---------------------------------------------------------------------------

function enqueueAiRequest(request) {
  aiRequestQueue = [request];
  processAiQueue();
}

async function processAiQueue() {
  if (isAiProcessing || aiRequestQueue.length === 0) return;

  isAiProcessing = true;
  const request = aiRequestQueue.shift();

  try {
    broadcastToLiveWindows('ai-thinking', { thinking: true });

    const result = await BackendService.query(
      request.sessionId,
      request.assistantId,
      request.message,
      request.conversationHistory,
      request.responseType
    );

    if (result.isQuestion) currentSessionQuestionsCount++;
    currentSessionTokensUsed += result.tokens || 0;

    broadcastToLiveWindows('llm-answer', {
      response: result.response,
      tokens: result.tokens,
      isQuestion: result.isQuestion,
    });

    BackendService.addTranscript(request.sessionId, {
      speaker: 'user',
      text: request.message,
      isQuestion: result.isQuestion,
      response: result.response,
      tokens: result.tokens,
      timestamp: Math.floor((Date.now() - sessionStartTime) / 1000),
    });
  } catch (err) {
    logger.error('AI query error', err.message);
    broadcastToLiveWindows('llm-answer', {
      response: 'Error: Could not get a response. Please try again.',
      error: true,
    });
  } finally {
    isAiProcessing = false;
    broadcastToLiveWindows('ai-thinking', { thinking: false });
    processAiQueue();
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

  globalShortcut.register('CommandOrControl+Shift+Alt+S', () => {
    createSettingsWindow();
  });

  // Escape hatch out of undetectable, whose click-through makes every window
  // unusable by mouse. It drops to 'invisible' rather than 'visible' so it still
  // restores the pointer without suddenly exposing the overlay on a live screen share.
  globalShortcut.register('CommandOrControl+Shift+Alt+Escape', () => {
    setVisibilityMode(currentVisibilityMode === 'undetectable' ? 'invisible' : 'visible');
  });

  globalShortcut.register('CommandOrControl+Shift+Alt+J', () => {
    toggleShortcutsWindow();
  });

  globalShortcut.register('CommandOrControl+Shift+Alt+L', () => {
    if (currentAssistant) startSession(currentAssistant.id);
  });

  globalShortcut.register('CommandOrControl+Shift+Alt+M', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const shouldRestore = mainWindow.isMinimized();
    if (shouldRestore) mainWindow.restore(); else mainWindow.minimize();
    if (sessionWindow && !sessionWindow.isDestroyed()) {
      if (shouldRestore) sessionWindow.restore(); else sessionWindow.minimize();
    }
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

  globalShortcut.register('CommandOrControl+Shift+Alt+O', () => {
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

  ipcMain.on('toggle-session-window', () => {
    if (sessionWindow && !sessionWindow.isDestroyed()) {
      sessionWindow.isVisible() ? sessionWindow.hide() : sessionWindow.show();
    }
  });

  ipcMain.on('hide-bar', () => {
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.hide();
  });

  ipcMain.on('minimize-session-window', () => {
    if (sessionWindow && !sessionWindow.isDestroyed()) sessionWindow.minimize();
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

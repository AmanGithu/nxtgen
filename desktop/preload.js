const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('iAssist', {
  // --- Settings ---
  getInitialSettings: () => ipcRenderer.invoke('get-initial-settings'),

  // --- Session lifecycle ---
  startSession: () => ipcRenderer.send('start-session'),
  stopSession: () => ipcRenderer.send('stop-session'),

  // --- Audio & AI ---
  sendAudioChunk: (audio, mimeType) => ipcRenderer.send('audio-chunk', { audio, mimeType }),
  sendQuery: (message, conversationHistory, responseType) =>
    ipcRenderer.send('custom-query', { message, conversationHistory, responseType }),

  // --- Assistant ---
  setAssistant: (assistant) => ipcRenderer.send('set-assistant', assistant),

  // --- Appearance ---
  setOpacity: (opacity) => ipcRenderer.send('set-opacity', opacity),
  setVisibilityMode: (mode) => ipcRenderer.send('set-visibility-mode', mode),
  setTheme: (theme) => ipcRenderer.send('set-theme', theme),

  // --- Auth ---
  signOut: () => ipcRenderer.send('sign-out'),
  openSignIn: () => ipcRenderer.send('open-sign-in'),

  // --- Navigation ---
  openSettings: () => ipcRenderer.send('open-settings'),
  closeSettings: () => ipcRenderer.send('close-settings'),
  openWebDashboard: () => ipcRenderer.send('open-web-dashboard'),

  // --- Config ---
  setApiBaseUrl: (url) => ipcRenderer.send('set-api-base-url', url),

  // --- Listeners (Main → Renderer) ---
  onTranscriptionUpdate: (callback) => ipcRenderer.on('transcription-update', (_e, data) => callback(data)),
  onLlmAnswer: (callback) => ipcRenderer.on('llm-answer', (_e, data) => callback(data)),
  onAiThinking: (callback) => ipcRenderer.on('ai-thinking', (_e, data) => callback(data)),
  onSessionStateChanged: (callback) => ipcRenderer.on('session-state-changed', (_e, data) => callback(data)),
  onAuthStateChanged: (callback) => ipcRenderer.on('auth-state-changed', (_e, data) => callback(data)),
  onStartAudioCapture: (callback) => ipcRenderer.on('start-audio-capture', (_e, data) => callback(data)),
  onStopAudioCapture: (callback) => ipcRenderer.on('stop-audio-capture', (_e, data) => callback(data)),
  onOpacityUpdate: (callback) => ipcRenderer.on('opacity-update', (_e, data) => callback(data)),
  onThemeUpdate: (callback) => ipcRenderer.on('theme-update', (_e, data) => callback(data)),
  onAssistantUpdate: (callback) => ipcRenderer.on('assistant-update', (_e, data) => callback(data)),
  onAssistantsAvailability: (callback) => ipcRenderer.on('assistants-availability', (_e, data) => callback(data)),
  onSessionStartFailed: (callback) => ipcRenderer.on('session-start-failed', (_e, data) => callback(data)),

  // --- Cleanup ---
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});

# I-Assist Desktop

Electron overlay that listens to a live interview and shows suggested answers. Talks to the NxtGen server over REST — see the [root README](../README.md) for project setup.

```bash
npm install && npm start
```

Point it at a server via the settings panel (API URL), or `API_BASE_URL`. Set `LOG_LEVEL=debug` to log every outgoing request.

## Windows

| File | Window |
|---|---|
| `src/index.html` | Floating bar — assistant selection, start/stop, auth status |
| `src/session-window.html` | In-session transcript and answer overlay |
| `src/settings.html` | Account, opacity, theme, API URL |

Each is self-contained: inline `<style>` and `<script>`, no bundler, no shared modules.

## Shortcuts

- `Ctrl+Shift+Alt+I` — toggle bar
- `Ctrl+Shift+Alt+S` — settings
- `Ctrl+Shift+Alt+O` — toggle overlay (session only)
- `Ctrl+Shift+Alt+X` — stop session (session only)

## Sign-in

The app opens the web app's `desktop-authorize` page in your system browser, which redirects back to a temporary local server with a one-time code. That code is exchanged for tokens, stored in `{userData}/auth.json`. Expired access tokens refresh automatically.

## How audio capture works

System audio loopback → voice activity detection → recording → base64 → `POST /api/iassist/transcribe`. Falls back to the microphone only if display capture fails outright.

Because it captures **system audio**, it hears what your speakers play — the interviewer on a call. It does not hear you talking in the room. If you are testing and nothing transcribes, that is usually why: play a clip through the machine instead.

### Pre-roll

Detecting speech requires hearing it first, so by the time recording could start, the opening word has already happened. Recording on demand loses it — "What do you understand by JVM" arrives as "you understand by JVM".

So the app is **always recording and usually throwing it away**. Two standby recorders run continuously, staggered by half the pre-roll window. When speech is detected nothing is created; the app adopts the *older* standby, which already holds 500–1000ms of audio from before the trigger.

Two recorders rather than one because a single recorder must be recycled to stop its buffer growing, and immediately after a recycle it holds nothing — speech starting there was still clipped. Staggering guarantees one recorder always has history.

Tuning lives in the web admin panel (**Admin → AI Config**): silence gap, amplitude threshold, minimum speech length. Fetched at session start, so no rebuild is needed. If the fetch fails the session still starts on built-in defaults.

## How answers arrive

Answers stream over server-sent events from `POST /api/iassist/query/stream`. The main process forwards each fragment to the overlay, which appends it to the pending question. Text appears while it is still being generated rather than after — the total time is unchanged, the waiting is what disappears.

Scroll position is preserved during streaming so the pane doesn't jump while you read.

### Failure handling

- **Stalled response** — 30s idle timeout on both ends, plus a 120s hard cap. This is not cosmetic: the request queue handles one question at a time, so a response that never completes would silently block every later question in the session.
- **Closed overlay mid-answer** — the stream aborts. Google keeps generating and still bills for it; aborting only stops our side consuming it.
- **Rate limited (429)** — nothing is retried. Gemini's retry delay is 17–30 seconds, and an answer to a question from 30 seconds ago is worse than none: it arrives stale and reorders conversation history. Reduce request rate instead.

A failure currently logs and goes quiet — there is no visible indicator in the overlay yet.

## Gotchas

- Renderer errors go to the Electron devtools console, not the main-process log. A silent session with no log output usually means a renderer-side capture failure.
- `MediaRecorder.stop()` flushes asynchronously. Each recorder owns its own chunk array; sharing one leaks a discarded recorder's tail into the next utterance.
- Minimum utterance length is measured from speech onset, not recorder start — pre-roll is padding and must not make a short utterance look long enough.

/**
 * Minimal console-backed logger with a winston-compatible surface.
 *
 * The ported resume services call logger.debug/info/warn/error; rather than
 * pull in winston for four methods, this maps them onto console and silences
 * debug outside development so query logging doesn't flood production output.
 */
const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDev) console.debug(...args);
  },
  info: (...args: unknown[]) => console.info(...args),
  warn: (...args: unknown[]) => console.warn(...args),
  error: (...args: unknown[]) => console.error(...args),
};

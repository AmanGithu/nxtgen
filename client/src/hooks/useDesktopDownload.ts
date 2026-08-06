import { useEffect, useState } from 'react';
import { iAssistAPI } from '../services/api';

interface DesktopDownload {
  /** Installer URL, or null when no build has been published yet. */
  url: string | null;
  loading: boolean;
}

/**
 * Resolves the desktop installer link that admins set in AI Config.
 *
 * `url` stays null until a build is published, and callers are expected to hide
 * their download control in that case — a visible button with nowhere to go is the
 * behaviour this replaced.
 */
export function useDesktopDownload(): DesktopDownload {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    iAssistAPI.getDesktopDownload()
      .then(res => {
        if (!active) return;
        setUrl(res.data?.windows ?? null);
      })
      // A failed lookup is indistinguishable from "not published" as far as the UI
      // is concerned: either way there is no file to offer.
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, []);

  return { url, loading };
}

/**
 * Google Drive link handling.
 *
 * There is no Drive API integration here — nothing is installed and no OAuth
 * happens — so a "material" is just a file reference we hand to Drive's own
 * viewer. That means Google's sharing setting on the file, not anything in
 * NxtGen, decides whether a student can actually watch it.
 */

/**
 * Pull the file ID out of whatever an admin pastes.
 *
 * Accepts the three shapes people actually copy out of Drive, plus a bare ID:
 *   https://drive.google.com/file/d/<ID>/view?usp=sharing
 *   https://drive.google.com/open?id=<ID>
 *   https://docs.google.com/document/d/<ID>/edit
 */
export function extractDriveFileId(input: string): string | null {
  const value = input.trim();
  if (!value) return null;

  // A bare ID — long, opaque, and no characters a URL or prose would carry.
  if (/^[a-zA-Z0-9_-]{10,}$/.test(value)) return value;

  const patterns = [
    /\/d\/([a-zA-Z0-9_-]{10,})/,   // /file/d/<ID>/ and /document/d/<ID>/
    /[?&]id=([a-zA-Z0-9_-]{10,})/, // ?id=<ID>
  ];
  for (const re of patterns) {
    const m = value.match(re);
    if (m) return m[1];
  }
  return null;
}

/**
 * Drive's embedded viewer. Works for video, PDF, Docs and Slides alike, and
 * omits the download control — which is the whole basis of the "DRM-lite"
 * claim on the player.
 */
export function drivePreviewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

/** Best-effort file ID for a stored material, whichever column was filled. */
export function materialFileId(m: { driveFileId?: string | null; driveUrl?: string | null }): string | null {
  return m.driveFileId?.trim() || (m.driveUrl ? extractDriveFileId(m.driveUrl) : null);
}

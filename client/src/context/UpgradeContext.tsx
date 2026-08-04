import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import api from '../services/api';

/** Payload the server sends with a 402, describing what was blocked. */
export interface LimitBlock {
  message: string;
  feature?: string;
  limit?: number;
  used?: number;
}

interface UpgradeContextValue {
  block: LimitBlock | null;
  /** Open the dialog manually, for gates the client detects before calling. */
  promptUpgrade: (block: LimitBlock) => void;
  dismiss: () => void;
}

const UpgradeContext = createContext<UpgradeContextValue | undefined>(undefined);

/** Event name the axios interceptor dispatches on a 402 LIMIT_REACHED. */
export const LIMIT_EVENT = 'nxtgen:limit-reached';

/**
 * Surfaces every plan limit as one upgrade prompt.
 *
 * The interceptor raises a window event rather than importing this module, so
 * the API layer stays free of React and any call anywhere in the app gets the
 * prompt without its own error handling. Individual call sites no longer need
 * to distinguish "blocked by plan" from "request failed" — which is what made
 * a limit look like a crash.
 */
export const UpgradeProvider = ({ children }: { children: ReactNode }) => {
  const [block, setBlock] = useState<LimitBlock | null>(null);

  useEffect(() => {
    const onLimit = (e: Event) => setBlock((e as CustomEvent<LimitBlock>).detail);
    window.addEventListener(LIMIT_EVENT, onLimit);
    return () => window.removeEventListener(LIMIT_EVENT, onLimit);
  }, []);

  return (
    <UpgradeContext.Provider
      value={{ block, promptUpgrade: setBlock, dismiss: () => setBlock(null) }}
    >
      {children}
    </UpgradeContext.Provider>
  );
};

export const useUpgrade = () => {
  const ctx = useContext(UpgradeContext);
  if (!ctx) throw new Error('useUpgrade must be used within an UpgradeProvider');
  return ctx;
};

/** Grant the paid plan. No checkout yet — the server decides if this is allowed. */
export const purchaseUpgrade = async () => {
  const res = await api.post('/billing/upgrade');
  return res.data;
};

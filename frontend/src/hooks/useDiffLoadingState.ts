import { useEffect, useMemo, useState } from 'react';
import type { Diff } from 'shared/types';

type LoadingState = 'loading' | 'loaded' | 'timed-out';

const LOADING_TIMEOUT_MS = 3000;

export function useDiffLoadingState(diffs: Diff[]) {
  const [timedOut, setTimedOut] = useState(false);
  const hasDiffs = diffs.length > 0;

  useEffect(() => {
    if (hasDiffs) return;

    const timer = setTimeout(() => {
      setTimedOut(true);
    }, LOADING_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [hasDiffs]);

  const loadingState: LoadingState = useMemo(() => {
    if (hasDiffs) return 'loaded';
    if (timedOut) return 'timed-out';
    return 'loading';
  }, [hasDiffs, timedOut]);

  return {
    loadingState,
    isLoading: loadingState === 'loading',
  };
}

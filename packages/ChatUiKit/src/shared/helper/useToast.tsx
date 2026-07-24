import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Toast } from './Toast';

/**
 * Lightweight controller for the shared `Toast` component — the app's default
 * lightweight notification (used instead of a native `Alert`). Returns a
 * `showToast(message)` action and the `ToastElement` to drop into the render tree.
 */
export function useToast(durationMs = 3000) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (msg: string) => {
      setMessage(msg);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setMessage(null), durationMs);
    },
    [durationMs]
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const ToastElement = message ? <Toast message={message} /> : null;

  return { showToast, ToastElement };
}

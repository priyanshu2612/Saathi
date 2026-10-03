"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { X } from "@phosphor-icons/react";

interface ToastApi {
  showToast: (message: string) => void;
  /** A dismissible bottom sheet with a dimmed backdrop (tap outside or the X to close). */
  showNotice: (message: string) => void;
}

const ToastContext = createContext<ToastApi>({ showToast: () => {}, showNotice: () => {} });

export const useToast = () => useContext(ToastContext);

const VISIBLE_MS = 3500;

/** App-wide toast: survives route changes, so it can be fired just before navigating. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((next: string) => {
    setMessage(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), VISIBLE_MS);
  }, []);

  const showNotice = useCallback((next: string) => setNotice(next), []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showNotice }}>
      {children}
      {message && (
        <div
          role="status"
          className="pointer-events-none fixed inset-x-0 top-5 z-[100] flex justify-center px-5"
        >
          <p className="max-w-[360px] rounded-full bg-dusk-900 px-4 py-2.5 text-center text-[13px] font-medium text-white shadow-float">
            {message}
          </p>
        </div>
      )}
      {notice && (
        <div className="fixed inset-y-0 left-1/2 z-[90] flex w-full max-w-[430px] -translate-x-1/2 flex-col">
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setNotice(null)}
            className="flex-1 cursor-default bg-black/50"
          />
          <div className="relative rounded-t-[24px] bg-card px-6 pb-[max(28px,env(safe-area-inset-bottom))] pt-8 text-center shadow-float">
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Close"
              className="tap-target absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-linen-100 text-dusk-700"
            >
              <X size={16} weight="bold" />
            </button>
            <p className="text-[15px] text-dusk-700">{notice}</p>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

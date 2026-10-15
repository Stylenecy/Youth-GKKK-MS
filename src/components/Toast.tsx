"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface ToastInput {
  message: string;
  /** e.g. "Batalkan" — the toast stays until closed when an action exists. */
  action?: { label: string; run: () => Promise<{ success: boolean; error?: string }> };
}

interface ToastState extends ToastInput {
  id: number;
  status: "idle" | "working" | "failed";
  error?: string;
}

const ToastContext = createContext<(t: ToastInput) => void>(() => {});

/**
 * One feedback channel for every dashboard write. Lives in the layout, so a
 * toast survives the row it talks about disappearing on revalidate (delete
 * → row gone → "Batalkan" still reachable).
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const seq = useRef(0);

  const show = useCallback((t: ToastInput) => {
    seq.current += 1;
    setToast({ ...t, id: seq.current, status: "idle" });
  }, []);

  // Plain confirmations fade on their own; ones with an action wait.
  useEffect(() => {
    if (!toast || toast.action) return;
    const id = toast.id;
    const timer = setTimeout(
      () => setToast((cur) => (cur?.id === id ? null : cur)),
      5000
    );
    return () => clearTimeout(timer);
  }, [toast]);

  async function runAction() {
    if (!toast?.action) return;
    const current = toast;
    setToast({ ...current, status: "working" });
    try {
      const result = await current.action!.run();
      setToast(
        result.success
          ? { id: current.id + 0.5, message: "Perubahan dibatalkan.", status: "idle" }
          : { ...current, status: "failed", error: result.error ?? "Gagal membatalkan." }
      );
    } catch {
      // A thrown server action (network drop, server error) must not leave
      // the button stuck on "Memproses…" — surface it and let them close.
      setToast({
        ...current,
        status: "failed",
        error: "Gagal membatalkan — koneksi atau server bermasalah. Muat ulang halaman lalu periksa lagi.",
      });
    }
  }

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-1/2 z-50 w-[calc(100%-2.5rem)] max-w-md -translate-x-1/2 rounded-xl border border-line bg-surface p-4 shadow-2xl lg:bottom-8"
        >
          <p className="text-sm text-ink">{toast.message}</p>
          {toast.status === "failed" && (
            <p role="alert" className="mt-2 text-xs text-danger">
              {toast.error}
            </p>
          )}
          <div className="mt-2.5 flex gap-2">
            {toast.action && toast.status !== "failed" && (
              <button
                type="button"
                disabled={toast.status === "working"}
                onClick={runAction}
                className="btn-outline flex-1 justify-center text-xs disabled:opacity-60"
              >
                {toast.status === "working" ? "Memproses…" : toast.action.label}
              </button>
            )}
            <button
              type="button"
              onClick={() => setToast(null)}
              className="btn-outline flex-1 justify-center text-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

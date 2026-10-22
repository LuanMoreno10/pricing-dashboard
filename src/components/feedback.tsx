import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button, Modal } from './ui';

/* ------------------------------------------------------------------ */
/* Confirmation dialog (promise based) + toasts                        */
/* ------------------------------------------------------------------ */

export interface ConfirmOptions {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  /** Destructive confirmations get a red button. Defaults to true. */
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;
type ToastFn = (message: string, tone?: 'success' | 'error') => void;

const ConfirmCtx = createContext<ConfirmFn | null>(null);
const ToastCtx = createContext<ToastFn | null>(null);

interface Toast {
  id: number;
  message: string;
  tone: 'success' | 'error';
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setPending(options);
    });
  }, []);

  const settle = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setPending(null);
  };

  const toast = useCallback<ToastFn>((message, tone = 'success') => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, message, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  return (
    <ConfirmCtx.Provider value={confirm}>
      <ToastCtx.Provider value={toast}>
        {children}
        {pending && (
          <Modal
            size="sm"
            title={pending.title}
            onClose={() => settle(false)}
            footer={
              <>
                <Button onClick={() => settle(false)}>Cancel</Button>
                <Button variant={pending.danger === false ? 'primary' : 'danger'} onClick={() => settle(true)}>
                  {pending.confirmLabel ?? 'Delete'}
                </Button>
              </>
            }
          >
            <div className="flex gap-3">
              <AlertTriangle size={20} className="mt-0.5 shrink-0 text-warn" aria-hidden="true" />
              <div className="text-sm text-muted">{pending.message}</div>
            </div>
          </Modal>
        )}
        <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2 print:hidden" aria-live="polite">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-2 rounded-md border bg-surface px-3.5 py-2.5 text-sm shadow-lg ${
                t.tone === 'error' ? 'border-danger/50 text-danger' : 'border-border'
              }`}
            >
              {t.tone === 'error' ? <AlertTriangle size={16} aria-hidden="true" /> : <CheckCircle2 size={16} className="text-accent" aria-hidden="true" />}
              {t.message}
            </div>
          ))}
        </div>
      </ToastCtx.Provider>
    </ConfirmCtx.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmCtx);
  if (!ctx) throw new Error('useConfirm must be used inside <FeedbackProvider>');
  return ctx;
}

export function useToast(): ToastFn {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used inside <FeedbackProvider>');
  return ctx;
}

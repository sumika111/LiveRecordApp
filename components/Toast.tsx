"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type ToastType = "success" | "error";
type Toast = { id: number; type: ToastType; text: string };

type ToastContextValue = {
  show: (type: ToastType, text: string) => void;
  success: (text: string) => void;
  error: (text: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;
const TOAST_DURATION = 4000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((type: ToastType, text: string) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION);
  }, []);

  const success = useCallback((text: string) => show("success", text), [show]);
  const error = useCallback((text: string) => show("error", text), [show]);

  return (
    <ToastContext.Provider value={{ show, success, error }}>
      {children}
      <div
        className="pointer-events-none fixed left-0 right-0 top-4 z-[100] mx-auto flex max-w-md flex-col items-center gap-2 px-4"
        aria-live="polite"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className={
                t.type === "success"
                  ? "rounded-button border border-live-200 bg-live-50 px-4 py-3 text-sm font-bold text-live-800 shadow-lg"
                  : "rounded-button border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800 shadow-lg"
              }
            >
              {t.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      show: () => {},
      success: () => {},
      error: () => {},
    };
  }
  return ctx;
}

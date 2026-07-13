import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const ICONS = {
  success: <CheckCircle size={17} className="text-green-500 flex-shrink-0" />,
  error: <XCircle size={17} className="text-red-500 flex-shrink-0" />,
  info: <Info size={17} className="text-blue-500 flex-shrink-0" />,
};

function ToastItem({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(toast.id), toast.duration ?? 3500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  return (
    <div
      className="flex items-start gap-3 bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-3 min-w-[260px] max-w-sm"
      role="alert"
    >
      {ICONS[toast.type] ?? ICONS.info}
      <p className="text-sm text-gray-800 flex-1">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="text-gray-400 hover:text-gray-600 ml-1 flex-shrink-0"
        aria-label="Fermer"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback((message, type = "info", duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const toast = {
    success: (msg, dur) => add(msg, "success", dur),
    error: (msg, dur) => add(msg, "error", dur),
    info: (msg, dur) => add(msg, "info", dur),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onClose={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

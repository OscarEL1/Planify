import { useCallback, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { ToastContext } from './toast-context';

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, variant = 'success') => {
    const id = crypto.randomUUID();

    setToasts((prev) => [
      ...prev,
      { id, message, variant },
    ]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map(({ id, message, variant }) => (
          <div
            key={id}
            role="status"
            className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${
              variant === 'success'
                ? 'bg-[#22C55E]'
                : 'bg-[#EF4444]'
            }`}
          >
            {variant === 'success' ? (
              <CheckCircle2 size={18} />
            ) : (
              <XCircle size={18} />
            )}

            {message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
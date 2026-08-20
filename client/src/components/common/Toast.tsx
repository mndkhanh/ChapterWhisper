import React from 'react';

interface ToastProps {
  message: string | null;
  /** Renders the dismiss control. Without it the toast can only time out. */
  onDismiss?: () => void;
  /** Styles the toast as a failure and announces it assertively. */
  isError?: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, onDismiss, isError = false }) => {
  if (!message) return null;
  return (
    <div
      // A toast is the only error surface in the app, so it has to reach a
      // screen reader too: failures interrupt, everything else waits its turn.
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className={
        'fixed bottom-8 right-8 z-50 bg-[#292622] text-[#d8cbb8] border px-6 py-4 rounded-[2px] text-xs font-mono shadow-2xl flex items-start gap-3 max-w-md animate-[slideUp_0.3s_ease-out] ' +
        (isError ? 'border-[#a3402c]' : 'border-[#d49653]/40')
      }
    >
      <span
        className={
          'w-2 h-2 rounded-full shrink-0 mt-1 ' +
          (isError ? 'bg-[#a3402c]' : 'bg-[#d49653] animate-pulse')
        }
      />
      <span className="leading-relaxed flex-1">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="shrink-0 -mr-2 -mt-1 px-2 py-1 text-[#978e81] hover:text-[#d8cbb8] transition-colors cursor-pointer"
        >
          ✕
        </button>
      )}
    </div>
  );
};

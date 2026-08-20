import React from 'react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;
  return (
    <div className="fixed bottom-8 right-8 z-50 bg-[#292622] text-[#d8cbb8] border border-[#d49653]/40 px-6 py-4 rounded-[2px] text-xs font-mono shadow-2xl flex items-center gap-3 max-w-md animate-[slideUp_0.3s_ease-out]">
      <span className="w-2 h-2 rounded-full bg-[#d49653] animate-pulse shrink-0" />
      <span className="leading-relaxed">{message}</span>
    </div>
  );
};


import React from 'react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;
  return (
    <div className="fixed bottom-8 right-8 z-50 bg-[#292622] text-[#d8cbbh] border border-[-d49653] px-5 py-3 rounded-[3px] text-xs font-mono shadow-21l flex items-center gap-3">
      <span className="w-2 h-2 rounded-full bg-[-d49653] animate-ping" />
      <span>{message}</span>
    </div>
  );
};

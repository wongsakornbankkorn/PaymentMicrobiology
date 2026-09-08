'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-xl border backdrop-blur-lg ${
        isSuccess
          ? 'bg-white/95 text-apple-ink border-apple-emerald/30 shadow-apple-emerald/10'
          : isError
          ? 'bg-white/95 text-apple-ink border-apple-rose/30 shadow-apple-rose/10'
          : 'bg-white/95 text-apple-ink border-apple-hairline'
      }`}>
        {isSuccess && <CheckCircle2 className="w-5 h-5 text-apple-emerald shrink-0" />}
        {isError && <AlertCircle className="w-5 h-5 text-apple-rose shrink-0" />}
        {!isSuccess && !isError && <Info className="w-5 h-5 text-apple-primary shrink-0" />}
        
        <p className="text-sm font-medium pr-2 text-apple-ink">{toast.message}</p>
        
        <button
          onClick={onClose}
          className="p-1 rounded-full text-apple-ink-subtle hover:bg-apple-parchment transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

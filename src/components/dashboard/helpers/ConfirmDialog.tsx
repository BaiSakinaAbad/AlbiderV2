import React from 'react';
import { motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

export function ConfirmDialog({ title, message, onConfirm, onCancel, variant = 'primary' }: { title: string, message: string, onConfirm: () => void, onCancel: () => void, variant?: 'primary' | 'danger' }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onCancel}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full flex flex-col items-center text-center"
      >
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${variant === 'danger' ? 'bg-rose-100' : 'bg-blue-100'}`}>
          <AlertTriangle size={32} className={variant === 'danger' ? 'text-rose-600' : 'text-blue-600'} />
        </div>
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">{title}</h3>
        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-8">{message}</p>
        
        <div className="flex gap-3 w-full">
          <button 
            onClick={onCancel} 
            className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className={`flex-1 py-3 ${variant === 'danger' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'} text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-xl transition-all`}
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </div>
  );
}

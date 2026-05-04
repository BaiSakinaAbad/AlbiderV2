import React from 'react';

export function FormInput({ label, placeholder }: { label: string, placeholder: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <input 
        type="text" 
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-300 text-slate-700"
      />
    </div>
  );
}

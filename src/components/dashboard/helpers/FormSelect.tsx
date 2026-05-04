import React from 'react';

export function FormSelect({ 
  label, 
  options, 
  value, 
  onChange, 
  disabled, 
  placeholder = "Select Option" 
}: { 
  label: string, 
  options: string[], 
  value: string, 
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, 
  disabled?: boolean,
  placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <div className="relative">
        <select 
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none cursor-pointer ${
            disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'text-slate-700'
          }`}
        >
          <option value="" disabled>{placeholder}</option>
          {options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>
    </div>
  );
}

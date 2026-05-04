import React from 'react';

export function NavTab({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={`px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center space-x-2 transition-all ${
        active 
          ? 'bg-slate-900 text-white shadow-md' 
          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

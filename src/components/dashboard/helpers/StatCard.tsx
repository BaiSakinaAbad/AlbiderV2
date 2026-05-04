import React from 'react';

export function StatCard({ label, value, delta, icon, color, bg }: { label: string, value: string, delta: string, icon: React.ReactNode, color: string, bg: string }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
      <div className={`${bg} ${color} w-10 h-10 rounded-lg flex items-center justify-center mb-4 relative z-10`}>
        {React.cloneElement(icon as React.ReactElement, { size: 18 } as any)}
      </div>
      <div className="relative z-10">
        <h4 className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] mb-1">{label}</h4>
        <div className="flex items-baseline justify-between">
          <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
          <span className={`text-[10px] font-black uppercase tracking-widest ${delta.includes('+') || delta.includes('%') ? 'text-emerald-500' : 'text-slate-400'}`}>{delta}</span>
        </div>
      </div>
      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
        {React.cloneElement(icon as React.ReactElement, { size: 100 } as any)}
      </div>
    </div>
  );
}

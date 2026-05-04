import React from 'react';

export function LogEntry({ time, user, action, detail, status }: { time: string, user: string, action: string, detail: string, type: string, status?: string }) {
  return (
    <div className="p-3 px-4 flex items-start hover:bg-slate-50 transition-colors border-l-2 border-transparent hover:border-blue-500">
      <div className="text-[10px] font-mono text-slate-400 w-12 pt-0.5 font-bold">{time}</div>
      <div className="flex-1 ml-4 ring-1 ring-slate-100 hover:ring-slate-200 rounded p-2 transition-all">
        <div className="flex items-center mb-1">
          <span className="text-[10px] font-black text-slate-900 tracking-widest uppercase">{user}</span>
          <span className={`ml-3 px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest border ${
            status === 'error' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}>
            {action}
          </span>
        </div>
        <p className={`text-[10px] font-medium tracking-wide ${status === 'error' ? 'text-rose-500' : 'text-slate-500'}`}>{detail}</p>
      </div>
    </div>
  );
}

import React from 'react';
import { motion } from 'motion/react';
import { GradeSettings } from '../../../types.ts';

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

export function LogEntry({ time, user, action, detail, type, status }: { time: string, user: string, action: string, detail: string, type: string, status?: string }) {
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

export function EditGradeModal({ grade, onClose, onSave }: { grade: GradeSettings, onClose: () => void, onSave: (g: GradeSettings) => void }) {
  const [time, setTime] = React.useState(grade.dismissal_time);
  const [grace, setGrace] = React.useState(grade.grace_period_mins.toString());

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-md bg-white rounded-2xl shadow-3xl overflow-hidden p-8"
      >
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Adjust Dismissal Schedule</h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-8">{grade.grade} Window</p>

        <div className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Schedule Start Time</label>
            <input 
              type="time" 
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-xl font-mono font-black text-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grace Period (Minutes)</label>
            <input 
              type="number" 
              value={grace}
              onChange={(e) => setGrace(e.target.value)}
              placeholder="15"
              className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-700 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
            />
          </div>
        </div>

        <div className="mt-10 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:text-slate-600"
          >
            Go Back
          </button>
          <button 
            onClick={() => onSave({ ...grade, dismissal_time: time, grace_period_mins: parseInt(grace) })}
            className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-200"
          >
            Apply Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}

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

import { AlertTriangle } from 'lucide-react';

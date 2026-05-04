import React from 'react';
import { motion } from 'motion/react';
import { GradeSettings } from '../../../types';

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

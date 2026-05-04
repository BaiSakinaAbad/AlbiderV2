import React, { useState } from 'react';
import { Users, GraduationCap, Settings, UserPlus, FileText, Activity, X, Upload, Smartphone, Clock, AlertTriangle, Search, Download, Trash2, Shield, RotateCcw, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Profile, GradeSettings } from '../../types.ts';
import { seedDatabase } from '../../lib/seedDb.ts';
import { FormInput } from './helpers/FormInput';
import { FormSelect } from './helpers/FormSelect';
import { NavTab } from './helpers/NavTab';
import { StatCard } from './helpers/StatCard';
import { LogEntry } from './helpers/LogEntry';
import { EditGradeModal } from './helpers/EditGradeModal';
import { ConfirmDialog } from './helpers/ConfirmDialog';

function FetcherCard({ type, color }: { type: string, color: string }) {
  return (
    <div className={`p-6 bg-white border border-slate-100 border-l-4 ${color} rounded-2xl shadow-sm space-y-4`}>
      <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">{type}</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput label="Full Name" placeholder="Authorized Name" />
        <FormInput label="Phone Number" placeholder="+63 9xx xxx xxxx" />
      </div>
      <div className="pt-2 flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <Smartphone size={14} className="mr-2" />
        SMS Alerts Enabled for this contact
      </div>
    </div>
  );
}

const GRADE_SECTIONS: Record<string, string[]> = {
  'Kindergarten': ['Apple', 'Berry', 'Cherry'],
  'Grade 1': ['St. James', 'St. Luke', 'St. Mark'],
  'Grade 2': ['St. Jude', 'St. Anne', 'St. Mary'],
  'Grade 3': ['Diamond', 'Crystal', 'Pearl'],
  'Grade 4': ['St. Jude', 'St. Paul', 'St. Peter']
};

function EnrollmentModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<'manual' | 'bulk'>('manual');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGrade(e.target.value);
    setSelectedSection(''); // Reset section when grade changes
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Student Enrollment</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Register new pupils & authorized fetchers</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-slate-100 font-sans">
          <button 
            onClick={() => setMode('manual')}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${mode === 'manual' ? 'text-blue-600 bg-white border-b-2 border-blue-600' : 'text-slate-400 bg-slate-50 hover:bg-slate-100'}`}
          >
            Manual Entry
          </button>
          <button 
            onClick={() => setMode('bulk')}
            className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all ${mode === 'bulk' ? 'text-blue-600 bg-white border-b-2 border-blue-600' : 'text-slate-400 bg-slate-50 hover:bg-slate-100'}`}
          >
            Bulk Upload (CSV)
          </button>
        </div>

        <div className="flex-1 overflow-auto p-8">
          {mode === 'manual' ? (
            <div className="space-y-10">
              <section className="space-y-4">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded flex items-center justify-center font-bold">1</div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Student Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput label="Full Name" placeholder="e.g. Julian Alvarez" />
                  <FormInput label="Student ID (LRN)" placeholder="e.g. 29401" />
                  <FormSelect 
                    label="Grade Level" 
                    options={Object.keys(GRADE_SECTIONS)} 
                    value={selectedGrade} 
                    onChange={handleGradeChange}
                    placeholder="Choose Grade"
                  />
                  <FormSelect 
                    label="Section" 
                    options={selectedGrade ? GRADE_SECTIONS[selectedGrade] : []} 
                    value={selectedSection} 
                    onChange={(e) => setSelectedSection(e.target.value)}
                    disabled={!selectedGrade}
                    placeholder={selectedGrade ? "Choose Section" : "Select Grade First"}
                  />
                </div>
              </section>

              <section className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded flex items-center justify-center font-bold">2</div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Authorized Fetchers (Case 1, 2, 3)</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-8">
                  <FetcherCard type="Case 1 (Primary Parent)" color="border-l-blue-500" />
                  <FetcherCard type="Case 2 (Permanent Guardian)" color="border-l-emerald-500" />
                  <FetcherCard type="Case 3 (Temporary/Authorized)" color="border-l-amber-500" />
                </div>
              </section>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center border-4 border-dashed border-slate-100 rounded-[2rem] p-12 text-center group hover:border-blue-100 transition-colors">
              <div className="bg-slate-50 p-8 rounded-full mb-6 group-hover:bg-blue-50 transition-colors">
                <Upload size={48} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Bulk Enrollment</h3>
              <p className="text-sm text-slate-500 font-medium max-w-sm mt-3 leading-relaxed">
                Download the CSV template and upload it with your complete student manifest to enroll entire grade levels at once.
              </p>
              <div className="mt-8 flex gap-4">
                <button className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                  Download Template
                </button>
                <button className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200">
                  Select File
                </button>
              </div>
            </div>
          )}
        </div>

        {mode === 'manual' && (
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <button onClick={onClose} className="px-6 py-3 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600">Cancel</button>
            <button onClick={onClose} className="px-10 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all">
              Save & Register Student
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

const MOCK_GRADES: GradeSettings[] = [
  { grade: 'Kindergarten', dismissal_time: '14:00', grace_period_mins: 15 },
  { grade: 'Grade 1', dismissal_time: '14:30', grace_period_mins: 20 },
  { grade: 'Grade 2', dismissal_time: '14:45', grace_period_mins: 20 },
  { grade: 'Grade 3', dismissal_time: '15:00', grace_period_mins: 20 },
  { grade: 'Grade 4', dismissal_time: '15:30', grace_period_mins: 30 },
];

const MOCK_TEACHERS = [
  { id: '1', name: 'Althea Abad', grade: 'Grade 2', section: 'St. Jude', studentsCount: 30, email: 'althea.abad@school.edu', isDeleted: false },
  { id: '2', name: 'Maria Lim', grade: 'Grade 2', section: 'St. Anne', studentsCount: 28, email: 'maria.lim@school.edu', isDeleted: false },
  { id: '3', name: 'Joshua Cruz', grade: 'Grade 3', section: 'Diamond', studentsCount: 32, email: 'joshua.cruz@school.edu', isDeleted: false },
  { id: '4', name: 'Elena Santos', grade: 'Kindergarten', section: 'Apple', studentsCount: 20, email: 'elena.santos@school.edu', isDeleted: false },
];

const MOCK_GUARDS = [
  { id: '1', name: 'Ramos, J.', shiftStart: '06:00', shiftEnd: '14:00', gate: 'Gate 01', isDeleted: false },
  { id: '2', name: 'Santos, M.', shiftStart: '14:00', shiftEnd: '22:00', gate: 'Gate 02', isDeleted: false },
  { id: '3', name: 'Dela Cruz, A.', shiftStart: '08:00', shiftEnd: '16:00', gate: 'Gate 03', isDeleted: false },
];

const MOCK_LOGS = [
  { id: '1', time: "15:42", user: "GUARD_RAMOS", action: "SCANNED_QR", detail: "STUDENT_ID: #LEO-BAISAKINA (CASE_01)", type: "scan" },
  { id: '2', time: "15:44", user: "TEACHER_ABAD", action: "RELEASE_OK", detail: "JULIAN_ALVAREZ MARKED AS DISMISSED", type: "release" },
  { id: '3', time: "15:45", user: "SYS_BOT", action: "SMS_DISPATCH", detail: "SMS_CONFIRMATION_SENT (+63 912...)", type: "system" },
  { id: '4', time: "15:50", user: "ADMIN_ROOT", action: "CONFIG_MOD", detail: "SET_KINDERGARTEN_TIME -> 14:15", type: "edit" },
  { id: '5', time: "16:05", user: "GUARD_RAMOS", action: "ACCESS_DENIED", detail: "UNAUTHORIZED_FETCHER_REJECTED", status: "error", type: "alert" },
  { id: '6', time: "14:12", user: "GUARD_RAMOS", action: "SCANNED_QR", detail: "STUDENT_ID: #MARCUS-TAN (CASE_01)", type: "scan" },
  { id: '7', time: "14:05", user: "SYSTEM", action: "AUTO_LOCK", detail: "GATE 03 CLOSED FOR SESSION", type: "system" },
  { id: '8', time: "13:58", user: "TEACHER_LIM", action: "RELEASE_OK", detail: "SOPHIA GARCIA MARKED DISMISSED", type: "release" },
];

function TeacherFormModal({ teacher, onClose, onSave }: { teacher?: any, onClose: () => void, onSave: (teacher: any) => void }) {
  const [name, setName] = useState(teacher?.name || '');
  const [email, setEmail] = useState(teacher?.email || '');
  const [selectedGrade, setSelectedGrade] = useState(teacher?.grade || '');
  const [selectedSection, setSelectedSection] = useState(teacher?.section || '');

  const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGrade(e.target.value);
    setSelectedSection('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-3xl overflow-hidden p-8"
      >
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{teacher ? 'Edit' : 'Add'} Faculty Member</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Assign teacher to grade and section</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} type="text" placeholder="e.g. Maria Clara" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-300 text-slate-700" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="e.g. maria@school.edu" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-300 text-slate-700" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormSelect 
              label="Grade Level" 
              options={Object.keys(GRADE_SECTIONS)} 
              value={selectedGrade} 
              onChange={handleGradeChange}
              placeholder="Choose Grade"
            />
            <FormSelect 
              label="Section" 
              options={selectedGrade ? GRADE_SECTIONS[selectedGrade] : []} 
              value={selectedSection} 
              onChange={(e) => setSelectedSection(e.target.value)}
              disabled={!selectedGrade}
              placeholder={selectedGrade ? "Choose Section" : "Select Grade First"}
            />
          </div>
        </div>

        <div className="mt-10 flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:text-slate-600 transition-colors bg-slate-50 rounded-xl hover:bg-slate-100">
            Cancel
          </button>
          <button 
            onClick={() => onSave({ ...teacher, name, email, grade: selectedGrade, section: selectedSection })}
            className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all"
          >
            {teacher ? 'Update' : 'Create'} Profile
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function GuardFormModal({ guard, onClose, onSave }: { guard?: any, onClose: () => void, onSave: (guard: any) => void }) {
  const [name, setName] = useState(guard?.name || '');
  const [shiftStart, setShiftStart] = useState(guard?.shiftStart || '');
  const [shiftEnd, setShiftEnd] = useState(guard?.shiftEnd || '');
  const [gate, setGate] = useState(guard?.gate || '');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-3xl overflow-hidden p-8"
      >
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{guard ? 'Edit' : 'Add'} Guard Member</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Assign guard shift and gate</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} type="text" placeholder="e.g. Ramos, J." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-300 text-slate-700" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Shift Start</label>
              <input value={shiftStart} onChange={e => setShiftStart(e.target.value)} type="time" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-300 text-slate-700" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Shift End</label>
              <input value={shiftEnd} onChange={e => setShiftEnd(e.target.value)} type="time" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-300 text-slate-700" />
            </div>
          </div>
          <FormSelect 
            label="Gate Assignment" 
            options={['Gate 01', 'Gate 02', 'Gate 03']} 
            value={gate} 
            onChange={(e) => setGate(e.target.value)}
            placeholder="Choose Gate"
          />
        </div>

        <div className="mt-10 flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:text-slate-600 transition-colors bg-slate-50 rounded-xl hover:bg-slate-100">
            Cancel
          </button>
          <button 
            onClick={() => onSave({ ...guard, name, shiftStart, shiftEnd, gate })}
            className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all"
          >
            {guard ? 'Update' : 'Create'} Profile
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminDashboard({ user }: { user: Profile }) {
  const [activeView, setActiveView] = useState<'overview' | 'settings' | 'logs' | 'directory' | 'archived'>('overview');
  const [directoryTab, setDirectoryTab] = useState<'faculty' | 'guards'>('faculty');
  
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [grades, setGrades] = useState<GradeSettings[]>(MOCK_GRADES);
  const [editingGrade, setEditingGrade] = useState<GradeSettings | null>(null);
  const [logs, setLogs] = useState(MOCK_LOGS);
  const [isClearLogsConfirmOpen, setIsClearLogsConfirmOpen] = useState(false);

  const [teachers, setTeachers] = useState(MOCK_TEACHERS);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  
  const [guards, setGuards] = useState(MOCK_GUARDS);
  const [editingGuard, setEditingGuard] = useState<any>(null);
  const [isGuardModalOpen, setIsGuardModalOpen] = useState(false);

  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'teacher' | 'guard', name: string } | null>(null);

  const [isSeeding, setIsSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleSeedDb = async () => {
    setIsSeeding(true);
    setSeedStatus(null);
    try {
      await seedDatabase();
      setSeedStatus({ type: 'success', message: 'Database seeded successfully!' });
    } catch (err) {
      setSeedStatus({ type: 'error', message: err instanceof Error ? err.message : 'Failed to seed database.' });
    } finally {
      setIsSeeding(false);
      setTimeout(() => setSeedStatus(null), 5000);
    }
  };

  const updateGrade = (updated: GradeSettings) => {
    setGrades(grades.map(g => g.grade === updated.grade ? updated : g));
    setEditingGrade(null);
  };

  const handleExportLogs = () => {
    const headers = "Time,User,Action,Detail\n";
    const csvContent = logs.map(l => `${l.time},${l.user},${l.action},${l.detail}`).join("\n");
    const blob = new Blob([headers + csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearLogs = () => {
    setLogs([]);
    setIsClearLogsConfirmOpen(false);
  };

  const handleDeleteItem = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'teacher') {
      setTeachers(teachers.map(t => t.id === itemToDelete.id ? { ...t, isDeleted: true } : t));
    } else {
      setGuards(guards.map(g => g.id === itemToDelete.id ? { ...g, isDeleted: true } : g));
    }
    setItemToDelete(null);
  };

  const handleRestoreItem = (id: string, type: 'teacher' | 'guard') => {
    if (type === 'teacher') {
      setTeachers(teachers.map(t => t.id === id ? { ...t, isDeleted: false } : t));
    } else {
      setGuards(guards.map(g => g.id === id ? { ...g, isDeleted: false } : g));
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter font-sans uppercase">Admin Mission Control</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center">
            <span className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></span>
            System Oversight • Live Terminal
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner overflow-x-auto overflow-y-hidden" style={{scrollbarWidth: 'none'}}>
            <NavTab active={activeView === 'overview'} onClick={() => setActiveView('overview')} label="Overview" icon={<Activity size={14} />} />
            <NavTab active={activeView === 'settings'} onClick={() => setActiveView('settings')} label="Settings" icon={<Settings size={14} />} />
            <NavTab active={activeView === 'directory'} onClick={() => setActiveView('directory')} label="Staff Directory" icon={<Users size={14} />} />
            <NavTab active={activeView === 'archived'} onClick={() => setActiveView('archived')} label="Archived" icon={<Trash2 size={14} />} />
            <NavTab active={activeView === 'logs'} onClick={() => setActiveView('logs')} label="Audit Logs" icon={<FileText size={14} />} />
          </div>
          <button 
            onClick={handleSeedDb}
            disabled={isSeeding}
            className="flex items-center px-4 py-3 bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200 rounded-xl font-black transition-all text-[10px] uppercase tracking-widest active:scale-95 group disabled:opacity-50"
          >
            {isSeeding ? (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-amber-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <Database size={16} className="mr-2" /> 
            )}
            {isSeeding ? 'Seeding...' : 'Seed DB'}
          </button>
          <button 
            onClick={() => setIsEnrollModalOpen(true)}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all text-[10px] uppercase tracking-widest active:scale-95 group"
          >
            <UserPlus size={16} className="mr-3 group-hover:rotate-12 transition-transform" /> 
            Enroll Student
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isSeeding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9 }}
               className="relative px-8 py-10 bg-white rounded-[2rem] shadow-2xl flex flex-col items-center gap-6 text-center max-w-sm w-full"
            >
               <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                 <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
               </div>
               <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Seeding Database</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Please wait while mock records are populated across collections...</p>
               </div>
            </motion.div>
          </div>
        )}
        {seedStatus && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-8 pointer-events-none mb-10">
            <motion.div 
               initial={{ opacity: 0, y: 50, scale: 0.9 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className={`px-6 py-5 rounded-2xl shadow-xl flex items-center gap-4 font-black text-xs max-w-md w-full uppercase tracking-widest ${seedStatus.type === 'success' ? 'bg-emerald-600 text-white shadow-emerald-600/30' : 'bg-rose-600 text-white shadow-rose-600/30'}`}
            >
               {seedStatus.type === 'success' ? <Database size={24} /> : <AlertTriangle size={24} />}
               <span className="flex-1 leading-relaxed">{seedStatus.message}</span>
            </motion.div>
          </div>
        )}
        {isEnrollModalOpen && (
          <EnrollmentModal onClose={() => setIsEnrollModalOpen(false)} />
        )}
        {editingGrade && (
          <EditGradeModal 
            grade={editingGrade} 
            onClose={() => setEditingGrade(null)} 
            onSave={updateGrade} 
          />
        )}
        {isClearLogsConfirmOpen && (
          <ConfirmDialog 
            title="Clear Audit logs?"
            message="This will permanently delete all session activity logs. This action cannot be undone."
            onConfirm={clearLogs}
            onCancel={() => setIsClearLogsConfirmOpen(false)}
            variant="danger"
          />
        )}
        {isTeacherModalOpen && (
          <TeacherFormModal 
            teacher={editingTeacher}
            onClose={() => {
              setIsTeacherModalOpen(false);
              setEditingTeacher(null);
            }}
            onSave={(t) => {
              if (editingTeacher) {
                setTeachers(teachers.map(x => x.id === t.id ? t : x));
              } else {
                setTeachers([...teachers, { ...t, id: Math.random().toString(), studentsCount: 0, isDeleted: false }]);
              }
              setIsTeacherModalOpen(false);
              setEditingTeacher(null);
            }}
          />
        )}
        {isGuardModalOpen && (
          <GuardFormModal 
            guard={editingGuard}
            onClose={() => {
              setIsGuardModalOpen(false);
              setEditingGuard(null);
            }}
            onSave={(g) => {
              if (editingGuard) {
                setGuards(guards.map(x => x.id === g.id ? g : x));
              } else {
                setGuards([...guards, { ...g, id: Math.random().toString(), isDeleted: false }]);
              }
              setIsGuardModalOpen(false);
              setEditingGuard(null);
            }}
          />
        )}
        {itemToDelete && (
          <ConfirmDialog 
            title={`Remove ${itemToDelete.name}?`}
            message="This will deactivate their access. You can restore their profile later if needed."
            onConfirm={handleDeleteItem}
            onCancel={() => setItemToDelete(null)}
            variant="danger"
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {activeView === 'overview' && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard label="Total Enrollment" value="842" delta="+12" icon={<GraduationCap />} color="text-blue-600" bg="bg-blue-50" />
              <StatCard label="Active Attendance" value="798" delta="94%" icon={<Activity />} color="text-emerald-600" bg="bg-emerald-50" />
              <StatCard label="In-Process" value="142" delta="Waiting at gate" icon={<Users />} color="text-amber-600" bg="bg-amber-50" />
              <StatCard label="Dismissed Ok" value="656" delta="Verified Success" icon={<FileText />} color="text-slate-400" bg="bg-slate-100" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Dismissal Window Preview */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-xs font-black text-slate-800 flex items-center uppercase tracking-widest">
                    <Clock className="w-4 h-4 mr-3 text-blue-600" />
                    Dismissal Windows
                  </h3>
                  <button 
                    onClick={() => setActiveView('settings')}
                    className="text-slate-400 p-2 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <Settings size={16} />
                  </button>
                </div>

                <div className="space-y-4">
                  {grades.slice(0, 3).map((g) => (
                    <div key={g.grade} className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between group hover:border-blue-200 transition-colors">
                      <div>
                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{g.grade}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Grace: {g.grace_period_mins}M</p>
                      </div>
                      <div className="text-right">
                         <p className="text-xl font-black text-blue-600 font-mono tracking-tighter">{g.dismissal_time}</p>
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={() => setActiveView('settings')}
                    className="w-full py-3 border-2 border-dashed border-slate-100 rounded-lg text-[10px] font-black text-slate-300 uppercase tracking-widest hover:border-blue-100 hover:text-blue-400 transition-all"
                  >
                    View All Schedules
                  </button>
                </div>
              </div>

              {/* Log Preview */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Live Activity</h3>
                  <button 
                    onClick={() => setActiveView('logs')}
                    className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
                  >
                    Full Audit →
                  </button>
                </div>
                <div className="divide-y divide-slate-50">
                  <LogEntry time="15:42" user="GUARD_RAMOS" action="SCANNED_QR" detail="STUDENT_ID: #LEO-BAISAKINA" type="scan" />
                  <LogEntry time="15:44" user="TEACHER_ABAD" action="RELEASE_OK" detail="JULIAN_ALVAREZ DISMISSED" type="release" />
                  <LogEntry time="15:45" user="SYS_BOT" action="SMS_SENT" detail="CONFIRMATION SENT (+63 912...)" type="system" />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeView === 'settings' && (
          <motion.div 
            key="settings"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-slate-900">
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight">System Dismissal Configuration</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manage dismissal triggers and grace intervals</p>
                </div>
                <button 
                  onClick={() => setIsEnrollModalOpen(true)}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all text-[10px] uppercase tracking-widest"
                >
                  <UserPlus size={14} className="inline mr-2" />
                  Add New Grade
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {grades.map((g) => (
                    <div key={g.grade} className="p-6 bg-slate-50 rounded-xl border border-slate-100 relative group transition-all hover:ring-2 hover:ring-blue-100">
                      <button 
                        onClick={() => setEditingGrade(g)}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Settings size={16} />
                      </button>
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="w-12 h-12 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-blue-600 shadow-sm">
                          <Clock size={24} />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-800 uppercase tracking-tight">{g.grade}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Window</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Start Time</span>
                          <span className="font-mono font-black text-blue-600 text-lg">{g.dismissal_time}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Grace Period</span>
                          <span className="font-black text-slate-700">{g.grace_period_mins} Minutes</span>
                        </div>
                      </div>
                      <div className="mt-6 pt-4 border-t border-slate-200 flex gap-2">
                        <button 
                          onClick={() => setEditingGrade(g)}
                          className="flex-1 py-2 bg-white border border-slate-200 rounded text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors"
                        >
                          Modify Schedule
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 bg-rose-900 rounded-xl shadow-xl shadow-rose-900/10 flex items-center text-white relative overflow-hidden">
              <AlertTriangle className="w-6 h-6 text-rose-400 mr-4 shrink-0 relative z-10" />
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-1">Global System Warning</p>
                <p className="text-sm font-medium opacity-90">Changing dismissal times will immediately affect QR code validity and SMS notification triggers for all active guardians.</p>
              </div>
              <Activity className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5" />
            </div>
          </motion.div>
        )}

        {activeView === 'logs' && (
          <motion.div 
            key="logs"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]"
          >
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50">
              <div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">System Audit Log</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Chronological record of all gate and classroom events</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="FILTER LOGS..." 
                    className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold focus:ring-1 focus:ring-blue-500 w-48 transition-all uppercase tracking-wider"
                  />
                </div>
                <button 
                  onClick={handleExportLogs}
                  disabled={logs.length === 0}
                  className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  <Download size={14} className="mr-2" />
                  Export CSV
                </button>
                <button 
                  onClick={() => setIsClearLogsConfirmOpen(true)}
                  disabled={logs.length === 0}
                  className="flex items-center px-4 py-2 bg-rose-50 border border-rose-100 rounded-lg text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-100 transition-all disabled:opacity-50"
                >
                  <Trash2 size={14} className="mr-2" />
                  Clear Logs
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto divide-y divide-slate-50">
              {logs.length > 0 ? (
                logs.map(log => (
                  <LogEntry key={log.id} {...log} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center p-20 text-slate-300">
                  <FileText size={48} className="mb-4 opacity-20" />
                  <p className="text-xs font-black uppercase tracking-widest">No activity recorded</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeView === 'directory' && (
          <motion.div 
            key="directory"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-slate-900">
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center flex-col md:flex-row gap-4">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight">Staff Directory</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manage personnel and roles</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <div className="flex bg-slate-200/50 p-1 rounded-lg mr-2 border border-slate-200">
                    <button 
                      onClick={() => setDirectoryTab('faculty')}
                      className={`px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all ${directoryTab === 'faculty' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Faculty
                    </button>
                    <button 
                      onClick={() => setDirectoryTab('guards')}
                      className={`px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all ${directoryTab === 'guards' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Guards
                    </button>
                  </div>
                  {directoryTab === 'faculty' ? (
                    <button 
                      onClick={() => { setEditingTeacher(null); setIsTeacherModalOpen(true); }}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all text-[10px] uppercase tracking-widest whitespace-nowrap flex items-center"
                    >
                      <UserPlus size={14} className="inline mr-2" />
                      Add Faculty
                    </button>
                  ) : (
                    <button 
                      onClick={() => { setEditingGuard(null); setIsGuardModalOpen(true); }}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all text-[10px] uppercase tracking-widest whitespace-nowrap flex items-center"
                    >
                      <Shield size={14} className="inline mr-2" />
                      Add Guard
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-6 overflow-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-4 pt-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{directoryTab === 'faculty' ? 'Teacher' : 'Guard'}</th>
                      <th className="pb-4 pt-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{directoryTab === 'faculty' ? 'Assignment' : 'Shift & Gate'}</th>
                      {directoryTab === 'faculty' && <th className="pb-4 pt-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Students</th>}
                      <th className="pb-4 pt-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                      <th className="pb-4 pt-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(directoryTab === 'faculty' ? teachers : guards)
                      .filter((item: any) => !item.isDeleted)
                      .map((item: any) => (
                      <tr key={item.id} className={`transition-colors group hover:bg-slate-50`}>
                        <td className="py-4 px-4 font-bold text-sm text-slate-800">
                          {item.name}
                          {item.email && <span className="block text-[10px] text-slate-400 font-medium normal-case tracking-normal mt-0.5">{item.email}</span>}
                        </td>
                        <td className="py-4 px-4">
                          {directoryTab === 'faculty' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100">
                              {item.grade} • {item.section}
                            </span>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex max-w-max items-center px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
                                {item.gate}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 tracking-wider">
                                {item.shiftStart} - {item.shiftEnd}
                              </span>
                            </div>
                          )}
                        </td>
                        {directoryTab === 'faculty' && (
                          <td className="py-4 px-4 text-sm font-bold text-slate-600 font-mono">
                            {item.studentsCount}
                          </td>
                        )}
                        <td className="py-4 px-4">
                          {item.isDeleted ? (
                            <span className="text-[9px] font-black uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-100 px-2 py-1 rounded">Inactive</span>
                          ) : (
                            <span className="text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100 px-2 py-1 rounded">Active</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              if (directoryTab === 'faculty') {
                                setEditingTeacher(item);
                                setIsTeacherModalOpen(true);
                              } else {
                                setEditingGuard(item);
                                setIsGuardModalOpen(true);
                              }
                            }}
                            className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 border border-slate-200 rounded hover:border-blue-200 bg-white transition-colors mr-2"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => setItemToDelete({ id: item.id, type: (directoryTab === 'faculty' ? 'teacher' : 'guard') as 'teacher' | 'guard', name: item.name })}
                            className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-600 border border-slate-200 rounded hover:border-rose-200 bg-white transition-colors"
                          >
                            <Trash2 size={12} className="inline mr-1 -mt-0.5" />
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {((directoryTab === 'faculty' ? teachers : guards).filter((item: any) => !item.isDeleted).length === 0) && (
                  <div className="flex flex-col items-center justify-center p-12 text-slate-300">
                    {directoryTab === 'faculty' ? <Users size={48} className="mb-4 opacity-20" /> : <Shield size={48} className="mb-4 opacity-20" />}
                    <p className="text-xs font-black uppercase tracking-widest">No {directoryTab} assigned</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeView === 'archived' && (
          <motion.div 
            key="archived"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-slate-900">
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center flex-col md:flex-row gap-4">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight text-rose-600">Archived Profiles</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Review and restore deleted staff accounts</p>
                </div>
              </div>
              
              <div className="p-6 overflow-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-4 pt-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Name</th>
                      <th className="pb-4 pt-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Role</th>
                      <th className="pb-4 pt-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Assignment</th>
                      <th className="pb-4 pt-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                      <th className="pb-4 pt-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[...teachers.map(t => ({ ...t, role: 'teacher' as const })), ...guards.map(g => ({ ...g, role: 'guard' as const }))]
                      .filter((item: any) => item.isDeleted)
                      .map((item: any) => (
                      <tr key={`${item.role}-${item.id}`} className="transition-colors group bg-slate-50/50 hover:bg-slate-50">
                        <td className="py-4 px-4 font-bold text-sm text-slate-800">
                          {item.name}
                          {item.email && <span className="block text-[10px] text-slate-400 font-medium normal-case tracking-normal mt-0.5">{item.email}</span>}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest ${item.role === 'teacher' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                            {item.role === 'teacher' ? 'Faculty' : 'Guard'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {item.role === 'teacher' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest bg-slate-200 text-slate-600 border border-slate-300">
                              {item.grade} • {item.section}
                            </span>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex max-w-max items-center px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest bg-slate-200 text-slate-600 border border-slate-300">
                                {item.gate}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 tracking-wider">
                                {item.shiftStart} - {item.shiftEnd}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-[9px] font-black uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-100 px-2 py-1 rounded">Archived</span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button 
                            onClick={() => {
                              if (item.role === 'teacher') {
                                setEditingTeacher(item);
                                setIsTeacherModalOpen(true);
                              } else {
                                setEditingGuard(item);
                                setIsGuardModalOpen(true);
                              }
                            }}
                            className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 border border-slate-200 rounded hover:border-blue-200 bg-white transition-colors mr-2"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleRestoreItem(item.id, item.role)}
                            className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-200 transition-colors"
                          >
                            <RotateCcw size={14} className="inline mr-2 -mt-0.5" />
                            Restore
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {[...teachers.map(t => ({ ...t, role: 'teacher' })), ...guards.map(g => ({ ...g, role: 'guard' }))].filter((item: any) => item.isDeleted).length === 0 && (
                  <div className="flex flex-col items-center justify-center p-12 text-slate-300">
                    <Trash2 size={48} className="mb-4 opacity-20" />
                    <p className="text-xs font-black uppercase tracking-widest">No archived profiles found</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}




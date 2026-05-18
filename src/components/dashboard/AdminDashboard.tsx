import React, { useState, useEffect, useCallback } from 'react';
import { Users, GraduationCap, Settings, UserPlus, FileText, Activity, X, Upload, Smartphone, Clock, AlertTriangle, Search, Download, Trash2, Shield, RotateCcw, Database, Key, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeCanvas } from 'qrcode.react';
import { Profile, GradeSettings } from '../../types.ts';
import { seedDatabase } from '../../lib/seedDb.ts';
import { supabase } from '../../lib/supabase';
import { FormInput } from './helpers/FormInput';
import { FormSelect } from './helpers/FormSelect';
import { NavTab } from './helpers/NavTab';
import { StatCard } from './helpers/StatCard';
import { LogEntry } from './helpers/LogEntry';
import { EditGradeModal } from './helpers/EditGradeModal';
import { ConfirmDialog } from './helpers/ConfirmDialog';

const GRADE_SECTIONS: Record<string, string[]> = {
  'Kindergarten': ['Apple', 'Berry', 'Cherry'],
  'Grade 1': ['St. James', 'St. Luke', 'St. Mark'],
  'Grade 2': ['St. Jude', 'St. Anne', 'St. Mary'],
  'Grade 3': ['Diamond', 'Crystal', 'Pearl'],
  'Grade 4': ['St. Jude', 'St. Paul', 'St. Peter']
};

function EnrollmentModal({ onClose, onSaveComplete }: { onClose: () => void, onSaveComplete: () => void }) {
  const [mode, setMode] = useState<'manual' | 'bulk'>('manual');
  
  // Student form bindings
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  // Fetcher 1 (Primary Parent)
  const [f1Name, setF1Name] = useState('');
  const [f1Phone, setF1Phone] = useState('');

  // Fetcher 2 (Permanent Guardian)
  const [f2Name, setF2Name] = useState('');
  const [f2Phone, setF2Phone] = useState('');

  // Fetcher 3 (Temporary/Authorized)
  const [f3Name, setF3Name] = useState('');
  const [f3Phone, setF3Phone] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [registeredStudent, setRegisteredStudent] = useState<{
    id: string;
    name: string;
    grade: string;
    section: string;
    fetchers: { name: string; relationship: string; id: string }[];
  } | null>(null);

  const handleGradeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedGrade(e.target.value);
    setSelectedSection('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !studentId || !selectedGrade || !selectedSection) {
      setError("Please fill in all student information fields.");
      return;
    }
    
    setSubmitting(true);
    setError(null);

    try {
      // 1. Create Student
      const { error: studentErr } = await supabase
        .from('students')
        .insert({
          id: studentId,
          full_name: studentName,
          grade_level: selectedGrade,
          section: selectedSection,
          status: 'present',
          holding_area: 'Classroom',
          qr_id: `q_${studentId}`
        });

      if (studentErr) throw studentErr;

      // 2. Insert Fetchers if provided
      const fetchersToInsert = [];
      const fetchersList = [];
      if (f1Name && f1Phone) {
        fetchersToInsert.push({
          id: `f1_${studentId}`,
          student_id: studentId,
          name: f1Name,
          relationship: 'Mother',
          relationship_type: 'Case 1',
          phone_number: f1Phone,
          is_active: true
        });
        fetchersList.push({ name: f1Name, relationship: 'Mother (Case 1)', id: `f1_${studentId}` });
      }

      if (f2Name && f2Phone) {
        fetchersToInsert.push({
          id: `f2_${studentId}`,
          student_id: studentId,
          name: f2Name,
          relationship: 'Father',
          relationship_type: 'Case 2',
          phone_number: f2Phone,
          is_active: true
        });
        fetchersList.push({ name: f2Name, relationship: 'Father (Case 2)', id: `f2_${studentId}` });
      }

      if (f3Name && f3Phone) {
        fetchersToInsert.push({
          id: `f3_${studentId}`,
          student_id: studentId,
          name: f3Name,
          relationship: 'Authorized Pick-up',
          relationship_type: 'Case 3',
          phone_number: f3Phone,
          is_active: true
        });
        fetchersList.push({ name: f3Name, relationship: 'Authorized Pick-up (Case 3)', id: `f3_${studentId}` });
      }

      if (fetchersToInsert.length > 0) {
        const { error: fetcherErr } = await supabase
          .from('fetchers')
          .insert(fetchersToInsert);

        if (fetcherErr) throw fetcherErr;
      }

      // Log system audit log
      await supabase.from('audit_logs').insert({
        username: 'ADMIN_PORTAL',
        action: 'ENROLL_STUDENT',
        detail: `STUDENT_ID: #${studentId} - ${studentName.toUpperCase()}`,
        type: 'edit'
      });

      setRegisteredStudent({
        id: studentId,
        name: studentName,
        grade: selectedGrade,
        section: selectedSection,
        fetchers: fetchersList
      });
      onSaveComplete();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to enroll student");
    } finally {
      setSubmitting(false);
    }
  };
  
  if (registeredStudent) {
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
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-3xl overflow-hidden flex flex-col max-h-[90vh] font-sans text-slate-900"
        >
          {/* Header checkmark section */}
          <div className="p-8 text-center bg-gradient-to-br from-emerald-500 to-teal-600 text-white relative">
            <div className="absolute right-6 top-6">
              <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white border border-white/10 border-0 cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-inner"
            >
              <CheckCircle2 size={40} className="text-white drop-shadow-md" />
            </motion.div>
            <h2 className="text-2xl font-black uppercase tracking-tight">Student Enrolled Successfully</h2>
            <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest mt-1">Profile and fetcher authorizations created</p>
          </div>

          <div className="flex-1 overflow-auto p-8 space-y-8">
            {/* Student Profile Info */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-blue-100">
                {registeredStudent.name[0]}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none mb-1.5">{registeredStudent.name}</h3>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100">
                    ID: #{registeredStudent.id}
                  </span>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200">
                    {registeredStudent.grade} • {registeredStudent.section}
                  </span>
                </div>
              </div>
            </div>

            {/* Generated QR Cards for Fetchers */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Authorized Fetchers & QR Codes</h4>
              {registeredStudent.fetchers.length === 0 ? (
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider italic p-4 text-center bg-slate-50 rounded-2xl">No authorized fetchers registered yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {registeredStudent.fetchers.map((fetcher: any) => {
                    const qrVal = `${registeredStudent.id}|${fetcher.id}`;
                    return (
                      <div key={fetcher.id} className="border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow rounded-2xl p-5 flex flex-col items-center text-center gap-4 relative group">
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                          <QRCodeCanvas 
                            id={`qr-${fetcher.id}`}
                            value={qrVal} 
                            size={100} 
                            level="H"
                            includeMargin={false}
                          />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{fetcher.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{fetcher.relationship}</p>
                        </div>
                        <button 
                          onClick={() => {
                            const canvas = document.getElementById(`qr-${fetcher.id}`) as HTMLCanvasElement;
                            if (canvas) {
                              const url = canvas.toDataURL("image/png");
                              const link = document.createElement("a");
                              link.download = `QR_${registeredStudent.name.replace(/\s+/g, '_')}_${fetcher.name.replace(/\s+/g, '_')}.png`;
                              link.href = url;
                              link.click();
                            }
                          }}
                          className="w-full mt-2 py-2.5 bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 border border-slate-100 group-hover:border-blue-100 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 border-0 cursor-pointer"
                        >
                          <Download size={12} />
                          Download Card
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4">
            <button 
              onClick={onClose} 
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-800 transition-colors shadow-xl shadow-slate-200 border-0 cursor-pointer"
            >
              Done & Close
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

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

        <div className="flex-1 overflow-auto p-8 font-sans">
          {error && (
            <div className="p-4 mb-6 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 text-[10px] font-bold uppercase tracking-wider flex items-center">
              <AlertTriangle className="mr-3 shrink-0" size={16} />
              <span>{error}</span>
            </div>
          )}

          {mode === 'manual' ? (
            <div className="space-y-10">
              <section className="space-y-4">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded flex items-center justify-center font-bold">1</div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Student Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormInput label="Full Name" placeholder="e.g. Julian Alvarez" value={studentName} onChange={e => setStudentName(e.target.value)} />
                  <FormInput label="Student ID (LRN)" placeholder="e.g. 29401" value={studentId} onChange={e => setStudentId(e.target.value)} />
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
                  <div className="p-6 bg-white border border-slate-100 border-l-4 border-l-blue-500 rounded-2xl shadow-sm space-y-4">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Case 1 (Primary Parent / Mother)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput label="Full Name" placeholder="Authorized Mother Name" value={f1Name} onChange={e => setF1Name(e.target.value)} />
                      <FormInput label="Phone Number" placeholder="+63 9xx xxx xxxx" value={f1Phone} onChange={e => setF1Phone(e.target.value)} />
                    </div>
                  </div>

                  <div className="p-6 bg-white border border-slate-100 border-l-4 border-l-emerald-500 rounded-2xl shadow-sm space-y-4">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Case 2 (Secondary Parent / Father)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput label="Full Name" placeholder="Authorized Father Name" value={f2Name} onChange={e => setF2Name(e.target.value)} />
                      <FormInput label="Phone Number" placeholder="+63 9xx xxx xxxx" value={f2Phone} onChange={e => setF2Phone(e.target.value)} />
                    </div>
                  </div>

                  <div className="p-6 bg-white border border-slate-100 border-l-4 border-l-amber-500 rounded-2xl shadow-sm space-y-4">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Case 3 (Temporary / Authorized Nanny)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput label="Full Name" placeholder="Authorized Nanny/Driver Name" value={f3Name} onChange={e => setF3Name(e.target.value)} />
                      <FormInput label="Phone Number" placeholder="+63 9xx xxx xxxx" value={f3Phone} onChange={e => setF3Phone(e.target.value)} />
                    </div>
                  </div>
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
                Upload your CSV manifest containing Student ID, Name, Grade, Section and Pickup relationships.
              </p>
              <div className="mt-8 flex gap-4">
                <button className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200">
                  Select CSV File
                </button>
              </div>
            </div>
          )}
        </div>

        {mode === 'manual' && (
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 font-sans">
            <button onClick={onClose} className="px-6 py-3 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600">Cancel</button>
            <button 
              onClick={handleSave} 
              disabled={submitting}
              className="px-10 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {submitting ? 'Enrolling...' : 'Save & Register Student'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function TeacherFormModal({ teacher, onClose, onSave }: { teacher?: any, onClose: () => void, onSave: (teacher: any) => void }) {
  const [name, setName] = useState(teacher?.full_name || teacher?.name || '');
  const [email, setEmail] = useState(teacher?.email || '');
  const [password, setPassword] = useState('');
  const [selectedGrade, setSelectedGrade] = useState(teacher?.grade_level || teacher?.grade || '');
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
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-3xl overflow-hidden p-8 font-sans"
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
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="e.g. maria@school.edu" disabled={!!teacher} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-300 text-slate-700 disabled:opacity-60" />
          </div>

          {!teacher && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Password</label>
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="MINIMUM 6 CHARACTERS" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-300 text-slate-700" />
            </div>
          )}

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
            onClick={() => onSave({ ...teacher, name, email, password, grade: selectedGrade, section: selectedSection })}
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
  const [name, setName] = useState(guard?.full_name || guard?.name || '');
  const [email, setEmail] = useState(guard?.email || '');
  const [password, setPassword] = useState('');
  const [shiftStart, setShiftStart] = useState(guard?.shiftStart || '08:00');
  const [shiftEnd, setShiftEnd] = useState(guard?.shiftEnd || '16:00');
  const [gate, setGate] = useState(guard?.gate || 'Gate 01');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-3xl overflow-hidden p-8 font-sans"
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

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="e.g. ramos@school.edu" disabled={!!guard} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-300 text-slate-700 disabled:opacity-60" />
          </div>

          {!guard && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Password</label>
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="MINIMUM 6 CHARACTERS" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-300 text-slate-700" />
            </div>
          )}

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
            onClick={() => onSave({ ...guard, name, email, password, shiftStart, shiftEnd, gate })}
            className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all"
          >
            {guard ? 'Update' : 'Create'} Profile
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function StudentFormModal({ student, onClose, onSave }: { student?: any, onClose: () => void, onSave: (student: any) => void }) {
  const [name, setName] = useState(student?.full_name || student?.name || '');
  const [id, setId] = useState(student?.id || '');
  const [selectedGrade, setSelectedGrade] = useState(student?.grade_level || student?.grade || '');
  const [selectedSection, setSelectedSection] = useState(student?.section || '');

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
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-3xl overflow-hidden p-8 font-sans text-slate-900"
      >
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{student ? 'Edit' : 'Add'} Student</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure student details</p>
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

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Student ID (LRN)</label>
            <input value={id} onChange={e => setId(e.target.value)} type="text" placeholder="e.g. 29401" disabled={!!student} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-300 text-slate-700 disabled:opacity-60" />
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
            onClick={() => onSave({ ...student, id: id || student?.id, name, grade: selectedGrade, section: selectedSection })}
            className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all"
          >
            {student ? 'Update' : 'Create'} Student
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function AdminDashboard({ user }: { user: Profile }) {
  const [activeView, setActiveView] = useState<'overview' | 'settings' | 'logs' | 'directory' | 'students' | 'archived'>('overview');
  const [directoryTab, setDirectoryTab] = useState<'faculty' | 'guards'>('faculty');
  
  const [successMessage, setSuccessMessage] = useState<{
    title: string;
    description: string;
    details?: { label: string; value: string }[];
  } | null>(null);

  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [grades, setGrades] = useState<GradeSettings[]>([]);
  const [editingGrade, setEditingGrade] = useState<GradeSettings | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isClearLogsConfirmOpen, setIsClearLogsConfirmOpen] = useState(false);

  // Directory lists
  const [teachers, setTeachers] = useState<any[]>([]);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  
  const [guards, setGuards] = useState<any[]>([]);
  const [editingGuard, setEditingGuard] = useState<any>(null);
  const [isGuardModalOpen, setIsGuardModalOpen] = useState(false);

  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<{ id: string, name: string } | null>(null);

  const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'teacher' | 'security', name: string } | null>(null);
  const [roleChangeUser, setRoleChangeUser] = useState<{ id: string, name: string, currentRole: string } | null>(null);
  
  // Student search and QR view states
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentSubView, setStudentSubView] = useState<'active' | 'deleted'>('active');
  const [viewingQrStudent, setViewingQrStudent] = useState<any | null>(null);
  const [studentFetchers, setStudentFetchers] = useState<any[]>([]);
  const [loadingFetchers, setLoadingFetchers] = useState(false);

  const [isSeeding, setIsSeeding] = useState(false);
  const [seedStatus, setSeedStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Statistics
  const [stats, setStats] = useState({
    enrollment: 0,
    attendance: 0,
    waiting: 0,
    dismissed: 0
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      // 1. Fetch Grades settings
      const { data: gradeData } = await supabase
        .from('grade_settings')
        .select('*')
        .order('grade');
      if (gradeData) setGrades(gradeData);

      // 2. Fetch Profiles directory lists
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (profileData) {
        // Map teachers and guards
        setTeachers(profileData.filter(p => p.role === 'teacher').map(t => ({
          id: t.id,
          name: t.full_name,
          grade: t.grade_level || 'Grade 2',
          section: 'St. Jude',
          studentsCount: 24,
          email: `${t.full_name.toLowerCase().replace(/\s+/g, '')}@school.edu`,
          isDeleted: false
        })));

        setGuards(profileData.filter(p => p.role === 'security').map(g => ({
          id: g.id,
          name: g.full_name,
          shiftStart: '08:00',
          shiftEnd: '16:00',
          gate: 'Gate 01',
          isDeleted: false
        })));
      }

      // 3. Fetch Audit Logs
      const { data: auditData } = await supabase
        .from('audit_logs')
        .select('*')
        .order('time', { ascending: false })
        .limit(20);
      if (auditData) {
        setLogs(auditData.map(l => ({
          id: l.id,
          time: new Date(l.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          user: l.username,
          action: l.action,
          detail: l.detail,
          type: l.type
        })));
      }

      // 4. Fetch Stats Counts
      const [enrollmentRes, attendanceRes, waitingRes, dismissedRes] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'present').eq('is_deleted', false),
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'waiting').eq('is_deleted', false),
        supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'dismissed').eq('is_deleted', false),
      ]);

      setStats({
        enrollment: enrollmentRes.count || 0,
        attendance: attendanceRes.count || 0,
        waiting: waitingRes.count || 0,
        dismissed: dismissedRes.count || 0
      });

      // 5. Fetch Students Directory List
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .order('full_name');
      if (studentData) {
        setStudentsList(studentData.map(s => ({
          id: s.id,
          name: s.full_name,
          grade: s.grade_level,
          section: s.section,
          status: s.status,
          holdingArea: s.holding_area,
          qrId: s.qr_id,
          isDeleted: s.is_deleted
        })));
      }

    } catch (err) {
      console.error("Error loading dashboard data: ", err);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleSeedDb = async () => {
    setIsSeeding(true);
    setSeedStatus(null);
    try {
      await seedDatabase();
      setSeedStatus({ type: 'success', message: 'Database seeded successfully!' });
      fetchDashboardData();
    } catch (err) {
      setSeedStatus({ type: 'error', message: err instanceof Error ? err.message : 'Failed to seed database.' });
    } finally {
      setIsSeeding(false);
      setTimeout(() => setSeedStatus(null), 5000);
    }
  };

  const updateGrade = async (updated: GradeSettings) => {
    try {
      const { error } = await supabase
        .from('grade_settings')
        .update({
          dismissal_time: updated.dismissal_time,
          grace_period_mins: updated.grace_period_mins
        })
        .eq('grade', updated.grade);

      if (error) throw error;
      
      // Log audit
      await supabase.from('audit_logs').insert({
        username: 'ADMIN_PORTAL',
        action: 'UPDATE_GRADE_SCHEDULE',
        detail: `${updated.grade.toUpperCase()} WINDOW -> ${updated.dismissal_time}`,
        type: 'edit'
      });

      fetchDashboardData();
      setEditingGrade(null);
    } catch(e) {
      console.error(e);
    }
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

  const clearLogs = async () => {
    try {
      const { error } = await supabase.from('audit_logs').delete().gt('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      setLogs([]);
      setIsClearLogsConfirmOpen(false);
    } catch(e) {
      console.error(e);
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      // Deactivate profile (or delete)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', itemToDelete.id);

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        username: 'ADMIN_PORTAL',
        action: `REMOVE_${itemToDelete.type.toUpperCase()}`,
        detail: `DEACTIVATED: ${itemToDelete.name.toUpperCase()}`,
        type: 'edit'
      });

      fetchDashboardData();
    } catch (e) {
      console.error(e);
    } finally {
      setItemToDelete(null);
    }
  };

  const handleSaveTeacher = async (t: any) => {
    try {
      if (editingTeacher) {
        // Update teacher profile
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: t.name,
            grade_level: t.grade
          })
          .eq('id', editingTeacher.id);

        if (error) throw error;

        await supabase.from('audit_logs').insert({
          username: 'ADMIN_PORTAL',
          action: 'EDIT_FACULTY',
          detail: `UPDATED ASSIGNMENT: ${t.name.toUpperCase()} -> ${t.grade}`,
          type: 'edit'
        });
      } else {
        // Add new teacher: sign them up
        const { data, error } = await supabase.auth.signUp({
          email: t.email,
          password: t.password || 'password123',
          options: {
            data: {
              full_name: t.name,
              role: 'teacher',
              grade_level: t.grade
            }
          }
        });

        if (error) throw error;

        await supabase.from('audit_logs').insert({
          username: 'ADMIN_PORTAL',
          action: 'REGISTER_FACULTY',
          detail: `CREATED PROFILE: ${t.name.toUpperCase()} (${t.email})`,
          type: 'edit'
        });
      }

      fetchDashboardData();
      setIsTeacherModalOpen(false);
      setEditingTeacher(null);
      setSuccessMessage({
        title: editingTeacher ? "Faculty Member Updated" : "Faculty Member Registered",
        description: editingTeacher
          ? `The faculty profile for ${t.name} has been successfully updated.`
          : `A new faculty profile has been created for ${t.name}.`,
        details: [
          { label: "Full Name", value: t.name },
          { label: "Assignment", value: `${t.grade} • ${t.section || 'All Sections'}` },
          { label: "Role", value: "Teacher" }
        ]
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save teacher profile");
    }
  };

  const handleSaveGuard = async (g: any) => {
    try {
      if (editingGuard) {
        // Update guard profile
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: g.name
          })
          .eq('id', editingGuard.id);

        if (error) throw error;

        await supabase.from('audit_logs').insert({
          username: 'ADMIN_PORTAL',
          action: 'EDIT_GUARD',
          detail: `UPDATED GUARD: ${g.name.toUpperCase()} (${g.gate})`,
          type: 'edit'
        });
      } else {
        // Add new guard: sign them up
        const { data, error } = await supabase.auth.signUp({
          email: g.email,
          password: g.password || 'password123',
          options: {
            data: {
              full_name: g.name,
              role: 'security'
            }
          }
        });

        if (error) throw error;

        await supabase.from('audit_logs').insert({
          username: 'ADMIN_PORTAL',
          action: 'REGISTER_GUARD',
          detail: `CREATED PROFILE: ${g.name.toUpperCase()} (${g.email})`,
          type: 'edit'
        });
      }

      fetchDashboardData();
      setIsGuardModalOpen(false);
      setEditingGuard(null);
      setSuccessMessage({
        title: editingGuard ? "Guard Profile Updated" : "Guard Profile Registered",
        description: editingGuard
          ? `The security profile for ${g.name} has been successfully updated.`
          : `A new security profile has been created for ${g.name}.`,
        details: [
          { label: "Full Name", value: g.name },
          { label: "Gate Assignment", value: g.gate || 'Gate 01' },
          { label: "Role", value: "Security Guard" }
        ]
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save guard profile");
    }
  };

  const handleSaveStudent = async (s: any) => {
    try {
      if (editingStudent) {
        // Update student record
        const { error } = await supabase
          .from('students')
          .update({
            full_name: s.name,
            grade_level: s.grade,
            section: s.section
          })
          .eq('id', editingStudent.id);

        if (error) throw error;

        await supabase.from('audit_logs').insert({
          username: 'ADMIN_PORTAL',
          action: 'EDIT_STUDENT',
          detail: `UPDATED STUDENT: ${s.name.toUpperCase()} (#${s.id})`,
          type: 'edit'
        });
      } else {
        const { error } = await supabase
          .from('students')
          .insert({
            id: s.id,
            full_name: s.name,
            grade_level: s.grade,
            section: s.section,
            status: 'present',
            holding_area: 'Classroom',
            qr_id: `q_${s.id}`
          });

        if (error) throw error;

        await supabase.from('audit_logs').insert({
          username: 'ADMIN_PORTAL',
          action: 'ENROLL_STUDENT',
          detail: `ENROLLED STUDENT: ${s.name.toUpperCase()} (#${s.id})`,
          type: 'edit'
        });
      }

      fetchDashboardData();
      setIsStudentModalOpen(false);
      setEditingStudent(null);
      setSuccessMessage({
        title: editingStudent ? "Student Profile Updated" : "Student Profile Registered",
        description: editingStudent
          ? `The student profile for ${s.name} has been successfully updated.`
          : `A new student profile has been created for ${s.name}.`,
        details: [
          { label: "Full Name", value: s.name },
          { label: "Student LRN / ID", value: s.id },
          { label: "Classroom Section", value: `${s.grade} • ${s.section}` }
        ]
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save student details");
    }
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      const { error } = await supabase
        .from('students')
        .update({ is_deleted: true })
        .eq('id', studentToDelete.id);

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        username: 'ADMIN_PORTAL',
        action: 'DELETE_STUDENT',
        detail: `DELETED STUDENT: ${studentToDelete.name.toUpperCase()} (#${studentToDelete.id})`,
        type: 'edit'
      });

      fetchDashboardData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete student");
    } finally {
      setStudentToDelete(null);
    }
  };

  const handleRestoreStudent = async (student: any) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ is_deleted: false })
        .eq('id', student.id);

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        username: 'ADMIN_PORTAL',
        action: 'RESTORE_STUDENT',
        detail: `RESTORED STUDENT: ${student.name.toUpperCase()} (#${student.id})`,
        type: 'edit'
      });

      fetchDashboardData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to restore student");
    }
  };

  const handleViewQr = async (student: any) => {
    setViewingQrStudent(student);
    setLoadingFetchers(true);
    try {
      const { data, error } = await supabase
        .from('fetchers')
        .select('*')
        .eq('student_id', student.id);
      if (error) throw error;
      setStudentFetchers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFetchers(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Admin Mission Control</h1>
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
            <NavTab active={activeView === 'students'} onClick={() => setActiveView('students')} label="Student Directory" icon={<GraduationCap size={14} />} />
            <NavTab active={activeView === 'logs'} onClick={() => setActiveView('logs')} label="Audit Logs" icon={<FileText size={14} />} />
          </div>
          <button 
            onClick={handleSeedDb}
            disabled={isSeeding}
            className="flex items-center px-4 py-3 bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-200 rounded-xl font-black transition-all text-[10px] uppercase tracking-widest active:scale-95 group disabled:opacity-50 cursor-pointer"
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
          <EnrollmentModal onClose={() => setIsEnrollModalOpen(false)} onSaveComplete={fetchDashboardData} />
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
            onSave={handleSaveTeacher}
          />
        )}
        {isGuardModalOpen && (
          <GuardFormModal 
            guard={editingGuard}
            onClose={() => {
              setIsGuardModalOpen(false);
              setEditingGuard(null);
            }}
            onSave={handleSaveGuard}
          />
        )}
        {isStudentModalOpen && (
          <StudentFormModal 
            student={editingStudent}
            onClose={() => {
              setIsStudentModalOpen(false);
              setEditingStudent(null);
            }}
            onSave={handleSaveStudent}
          />
        )}
        {studentToDelete && (
          <ConfirmDialog 
            title={`Remove student ${studentToDelete.name}?`}
            message="This will permanently delete their student record and all pickup configurations. This action cannot be undone."
            onConfirm={handleDeleteStudent}
            onCancel={() => setStudentToDelete(null)}
            variant="danger"
          />
        )}
        {successMessage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSuccessMessage(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-3xl overflow-hidden p-8 font-sans text-slate-900 text-center"
            >
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-100 shadow-sm">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{successMessage.title}</h3>
              <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">{successMessage.description}</p>
              
              {successMessage.details && successMessage.details.length > 0 && (
                <div className="my-6 bg-slate-50 border border-slate-100 rounded-2xl p-4 divide-y divide-slate-100">
                  {successMessage.details.map((detail, index) => (
                    <div key={index} className="flex justify-between items-center py-2 text-left">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{detail.label}</span>
                      <span className="text-xs font-black text-slate-800 uppercase tracking-tight text-right shrink-0 ml-4 max-w-[200px] truncate">{detail.value}</span>
                    </div>
                  ))}
                </div>
              )}

              <button 
                onClick={() => setSuccessMessage(null)}
                className="w-full mt-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black uppercase tracking-widest text-[10px] transition-colors border-0 cursor-pointer shadow-lg shadow-slate-200"
              >
                Continue
              </button>
            </motion.div>
          </div>
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
              <StatCard label="Total Enrollment" value={String(stats.enrollment)} delta="+4 New" icon={<GraduationCap />} color="text-blue-600" bg="bg-blue-50" />
              <StatCard label="Active Attendance" value={String(stats.attendance)} delta="Today" icon={<Activity />} color="text-emerald-600" bg="bg-emerald-50" />
              <StatCard label="In-Process Gate Queue" value={String(stats.waiting)} delta="Awaiting release" icon={<Users />} color="text-amber-600" bg="bg-amber-50" />
              <StatCard label="Dismissed Ok" value={String(stats.dismissed)} delta="Released" icon={<FileText />} color="text-slate-400" bg="bg-slate-100" />
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
                    className="text-slate-400 p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
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
                    className="w-full py-3 border-2 border-dashed border-slate-100 rounded-lg text-[10px] font-black text-slate-300 uppercase tracking-widest hover:border-blue-100 hover:text-blue-400 transition-all cursor-pointer"
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
                    className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline cursor-pointer bg-transparent border-0"
                  >
                    Full Audit →
                  </button>
                </div>
                <div className="divide-y divide-slate-50">
                  {logs.slice(0, 5).map(log => (
                    <LogEntry key={log.id} {...log} />
                  ))}
                  {logs.length === 0 && (
                    <div className="p-8 text-center text-slate-350 font-black text-[10px] uppercase tracking-wider">No active logs recorded</div>
                  )}
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
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {grades.map((g) => (
                    <div key={g.grade} className="p-6 bg-slate-50 rounded-xl border border-slate-100 relative group transition-all hover:ring-2 hover:ring-blue-100">
                      <button 
                        onClick={() => setEditingGrade(g)}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
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
                          className="flex-1 py-2 bg-white border border-slate-200 rounded text-[9px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
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
                <button 
                  onClick={handleExportLogs}
                  disabled={logs.length === 0}
                  className="flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Download size={14} className="mr-2" />
                  Export CSV
                </button>
                <button 
                  onClick={() => setIsClearLogsConfirmOpen(true)}
                  disabled={logs.length === 0}
                  className="flex items-center px-4 py-2 bg-rose-50 border border-rose-100 rounded-lg text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-100 transition-all disabled:opacity-50 cursor-pointer"
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
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manage school personnel, teachers, security staff and roles</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <div className="flex bg-slate-200/50 p-1 rounded-lg mr-2 border border-slate-200">
                    <button 
                      onClick={() => setDirectoryTab('faculty')}
                      className={`px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${directoryTab === 'faculty' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Faculty
                    </button>
                    <button 
                      onClick={() => setDirectoryTab('guards')}
                      className={`px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${directoryTab === 'guards' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Guards
                    </button>
                  </div>
                  {directoryTab === 'faculty' ? (
                    <button 
                      onClick={() => { setEditingTeacher(null); setIsTeacherModalOpen(true); }}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all text-[10px] uppercase tracking-widest whitespace-nowrap flex items-center cursor-pointer border-0"
                    >
                      <UserPlus size={14} className="inline mr-2" />
                      Add Faculty
                    </button>
                  ) : (
                    <button 
                      onClick={() => { setEditingGuard(null); setIsGuardModalOpen(true); }}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all text-[10px] uppercase tracking-widest whitespace-nowrap flex items-center cursor-pointer border-0"
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
                      <th className="pb-4 pt-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {directoryTab === 'faculty' ? 'Teacher' : 'Guard'}
                      </th>
                      <th className="pb-4 pt-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {directoryTab === 'faculty' ? 'Assignment' : 'Shift & Gate'}
                      </th>
                      {directoryTab === 'faculty' && <th className="pb-4 pt-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Students</th>}
                      <th className="pb-4 pt-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                      <th className="pb-4 pt-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(directoryTab === 'faculty' ? teachers : guards)
                      .map((item: any) => (
                      <tr key={item.id} className="transition-colors group hover:bg-slate-50">
                        <td className="py-4 px-4 font-bold text-sm text-slate-800">
                          {item.name}
                          {item.email && <span className="block text-[10px] text-slate-400 font-medium normal-case tracking-normal mt-0.5">{item.email}</span>}
                        </td>
                        <td className="py-4 px-4 text-sm font-bold text-slate-600 font-mono">
                          {directoryTab === 'faculty' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100">
                              {item.grade} • {item.section}
                            </span>
                          ) : (
                            <div className="flex flex-col gap-1 font-sans">
                              <span className="inline-flex max-w-max items-center px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
                                {item.gate}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 tracking-wider font-sans">
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
                          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded border bg-blue-50 text-blue-600 border-blue-100">
                            Active
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setRoleChangeUser({ id: item.id, name: item.name, currentRole: directoryTab === 'faculty' ? 'teacher' : 'security' })}
                            className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 border border-slate-200 rounded hover:border-indigo-200 bg-white transition-colors mr-2 cursor-pointer"
                          >
                            Role
                          </button>
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
                            className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 border border-slate-200 rounded hover:border-blue-200 bg-white transition-colors mr-2 cursor-pointer"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => {
                              setItemToDelete({ id: item.id, type: (directoryTab === 'faculty' ? 'teacher' : 'security') as 'teacher' | 'security', name: item.name });
                            }}
                            className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-600 border border-slate-200 rounded hover:border-rose-200 bg-white transition-colors cursor-pointer"
                          >
                            <Trash2 size={12} className="inline mr-1 -mt-0.5" />
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {((directoryTab === 'faculty' ? teachers : guards).length === 0) && (
                  <div className="flex flex-col items-center justify-center p-12 text-slate-300">
                    {directoryTab === 'faculty' ? <Users size={48} className="mb-4 opacity-20" /> : <Shield size={48} className="mb-4 opacity-20" />}
                    <p className="text-xs font-black uppercase tracking-widest">No {directoryTab} assigned</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeView === 'students' && (
          <motion.div 
            key="students"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6 text-slate-900"
          >
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              {/* Header with Sub-tabs, Search and Enroll Student Action */}
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col lg:flex-row justify-between items-center gap-4">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight">Student Directory</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manage student registration, QR credentials, and sections</p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                  {/* Active / Deleted Sub-tabs */}
                  <div className="flex bg-slate-200/50 p-1 rounded-lg border border-slate-200 shadow-inner mr-2 w-full sm:w-auto justify-center">
                    <button 
                      onClick={() => setStudentSubView('active')}
                      className={`px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${studentSubView === 'active' ? 'bg-white text-blue-600 shadow-sm border border-slate-250/20' : 'text-slate-500 hover:text-slate-700 border border-transparent bg-transparent'}`}
                    >
                      Active
                    </button>
                    <button 
                      onClick={() => setStudentSubView('deleted')}
                      className={`px-4 py-2 rounded text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${studentSubView === 'deleted' ? 'bg-white text-blue-600 shadow-sm border border-slate-250/20' : 'text-slate-500 hover:text-slate-700 border border-transparent bg-transparent'}`}
                    >
                      Deleted
                    </button>
                  </div>

                  {/* Search bar */}
                  <div className="relative w-full sm:w-64 font-sans">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search student or LRN..." 
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 text-slate-800 placeholder-slate-400 transition-all font-sans"
                    />
                    {studentSearchQuery && (
                      <button 
                        onClick={() => setStudentSearchQuery('')} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-700 bg-transparent border-0 cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  {/* Consolidated Enroll Student Button inside Directory (Only shown in Active tab) */}
                  {studentSubView === 'active' && (
                    <button 
                      onClick={() => setIsEnrollModalOpen(true)}
                      className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white border-0 cursor-pointer rounded-lg font-bold shadow-lg shadow-blue-200 transition-all text-[10px] uppercase tracking-widest whitespace-nowrap flex items-center justify-center gap-2 active:scale-95 group"
                    >
                      <UserPlus size={14} className="group-hover:rotate-12 transition-transform" />
                      Enroll Student
                    </button>
                  )}
                </div>
              </div>

              {/* Table of Students */}
              <div className="p-6 overflow-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="pb-4 pt-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Student Name</th>
                      <th className="pb-4 pt-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">LRN / ID</th>
                      <th className="pb-4 pt-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Grade & Section</th>
                      <th className="pb-4 pt-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Dismissal Status</th>
                      <th className="pb-4 pt-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {studentsList
                      .filter(s => {
                        const matchesSearch = s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) || 
                          s.id.toLowerCase().includes(studentSearchQuery.toLowerCase());
                        const matchesSoftDeleteTab = studentSubView === 'deleted' ? s.isDeleted : !s.isDeleted;
                        return matchesSearch && matchesSoftDeleteTab;
                      })
                      .map((item: any) => (
                      <tr key={item.id} className="transition-colors group hover:bg-slate-50">
                        <td className="py-4 px-4 font-bold text-sm text-slate-800 flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${studentSubView === 'deleted' ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-600'}`}>
                            {item.name[0]}
                          </div>
                          <span className={studentSubView === 'deleted' ? 'text-slate-400 line-through' : ''}>{item.name}</span>
                        </td>
                        <td className="py-4 px-4 text-xs font-mono font-bold text-slate-500">
                          {item.id}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest border ${
                            studentSubView === 'deleted'
                              ? 'bg-slate-50 text-slate-400 border-slate-100'
                              : 'bg-blue-50 text-blue-600 border-blue-100'
                          }`}>
                            {item.grade} • {item.section}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {studentSubView === 'deleted' ? (
                            <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded border bg-rose-50 text-rose-600 border-rose-100">
                              Soft Deleted
                            </span>
                          ) : (
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded border ${
                              item.status === 'dismissed'
                                ? 'bg-slate-100 text-slate-450 border-slate-200'
                                : item.status === 'waiting'
                                ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'
                                : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            }`}>
                              {item.status}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                          {studentSubView === 'deleted' ? (
                            <button 
                              onClick={() => handleRestoreStudent(item)}
                              className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-emerald-600 border border-slate-200 rounded hover:border-emerald-250 hover:bg-emerald-50 bg-white transition-colors cursor-pointer flex items-center justify-center gap-1.5 ml-auto active:scale-95"
                            >
                              <RotateCcw size={12} />
                              Restore Student
                            </button>
                          ) : (
                            <>
                              <button 
                                onClick={() => handleViewQr(item)}
                                className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 border border-slate-200 rounded hover:border-indigo-200 bg-white transition-colors mr-2 cursor-pointer"
                              >
                                View QR
                              </button>
                              <button 
                                onClick={() => {
                                  setEditingStudent(item);
                                  setIsStudentModalOpen(true);
                                }}
                                className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 border border-slate-200 rounded hover:border-blue-200 bg-white transition-colors mr-2 cursor-pointer"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => setStudentToDelete({ id: item.id, name: item.name })}
                                className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-600 border border-slate-200 rounded hover:border-rose-200 bg-white transition-colors cursor-pointer"
                              >
                                <Trash2 size={12} className="inline mr-1 -mt-0.5" />
                                Remove
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {studentsList.filter(s => {
                  const matchesSearch = s.name.toLowerCase().includes(studentSearchQuery.toLowerCase()) || 
                    s.id.toLowerCase().includes(studentSearchQuery.toLowerCase());
                  const matchesSoftDeleteTab = studentSubView === 'deleted' ? s.isDeleted : !s.isDeleted;
                  return matchesSearch && matchesSoftDeleteTab;
                }).length === 0 && (
                  <div className="flex flex-col items-center justify-center p-16 text-slate-300">
                    <GraduationCap size={48} className="mb-4 opacity-20" />
                    <p className="text-xs font-black uppercase tracking-widest">
                      {studentSearchQuery 
                        ? "No matching student records found" 
                        : studentSubView === 'deleted' 
                        ? "No soft-deleted student records found" 
                        : "No students enrolled in database"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Viewer Popup */}
      <AnimatePresence>
        {viewingQrStudent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setViewingQrStudent(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-3xl overflow-hidden flex flex-col max-h-[90vh] font-sans text-slate-900"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-slate-800">QR Security Credentials</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Authorized passes for school grounds entry and dismissal matching LRN #{viewingQrStudent.id}</p>
                </div>
                <button 
                  onClick={() => setViewingQrStudent(null)} 
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors border-0 cursor-pointer bg-transparent"
                >
                  <X size={20} />
                </button>
              </div>

              {/* QR Content */}
              <div className="flex-1 overflow-auto p-8 space-y-6">
                {loadingFetchers ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-3">
                    <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading Fetcher credentials...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Student details */}
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-650 text-white rounded-xl flex items-center justify-center font-black text-lg">
                        {viewingQrStudent.name[0]}
                      </div>
                      <div>
                        <h4 className="font-black text-slate-800 uppercase tracking-tight leading-none mb-1">{viewingQrStudent.name}</h4>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{viewingQrStudent.grade} • {viewingQrStudent.section} • LRN: #{viewingQrStudent.id}</p>
                      </div>
                    </div>

                    {/* QR Cards grid */}
                    <div>
                      <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Authorized Fetcher Passes</h4>
                      {studentFetchers.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                          <AlertTriangle className="mx-auto text-slate-300 mb-3" size={24} />
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">No fetchers registered for this student yet.<br/>You can register nannies or parents by editing their profile.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {studentFetchers.map((fetcher: any) => {
                            const qrVal = `${viewingQrStudent.id}|${fetcher.id}`;
                            return (
                              <div key={fetcher.id} className="border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow rounded-2xl p-5 flex flex-col items-center text-center gap-4 relative group">
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                  <QRCodeCanvas 
                                    id={`qr-view-${fetcher.id}`}
                                    value={qrVal} 
                                    size={120} 
                                    level="H"
                                    includeMargin={false}
                                  />
                                </div>
                                <div>
                                  <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{fetcher.name}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{fetcher.relationship} ({fetcher.phone_number})</p>
                                </div>
                                <button 
                                  onClick={() => {
                                    const canvas = document.getElementById(`qr-view-${fetcher.id}`) as HTMLCanvasElement;
                                    if (canvas) {
                                      const url = canvas.toDataURL("image/png");
                                      const link = document.createElement("a");
                                      link.download = `QR_${viewingQrStudent.name.replace(/\s+/g, '_')}_${fetcher.name.replace(/\s+/g, '_')}.png`;
                                      link.href = url;
                                      link.click();
                                    }
                                  }}
                                  className="w-full py-2.5 bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 border border-slate-100 group-hover:border-blue-100 rounded-xl transition-all text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Download size={12} />
                                  Download Pass Card
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Close footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4">
                <button 
                  onClick={() => setViewingQrStudent(null)} 
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-colors shadow-lg cursor-pointer border-0"
                >
                  Close credentials viewer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Change Role Modal */}
      <AnimatePresence>
        {roleChangeUser && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setRoleChangeUser(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-2xl shadow-3xl overflow-hidden p-8 font-sans"
            >
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">Change User Role</h3>
              <p className="text-xs text-slate-500 mb-6">Select a new system role for <strong className="text-slate-900">{roleChangeUser.name}</strong>:</p>
              
              <div className="space-y-3">
                {['admin', 'teacher', 'security'].map((r) => (
                  <button
                    key={r}
                    onClick={async () => {
                      try {
                        const { error } = await supabase
                          .from('profiles')
                          .update({ role: r })
                          .eq('id', roleChangeUser.id);
                        
                        if (error) throw error;

                        await supabase.from('audit_logs').insert({
                          username: 'ADMIN_PORTAL',
                          action: 'CHANGE_ROLE',
                          detail: `CHANGED ROLE: ${roleChangeUser.name.toUpperCase()} -> ${r.toUpperCase()}`,
                          type: 'edit'
                        });

                        fetchDashboardData();
                      } catch(e) {
                        console.error("Failed to change role:", e);
                        alert("Failed to update role in profiles database.");
                      } finally {
                        setRoleChangeUser(null);
                      }
                    }}
                    className={`w-full py-3.5 px-4 rounded-xl text-xs font-black uppercase tracking-widest border transition-all flex items-center justify-between cursor-pointer ${
                      roleChangeUser.currentRole === r
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{r === 'admin' ? 'Administrator' : r === 'teacher' ? 'Faculty / Teacher' : 'Security Portal'}</span>
                    {roleChangeUser.currentRole === r && <span className="text-[9px] font-black tracking-normal px-2 py-0.5 bg-blue-700 text-white rounded">Active</span>}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setRoleChangeUser(null)}
                className="w-full mt-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer border-0"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

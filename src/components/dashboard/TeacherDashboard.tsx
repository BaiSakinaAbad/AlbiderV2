import React, { useState, useEffect } from 'react';
import { Users, Clock, CheckCircle2, AlertTriangle, Send, Bell, X, BookOpen, QrCode, Download, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeCanvas } from 'qrcode.react';
import { Profile, Student, Fetcher } from '../../types';
import { supabase } from '../../lib/supabase';
import { FormSelect } from './helpers/FormSelect';
import { ConfirmDialog } from './helpers/ConfirmDialog';

const GRADE_SECTIONS: Record<string, string[]> = {
  'Kindergarten': ['Apple', 'Berry', 'Cherry'],
  'Grade 1': ['St. James', 'St. Luke', 'St. Mark'],
  'Grade 2': ['St. Jude', 'St. Anne', 'St. Mary'],
  'Grade 3': ['Diamond', 'Crystal', 'Pearl'],
  'Grade 4': ['St. Jude', 'St. Paul', 'St. Peter']
};

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

const handleDbError = (error: unknown) => {
  console.error("Supabase Database Error: ", error);
};

export default function TeacherDashboard({ user }: { user: Profile }) {
  const [students, setStudents] = useState<(Student & { waitTimeMins?: number })[]>([]);
  const [activeTab, setActiveTab] = useState<'attendance' | 'dismissal' | 'directory'>('attendance');
  const [selectedDirectoryStudent, setSelectedDirectoryStudent] = useState<Student | null>(null);
  const [selectedStudentFetchers, setSelectedStudentFetchers] = useState<Fetcher[]>([]);
  const [viewingQrFetcher, setViewingQrFetcher] = useState<Fetcher | null>(null);
  const [notifyingStudent, setNotifyingStudent] = useState<Student | null>(null);
  const [notifyingFetchers, setNotifyingFetchers] = useState<Fetcher[]>([]);
  const [notificationSent, setNotificationSent] = useState<string | null>(null);

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<{ id: string, name: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState<{
    title: string;
    description: string;
    details?: { label: string; value: string }[];
  } | null>(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('is_deleted', false)
          .order('full_name', { ascending: true });

        if (error) throw error;

        const studs = (data || []) as (Student & { waitTimeMins?: number })[];
        // mock waitTime for now if waiting
        studs.forEach(s => {
          if (s.status === 'waiting') s.waitTimeMins = 5;
        });
        setStudents(studs);
      } catch (e) {
        handleDbError(e);
      }
    };

    fetchStudents();

    // Subscribe to live updates using Postgres CDC
    const channel = supabase
      .channel('teacher-students-cdc')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'students'
        },
        () => {
          fetchStudents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (selectedDirectoryStudent) {
      const loadFetchers = async () => {
        try {
          const { data, error } = await supabase
            .from('fetchers')
            .select('*')
            .eq('student_id', selectedDirectoryStudent.id);

          if (error) throw error;
          setSelectedStudentFetchers(data as Fetcher[]);
        } catch(e) {
          handleDbError(e);
        }
      };
      loadFetchers();
    }
  }, [selectedDirectoryStudent]);

  useEffect(() => {
    if (notifyingStudent) {
      const loadFetchers = async () => {
        try {
          const { data, error } = await supabase
            .from('fetchers')
            .select('*')
            .eq('student_id', notifyingStudent.id);

          if (error) throw error;
          setNotifyingFetchers(data as Fetcher[]);
        } catch(e) {
          handleDbError(e);
        }
      };
      loadFetchers();
    }
  }, [notifyingStudent]);

  useEffect(() => {
    if (notificationSent) {
      const timer = setTimeout(() => setNotificationSent(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notificationSent]);

  const updateStatus = async (id: string, status: Student['status']) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    } catch(e) {
      handleDbError(e);
    }
  };

  const handleNotify = (student: Student, fetcher: Fetcher) => {
    console.log(`Sending SMS to ${fetcher.name} (${fetcher.phone_number}) for ${student.full_name}`);
    setNotificationSent(`${student.full_name}'s ${fetcher.relationship} notified!`);
    setNotifyingStudent(null);
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
          username: user.full_name || 'TEACHER',
          action: 'EDIT_STUDENT',
          detail: `UPDATED STUDENT: ${s.name.toUpperCase()} (#${s.id})`,
          type: 'edit'
        });

        setSelectedDirectoryStudent(null);
      }
      setIsStudentModalOpen(false);
      setEditingStudent(null);
      setSuccessMessage({
        title: "Student Profile Updated",
        description: `The student profile for ${s.name} has been successfully updated.`,
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
        username: user.full_name || 'TEACHER',
        action: 'DELETE_STUDENT',
        detail: `DELETED STUDENT: ${studentToDelete.name.toUpperCase()} (#${studentToDelete.id})`,
        type: 'edit'
      });

      setSelectedDirectoryStudent(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete student");
    } finally {
      setStudentToDelete(null);
    }
  };

  const presentCount = students.filter(s => s.status === 'present').length;
  const waitingAtGateCount = students.filter(s => s.status === 'waiting').length;

  return (
    <div className="space-y-6 flex flex-col h-full relative">
      <AnimatePresence>
        {notificationSent && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-24 left-1/2 z-[100] bg-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl font-black text-[10px] uppercase tracking-widest flex items-center whitespace-nowrap"
          >
            <CheckCircle2 size={16} className="mr-3" />
            {notificationSent}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedDirectoryStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedDirectoryStudent(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-3xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-2xl shadow-inner">
                    {selectedDirectoryStudent.full_name[0]}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{selectedDirectoryStudent.full_name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {selectedDirectoryStudent.grade_level} • {selectedDirectoryStudent.section}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setEditingStudent(selectedDirectoryStudent);
                      setIsStudentModalOpen(true);
                    }}
                    className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors cursor-pointer border-0"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => setStudentToDelete({ id: selectedDirectoryStudent.id, name: selectedDirectoryStudent.full_name })}
                    className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors cursor-pointer border-0"
                  >
                    Delete
                  </button>
                  <button onClick={() => setSelectedDirectoryStudent(null)} className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors bg-white border border-slate-200 ml-2">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-8 overflow-auto">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Authorized Fetchers</h4>
                <div className="space-y-4">
                  {selectedStudentFetchers.map((fetcher) => (
                    <div key={fetcher.id} className="border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{fetcher.name}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                          {fetcher.relationship} ({fetcher.relationship_type}) • {fetcher.phone_number}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                          Active
                        </span>
                        <button 
                          onClick={() => setViewingQrFetcher(fetcher)}
                          className="flex items-center justify-center px-4 py-2 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl transition-colors text-[10px] font-black uppercase tracking-widest">
                          <QrCode size={14} className="mr-2" />
                          View QR
                        </button>
                      </div>
                    </div>
                  ))}
                  {selectedStudentFetchers.length === 0 && (
                    <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No fetchers assigned yet</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingQrFetcher && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setViewingQrFetcher(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl p-8 shadow-3xl text-center flex flex-col items-center"
            >
              <button 
                onClick={() => setViewingQrFetcher(null)} 
                className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-1">{viewingQrFetcher.name}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">QR Access Code</p>
              <div className="p-4 border-4 border-slate-100 rounded-3xl mb-6 bg-white shrink-0">
                <QRCodeCanvas id="qr-canvas" value={`${viewingQrFetcher.student_id}|${viewingQrFetcher.id}`} size={200} />
              </div>
              <button 
                onClick={() => {
                  const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
                  if (!canvas) return;
                  const pngUrl = canvas.toDataURL("image/png");
                  const downloadLink = document.createElement("a");
                  downloadLink.href = pngUrl;
                  downloadLink.download = `QR_${viewingQrFetcher.name.replace(/\s+/g, '_')}.png`;
                  document.body.appendChild(downloadLink);
                  downloadLink.click();
                  document.body.removeChild(downloadLink);
                }}
                className="flex items-center justify-center w-full max-w-[200px] bg-blue-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all uppercase tracking-widest active:scale-95 mb-4"
              >
                <Download size={16} className="mr-3" />
                Download PNG
              </button>
              <p className="text-[10px] font-bold text-slate-400 max-w-[200px] leading-relaxed uppercase tracking-widest">
                Scan this code at the gate.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notifyingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setNotifyingStudent(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] shadow-3xl overflow-hidden p-8"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Send Pickup Alert</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Select recipient for {notifyingStudent.full_name}</p>
                </div>
                <button onClick={() => setNotifyingStudent(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                {notifyingFetchers.map((fetcher) => (
                  <button 
                    key={fetcher.id}
                    onClick={() => handleNotify(notifyingStudent, fetcher)}
                    className="w-full p-5 border border-slate-100 bg-slate-50 rounded-2xl hover:border-blue-600 hover:bg-blue-50 transition-all text-left flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{fetcher.name}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {fetcher.relationship} ({fetcher.relationship_type}) • {fetcher.phone_number}
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:border-blue-200 transition-all shadow-sm">
                      <Send size={14} />
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-8 p-5 bg-amber-50 rounded-2xl border border-amber-100 flex items-start">
                <AlertTriangle size={16} className="text-amber-500 mr-4 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-800 font-bold uppercase tracking-widest leading-relaxed">
                  Notice: Automated messages will be logged in system audit. Please only send if 10 min grace period passed.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter font-sans uppercase">Classroom Console</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center">
            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
            Grade 2 • Section St. Jude • Live Monitoring (Supabase CDC)
          </p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner self-start">
          <TabButton 
            active={activeTab === 'attendance'} 
            onClick={() => setActiveTab('attendance')} 
            icon={<Users size={16} />} 
            label="Attendance" 
          />
          <TabButton 
            active={activeTab === 'dismissal'} 
            onClick={() => setActiveTab('dismissal')} 
            icon={<Clock size={16} />} 
            label="Dismissal" 
            badge={waitingAtGateCount > 0 ? waitingAtGateCount : undefined}
          />
          <TabButton 
            active={activeTab === 'directory'} 
            onClick={() => setActiveTab('directory')} 
            icon={<BookOpen size={16} />} 
            label="Directory" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-black text-slate-800 text-[10px] tracking-[0.2em] uppercase flex items-center">
              <span className="w-1.5 h-4 bg-blue-600 mr-3 rounded-full"></span>
              {activeTab === 'attendance' ? 'Daily Enrollment' : activeTab === 'dismissal' ? 'Release Queue Control' : 'Student Directory'}
            </h3>
            {activeTab !== 'directory' && (
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {presentCount} / {students.length} Confirmed Present
              </div>
            )}
          </div>
          
          <div className="overflow-auto divide-y divide-slate-100 flex-1">
            {activeTab === 'directory' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                {students.map(student => (
                  <button 
                    key={student.id} 
                    onClick={() => setSelectedDirectoryStudent(student)}
                    className="p-5 border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-lg transition-all text-left bg-white flex items-center group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center font-black text-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      {student.full_name[0]}
                    </div>
                    <div className="ml-4">
                      <p className="font-black text-slate-900 tracking-tight text-sm">{student.full_name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">ID: #{student.id} • {student.section}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              students.map((student) => (
                <div key={student.id} className="p-6 flex items-center hover:bg-slate-50 transition-all group">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg ${
                    student.status === 'absent' ? 'bg-slate-100 text-slate-400 border border-slate-200 shadow-inner' : 
                    student.status === 'present' ? 'bg-blue-50 text-blue-600 border border-blue-100 shadow-sm' : 
                    'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm'
                  }`}>
                    {student.full_name[0]}
                  </div>
                  <div className="ml-5 flex-1">
                    <p className="font-black text-slate-900 tracking-tight uppercase text-base">{student.full_name}</p>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] mt-1 italic">ID: #{student.id} • {student.section}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    {activeTab === 'attendance' ? (
                      <>
                        <button 
                          onClick={() => updateStatus(student.id, 'present')}
                          className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            student.status === 'present' 
                              ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' 
                              : 'bg-white text-slate-400 border border-slate-200 hover:border-blue-400 hover:text-blue-600'
                          }`}
                        >
                          Present
                        </button>
                        <button 
                          onClick={() => updateStatus(student.id, 'absent')}
                          className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            student.status === 'absent' 
                              ? 'bg-rose-500 text-white shadow-xl shadow-rose-200' 
                              : 'bg-white text-slate-400 border border-slate-200 hover:border-rose-400 hover:text-rose-600'
                          }`}
                        >
                          Absent
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-4">
                        {student.status === 'present' && student.waitTimeMins !== undefined && (
                          <div className="flex items-center space-x-3">
                            {student.waitTimeMins >= 10 && (
                              <button 
                                onClick={() => setNotifyingStudent(student)}
                                className="px-4 py-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 border border-rose-100 flex items-center space-x-2 transition-all shadow-sm group/btn"
                              >
                                <Bell size={14} className="group-hover/btn:animate-wiggle" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Late Alert</span>
                              </button>
                            )}
                            <div className={`text-[9px] font-black px-4 py-2 rounded-xl border flex items-center shadow-inner ${
                               student.waitTimeMins >= 10 ? 'bg-rose-900/5 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              <Clock size={12} className="mr-2 opacity-50" />
                              {student.waitTimeMins}M WAIT
                            </div>
                          </div>
                        )}
                        
                        <span className={`text-[9px] font-black px-4 py-2 rounded-xl uppercase tracking-widest border shadow-sm ${
                           student.status === 'present' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                           student.status === 'dismissed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                           'bg-slate-50 text-slate-400 border-slate-200 opacity-50'
                        }`}>
                          {student.status}
                        </span>

                        {student.status === 'waiting' && (
                          <button 
                            onClick={() => updateStatus(student.id, 'dismissed')}
                            className="bg-blue-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center uppercase tracking-widest active:scale-95"
                          >
                            <Send size={14} className="mr-3" />
                            Release
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-900 text-white">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center">
                  <AlertTriangle size={14} className="mr-3 text-amber-400" />
                  Live Gate Alerts
                </h3>
              </div>
              <div className="p-5 space-y-4">
                {students.filter(s => s.status === 'waiting').slice(0, 1).map(student => (
                  <div key={student.id} className="p-5 bg-amber-50 rounded-2xl border-l-[6px] border-amber-400 shadow-sm">
                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-2">Gate 01 • SCANNED BY GUARD</p>
                    <p className="text-base font-black text-slate-900 uppercase tracking-tight">{student.full_name}</p>
                    <p className="text-[10px] text-slate-500 mt-1 font-bold italic tracking-wide">Fetcher: Sarah Abad (Parent)</p>
                    <div className="mt-5 flex items-center justify-between">
                       <span className="text-[9px] font-black px-3 py-1 bg-white border border-amber-200 rounded-lg text-amber-700 shadow-sm">WAITING</span>
                       <button onClick={() => updateStatus(student.id, 'dismissed')} className="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest">RELEASE →</button>
                    </div>
                  </div>
                ))}

                {students.filter(s => s.status === 'waiting').length === 0 && (
                  <div className="p-5 text-center text-slate-400 font-bold uppercase tracking-wider text-[10px] py-12">
                    No active gate requests
                  </div>
                )}

                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 opacity-60">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Gate 03 • 14:10 PM</p>
                  <p className="text-base font-black text-slate-800 uppercase tracking-tight">Marcus Tan</p>
                  <p className="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-widest">DISMISSED OK</p>
                </div>
              </div>
           </div>

           <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl shadow-blue-900/20 text-white relative overflow-hidden h-52 flex flex-col justify-between">
             <div className="relative z-10">
               <h3 className="font-black text-[10px] uppercase tracking-[0.3em] mb-2 text-emerald-400">Classroom Density</h3>
               <p className="text-slate-400 text-[10px] font-bold leading-tight max-w-[140px] uppercase tracking-widest opacity-60">Total students awaiting gate release requests.</p>
             </div>
             <div className="relative z-10 flex items-baseline">
               <span className="text-7xl font-black font-mono tracking-tighter">
                 {students.filter(s => s.status === 'present').length}
               </span>
               <span className="ml-4 text-[10px] font-black opacity-30 uppercase tracking-[0.4em]">Awaiting</span>
             </div>
             <Users className="absolute -right-12 -bottom-12 w-48 h-48 text-white/5 rotate-12" />
           </div>
        </div>
      </div>

      <AnimatePresence>
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
    </div>
  );
}

function TabButton({ active, onClick, icon, label, badge }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, badge?: number }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all relative ${
        active 
          ? 'bg-slate-900 text-white shadow-xl shadow-slate-300 translate-y-[-1px]' 
          : 'text-slate-400 hover:text-slate-700 hover:bg-white/50'
      }`}
    >
      {icon}
      <span className="ml-3">{label}</span>
      {badge !== undefined && (
        <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px] border-2 border-slate-100 font-black shadow-lg">
          {badge}
        </span>
      )}
    </button>
  );
}

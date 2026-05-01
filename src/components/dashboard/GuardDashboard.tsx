import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle2, XCircle, User, AlertCircle, ScanLine, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Html5Qrcode } from 'html5-qrcode';
import { Profile, Student, Fetcher } from '../../types.ts';
import { collection, query, where, getDocs, doc, updateDoc, setDoc, serverTimestamp, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const handleFirestoreError = (error: unknown) => {
  console.error("Firestore Error: ", error);
  // Optional: show a toast or alert here for the error
};

export default function GuardDashboard({ user }: { user: Profile }) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ student: Student; fetcher: Fetcher } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;
    let timeoutId: ReturnType<typeof setTimeout>;
    let isComponentMounted = true;

    if (isScanning) {
      // Delay initialization to allow motion.div to mount the element
      timeoutId = setTimeout(() => {
        if (!isComponentMounted) return;
        const element = document.getElementById("qr-reader");
        if (!element) return;

        html5QrCode = new Html5Qrcode("qr-reader");
        html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10 }, // removed qrbox to scan whole video feed
          (decodedText) => {
            console.log("Scanned QR Code:", decodedText);
            handleScan(decodedText);
            html5QrCode?.stop().catch(console.error);
            setIsScanning(false);
          },
          (err) => {
            // Ignore parse errors from scanning empty frames
          }
        ).catch(err => {
          console.error("Scanner failed to start:", err);
          setError("Failed to start camera. Please ensure camera permissions are granted.");
          setIsScanning(false);
        });
      }, 500); // 500ms allows the react-motion animation to finish, otherwise the DOM container size might be 0 which breaks html5-qrcode
    }

    return () => {
      isComponentMounted = false;
      clearTimeout(timeoutId);
      if (html5QrCode) {
        if (html5QrCode.isScanning) {
          html5QrCode.stop().then(() => html5QrCode?.clear()).catch(console.error);
        } else {
          html5QrCode.clear();
        }
      }
    };
  }, [isScanning]);

  const handleScan = async (decodedText: string) => {
    try {
      const parts = decodedText.split('-');
      if (parts.length === 2) {
        const studentId = parts[0];
        const fetcherId = parts[1];
        
        const { getDoc } = await import('firebase/firestore');
        const studentRef = doc(db, 'students', studentId);
        const fetcherRef = doc(db, 'fetchers', fetcherId);
        
        const [studentSnap, fetcherSnap] = await Promise.all([
          getDoc(studentRef),
          getDoc(fetcherRef)
        ]);

        if (studentSnap.exists() && fetcherSnap.exists()) {
          const studentData = studentSnap.data() as Omit<Student, 'id'>;
          const fetcherData = fetcherSnap.data() as Omit<Fetcher, 'id'>;
          
          if (studentData.status === 'dismissed') {
            setError("Student already dismissed.");
          } else {
            setScanResult({
              student: { id: studentSnap.id, ...studentData },
              fetcher: { id: fetcherSnap.id, ...fetcherData } as Fetcher
            });
            setError(null);

            // Automatically confirm pickup
            const scanId = Math.random().toString(36).substring(2, 10);
            await setDoc(doc(db, 'scans', scanId), {
               student_id: studentSnap.id,
               fetcher_id: fetcherSnap.id,
               scanned_at: serverTimestamp(),
               guard_id: user.id || 'unknown_guard',
               status: 'waiting_at_gate'
            });
            await updateDoc(doc(db, 'students', studentSnap.id), {
              status: 'waiting'
            });
          }
        } else {
          setError("Invalid QR Code payload.");
        }
      } else {
        // Fallback or generic logic
        if (decodedText.length > 5) {
          setError("QR code has length > 5, but format unrecognized. " + decodedText);
        } else {
           setError("Invalid QR Code length.");
        }
      }
    } catch (e) {
      handleFirestoreError(e);
      setError("System Error: Could not connect to database.");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Left Pane: Verification View */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden min-h-[600px]">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-800 flex items-center">
            <span className="w-1.5 h-4 bg-blue-600 mr-3"></span>
            {isScanning ? 'SYSTEM READY: SCANNING...' : scanResult ? 'VISUAL VERIFICATION: MATCH DETECTED' : 'GATE ACCESS CONTROL'}
          </h2>
          {scanResult && (
            <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded-full uppercase tracking-wider">Authorized Access</span>
          )}
        </div>

        <div className="flex-1 p-6 md:p-10 flex flex-col">
          <AnimatePresence mode="wait">
            {isScanning ? (
              <motion.div 
                key="scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center space-y-6"
              >
                <div className="w-full max-w-sm mx-auto overflow-hidden rounded-2xl border-2 border-blue-100 shadow-inner flex flex-col relative bg-black">
                  <div id="qr-reader" className="w-full h-full" />
                </div>
                <div className="flex items-center text-blue-600 font-bold uppercase tracking-widest text-xs animate-pulse">
                  <ScanLine className="w-5 h-5 mr-3" />
                  Align QR Code for Verification
                </div>
                <div className="flex space-x-4">
                  <button 
                    onClick={() => setIsScanning(false)}
                    className="px-6 py-2 border-2 border-slate-200 text-slate-400 font-bold rounded hover:bg-slate-50 transition-all text-xs uppercase"
                  >
                    Cancel Scan
                  </button>
                  <button 
                    onClick={() => {
                      setIsScanning(false);
                      handleScan("1-f1");
                    }}
                    className="px-6 py-2 border-2 border-amber-200 text-amber-500 font-bold rounded hover:bg-amber-50 transition-all text-xs uppercase"
                    title="For testing purposes"
                  >
                    Simulate
                  </button>
                </div>
              </motion.div>
            ) : scanResult ? (
              <motion.div 
                key="result"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex flex-col"
              >
                <div className="flex flex-col md:flex-row justify-around items-start md:space-x-8 mb-10 space-y-8 md:space-y-0">
                  {/* Student Profile */}
                  <div className="flex flex-col items-center flex-1 w-full">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-4 tracking-widest">Registered Student</div>
                    <div className="w-48 h-48 md:w-56 md:h-56 rounded-2xl bg-slate-100 border-4 border-blue-50 overflow-hidden mb-4 relative shadow-inner">
                      <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                        <User size={80} />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-center text-[10px] py-1.5 font-bold uppercase tracking-wider">ID: #29401</div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">{scanResult.student.full_name}</h3>
                    <p className="text-slate-500 text-sm font-medium">{scanResult.student.grade_level} — Section {scanResult.student.section}</p>
                  </div>

                  {/* Divider */}
                  <div className="hidden md:flex h-64 items-center justify-center">
                    <div className="h-full w-px bg-slate-100"></div>
                  </div>

                  {/* Fetcher Profile */}
                  <div className="flex flex-col items-center flex-1 w-full">
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-4 tracking-widest">Authorized Fetcher</div>
                    <div className="w-48 h-48 md:w-56 md:h-56 rounded-2xl bg-slate-100 border-4 border-emerald-50 overflow-hidden mb-4 relative shadow-inner">
                      {scanResult.fetcher.photo_url ? (
                        <img src={scanResult.fetcher.photo_url} className="w-full h-full object-cover" alt="Fetcher" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 font-bold uppercase text-[10px] bg-slate-50 tracking-widest">
                          <User size={64} className="mb-2 text-slate-300" />
                          No Photo
                        </div>
                      )}
                      <div className="absolute top-2 right-2 px-2 py-1 bg-emerald-500 text-white text-[9px] rounded font-bold uppercase">{scanResult.fetcher.relationship_type}</div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">{scanResult.fetcher.name}</h3>
                    <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">{scanResult.fetcher.relationship}</p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 bg-slate-50 p-6 rounded-xl border border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 font-bold uppercase mb-1">Attendance Status</span>
                    <span className="text-xs font-bold text-blue-700">PRESENT IN CLASSROOM</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 font-bold uppercase mb-1">QR Payload ID</span>
                    <span className="text-xs font-mono text-slate-600 uppercase">{scanResult.student.qr_id}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 font-bold uppercase mb-1">Pickup Window</span>
                    <span className="text-xs font-bold text-slate-700">14:30 - 15:00</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 mt-auto">
                  <button 
                    onClick={() => {
                        setScanResult(null);
                        setIsScanning(true);
                    }}
                    className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-lg shadow-lg shadow-blue-200 flex items-center justify-center space-x-3 transition-transform hover:scale-[1.02] active:scale-95"
                  >
                    <ScanLine className="w-5 h-5" />
                    <span className="tracking-wide uppercase text-sm">Scan Next</span>
                  </button>
                  <button 
                    onClick={() => setScanResult(null)}
                    className="px-8 border-2 border-slate-200 text-slate-400 font-bold py-4 rounded-lg flex items-center space-x-2 hover:bg-slate-50 transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                    <span className="uppercase text-sm">Close</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col items-center justify-center text-center p-12"
              >
                {error && (
                  <div className="text-red-500 font-bold bg-red-50 p-4 flex items-center mb-6 rounded border border-red-200">
                    <AlertCircle className="w-5 h-5 mr-3" />
                    {error}
                  </div>
                )}
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-6">
                  <Camera size={48} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">READY FOR SCAN</h3>
                <p className="text-slate-500 text-sm max-w-xs mb-8 font-medium">Position the student's authorized QR code within the camera frame for automated verification.</p>
                <button 
                  onClick={() => {
                    setError(null);
                    setIsScanning(true);
                  }}
                  className="bg-blue-600 text-white font-bold px-10 py-4 rounded-lg shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all uppercase tracking-widest text-sm"
                >
                  Initiate Scanner
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Pane: Recent Scans Queue */}
      <div className="w-full lg:w-80 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 rounded-t-xl">
          <h3 className="font-bold text-white text-xs flex items-center tracking-widest uppercase">
            <ScanLine className="w-4 h-4 mr-2 text-blue-400" />
            Recent Scans
          </h3>
          <div className="flex items-center">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Live Sync</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4 space-y-3">
          <QueueItem name="Sophia M. Garcia" time="14:12" status="Completed" rel="Guardian (Case 2)" />
          <QueueItem name={scanResult?.student.full_name || "Julian Alvarez"} time="14:15" status="Current" active rel="Case 1" />
          <QueueItem name="Marcus Tan" time="13:58" status="Dismissed" dimmed rel="Nanny (Case 3)" />
          <QueueItem name="Erica Lim" time="13:45" status="Dismissed" dimmed rel="Parent (Case 1)" />
        </div>

        <div className="p-4 bg-slate-900 rounded-b-xl border-t border-slate-800">
          <div className="flex justify-between items-center text-white mb-2">
            <span className="text-[10px] font-medium opacity-70 uppercase tracking-widest">Total Cleared</span>
            <span className="text-xl font-bold font-mono">128 <span className="text-[10px] font-normal opacity-50">/ 450</span></span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-1 rounded-full w-1/4"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QueueItem({ name, time, status, active, dimmed, rel }: { name: string, time: string, status: string, active?: boolean, dimmed?: boolean, rel: string }) {
  return (
    <div className={`p-3 rounded-lg flex flex-col transition-all border ${
      active 
        ? 'bg-white border-l-4 border-l-blue-600 border-slate-200 shadow-md ring-1 ring-blue-500/5 scale-[1.02]' 
        : 'bg-slate-50 border-slate-100'
      } ${dimmed ? 'opacity-40 grayscale' : ''}`}>
      <div className="flex justify-between items-start mb-1">
        <span className={`text-[9px] font-bold uppercase tracking-widest ${active ? 'text-blue-600' : 'text-slate-400'}`}>Gate 01 • {time}</span>
        <span className={`text-[9px] font-bold uppercase ${active ? 'text-blue-600' : 'text-slate-400'}`}>{status}</span>
      </div>
      <div className="text-sm font-bold text-slate-800 uppercase tracking-tight">{name}</div>
      <div className="text-[10px] text-slate-500 font-medium">{rel}</div>
    </div>
  );
}

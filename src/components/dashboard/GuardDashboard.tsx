import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, XCircle, User, AlertCircle, ScanLine } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Html5Qrcode } from 'html5-qrcode';
import { Profile, Student, Fetcher } from '../../types';
import { supabase } from '../../lib/supabase';

const handleDbError = (error: unknown) => {
  console.error("Supabase Database Error: ", error);
};

export default function GuardDashboard({ user }: { user: Profile }) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ student: Student; fetcher: Fetcher } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [clearedCount, setClearedCount] = useState(0);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStopping = useRef(false);

  const fetchRecentScans = useCallback(async () => {
    try {
      // Query recent scans and count cleared
      const { data, error: fetchErr } = await supabase
        .from('scans')
        .select(`
          id,
          scanned_at,
          status,
          student:students ( id, full_name ),
          fetcher:fetchers ( name, relationship )
        `)
        .order('scanned_at', { ascending: false })
        .limit(10);

      if (fetchErr) throw fetchErr;
      if (data) {
        setRecentScans(data.map((s: any) => ({
          id: s.id,
          studentName: s.student?.full_name || 'Unknown Student',
          fetcherName: s.fetcher?.name || 'Unknown Fetcher',
          relationship: s.fetcher?.relationship || 'Authorized Person',
          time: new Date(s.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: s.status === 'waiting_at_gate' ? 'Waiting' : 'Dismissed'
        })));
      }

      // Count dismissed students
      const { count, error: countErr } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'dismissed')
        .eq('is_deleted', false);

      if (!countErr && count !== null) {
        setClearedCount(count);
      }
    } catch (e) {
      handleDbError(e);
    }
  }, []);

  useEffect(() => {
    fetchRecentScans();

    // Subscribe to scans insert events
    const scansChannel = supabase
      .channel('guard-scans-cdc')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scans' }, () => {
        fetchRecentScans();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(scansChannel);
    };
  }, [fetchRecentScans]);

  const stopScanner = useCallback(async () => {
    if (isStopping.current) return;
    isStopping.current = true;
    try {
      const scanner = scannerRef.current;
      if (scanner) {
        if (scanner.isScanning) {
          await scanner.stop();
        }
        scanner.clear();
        scannerRef.current = null;
      }
    } catch (e) {
      console.error("Error stopping scanner:", e);
    } finally {
      isStopping.current = false;
    }
  }, []);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let cancelled = false;

    if (isScanning) {
      timeoutId = setTimeout(async () => {
        if (cancelled) return;
        const element = document.getElementById("qr-reader");
        if (!element) return;

        // Clean up any leftover scanner instance before creating a new one
        await stopScanner();

        if (cancelled) return;

        const html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;

        try {
          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 20,
              qrbox: { width: 300, height: 300 },
              aspectRatio: 1.0,
              disableFlip: false,
              // @ts-expect-error - experimentalFeatures is supported by the library but missing from type definitions
              experimentalFeatures: {
                useBarCodeDetectorIfSupported: true
              }
            },
            (decodedText) => {
              console.log("Scanned QR Code:", decodedText);
              handleScan(decodedText);
              // Stop scanner then allow re-scan
              stopScanner().then(() => setIsScanning(false));
            },
            () => {
              // Ignore parse errors from scanning empty frames
            }
          );
        } catch (err) {
          console.error("Scanner failed to start:", err);
          setError("Failed to start camera. Please ensure camera permissions are granted.");
          setIsScanning(false);
        }
      }, 500);
    }

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      stopScanner();
    };
  }, [isScanning, stopScanner]);

  const handleScan = async (decodedText: string) => {
    try {
      let studentId = '';
      let fetcherId = '';

      if (decodedText.includes('|')) {
        const parts = decodedText.split('|');
        if (parts.length >= 2) {
          studentId = parts[0];
          fetcherId = parts.slice(1).join('|');
        }
      } else {
        const parts = decodedText.split('-');
        if (parts.length === 2) {
          studentId = parts[0];
          fetcherId = parts[1];
        } else {
          const match = decodedText.match(/(.+)-(f[1-3]_.+)/);
          if (match) {
            studentId = match[1];
            fetcherId = match[2];
          }
        }
      }

      if (studentId && fetcherId) {
        // Fetch student and fetcher
        const [studentRes, fetcherRes] = await Promise.all([
          supabase.from('students').select('*').eq('id', studentId).eq('is_deleted', false).single(),
          supabase.from('fetchers').select('*').eq('id', fetcherId).single()
        ]);

        if (studentRes.error || !studentRes.data) {
          setError("Student record not found.");
          return;
        }

        if (fetcherRes.error || !fetcherRes.data) {
          setError("Authorized fetcher record not found.");
          return;
        }

        const studentData = studentRes.data as Student;
        const fetcherData = fetcherRes.data as Fetcher;
        
        if (studentData.status === 'dismissed') {
          setError("Student already dismissed.");
        } else {
          setScanResult({
            student: studentData,
            fetcher: fetcherData
          });
          setError(null);

          // Update student status to waiting
          const { error: updateErr } = await supabase
            .from('students')
            .update({ status: 'waiting', holding_area: 'Gate' })
            .eq('id', studentId);

          if (updateErr) throw updateErr;

          // Save scan log
          const { error: scanErr } = await supabase
            .from('scans')
            .insert({
               student_id: studentId,
               fetcher_id: fetcherId,
               security_id: user.id,
               status: 'waiting_at_gate'
            });

          if (scanErr) throw scanErr;

          // Save dismissal log auditing
          const { error: logErr } = await supabase
            .from('dismissal_logs')
            .insert({
              student_id: studentId,
              fetcher_id: fetcherId,
              scanned_at: new Date().toISOString(),
              security_id: user.id,
              status: 'waiting_at_gate'
            });

          if (logErr) throw logErr;

          // Refresh the scans panel
          fetchRecentScans();
        }
      } else {
        if (decodedText.length > 5) {
          setError("QR code unrecognized. Format must be STUDENT_ID|FETCHER_ID or STUDENT_ID-FETCHER_ID.");
        } else {
          setError("Invalid QR Code length.");
        }
      }
    } catch (e) {
      handleDbError(e);
      setError("System Error: Could not connect to database.");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full font-sans">
      {/* Left Pane: Verification View */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden min-h-[600px]">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="text-xs font-black text-slate-800 flex items-center uppercase tracking-wider">
            <span className="w-1.5 h-4 bg-blue-600 mr-3 rounded-full"></span>
            {isScanning ? 'SYSTEM READY: SCANNING...' : scanResult ? 'VISUAL VERIFICATION: MATCH DETECTED' : 'GATE ACCESS CONTROL'}
          </h2>
          {scanResult && (
            <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black rounded-full uppercase tracking-wider border border-green-200">Authorized Access</span>
          )}
        </div>

        <div className="flex-1 p-6 md:p-10 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {isScanning ? (
              <motion.div 
                key="scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center space-y-6"
              >
                <div className="w-full max-w-sm mx-auto overflow-hidden rounded-2xl border-2 border-blue-100 shadow-inner flex flex-col relative bg-black" style={{ minHeight: '320px' }}>
                  <div id="qr-reader" className="w-full" style={{ minHeight: '320px' }} />
                </div>
                <div className="flex items-center text-blue-600 font-black uppercase tracking-widest text-[10px] animate-pulse">
                  <ScanLine className="w-5 h-5 mr-3" />
                  Align QR Code for Verification
                </div>
                <div className="flex space-x-4">
                  <button 
                    onClick={() => setIsScanning(false)}
                    className="px-8 py-3 border-2 border-slate-200 text-slate-400 font-black rounded-xl hover:bg-slate-50 transition-all text-[10px] uppercase tracking-widest bg-white"
                  >
                    Cancel Scan
                  </button>
                  <button 
                    onClick={() => {
                      setIsScanning(false);
                      handleScan("1-f1");
                    }}
                    className="px-8 py-3 border-2 border-amber-200 text-amber-600 font-black rounded-xl hover:bg-amber-50 transition-all text-[10px] uppercase tracking-widest bg-white"
                    title="For testing purposes"
                  >
                    Simulate Test Scan
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
                  <div className="flex flex-col items-center flex-1 w-full text-center">
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Registered Student</div>
                    <div className="w-48 h-48 md:w-56 md:h-56 rounded-2xl bg-slate-100 border-4 border-blue-50 overflow-hidden mb-4 relative shadow-inner">
                      <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                        <User size={80} />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-center text-[10px] py-2 font-black uppercase tracking-wider">ID: #{scanResult.student.id}</div>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{scanResult.student.full_name}</h3>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-1">{scanResult.student.grade_level} — Section {scanResult.student.section}</p>
                  </div>

                  {/* Divider */}
                  <div className="hidden md:flex h-64 items-center justify-center">
                    <div className="h-full w-px bg-slate-100"></div>
                  </div>

                  {/* Fetcher Profile */}
                  <div className="flex flex-col items-center flex-1 w-full text-center">
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Authorized Fetcher</div>
                    <div className="w-48 h-48 md:w-56 md:h-56 rounded-2xl bg-slate-100 border-4 border-emerald-50 overflow-hidden mb-4 relative shadow-inner">
                      {scanResult.fetcher.photo_url ? (
                        <img src={scanResult.fetcher.photo_url} className="w-full h-full object-cover" alt="Fetcher" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 font-bold uppercase text-[9px] bg-slate-50 tracking-widest">
                          <User size={64} className="mb-2 text-slate-300" />
                          No Photo Provided
                        </div>
                      )}
                      <div className="absolute top-2 right-2 px-2.5 py-1 bg-emerald-500 text-white text-[9px] rounded font-black uppercase">{scanResult.fetcher.relationship_type}</div>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{scanResult.fetcher.name}</h3>
                    <p className="text-slate-500 text-xs font-black uppercase tracking-widest mt-1">{scanResult.fetcher.relationship}</p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 bg-slate-50 p-6 rounded-xl border border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 font-black uppercase mb-1">Queue Status</span>
                    <span className="text-[10px] font-black text-blue-700 uppercase">WAITING FOR RELEASE</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 font-black uppercase mb-1">QR Access ID</span>
                    <span className="text-[10px] font-bold font-mono text-slate-600 uppercase">{scanResult.student.qr_id}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 font-black uppercase mb-1">Contact Number</span>
                    <span className="text-[10px] font-bold text-slate-700 font-mono">{scanResult.fetcher.phone_number}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4 mt-auto">
                  <button 
                    onClick={() => {
                        setScanResult(null);
                        setIsScanning(true);
                    }}
                    className="flex-1 bg-blue-600 text-white font-black py-4 rounded-xl shadow-xl shadow-blue-200 flex items-center justify-center space-x-3 transition-transform hover:scale-[1.01] active:scale-95 text-[10px] uppercase tracking-widest cursor-pointer"
                  >
                    <ScanLine className="w-4 h-4" />
                    <span>Scan Next</span>
                  </button>
                  <button 
                    onClick={() => setScanResult(null)}
                    className="px-8 border-2 border-slate-200 text-slate-400 font-black py-4 rounded-xl flex items-center space-x-2 hover:bg-slate-50 transition-colors text-[10px] uppercase tracking-widest cursor-pointer bg-white"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Close Profile</span>
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
                  <div className="text-red-600 font-bold bg-red-50 p-4 flex items-center mb-6 rounded-xl border border-red-200 text-[10px] uppercase tracking-wider">
                    <AlertCircle className="w-5 h-5 mr-3 shrink-0" />
                    {error}
                  </div>
                )}
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-6 border border-slate-200 shadow-inner">
                  <Camera size={48} />
                </div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight mb-2 uppercase">READY FOR SCAN</h3>
                <p className="text-slate-400 text-xs max-w-xs mb-8 font-medium uppercase tracking-widest leading-relaxed">Position the student's authorized QR code within the camera frame for automated verification.</p>
                <button 
                  onClick={() => {
                    setError(null);
                    setIsScanning(true);
                  }}
                  className="bg-blue-600 text-white font-black px-10 py-4 rounded-xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all uppercase tracking-widest text-[10px] active:scale-95 cursor-pointer"
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
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 rounded-t-xl text-white">
          <h3 className="font-black text-xs flex items-center tracking-widest uppercase">
            <ScanLine className="w-4 h-4 mr-2 text-blue-400" />
            Recent Scans
          </h3>
          <div className="flex items-center bg-slate-850 px-2.5 py-1 rounded-full border border-slate-800">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Live Sync</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4 space-y-3 max-h-[460px]">
          {recentScans.map((scan, index) => (
            <QueueItem 
              key={scan.id} 
              name={scan.studentName} 
              time={scan.time} 
              status={scan.status} 
              active={index === 0} 
              rel={`${scan.fetcherName} (${scan.relationship})`} 
            />
          ))}
          {recentScans.length === 0 && (
            <div className="p-8 text-center text-slate-300 font-bold uppercase tracking-wider text-[10px] py-12">
              No scans logged today
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-900 rounded-b-xl border-t border-slate-800 text-white">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-black opacity-70 uppercase tracking-widest">Total Cleared</span>
            <span className="text-xl font-black font-mono">{clearedCount}</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(100, (clearedCount / 20) * 100)}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QueueItem({ name, time, status, active, rel }: { name: string, time: string, status: string, active?: boolean, rel: string }) {
  return (
    <div className={`p-4 rounded-xl flex flex-col transition-all border ${
      active 
        ? 'bg-white border-l-4 border-l-blue-600 border-slate-200 shadow-md ring-1 ring-blue-500/5 scale-[1.01]' 
        : 'bg-slate-50 border-slate-100'
      }`}>
      <div className="flex justify-between items-start mb-1">
        <span className={`text-[9px] font-black uppercase tracking-widest ${active ? 'text-blue-600' : 'text-slate-400'}`}>Gate 01 • {time}</span>
        <span className={`text-[9px] font-black uppercase tracking-widest ${active ? 'text-blue-600' : 'text-slate-400'}`}>{status}</span>
      </div>
      <div className="text-sm font-black text-slate-800 uppercase tracking-tight">{name}</div>
      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-0.5">{rel}</div>
    </div>
  );
}

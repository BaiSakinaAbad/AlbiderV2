/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LogIn, Shield, Users, UserCheck, LogOut, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole, Profile } from './types.ts';
import { auth, db } from './lib/firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// Components
import AdminDashboard from './components/dashboard/AdminDashboard.tsx';
import TeacherDashboard from './components/dashboard/TeacherDashboard.tsx';
import GuardDashboard from './components/dashboard/GuardDashboard.tsx';

export default function App() {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser({ id: firebaseUser.uid, ...userDoc.data() } as Profile);
          } else {
            // Default to 'teacher' or prompt user. We'll set a default role that can be overridden later.
            // For now, let's keep user state null so they can pick a role in the UI, 
            // and then we save it.
            setUser(null); 
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (role: UserRole) => {
    try {
      const provider = new GoogleAuthProvider();
      // Only sign in if not already signed in.
      let firebaseUser = auth.currentUser;
      if (!firebaseUser) {
         const result = await signInWithPopup(auth, provider);
         firebaseUser = result.user;
      }
      
      if (firebaseUser) {
        const userProfile = {
          full_name: firebaseUser.displayName || `${role} User`,
          role: role,
          created_at: serverTimestamp()
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), userProfile, { merge: true });
        setUser({ id: firebaseUser.uid, ...userProfile } as Profile);
      }
    } catch (error) {
      console.error("Login failed", error);
      alert("Login failed: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200"
        >
          <div className="bg-slate-900 p-8 text-center text-white">
            <div className="flex items-center justify-center mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center font-bold text-2xl shadow-lg ring-2 ring-blue-500/20">A</div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight uppercase">Albider</h1>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">Dismissal System Portal</p>
          </div>

          <div className="p-8 space-y-3">
            <RoleButton icon={<Shield className="w-5 h-5" />} label="Administrator" onClick={() => handleLogin('admin')} color="text-slate-900 border-slate-200" />
            <RoleButton icon={<Users className="w-5 h-5" />} label="Teacher Portal" onClick={() => handleLogin('teacher')} color="text-slate-900 border-slate-200" />
            <RoleButton icon={<UserCheck className="w-5 h-5" />} label="Security Guard" onClick={() => handleLogin('guard')} color="text-slate-900 border-slate-200" />
          </div>
          
          <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Version 2.4.0 • Secure Access</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-hidden">
      {/* Header / Navigation Bar */}
      <nav className="h-16 bg-slate-900 text-white flex items-center justify-between px-8 shadow-md z-30 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-xl">A</div>
          <span className="text-xl font-semibold tracking-tight uppercase">Albider</span>
          <span className="h-4 w-px bg-slate-700 ml-2 hidden md:block"></span>
          <span className="text-slate-400 text-xs ml-2 font-medium hidden md:block uppercase tracking-wider">School Dismissal System</span>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="flex flex-col items-end mr-2">
            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Active Role</span>
            <span className="text-xs text-blue-400 font-bold uppercase tracking-tight">{user.role} - {user.full_name}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-slate-700 transition-colors group"
          >
            <LogOut className="w-5 h-5 text-slate-400 group-hover:text-white" />
          </button>
        </div>
      </nav>

      {/* Main Content Layout */}
      <main className="flex-1 overflow-auto p-6 md:px-12 md:py-8 max-w-[1600px] mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={user.role}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {user.role === 'admin' && <AdminDashboard user={user} />}
            {user.role === 'teacher' && <TeacherDashboard user={user} />}
            {user.role === 'guard' && <GuardDashboard user={user} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Status Bar */}
      <footer className="h-10 bg-slate-100 border-t border-slate-200 px-6 flex items-center justify-between text-[10px] font-bold text-slate-500 tracking-wider uppercase shrink-0">
        <div className="flex items-center space-x-4">
          <span className="flex items-center"><span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span> SUPABASE_CONNECTED</span>
          <span className="flex items-center"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span> TWILIO_SMS_ACTIVE</span>
        </div>
        <div className="hidden sm:flex space-x-6">
          <span>ALBIDER CORE V2.4.0</span>
          <span>LAST SYNC: {new Date().toLocaleTimeString()}</span>
        </div>
      </footer>
    </div>
  );
}

function RoleButton({ icon, label, onClick, color }: { icon: React.ReactNode, label: string, onClick: () => void, color: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center p-3.5 rounded-lg border bg-white hover:bg-slate-50 transition-all group relative ${color}`}
    >
      <div className="bg-slate-100 p-2 rounded text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors">
        {icon}
      </div>
      <span className="ml-4 font-bold text-sm tracking-tight uppercase">{label}</span>
      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
        <LogIn className="w-4 h-4 text-blue-600" />
      </div>
    </button>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LogIn, Shield, Users, UserCheck, LogOut, ArrowLeft, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole, Profile } from './types';
import { supabase } from './lib/supabase';

// Components
import AdminDashboard from './components/dashboard/AdminDashboard';
import TeacherDashboard from './components/dashboard/TeacherDashboard';
import GuardDashboard from './components/dashboard/GuardDashboard';

export default function App() {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Auth screen state
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Monitor auth state changes and fetch profile
  useEffect(() => {
    const fetchProfile = async (uid: string) => {
      try {
        let { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', uid)
          .single();

        if (error) {
          // If profile fetch fails, but user is logged in, they might be a newly registered OAuth user
          console.warn("Profile fetch failed, checking role initialization...", error);
        }

        // Handle one-click role syncing from local storage on registration
        const oauthRole = localStorage.getItem('albider_oauth_role');
        if (oauthRole) {
          // Update or insert role assignment in profile
          const { data: updatedData, error: updateErr } = await supabase
            .from('profiles')
            .upsert({
              id: uid,
              role: oauthRole as UserRole,
              full_name: data?.full_name || 'Authorized Staff',
              needs_role_selection: true // Brand new signup prompts picker card pop up
            })
            .select()
            .single();

          if (!updateErr && updatedData) {
            data = updatedData;
          }
          localStorage.removeItem('albider_oauth_role');
        }

        if (data) {
          setUser(data as Profile);
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleGoogleLogin = async () => {
    if (!selectedRole) return;
    setAuthError(null);
    setAuthSubmitting(true);

    try {
      localStorage.setItem('albider_oauth_role', selectedRole);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error("Google OAuth login error:", err);
      setAuthError(err instanceof Error ? err.message : "Google Auth redirect failed");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    if (!selectedRole) return;
    setAuthError(null);
    setAuthSubmitting(true);

    // Default demo accounts
    const demoEmail = `${selectedRole}@albider.com`;
    const demoPassword = 'password123';
    const demoName = `${selectedRole.toUpperCase()} DEMO`;

    try {
      // 1. Try to sign in first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      });

      if (signInError) {
        // 2. If user doesn't exist, sign them up
        if (signInError.message.includes('Invalid credentials') || signInError.message.includes('User not found')) {
          const { error: signUpError } = await supabase.auth.signUp({
            email: demoEmail,
            password: demoPassword,
            options: {
              data: {
                full_name: demoName,
                role: selectedRole,
              }
            }
          });

          if (signUpError) throw signUpError;

          // 3. Try to sign in again after signup
          const { error: retryError } = await supabase.auth.signInWithPassword({
            email: demoEmail,
            password: demoPassword,
          });

          if (retryError) throw retryError;
        } else {
          throw signInError;
        }
      }
    } catch (err) {
      console.error("Demo login error: ", err);
      setAuthError(err instanceof Error ? err.message : "Failed to launch Demo account");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleSelectRoleAfterRegister = async (chosenRole: 'teacher' | 'security') => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: chosenRole,
          needs_role_selection: false
        })
        .eq('id', user.id);

      if (error) throw error;

      setUser({
        ...user,
        role: chosenRole,
        needs_role_selection: false
      });
    } catch (err) {
      console.error("Error setting role after registration:", err);
      alert("Failed to confirm selected role.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setShowLogoutConfirm(false);
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

          <div className="p-8">
            <AnimatePresence mode="wait">
              {!selectedRole ? (
                <motion.div
                  key="role-selection"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-3"
                >
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mb-4">Select Portal Role</p>
                  <RoleButton icon={<Shield className="w-5 h-5" />} label="Administrator" onClick={() => setSelectedRole('admin')} color="text-slate-900 border-slate-200" />
                  <RoleButton icon={<Users className="w-5 h-5" />} label="Teacher Portal" onClick={() => setSelectedRole('teacher')} color="text-slate-900 border-slate-200" />
                  <RoleButton icon={<UserCheck className="w-5 h-5" />} label="Security Portal" onClick={() => setSelectedRole('security')} color="text-slate-900 border-slate-200" />
                </motion.div>
              ) : (
                <motion.div
                  key="auth-form"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-6"
                >
                  <div className="flex items-center space-x-2 text-slate-400 hover:text-slate-600 cursor-pointer mb-2" onClick={() => { setSelectedRole(null); setAuthError(null); }}>
                    <ArrowLeft size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Back to Roles</span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-950 uppercase tracking-tight">
                      One-Click Sign In
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                      Accessing as {selectedRole.toUpperCase()}
                    </p>
                  </div>

                  {authError && (
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold uppercase tracking-wide flex items-start border border-rose-100">
                      <AlertCircle size={14} className="mr-2 shrink-0 mt-0.5" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <button
                      onClick={handleGoogleLogin}
                      disabled={authSubmitting}
                      className="w-full py-3.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md transition-all flex items-center justify-center disabled:opacity-50 cursor-pointer"
                    >
                      <svg className="w-5 h-5 mr-3 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                        <g transform="matrix(1, 0, 0, 1, 0, 0)">
                          <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.48C21.68,11.96 21.56,11.5 21.35,11.1z" fill="#4285F4" />
                          <path d="M12,20.62c2.43,0 4.47,-0.8 5.96,-2.18l-3.3,-2.58c-0.9,0.6 -2.07,0.98 -3.3,0.98 -2.54,0 -4.69,-1.72 -5.46,-4.02H2.5v2.66C4,18.44 7.75,20.62 12,20.62z" fill="#34A853" />
                          <path d="M6.54,12.82c-0.2,-0.6 -0.32,-1.24 -0.32,-1.9s0.12,-1.3 0.32,-1.9V6.36H2.5C1.84,7.68 1.48,9.18 1.48,10.92s0.36,3.24 1.02,4.56L6.54,12.82z" fill="#FBBC05" />
                          <path d="M12,5.38c1.32,0 2.5,0.46 3.44,1.35l2.58,-2.58C16.46,2.72 14.43,1.9 12,1.9 7.75,1.9 4,4.08 2.5,8.08L6.54,10.74c0.77,-2.3 2.92,-4.02 5.46,-4.02z" fill="#EA4335" />
                        </g>
                      </svg>
                      {authSubmitting ? 'Connecting...' : 'Sign In with Google'}
                    </button>

                    <div className="relative flex py-1 items-center">
                      <div className="flex-grow border-t border-slate-200"></div>
                      <span className="flex-shrink mx-4 text-[9px] font-bold text-slate-400 uppercase tracking-wider">or</span>
                      <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    <button
                      onClick={handleDemoLogin}
                      disabled={authSubmitting}
                      className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all flex items-center justify-center disabled:opacity-50 cursor-pointer"
                    >
                      Quick Demo Access
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Version 2.4.0 • Google Secure Sign-In</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (user && user.needs_role_selection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 font-sans">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-3xl overflow-hidden p-8 font-sans border border-slate-100"
        >
          <div className="text-center mb-8">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-blue-600 animate-pulse" />
            </div>
            <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight">Complete Registration</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">One-time role setup for your new account</p>
          </div>

          <p className="text-xs font-bold text-slate-500 mb-4 uppercase tracking-widest text-center">
            Select your school role below:
          </p>

          <div className="space-y-4">
            <button
              onClick={() => handleSelectRoleAfterRegister('teacher')}
              className="w-full flex items-center p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all group relative cursor-pointer text-slate-800"
            >
              <div className="bg-slate-200/60 p-2.5 rounded-lg text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <Users className="w-5 h-5" />
              </div>
              <div className="ml-4 text-left">
                <span className="block font-black text-xs tracking-wider uppercase">Faculty / Teacher</span>
                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">Manage classes & dismissal approval</span>
              </div>
            </button>

            <button
              onClick={() => handleSelectRoleAfterRegister('security')}
              className="w-full flex items-center p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all group relative cursor-pointer text-slate-800"
            >
              <div className="bg-slate-200/60 p-2.5 rounded-lg text-slate-600 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="ml-4 text-left">
                <span className="block font-black text-xs tracking-wider uppercase">Security Staff</span>
                <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">Scan pick-up QRs & clear gates</span>
              </div>
            </button>
          </div>

          <div className="mt-8 text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest border-t border-slate-100 pt-6">
            Albider Secure School Gate Management
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
            onClick={() => setShowLogoutConfirm(true)}
            className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center hover:bg-slate-700 transition-colors group cursor-pointer"
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
            {user.role === 'security' && <GuardDashboard user={user} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Logout Confirmation Dialog */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 mb-4">
                <LogOut className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Sign Out?</h3>
              <p className="text-sm text-slate-500 mb-6">You will be logged out from your Albider account. You can log back in anytime.</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-200 transition-all cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
      className={`w-full flex items-center p-3.5 rounded-lg border bg-white hover:bg-slate-50 transition-all group relative cursor-pointer ${color}`}
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

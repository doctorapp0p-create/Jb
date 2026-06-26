
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth as getTempAuth, signOut as signTempOut } from 'firebase/auth';
import { UserRole, Doctor, Clinic, Medicine, Order, Profile, Prescription, LabTest } from './types';
import { DOCTORS, CLINICS, MEDICINES, EMERGENCY_SERVICES, DISTRICTS, LAB_TESTS, SPECIALTIES } from './constants';
import { slugify, toVirtualEmail } from './utils';
import { gemini } from './services/geminiService';
import { auth, db } from './services/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import SEO from './SEO';
import { DoctorProfilePage, ClinicLandingPage, SpecialistLandingPage, DistrictLandingPage } from './LandingPages';
import { BookingModal } from './src/components/BookingModal';
import { SecurityGuard, sanitizeInput } from './src/components/SecurityGuard';
import { AdminLabBillBuilder } from './src/components/AdminLabBillBuilder';
import { AuthModal } from './src/components/AuthModal';
import { Share2, Bot, Video, Microscope, Ambulance, Star, ShieldCheck, Zap, MessageSquare, ArrowRight, X, Download, Smartphone, Stethoscope, Percent, MapPin, Calendar, Clock, Phone, BadgeCheck, Search, ChevronRight, FileText, Youtube, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- UI Components ---

const Card: React.FC<{ children: React.ReactNode, className?: string, onClick?: () => void }> = ({ children, className = "", onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-[24px] border border-slate-100 shadow-sm p-4 transition-all active:scale-[0.98] ${className}`}>
    {children}
  </div>
);

const Badge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-600",
    active: "bg-emerald-100 text-emerald-600",
    verified: "bg-blue-100 text-blue-600",
    processing: "bg-indigo-100 text-indigo-600",
    completed: "bg-emerald-100 text-emerald-600",
    cancelled: "bg-rose-100 text-rose-600",
    suspended: "bg-red-100 text-red-600"
  };
  return (
    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg ${colors[status] || colors.pending}`}>
      {status}
    </span>
  );
};

const Button: React.FC<{ 
  children: React.ReactNode, 
  onClick?: () => void, 
  variant?: 'primary' | 'secondary' | 'danger' | 'success', 
  className?: string,
  disabled?: boolean,
  loading?: boolean,
  type?: "button" | "submit"
}> = ({ children, onClick, variant = 'primary', className = "", disabled = false, loading = false, type = "button" }) => {
  const styles = {
    primary: "bg-blue-600 text-white shadow-blue-100 shadow-lg",
    secondary: "bg-slate-100 text-slate-600",
    danger: "bg-red-500 text-white shadow-red-100 shadow-lg",
    success: "bg-green-600 text-white shadow-green-100 shadow-lg"
  };
  return (
    <button 
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled || loading}
      className={`px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 ${styles[variant]} ${className}`}
    >
      {loading ? (
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
      ) : children}
    </button>
  );
};

// --- Offline Banner ---
const OfflineBanner: React.FC = () => {
  return (
    <motion.div 
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      className="bg-rose-600 text-white text-center py-2 relative z-[60]"
    >
      <p className="text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
        আপনি বর্তমানে অফলাইনে আছেন। কিছু সার্ভিস সীমিত হতে পারে।
      </p>
    </motion.div>
  );
};

// --- Update Notification for PWA ---
const UpdatePrompt: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleUpdate = () => setShow(true);
    window.addEventListener('swUpdateAvailable', handleUpdate);
    return () => window.removeEventListener('swUpdateAvailable', handleUpdate);
  }, []);

  if (!show) return null;

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-24 left-6 right-6 z-[400] bg-slate-900 text-white p-5 rounded-[32px] shadow-2xl flex items-center justify-between gap-4 border border-white/10"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center animate-pulse">
          <Zap size={20} fill="white" />
        </div>
        <div>
          <h4 className="text-[11px] font-black uppercase tracking-widest">নতুন আপডেট উপলব্ধ!</h4>
          <p className="text-[9px] text-slate-400 font-medium">সেরা পারফরম্যান্সের জন্য অ্যাপটি রিফ্রেশ করুন।</p>
        </div>
      </div>
      <button 
        onClick={() => window.location.reload()}
        className="bg-white text-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg"
      >
        রিফ্রেশ করুন
      </button>
    </motion.div>
  );
};

// --- Floating Download Prompt for Web Version ---
const DownloadFAB: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Check if user has already interacted with the prompt
    const promptSeen = localStorage.getItem('jb_healthcare_apk_prompt_seen');
    if (promptSeen) return;

    // Show tooltip after 3 seconds of page load for the first time
    const timer = setTimeout(() => {
      setShowTooltip(true);
      // Persist seen state so it doesn't auto-prompt again even if they don't click anything
      localStorage.setItem('jb_healthcare_apk_prompt_seen', 'true');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
    setShowTooltip(false);
    // Persist seen state so it doesn't auto-prompt again
    localStorage.setItem('jb_healthcare_apk_prompt_seen', 'true');
  };

  const handleDownload = () => {
    setIsOpen(false);
    setShowTooltip(false);
    localStorage.setItem('jb_healthcare_apk_prompt_seen', 'true');
  };

  return (
    <div className="fixed bottom-24 right-6 z-[300]">
      <AnimatePresence>
        {(isOpen || showTooltip) && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: 20, scale: 0.9, x: 20 }}
            className="absolute bottom-20 right-0 w-72 bg-white rounded-[32px] shadow-2xl border border-slate-100 p-6 mb-2"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="bg-blue-50 p-3 rounded-2xl">
                <Smartphone className="text-blue-600" size={24} />
              </div>
              <button 
                onClick={handleDismiss}
                className="p-1 hover:bg-slate-50 rounded-full text-slate-400"
              >
                <X size={18} />
              </button>
            </div>
            
            <h3 className="text-sm font-black text-slate-800 leading-tight mb-2 uppercase tracking-tight">
              Nilpha অ্যাপ
            </h3>
            
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-5">
              সব ফিচারের সেরা অভিজ্ঞতার জন্য আমাদের অফিসিয়াল অ্যাপটি আপনার ফোনে ইনস্টল করুন। 
            </p>
            
            <div className="space-y-3">
              <a 
                href="/downloads/nilpha.apk" 
                download="nilpha.apk"
                onClick={handleDownload}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
              >
                <Download size={16} /> সরাসরি APK ডাউনলোড করুন
              </a>
              <p className="text-[8px] text-center text-rose-500 font-bold leading-tight">
                *মোবাইলে ডাউনলোড না হলে নতুন ট্যাবে (Open in New Tab) ওপেন করুন।
              </p>
              <div className="flex items-center justify-center gap-2 text-[8px] font-black text-slate-400 uppercase tracking-widest pt-1 border-t border-slate-50">
                <ShieldCheck size={10} /> Secure • Android Version v2.0
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => { setIsOpen(!isOpen); setShowTooltip(false); }}
        className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/40 relative active:scale-90 transition-all border-4 border-white"
      >
        <Smartphone size={28} />
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 1, 0.3] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg"
        >
          <span className="w-2 h-2 bg-white rounded-full shadow-inner" />
        </motion.div>
      </motion.button>
    </div>
  );
};

// --- Admin Dashboard Component ---
const AdminDashboard: React.FC<{ 
  profile: Profile, 
  onLogout: () => void, 
  ticker: string, 
  setTicker: (val: string) => void, 
  onUpdateTicker: () => void,
  doctors: Doctor[],
  hospitals: Clinic[],
  labTests: LabTest[],
  orders: Order[],
  profiles: Profile[],
  appointments: any[],
  onAdd: (type: 'doctor' | 'hospital' | 'lab_test') => void,
  onEdit: (type: 'doctor' | 'hospital' | 'lab_test', item: any) => void,
  onDelete: (type: 'doctor' | 'hospital' | 'lab_test', id: string) => void,
  onRefreshAdminData?: () => Promise<void>,
  onUpdateAppointmentStatus?: (appId: string, status: 'pending' | 'visited' | 'absent') => Promise<void>
}> = ({ profile, onLogout, ticker, setTicker, onUpdateTicker, doctors, hospitals, labTests, orders, profiles, appointments, onAdd, onEdit, onDelete, onRefreshAdminData, onUpdateAppointmentStatus }) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'doctors' | 'orders' | 'hospitals' | 'labtests' | 'billing' | 'referrals' | 'patients'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);

  // Search states for Rural Doctors and Patients
  const [rdSearchQuery, setRdSearchQuery] = useState('');
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // States for Admin's Rural Doctor Registration Engine
  const [rdName, setRdName] = useState('');
  const [rdPhone, setRdPhone] = useState('');
  const [rdPass, setRdPass] = useState('123456');
  const [rdCode, setRdCode] = useState('');
  const [isCreatingRD, setIsCreatingRD] = useState(false);
  const [createdRDSuccess, setCreatedRDSuccess] = useState<{ name: string, phone: string, pass: string, code: string } | null>(null);
  const [rdError, setRdError] = useState<string | null>(null);

  const filteredRDs = useMemo(() => {
    const rds = profiles.filter(p => p.role === UserRole.RURAL_DOCTOR);
    if (!rdSearchQuery.trim()) return rds;
    const query = rdSearchQuery.toLowerCase().trim();
    return rds.filter(r => 
      (r.full_name || '').toLowerCase().includes(query) || 
      (r.referral_code || '').toLowerCase().includes(query) ||
      (r.phone || '').includes(query)
    );
  }, [profiles, rdSearchQuery]);

  const filteredPatients = useMemo(() => {
    const pts = profiles.filter(p => p.role === UserRole.PATIENT || (!p.role && p.phone && p.full_name));
    if (!patientSearchQuery.trim()) return pts;
    const query = patientSearchQuery.toLowerCase().trim();
    return pts.filter(p => 
      (p.full_name || '').toLowerCase().includes(query) || 
      (p.phone || '').includes(query) ||
      (p.referred_by_code || '').toLowerCase().includes(query)
    );
  }, [profiles, patientSearchQuery]);

  const lastRDCode = useMemo(() => {
    const rds = profiles.filter(p => p.role === UserRole.RURAL_DOCTOR);
    let maxNum = 500;
    rds.forEach(r => {
      if (r.referral_code && r.referral_code.toUpperCase().startsWith('RD')) {
        const num = parseInt(r.referral_code.toUpperCase().replace('RD', ''), 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
    return `RD${maxNum + 1}`;
  }, [profiles]);

  useEffect(() => {
    if (!rdCode || rdCode.startsWith('RD')) {
      setRdCode(lastRDCode);
    }
  }, [lastRDCode]);

  const handleCreateRuralDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setRdError(null);
    setCreatedRDSuccess(null);

    const name = rdName.trim();
    const phone = rdPhone.trim();
    const pass = rdPass.trim();
    const code = rdCode.trim().toUpperCase();

    if (!name || !phone || !pass || !code) {
      setRdError('সবগুলো তথ্য বিবরণী সঠিকভাবে পূরণ করুন।');
      return;
    }

    // Validate that rural doctor name is in English only (letters, spaces, dots, dashes, parentheses)
    const isEnglish = /^[A-Za-z0-9\s.,()'-]+$/.test(name);
    if (!isEnglish) {
      setRdError('পল্লী চিকিৎসকের নাম অবশ্যই ইংরেজিতে (English) হতে হবে। বাংলায় বা অন্য কোনো অক্ষরে নাম গ্রহণযোগ্য নয়।');
      return;
    }

    if (phone.length !== 11 || !phone.startsWith('01')) {
      setRdError('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017xxxxxxxx)।');
      return;
    }

    if (pass.length < 6) {
      setRdError('লগইন পাসওয়ার্ড ন্যূনতম ৬ ডিজিটের হতে হবে।');
      return;
    }

    const codeExists = profiles.some(p => p.referral_code?.toUpperCase() === code);
    if (codeExists) {
      setRdError(`এই কোডটি (${code}) ইতিমধ্যে অন্য চিকিৎসকের জন্য ব্যবহৃত হচ্ছে। আলাদা কোড ব্যবহার করুন।`);
      return;
    }

    setIsCreatingRD(true);
    let tempAppRef: any = null;

    try {
      const appOptions = auth.app.options;
      const tempAppName = `TempRDApp-${Date.now()}`;
      tempAppRef = initializeApp(appOptions, tempAppName);
      const tempAuth = getTempAuth(tempAppRef);

      const normalizedEmail = `${phone}@nilpha.com`;

      const credential = await createUserWithEmailAndPassword(tempAuth, normalizedEmail, pass);
      const userId = credential.user.uid;

      const newRCProfile: Profile = {
        id: userId,
        full_name: name,
        phone: phone,
        role: UserRole.RURAL_DOCTOR,
        status: 'active',
        referral_code: code,
        created_password: pass
      };

      await setDoc(doc(db, 'profiles', userId), newRCProfile);

      await signTempOut(tempAuth);

      setCreatedRDSuccess({
        name,
        phone,
        pass,
        code
      });

      setRdName('');
      setRdPhone('');
      setRdPass('123456');
      setRdCode('');

      if (onRefreshAdminData) {
        await onRefreshAdminData();
      }
    } catch (err: any) {
      console.error("Create RD error:", err);
      setRdError(err.message || 'অ্যাকাউন্ট তৈরি করার সময় একটি সমস্যা হয়েছে।');
    } finally {
      if (tempAppRef) {
        try {
          await deleteApp(tempAppRef);
        } catch (delErr) {
          console.error("Temp App delete fail:", delErr);
        }
      }
      setIsCreatingRD(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl -mr-10 -mt-10" />
        <div className="flex justify-between items-center relative z-10">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tighter">Admin Panel</h1>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{profile.full_name}</p>
          </div>
          <button onClick={onLogout} className="bg-white/10 p-3 rounded-2xl hover:bg-white/20 transition-all active:scale-90">
             <X size={20} />
          </button>
        </div>
      </header>

      {/* Admin Navigation */}
      <div className="bg-white border-b px-6 flex gap-6 overflow-x-auto no-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: <Zap size={14} /> },
          { id: 'billing', label: 'Billing Builder', icon: <Percent size={14} /> },
          { id: 'doctors', label: 'Specialists', icon: <Stethoscope size={14} /> },
          { id: 'orders', label: 'Booking Orders', icon: <MessageSquare size={14} /> },
          { id: 'hospitals', label: 'Clinics', icon: <Microscope size={14} /> },
          { id: 'labtests', label: 'Manage Lab Tests', icon: <FileText size={14} /> },
          { id: 'referrals', label: 'Rural Doctors', icon: <BadgeCheck size={14} className="text-emerald-500" /> },
          { id: 'patients', label: 'Patient Search & Serials', icon: <User size={14} className="text-blue-500" /> }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`py-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-b-4 ${activeSubTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-6 space-y-8">
        {activeSubTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                 <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Total Specialists</p>
                 <p className="text-3xl font-black text-slate-800">{doctors.length}</p>
              </div>
              <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                 <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Hospitals</p>
                 <p className="text-3xl font-black text-slate-800">{hospitals.length}</p>
              </div>
            </div>

            {/* Ticker Management */}
            <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 rounded-2xl text-red-600"><Zap size={20} fill="currentColor" /></div>
                <h3 className="font-black text-slate-800 uppercase tracking-tight">Ticker Message Control</h3>
              </div>
              <textarea 
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                className="w-full bg-slate-50 p-6 rounded-[32px] border-2 border-slate-100 focus:border-blue-500 outline-none text-sm font-medium leading-relaxed"
                rows={3}
                placeholder="ম্যাসেজটি এখানে লিখুন..."
              />
              <Button onClick={onUpdateTicker} className="w-full py-5 rounded-[28px] shadow-lg shadow-blue-500/20">
                Update Ticker Message
              </Button>
            </div>

            {/* Website Export Info */}
            <div className="bg-blue-600 p-8 rounded-[40px] text-white space-y-4">
               <h3 className="font-black uppercase tracking-tight flex items-center gap-2"><Smartphone size={20} /> Website Export Info</h3>
               <p className="text-[11px] font-medium leading-relaxed opacity-80">আপনি Hostinger-এ মেজবানি করার জন্য আপনার কোডটি 'Build' করে সেখানে আপলোড করতে পারেন। এতে আপনার কোনো খরচ হবে না।</p>
            </div>

            {/* Database Reset Section */}
            <div className="bg-rose-50 border-2 border-rose-100 p-8 rounded-[40px] space-y-4">
              <h3 className="font-black text-rose-600 uppercase tracking-tight flex items-center gap-2 underline decoration-rose-200">System Maintenance</h3>
              <p className="text-[11px] font-bold text-rose-900/60 leading-relaxed uppercase">সম্পূর্ণ ডাটাবেস রিসেট করে ডিফল্ট ডক্টর এবং হসপিটাল লিস্ট লোড করতে নিচের বাটনটি ব্যবহার করুন। এটি বর্তমানে থাকা সকল ম্যানুয়াল ডাটা মুছে ফেলবে।</p>
              <Button onClick={() => (window as any).seedDatabase()} variant="destructive" className="w-full py-5 rounded-[28px] shadow-lg shadow-rose-500/20">
                Clear & Reset Database (Default Seed)
              </Button>
            </div>
          </div>
        )}

        {activeSubTab === 'doctors' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="flex justify-between items-center">
               <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Specialists List</h2>
               <Button onClick={() => onAdd('doctor')} variant="success" className="px-6 py-2 rounded-xl text-[10px]">Add New</Button>
            </div>
            <div className="space-y-4">
              {doctors.map(d => (
                <div key={d.id} className="bg-white p-4 rounded-[32px] border border-slate-100 flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-4">
                    <img src={d.image} className="w-12 h-12 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                    <div>
                      <p className="text-sm font-black text-slate-800 leading-tight">{d.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{d.specialty}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onEdit('doctor', d)} className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-blue-100 hover:text-blue-600 transition-all"><Zap size={14} /></button>
                    <button onClick={() => onDelete('doctor', d.id)} className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-red-100 hover:text-red-600 transition-all"><X size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubTab === 'hospitals' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="flex justify-between items-center">
               <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Clinics List</h2>
               <Button onClick={() => onAdd('hospital')} variant="success" className="px-6 py-2 rounded-xl text-[10px]">Add New</Button>
            </div>
            <div className="space-y-4">
              {hospitals.map(h => (
                <div key={h.id} className="bg-white p-4 rounded-[32px] border border-slate-100 flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-4">
                    <img src={h.image} className="w-12 h-12 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                    <div>
                      <p className="text-sm font-black text-slate-800 leading-tight">{h.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{h.address}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onEdit('hospital', h)} className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-blue-100 hover:text-blue-600 transition-all"><Zap size={14} /></button>
                    <button onClick={() => onDelete('hospital', h.id)} className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-red-100 hover:text-red-600 transition-all"><X size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubTab === 'billing' && (
          <div className="animate-in fade-in slide-in-from-right-4">
            <AdminLabBillBuilder hospitals={hospitals} />
          </div>
        )}

        {activeSubTab === 'labtests' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="flex justify-between items-center">
               <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Lab Tests List</h2>
               <Button onClick={() => onAdd('lab_test')} variant="success" className="px-6 py-2 rounded-xl text-[10px]">Add New</Button>
            </div>
            <div className="space-y-4">
              {labTests.map(t => (
                <div key={t.id} className="bg-white p-4 rounded-[32px] border border-slate-100 flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <Microscope size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 leading-tight">{t.name}</p>
                      <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">৳{t.price}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onEdit('lab_test', t)} className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-blue-100 hover:text-blue-600 transition-all"><Zap size={14} /></button>
                    <button onClick={() => onDelete('lab_test', t.id)} className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-red-100 hover:text-red-600 transition-all"><X size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSubTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Booking Orders ({orders.length})</h2>
            {orders.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  <MessageSquare size={32} />
                </div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No Active Bookings</p>
                <p className="text-[10px] text-slate-400 font-medium max-w-xs mx-auto">সবগুলো বুকিং এবং ল্যাব টেস্টের অর্ডার এখানে দেখা যাবে।</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(order => (
                  <div key={order.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-black text-slate-800">{order.sender_name}</p>
                          <Badge status={order.status} />
                        </div>
                        <p className="text-[10px] text-blue-600 font-bold uppercase">{order.sender_contact}</p>
                        {order.patient_name && (
                           <p className="text-[9px] font-black text-rose-500 uppercase mt-1">Patient: {order.patient_name}</p>
                        )}
                      </div>
                      <p className="text-[12px] font-black text-slate-800">৳{order.amount + (order.shipping || 0)}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Service:</p>
                      <p className="text-[11px] font-bold text-slate-700">{order.item_name}</p>
                      {order.hospital_name && (
                        <p className="text-[9px] font-black text-blue-600 uppercase mt-1">📍 {order.hospital_name}</p>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-400">
                       <span>{order.payment_method}</span>
                       <span className="text-slate-300">TRX: {order.trx_id}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'referrals' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 text-left">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Rural Doctors & Referrals ({profiles.filter(p => p.role === UserRole.RURAL_DOCTOR).length})</h2>
            
            {/* Top Stat Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-slate-900 text-white p-5 rounded-[28px] border border-slate-800 shadow-md">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">মোট পল্লী চিকিৎসক</p>
                <p className="text-2xl font-black text-indigo-400">{profiles.filter(p => p.role === UserRole.RURAL_DOCTOR).length} জন</p>
              </div>
              <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">মোট নিবন্ধিত রোগী</p>
                <p className="text-2xl font-black text-slate-800">{profiles.filter(p => p.role === UserRole.PATIENT).length} জন</p>
              </div>
              <div className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">রেফার করা সিরিয়াল</p>
                <p className="text-2xl font-black text-teal-600">{appointments.filter(a => a.referred_by_code).length} বার</p>
              </div>
              <div className="bg-white p-5 rounded-[28px] border-2 border-emerald-100 bg-emerald-50/20 shadow-sm">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">ডাক্তার দেখিয়েছেন (সফল)</p>
                <p className="text-2xl font-black text-emerald-700">{appointments.filter(a => a.referred_by_code && a.status === 'visited').length} জন</p>
              </div>
              <div className="bg-white p-5 rounded-[28px] border-2 border-rose-100 bg-rose-50/20 shadow-sm">
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">আসেননি বা রিজেক্ট (ব্যর্থ)</p>
                <p className="text-2xl font-black text-rose-700">{appointments.filter(a => a.referred_by_code && a.status === 'absent').length} জন</p>
              </div>
            </div>

            {/* Main Content Grid: 2 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Premium Rural Doctor Registration Form (Specialized Profile Registry) */}
              <div className="lg:col-span-5 bg-gradient-to-br from-indigo-50/50 to-blue-50/30 p-6 rounded-[32px] border-2 border-indigo-100/80 shadow-md space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-md uppercase tracking-wider">Onboarding System</span>
                    <span className="text-[9px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-md uppercase tracking-wider">Secure PIN</span>
                  </div>
                  <h3 className="text-base font-black text-slate-800 uppercase tracking-tight mt-2 font-black leading-tight">পল্লী চিকিৎসক অ্যাকাউন্ট ক্রিয়েটর</h3>
                  <p className="text-[11px] text-slate-500 font-bold mt-1">রেফারেল-কোড ব্যবহারকারী চিকিৎসকদের বিশেষ ও পৃথক প্রোফাইল তৈরি করার সিকিউর প্যানেল।</p>
                </div>

                {rdError && (
                  <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl border border-rose-100 text-xs font-bold leading-relaxed">
                    ⚠️ {rdError}
                  </div>
                )}

                {createdRDSuccess ? (
                  <div className="bg-emerald-50 text-emerald-800 p-6 rounded-3xl border border-emerald-100 space-y-4 animate-in zoom-in-95">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black bg-emerald-600 text-white p-1 rounded-full">✓</span>
                      <h4 className="font-extrabold text-sm uppercase tracking-tight">সফলভাবে তৈরি হয়েছে!</h4>
                    </div>
                    <p className="text-[11px] font-bold text-emerald-700">পল্লী চিকিৎসকের লগইন এবং রেফারেল বিবরণী নিচে দেওয়া হলো। এটি কপি করে ওনার সাথে শেয়ার করুন:</p>
                    
                    <div className="bg-white/80 p-4 rounded-2xl border border-emerald-100 text-xs font-bold space-y-2 font-mono text-slate-700">
                      <p>👤 নাম: {createdRDSuccess.name}</p>
                      <p>📱 মোবাইল: {createdRDSuccess.phone}</p>
                      <p>🔑 পাসওয়ার্ড: {createdRDSuccess.pass}</p>
                      <p>🎟️ কোড: {createdRDSuccess.code}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button 
                        onClick={() => {
                          const text = `নিলফা (Nilpha) ডিজিটাল মেডিকেল প্ল্যাটফর্মে আপনার "পল্লী চিকিৎসক" অ্যাকাউন্ট তৈরি করা হয়েছে!\n\nনাম: ${createdRDSuccess.name}\nমোবাইল: ${createdRDSuccess.phone}\nপাসওয়ার্ড: ${createdRDSuccess.pass}\nরেফারেল কোড: ${createdRDSuccess.code}\n\nঅ্যাপ লিঙ্ক: https://nilpha.com`;
                          navigator.clipboard.writeText(text);
                          alert('কপি করা হয়েছে!');
                        }}
                        className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-3 rounded-2xl text-[10px] uppercase font-black tracking-wider transition-all"
                      >
                        📋 বিবরণী কপি করুন
                      </button>
                      <a 
                        href={`https://wa.me/?text=${encodeURIComponent(`নিলফা (Nilpha) ডিজিটাল মেডিকেল প্ল্যাটফর্মে আপনার "পল্লী চিকিৎসক" অ্যাকাউন্ট তৈরি করা হয়েছে!\n\nনাম: ${createdRDSuccess.name}\nমোবাইল: ${createdRDSuccess.phone}\nপাসওয়ার্ড: ${createdRDSuccess.pass}\nরেফারেল কোড: ${createdRDSuccess.code}\n\nঅ্যাপ লিঙ্ক: https://nilpha.com`)}`}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-center py-3 rounded-2xl text-[10px] uppercase font-black tracking-wider transition-all flex items-center justify-center gap-1"
                      >
                        💬 হোয়াটসঅ্যাপ করুন
                      </a>
                    </div>

                    <button 
                      onClick={() => setCreatedRDSuccess(null)}
                      className="w-full text-center text-[10px] font-black uppercase text-indigo-600 hover:underline pt-2 block"
                    >
                      আরেকটি অ্যাকাউন্ট তৈরি করুন
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleCreateRuralDoctor} className="space-y-4">
                    <Input 
                      label="চিকিৎসকের পূর্ণ নাম (Full Name)" 
                      placeholder="যেমন: ডাঃ আব্দুর রহমান" 
                      value={rdName}
                      onChange={setRdName}
                      required
                    />

                    <Input 
                      label="১১ ডিজিটের মোবাইল নম্বর" 
                      placeholder="যেমন: 017xxxxxxxx" 
                      value={rdPhone}
                      onChange={setRdPhone}
                      required
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <Input 
                        label="লগইন পাসওয়ার্ড (PIN)" 
                        placeholder="ন্যূনতম ৬ ডিজিট" 
                        value={rdPass}
                        onChange={setRdPass}
                        required
                      />
                      <Input 
                        label="রেফারেল কোড (Unique RD Code)" 
                        placeholder="যেমন: RD501" 
                        value={rdCode}
                        onChange={setRdCode}
                        required
                      />
                    </div>

                    <div className="bg-slate-100 p-3 rounded-2xl text-[10px] text-slate-500 font-bold leading-relaxed border border-slate-200">
                      💡 **কোড ব্যবহারের নিয়ম**: এই কোডটি ব্যবহার করে রোগীরা স্বয়ংক্রিয়ভাবে অ্যাকাউন্ট খুলতে পারবেন। তাছাড়া পল্লী চিকিৎসক বা এই কোড ব্যবহারকারী রেজিষ্ট্রেশন করলে ওনার প্রোফাইল ও তালিকা আলাদাভাবে ট্র্যাকিং করা যাবে।
                    </div>

                    <button
                      type="submit"
                      disabled={isCreatingRD}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isCreatingRD ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : '➕ চিকিৎসকের বিশেষ অ্যাকাউন্ট তৈরি করুন'}
                    </button>
                  </form>
                )}
              </div>

              {/* Right Column: Leaderboard & Stats */}
              <div className="lg:col-span-7 bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">পল্লী চিকিৎসক লিডারবোর্ড ও ট্র্যাকিং</h3>
                  <span className="text-[10px] font-black text-slate-400 uppercase">Realtime Sync</span>
                </div>

                {/* Rural Doctor Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="🔍 পল্লী চিকিৎসকের নাম, কোড বা মোবাইল নম্বর দিয়ে খুঁজুন..."
                    value={rdSearchQuery}
                    onChange={(e) => setRdSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 pl-10 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                  />
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                    🔍
                  </span>
                  {rdSearchQuery && (
                    <button 
                      type="button"
                      onClick={() => setRdSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black bg-slate-200 hover:bg-slate-300 text-slate-600 px-2 py-1 rounded-md uppercase transition-all"
                    >
                      CLEAR
                    </button>
                  )}
                </div>

                {filteredRDs.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <p className="text-xs font-black uppercase tracking-wider">কোনো পল্লী চিকিৎসক পাওয়া যায়নি</p>
                    <p className="text-[10px]">আপনার খোঁজা নাম বা কোডের সাথে মিলছে এমন কোনো পল্লী চিকিৎসক নেই।</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                    {filteredRDs.map((docInfo, idx) => {
                      const referredPList = profiles.filter(p => 
                        (p.referred_by_code || '').trim().toUpperCase() === (docInfo.referral_code || '').trim().toUpperCase()
                      );
                      const referredAppList = appointments.filter(a => 
                        (a.referred_by_code || '').trim().toUpperCase() === (docInfo.referral_code || '').trim().toUpperCase()
                      );
                      const isExpanded = expandedDocId === docInfo.id;
                      
                      return (
                        <div key={docInfo.id || idx} className="py-4 border-b border-slate-50 last:border-none">
                          <div 
                            onClick={() => setExpandedDocId(isExpanded ? null : docInfo.id)}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 p-2 rounded-2xl transition-all"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-slate-400">#{idx + 1}</span>
                                <h4 className="font-extrabold text-sm text-slate-800">{docInfo.full_name}</h4>
                                <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                  Code: {docInfo.referral_code}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 font-bold mt-1">📱 ইউজারনেম: <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">{docInfo.phone || 'N/A'}</span></p>
                              <p className="text-[10px] text-indigo-600 font-bold mt-1">🔑 পাসওয়ার্ড: <span className="font-mono bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-700">{docInfo.created_password || 'N/A'}</span></p>
                              <p className="text-[9px] text-blue-600 font-black mt-2 uppercase tracking-wider">
                                {isExpanded ? '▲ তালিকা বন্ধ করুন' : '▼ নিবন্ধিত রোগী দেখতে ক্লিক করুন'}
                              </p>
                            </div>
                            
                            {/* Stat chips */}
                            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                              <div className="bg-slate-50/85 px-3 py-2 rounded-2xl border border-slate-100 min-w-[85px] text-center">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">নিবন্ধিত রোগী</p>
                                <p className="text-xs font-extrabold text-slate-800 mt-1">{referredPList.length} জন</p>
                              </div>
                              <div className="bg-emerald-50/30 px-3 py-2 rounded-2xl border border-emerald-100 min-w-[85px] text-center">
                                <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest leading-none">কোড বুকিং</p>
                                <p className="text-xs font-extrabold text-emerald-700 mt-1">{referredAppList.length} বার</p>
                              </div>
                              <div className="bg-teal-50/50 px-3 py-2 rounded-2xl border border-teal-100 min-w-[95px] text-center">
                                <p className="text-[8px] font-black text-teal-600 uppercase tracking-widest leading-none">ডাক্তার দেখিয়েছেন</p>
                                <p className="text-xs font-extrabold text-teal-700 mt-1">
                                  {referredAppList.filter(a => a.status === 'visited').length} জন
                                </p>
                              </div>
                              <div className="bg-rose-50/50 px-3 py-2 rounded-2xl border border-rose-100 min-w-[95px] text-center">
                                <p className="text-[8px] font-black text-rose-600 uppercase tracking-widest leading-none">আসেননি/ক্যান্সেল</p>
                                <p className="text-xs font-extrabold text-rose-700 mt-1">
                                  {referredAppList.filter(a => a.status === 'absent').length} জন
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Expanded Patient Referral List & Booking Serials */}
                          {isExpanded && (
                            <div className="mt-3 ml-6 p-5 bg-slate-50/80 rounded-[24px] border border-slate-100/80 space-y-5">
                              {/* Registered Patients Sub-section */}
                              <div className="space-y-3">
                                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-left flex items-center justify-between">
                                  <span>📋 {docInfo.full_name}-এর নিবন্ধিত রোগী তালিকা ({referredPList.length} জন)</span>
                                  <span className="bg-indigo-50 text-indigo-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Patients</span>
                                </h5>
                                {referredPList.length === 0 ? (
                                  <p className="text-[10px] text-slate-400 italic font-semibold text-left">কোনো নিবন্ধিত রোগী নেই</p>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {referredPList.map((pat, pidx) => (
                                      <div key={pat.id || pidx} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex justify-between items-center text-left animate-in fade-in zoom-in-95 duration-200">
                                        <div>
                                          <p className="font-extrabold text-xs text-slate-800">{pat.full_name}</p>
                                          <p className="text-[9px] text-slate-500 font-semibold mt-0.5">📱 {pat.phone || 'N/A'}</p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-[9px] font-bold text-indigo-600">
                                            🔑 পাসওয়ার্ড: <span className="font-mono bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-700">{pat.created_password || pat.password || '123456'}</span>
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Booked Serials Sub-section */}
                              <div className="space-y-3 pt-3 border-t border-slate-100">
                                <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest text-left flex items-center justify-between">
                                  <span>🩺 রোগীদের বুক করা সিরিয়ালসমূহ ({referredAppList.length} বার)</span>
                                  <span className="bg-emerald-50 text-emerald-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Serials</span>
                                </h5>
                                {referredAppList.length === 0 ? (
                                  <p className="text-[10px] text-slate-400 italic font-semibold text-left">কোনো রোগী এখনো সিরিয়াল বুক করেনি</p>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {referredAppList.map((app, appidx) => (
                                      <div key={app.id || appidx} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm space-y-2 text-left animate-in fade-in zoom-in-95 duration-200">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <p className="font-extrabold text-xs text-slate-800">👨‍⚕️ {app.doctor_name}</p>
                                            <p className="text-[9px] text-blue-600 font-bold uppercase">{app.doctor_specialty}</p>
                                          </div>
                                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                                            app.status === 'visited' 
                                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                              : app.status === 'absent'
                                                ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                                          }`}>
                                            {app.status === 'visited' ? 'ডাক্তার দেখিয়েছেন' : app.status === 'absent' ? 'আসেননি/ক্যান্সেল' : 'পেন্ডিং'}
                                          </span>
                                        </div>
                                        <div className="text-[9px] text-slate-500 font-bold space-y-0.5 bg-slate-50 p-2 rounded-lg">
                                          <p>👤 রোগী: <span className="text-slate-800 font-extrabold">{app.patient_name}</span></p>
                                          <p>📱 ফোন: {app.patient_phone}</p>
                                          <p>📅 তারিখ: {app.date}</p>
                                          {app.problems && <p className="italic text-slate-400">🩺 সমস্যা: "{app.problems}"</p>}
                                        </div>
                                        
                                        {/* Status Update Actions */}
                                        <div className="flex gap-1 pt-1.5 border-t border-slate-100">
                                          <button
                                            type="button"
                                            onClick={() => onUpdateAppointmentStatus?.(app.id, 'visited')}
                                            className={`flex-1 py-1 rounded text-[8px] font-black uppercase tracking-wider transition-all ${
                                              app.status === 'visited'
                                                ? 'bg-emerald-600 text-white font-extrabold'
                                                : 'bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700'
                                            }`}
                                          >
                                            ✓ দেখিয়েছেন
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => onUpdateAppointmentStatus?.(app.id, 'absent')}
                                            className={`flex-1 py-1 rounded text-[8px] font-black uppercase tracking-wider transition-all ${
                                              app.status === 'absent'
                                                ? 'bg-rose-600 text-white font-extrabold'
                                                : 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700'
                                            }`}
                                          >
                                            ✕ আসেননি
                                          </button>
                                          {app.status !== 'pending' && (
                                            <button
                                              type="button"
                                              onClick={() => onUpdateAppointmentStatus?.(app.id, 'pending')}
                                              className="px-1.5 py-1 rounded text-[8px] font-black bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all"
                                              title="রিসেট"
                                            >
                                              Reset
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {activeSubTab === 'patients' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 text-left">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">রোগী অনুসন্ধান ও সিরিয়াল হিস্ট্রি</h2>
                <p className="text-xs text-slate-500 font-bold mt-1">প্ল্যাটফর্মের সকল রোগীর প্রোফাইল, পাসওয়ার্ড ও তাদের বুক করা সিরিয়ালের তালিকা ট্র্যাকিং করুন।</p>
              </div>
              <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-2xl border border-blue-100 text-xs font-black">
                মোট নিবন্ধিত রোগী: {profiles.filter(p => p.role === UserRole.PATIENT || !p.role).length} জন
              </div>
            </div>

            {/* Patient Panel Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Search & Results List */}
              <div className="lg:col-span-5 bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-4">
                <div className="space-y-2">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-extrabold">রোগী খুঁজুন</h3>
                  
                  {/* Search input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="🔍 রোগীর নাম, ফোন নম্বর বা রেফারেল কোড দিন..."
                      value={patientSearchQuery}
                      onChange={(e) => setPatientSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 pl-10 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
                    />
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                      🔍
                    </span>
                    {patientSearchQuery && (
                      <button 
                        type="button"
                        onClick={() => setPatientSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black bg-slate-200 hover:bg-slate-300 text-slate-600 px-2 py-1 rounded-md uppercase transition-all"
                      >
                        CLEAR
                      </button>
                    )}
                  </div>
                </div>

                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-2 no-scrollbar space-y-2">
                  {filteredPatients.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                      <p className="text-xs font-black uppercase tracking-wider">কোনো রোগী পাওয়া যায়নি</p>
                      <p className="text-[10px]">সঠিক নাম, ১১ ডিজিটের মোবাইল নম্বর বা রেফারেল কোড দিন।</p>
                    </div>
                  ) : (
                    filteredPatients.map((pat, idx) => {
                      const isSelected = selectedPatientId === pat.id;
                      const patAppsCount = appointments.filter(a => a.patient_id === pat.id || a.patient_phone === pat.phone).length;
                      
                      return (
                        <div 
                          key={pat.id || idx}
                          onClick={() => setSelectedPatientId(pat.id)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer text-left flex justify-between items-center ${
                            isSelected 
                              ? 'bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-500/10' 
                              : 'bg-slate-50 hover:bg-slate-100/70 border-slate-100 text-slate-800'
                          }`}
                        >
                          <div className="space-y-1">
                            <h4 className="font-extrabold text-xs">{pat.full_name}</h4>
                            <p className={`text-[10px] font-bold ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                              📱 {pat.phone || 'N/A'}
                            </p>
                            {pat.referred_by_code && (
                              <span className={`inline-block text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
                              }`}>
                                Ref: {pat.referred_by_code}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl uppercase tracking-wider ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/60 text-slate-600 font-bold'
                            }`}>
                              {patAppsCount} সিরিয়াল
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Profile details and appointment history */}
              <div className="lg:col-span-7 bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm space-y-6">
                {(() => {
                  const pat = profiles.find(p => p.id === selectedPatientId);
                  if (!pat) {
                    return (
                      <div className="py-24 text-center text-slate-400 space-y-3">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-50 rounded-2xl text-slate-300">
                          <User size={24} />
                        </div>
                        <p className="text-xs font-black uppercase tracking-wider">কোনো রোগীকে নির্বাচন করা হয়নি</p>
                        <p className="text-[10px] max-w-xs mx-auto">বামপাশের তালিকা থেকে যেকোনো রোগীর উপর ক্লিক করে তার সম্পূর্ণ প্রোফাইল তথ্য, পাসওয়ার্ড এবং পূর্বের ডক্টর অ্যাপয়েন্টমেন্টের ইতিহাস দেখুন।</p>
                      </div>
                    );
                  }

                  const patApps = appointments.filter(a => a.patient_id === pat.id || a.patient_phone === pat.phone);
                  const recommender = pat.referred_by_code 
                    ? profiles.find(p => p.role === UserRole.RURAL_DOCTOR && p.referral_code?.trim().toUpperCase() === pat.referred_by_code?.trim().toUpperCase())
                    : null;

                  return (
                    <div className="space-y-6 animate-in fade-in duration-200">
                      
                      {/* Patient profile details card */}
                      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-[28px] relative overflow-hidden shadow-lg text-left">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
                        
                        <div className="relative z-10 space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[8px] font-black bg-indigo-500 text-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-wider">Patient ID Profile</span>
                              <h3 className="font-extrabold text-base mt-1.5">{pat.full_name}</h3>
                            </div>
                            <span className="text-[9px] font-black bg-emerald-500 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">Active</span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10 text-xs text-left">
                            <div className="space-y-0.5">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">মোবাইল নম্বর (ইউজারনেম)</p>
                              <p className="font-mono font-bold text-slate-100">{pat.phone || 'N/A'}</p>
                            </div>
                            <div className="space-y-0.5 text-left">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">লগইন পাসওয়ার্ড (PIN)</p>
                              <p className="font-mono font-bold text-slate-100 bg-white/10 px-2 py-0.5 rounded w-fit">{pat.created_password || pat.password || '123456'}</p>
                            </div>
                          </div>

                          {pat.referred_by_code && (
                            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-left">
                              <div>
                                <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">নিবন্ধিত হয়েছেন যার মাধ্যমে (Rural Doctor)</p>
                                <p className="font-extrabold text-indigo-100 mt-0.5">
                                  👨‍⚕️ {recommender ? recommender.full_name : 'অজানা পল্লী চিকিৎসক'}
                                </p>
                              </div>
                              <span className="bg-indigo-600 text-white font-mono text-[9px] font-black px-2.5 py-1 rounded-xl">
                                Code: {pat.referred_by_code}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Consultation History timeline */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest font-extrabold flex items-center justify-between">
                          <span>🩺 ডাক্তারের সিরিয়াল বুকিং সমূহ ({patApps.length} বার)</span>
                          <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full uppercase">Serials</span>
                        </h4>

                        {patApps.length === 0 ? (
                          <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 text-center">
                            <p className="text-[10px] text-slate-400 font-extrabold uppercase italic">এই রোগী এখনও কোনো সিরিয়াল বুক করেননি।</p>
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1 no-scrollbar text-left">
                            {patApps.map((app, appIdx) => (
                              <div 
                                key={app.id || appIdx}
                                className="bg-slate-50/70 hover:bg-slate-50 p-4 rounded-2xl border border-slate-100/80 text-left space-y-2 animate-in fade-in zoom-in-95 duration-200"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h5 className="font-extrabold text-xs text-slate-800">👨‍⚕️ {app.doctor_name}</h5>
                                    <p className="text-[9px] text-blue-600 font-black uppercase mt-0.5">{app.doctor_specialty}</p>
                                  </div>
                                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-xl uppercase tracking-wider ${
                                    app.status === 'visited' 
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                      : app.status === 'absent'
                                        ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                        : 'bg-amber-100 text-amber-700 border border-amber-200'
                                  }`}>
                                    {app.status === 'visited' ? 'ডাক্তার দেখিয়েছেন' : app.status === 'absent' ? 'আসেননি/ক্যান্সেল' : 'পেন্ডিং'}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-bold bg-white p-3 rounded-xl border border-slate-100/60 space-y-0.5 text-left">
                                  <p>📅 দেখানোর তারিখ: <span className="text-slate-800 font-extrabold">{app.date}</span></p>
                                  <p>🏥 জেলা/চেম্বার: <span className="text-slate-700">{app.clinic_name || app.chamber_name || 'N/A'}</span></p>
                                  {app.problems && <p className="italic text-slate-400 mt-1">🩺 সমস্যা: "{app.problems}"</p>}
                                </div>

                                {/* Status Update Actions */}
                                <div className="flex gap-1.5 pt-1.5 border-t border-slate-100">
                                  <button
                                    type="button"
                                    onClick={() => onUpdateAppointmentStatus?.(app.id, 'visited')}
                                    className={`flex-1 py-1.5 px-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
                                      app.status === 'visited'
                                        ? 'bg-emerald-600 text-white font-extrabold'
                                        : 'bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700'
                                    }`}
                                  >
                                    ✓ দেখিয়েছেন
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onUpdateAppointmentStatus?.(app.id, 'absent')}
                                    className={`flex-1 py-1.5 px-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
                                      app.status === 'absent'
                                        ? 'bg-rose-600 text-white font-extrabold'
                                        : 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700'
                                    }`}
                                  >
                                    ✕ আসেননি
                                  </button>
                                  {app.status !== 'pending' && (
                                    <button
                                      type="button"
                                      onClick={() => onUpdateAppointmentStatus?.(app.id, 'pending')}
                                      className="px-2.5 py-1.5 rounded-xl text-[9px] font-black bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all"
                                      title="রিসেট"
                                    >
                                      Reset
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })()}
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Input: React.FC<{
  label: string,
  type?: string,
  placeholder?: string,
  value?: string,
  defaultValue?: string,
  onChange?: (val: string) => void,
  required?: boolean,
  className?: string,
  name?: string
}> = ({ label, type = "text", placeholder, value, defaultValue, onChange, required = false, className = "", name }) => (
  <div className={`space-y-1.5 w-full ${className}`}>
    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">{label}</label>
    <input 
      name={name}
      type={type}
      placeholder={placeholder}
      value={value}
      defaultValue={defaultValue}
      onChange={(e) => onChange ? onChange(e.target.value) : null}
      required={required}
      className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl px-5 py-3 text-sm font-bold text-slate-700 outline-none transition-all placeholder:text-slate-300"
    />
  </div>
);

// --- Todays Doctors Banner Component ---

const TodaysDoctorsBanner: React.FC<{ doctors: Doctor[] }> = ({ doctors }) => {
  const todaysDocs = useMemo(() => doctors.filter(d => d.availableToday), [doctors]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (todaysDocs.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % todaysDocs.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [todaysDocs.length]);

  if (todaysDocs.length === 0) return null;

  const currentDoc = todaysDocs[currentIndex];
  const clinic = CLINICS.find(c => c.id === currentDoc.clinics[0]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-slate-900 rounded-[32px] p-6 text-white relative overflow-hidden h-44 flex items-center shadow-2xl border border-white/5"
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/30 rounded-full blur-[80px] -mr-10 -mt-10" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-600/20 rounded-full blur-[60px] -ml-5 -mb-5" />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={currentDoc.id}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 flex items-center justify-between w-full"
        >
          <div className="space-y-2 flex-1 pr-4">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-emerald-900/40">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> আজকের ডাক্তার
              </div>
              <div className="bg-white/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-sm border border-white/10">
                Live Now
              </div>
            </div>
            
            <h3 className="text-xl font-black tracking-tight leading-tight">{currentDoc.name}</h3>
            
            <div className="space-y-1">
              <p className="text-[11px] text-blue-400 font-black uppercase tracking-widest">{currentDoc.specialty}</p>
              <div className="flex flex-col gap-0.5">
                <p className="text-[10px] text-slate-300 font-bold flex items-center gap-1.5 grayscale opacity-90">
                  📍 {clinic?.name || 'চেম্বার'}
                </p>
                <p className="text-[10px] text-slate-300 font-bold flex items-center gap-1.5 grayscale opacity-90">
                ⏰ {currentDoc.schedule}
                </p>
              </div>
            </div>
          </div>
          
          <div className="relative group">
            <div className="absolute inset-0 bg-blue-600/30 blur-xl rounded-full scale-90 group-hover:scale-110 transition-transform" />
            <div className="relative w-28 h-28 p-1.5 bg-white/10 rounded-[40px] backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden">
              <img 
                src={currentDoc.image} 
                alt={currentDoc.name} 
                className="w-full h-full object-cover rounded-[32px]" 
                referrerPolicy="no-referrer" 
              />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

// --- AI Doctor Component ---

// --- Landing Page Component ---

const LandingPage: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  return (
    <div className="fixed inset-0 z-[200] bg-white overflow-y-auto no-scrollbar">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex flex-col items-center justify-center px-8 text-center bg-gradient-to-b from-blue-50 to-white overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-20 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl"
        />
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="z-10 space-y-6"
        >
          <div className="inline-flex items-center gap-2 bg-blue-600/10 text-blue-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">
            <Zap size={14} fill="currentColor" /> Digital Healthcare Solution
          </div>
          
          <h1 className="text-5xl font-black text-slate-900 leading-[1.1] tracking-tighter">
            আপনার হাতের মুঠোয় <br />
            <span className="text-blue-600">Nilpha ডাক্তার</span>
          </h1>
          
          <p className="text-slate-500 text-[11px] font-medium leading-relaxed max-w-xs mx-auto">
            Nilpha-তে আপনি পাচ্ছেন এআই ডাক্তার পরামর্শ, ভিডিও কনসাল্টেশন এবং জরুরি স্বাস্থ্যসেবা।
          </p>
          
          <div className="pt-8">
            <button 
              onClick={onStart}
              className="bg-blue-600 text-white px-10 py-5 rounded-[32px] font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-500/40 active:scale-95 transition-all flex items-center gap-3 mx-auto"
            >
              শুরু করুন <ArrowRight size={20} />
            </button>
            <p className="text-blue-600 text-lg font-black mt-8 text-center px-4 leading-snug">
              নীলফামারী জেলার সকল হাসপাতাল বা ক্লিনিক রোগীদের তথ্য প্রদানকারী পোর্টাল।
            </p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="absolute bottom-0 w-full px-6"
        >
          <div className="bg-white rounded-t-[40px] shadow-2xl border-x border-t border-slate-100 p-8 flex justify-around items-center">
            <div className="text-center">
              <p className="text-2xl font-black text-slate-800">৫০০০+</p>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">পরামর্শ</p>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div className="text-center">
              <p className="text-2xl font-black text-slate-800">৫০+</p>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">বিশেষজ্ঞ</p>
            </div>
            <div className="w-px h-8 bg-slate-100" />
            <div className="text-center">
              <p className="text-2xl font-black text-slate-800">৪.৯/৫</p>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">রেটিং</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="px-8 py-20 space-y-12 bg-white">
        {/* Discount Banner */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-blue-50 border-2 border-blue-100 p-6 rounded-[32px] flex items-center gap-5 shadow-xl shadow-blue-500/5"
        >
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg animate-bounce">
            <Percent size={28} />
          </div>
          <p className="text-[13px] font-black text-blue-900 leading-snug">
            অ্যাপস বা ওয়েব সাইটের মাধ্যমে রোগীর সিরিয়াল দিলে সকল পরীক্ষা-নিরীক্ষায় ২০ % পর্যন্ত ডিসকাউন্ট।
          </p>
        </motion.div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">আমাদের সেবাসমূহ</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">কেন আমাদের বেছে নেবেন?</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {[
            { icon: <ShieldCheck className="text-blue-600" />, title: "দক্ষ বিশেষজ্ঞ ডক্টর", desc: "নীলফামারীর সেরা বিশেষজ্ঞ ডক্টরদের সিরিয়াল নিন সহজেই।" },
            { icon: <Video className="text-emerald-600" />, title: "ভিডিও কনসাল্টেশন", desc: "দেশের সেরা বিশেষজ্ঞ ডাক্তারদের সাথে সরাসরি কথা বলুন।" },
            { icon: <Ambulance className="text-red-600" />, title: "জরুরি SOS সেবা", desc: "২৪/৭ জরুরি অ্যাম্বুলেন্স এবং অক্সিজেন সাপোর্ট।" }
          ].map((f, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-6 items-center p-6 bg-slate-50 rounded-[32px] border border-slate-100"
            >
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                {f.icon}
              </div>
              <div>
                <h4 className="font-black text-sm text-slate-800 uppercase tracking-tight">{f.title}</h4>
                <p className="text-[10px] text-slate-500 font-medium mt-1 leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section className="px-8 py-20 bg-slate-900 text-white rounded-t-[56px]">
        <div className="text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">
            <Star size={14} fill="currentColor" className="text-yellow-400" /> Trusted by Thousands
          </div>
          
          <h2 className="text-3xl font-black leading-tight tracking-tighter">
            মানুষ কেন আমাদের <br /> পছন্দ করে?
          </h2>

          <div className="space-y-6 text-left">
            {[
              { name: "রাহাত হোসেন", text: "ডাক্তারদের সিরিয়াল নেওয়ার জন্য এই অ্যাপটি অনেক কাজের। খুব সহজে অ্যাপয়েন্টমেন্ট পেয়েছি।" },
              { name: "সুমাইয়া আক্তার", text: "ভিডিও কনসাল্টেশন করে অনেক উপকৃত হয়েছি। ডাক্তার খুব ভালো ছিলেন।" }
            ].map((r, i) => (
              <div key={i} className="bg-white/5 p-6 rounded-[32px] border border-white/10">
                <p className="text-xs font-medium italic opacity-80 leading-relaxed">"{r.text}"</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-[10px] font-black">{r.name[0]}</div>
                  <p className="text-[10px] font-black uppercase tracking-widest">{r.name}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-10">
            <button 
              onClick={onStart}
              className="w-full bg-white text-blue-600 py-5 rounded-[32px] font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              এখনই শুরু করুন
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [homeSubCategory, setHomeSubCategory] = useState<'doctors' | 'hospitals' | 'labtests' | 'emergency'>('doctors');
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const isAdmin = useMemo(() => profile?.role === UserRole.ADMIN || profile?.role === UserRole.MODERATOR, [profile]);
  const [isLoading, setIsLoading] = useState(true);
  const [contactPhone, setContactPhone] = useState('');
  const [patientName, setPatientName] = useState('');
  const [tickerMessage, setTickerMessage] = useState('Nilpha-তে আপনাকে স্বাগত! ডাক্তার চেম্বারে বসার সময় এবং ডাক্তার ফি চূড়ান্ত জানার জন্য আমাদের হট লাইন নাম্বারে যোগাযোগ করুন। যেকোনো প্রয়োজনে কল করুন: ০১৩৫২৬৬৯১০০');

  // Specialty Scroll Ref
  const specialtyScrollRef = useRef<HTMLDivElement>(null);

  // Specialist Filtering
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Multi-Order Cart State
  const [cart, setCart] = useState<{id: string, name: string, price: number, type: 'test' | 'emergency'}[]>([]);

  // Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [doctorSearchTerm, setDoctorSearchTerm] = useState('');
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);

  // Modals & Auth
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'moderator'>('login');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPayment, setShowPayment] = useState<{show: boolean, amount: number, item: string, shipping: number, isVideo?: boolean, isClinic?: boolean, isTest?: boolean, hospitalName?: string}>({show: false, amount: 0, item: '', shipping: 0});
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | null>(null);
  const [paymentType, setPaymentType] = useState<'online' | 'offline'>('online');
  const [trxId, setTrxId] = useState('');
  
  // Serial Form State
  const [showSerialModal, setShowSerialModal] = useState(false);
  const [serialStep, setSerialStep] = useState(0);
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);
  const [serialData, setSerialData] = useState({
    patientInfo: '',
    date: '',
    problems: '',
    previousDoctor: ''
  });
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Synchronize activeTab with URL if necessary
    if (location.pathname === '/') {
       // Default behavior
    }
  }, [location]);

  // Firestore Error Handling Helper
  enum OperationType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LIST = 'list',
    GET = 'get',
    WRITE = 'write',
  }

  interface FirestoreErrorInfo {
    error: string;
    operationType: OperationType;
    path: string | null;
    authInfo: {
      userId?: string | null;
      email?: string | null;
      emailVerified?: boolean | null;
    }
  }

  const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  };

  // Moderator/Admin Control States
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [allPrescriptions, setAllPrescriptions] = useState<Prescription[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [userAppointments, setUserAppointments] = useState<any[]>([]);
  const [referredPatients, setReferredPatients] = useState<any[]>([]);
  const [referredAppointments, setReferredAppointments] = useState<any[]>([]);
  const [isRegisteringPatientByDoc, setIsRegisteringPatientByDoc] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hospitals, setHospitals] = useState<Clinic[]>([]);
  const [labTests, setLabTests] = useState<LabTest[]>([]);
  const [historyTab, setHistoryTab] = useState<'info' | 'history' | 'admin'>('info');
  const [adminSubTab, setAdminSubTab] = useState<'log' | 'users' | 'orders' | 'settings' | 'data'>('log');
  const [adminDataTab, setAdminDataTab] = useState<'doctors' | 'hospitals' | 'tests'>('doctors');
  const [selectedUserRecords, setSelectedUserRecords] = useState<{p: Profile, recs: Prescription[], ords: Order[]} | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleInitialPath = () => {
      const path = window.location.pathname;
      if (path === '/admin' || path === '/wp-admin') {
        setAuthMode('moderator');
        setShowAuthModal(true);
        // Clean up the URL
        window.history.replaceState({}, '', '/');
      }
    };
    handleInitialPath();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const WHATSAPP_NUMBER = '8801352669100';

  const handleWhatsAppConsult = (doctor: Doctor) => {
    setBookingDoctor(doctor);
    setSerialStep(0);
    setSerialData({
      patientInfo: '',
      date: '',
      problems: '',
      previousDoctor: ''
    });
    setShowSerialModal(true);
  };

  const finalizeSerialBooking = () => {
    if (!bookingDoctor) return;
    
    let message = `হ্যালো জেবি হেলথকেয়ার, আমি ডাক্তার ${bookingDoctor.name}-এর সিরিয়াল বুকিং করতে চাই।\n\n`;
    message += `👤 রোগীর তথ্য (নাম, বয়স, ঠিকানা): ${serialData.patientInfo}\n`;
    message += `📅 পরামর্শের তারিখ: ${serialData.date}\n`;
    message += `🩺 সমস্যা: ${serialData.problems}\n`;
    message += `👨‍⚕️ আগের ডক্টর: ${serialData.previousDoctor}`;

    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
    setShowSerialModal(false);
    setBookingDoctor(null);
  };

  const handleWhatsAppBooking = () => {
    if (!patientName || !contactPhone) {
      alert('রোগীর নাম এবং ফোন নম্বর দিন।');
      return;
    }
    const totalAmount = showPayment.amount + showPayment.shipping;
    const message = `হ্যালো জেবি হেলথকেয়ার,\n\nআমি নিচের টেস্টগুলো বুক করতে চাই:\n📝 ${showPayment.item}\n\n💰 মোট টাকা: ৳${totalAmount}\n👤 রোগীর নাম: ${patientName}\n📱 ফোন নম্বর: ${contactPhone}\n\nদয়া করে আমার এই বুকিং টি কনফার্ম করুন।`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  };

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      alert('আপনার ব্রাউজার মেনু থেকে "Install App" বা "Add to Home Screen" এ ক্লিক করুন। আইফোনের ক্ষেত্রে শেয়ার বাটন থেকে "Add to Home Screen" করুন।');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleShare = async () => {
    const shareUrl = 'https://www.nilpha.com/';
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'JB Healthcare',
          text: 'জেবি হেলথকেয়ার - আপনার ডিজিটাল ডাক্তার। স্বাস্থ্যসেবা এখন আপনার হাতের মুঠোয়।',
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        alert('অ্যাপ লিঙ্ক কপি করা হয়েছে!');
      }
    } catch (err: any) {
      // Don't log canceled or abort errors as they are not "bugs"
      if (err.name === 'AbortError') {
        console.log('Share was canceled by user');
        return;
      }
      
      console.warn('Sharing failed, attempting clipboard fallback', err.message);
      
      // Fallback to clipboard if share fails or is cancelled
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('অ্যাপ লিঙ্ক কপি করা হয়েছে!');
      } catch (clipboardErr: any) {
        // If document isn't focused, we can't do much, just log it silenty for devs
        if (clipboardErr.name === 'NotAllowedError' || clipboardErr.message.includes('focused')) {
          console.warn('Clipboard failed due to focus loss, link was not copied.');
        } else {
          console.error('Final clipboard fallback failed', clipboardErr);
        }
      }
    }
  };

  const PAYMENT_NUMBERS = { bkash: '01352669100', nagad: '01352669100' };

  useEffect(() => {
    const init = async () => {
      onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);
            try {
              const profileRef = doc(db, 'profiles', firebaseUser.uid);
              const profileSnap = await getDoc(profileRef);
              
              if (!profileSnap.exists()) {
                // Create profile if missing
                const newProf: Profile = {
                  id: firebaseUser.uid,
                  full_name: firebaseUser.displayName || 'User',
                  phone: '',
                  role: firebaseUser.email === 'doctorapp0p@gmail.com' ? UserRole.ADMIN : UserRole.PATIENT,
                  status: 'active'
                };
                await setDoc(profileRef, newProf);
                setProfile(newProf);
              } else {
                let prof = profileSnap.data() as Profile;
                // Force update role if it's the owner email
                if (firebaseUser.email === 'doctorapp0p@gmail.com' && prof.role !== UserRole.ADMIN) {
                  prof.role = UserRole.ADMIN;
                  await updateDoc(profileRef, { role: UserRole.ADMIN });
                }
                setProfile(prof);
              }
            } catch (error) {
              handleFirestoreError(error, OperationType.GET, `profiles/${firebaseUser.uid}`);
            }
          } else {
            setUser(null);
            setProfile(null);
          }
        });

      try {
        const settingsRef = doc(db, 'settings', 'ticker_message');
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          let val = settingsSnap.data().value;
          if (val.includes('01846800973') || val.includes('০১৮৪৬৮০০৯৭৩')) {
            val = val.replace(/01846800973/g, '01352669100').replace(/০১৮৪৬৮০০৯৭৩/g, '০১৩৫২৬৬৯১০০');
            setDoc(settingsRef, { key: 'ticker_message', value: val }).catch(e => console.error("Auto updating ticker DB failed: ", e));
          }
          setTickerMessage(val);
        }
      } catch (error) {
        console.error("Failed to load ticker settings:", error);
      }
      
      // Fetch initial data
      await fetchData();
      
      setIsLoading(false);
    };
    init();
    
    // Check if landing has been seen
    const hasSeenLanding = sessionStorage.getItem('jb_landing_seen');
    if (hasSeenLanding) setShowLanding(false);
  }, []);

  const fetchData = async () => {
    try {
      const docRes = await getDocs(collection(db, 'doctors'));
      const hospRes = await getDocs(collection(db, 'hospitals'));
      const testRes = await getDocs(collection(db, 'lab_tests'));
      
      const dbDoctors = docRes.docs.map(d => {
        const data = d.data() as Doctor;
        if (d.id === 'j-sakil') {
          // If we are logged in as admin/moderator and the DB version is outdated, update it in Firestore
          const needsUpdate = data.specialty !== 'Orthopedics' || !data.degree.includes('অর্থোপেডিক');
          if (needsUpdate && profile && (profile.role === UserRole.ADMIN || profile.role === UserRole.MODERATOR)) {
            import('firebase/firestore').then(({ doc, updateDoc }) => {
              updateDoc(doc(db, 'doctors', 'j-sakil'), {
                specialty: 'Orthopedics',
                degree: 'MBBS (ঢাকা), এসিপিএস (পেইন, সাইকোলজি) – ইতালি, ফেলো ইন পেইন মেডিসিন, EFIC (ডেনমার্ক), IASP (আমেরিকা), PGT (অর্থোপেডিক/অর্থো), পঙ্গু হাসপাতাল, ঢাকা | ফাউন্ডেশন ডক্টর মেম্বার, RCGP (লন্ডন) | নন সার্জিক্যাল পেইন ম্যানেজমেন্ট, ব্যথা মেডিসিন ও অর্থোপেডিক বিশেষজ্ঞ | BMDC No: A-43198'
              }).catch(e => console.error("Auto-correcting Dr. Shakil's specialty failed: ", e));
            });
          }
          return {
            ...data,
            id: d.id,
            specialty: 'Orthopedics',
            degree: 'MBBS (ঢাকা), এসিপিএস (পেইন, সাইকোলজি) – ইতালি, ফেলো ইন পেইন মেডিসিন, EFIC (ডেনমার্ক), IASP (আমেরিকা), PGT (অর্থোপেডিক/অর্থো), পঙ্গু হাসপাতাল, ঢাকা | ফাউন্ডেশন ডক্টর মেম্বার, RCGP (লন্ডন) | নন সার্জিক্যাল পেইন ম্যানেজমেন্ট, ব্যথা মেডিসিন ও অর্থোপেডিক বিশেষজ্ঞ | BMDC No: A-43198'
          };
        }
        return { id: d.id, ...data } as Doctor;
      }).filter(d => d.id !== 'moun-biplab');

      // Check if moun-biplab exists in Firestore and clean it up if user is admin/moderator
      const hasBiplabInDb = docRes.docs.some(d => d.id === 'moun-biplab');
      if (hasBiplabInDb && profile && (profile.role === UserRole.ADMIN || profile.role === UserRole.MODERATOR)) {
        import('firebase/firestore').then(({ doc, deleteDoc }) => {
          deleteDoc(doc(db, 'doctors', 'moun-biplab')).catch(e => console.error("Auto-deleting Dr. Biplab failed: ", e));
        });
      }

      const dbHospitals = hospRes.docs.map(h => ({ id: h.id, ...h.data() } as Clinic));
      const dbTests = testRes.docs.map(t => ({ id: t.id, ...t.data() } as LabTest));

      // Merge DB data with local constants: DB version has precedence, but local entries not in DB are merged
      const mergedDoctors = dbDoctors.length > 0
        ? [...dbDoctors, ...DOCTORS.filter(d => !dbDoctors.some(dbD => dbD.id === d.id))]
        : DOCTORS;

      const mergedHospitalsList = dbHospitals.length > 0
        ? dbHospitals.map(dbH => {
            const localC = CLINICS.find(c => c.id === dbH.id);
            if (localC) {
              const combinedDoctors = Array.from(new Set([...(dbH.doctors || []), ...(localC.doctors || [])])).filter(id => id !== 'moun-biplab');
              
              // If c-moun hospital has moun-biplab in its DB doctors array, and active user is admin, auto-correct the database
              if (dbH.id === 'c-moun' && dbH.doctors?.includes('moun-biplab') && profile && (profile.role === UserRole.ADMIN || profile.role === UserRole.MODERATOR)) {
                import('firebase/firestore').then(({ doc, updateDoc }) => {
                  updateDoc(doc(db, 'hospitals', 'c-moun'), {
                    doctors: combinedDoctors
                  }).catch(e => console.error("Auto-correcting C-Moun hospital doctors failed: ", e));
                });
              }

              return { ...dbH, ...localC, doctors: combinedDoctors };
            }
            return dbH;
          })
        : CLINICS;

      const finalHospitals = dbHospitals.length > 0
        ? [...mergedHospitalsList, ...CLINICS.filter(c => !dbHospitals.some(dbH => dbH.id === c.id))]
        : CLINICS;

      const finalTests = dbTests.length > 0
        ? [...dbTests, ...LAB_TESTS.filter(t => !dbTests.some(dbT => dbT.id === t.id))]
        : LAB_TESTS;

      setDoctors(mergedDoctors);
      setHospitals(finalHospitals);
      setLabTests(finalTests);
    } catch (error) {
       console.error("Error fetching data:", error);
       // Fallback to constants on error
       setDoctors(DOCTORS);
       setHospitals(CLINICS);
       setLabTests(LAB_TESTS);
    }
  };

  useEffect(() => {
    if (user) {
      if (profile?.role === UserRole.ADMIN) {
        fetchAdminData();
      } else {
        fetchUserData();
      }
    }
  }, [user, profile, activeTab]);

  const fetchAdminData = async () => {
    try {
      const profRes = await getDocs(query(collection(db, 'profiles'), orderBy('full_name', 'asc'))); // Sorting by full_name instead of missing 'id' field
      const presRes = await getDocs(query(collection(db, 'prescriptions'), orderBy('created_at', 'desc')));
      const ordRes = await getDocs(query(collection(db, 'orders'), orderBy('created_at', 'desc')));
      const appRes = await getDocs(query(collection(db, 'appointments'), orderBy('created_at', 'desc')));
      
      setAllProfiles(profRes.docs.map(d => ({ ...d.data() } as Profile)));
      setAllPrescriptions(presRes.docs.map(d => ({ id: d.id, ...d.data() } as Prescription)));
      setAllOrders(ordRes.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      setAllAppointments(appRes.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Admin fetch error:", error);
    }
  };

  const handleUpdateAppointmentStatus = async (appId: string, status: 'pending' | 'visited' | 'absent') => {
    if (!user || profile?.role !== UserRole.ADMIN) {
      alert("অ্যাডমিন পারমিশন নেই।");
      return;
    }
    try {
      const appRef = doc(db, 'appointments', appId);
      await updateDoc(appRef, { status });
      await fetchAdminData();
      await fetchData();
    } catch (err: any) {
      console.error("Error updating appointment status:", err);
      alert("সিরিয়াল স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে। এরর: " + err.message);
    }
  };

  const fetchUserData = async () => {
    if (!profile) return;
    
    const getTimestampMs = (val: any): number => {
      if (!val) return 0;
      if (typeof val === 'string') {
        const parsed = Date.parse(val);
        return isNaN(parsed) ? 0 : parsed;
      }
      if (typeof val.seconds === 'number') {
        return val.seconds * 1000;
      }
      if (typeof val.toDate === 'function') {
        return val.toDate().getTime();
      }
      return 0;
    };
    
    // 1. Fetch prescriptions
    try {
      const presQuery = query(
        collection(db, 'prescriptions'),
        where(profile.role === UserRole.DOCTOR ? 'doctor_id' : 'patient_id', '==', user.uid || user.id)
      );
      const presSnap = await getDocs(presQuery);
      const prescriptions = presSnap.docs.map(d => ({ id: d.id, ...d.data() } as Prescription));
      prescriptions.sort((a, b) => {
        const tA = getTimestampMs(a.created_at);
        const tB = getTimestampMs(b.created_at);
        return tB - tA;
      });
      setAllPrescriptions(prescriptions);
    } catch (err) {
      console.error("Prescriptions fetch error:", err);
    }

    // 2. Fetch orders
    try {
      const ordersQuery = query(
        collection(db, 'orders'),
        where('user_id', '==', user.uid || user.id)
      );
      const ordSnap = await getDocs(ordersQuery);
      const orders = ordSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
      orders.sort((a, b) => {
        const tA = getTimestampMs(a.created_at);
        const tB = getTimestampMs(b.created_at);
        return tB - tA;
      });
      setAllOrders(orders);
    } catch (err) {
      console.error("Orders fetch error:", err);
    }

    // 3. Fetch user appointments
    try {
      const appQuery = query(
        collection(db, 'appointments'),
        where('patient_id', '==', user.uid || user.id)
      );
      const appSnap = await getDocs(appQuery);
      const apps = appSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      apps.sort((a: any, b: any) => {
        const tA = getTimestampMs(a.created_at);
        const tB = getTimestampMs(b.created_at);
        return tB - tA;
      });
      setUserAppointments(apps);
    } catch (err) {
      console.error("User appointments fetch error:", err);
    }

    // 4. Fetch referred patients & appointments for rural doctors
    try {
      if (profile.role === UserRole.RURAL_DOCTOR && profile.referral_code) {
        const refCodeRaw = profile.referral_code.trim();
        const refCodeVariations = Array.from(new Set([
          refCodeRaw.toUpperCase(),
          refCodeRaw.toLowerCase(),
          refCodeRaw
        ]));
        
        const refQuery = query(
          collection(db, 'profiles'),
          where('referred_by_code', 'in', refCodeVariations)
        );
        const refSnap = await getDocs(refQuery);
        setReferredPatients(refSnap.docs.map(d => d.data() as Profile));

        // Fetch appointments matching this referral code
        const refAppQuery = query(
          collection(db, 'appointments'),
          where('referred_by_code', 'in', refCodeVariations)
        );
        const refAppSnap = await getDocs(refAppQuery);
        const refApps = refAppSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        refApps.sort((a: any, b: any) => {
          const tA = getTimestampMs(a.created_at);
          const tB = getTimestampMs(b.created_at);
          return tB - tA;
        });
        setReferredAppointments(refApps);
      }
    } catch (error) {
      console.error("Referred data fetch error:", error);
    }
  };

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsProcessing(true);
    const formData = new FormData(e.currentTarget);
    const rawEmail = (formData.get('email') as string || '').trim();
    const emailVal = toVirtualEmail(rawEmail);
    const passVal = formData.get('password') as string;

    try {
      if (authMode === 'moderator') {
        const isModUser = emailVal === 'moderator' || 
                          emailVal === 'modaretor' || 
                          emailVal === 'moderator@nilpha.com' || 
                          emailVal === 'modaretor@nilpha.com' ||
                          rawEmail.toLowerCase() === 'moderator' ||
                          rawEmail.toLowerCase() === 'modaretor';
        if (isModUser && passVal === 'jagad01750') {
          const modEmail = 'moderator@nilpha.com';
          const modPass = 'jagad01750';
          let firebaseUser;
          
          try {
            const cred = await signInWithEmailAndPassword(auth, modEmail, modPass);
            firebaseUser = cred.user;
          } catch (signInErr: any) {
            if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
              const cred = await createUserWithEmailAndPassword(auth, modEmail, modPass);
              firebaseUser = cred.user;
              const newModProf: Profile = { 
                id: firebaseUser.uid, 
                full_name: 'Main Moderator', 
                role: UserRole.ADMIN, 
                status: 'active', 
                phone: '01352669100' 
              };
              await setDoc(doc(db, 'profiles', firebaseUser.uid), newModProf);
            } else {
              throw signInErr;
            }
          }

          const profileRef = doc(db, 'profiles', firebaseUser.uid);
          const profileSnap = await getDoc(profileRef);
          let modProf = profileSnap.data() as Profile;
          
          if (!modProf) {
            modProf = { id: firebaseUser.uid, full_name: 'Main Moderator', role: UserRole.ADMIN, status: 'active', phone: '01352669100' };
            await setDoc(profileRef, modProf);
          }

          setUser(firebaseUser);
          setProfile(modProf);
          setShowAuthModal(false);
          return;
        } else {
          throw new Error('ভুল ইউজারনেম বা পাসওয়ার্ড!');
        }
      } else if (authMode === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, emailVal, passVal);
        const { user: firebaseUser } = userCredential;
        
        const profileRef = doc(db, 'profiles', firebaseUser.uid);
        const profileSnap = await getDoc(profileRef);
        let prof = profileSnap.data() as Profile;
        
        if (!prof) {
          prof = {
            id: firebaseUser.uid,
            full_name: firebaseUser.displayName || 'User',
            phone: '',
            role: UserRole.PATIENT,
            status: 'active'
          };
          await setDoc(profileRef, prof);
        }

        if (prof?.status === 'pending') {
          await signOut(auth);
          throw new Error('অ্যাকাউন্টটি পেন্ডিং।');
        }
        setUser(firebaseUser);
        setProfile(prof);
        setShowAuthModal(false);
      } else {
        const fullName = formData.get('fullName') as string;
        const phone = formData.get('phone') as string;
        const isRuralDocChecked = formData.get('isRuralDoctor') === 'on';
        
        if (!fullName || !phone || !emailVal || !passVal) {
          throw new Error('দয়া করে সব তথ্য পূরণ করুন!');
        }

        let docCode = '';
        if (isRuralDocChecked) {
          const ruralDoctorCode = (formData.get('ruralDoctorCode') as string || '').trim().toUpperCase();
          const representativePin = (formData.get('representativePin') as string || '').trim();
          if (!ruralDoctorCode || !representativePin) {
            throw new Error('পল্লী চিকিৎসক কোড এবং প্রতিনিধি পিন আবশ্যক!');
          }
          if (representativePin !== '1971' && representativePin !== 'nilpha2026' && representativePin !== '5560') {
            throw new Error('ভুল প্রতিনিধি পিন! শুধুমাত্র আমাদের অনুমোদিত প্রতিনিধি বা এডমিন এই অ্যাকাউন্ট খুলতে পারেন।');
          }
          docCode = ruralDoctorCode;
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, emailVal, passVal);
        const { user: firebaseUser } = userCredential;
        
        await updateProfile(firebaseUser, { displayName: fullName });
        
        const newProf: Profile = { 
          id: firebaseUser.uid, 
          full_name: fullName, 
          phone, 
          role: isRuralDocChecked ? UserRole.RURAL_DOCTOR : UserRole.PATIENT, 
          status: 'active',
          created_password: passVal
        };

        if (isRuralDocChecked) {
          newProf.referral_code = docCode;
        } else {
          const referredByCode = (formData.get('referredByCode') as string || '').trim().toUpperCase();
          if (referredByCode) {
            newProf.referred_by_code = referredByCode;
          }
        }
        
        await setDoc(doc(db, 'profiles', firebaseUser.uid), newProf);
        
        setUser(firebaseUser);
        setProfile(newProf);
        setShowAuthModal(false);
      }
    } catch (err: any) { 
      console.error("Auth Error Detail:", err);
      let msg = 'একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-email') {
        msg = 'ভুল ইমেইল/ইউজারনেম বা পাসওয়ার্ড!';
      } else if (err.message) {
        msg = `এরর: ${err.message}`;
      }
      alert(msg); 
    }
    finally { setIsProcessing(false); }
  };

  const handleGoogleLogin = async () => {
    setIsProcessing(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const { user: firebaseUser } = userCredential;

      const profileRef = doc(db, 'profiles', firebaseUser.uid);
      const profileSnap = await getDoc(profileRef);
      let prof = profileSnap.data() as Profile;
      
      const isAdminEmail = firebaseUser.email === 'doctorapp0p@gmail.com';
      
      if (!prof) {
        prof = {
          id: firebaseUser.uid,
          full_name: firebaseUser.displayName || 'ইউজার',
          phone: '',
          role: isAdminEmail ? UserRole.ADMIN : UserRole.PATIENT,
          status: 'active'
        };
        await setDoc(profileRef, prof);
      } else if (isAdminEmail && prof.role !== UserRole.ADMIN) {
        // Force update role if it's the admin email but role is different
        prof.role = UserRole.ADMIN;
        await updateDoc(profileRef, { role: UserRole.ADMIN });
      }

      if (prof?.status === 'pending') {
        await signOut(auth);
        throw new Error('আপনার অ্যাকাউন্টটি পেন্ডিং অবস্থায় আছে।');
      }

      setUser(firebaseUser);
      setProfile(prof);
      setShowAuthModal(false);
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      alert("গুগল লগইন এরর: " + (err.message || 'একটি সমস্যা হয়েছে'));
    } finally {
      setIsProcessing(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    window.location.reload();
  };

  const toggleCartItem = (item: {id: string, name: string, price: number, type: 'test' | 'emergency'}) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) return prev.filter(i => i.id !== item.id);
      return [...prev, item];
    });
  };

  const startCheckout = () => {
    if (cart.length === 0) return;
    const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);
    const itemNames = cart.map(i => i.name).join(', ');
    const hasEmergency = cart.some(i => i.type === 'emergency');
    const hasTest = cart.some(i => i.type === 'test');
    const shipping = hasEmergency ? 100 : 0;
    
    if (!patientName && profile?.full_name) setPatientName(profile.full_name);
    if (!contactPhone && profile?.phone) setContactPhone(profile.phone);
    
    setShowPayment({ show: true, amount: totalAmount, item: itemNames, shipping, isTest: hasTest });
  };

  const submitOrder = async () => {
    if (isProcessing) return;
    if (!user) {
      alert('অর্ডার করতে দয়া করে লগইন করুন।');
      setShowAuthModal(true);
      return;
    }
    if (!patientName || patientName.length < 3) {
      alert('অনুগ্রহ করে রোগীর নাম লিখুন।');
      return;
    }
    if (!contactPhone || contactPhone.length < 11) {
      alert('অনুগ্রহ করে সঠিক ১১-ডিজিটের ফোন নম্বর দিন।');
      return;
    }
    if (paymentType === 'online' && !trxId) {
      alert('অনুগ্রহ করে TrxID দিন');
      return;
    }
    setIsProcessing(true);
    const newOrder: Order = {
      user_id: user.uid || user.id,
      user_email: user.email || 'guest@jb.com',
      item_name: showPayment.item,
      amount: showPayment.amount,
      shipping: showPayment.shipping,
      payment_method: paymentType === 'offline' ? 'Cash at Clinic' : (paymentMethod || 'bkash'),
      payment_type: paymentType,
      sender_name: profile?.full_name || 'Guest',
      sender_contact: contactPhone,
      patient_name: patientName,
      trx_id: paymentType === 'offline' ? `OFFLINE-${Math.random().toString(36).substr(2, 6).toUpperCase()}` : trxId,
      hospital_name: showPayment.hospitalName || '',
      status: 'pending'
    };

    const finalizeSuccess = () => {
      setShowPayment({ show: false, amount: 0, item: '', shipping: 0 });
      setCart([]);
      setTrxId('');
      setContactPhone('');
      setPatientName('');
      setPaymentType('online');
      alert('আপনার রিকুয়েস্ট গ্রহণ করা হয়েছে। দয়া করে একটু অপেক্ষা করুন।');
      fetchUserData();
    };

    // --- INSTANT FEEDBACK ---
    finalizeSuccess();

    try {
      const ordersRef = collection(db, 'orders');
      
      // Fire and forget PHP notification
      fetch('./api.php?path=orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      }).catch(e => console.log("PHP notify fail:", e));

      // Background Firestore operation
      addDoc(ordersRef, { ...newOrder, created_at: serverTimestamp() })
        .catch(error => {
          console.error("Delayed Firestore error:", error);
        });
        
    } catch (error) {
      console.error("Order submission background logic failure:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredDoctors = useMemo(() => {
    // 1. Availability Logic (Common helpers)
    const bnDayNames = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
    const todayBn = bnDayNames[new Date().getDay()];
    
    const checkDay = (docSchedule: string, day: string) => {
      const s = (docSchedule || '')
        .toLowerCase()
        .replace(/[\u2013\u2014-]/g, '-')
        .replace(/থেকে/g, '-')
        .replace(/\s*-\s*/g, '-')
        .replace(/\s+/g, ' ');

      const searchDay = day.toLowerCase();

      const dayOrderList = ['শনি', 'রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র'];
      const dayOrderListFull = ['শনিবার', 'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার'];

      let searchIdx = -1;
      dayOrderListFull.forEach((dName, idx) => {
        if (searchDay.includes(dName) || searchDay.includes(dayOrderList[idx])) {
          searchIdx = idx;
        }
      });

      if (searchIdx === -1) return false;

      const searchShort = dayOrderList[searchIdx];
      const activeDays = new Set<string>();

      // 1. Check for Daily or Always Open
      if (s.includes('প্রতিদিন') || s.includes('সবদিন') || s === 'প্রতিদিন' || s === '') {
        dayOrderList.forEach(d => activeDays.add(d));
      }

      // 2. Check for Ranges like শনি-বৃহস্পতি or শনিবার-বৃহস্পতিবার
      let rangeMatch;
      const rangeRegex = new RegExp('(শনিবার|রবিবার|সোমবার|মঙ্গলবার|বুধবার|বৃহস্পতিবার|শুক্রবার|শনি|রবি|সোম|মঙ্গল|বুধ|বৃহস্পতি|শুক্র)-(শনিবার|রবিবার|সোমবার|মঙ্গলবার|বুধবার|বৃহস্পতিবার|শুক্রবার|শনি|রবি|সোম|মঙ্গল|বুধ|বৃহস্পতি|শুক্র)', 'g');
      while ((rangeMatch = rangeRegex.exec(s)) !== null) {
        const startDay = rangeMatch[1];
        const endDay = rangeMatch[2];
        
        let startIdx = -1;
        let endIdx = -1;
        
        for (let i = 0; i < 7; i++) {
          if (startDay === dayOrderList[i] || startDay === dayOrderListFull[i]) {
            startIdx = i;
          }
          if (endDay === dayOrderList[i] || endDay === dayOrderListFull[i]) {
            endIdx = i;
          }
        }

        if (startIdx !== -1 && endIdx !== -1) {
          let idx = startIdx;
          while (true) {
            activeDays.add(dayOrderList[idx]);
            if (idx === endIdx) break;
            idx = (idx + 1) % 7;
          }
        }
      }

      // 3. Check for individual mentioned days
      dayOrderList.forEach((dName, idx) => {
        const fullName = dayOrderListFull[idx];
        if (s.includes(fullName) || s.includes(dName)) {
          activeDays.add(dName);
        }
      });

      // 4. Handle Friday Closed or other exclusions
      const isFridayClosed = s.includes('শুক্র') && (s.includes('বন্ধ') || s.includes('অফ') || s.includes('close'));
      if (isFridayClosed) {
        activeDays.delete('শুক্র');
      }

      // 5. If no specific weekdays mapped, defaults to always visible
      if (activeDays.size === 0) {
        return true;
      }

      return activeDays.has(searchShort);
    };

    // Prepare initial list with availability
    let list = doctors.map(d => ({
      ...d,
      availableToday: checkDay(d.schedule, todayBn)
    }));

    // Apply strict filters
    if (selectedHospitalId) {
      list = list.filter(d => (d.clinics || []).includes(selectedHospitalId));
    }
    
    if (selectedSpecialty) {
      list = list.filter(d => d.specialty.toLowerCase() === selectedSpecialty.toLowerCase());
    }
    
    if (selectedDay) {
      list = list.filter(d => {
        if (selectedDay === 'আজ') return d.availableToday;
        return checkDay(d.schedule, selectedDay);
      });
    }

    if (doctorSearchTerm.trim()) {
      const search = doctorSearchTerm.toLowerCase().trim();
      list = list.filter(d => d.name.toLowerCase().includes(search));
    }

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      list = list.filter(d => {
        const docName = d.name.toLowerCase();
        const docSpecialty = d.specialty.toLowerCase();
        const docDegree = (d.degree || '').toLowerCase();
        const docClinics = d.clinics || [];
        const hospitalMatch = hospitals.some(h => docClinics.includes(h.id) && h.name.toLowerCase().includes(search));
        
        // Match by specialty synonyms and Bengali names (e.g. matching "অর্থোপেডিক", "অর্থপেডিক", "ortho" as Orthopedics)
        const specialtyObj = SPECIALTIES.find(spec => spec.name.toLowerCase() === docSpecialty || spec.id === docSpecialty);
        
        // Define specialty keyword associations for robust search (bidirectional matching)
        const specialtyKeywordsMap: Record<string, string[]> = {
          orthopedics: ['ortho', 'orthopedics', 'অর্থোপেডিক', 'অর্থোপেডিক্স', 'অর্থোপেডিকস', 'অর্থপেডিক', 'অর্থপেডিক্স', 'অর্থপেডিকস', 'হাড়', 'হাড়', 'পঙ্গু'],
          medicine: ['medicine', 'মেডিসিন', 'মেডিসন', 'মেডেসিন', 'এমেডিসিন'],
          cardiology: ['cardio', 'কার্ডিওলজি', 'কার্ডিও', 'হৃদরোগ', 'হার্ট', 'heart'],
          neuromedicine: ['neuro', 'নিউরো', 'নিউরোলজি', 'মস্তিষ্ক', 'স্ট্রোক', 'brain'],
          gynecology: ['gyn', 'গাইনী', 'গাইনি', 'গাইনোকোলজি', 'গর্ভবতী', 'গর্ভ', 'প্রসূতি', 'obstetrics', 'obs'],
          pediatrics: ['pediatr', 'শিশু', 'নবজাতক', 'কিশোর', 'child', 'baby'],
          surgery: ['surgeon', 'সার্জারি', 'সার্জারী', 'অপারেশন', 'surgery'],
          urology: ['uro', 'ইউরোলজি', 'ইউরোলজিস্ট', 'মূত্র', 'bladder'],
          endocrinology: ['endocrine', 'ডায়াবেটিস', 'হরমোন', 'diabetes', 'hormone'],
          ent: ['ent', 'নাক', 'কান', 'গলা', 'nose', 'ear', 'throat'],
          dermatology: ['derm', 'চর্ম', 'যৌন', 'স্কিন', 'skin', 'এলার্জি'],
          ophthalmology: ['eye', 'চোখ', 'চক্ষু', 'দৃষ্টি', 'ophthal'],
          psychiatry: ['psych', 'মানসিক', 'মন', 'পাগল', 'বিষন্নতা'],
          dentistry: ['dent', 'দাঁত', 'দন্ত', 'ডেন্টাল', 'tooth', 'teeth'],
          gastroenterology: ['gastro', 'লিভার', 'পরিপাকতন্ত্র', 'গ্যাস্ট্রিক', 'পেট', 'liver', 'stomach'],
          nephrology: ['nephro', 'কিডনি', 'নেফ্রোলজি', 'renal', 'kidney'],
          oncology: ['onco', 'ক্যান্সার', 'টিউমার', 'cancer', 'tumor'],
          hematology: ['hemato', 'রক্তরোগ', 'রক্ত', 'blood'],
          'physical-medicine': ['physical', 'ফিজিকেল', 'ব্যায়াম', 'থেরাপি', 'ফিজিওথেরাপি', 'physio']
        };

        const listKeywords = specialtyKeywordsMap[docSpecialty] || [];
        const specialtyMatch = (specialtyObj && (
          specialtyObj.name.toLowerCase().includes(search) ||
          specialtyObj.bnName.toLowerCase().includes(search)
        )) || listKeywords.some(kw => search.includes(kw) || kw.includes(search));
        
        return docName.includes(search) || 
               docSpecialty.includes(search) || 
               docDegree.includes(search) || 
               hospitalMatch || 
               specialtyMatch;
      });
    }

    // Deduplicate by Name + Degree to fix data consistency issues
    const uniqueMap = new Map();
    list.forEach(d => {
      const key = `${d.name}-${d.degree}`.toLowerCase().trim();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, d);
      } else {
        const existing = uniqueMap.get(key);
        // Merge clinics if duplicate entry found
        existing.clinics = Array.from(new Set([...(existing.clinics || []), ...(d.clinics || [])]));
      }
    });

    return Array.from(uniqueMap.values());
  }, [searchTerm, doctorSearchTerm, selectedHospitalId, selectedSpecialty, selectedDay, doctors, hospitals]);

  const filteredLabTests = useMemo(() => {
    return labTests.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, labTests]);

  const masterLogFiltered = useMemo(() => {
    return allPrescriptions.filter(p => 
      p.patient_name.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
      p.doctor_name.toLowerCase().includes(adminSearchTerm.toLowerCase())
    );
  }, [allPrescriptions, adminSearchTerm]);

  // --- Data Management Functions ---
  const handleSaveData = async (type: 'doctor' | 'hospital' | 'lab_test', item: any) => {
    if (!user || profile?.role !== UserRole.ADMIN) {
      alert("অ্যাডমিন পারমিশন নেই।");
      return;
    }
    setIsProcessing(true);
    try {
      const collectionName = type === 'doctor' ? 'doctors' : type === 'hospital' ? 'hospitals' : 'lab_tests';
      await setDoc(doc(db, collectionName, item.id), item, { merge: true });
      
      alert('সফলভাবে সেভ হয়েছে!');
      setShowAddModal(false);
      setEditingItem(null);
      await fetchData();
    } catch (err: any) {
      console.error("Save Error:", err);
      alert('সেভ করা যায়নি। এরর: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const seedDatabase = useCallback(async () => {
    if (!user || !isAdmin || !confirm('এটি আপনার ফায়ারবেস অ্যাকাউন্টে প্রাথমিক ডেটা যোগ করবে। আপনি কি নিশ্চিত?')) return;
    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      
      DOCTORS.forEach(d => batch.set(doc(db, 'doctors', d.id), d));
      CLINICS.forEach(c => batch.set(doc(db, 'hospitals', c.id), c));
      LAB_TESTS.forEach(t => batch.set(doc(db, 'lab_tests', t.id), t));
      
      await batch.commit();
      alert('ডেটাবেস সফলভাবে সিড হয়েছে!');
      await fetchData();
    } catch (err: any) {
      alert('সিড করা যায়নি। এরর: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  }, [user, profile, fetchData]);

  useEffect(() => {
    if (user && isAdmin) {
      (window as any).seedDatabase = seedDatabase;
    }
  }, [seedDatabase, user, isAdmin]);

  const handleDeleteData = async (type: 'doctor' | 'hospital' | 'lab_test', id: string) => {
    if (!user || profile?.role !== UserRole.ADMIN) {
      alert("অ্যাডমিন পারমিশন নেই।");
      return;
    }
    
    // Using a simpler confirm or just proceeding if confirm is unreliable in iframes
    if (!window.confirm('আপনি কি নিশ্চিত যে এটি ডিলিট করতে চান?')) return;

    setIsProcessing(true);
    try {
      const collectionName = type === 'doctor' ? 'doctors' : type === 'hospital' ? 'hospitals' : 'lab_tests';
      await deleteDoc(doc(db, collectionName, id));
      alert('সফলভাবে ডিলিট হয়েছে!');
      await fetchData();
    } catch (err: any) {
      console.error("Delete Error:", err);
      alert('ডিলিট করা যায়নি। এরর: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Update ticker message in database ---
  const updateTicker = async () => {
    if (!user || !isAdmin) return;
    setIsProcessing(true);
    try {
      await setDoc(doc(db, 'settings', 'ticker_message'), { key: 'ticker_message', value: tickerMessage });
      alert('Ticker সফলভাবে আপডেট হয়েছে!');
    } catch (err: any) {
      console.error(err);
      alert('Ticker আপডেট করা যায়নি।');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBookingSuccess = () => {
    if (profile?.role === UserRole.ADMIN) {
      fetchAdminData();
    } else {
      fetchUserData();
    }
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse uppercase tracking-[0.3em]">Nilpha...</div>;

  const HOTLINE_CONTACT = "01352669100";
  const YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@DoctorM-c9k";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none overflow-x-hidden">
      <SecurityGuard />
      <SEO 
        title="Nilpha | নীলফামারীর সেরা ডাক্তারদের তালিকা ও অ্যাপয়েন্টমেন্ট - Nilphamari's #1 Medical Directory"
        description="নীলফামারী জেলার বিশেষজ্ঞ ডাক্তারদের তালিকা, চেম্বারের ঠিকানা ও সিরিয়াল নিশ্চিত করতে Nilpha.com-এ ভিজিট করুন। ডক্টর কুটুম নীলফামারী সহ সকল হাসপাতালের ডাক্তারদের তথ্য এখানে পাবেন।"
        keywords={['Nilpha', 'Nilphamari Doctor', 'Doctor Appointment', 'নীলফামারী ডাক্তার', 'ডক্টর কুটুম', 'ডাক্তার অ্যাপয়েন্টমেন্ট', 'Nilphamari Medical Directory', 'Nilpha.com']}
      />

      <BookingModal 
        isOpen={!!bookingDoctor} 
        onClose={() => setBookingDoctor(null)} 
        doctorName={bookingDoctor?.name || ''} 
        doctorSpecialty={bookingDoctor?.specialty || ''} 
        hotline={HOTLINE_CONTACT} 
        onSuccess={handleBookingSuccess}
      />

      <Routes>
        {/* Dynamic Landing Pages */}
        <Route path="/doctors/:slug" element={<DoctorProfilePage />} />
        <Route path="/hospitals/:slug" element={<ClinicLandingPage />} />
        <Route path="/specialists/:slug" element={<SpecialistLandingPage />} />
        <Route path="/districts/:slug" element={<DistrictLandingPage />} />

        {/* Main App Experience */}
        <Route path="*" element={
          isAdmin ? (
             <AdminDashboard 
              profile={profile!} 
              onLogout={logout} 
              ticker={tickerMessage} 
              setTicker={setTickerMessage} 
              onUpdateTicker={updateTicker}
              doctors={doctors}
              hospitals={hospitals}
              labTests={labTests}
              orders={allOrders}
              profiles={allProfiles}
              appointments={allAppointments}
              onAdd={(type) => {
                setAdminDataTab(type === 'doctor' ? 'doctors' : type === 'hospital' ? 'hospitals' : 'tests');
                setEditingItem({});
                setTempImage(null);
                setShowAddModal(true);
              }}
              onEdit={(type, item) => {
                setAdminDataTab(type === 'doctor' ? 'doctors' : type === 'hospital' ? 'hospitals' : 'tests');
                setEditingItem(item);
                setTempImage(item.image || null);
                setShowAddModal(true);
              }}
              onDelete={handleDeleteData}
              onRefreshAdminData={fetchAdminData}
              onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
            />
          ) : (
            <>
              <AnimatePresence>
                {showLanding && (
                  <LandingPage onStart={() => {
                    setShowLanding(false);
                    sessionStorage.setItem('jb_landing_seen', 'true');
                  }} />
                )}
              </AnimatePresence>

              {/* Ticker */}
              <div className="bg-red-600 text-white py-3 overflow-hidden whitespace-nowrap z-50 shadow-md border-b-2 border-red-700">
                <div className="animate-marquee inline-block pl-[100%] font-black text-sm uppercase tracking-wider">
                  {tickerMessage} • ইমারজেন্সি হেল্পলাইন: {HOTLINE_CONTACT} • 
                </div>
              </div>

              <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-6 py-4 border-b flex justify-between items-center shadow-sm">
                <h1 className="text-xl font-black text-slate-800 tracking-tight cursor-pointer" onClick={() => { setActiveTab('home'); setHomeSubCategory('doctors'); setSelectedHospitalId(null); setSelectedSpecialty(null); navigate('/'); }}>
                  <span className="text-blue-600">Nil</span>pha
                </h1>
                <div className="flex gap-2 items-center">
                   <a 
                     href={YOUTUBE_CHANNEL_URL} 
                     target="_blank" 
                     rel="noopener noreferrer" 
                     className="w-9 h-9 bg-red-50 hover:bg-red-100 rounded-full flex items-center justify-center text-red-600 border-2 border-red-100 active:scale-90 transition-all cursor-pointer" 
                     title="ইউটিউব চ্যানেল (টিউটোরিয়াল ও নিয়মাবলী)"
                   >
                     <Youtube size={16} />
                   </a>
                   <button onClick={handleShare} className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 border-2 border-slate-50 active:scale-90 transition-all" title="Share App">
                     <Share2 size={16} />
                   </button>
                   {user ? (
                     <button onClick={() => { setActiveTab('profile'); navigate('/'); }} className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-[11px] font-black border-2 border-blue-50">
                       {profile?.full_name?.[0].toUpperCase() || '👤'}
                     </button>
                   ) : (
                     <button onClick={() => setShowAuthModal(true)} className="text-[10px] font-black uppercase bg-blue-600 text-white px-4 py-2 rounded-xl">লগিন</button>
                   )}
                </div>
              </header>

              <main className="flex-1 p-6 mobile-p-safe space-y-8 overflow-y-auto no-scrollbar pb-32">
                {activeTab === 'home' && (
                  <div className="space-y-8 animate-in fade-in">
                    {/* Promo Banner */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 rounded-[28px] text-white shadow-lg relative overflow-hidden">
                       <div className="relative z-10 flex items-center gap-4">
                         <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shrink-0">
                            <Percent size={20} className="text-white" />
                         </div>
                         <p className="text-[11px] font-bold leading-tight">
                           অ্যাপস বা ওয়েব সাইটের মাধ্যমে রোগীর সিরিয়াল দিলে সকল পরীক্ষা-নিরীক্ষায় ২০ % পর্যন্ত ডিসকাউন্ট।
                         </p>
                       </div>
                       <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    </div>

                    {/* WhatsApp & Call Inquiry Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button 
                        onClick={() => window.open(`https://wa.me/88${HOTLINE_CONTACT}?text=Hello,%20I%20want%20to%20know%20more%20about%20doctors`, '_blank')}
                        className="flex-[2] bg-emerald-500 hover:bg-emerald-600 text-white p-5 rounded-[32px] font-black text-[12px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 border-b-4 border-emerald-700 cursor-pointer"
                      >
                        <span className="text-xl">💬</span> ডাক্তার সম্পর্কিত জানতে whatsapp এ যোগাযোগ করুন
                      </button>
                      <a 
                        href={`tel:${HOTLINE_CONTACT}`}
                        className="flex-1 bg-sky-600 hover:bg-sky-700 text-white p-5 rounded-[32px] font-black text-[12px] uppercase tracking-widest shadow-xl shadow-sky-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 border-b-4 border-sky-800 text-center cursor-pointer"
                      >
                        <span className="text-xl">📞</span> কল করুন
                      </a>
                    </div>

                    {/* YouTube Channel Video Guide Card */}
                    <a 
                      href={YOUTUBE_CHANNEL_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-red-600 hover:bg-red-700 text-white p-5 rounded-[32px] font-black text-[12px] uppercase tracking-widest shadow-xl shadow-red-500/10 active:scale-95 transition-all text-center border-b-4 border-red-800"
                    >
                      <div className="flex items-center justify-center gap-3">
                        <Youtube size={18} className="fill-white" />
                        <span>ব্যবহারের নিয়ম-কানুন ও ভিডিও গাইড (YouTube)</span>
                      </div>
                    </a>

                    <div className="space-y-4">
                      <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                        আমাদের সেবাসমূহ
                      </h2>
                      {/* Category Menu */}
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'doctors', icon: '👨‍⚕️', label: 'ডক্টর' },
                          { id: 'hospitals', icon: '🏥', label: 'হাসপাতাল' },
                          { id: 'emergency', icon: '🆘', label: 'SOS সেবা' }
                        ].map(cat => (
                          <button 
                            key={cat.id} 
                            onClick={() => { 
                              setHomeSubCategory(cat.id as any); 
                              setSelectedHospitalId(null); 
                              setSearchTerm(''); 
                              setSelectedSpecialty(null);
                              setSelectedDay(null);
                            }}
                            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all ${homeSubCategory === cat.id ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-white text-slate-400 border border-slate-50'}`}
                          >
                            <span className="text-xl">{cat.icon}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-center">{cat.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Today's Doctors Banner */}
                    <TodaysDoctorsBanner doctors={doctors} />

                    <div className="space-y-6">
                       <div className="flex justify-between items-center bg-slate-100/50 p-2 rounded-2xl">
                          <h2 className="text-[11px] font-black text-slate-800 uppercase ml-2 tracking-wide">
                            {homeSubCategory === 'doctors' 
                              ? (selectedHospitalId 
                                  ? hospitals.find(h => h.id === selectedHospitalId)?.name 
                                  : 'বিশেষজ্ঞ ডক্টর') 
                              : (homeSubCategory === 'hospitals' ? 'হাসপাতাল লিস্ট' : homeSubCategory === 'labtests' ? 'ল্যাব টেস্ট' : 'জরুরি SOS সেবা')}
                          </h2>
                          <div className="relative">
                            <input 
                              type="text" 
                              placeholder="খুঁজুন..." 
                              value={searchTerm} 
                              onChange={(e) => setSearchTerm(sanitizeInput(e.target.value))} 
                              className="bg-white border-none rounded-xl py-2 px-3 text-[10px] font-bold outline-none w-36 shadow-sm" 
                            />
                            <span className="absolute right-2 top-2 text-slate-300 text-[10px]">🔍</span>
                          </div>
                       </div>

                       {homeSubCategory === 'doctors' && (
                         <div className="space-y-6">
                            {/* Day Filter Bar */}
                            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                                {[
                                  { id: 'all', label: 'All' },
                                   { id: 'শনিবার', label: 'শনিবার' },
                                  { id: 'রবিবার', label: 'রবিবার' },
                                  { id: 'সোমবার', label: 'সোমবার' },
                                  { id: 'মঙ্গলবার', label: 'মঙ্গলবার' },
                                  { id: 'বুধবার', label: 'বুধবার' },
                                  { id: 'বৃহস্পতিবার', label: 'বৃহস্পতিবার' },
                                  { id: 'শুক্রবার', label: 'শুক্রবার' },
                                ].map(day => (
                                  <button
                                    key={day.id}
                                    onClick={() => day.id === 'all' ? setSelectedDay(null) : setSelectedDay(selectedDay === day.id ? null : day.id)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-tight whitespace-nowrap transition-all border-2 ${(day.id === 'all' ? selectedDay === null : selectedDay === day.id) ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' : 'bg-white text-slate-400 border-slate-50'}`}
                                  >
                                    {day.label}
                                  </button>
                                ))}
                            </div>

                            {/* Specialty Bar */}
                            <div className="relative w-full group">
                                <div 
                                  ref={specialtyScrollRef}
                                  className="flex gap-4 overflow-x-auto no-scrollbar pb-3 px-1 scroll-smooth cursor-grab active:cursor-grabbing"
                                >
                                    <button 
                                        onClick={() => setSelectedSpecialty(null)}
                                        className={`flex flex-col items-center gap-2 min-w-[75px] transition-all duration-300 ${selectedSpecialty === null ? 'scale-110 active:scale-100' : 'opacity-40 hover:opacity-100'}`}
                                    >
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-xl transition-all border-2 ${selectedSpecialty === null ? 'bg-blue-600 text-white border-blue-400' : 'bg-white border-slate-100'}`}>✨</div>
                                        <span className={`text-[9px] font-black uppercase tracking-tighter text-center ${selectedSpecialty === null ? 'text-blue-600' : 'text-slate-400'}`}>All Docs</span>
                                    </button>
                                    {SPECIALTIES.map(spec => (
                                        <button 
                                            key={spec.id}
                                            onClick={() => setSelectedSpecialty(spec.name)}
                                            className={`flex flex-col items-center gap-2 min-w-[75px] transition-all duration-300 ${selectedSpecialty === spec.name ? 'scale-110 active:scale-100' : 'opacity-40 hover:opacity-100'}`}
                                        >
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-xl transition-all border-2 ${selectedSpecialty === spec.name ? 'bg-blue-600 text-white border-blue-400' : 'bg-white border-slate-100'}`}>{spec.icon}</div>
                                            <div className="flex flex-col items-center">
                                              <span className={`text-[11px] font-black uppercase tracking-tight text-center leading-none ${selectedSpecialty === spec.name ? 'text-blue-600' : 'text-slate-900 border-b-2 border-transparent'}`}>{spec.name}</span>
                                              <span className={`text-[10px] font-black text-center leading-none mt-2 ${selectedSpecialty === spec.name ? 'text-blue-500' : 'text-slate-700'}`}>{spec.bnName}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <div className="absolute top-0 right-0 h-14 w-12 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none group-hover:opacity-0 transition-opacity"></div>
                            </div>

                            <div className="space-y-4">
                               {filteredDoctors.map(d => (
                                 <Card 
                                  key={d.id} 
                                  onClick={() => navigate(`/doctors/${slugify(d.name)}`)}
                                  className="flex items-start gap-4 border-l-4 border-l-blue-600 hover:border-l-8 hover:shadow-lg transition-all cursor-pointer group relative p-5"
                                 >
                                   <img src={d.image} className="w-20 h-24 rounded-2xl object-cover border bg-slate-50 shadow-sm" alt={d.name} />
                                   <div className="flex-1 space-y-1">
                                      <h4 className="font-black text-[15px] text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">{d.name}</h4>
                                      <p className="text-[10px] text-blue-600 font-black uppercase tracking-wider">{d.specialty}</p>
                                      <p className="text-[9px] text-slate-400 font-bold leading-tight line-clamp-2 italic">{d.degree}</p>
                                      
                                      <div className="pt-2 border-t border-slate-50 mt-2 space-y-1.5">
                                         <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase">
                                            <MapPin size={10} className="text-blue-500" />
                                            {selectedHospitalId 
                                               ? (CLINICS.find(c => c.id === selectedHospitalId)?.name || 'চেম্বার')
                                               : (d.clinics.map(cid => CLINICS.find(c => c.id === cid)?.name).filter(Boolean).join(' • ') || 'চেম্বার')
                                            }
                                         </div>
                                         <div className="flex items-center gap-1.5 text-[9px] font-black text-rose-500 uppercase">
                                            <Clock size={10} />
                                            {d.schedule}
                                         </div>
                                      </div>
                                   </div>
                                   <div className="flex flex-col gap-2 shrink-0">
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setBookingDoctor(d);
                                          setShowSerialModal(true);
                                        }}
                                        className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-tight shadow-md shadow-emerald-100 flex items-center gap-1.5 hover:bg-emerald-700 active:scale-95 transition-all"
                                      >
                                        <MessageSquare size={10} /> সিরিয়াল দিন
                                      </button>
                                      <a 
                                        href={`tel:${HOTLINE_CONTACT}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="bg-blue-600 text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-tight shadow-md shadow-blue-100 flex items-center gap-1.5 hover:bg-blue-700 active:scale-95 transition-all"
                                      >
                                        <Phone size={10} /> কল করুন
                                      </a>
                                   </div>
                                   {d.availableToday && (
                                     <div className="absolute top-4 right-4">
                                        <span className="flex h-2 w-2 relative">
                                           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                           <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                      </div>
                                   )}
                                 </Card>
                               ))}
                            </div>
                         </div>
                       )}

                       {homeSubCategory === 'hospitals' && (
                         <div className="space-y-4">
                            {hospitals.map(c => (
                              <Card key={c.id} className="p-0 overflow-hidden relative cursor-pointer group shadow-lg" onClick={() => { 
                                setSelectedHospitalId(c.id); 
                                setHomeSubCategory('doctors'); 
                                setSearchTerm('');
                                setSelectedSpecialty(null);
                                setSelectedDay(null);
                              }}>
                                 <img src={c.image} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500" alt={c.name} />
                                 <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-6 text-white">
                                    <div className="flex justify-between items-end">
                                      <div>
                                        <h4 className="font-black text-base uppercase tracking-tight">{c.name}</h4>
                                        <p className="text-[10px] font-bold uppercase opacity-80 mt-1">{c.address}</p>
                                      </div>
                                      <div className="bg-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                                        View Doctors <ArrowRight size={12} />
                                      </div>
                                    </div>
                                 </div>
                                 <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black text-white border border-white/20" onClick={(e) => { e.stopPropagation(); navigate(`/hospitals/${slugify(c.name)}`); }}>
                                   Full Profile
                                 </div>
                              </Card>
                            ))}
                         </div>
                       )}
                    </div>
                  </div>
                )}

                {activeTab === 'profile' && (
                  <div className="animate-in slide-in-from-bottom-5 space-y-6">
                    {/* Simplified Profile View */}
                    <Card className="flex items-center gap-5 py-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-none text-left">
                       <div className="w-16 h-16 bg-blue-600 rounded-[22px] flex items-center justify-center text-white text-3xl font-black">
                         {profile?.full_name?.[0] || '👤'}
                       </div>
                       <div>
                          <h4 className="font-black text-xl text-slate-800 tracking-tight">{profile?.full_name}</h4>
                          <p className="text-[10px] text-blue-600 uppercase font-black tracking-widest opacity-60">
                            {profile?.role === UserRole.RURAL_DOCTOR ? 'পল্লী চিকিৎসক (Rural Doctor)' : profile?.role || 'পেশেন্ট'}
                          </p>
                          {profile?.phone && <p className="text-[11px] text-slate-500 font-bold mt-1">📱 {profile.phone}</p>}
                       </div>
                    </Card>

                    {/* Rural Doctor Section */}
                    {profile?.role === UserRole.RURAL_DOCTOR && (
                      <div className="space-y-6 text-left">
                        {/* Stats cards Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-100 p-3 rounded-[20px] text-center flex flex-col justify-center">
                            <p className="text-[8px] font-black text-blue-500 uppercase tracking-wider mb-0.5">রেফারেল কোড</p>
                            <p className="text-sm font-black text-blue-900 tracking-wider uppercase">{profile.referral_code}</p>
                          </div>
                          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 p-3 rounded-[20px] text-center flex flex-col justify-center">
                            <p className="text-[8px] font-black text-indigo-600 uppercase tracking-wider mb-0.5">নিবন্ধিত রোগী</p>
                            <p className="text-sm font-black text-indigo-950">{referredPatients.length} জন</p>
                          </div>
                          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-3 rounded-[20px] text-center flex flex-col justify-center">
                            <p className="text-[8px] font-black text-amber-600 uppercase tracking-wider mb-0.5">রোগীর সিরিয়াল</p>
                            <p className="text-sm font-black text-amber-950">{referredAppointments.length} বার</p>
                          </div>
                          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-3 rounded-[20px] text-center flex flex-col justify-center">
                            <p className="text-[8px] font-black text-emerald-600 uppercase tracking-wider mb-0.5">ডাক্তার দেখিয়েছেন</p>
                            <p className="text-sm font-black text-emerald-950">
                              {referredAppointments.filter(app => app.status === 'visited').length} জন
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-rose-50 to-red-50 border border-rose-100 p-3 rounded-[20px] text-center flex flex-col justify-center col-span-2 sm:col-span-1">
                            <p className="text-[8px] font-black text-rose-600 uppercase tracking-wider mb-0.5">আসেননি / রিজেক্ট</p>
                            <p className="text-sm font-black text-rose-950">
                              {referredAppointments.filter(app => app.status === 'absent').length} জন
                            </p>
                          </div>
                        </div>

                        {/* Register patient button triggers logout & register prefills */}
                        <button 
                          onClick={async () => {
                            const rCode = profile.referral_code;
                            await logout();
                            setAuthMode('register');
                            localStorage.setItem('prefilled_referral_code', rCode);
                            setShowAuthModal(true);
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-3xl font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 active:scale-95 transition-all text-center"
                        >
                          ➕ নতুন রোগী রেজিষ্ট্রেশন করুন
                        </button>

                        {/* Registered Patients List */}
                        <div className="space-y-4">
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-extrabold">আপনার নিবন্ধিত রোগী তালিকা ({referredPatients.length})</h3>
                          {referredPatients.length === 0 ? (
                            <p className="text-[10px] text-slate-400 font-extrabold uppercase italic">আপনার কোড ব্যবহার করে রেজিষ্ট্রেশন করা রোগীর সংখ্যা শূন্য।</p>
                          ) : (
                            <div className="space-y-2">
                              {referredPatients.map((p, idx) => (
                                <Card key={p.id || idx} className="bg-white p-4 rounded-2xl flex justify-between items-center border border-slate-100 shadow-sm">
                                  <div>
                                    <h4 className="font-extrabold text-[13px] text-slate-800">{p.full_name}</h4>
                                    <p className="text-[10px] text-slate-500 font-bold">📱 {p.phone}</p>
                                    {p.created_password && (
                                      <p className="text-[10px] text-indigo-600 font-bold mt-1">🔑 পাসওয়ার্ড: <span className="font-mono bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-700">{p.created_password}</span></p>
                                    )}
                                  </div>
                                  <span className="text-[8px] font-black tracking-widest bg-slate-100 text-slate-500 uppercase px-2 py-1 rounded-xl">
                                    নথিভূক্ত
                                  </span>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Referred Patients Appointment Serials list */}
                        <div className="space-y-4 pt-4 border-t border-slate-100">
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-extrabold flex items-center justify-between">
                            <span>রোগীদের বুক করা সিরিয়ালসমূহ ({referredAppointments.length})</span>
                            <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Serials</span>
                          </h3>
                          {referredAppointments.length === 0 ? (
                            <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 text-center">
                              <p className="text-[10px] text-slate-400 font-extrabold uppercase italic">আপনার কোনো রোগী এখনও সিরিয়াল বুকিং করেনি।</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {referredAppointments.map((app, idx) => (
                                <Card key={app.id || idx} className="border-l-4 border-l-blue-500 bg-white p-4 rounded-2xl space-y-2 text-left shadow-sm animate-in fade-in zoom-in-95 duration-200">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-extrabold text-[12px] text-slate-800 leading-tight">👨‍⚕️ {app.doctor_name}</h4>
                                      <p className="text-[9px] text-blue-600 font-bold uppercase tracking-wider mt-0.5">{app.doctor_specialty}</p>
                                    </div>
                                    <span className={`text-[8px] font-black px-2 py-1 rounded-xl uppercase tracking-wider ${
                                      app.status === 'visited'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                        : app.status === 'absent'
                                          ? 'bg-rose-50 text-rose-700 border border-rose-100'
                                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                                    }`}>
                                      {app.status === 'visited' ? 'ডাক্তার দেখিয়েছেন' : app.status === 'absent' ? 'আসেননি/ক্যান্সেল' : 'পেন্ডিং'}
                                    </span>
                                  </div>
                                  <div className="text-[10px] font-bold text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <p className="text-slate-700 font-semibold">👤 রোগীর নাম: <span className="font-extrabold text-slate-900">{app.patient_name}</span></p>
                                    <p>📱 ফোন নম্বর: <span className="font-mono">{app.patient_phone}</span></p>
                                    <p>📅 দেখানোর তারিখ: {app.date}</p>
                                    {app.problems && <p>🩺 সমস্যা: <span className="font-medium text-slate-500 italic">"{app.problems}"</span></p>}
                                  </div>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Patient Appointments History Section */}
                    {profile?.role === UserRole.PATIENT && (
                      <div className="space-y-4 text-left">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-extrabold">আপনার বুক করা অ্যাপয়েন্টমেন্টসমূহ ({userAppointments.length})</h3>
                        {userAppointments.length === 0 ? (
                          <div className="bg-white p-8 rounded-[32px] border border-slate-100 text-center space-y-2">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-relaxed">কোনো অ্যাপয়েন্টমেন্ট হিস্ট্রি নেই</p>
                            <p className="text-[9px] text-slate-400 max-w-xs mx-auto">ডাক্তারের তালিকা থেকে সিরিয়াল দিলে তার ইতিহাস এখানে দেখতে পাবেন।</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {userAppointments.map((app) => (
                              <Card key={app.id} className="border-l-4 border-l-emerald-500 bg-white p-5 rounded-3xl space-y-3 text-left shadow-sm">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-extrabold text-sm text-slate-800 leading-tight">{app.doctor_name}</h4>
                                    <p className="text-[9px] text-blue-600 font-bold uppercase tracking-wider mt-0.5">{app.doctor_specialty}</p>
                                  </div>
                                  <span className={`text-[8px] font-black px-2 py-1 rounded-xl uppercase tracking-wider ${
                                    app.status === 'visited'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : app.status === 'absent'
                                        ? 'bg-rose-100 text-rose-800'
                                        : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {app.status === 'visited' ? 'ডাক্তার দেখিয়েছেন' : app.status === 'absent' ? 'আসেননি/ক্যান্সেল' : 'পেন্ডিং'}
                                  </span>
                                </div>
                                <div className="text-[10px] font-bold text-slate-500 space-y-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                   <p>📅 তারিখ: {app.date}</p>
                                   <p>👤 রোগী: {app.patient_name} ({app.patient_phone})</p>
                                   {app.problems && <p>🩺 সমস্যা: {app.problems}</p>}
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-4 pt-4">
                      <Button onClick={handleShare} variant="primary" className="w-full py-4 rounded-[28px]"><Share2 size={20} /> Share Nilpha</Button>
                      <Button onClick={logout} variant="secondary" className="w-full py-4 rounded-[28px] text-red-500">Logout</Button>
                    </div>
                  </div>
                )}

                {activeTab === 'orders' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Recent Orders</h2>
                    {allOrders.map(order => (
                      <Card key={order.id} className="border-l-4 border-l-amber-500">
                        <h4 className="text-[12px] font-black text-slate-800">{order.item_name}</h4>
                        <Badge status={order.status} />
                      </Card>
                    ))}
                  </div>
                )}
              </main>

              {profile?.role !== UserRole.ADMIN && (
                <nav className="fixed bottom-6 left-6 right-6 z-50 bg-slate-900/95 backdrop-blur-2xl flex justify-around items-center py-5 rounded-[40px] shadow-2xl border border-white/10 overflow-hidden">
                  <button onClick={() => { setActiveTab('home'); navigate('/'); }} className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'home' ? 'text-blue-400 scale-125' : 'text-slate-500 opacity-60'}`}>
                    <span className="text-2xl">🏠</span>
                    <span className="text-[8px] font-black uppercase tracking-[0.2em]">Home</span>
                  </button>
                  <button onClick={() => { setActiveTab('orders'); navigate('/'); }} className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'orders' ? 'text-yellow-400 scale-125' : 'text-slate-500 opacity-60'}`}>
                    <span className="text-2xl">📜</span>
                    <span className="text-[8px] font-black uppercase tracking-[0.2em]">Orders</span>
                  </button>
                  <button onClick={() => { setActiveTab('profile'); navigate('/'); }} className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'profile' ? 'text-fuchsia-400 scale-125' : 'text-slate-500 opacity-60'}`}>
                    <span className="text-2xl">👤</span>
                    <span className="text-[8px] font-black uppercase tracking-[0.2em]">Profile</span>
                  </button>
                </nav>
              )}
            </>
          )
        } />
      </Routes>


      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        authMode={authMode}
        setAuthMode={setAuthMode}
        onSubmit={handleAuth}
        onGoogleLogin={handleGoogleLogin}
        isProcessing={isProcessing}
      />
    </div>
  );
}

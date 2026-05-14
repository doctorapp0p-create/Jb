
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { UserRole, Doctor, Clinic, Medicine, Order, Profile, Prescription, LabTest } from './types';
import { DOCTORS, CLINICS, MEDICINES, EMERGENCY_SERVICES, DISTRICTS, LAB_TESTS, SPECIALTIES } from './constants';
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
import { Share2, Bot, Video, Microscope, Ambulance, Star, ShieldCheck, Zap, MessageSquare, ArrowRight, X, Download, Smartphone, Stethoscope, Percent } from 'lucide-react';
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
              জেবি হেলথকেয়ার অ্যাপ
            </h3>
            
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-5">
              সব ফিচারের সেরা অভিজ্ঞতার জন্য আমাদের অফিসিয়াল অ্যাপটি আপনার ফোনে ইনস্টল করুন। 
            </p>
            
            <div className="space-y-3">
              <a 
                href="/downloads/jb-healthcare.apk" 
                download="jb-healthcare.apk"
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
  onAdd: (type: 'doctor' | 'hospital' | 'lab_test') => void,
  onEdit: (type: 'doctor' | 'hospital' | 'lab_test', item: any) => void,
  onDelete: (type: 'doctor' | 'hospital' | 'lab_test', id: string) => void
}> = ({ profile, onLogout, ticker, setTicker, onUpdateTicker, doctors, hospitals, labTests, orders, onAdd, onEdit, onDelete }) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'doctors' | 'orders' | 'hospitals' | 'labtests'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

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
          { id: 'doctors', label: 'Specialists', icon: <Stethoscope size={14} /> },
          { id: 'orders', label: 'Booking Orders', icon: <MessageSquare size={14} /> },
          { id: 'hospitals', label: 'Clinics', icon: <Microscope size={14} /> }
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
            <span className="text-blue-600">ডিজিটাল ডাক্তার</span>
          </h1>
          
          <p className="text-slate-500 text-[11px] font-medium leading-relaxed max-w-xs mx-auto">
            জেবি হেলথকেয়ারে আপনি পাচ্ছেন এআই ডাক্তার পরামর্শ, ভিডিও কনসাল্টেশন এবং জরুরি স্বাস্থ্যসেবা।
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
  const [tickerMessage, setTickerMessage] = useState('জেবি হেলথকেয়ারে আপনাকে স্বাগত! ডাক্তার চেম্বারে বসার সময় এবং ডাক্তার ফি চূড়ান্ত জানার জন্য আমাদের হট লাইন নাম্বারে যোগাযোগ করুন। যেকোনো প্রয়োজনে কল করুন: ০১৫১৮৩৯৫৭৭২');

  // Specialty Scroll Ref
  const specialtyScrollRef = useRef<HTMLDivElement>(null);

  // Specialist Filtering
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Multi-Order Cart State
  const [cart, setCart] = useState<{id: string, name: string, price: number, type: 'test' | 'emergency'}[]>([]);

  // Search States
  const [searchTerm, setSearchTerm] = useState('');
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

  const WHATSAPP_NUMBER = '8801518395772';

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

  const PAYMENT_NUMBERS = { bkash: '01518395772', nagad: '01846800973' };

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
          setTickerMessage(settingsSnap.data().value);
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
      
      const dbDoctors = docRes.docs.map(d => ({ id: d.id, ...d.data() } as Doctor));
      const dbHospitals = hospRes.docs.map(h => ({ id: h.id, ...h.data() } as Clinic));
      const dbTests = testRes.docs.map(t => ({ id: t.id, ...t.data() } as LabTest));

      // Use source of truth (DB) if it has data, otherwise fallback to constants for initial load
      setDoctors(dbDoctors.length > 0 ? dbDoctors : DOCTORS);
      setHospitals(dbHospitals.length > 0 ? dbHospitals : CLINICS);
      setLabTests(dbTests.length > 0 ? dbTests : LAB_TESTS);
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
      
      setAllProfiles(profRes.docs.map(d => ({ ...d.data() } as Profile)));
      setAllPrescriptions(presRes.docs.map(d => ({ id: d.id, ...d.data() } as Prescription)));
      setAllOrders(ordRes.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    } catch (error) {
      console.error("Admin fetch error:", error);
    }
  };

  const fetchUserData = async () => {
    if (!profile) return;
    try {
      const presQuery = query(
        collection(db, 'prescriptions'),
        where(profile.role === UserRole.DOCTOR ? 'doctor_id' : 'patient_id', '==', user.uid || user.id),
        orderBy('created_at', 'desc')
      );
      const ordersQuery = query(
        collection(db, 'orders'),
        where('user_id', '==', user.uid || user.id),
        orderBy('created_at', 'desc')
      );
      
      const [presSnap, ordSnap] = await Promise.all([
        getDocs(presQuery),
        getDocs(ordersQuery)
      ]);
      
      setAllPrescriptions(presSnap.docs.map(d => ({ id: d.id, ...d.data() } as Prescription)));
      setAllOrders(ordSnap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
    } catch (error) {
      console.error("User data fetch error:", error);
    }
  };

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsProcessing(true);
    const formData = new FormData(e.currentTarget);
    const emailVal = (formData.get('email') as string).trim();
    const passVal = formData.get('password') as string;

    try {
      if (authMode === 'moderator') {
        if ((emailVal === 'moderator' || emailVal === 'modaretor') && passVal === 'jagad01750') {
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
                phone: '01518395772' 
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
            modProf = { id: firebaseUser.uid, full_name: 'Main Moderator', role: UserRole.ADMIN, status: 'active', phone: '01518395772' };
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
        
        if (!fullName || !phone || !emailVal || !passVal) {
          throw new Error('দয়া করে সব তথ্য পূরণ করুন!');
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, emailVal, passVal);
        const { user: firebaseUser } = userCredential;
        
        await updateProfile(firebaseUser, { displayName: fullName });
        
        const newProf: Profile = { 
          id: firebaseUser.uid, 
          full_name: fullName, 
          phone, 
          role: UserRole.PATIENT, 
          status: 'active' 
        };
        
        await setDoc(doc(db, 'profiles', firebaseUser.uid), newProf);
        
        setUser(firebaseUser);
        setProfile(newProf);
        setShowAuthModal(false);
      }
    } catch (err: any) { 
      console.error("Auth Error Detail:", err);
      let msg = 'একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'ভুল ইমেইল বা পাসওয়ার্ড!';
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
    let list = doctors.map(d => {
      // Dynamic availability check for "availableToday"
      const bnDayNames = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
      const todayBn = bnDayNames[new Date().getDay()];
      
      const checkDay = (docSchedule: string, day: string) => {
        const sched = docSchedule.replace(/–/g, '-').replace(/থেকে/g, '-').replace(/\s/g, '');
        if (sched.includes('প্রতিদিন')) {
          if (sched.includes('শুক্রবন্ধ') && day === 'শুক্রবার') return false;
          return true;
        }
        
        const dayAlias: Record<string, string[]> = {
          'শনিবার': ['শনি'],
          'রবিবার': ['রবি'],
          'সোমবার': ['সোম'],
          'মঙ্গলবার': ['মঙ্গল'],
          'বুধবার': ['বুধ'],
          'বৃহস্পতিবার': ['বৃহস্পতি'],
          'শুক্রবার': ['শুক্র']
        };

        const aliases = dayAlias[day];
        if (!aliases) return false;
        const searchDay = aliases[0];

        if (sched.includes(searchDay)) return true;

        const parts = sched.split(':')[0].split('-');
        if (parts.length === 2) {
          const dayOrderList = ['শনি', 'রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র'];
          const startIdx = dayOrderList.findIndex(dName => parts[0].includes(dName));
          const endIdx = dayOrderList.findIndex(dName => parts[1].includes(dName));
          const currentIdx = dayOrderList.indexOf(searchDay);
          
          if (startIdx !== -1 && endIdx !== -1 && currentIdx !== -1) {
            if (startIdx <= endIdx) return currentIdx >= startIdx && currentIdx <= endIdx;
            return currentIdx >= startIdx || currentIdx <= endIdx;
          }
        }
        return false;
      };

      return {
        ...d,
        availableToday: checkDay(d.schedule, todayBn)
      };
    });

    if (selectedHospitalId) {
      list = list.filter(d => (d.clinics || []).includes(selectedHospitalId));
    }
    if (selectedSpecialty) list = list.filter(d => d.specialty.toLowerCase() === selectedSpecialty.toLowerCase());
    
    if (selectedDay) {
      list = list.filter(d => {
        const dayAlias: Record<string, string[]> = {
          'শনিবার': ['শনি'],
          'রবিবার': ['রবি'],
          'সোমবার': ['সোম'],
          'মঙ্গলবার': ['মঙ্গল'],
          'বুধবার': ['বুধ'],
          'বৃহস্পতিবার': ['বৃহস্পতি'],
          'শুক্রবার': ['শুক্র']
        };
        const sched = d.schedule.replace(/–/g, '-').replace(/থেকে/g, '-').replace(/\s/g, '');
        const aliasArr = dayAlias[selectedDay];
        if (!aliasArr) return false;
        const searchDay = aliasArr[0];

        if (sched.includes('প্রতিদিন')) {
          if (sched.includes('শুক্রবন্ধ') && selectedDay === 'শুক্রবার') return false;
          return true;
        }
        if (sched.includes(searchDay)) return true;

        const parts = sched.split(':')[0].split('-');
        if (parts.length === 2) {
          const dayOrderList = ['শনি', 'রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র'];
          const startIdx = dayOrderList.findIndex(dName => parts[0].includes(dName));
          const endIdx = dayOrderList.findIndex(dName => parts[1].includes(dName));
          const currentIdx = dayOrderList.indexOf(searchDay);
          
          if (startIdx !== -1 && endIdx !== -1 && currentIdx !== -1) {
            if (startIdx <= endIdx) return currentIdx >= startIdx && currentIdx <= endIdx;
            return currentIdx >= startIdx || currentIdx <= endIdx;
          }
        }
        return false;
      });
    }

    return list.filter(d => {
      const search = searchTerm.toLowerCase();
      const docName = d.name.toLowerCase();
      const docSpecialty = d.specialty.toLowerCase();
      const docClinics = d.clinics || [];
      const hospitalMatch = hospitals.some(h => docClinics.includes(h.id) && h.name.toLowerCase().includes(search));
      
      return docName.includes(search) || docSpecialty.includes(search) || hospitalMatch;
    });
  }, [searchTerm, selectedHospitalId, selectedSpecialty, selectedDay, doctors, hospitals]);

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

  if (isLoading) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse uppercase tracking-[0.3em]">JB Healthcare...</div>;

  return (
    <div className={profile?.role === UserRole.ADMIN ? "min-h-screen bg-slate-50 flex flex-col" : "min-h-screen bg-slate-50 flex flex-col relative overflow-hidden"}>
      
      {profile?.role === UserRole.ADMIN ? (
        <AdminDashboard 
          profile={profile} 
          onLogout={logout} 
          ticker={tickerMessage} 
          setTicker={setTickerMessage} 
          onUpdateTicker={updateTicker} 
          doctors={doctors}
          hospitals={hospitals}
          labTests={labTests}
          orders={allOrders}
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
              {tickerMessage} • ইমারজেন্সি হেল্পলাইন: ০১৫১৮৩৯৫৭৭২ • 
            </div>
          </div>

          <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md px-6 py-4 border-b flex justify-between items-center shadow-sm">
            <h1 className="text-xl font-black text-slate-800 tracking-tight cursor-pointer" onClick={() => { setActiveTab('home'); setHomeSubCategory('doctors'); setSelectedHospitalId(null); setSelectedSpecialty(null); }}>
              <span className="text-blue-600">JB</span> Healthcare
            </h1>
            <div className="flex gap-2 items-center">
               <button onClick={handleShare} className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 border-2 border-slate-50 active:scale-90 transition-all" title="Share App">
                 <Share2 size={16} />
               </button>
               {user ? (
                 <button onClick={logout} className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-[11px] font-black border-2 border-blue-50">
                   {profile?.full_name?.[0].toUpperCase() || '👤'}
                 </button>
               ) : (
                 <button onClick={() => setShowAuthModal(true)} className="text-[10px] font-black uppercase bg-blue-600 text-white px-4 py-2 rounded-xl">লগিন</button>
               )}
            </div>
          </header>

          <main className="flex-1 p-6 mobile-p-safe space-y-8 overflow-y-auto no-scrollbar">
        
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

            {/* WhatsApp Inquiry Button */}
            <button 
              onClick={() => window.open('https://wa.me/8801518395772?text=Hello,%20I%20want%20to%20know%20more%20about%20doctors', '_blank')}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white p-5 rounded-[32px] font-black text-[12px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 border-b-4 border-emerald-700"
            >
              <span className="text-xl">💬</span> ডাক্তার সম্পর্কিত জানতে whatsapp এ যোগাযোগ করুন
            </button>

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
                      onChange={(e) => setSearchTerm(e.target.value)} 
                      className="bg-white border-none rounded-xl py-2 px-3 text-[10px] font-bold outline-none w-36 shadow-sm" 
                    />
                    <span className="absolute right-2 top-2 text-slate-300 text-[10px]">🔍</span>
                  </div>
               </div>

               {homeSubCategory === 'doctors' && (
                 <div className="space-y-6">
                    {/* Video Consultation Section */}
                    {!selectedSpecialty && !selectedHospitalId && (
                      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[32px] text-white shadow-xl shadow-blue-500/20">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-sm font-black uppercase tracking-widest">Live Video Consultation</h3>
                          <span className="bg-white/20 px-3 py-1 rounded-full text-[8px] font-black uppercase">Online Now</span>
                        </div>
                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                          {doctors.filter(d => d.isVideoConsultant).map(vd => (
                            <div key={vd.id} className="min-w-[140px] bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex flex-col items-center text-center">
                              <img src={vd.image} className="w-14 h-14 rounded-full border-2 border-white/50 mb-2 object-cover" />
                              <p className="text-[10px] font-black leading-tight mb-1">{vd.name}</p>
                              <p className="text-[8px] opacity-70 mb-2">{vd.specialty}</p>
                              <button 
                                onClick={() => handleWhatsAppConsult(vd)}
                                className="bg-white text-blue-600 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase shadow-lg"
                              >
                                Call Now
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Specialty Bar - Modern On-Going / Draggable Design */}
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
                        {/* Decorative Gradient Fade */}
                        <div className="absolute top-0 right-0 h-14 w-12 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none group-hover:opacity-0 transition-opacity"></div>
                    </div>

                    {/* Day Filter Bar */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 px-1">
                      <button
                        onClick={() => setSelectedDay(null)}
                        className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black transition-all ${selectedDay === null ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-white text-slate-500 border border-slate-100'}`}
                      >
                        All
                      </button>
                      {['শনিবার', 'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার'].map(day => (
                        <button
                          key={day}
                          onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                          className={`whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black transition-all ${selectedDay === day ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-white text-slate-500 border border-slate-100'}`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-4 pb-36">
                       {filteredDoctors.length > 0 ? filteredDoctors.map(d => {
                         const hospital = hospitals.find(h => h.id === d.clinics[0]);
                         return (
                           <Card 
                            key={d.id} 
                            onClick={() => setSelectedDoctor(d)}
                            className="flex gap-4 items-center border-l-4 border-l-blue-600 hover:border-l-8 hover:shadow-lg transition-all cursor-pointer group"
                           >
                             <img src={d.image} className="w-20 h-20 rounded-3xl object-cover border bg-slate-50 shadow-sm" referrerPolicy="no-referrer" />
                             <div className="flex-1">
                               <div className="flex justify-between items-start">
                                  <h4 className="font-black text-[14px] text-slate-800 leading-tight">{d.name}</h4>
                                  <span className="text-[10px] font-bold bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">⭐ {d.rating}</span>
                               </div>
                               <p className="text-[10px] text-blue-600 font-black uppercase mt-1 tracking-wider">{d.specialty}</p>
                               <div className="flex flex-col gap-0.5 mt-1">
                                 <p className="text-[9px] text-slate-400 font-bold leading-snug italic">{d.degree}</p>
                                 <p className="text-[10px] text-slate-500 font-black flex items-center gap-1 mt-0.5">
                                   <span className="opacity-80">📍</span> {hospital?.name || 'চেম্বার'}
                                 </p>
                               </div>
                               <div className="mt-3 pt-3 border-t border-slate-50 space-y-4">
                                  <div className="flex justify-between items-center">
                                    <div className="flex flex-col">
                                      <span className="text-[9px] font-black text-emerald-600 flex items-center gap-1.5">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                          {d.schedule}
                                      </span>
                                      {d.consultationFee && <span className="text-[10px] font-black text-blue-600 mt-0.5">Fee: ৳{d.consultationFee}</span>}
                                    </div>
                                  </div>
                                  <button 
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       handleWhatsAppConsult(d);
                                     }}
                                     className="w-full text-[11px] bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-3.5 rounded-2xl font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                   >
                                     <span className="text-sm">📅</span> সিরিয়াল দিন
                                   </button>
                               </div>
                             </div>
                           </Card>
                         );
                       }) : (
                         <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-100 flex flex-col items-center">
                           <div className="text-5xl mb-4 animate-bounce">🧐</div>
                           <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">No Specialist Found</p>
                           <button onClick={() => setSelectedSpecialty(null)} className="bg-slate-100 text-[10px] font-black text-slate-600 px-6 py-3 rounded-2xl hover:bg-slate-200 transition-colors uppercase tracking-widest">Show All Doctors</button>
                         </div>
                       )}
                    </div>
                 </div>
               )}

               {homeSubCategory === 'hospitals' && (
                 <div className="space-y-4 pb-36">
                    {hospitals.filter(h => doctors.some(d => (d.clinics || []).includes(h.id))).map(c => (
                      <Card key={c.id} className="p-0 overflow-hidden relative cursor-pointer group" onClick={() => { setSelectedHospitalId(c.id); setHomeSubCategory('doctors'); }}>
                         <img src={c.image} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500" />
                         <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-6 text-white">
                            <h4 className="font-black text-base uppercase tracking-tight">{c.name}</h4>
                            <p className="text-[10px] font-bold uppercase opacity-80 mt-1">{c.address}</p>
                         </div>
                      </Card>
                    ))}
                 </div>
               )}

               {homeSubCategory === 'labtests' && (
                  <div className="grid grid-cols-1 gap-3 pb-36">
                    {filteredLabTests.length > 0 ? filteredLabTests.map(test => {
                      const isInCart = cart.find(i => i.id === test.id);
                      return (
                        <Card 
                          key={test.id} 
                          className={`flex justify-between items-center border-l-4 transition-all ${isInCart ? 'border-l-blue-600 bg-blue-50/50' : 'border-l-slate-200'}`}
                          onClick={() => toggleCartItem({...test, type: 'test'})}
                        >
                           <div>
                              <h4 className={`text-[12px] font-black uppercase tracking-tight ${isInCart ? 'text-blue-700' : 'text-slate-800'}`}>{test.name}</h4>
                              <p className="text-[9px] text-slate-400 font-bold uppercase">Clinical Diagnostic</p>
                           </div>
                           <div className="text-right flex items-center gap-3">
                              <p className="text-blue-600 font-black text-sm">৳{test.price}</p>
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${isInCart ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'border-slate-200 text-slate-200'}`}>
                                {isInCart ? '✓' : '+'}
                              </div>
                           </div>
                        </Card>
                      );
                    }) : <div className="text-center py-20 text-slate-300 font-black text-[10px] uppercase tracking-widest">No Tests Found</div>}
                  </div>
               )}

               {homeSubCategory === 'emergency' && (
                  <div className="space-y-4 pb-36">
                    {EMERGENCY_SERVICES.map(s => {
                      const isInCart = cart.find(i => i.id === s.id);
                      return (
                        <Card 
                          key={s.id} 
                          className={`flex justify-between items-center border-l-4 transition-all ${isInCart ? 'border-l-red-600 bg-red-50/50' : 'border-l-slate-200'}`}
                          onClick={() => toggleCartItem({...s, type: 'emergency'})}
                        >
                           <div className="flex gap-4 items-center">
                              <span className="text-3xl drop-shadow-sm">{s.icon}</span>
                              <div>
                                 <h4 className={`text-[12px] font-black ${isInCart ? 'text-red-700' : 'text-slate-800'}`}>{s.name}</h4>
                                 <p className="text-[9px] text-slate-400 font-medium">{s.description}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                              <p className="text-red-600 font-black text-sm">৳{s.price}</p>
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${isInCart ? 'bg-red-600 border-red-600 text-white shadow-md' : 'border-slate-200 text-slate-200'}`}>
                                  {isInCart ? '✓' : '+'}
                              </div>
                           </div>
                        </Card>
                      );
                    })}
                  </div>
               )}
            </div>
          </div>
        )}

        {cart.length > 0 && activeTab === 'home' && (
          <div className="fixed bottom-28 left-4 right-4 z-50 animate-in slide-in-from-bottom-20 duration-500">
            <div className="bg-slate-900 text-white rounded-[32px] p-5 flex justify-between items-center shadow-2xl border border-white/10">
               <div>
                  <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{cart.length} ITEMS SELECTED</p>
                  <p className="text-xl font-black">৳{cart.reduce((s, i) => s + i.price, 0)}</p>
               </div>
               <button onClick={startCheckout} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black text-[11px] uppercase tracking-wider active:scale-95 transition-all shadow-lg shadow-blue-500/20">
                  CHECKOUT
               </button>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-5">
            <Card className="flex items-center gap-5 py-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-none shadow-inner">
               <div className="w-16 h-16 bg-blue-600 rounded-[22px] flex items-center justify-center text-white text-3xl font-black shadow-xl border-4 border-white">
                 {profile?.full_name?.[0] || '👤'}
               </div>
               <div>
                  <h4 className="font-black text-xl text-slate-800 tracking-tight">{profile?.full_name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge status={profile?.status || 'active'} />
                    <p className="text-[10px] text-blue-600 uppercase font-black tracking-widest opacity-60">{profile?.role}</p>
                  </div>
               </div>
            </Card>

            <div className="flex bg-slate-100 p-1.5 rounded-[22px]">
              <button onClick={() => setHistoryTab('info')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${historyTab === 'info' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400'}`}>Account</button>
              <button onClick={() => setHistoryTab('history')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${historyTab === 'history' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400'}`}>Medical Log</button>
              {isAdmin && (
                <button onClick={() => setHistoryTab('admin')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${historyTab === 'admin' ? 'bg-white shadow-md text-red-600' : 'text-slate-400'}`}>Moderator</button>
              )}
            </div>

            {historyTab === 'admin' && profile?.role === UserRole.ADMIN && (
              <div className="space-y-8 pb-28">
                <div className="flex border-b pt-2 gap-6 overflow-x-auto no-scrollbar">
                   <button onClick={() => setAdminSubTab('log')} className={`pb-3 text-[11px] font-black uppercase whitespace-nowrap tracking-wider ${adminSubTab === 'log' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>Visits</button>
                   <button onClick={() => setAdminSubTab('users')} className={`pb-3 text-[11px] font-black uppercase whitespace-nowrap tracking-wider ${adminSubTab === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>Users</button>
                   <button onClick={() => setAdminSubTab('orders')} className={`pb-3 text-[11px] font-black uppercase whitespace-nowrap tracking-wider ${adminSubTab === 'orders' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>Orders</button>
                   <button onClick={() => setAdminSubTab('data')} className={`pb-3 text-[11px] font-black uppercase whitespace-nowrap tracking-wider ${adminSubTab === 'data' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>Manage Data</button>
                   <button onClick={() => setAdminSubTab('settings')} className={`pb-3 text-[11px] font-black uppercase whitespace-nowrap tracking-wider ${adminSubTab === 'settings' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}>Settings</button>
                </div>

                {adminSubTab === 'data' && (
                  <div className="space-y-6">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button onClick={() => setAdminDataTab('doctors')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase ${adminDataTab === 'doctors' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>Doctors</button>
                      <button onClick={() => setAdminDataTab('hospitals')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase ${adminDataTab === 'hospitals' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>Hospitals</button>
                      <button onClick={() => setAdminDataTab('tests')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase ${adminDataTab === 'tests' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>Tests</button>
                    </div>

                    <Button onClick={() => { setEditingItem({}); setTempImage(null); setShowAddModal(true); }} className="w-full py-3 rounded-xl">+ Add New {adminDataTab}</Button>

                    <div className="space-y-3">
                      {adminDataTab === 'doctors' && doctors.map(d => (
                        <Card key={d.id} className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <img src={d.image} className="w-10 h-10 rounded-lg object-cover border" />
                            <div>
                               <p className="text-xs font-black">{d.name}</p>
                               <p className="text-[9px] text-slate-400">{d.specialty} • {d.degree}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                             <button onClick={() => { setEditingItem(d); setTempImage(d.image); setShowAddModal(true); }} className="text-blue-600 text-[10px] font-black uppercase">Edit</button>
                             <button onClick={() => handleDeleteData('doctor', d.id)} className="text-red-600 text-[10px] font-black uppercase">Del</button>
                          </div>
                        </Card>
                      ))}
                      {adminDataTab === 'hospitals' && hospitals.map(h => (
                        <Card key={h.id} className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <img src={h.image} className="w-10 h-10 rounded-lg object-cover border" />
                            <div>
                              <p className="text-xs font-black">{h.name}</p>
                              <p className="text-[9px] text-slate-400">{h.address}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => { setEditingItem(h); setTempImage(h.image); setShowAddModal(true); }} className="text-blue-600 text-[10px] font-black uppercase">Edit</button>
                            <button onClick={() => handleDeleteData('hospital', h.id)} className="text-red-600 text-[10px] font-black uppercase">Del</button>
                          </div>
                        </Card>
                      ))}
                      {adminDataTab === 'tests' && labTests.map(t => (
                        <Card key={t.id} className="flex justify-between items-center">
                          <div>
                            <p className="text-xs font-black">{t.name}</p>
                            <p className="text-[9px] text-slate-400">Price: ৳{t.price}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => { setEditingItem(t); setShowAddModal(true); }} className="text-blue-600 text-[10px] font-black uppercase">Edit</button>
                            <button onClick={() => handleDeleteData('lab_test', t.id)} className="text-red-600 text-[10px] font-black uppercase">Del</button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {adminSubTab === 'log' && (
                  <div className="space-y-4">
                     <input type="text" placeholder="Search visits..." className="w-full bg-white border shadow-sm rounded-2xl py-3 px-5 text-xs font-bold outline-none" value={adminSearchTerm} onChange={(e) => setAdminSearchTerm(e.target.value)} />
                     {masterLogFiltered.map((p) => (
                       <Card key={p.id} className="border-l-4 border-l-blue-600">
                          <p className="text-[9px] font-black text-slate-400 uppercase">{new Date(p.created_at).toLocaleString()}</p>
                          <h4 className="font-black text-sm text-slate-800 mt-1">{p.patient_name} ➔ {p.doctor_name}</h4>
                          <div className="mt-2 bg-slate-50 p-3 rounded-xl text-[10px] text-slate-600 leading-relaxed italic">{p.medicines}</div>
                       </Card>
                     ))}
                  </div>
                )}

                {adminSubTab === 'users' && (
                  <div className="space-y-3">
                     {allProfiles.map(p => (
                       <Card key={p.id} className="flex justify-between items-center py-4 hover:bg-slate-50 shadow-none border-b rounded-none" onClick={() => setSelectedUserRecords({ p, recs: allPrescriptions.filter(pr => pr.patient_id === p.id), ords: allOrders.filter(o => o.user_id === p.id) })}>
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center font-black text-blue-600">{p.full_name[0]}</div>
                             <div>
                                <p className="text-xs font-black text-slate-800">{p.full_name}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">{p.role} • {p.phone}</p>
                             </div>
                          </div>
                          <Badge status={p.status} />
                       </Card>
                     ))}
                  </div>
                )}

                {adminSubTab === 'orders' && (
                   <div className="space-y-4">
                      {allOrders.map(o => (
                        <Card key={o.id} className="border-l-4 border-l-amber-500">
                           <div className="flex justify-between mb-2">
                              <p className="text-[10px] font-black text-slate-400 uppercase">{new Date(o.created_at!).toLocaleDateString()}</p>
                              <Badge status={o.status} />
                           </div>
                           <h4 className="text-[11px] font-black text-slate-800 leading-tight">{o.item_name}</h4>
                           {o.hospital_name && <p className="text-[9px] font-black text-blue-600 uppercase mt-1">📍 {o.hospital_name}</p>}
                           <p className="text-[10px] text-slate-500 font-bold mt-1">Customer: {o.sender_name} ({o.sender_contact})</p>
                           <p className="text-blue-600 font-black text-xs mt-2">৳{o.amount + o.shipping} • Trx: {o.trx_id}</p>
                        </Card>
                      ))}
                   </div>
                )}

                {adminSubTab === 'settings' && (
                  <div className="space-y-6 pb-20">
                     <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-100">
                       <p className="text-[10px] font-black text-amber-700 uppercase mb-2">Database Setup</p>
                       <p className="text-[9px] text-amber-600 mb-4 leading-relaxed uppercase font-bold">যদি সেভ না হয়, তবে প্রথমে এই বাটনটি ক্লিক করে আপনার অ্যাকাউন্টে টেবিলগুলোর ডেটা সিড করুন।</p>
                       <Button variant="secondary" className="w-full py-4 text-amber-700 border border-amber-200 rounded-2xl" onClick={seedDatabase} loading={isProcessing}>Setup Database (Seed)</Button>
                     </div>

                     <div className="bg-rose-50 p-6 rounded-[32px] border border-rose-100">
                       <p className="text-[10px] font-black text-rose-700 uppercase mb-2">System Reset</p>
                       <p className="text-[9px] text-rose-600 mb-4 leading-relaxed uppercase font-bold">সম্পূর্ণ ডাটাবেস রিসেট করে ডিফল্ট লিস্ট লোড করতে নিচের বাটনটি ব্যবহার করুন। এটি বর্তমানে থাকা সকল ম্যানুয়াল ডাটা মুছে ফেলবে।</p>
                       <Button variant="danger" className="w-full py-4 rounded-2xl shadow-lg shadow-rose-500/10" onClick={seedDatabase} loading={isProcessing}>
                         Clear & Reset Database (Default)
                       </Button>
                     </div>

                     <div className="space-y-3">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Ticker Message</p>
                       <textarea value={tickerMessage} onChange={(e) => setTickerMessage(e.target.value)} className="w-full bg-white border-2 p-5 rounded-[40px] text-xs h-32 outline-none focus:border-blue-500 transition-all font-medium leading-relaxed" />
                       <Button variant="primary" className="w-full py-4 rounded-2xl" onClick={updateTicker} loading={isProcessing}>Update Home Ticker</Button>
                     </div>
                  </div>
                )}
              </div>
            )}
            
            {historyTab === 'history' && (
              <div className="space-y-4 pb-28">
                 {allPrescriptions.length > 0 ? allPrescriptions.map(p => (
                   <Card key={p.id} className="border-l-4 border-l-blue-600">
                     <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">{p.doctor_name} • {new Date(p.created_at).toLocaleDateString()}</h4>
                     <div className="mt-2 bg-blue-50/50 p-4 rounded-[28px] border border-blue-50 text-[11px] text-slate-700 leading-relaxed whitespace-pre-line font-medium italic">{p.medicines}</div>
                   </Card>
                 )) : <div className="text-center py-24 opacity-30 font-black uppercase text-xs tracking-widest">Medical history is empty</div>}
              </div>
            )}

            {historyTab === 'info' && (
               <div className="space-y-4 pt-4">
                  <Button onClick={handleShare} variant="primary" className="w-full py-4 rounded-[28px] flex items-center justify-center gap-3">
                    <Share2 size={20} /> অ্যাপটি শেয়ার করুন (Share App)
                  </Button>
                  <Button onClick={handleInstallApp} variant="secondary" className="w-full py-4 rounded-[28px] flex items-center justify-center gap-3 border-2 border-blue-100 bg-white text-blue-600">
                    <Smartphone size={20} /> অ্যাপটি ফোনে ইন্সটল করুন (Install App)
                  </Button>
                  <Button onClick={() => window.open('https://wa.me/8801518395772', '_blank')} variant="success" className="w-full py-4 rounded-[28px] flex items-center justify-center gap-3">
                    <span className="text-xl">💬</span> Contact Support (WhatsApp)
                  </Button>
                  <Button onClick={logout} variant="secondary" className="w-full py-4 rounded-[28px] text-red-500 font-black">LOGOUT ACCOUNT</Button>
               </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase">Recent Orders</h2>
            <div className="space-y-4 pb-28">
              {allOrders.map(order => (
                <Card key={order.id} className="border-l-4 border-l-amber-500 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1 max-w-[70%]">
                      <p className="text-[12px] font-black text-slate-800 leading-snug">{order.item_name}</p>
                      {order.hospital_name && <p className="text-[9px] font-black text-blue-600 uppercase">📍 {order.hospital_name}</p>}
                    </div>
                    <Badge status={order.status} />
                  </div>
                  <div className="text-[10px] text-slate-500 font-bold flex justify-between bg-slate-50 p-3 rounded-[20px] items-center">
                    <span className="text-blue-600 text-sm">৳{order.amount + order.shipping}</span>
                    <span className="tracking-widest">TRX: {order.trx_id.substring(0,10)}...</span>
                  </div>
                </Card>
              ))}
              {allOrders.length === 0 && <div className="text-center py-24 opacity-30 font-black text-xs uppercase tracking-[0.3em]">No orders yet</div>}
            </div>
          </div>
        )}
      </main>

      {profile?.role !== UserRole.ADMIN && (
        <nav className="fixed bottom-6 left-6 right-6 z-50 bg-slate-900/95 backdrop-blur-2xl flex justify-around items-center py-5 rounded-[40px] shadow-2xl border border-white/10 overflow-hidden">
          <button onClick={() => { setActiveTab('home'); setHomeSubCategory('doctors'); setSelectedHospitalId(null); setSelectedSpecialty(null); }} className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'home' ? 'text-blue-400 scale-125' : 'text-slate-500 opacity-60'}`}>
            <span className="text-2xl drop-shadow-md">🏠</span>
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-center">Home</span>
          </button>
          <button onClick={() => setActiveTab('orders')} className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'orders' ? 'text-yellow-400 scale-125' : 'text-slate-500 opacity-60'}`}>
            <span className="text-2xl drop-shadow-md">📜</span>
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-center">Orders</span>
          </button>
          <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'profile' ? 'text-fuchsia-400 scale-125' : 'text-slate-500 opacity-60'}`}>
            <span className="text-2xl drop-shadow-md">👤</span>
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-center">Profile</span>
          </button>
        </nav>
      )}

        </>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
          <Card className="w-full max-w-sm p-10 space-y-8 animate-in zoom-in-95 duration-200 rounded-[48px]">
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter">{authMode === 'login' ? 'Login' : authMode === 'moderator' ? 'Moderator' : 'Register'}</h2>
            <form onSubmit={handleAuth} className="space-y-5">
              {authMode === 'register' && (
                <><Input label="Full Name" name="fullName" required /><Input label="Phone Number" name="phone" required /></>
              )}
              <Input label={authMode === 'moderator' ? "Username" : "Email"} name="email" type={authMode === 'moderator' ? "text" : "email"} required />
              <Input label="Password" name="password" type="password" required />
              <Button type="submit" loading={isProcessing} className="w-full py-4 mt-2 rounded-2xl">Continue</Button>
              
              {authMode !== 'moderator' && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-4">
                    <div className="h-[1px] flex-1 bg-slate-100"></div>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Or</span>
                    <div className="h-[1px] flex-1 bg-slate-100"></div>
                  </div>
                  <Button 
                    onClick={handleGoogleLogin} 
                    variant="secondary" 
                    type="button"
                    className="w-full py-4 rounded-2xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-800"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </Button>
                </div>
              )}
            </form>
            <div className="flex flex-col gap-4 pt-4 border-t border-slate-100 text-center">
              <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{authMode === 'login' ? 'Create New Account' : 'Back to Login'}</button>
              <button onClick={() => setAuthMode('moderator')} className="text-[10px] font-black text-red-600 uppercase border-t pt-3 tracking-widest opacity-60">Admin/Moderator Dashboard</button>
              <button onClick={() => setShowAuthModal(false)} className="text-slate-400 font-bold text-xs uppercase hover:text-slate-600 transition-colors">Dismiss</button>
            </div>
          </Card>
        </div>
      )}

      {/* Data Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
          <Card className="w-full max-w-md p-8 space-y-6 max-h-[90vh] overflow-y-auto rounded-[32px]">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800 uppercase">Manage {adminDataTab}</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-300 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const rawData: any = Object.fromEntries(formData.entries());
              const id = editingItem?.id || Math.random().toString(36).substr(2, 9);
              
              let finalData: any = { id };

              if (adminDataTab === 'doctors') {
                finalData = {
                  ...finalData,
                  name: rawData.name,
                  degree: rawData.degree,
                  specialty: rawData.specialty,
                  districts: [rawData.district],
                  clinics: [rawData.clinic],
                  schedule: rawData.schedule,
                  image: tempImage || editingItem?.image || `https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200&sig=${id}`,
                  availableToday: true,
                  rating: editingItem?.rating || 5.0
                };
              } else if (adminDataTab === 'hospitals') {
                finalData = {
                  ...finalData,
                  name: rawData.name,
                  district: rawData.district,
                  address: rawData.address,
                  image: tempImage || editingItem?.image || `https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=400&sig=${id}`,
                  doctors: editingItem?.doctors || []
                };
              } else if (adminDataTab === 'tests') {
                finalData = {
                  ...finalData,
                  name: rawData.name,
                  price: Number(rawData.price)
                };
              }
              
              handleSaveData(
                adminDataTab === 'doctors' ? 'doctor' : 
                adminDataTab === 'hospitals' ? 'hospital' : 'lab_test', 
                finalData
              );
            }} className="space-y-4">
              {(adminDataTab === 'doctors' || adminDataTab === 'hospitals') && (
                <div className="flex flex-col items-center gap-4 p-4 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                  {tempImage ? (
                    <img src={tempImage} className="w-32 h-32 rounded-2xl object-cover shadow-md border-2 border-white" />
                  ) : (
                    <div className="w-32 h-32 rounded-2xl bg-slate-200 flex items-center justify-center text-slate-400 text-4xl">🖼️</div>
                  )}
                  <label className="bg-blue-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase cursor-pointer hover:bg-blue-700 transition-colors">
                    ছবি সিলেক্ট করুন
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  <p className="text-[8px] text-slate-400 font-bold uppercase">গ্যালারি থেকে ছবি আপলোড করুন</p>
                </div>
              )}
              {adminDataTab === 'doctors' && (
                <>
                  <Input label="Name" name="name" defaultValue={editingItem?.name} required />
                  <Input label="Degree" name="degree" defaultValue={editingItem?.degree} required />
                  <Input label="Specialty" name="specialty" defaultValue={editingItem?.specialty} required />
                  <Input label="District" name="district" defaultValue={editingItem?.districts?.[0]} required />
                  <Input label="Clinic ID" name="clinic" defaultValue={editingItem?.clinics?.[0]} required />
                  <Input label="Schedule" name="schedule" defaultValue={editingItem?.schedule} required />
                </>
              )}
              {adminDataTab === 'hospitals' && (
                <>
                  <Input label="Hospital Name" name="name" defaultValue={editingItem?.name} required />
                  <Input label="District" name="district" defaultValue={editingItem?.district} required />
                  <Input label="Address" name="address" defaultValue={editingItem?.address} required />
                </>
              )}
              {adminDataTab === 'tests' && (
                <>
                  <Input label="Test Name" name="name" defaultValue={editingItem?.name} required />
                  <Input label="Price" name="price" type="number" defaultValue={editingItem?.price} required />
                </>
              )}
              <Button type="submit" loading={isProcessing} className="w-full py-4 rounded-2xl">Save Changes</Button>
            </form>
          </Card>
        </div>
      )}

      {/* Payment/Checkout Modal */}
      {showPayment.show && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-end justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-t-[56px] p-10 pb-14 space-y-8 max-h-[95vh] overflow-y-auto animate-in slide-in-from-bottom-20 duration-500">
              <div className="flex justify-between items-center border-b pb-5">
                 <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Order Summary</h2>
                 <button onClick={() => setShowPayment({show: false, amount: 0, item: '', shipping: 0})} className="text-slate-300 text-3xl font-bold hover:text-slate-600">✕</button>
              </div>
              
              <div className="space-y-5">
                 {(showPayment.isClinic || showPayment.isVideo) && (
                   <div className="flex gap-3 bg-slate-50 p-2 rounded-3xl border border-slate-100">
                     <button 
                       onClick={() => { setPaymentType('online'); setPaymentMethod(null); }}
                       className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${paymentType === 'online' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}
                     >
                       Pay Online
                     </button>
                     {!showPayment.isVideo && (
                       <button 
                         onClick={() => { setPaymentType('offline'); setPaymentMethod(null); }}
                         className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${paymentType === 'offline' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}
                       >
                         Pay at Clinic
                       </button>
                     )}
                   </div>
                 )}

                 {showPayment.isVideo && (
                   <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3">
                     <span className="text-xl">📹</span>
                     <p className="text-[10px] font-black text-emerald-700 uppercase leading-tight">Video call consultations must be paid online to confirm your slot.</p>
                   </div>
                 )}

                 <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Service Details:</p>
                    <p className="text-[12px] font-black text-slate-700 leading-relaxed italic">{showPayment.item}</p>
                    {showPayment.hospitalName && (
                      <p className="text-[10px] font-black text-blue-600 uppercase mt-2 border-t pt-2 border-slate-200">
                        📍 {showPayment.hospitalName}
                      </p>
                    )}
                 </div>
                  <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 mb-4">
                     <div className="space-y-4">
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">রোগীর নাম (বাধ্যতামূলক)</p>
                           <Input label="সম্পূর্ণ নাম" placeholder="রোগীর নাম লিখুন" required value={patientName} onChange={setPatientName} />
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">আপনার ফোন নম্বর দিন (বাধ্যতামূলক)</p>
                           <Input label="আপনার সচল ফোন নম্বরটি" placeholder="01XXXXXXXXX" type="tel" required value={contactPhone} onChange={setContactPhone} />
                        </div>
                     </div>
                  </div>
                 <div className="bg-blue-600 p-8 rounded-[40px] text-white text-center shadow-2xl shadow-blue-500/30">
                    <p className="text-4xl font-black">৳{showPayment.amount + showPayment.shipping}</p>
                    <p className="text-[10px] font-black opacity-70 uppercase mt-2 tracking-[0.2em]">Total Bill Payable {showPayment.shipping > 0 ? '(+৳১০০ Home Visit)' : ''}</p>
                 </div>

                 {showPayment.isTest && (
                   <div className="pt-2">
                     <button 
                       onClick={handleWhatsAppBooking}
                       className="w-full bg-emerald-500 text-white py-5 rounded-[32px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
                     >
                        <span className="text-xl">💬</span> WhatsApp Booking (সরাসরি বুকিং)
                     </button>
                     <p className="text-[10px] text-center text-slate-400 font-bold mt-3 uppercase tracking-widest leading-relaxed">
                        টেস্টের দাম বা অন্যান্য বিষয়ে অ্যাডমিনের সাথে সরাসরি কথা বলতে উপরের বাটনটি ব্যবহার করুন।
                     </p>
                   </div>
                 )}
              </div>

              {paymentType === 'online' ? (
                <>
                  {!paymentMethod ? (
                    <div className="grid grid-cols-2 gap-6">
                      <button onClick={() => setPaymentMethod('bkash')} className="p-8 border-2 border-slate-50 rounded-[40px] flex flex-col items-center gap-4 bg-white hover:border-pink-500 hover:shadow-xl transition-all active:scale-95 group">
                        <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-600 font-black text-xs">bKash</div>
                        <span className="text-[11px] font-black text-pink-600 uppercase tracking-[0.2em]">Pay bKash</span>
                      </button>
                      <button onClick={() => setPaymentMethod('nagad')} className="p-8 border-2 border-slate-50 rounded-[40px] flex flex-col items-center gap-4 bg-white hover:border-orange-500 hover:shadow-xl transition-all active:scale-95 group">
                        <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 font-black text-xs">Nagad</div>
                        <span className="text-[11px] font-black text-orange-600 uppercase tracking-[0.2em]">Pay Nagad</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5">
                      <div className="p-6 bg-blue-50 rounded-[32px] flex justify-between items-center border border-blue-100 shadow-inner">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-blue-400 uppercase mb-1">Send Money to:</span>
                            <span className="text-blue-700 text-xl font-black tracking-widest">{PAYMENT_NUMBERS[paymentMethod]}</span>
                        </div>
                        <button onClick={() => { navigator.clipboard.writeText(PAYMENT_NUMBERS[paymentMethod]); alert('Number Copied!'); }} className="bg-blue-600 text-white text-[10px] font-black px-6 py-3.5 rounded-2xl shadow-lg hover:bg-blue-700 transition-colors">COPY</button>
                      </div>
                      <Input label="Transaction ID (TrxID)" placeholder="Enter 10-digit ID" required value={trxId} onChange={setTrxId} />
                      <Button variant="success" className="w-full py-5 mt-4 rounded-3xl uppercase font-black" onClick={submitOrder} loading={isProcessing}>ভেরিফাই নিশ্চিত করুন</Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5">
                   <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-100">
                     <p className="text-[11px] font-black text-amber-700 uppercase mb-2">Cash on Visit</p>
                     <p className="text-[10px] text-amber-600 leading-relaxed">আপনি সরাসরি ক্লিনিকে গিয়ে ফি পরিশোধ করতে পারবেন। আপনার সিরিয়ালটি কনফার্ম করার জন্য নিচের বাটনে ক্লিক করুন।</p>
                   </div>
                   <Button variant="success" className="w-full py-5 rounded-3xl uppercase font-black" onClick={submitOrder} loading={isProcessing}>অ্যাপয়েন্টমেন্ট নিশ্চিত করুন</Button>
                </div>
              )}
           </div>
        </div>
      )}

      <DownloadFAB />
      <UpdatePrompt />
      {!isOnline && <OfflineBanner />}

      {/* Doctor Profile Detail Modal */}
      <AnimatePresence>
        {selectedDoctor && (
          <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-[48px] overflow-hidden shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar"
            >
              <button 
                onClick={() => setSelectedDoctor(null)}
                className="absolute top-6 right-6 z-10 w-10 h-10 bg-black/10 backdrop-blur-md rounded-full flex items-center justify-center text-black font-bold hover:bg-black/20 transition-all shadow-lg"
              >
                ✕
              </button>

              <div className="relative h-64">
                <img src={selectedDoctor.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent"></div>
              </div>

              <div className="p-8 -mt-20 relative bg-white rounded-t-[48px] space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">{selectedDoctor.name}</h2>
                  <p className="text-blue-600 font-bold uppercase text-xs tracking-widest mt-1">{selectedDoctor.specialty} Specialist</p>
                  <p className="text-slate-400 font-medium italic text-[11px] mt-2 max-w-[80%] mx-auto">{selectedDoctor.degree}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex flex-col items-center">
                    <span className="text-[8px] font-black text-slate-400 uppercase mb-1">Rating</span>
                    <span className="text-sm font-black text-slate-800">⭐ {selectedDoctor.rating}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex flex-col items-center">
                    <span className="text-[8px] font-black text-slate-400 uppercase mb-1">Fee (৳)</span>
                    <span className="text-sm font-black text-blue-600">৳{selectedDoctor.consultationFee}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-3xl border-2 border-dashed border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Availability
                    </h4>
                    <p className="text-sm font-black text-slate-700">{selectedDoctor.schedule}</p>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border-2 border-dashed border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                       📍 Chamber / Hospital
                    </h4>
                    {selectedDoctor.clinics.map(cid => {
                        const h = hospitals.find(hosp => hosp.id === cid);
                        return (
                          <div key={cid} className="mb-2 last:mb-0">
                            <p className="text-sm font-black text-blue-600">{h?.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{h?.address}</p>
                          </div>
                        );
                    })}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => {
                      handleWhatsAppConsult(selectedDoctor);
                    }}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase text-[12px]"
                  >
                    <span className="text-xl">📅</span> সিরিয়াল দিন
                  </button>
                </div>

                <button 
                  onClick={() => window.open(`https://wa.me/8801518395772?text=Hello, I want to know more about doctor ${selectedDoctor.name}`, '_blank')}
                  className="w-full mt-4 bg-blue-50 hover:bg-blue-100 text-blue-600 py-4 rounded-2xl font-black border-2 border-blue-100 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase text-[10px]"
                >
                  <span className="text-lg">💬</span> ডাক্তার সম্পর্কিত জানতে whatsapp এ যোগাযোগ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Serial Booking Multi-Step Modal */}
      {showSerialModal && bookingDoctor && (
        <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 text-center">
           <Card className="w-full max-w-sm p-10 space-y-8 animate-in zoom-in-95 duration-200 rounded-[48px]">
              <div className="space-y-4">
                <div className="w-20 h-20 bg-blue-50 rounded-[28px] flex items-center justify-center mx-auto text-blue-600 text-3xl shadow-xl border-4 border-white mb-6 overflow-hidden">
                   <img src={bookingDoctor.image} className="w-full h-full object-cover" />
                </div>
                
                <AnimatePresence mode="wait">
                  {serialStep === 0 && (
                    <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                       <h3 className="text-xl font-black text-slate-800 tracking-tight">হ্যালো জেবি হেলথকেয়ার</h3>
                       <p className="text-[12px] font-medium text-slate-500 leading-relaxed italic">আমি ডাক্তার <span className="text-blue-600 font-black">{bookingDoctor.name}</span>-এর সিরিয়াল দিতে চাই।</p>
                       <Button onClick={() => setSerialStep(1)} className="w-full py-5 rounded-[28px]">সিরিয়াল শুরু করুন</Button>
                    </motion.div>
                  )}
                  {serialStep === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                       <h3 className="text-[15px] font-black text-slate-800 tracking-tight leading-tight">আপনার রোগীর নাম, বয়স এবং ঠিকানাটা দিন?</h3>
                       <textarea 
                         className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-3xl p-5 text-sm font-bold outline-none h-32"
                         placeholder="যেমন: রহিম, ৪৫ বছর, নীলফামারী"
                         value={serialData.patientInfo}
                         onChange={(e) => setSerialData({...serialData, patientInfo: e.target.value})}
                       />
                       <Button disabled={!serialData.patientInfo} onClick={() => setSerialStep(2)} className="w-full py-5 rounded-[28px]">পরবর্তী ধাপ</Button>
                    </motion.div>
                  )}
                  {serialStep === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                       <h3 className="text-[15px] font-black text-slate-800 tracking-tight leading-tight">আপনি কবে ডাক্তারের পরামর্শ নিতে চান?</h3>
                       <Input 
                         label="পছন্দসই তারিখ" 
                         type="text" 
                         placeholder="যেমন: ২০ মে অথবা আগামীকাল" 
                         value={serialData.date}
                         onChange={(val) => setSerialData({...serialData, date: val})}
                       />
                       <Button disabled={!serialData.date} onClick={() => setSerialStep(3)} className="w-full py-5 rounded-[28px]">পরবর্তী ধাপ</Button>
                    </motion.div>
                  )}
                  {serialStep === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                       <h3 className="text-[15px] font-black text-slate-800 tracking-tight leading-tight">আপনার রোগীর কি কি সমস্যা?</h3>
                       <textarea 
                         className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-3xl p-5 text-sm font-bold outline-none h-32"
                         placeholder="সমস্যাগুলো এখানে সংক্ষেপে লিখুন"
                         value={serialData.problems}
                         onChange={(e) => setSerialData({...serialData, problems: e.target.value})}
                       />
                       <Button disabled={!serialData.problems} onClick={() => setSerialStep(4)} className="w-full py-5 rounded-[28px]">পরবর্তী ধাপ</Button>
                    </motion.div>
                  )}
                  {serialStep === 4 && (
                    <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                       <h3 className="text-[15px] font-black text-slate-800 tracking-tight leading-tight">আপনি কি এর আগে কোন ডক্টরকে দেখিয়েছেন?</h3>
                       <Input 
                         label="ডাক্তারের নাম (থাকলে)" 
                         placeholder="হ্যাঁ / না অথবা ডাক্তারের নাম লিখুন" 
                         value={serialData.previousDoctor}
                         onChange={(val) => setSerialData({...serialData, previousDoctor: val})}
                       />
                       <Button disabled={!serialData.previousDoctor} onClick={finalizeSerialBooking} className="w-full py-5 rounded-[28px] bg-emerald-500 shadow-emerald-500/20">বুকিং সম্পন্ন করুন (WhatsApp)</Button>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <button onClick={() => setShowSerialModal(false)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors pt-4">বাতিল করুন</button>
              </div>
           </Card>
        </div>
      )}
    </div>
  );
}

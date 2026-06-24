import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare, User, Calendar, MapPin, Phone, Activity, ArrowRight, Lock, Mail, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { auth, db } from '../../services/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { toVirtualEmail } from '../../utils';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctorName: string;
  doctorSpecialty: string;
  hotline: string;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, doctorName, doctorSpecialty, hotline }) => {
  const [user, setUser] = useState(auth.currentUser);
  const [profile, setProfile] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Booking Form State
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    address: '',
    problem: '',
    date: '',
    phone: '',
  });

  // Auth Form State
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authForm, setAuthForm] = useState({
    fullName: '',
    phone: '',
    emailOrPhone: '',
    password: '',
    referredByCode: ''
  });

  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());

  // Listen to Auth State
  useEffect(() => {
    if (!isOpen) return;
    
    setIsLoadingProfile(true);
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const docRef = doc(db, 'profiles', u.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const profData = docSnap.data();
            setProfile(profData);
            setFormData(prev => ({
              ...prev,
              name: prev.name || u.displayName || profData.full_name || '',
              phone: prev.phone || profData.phone || ''
            }));
          } else {
            const tempProf = {
              id: u.uid,
              full_name: u.displayName || 'User',
              phone: '',
              role: 'PATIENT',
              status: 'active'
            };
            setProfile(tempProf);
            setFormData(prev => ({
              ...prev,
              name: prev.name || u.displayName || '',
              phone: ''
            }));
          }
        } catch (err) {
          console.error("Error fetching profile inside BookingModal:", err);
        } finally {
          setIsLoadingProfile(false);
        }
      } else {
        setProfile(null);
        setIsLoadingProfile(false);
      }
    });

    return unsub;
  }, [isOpen]);

  const convertToBanglaDigits = (numStr: string | number): string => {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(numStr).replace(/[0-9]/g, (w) => banglaDigits[parseInt(w)]);
  };

  const BANG_MONTHS = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];

  const BANG_DAYS = [
    'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'
  ];

  const weekDays = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];

  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay();
  const blanks = Array(firstDayIndex).fill(null);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const isPastDate = (dayNum: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const cellDate = new Date(calendarYear, calendarMonth, dayNum);
    return cellDate < today;
  };

  const handleSelectDate = (day: number) => {
    const selectedDate = new Date(calendarYear, calendarMonth, day);
    const d = selectedDate.getDate();
    const m = selectedDate.getMonth();
    const y = selectedDate.getFullYear();
    const dayName = BANG_DAYS[selectedDate.getDay()];
    
    const formattedDate = `${convertToBanglaDigits(d)} ${BANG_MONTHS[m]} ${convertToBanglaDigits(y)} (${dayName})`;
    
    setFormData({ ...formData, date: formattedDate });
    setShowCalendar(false);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAuth(true);

    try {
      const emailRaw = authForm.emailOrPhone.trim();
      const emailVal = toVirtualEmail(emailRaw);

      if (authTab === 'login') {
        if (!emailVal || !authForm.password) {
          throw new Error('দয়া করে মোবাইল/ইমেইল এবং পাসওয়ার্ড দিন।');
        }
        await signInWithEmailAndPassword(auth, emailVal, authForm.password);
      } else {
        if (!authForm.fullName || !authForm.phone || !emailVal || !authForm.password) {
          throw new Error('দয়া করে সব তথ্য পূরণ করুন!');
        }

        const credential = await createUserWithEmailAndPassword(auth, emailVal, authForm.password);
        const u = credential.user;
        await updateProfile(u, { displayName: authForm.fullName });

        const referralCodeFormatted = authForm.referredByCode.trim().toUpperCase();

        const newProf = {
          id: u.uid,
          full_name: authForm.fullName,
          phone: authForm.phone,
          role: 'PATIENT',
          status: 'active',
          referred_by_code: referralCodeFormatted || ''
        };

        await setDoc(doc(db, 'profiles', u.uid), newProf);
        setProfile(newProf);
      }
    } catch (err: any) {
      console.error("Booking auth error:", err);
      let errMsg = err.message || 'একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        errMsg = 'ভুল মোবাইল/ইমেইল অথবা পাসওয়ার্ড!';
      }
      alert(errMsg);
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("সিরিয়াল দেয়ার পূর্বে আপনাকে লগইন বা অ্যাকাউন্ট তৈরি করতে হবে।");
      return;
    }

    if (!formData.date) {
      alert("দয়া করে কবে দেখাবেন তারিখ নির্ধারণ করুন।");
      setShowCalendar(true);
      return;
    }

    try {
      const referralCode = profile?.referred_by_code || '';

      // Create appointment record in Firestore
      const appointmentRef = collection(db, 'appointments');
      const appRecord = {
        patient_id: user.uid,
        patient_name: formData.name,
        patient_phone: formData.phone,
        doctor_name: doctorName,
        doctor_specialty: doctorSpecialty,
        date: formData.date,
        problems: formData.problem,
        status: 'pending',
        referred_by_code: referralCode,
        created_at: serverTimestamp(),
      };
      await addDoc(appointmentRef, appRecord);

      // WhatsApp message structure
      let message = `*নতুন সিরিয়াল বুকিং*\n\nডাক্তার: ${doctorName}\nবিশেষজ্ঞ: ${doctorSpecialty}\n------------------\nরোগীর নাম: ${formData.name}\nবয়স: ${formData.age}\nবাসা: ${formData.address}\nকি সমস্যা: ${formData.problem}\nকবে দেখাবে: ${formData.date}\nফোন নাম্বার: ${formData.phone}\n`;
      if (referralCode) {
        message += `রেফারেল কোড: ${referralCode}\n`;
      }
      message += `------------------\nNilpha.com এর মাধ্যমে পাঠানো হয়েছে।`;
      
      const encodedMessage = encodeURIComponent(message);
      
      // Normalize hotline for WhatsApp API
      let formattedHotline = hotline.replace(/\D/g, '');
      if (formattedHotline.startsWith('0')) {
        formattedHotline = '88' + formattedHotline;
      } else if (!formattedHotline.startsWith('88')) {
        formattedHotline = '880' + formattedHotline;
      }
      
      window.open(`https://wa.me/${formattedHotline}?text=${encodedMessage}`, '_blank');
      onClose();
    } catch (dbErr) {
      console.error("Error creating appointment in database:", dbErr);
      alert("ডাটাবেজে সিরিয়াল সেভ করতে সমস্যা হয়েছে! তবে আমরা হোয়াটসঅ্যাপে তথ্য পাঠিয়ে দিচ্ছি।");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-md rounded-[40px] overflow-hidden shadow-2xl relative z-10"
          >
            <div className="p-8 bg-blue-600 text-white relative">
              <button 
                onClick={onClose} 
                className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/30 rounded-2xl transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                  <Calendar size={28} />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight">বুকিং ইনফরমেশন</h2>
                  <p className="text-[10px] font-bold opacity-80 uppercase mt-1 tracking-widest">{doctorName}</p>
                </div>
              </div>
            </div>
            
            {isLoadingProfile ? (
              <div className="p-12 text-center text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">
                লোডিং তথ্য...
              </div>
            ) : !user ? (
              /* Inline Authentication Form! */
              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
                <div className="text-center space-y-2">
                  <span className="inline-block bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                    রেজিস্ট্রেশন বাধ্যতামূলক
                  </span>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-snug">
                    ডক্টরের সিরিয়াল নিতে অবশ্যই আপনাকে আগে অ্যাকাউন্ট তৈরি করতে হবে।
                  </h3>
                </div>

                {/* Tab switcher */}
                <div className="flex bg-slate-50 p-1 rounded-2xl">
                  <button 
                    type="button" 
                    onClick={() => setAuthTab('login')} 
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${authTab === 'login' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}
                  >
                    লগইন
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setAuthTab('register')} 
                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${authTab === 'register' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}
                  >
                    রেজিস্ট্রেশন
                  </button>
                </div>

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {authTab === 'register' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">পূর্ণ নাম</label>
                        <div className="relative">
                          <input 
                            required
                            type="text" 
                            placeholder="যেমন: মোঃ সাব্বির হোসাইন"
                            value={authForm.fullName}
                            onChange={e => setAuthForm({...authForm, fullName: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pl-11 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          />
                          <User size={14} className="text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">মোবাইল নাম্বার</label>
                        <div className="relative">
                          <input 
                            required
                            type="tel" 
                            placeholder="যেমন: ০১৭xxxxxxxxx"
                            value={authForm.phone}
                            onChange={e => setAuthForm({...authForm, phone: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pl-11 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                          />
                          <Phone size={14} className="text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">ইউজারনেম, মোবাইল বা ইমেইল</label>
                    <div className="relative">
                      <input 
                        required
                        type="text"
                        placeholder={authTab === 'register' ? "যেমন: sabir, ০১৭xxxxxxxxx বা email@example.com" : "ইউজারনেম, মোবাইল বা ইমেইল লিখুন"}
                        value={authForm.emailOrPhone}
                        onChange={e => setAuthForm({...authForm, emailOrPhone: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pl-11 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                      <Mail size={14} className="text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">পাসওয়ার্ড</label>
                    <div className="relative">
                      <input 
                        required
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••"
                        value={authForm.password}
                        onChange={e => setAuthForm({...authForm, password: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pl-11 pr-12 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                      <Lock size={14} className="text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-all cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {authTab === 'register' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">পল্লী চিকিৎসক কোড (ঐচ্ছিক)</label>
                      <input 
                        type="text" 
                        placeholder="যেমন: RD001"
                        value={authForm.referredByCode}
                        onChange={e => setAuthForm({...authForm, referredByCode: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={isSubmittingAuth}
                    className="w-full bg-blue-600 text-white p-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/10 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3 mt-4"
                  >
                    {isSubmittingAuth ? 'প্রক্রিয়াকরণ...' : authTab === 'login' ? 'লগইন করুন ও বুক করুন' : 'নিবন্ধন করুন ও বুক করুন'}
                    <ArrowRight size={14} />
                  </button>
                </form>
              </div>
            ) : (
              /* Actual Appointment Form (Authorized Users) */
              <form onSubmit={handleSubmit} className="p-8 space-y-5 max-h-[70vh] overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 ml-1">
                      <User size={12} className="text-blue-500" /> রোগীর নাম
                    </label>
                    <input 
                      required 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                      placeholder="নাম লিখুন"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 ml-1">
                      <Activity size={12} className="text-blue-500" /> বয়স
                    </label>
                    <input 
                      required 
                      value={formData.age} 
                      onChange={e => setFormData({...formData, age: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                      placeholder="বয়স"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 ml-1">
                    <MapPin size={12} className="text-blue-500" /> বাসা কোথায়?
                  </label>
                  <input 
                    required 
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                    placeholder="আপনার বর্তমান ঠিকানা"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 ml-1">
                    <MessageSquare size={12} className="text-blue-500" /> কি সমস্যা?
                  </label>
                  <textarea 
                    required 
                    value={formData.problem} 
                    onChange={e => setFormData({...formData, problem: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[100px] resize-none" 
                    placeholder="আপনার সমস্যার কথা সংক্ষেপে লিখুন"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 ml-1">
                      <Calendar size={12} className="text-blue-500" /> কবে দেখাবেন?
                    </label>
                    <div 
                      onClick={() => setShowCalendar(!showCalendar)}
                      className={`w-full bg-slate-50 border ${showCalendar ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-100'} rounded-2xl p-4 text-[10px] font-black outline-none cursor-pointer hover:border-slate-300 hover:bg-slate-100/30 transition-all flex items-center justify-between h-[48px]`}
                    >
                      <span className={formData.date ? "text-slate-800" : "text-slate-400 font-bold"}>
                        {formData.date || "তারিখ নির্বাচন করুন"}
                      </span>
                      <Calendar size={14} className="text-blue-500 flex-shrink-0 ml-1" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 ml-1">
                      <Phone size={12} className="text-blue-500" /> फोन নাম্বার
                    </label>
                    <input 
                      required 
                      type="tel"
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all h-[48px]" 
                      placeholder="মোবাইল নাম্বার"
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {showCalendar && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="bg-slate-100/50 border border-slate-200/50 rounded-3xl p-4 mt-2 overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <button 
                          type="button"
                          onClick={() => {
                            if (calendarMonth === 0) {
                              setCalendarMonth(11);
                              setCalendarYear(v => v - 1);
                            } else {
                              setCalendarMonth(v => v - 1);
                            }
                          }}
                          className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
                        >
                          ◀
                        </button>
                        <span className="text-[11px] font-black text-slate-700 bg-white px-3 py-1.5 rounded-xl border border-slate-100 shadow-sm">
                          {BANG_MONTHS[calendarMonth]} {convertToBanglaDigits(calendarYear)}
                        </span>
                        <button 
                          type="button"
                          onClick={() => {
                            if (calendarMonth === 11) {
                              setCalendarMonth(0);
                              setCalendarYear(v => v + 1);
                            } else {
                              setCalendarMonth(v => v + 1);
                            }
                          }}
                          className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
                        >
                          ▶
                        </button>
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-center mb-1">
                        {weekDays.map((wd, idx) => (
                          <div key={idx} className="text-[9px] font-black uppercase text-slate-400 py-1">
                            {wd}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-center">
                        {blanks.map((_, idx) => (
                          <div key={`blank-${idx}`} className="py-2 text-[10px] text-slate-300 pointer-events-none" />
                        ))}
                        {days.map(dayNum => {
                          const isPast = isPastDate(dayNum);
                          const cellDate = new Date(calendarYear, calendarMonth, dayNum);
                          const formattedCellDate = `${convertToBanglaDigits(dayNum)} ${BANG_MONTHS[calendarMonth]} ${convertToBanglaDigits(calendarYear)}`;
                          const isSelected = formData.date.includes(formattedCellDate);
                          const isToday = new Date().toDateString() === cellDate.toDateString();

                          return (
                            <button
                              key={dayNum}
                              type="button"
                              disabled={isPast}
                              onClick={() => handleSelectDate(dayNum)}
                              className={`h-8 rounded-xl text-[10px] font-black transition-all flex items-center justify-center relative ${
                                isPast 
                                  ? 'text-slate-300 cursor-not-allowed opacity-40' 
                                  : isSelected 
                                    ? 'bg-blue-600 text-white font-black shadow-lg shadow-blue-100 scale-105' 
                                    : isToday
                                      ? 'bg-blue-50 text-blue-600 border border-blue-200 font-black'
                                      : 'bg-white hover:bg-slate-100 text-slate-700 shadow-sm border border-slate-100/55'
                              }`}
                            >
                              {convertToBanglaDigits(dayNum)}
                              {isToday && !isSelected && (
                                <span className="absolute bottom-1 w-1 h-1 bg-blue-600 rounded-full" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <button 
                  type="submit" 
                  className="w-full bg-emerald-600 text-white p-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-100 active:scale-95 transition-all flex items-center justify-center gap-3 mt-4"
                >
                   সিরিয়াল পাঠান <ArrowRight size={16} />
                </button>
                
                <p className="text-[9px] text-slate-400 text-center font-bold uppercase tracking-tight">
                  * তথ্যগুলো পাঠানোর পর আমরা আপনার সাথে যোগাযোগ করব।
                </p>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

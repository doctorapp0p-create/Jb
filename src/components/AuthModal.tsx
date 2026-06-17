import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, Phone, LogIn, UserPlus, ShieldAlert, Chrome } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  authMode: 'login' | 'register' | 'moderator';
  setAuthMode: (mode: 'login' | 'register' | 'moderator') => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onGoogleLogin: () => void;
  isProcessing: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  authMode,
  setAuthMode,
  onSubmit,
  onGoogleLogin,
  isProcessing
}) => {
  const [isRuralDoctor, setIsRuralDoctor] = React.useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal content cardboard container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative bg-white w-full max-w-md rounded-[36px] overflow-hidden border border-slate-100 shadow-2xl z-10 flex flex-col p-6 sm:p-8"
        >
          {/* Close button icon */}
          <button
            onClick={onClose}
            className="absolute right-6 top-6 w-9 h-9 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer transition-all active:scale-90"
          >
            <X size={16} />
          </button>

          {/* Title Area */}
          <div className="mb-6 space-y-1 pr-8">
            <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase">
              {authMode === 'login' ? 'অ্যাকাউন্টে প্রবেশ করুন' : authMode === 'register' ? 'নতুন অ্যাকাউন্ট খুলুন' : 'মডারেটর লগইন'}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {authMode === 'login' ? 'আপনার পূর্বে তৈরি অ্যাকাউন্ট দিয়ে লগইন করুন' : authMode === 'register' ? 'সহজেই নতুন প্রোফাইল তৈরি করুন' : 'মডপারেটর ও অ্যাডমিন পোর্টাল অ্যাক্সেস'}
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 bg-slate-50 p-1.5 rounded-2xl mb-6">
            <button
              onClick={() => { if (!isProcessing) setAuthMode('login'); }}
              disabled={isProcessing}
              className={`py-3 text-[10px] uppercase font-black tracking-widest rounded-xl transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-105'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              লগইন করুন
            </button>
            <button
              onClick={() => { if (!isProcessing) setAuthMode('register'); }}
              disabled={isProcessing}
              className={`py-3 text-[10px] uppercase font-black tracking-widest rounded-xl transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-white text-blue-600 shadow-sm border border-slate-105'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              রেজিস্ট্রেশন
            </button>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-4">
            {authMode === 'register' && (
              <>
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-2xl mb-4 text-left">
                  <input 
                    type="checkbox" 
                    id="isRuralDoctor" 
                    name="isRuralDoctor"
                    checked={isRuralDoctor}
                    onChange={(e) => setIsRuralDoctor(e.target.checked)}
                    className="accent-blue-600 rounded cursor-pointer"
                  />
                  <label htmlFor="isRuralDoctor" className="text-[10px] font-black text-blue-700 cursor-pointer select-none uppercase tracking-wider">
                    আমি একজন পল্লী চিকিৎসক (প্রতিনিধি পিন প্রয়োজন)
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">পূর্ণ নাম</label>
                  <div className="relative">
                    <input
                      name="fullName"
                      type="text"
                      required
                      placeholder={isRuralDoctor ? "যেমন: ডাঃ আব্দুর রহমান (ডাক্তার হিসেবে নাম)" : "যেমন: মোঃ সাব্বির হোসাইন"}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pl-11 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-850 h-[48px]"
                    />
                    <User size={14} className="text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">মোবাইল নাম্বার</label>
                  <div className="relative">
                    <input
                      name="phone"
                      type="tel"
                      required
                      placeholder="যেমন: ০১xxxxxxxxx"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pl-11 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-850 h-[48px]"
                    />
                    <Phone size={14} className="text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {isRuralDoctor ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">চিকিৎসক কোড</label>
                      <input
                        name="ruralDoctorCode"
                        type="text"
                        required
                        placeholder="যেমন: RD001"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-850 h-[48px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">প্রতিনিধি পিন</label>
                      <input
                        name="representativePin"
                        type="password"
                        required
                        placeholder="••••"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-850 h-[48px]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">কোন পল্লী চিকিৎসকের রেফার কোড (ঐচ্ছিক)</label>
                    <input
                      name="referredByCode"
                      type="text"
                      defaultValue={localStorage.getItem('prefilled_referral_code') || ""}
                      placeholder="যেমন: RD001"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-850 h-[48px]"
                    />
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">
                {authMode === 'moderator' ? 'মডারেটর ইউজারনেম' : 'ইমেইল এড্রেস'}
              </label>
              <div className="relative">
                <input
                  name="email"
                  type={authMode === 'moderator' ? 'text' : 'email'}
                  required
                  placeholder={authMode === 'moderator' ? 'ইউজারনেম দিন...' : 'যেমন: info@nilpha.com'}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pl-11 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-850 h-[48px]"
                />
                {authMode === 'moderator' ? (
                  <ShieldAlert size={14} className="text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                ) : (
                  <Mail size={14} className="text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">পাসওয়ার্ড</label>
              <div className="relative">
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 pl-11 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-850 h-[48px]"
                />
                <Lock size={14} className="text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-blue-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer"
            >
              {isProcessing ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <>
                  {authMode === 'login' ? <LogIn size={14} /> : authMode === 'register' ? <UserPlus size={14} /> : <ShieldAlert size={14} />}
                  {authMode === 'login' ? 'লগইন করুন' : authMode === 'register' ? 'অ্যাকাউন্ট তৈরি করুন' : 'মডারেটর প্রবেশ'}
                </>
              )}
            </button>
          </form>

          {/* Social Sign-in divider except for moderator */}
          {authMode !== 'moderator' && (
            <>
              <div className="relative my-6 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100" />
                </div>
                <span className="relative bg-white px-3 text-[9px] font-black uppercase text-slate-300 tracking-wider">অথবা অন্য উপায়ে</span>
              </div>

              <button
                type="button"
                onClick={onGoogleLogin}
                disabled={isProcessing}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 py-3.5 px-4 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 border border-slate-100 shadow-sm cursor-pointer"
              >
                <Chrome size={14} className="text-red-500 stroke-[2.5]" />
                গুগল দিয়ে লগইন
              </button>
            </>
          )}

          {/* Secret Moderator Trigger */}
          {authMode !== 'moderator' && (
            <div className="mt-6 text-center">
              <button
                onClick={() => setAuthMode('moderator')}
                className="text-[9px] font-black uppercase text-slate-300 hover:text-blue-500 tracking-wider hover:underline bg-transparent border-none cursor-pointer"
              >
                🔒 মডারেটর লগইন পোর্টাল
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

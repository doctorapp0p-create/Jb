
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MessageSquare, User, Calendar, MapPin, Phone, Activity, ArrowRight } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctorName: string;
  doctorSpecialty: string;
  hotline: string;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, doctorName, doctorSpecialty, hotline }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    address: '',
    problem: '',
    date: '',
    phone: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = `*নতুন সিরিয়াল বুকিং*\n\nডাক্তার: ${doctorName}\nবিশেষজ্ঞ: ${doctorSpecialty}\n------------------\nরোগীর নাম: ${formData.name}\nবয়স: ${formData.age}\nবাসা: ${formData.address}\nকি সমস্যা: ${formData.problem}\nকবে দেখাবে: ${formData.date}\nফোন নাম্বার: ${formData.phone}\n------------------\nNilpha.com এর মাধ্যমে পাঠানো হয়েছে।`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/88${hotline}?text=${encodedMessage}`, '_blank');
    onClose();
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
                  <input 
                    required 
                    value={formData.date} 
                    onChange={e => setFormData({...formData, date: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                    placeholder="তারিখ বা দিন"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-400 ml-1">
                    <Phone size={12} className="text-blue-500" /> ফোন নাম্বার
                  </label>
                  <input 
                    required 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                    placeholder="মোবাইল নাম্বার"
                  />
                </div>
              </div>
              
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

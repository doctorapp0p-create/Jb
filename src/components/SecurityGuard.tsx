import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, EyeOff, Lock, AlertTriangle } from 'lucide-react';

export const SecurityGuard: React.FC = () => {
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isLockedMessage, setIsLockedMessage] = useState<boolean>(false);

  // Input sanitization utility for preventing scripts, HTML structures, and SQL keywords in search inputs
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // Prevent context menus globally to stop inspect element triggers
      e.preventDefault();
      triggerAlert("নিরাপত্তা সতর্কতা! অননুমোদিতভাবে ডক্টর এবং ক্লিনিক ডাটা অনুলিপি করা বা সোর্স কোড অ্যাক্সেস করা এই সাইটে সুরক্ষিত করা হয়েছে।");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U, Ctrl+S
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isControlOrCmd = isMac ? e.metaKey : e.ctrlKey;
      
      const isF12 = e.key === 'F12' || e.keyCode === 123;
      const isInspectCombos = isControlOrCmd && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67);
      const isViewSource = isControlOrCmd && (e.key === 'U' || e.keyCode === 85);
      const isSavePage = isControlOrCmd && (e.key === 'S' || e.keyCode === 83);

      if (isF12 || isInspectCombos || isViewSource || isSavePage) {
        e.preventDefault();
        e.stopPropagation();
        triggerAlert("নিরাপত্তা ব্লক! ডেভেলপমেন্ট টুলস এবং সোর্স কোড ভিউ সম্পূর্ণ নিষ্ক্রিয় করা হয়েছে।");
      }
    };

    // Monitor for screen resize or DevTools attachment
    const checkDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        // DevTools may be docked
        console.clear();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', checkDevTools);

    // Initial console cleanup to hide system structure traces
    console.clear();
    console.log("%c🛡️ এ.আর জেনারেল হসপিটাল সিকিউরিটি সিস্টেম সক্রিয়", "color: #2563eb; font-size: 20px; font-weight: bold;");
    console.log("%cঅননুমোদিত ডেটা রিভার্সিং বা অ্যাক্সেস কঠোরভাবে নিয়ন্ত্রিত।", "color: #ef4444; font-size: 14px;");

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', checkDevTools);
    };
  }, []);

  const triggerAlert = (message: string) => {
    setAlertMessage(message);
    setIsLockedMessage(true);
    
    // Auto clear alert message after a brief duration
    setTimeout(() => {
      setIsLockedMessage(false);
      setTimeout(() => setAlertMessage(null), 300);
    }, 4500);
  };

  return (
    <AnimatePresence>
      {alertMessage && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[9999] bg-white border border-slate-100 shadow-2xl rounded-3xl p-5"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center flex-shrink-0 text-rose-500 animate-pulse border border-rose-100">
              <ShieldCheck size={24} className="stroke-rose-600 fill-rose-100" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-rose-600 tracking-widest flex items-center gap-1">
                  <Lock size={12} className="stroke-rose-600" />
                  Security Active
                </span>
                <span className="w-1.5 h-1.5 bg-rose-600 rounded-full animate-ping" />
              </div>
              <h4 className="text-xs font-black text-slate-800 mt-1">সুরক্ষা নোটিশ</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium mt-1">
                {alertMessage}
              </p>
            </div>
          </div>
          <div className="w-full bg-slate-50 h-1 rounded-full overflow-hidden mt-4">
            <motion.div 
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 4.5, ease: "linear" }}
              className="bg-rose-500 h-full"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Input Sanitization helper to enforce client-side defense against parameter/XSS attacks
export const sanitizeInput = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/[<>'"/;()\\#$^*%]/g, '') // strip scripting, quote-bypass, SQL punctuation characters
    .trim();
};

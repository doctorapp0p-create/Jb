import React, { useState, useMemo } from 'react';
import { LAB_TEST_ITEMS, LabTestItem } from '../data/labTestData';
import { Search, ShoppingCart, Percent, Share2, Trash2, CheckCircle2, RotateCcw, User, Phone, Plus, Minus, Tag, FileText, Building, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CLINICS } from '../../constants';

interface AdminLabBillBuilderProps {
  hospitals?: { id: string; name: string; address?: string }[];
}

export const AdminLabBillBuilder: React.FC<AdminLabBillBuilderProps> = ({ hospitals }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [basket, setBasket] = useState<LabTestItem[]>([]);
  
  // Patient details state
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAddress, setPatientAddress] = useState('');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');
  const [discountType, setDiscountType] = useState<'percent' | 'taka'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(0);

  const hospitalsList = useMemo(() => {
    return hospitals && hospitals.length > 0 ? hospitals : CLINICS;
  }, [hospitals]);

  const categories = ['All', 'Haematology & Hormone', 'Ultrasonogram', 'X-Ray'];

  // Input filtering
  const filteredItems = useMemo(() => {
    return LAB_TEST_ITEMS.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  // Toggle basket state
  const handleToggleBasket = (item: LabTestItem) => {
    const exists = basket.some(b => b.id === item.id);
    if (exists) {
      setBasket(basket.filter(b => b.id !== item.id));
    } else {
      setBasket([...basket, item]);
    }
  };

  const handleClearAll = () => {
    setBasket([]);
    setPatientName('');
    setPatientPhone('');
    setPatientAddress('');
    setDiscountValue(0);
    setSelectedHospitalId('');
  };

  // Convert numbers to Bengali digits
  const toBn = (num: number | string): string => {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/[0-9]/g, (w) => banglaDigits[parseInt(w)]);
  };

  // Calculations
  const subTotal = useMemo(() => {
    return basket.reduce((acc, item) => acc + item.price, 0);
  }, [basket]);

  const discountAmount = useMemo(() => {
    if (discountType === 'percent') {
      return Math.round((subTotal * discountValue) / 100);
    }
    return Math.min(discountValue, subTotal);
  }, [subTotal, discountValue, discountType]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subTotal - discountAmount);
  }, [subTotal, discountAmount]);

  // Share template on WhatsApp
  const handleShareWhatsApp = () => {
    if (basket.length === 0) {
      alert("অনুগ্রহ করে অন্তত একটি টেস্ট নির্বাচন করুন।");
      return;
    }

    const selectedHospital = hospitalsList.find(h => h.id === selectedHospitalId);
    const hospitalNameStr = selectedHospital ? selectedHospital.name : 'এ.আর জেনারেল হসপিটাল';
    let messageHead = `*🏥 ${hospitalNameStr}*\n*ল্যাব টেস্ট ও ডায়াগনস্টিক রিপোর্ট এস্টিমেট*\n`;
    if (patientName.trim()) {
      messageHead += `\n👤 *রোগীর নাম:* ${patientName.trim()}`;
    }
    if (patientPhone.trim()) {
      messageHead += `\n📞 *যোগাযোগ:* ${patientPhone.trim()}`;
    }
    if (patientAddress.trim()) {
      messageHead += `\n📍 *ঠিকানা:* ${patientAddress.trim()}`;
    }
    
    messageHead += `\n📅 *তারিখ:* ${new Date().toLocaleDateString('bn-BD')}\n`;
    messageHead += `\n📋 *নির্বাচিত পরীক্ষা সমূহ:* \n`;

    const messageBody = basket.map((item, idx) => {
      return `${toBn(idx + 1)}. ${item.name} — ৳${toBn(item.price)}`;
    }).join('\n');

    let messageFoot = `\n\n-------------------------------\n`;
    messageFoot += `💵 *মোট টেস্ট ফি:* ৳${toBn(subTotal)}\n`;
    if (discountAmount > 0) {
      messageFoot += `🎁 *ডিসকাউন্ট (${discountType === 'percent' ? toBn(discountValue) + '%' : '৳' + toBn(discountValue)}):* -৳${toBn(discountAmount)}\n`;
    }
    messageFoot += `👉 *সর্বমোট প্রদেয় বিল:* *৳${toBn(grandTotal)}*\n`;
    messageFoot += `-------------------------------\n\n`;
    messageFoot += `📢 *বিশেষ সতর্কতা:* ডিজিটাল অ্যাপয়েন্টমেন্ট অথবা ওয়েবসাইটের মাধ্যমে বুকিং করলে বিশেষ ছাড় ও অগ্রাধিকার পাওয়া যাবে।\n\n`;
    messageFoot += `💬 *সিরিয়াল ও যোগাযোগের জন্য কল করুন:* ০১৫১৮৩৯৫৭৭২\n`;
    messageFoot += `🌐 *ভিজিট করুন:* https://nilpha.com`;

    const fullMessage = messageHead + messageBody + messageFoot;
    const encoded = encodeURIComponent(fullMessage);
    
    // Normalize target phone number if provided or fallback to hotline
    const targetPhone = patientPhone.replace(/\D/g, '');
    let waUrl = `https://wa.me/?text=${encoded}`;
    
    if (targetPhone.length >= 10) {
      let formattedPhone = targetPhone;
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '88' + formattedPhone;
      } else if (!formattedPhone.startsWith('88')) {
        formattedPhone = '880' + formattedPhone;
      }
      waUrl = `https://wa.me/${formattedPhone}?text=${encoded}`;
    }

    window.open(waUrl, '_blank');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Welcome Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm animate-in fade-in duration-300">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100">
            <FileText size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-800 uppercase tracking-tight">ল্যাব টেস্ট বিল ও এস্টিমেট মেকার</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">সহজে টেস্ট সিলেক্ট করে ও ডিসকাউন্ট দিয়ে হোয়াটসঅ্যাপ শেয়ার করুন</p>
          </div>
        </div>
        <div className="flex gap-2">
          {basket.length > 0 && (
            <button 
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-black text-rose-600 bg-rose-50 border border-rose-100 hover:bg-rose-100/70 active:scale-95 transition-all rounded-xl cursor-pointer"
            >
              <RotateCcw size={12} />
              সব মুছুন
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Test Selector Database UI */}
        <div className="lg:col-span-7 bg-white p-6 rounded-[36px] border border-slate-100 shadow-xl space-y-5">
          
          {/* Quick Search */}
          <div className="relative">
            <input 
              type="text" 
              placeholder="টেস্ট বা পরীক্ষার নাম দিয়ে খুঁজুন..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-11 pr-4 text-xs font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 placeholder-slate-400 transition-all text-slate-800"
            />
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          {/* Category Badges Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex-shrink-0 ${
                  selectedCategory === cat 
                    ? 'bg-blue-600 border border-blue-600 text-white shadow-lg shadow-blue-100' 
                    : 'bg-slate-50 border border-slate-100 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                }`}
              >
                {cat === 'All' ? 'সব ধরণের' : cat === 'Haematology & Hormone' ? 'রক্ত ও হরমোন' : cat === 'Ultrasonogram' ? 'আল্ট্রাসোনোগ্রাম' : 'এক্স-রে'}
              </button>
            ))}
          </div>

          {/* Tests Grid Container */}
          <div className="max-h-[500px] overflow-y-auto no-scrollbar pr-1 border border-slate-50 rounded-2xl p-2 bg-slate-50/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredItems.map((item) => {
                const isSelected = basket.some(b => b.id === item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => handleToggleBasket(item)}
                    className={`p-3.5 rounded-2xl text-left transition-all border outline-none active:scale-[0.98] ${
                      isSelected 
                        ? 'bg-blue-50/60 border-blue-400 shadow-md shadow-blue-100/30' 
                        : 'bg-white border-slate-100/80 hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md tracking-wide uppercase ${
                          item.category === 'Haematology & Hormone' ? 'bg-red-50 text-red-600' : item.category === 'Ultrasonogram' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {item.category === 'Haematology & Hormone' ? 'রক্ত' : item.category === 'Ultrasonogram' ? 'USG' : 'X-Ray'}
                        </span>
                        <h4 className="text-xs font-black text-slate-700 mt-2 line-clamp-1">{item.name}</h4>
                      </div>
                      
                      <div className="text-right">
                        <span className="text-[11px] font-black text-slate-800">৳{toBn(item.price)}</span>
                        <div className="mt-2 flex justify-end">
                          {isSelected ? (
                            <CheckCircle2 size={16} className="text-blue-600 stroke-[3]" />
                          ) : (
                            <Plus size={14} className="text-slate-400 group-hover:text-blue-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}

              {filteredItems.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-400">
                  <span className="text-2xl">🔍</span>
                  <p className="text-xs font-bold mt-2">কোনো টেস্ট খুঁজে পাওয়া যায়নি!</p>
                </div>
              )}
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-bold text-center uppercase tracking-wider bg-slate-50 py-3 rounded-2xl border border-slate-100">
            মোট পরীক্ষার সংখ্যা: {toBn(LAB_TEST_ITEMS.length)} টি
          </div>

        </div>

        {/* Right Side: Active Billing Basket Summary */}
        <div className="lg:col-span-5 bg-white p-6 rounded-[36px] border border-slate-100 shadow-xl space-y-6 relative overflow-hidden">
          
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <ShoppingCart size={16} className="stroke-[2.5]" />
              </div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight">বিল এস্টিমেট বাস্কেট</h3>
            </div>
            <span className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full">
              {toBn(basket.length)} টি
            </span>
          </div>

          {basket.length === 0 ? (
            <div className="text-center py-16 space-y-4">
              <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <ShoppingCart size={24} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider">বাস্কেট খালি আছে</p>
                <p className="text-[9px] text-slate-400 font-bold leading-relaxed max-w-[220px] mx-auto mt-1">বামদিকের লিস্ট থেকে এক বা একাধিক টেস্টের উপর ক্লিক করে এখানে অ্যাড করুন।</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Selected Tests Mini-List */}
              <div className="max-h-[180px] overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
                {basket.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-slate-50 hover:bg-slate-100/50 border border-slate-100/50 p-2.5 rounded-xl transition-all">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-[11px] font-black text-slate-700 truncate">{item.name}</p>
                      <p className="text-[9px] font-bold text-slate-400">{item.category}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-slate-800">৳{toBn(item.price)}</span>
                      <button 
                        onClick={() => handleToggleBasket(item)}
                        className="text-slate-400 hover:text-rose-600 transition-all active:scale-90"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Patient Details Input */}
              <div className="space-y-3 bg-slate-50/50 p-4 rounded-3xl border border-slate-100/80">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">রোগী ও সেন্টারের তথ্য (ঐচ্ছিক)</h4>
                
                <div className="space-y-2.5">
                  {/* Clinic/Hospital Name Selector */}
                  <div className="relative">
                    <select
                      value={selectedHospitalId}
                      onChange={(e) => setSelectedHospitalId(e.target.value)}
                      className="w-full bg-white border border-slate-150 rounded-xl py-2.5 pl-9 pr-8 text-xs font-bold outline-none focus:border-blue-500 text-slate-800 appearance-none cursor-pointer"
                    >
                      <option value="">-- হসপিটাল বা ডায়াগনস্টিক সেন্টার --</option>
                      {hospitalsList.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name}
                        </option>
                      ))}
                    </select>
                    <Building size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                      </svg>
                    </div>
                  </div>

                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="রোগীর নাম" 
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full bg-white border border-slate-150 rounded-xl py-2.5 pl-9 pr-3 text-xs font-bold outline-none focus:border-blue-500 placeholder-slate-400 text-slate-800"
                    />
                    <User size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  
                  <div className="relative">
                    <input 
                      type="tel" 
                      placeholder="হোয়াটসঅ্যাপ নম্বর (যেমন: 01xxxxxxxxx)" 
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      className="w-full bg-white border border-slate-150 rounded-xl py-2.5 pl-9 pr-3 text-xs font-bold outline-none focus:border-blue-500 placeholder-slate-400 text-slate-800"
                    />
                    <Phone size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>

                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="রোগীর ঠিকানা (যেমন: রাজারহাট, কুড়িগ্রাম)" 
                      value={patientAddress}
                      onChange={(e) => setPatientAddress(e.target.value)}
                      className="w-full bg-white border border-slate-150 rounded-xl py-2.5 pl-9 pr-3 text-xs font-bold outline-none focus:border-blue-500 placeholder-slate-400 text-slate-800"
                    />
                    <MapPin size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Discount Calculator */}
              <div className="space-y-3 bg-blue-50/30 p-4 rounded-3xl border border-blue-100/30">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest pl-1 flex items-center gap-1">
                    <Tag size={12} /> ডিসকাউন্ট ও ছাড় অফার
                  </h4>
                  
                  {/* Selector Type */}
                  <div className="bg-white border rounded-lg p-0.5 flex gap-0.5">
                    <button 
                      type="button"
                      onClick={() => { setDiscountType('percent'); setDiscountValue(0); }}
                      className={`px-2 py-1 text-[8px] font-extrabold rounded-md cursor-pointer ${discountType === 'percent' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                    >
                      % শতকরা
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setDiscountType('taka'); setDiscountValue(0); }}
                      className={`px-2 py-1 text-[8px] font-extrabold rounded-md cursor-pointer ${discountType === 'taka' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                    >
                      ৳ টাকা
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max={discountType === 'percent' ? 100 : subTotal}
                    value={discountValue || ''}
                    onChange={(e) => setDiscountValue(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder={discountType === 'percent' ? "কত পার্সেন্ট ছাড়? (যেমন: ২০)" : "কত টাকা ছাড়? (যেমন: ৫০০)"}
                    className="flex-1 bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold outline-none focus:border-blue-500 text-slate-800"
                  />
                  <div className="w-12 h-10 bg-white border rounded-xl flex items-center justify-center text-slate-500 text-xs font-black">
                    {discountType === 'percent' ? '%' : '৳'}
                  </div>
                </div>
              </div>

              {/* Bill Details Calculation Display */}
              <div className="bg-slate-50 border border-slate-100/60 p-5 rounded-[28px] space-y-3 shadow-inner">
                {selectedHospitalId && (
                  <div className="flex justify-between items-center text-xs font-bold text-blue-600 animate-in fade-in">
                    <span>পরীক্ষা সেন্টার</span>
                    <span className="truncate max-w-[200px] font-black text-right">{hospitalsList.find(h => h.id === selectedHospitalId)?.name}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                  <span>মোট বিল ফি</span>
                  <span>৳{toBn(subTotal)}</span>
                </div>
                
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-xs font-bold text-rose-500 animate-in fade-in">
                    <span>বিশেষ ডিসকাউন্ট</span>
                    <span>-৳{toBn(discountAmount)}</span>
                  </div>
                )}

                <div className="h-px bg-slate-200/60 my-1" />

                <div className="flex justify-between items-center text-sm font-black text-slate-800">
                  <span className="uppercase text-[11px] tracking-wider text-slate-500">সর্বমোট প্রদেয়</span>
                  <span className="text-lg text-blue-600">৳{toBn(grandTotal)}</span>
                </div>
              </div>

              {/* Share Button Trigger */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white p-4.5 rounded-[24px] font-black text-[11px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-[0.97] transition-all flex items-center justify-center gap-2 border-b-4 border-emerald-700 cursor-pointer"
              >
                <Share2 size={14} className="stroke-[2.5]" />
                হোয়াটসঅ্যাপে শেয়ার করুন
              </button>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

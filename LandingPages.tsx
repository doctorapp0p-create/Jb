
import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { DOCTORS, CLINICS, SPECIALTIES, DISTRICTS } from './constants';
import SEO from './SEO';
import { motion } from 'motion/react';
import { Stethoscope, MapPin, Clock, Phone, Star, ArrowRight, Microscope, ShieldCheck, Heart, User, Home, ChevronRight, MessageSquare, Search, Calendar } from 'lucide-react';
import { slugify } from './utils';
import { BookingModal } from './src/components/BookingModal';

const HOTLINE = "01352669100";

// --- Components ---

export const SEOFooter: React.FC = () => (
    <footer className="mt-20 border-t border-slate-100 bg-white p-12 text-center space-y-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <Link to="/districts/nilphamari" className="hover:text-blue-600 transition-colors">Nilphamari Doctors</Link>
          <Link to="/specialists/medicine" className="hover:text-blue-600 transition-colors">Medicine</Link>
          <Link to="/specialists/gynecology" className="hover:text-blue-600 transition-colors">Gynecology</Link>
          <Link to="/specialists/cardiology" className="hover:text-blue-600 transition-colors">Cardiology</Link>
          <Link to="/specialists/pediatrics" className="hover:text-blue-600 transition-colors">Pediatrics</Link>
        </div>
        <div className="h-px bg-slate-50 w-20 mx-auto" />
        <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em] leading-relaxed">
          Nilpha.com - Nilphamari's Trusted Medical Directory <br/>
          নীলফামারীর বিশ্বস্ত ডক্টর ডিরেক্টরি ও অনলাইন সিরিয়াল সার্ভিস।
        </p>
        <div className="flex justify-center gap-4 opacity-20">
           <Heart size={16} className="text-red-500" />
           <ShieldCheck size={16} className="text-blue-600" />
           <MessageSquare size={16} className="text-emerald-500" />
        </div>
      </div>
    </footer>
);

export const Breadcrumbs: React.FC<{ items: { label: string, link?: string }[] }> = ({ items }) => (
  <nav className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400 py-4 px-6 overflow-x-auto no-scrollbar whitespace-nowrap">
    <Link to="/" className="hover:text-blue-600 flex items-center gap-1.5"><Home size={10} /> Home</Link>
    {items.map((item, i) => (
      <React.Fragment key={i}>
        <ChevronRight size={8} />
        {item.link ? (
          <Link to={item.link} className="hover:text-blue-600">{item.label}</Link>
        ) : (
          <span className="text-slate-900">{item.label}</span>
        )}
      </React.Fragment>
    ))}
  </nav>
);

// --- Helpers ---
const checkDay = (docSchedule: string, day: string) => {
  const s = (docSchedule || '')
    .toLowerCase()
    .replace(/[\u2013\u2014-]/g, '-')
    .replace(/\s+/g, '')
    .replace(/থেকে/g, '-');

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

  // 2. Check for Ranges
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

  // 4. Handle Friday Closed
  const isFridayClosed = s.includes('শুক্র') && (s.includes('বন্ধ') || s.includes('অফ') || s.includes('close'));
  if (isFridayClosed) {
    activeDays.delete('শুক্র');
  }

  // 5. Default fallback
  if (activeDays.size === 0) {
    return true;
  }

  return activeDays.has(searchShort);
};

// --- Doctor Profile Page ---
export const DoctorProfilePage: React.FC = () => {
  const { slug } = useParams();
  const [showBookingModal, setShowBookingModal] = React.useState(false);
  const doctor = DOCTORS.find(d => slugify(d.name) === slug || d.id === slug);

  if (!doctor) return <div className="p-20 text-center font-black uppercase text-slate-400">Doctor Not Found</div>;

  const clinic = CLINICS.find(c => c.id === doctor.clinics[0]);
  const specialty = SPECIALTIES.find(s => s.id === doctor.specialty.toLowerCase());
  const doctorSlug = slugify(doctor.name);

  // Physician Schema
  const physSchema = {
    "@context": "https://schema.org",
    "@type": "Physician",
    "name": doctor.name,
    "medicalSpecialty": doctor.specialty,
    "description": doctor.degree,
    "url": `https://nilpha.com/doctors/${doctorSlug}`,
    "telephone": `+88${HOTLINE}`,
    "image": doctor.image,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": clinic?.address || doctor.districts[0],
      "addressLocality": doctor.districts[0],
      "addressCountry": "BD"
    },
    "worksFor": {
      "@type": "Hospital",
      "name": clinic?.name || "Nilpha Network"
    }
  };

  // FAQ Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `How do I book an appointment with ${doctor.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `You can book an appointment with ${doctor.name} by calling our hotline ${HOTLINE} or using the Nilpha.com booking system. সিরিয়ালের জন্য সরাসরি কল করুন ${HOTLINE} নম্বরে।`
        }
      },
      {
        "@type": "Question",
        "name": `Where does ${doctor.name} see patients?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${doctor.name} sees patients at ${clinic?.name || "various clinics"} in ${doctor.districts.join(', ')}. ${doctor.name} বর্তমানে ${clinic?.name || 'চেম্বারে'} নিয়মিত রোগী দেখছেন।`
        }
      },
      {
        "@type": "Question",
        "name": `What is the consultation fee of ${doctor.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `The consultation fee for ${doctor.name} is BDT ${doctor.consultationFee}. ${doctor.name}-এর কনসালটেশন ফি ${doctor.consultationFee} টাকা।`
        }
      },
      {
        "@type": "Question",
        "name": `Is online booking available for ${doctor.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Yes, you can book ${doctor.name} serial online through Nilpha.com platform. হ্যাঁ, আপনি ঘরে বসেই নীলফা ডট কমের মাধ্যমে সিরিয়াল দিতে পারেন।`
        }
      },
      {
        "@type": "Question",
        "name": `What is the specialty of ${doctor.name}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `${doctor.name} is a specialist in ${doctor.specialty}. ${doctor.name} একজন দক্ষ ${specialty?.bnName || doctor.specialty} বিশেষজ্ঞ।`
        }
      }
    ]
  };

  // Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://nilpha.com" },
      { "@type": "ListItem", "position": 2, "name": "Doctors", "item": "https://nilpha.com/doctors" },
      { "@type": "ListItem", "position": 3, "name": doctor.specialty, "item": `https://nilpha.com/specialists/${doctor.specialty.toLowerCase()}` },
      { "@type": "ListItem", "position": 4, "name": doctor.name, "item": `https://nilpha.com/doctors/${doctorSlug}` }
    ]
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <SEO 
        title={`${doctor.name} | ${doctor.specialty} in ${doctor.districts[0]} | Nilpha`}
        description={`Book an appointment with ${doctor.name}, a leading ${doctor.specialty} in ${clinic?.name || 'Nilphamari'}, ${doctor.districts[0]}. Find doctor profile, chamber address, visiting hours, and consultation fee. | নীলফামারীতে ${specialty?.bnName || doctor.specialty} বিশেষজ্ঞ ${doctor.name}-এর চেম্বারের ঠিকানা, সিরিয়াল ও অ্যাপয়েন্টমেন্ট তথ্য। বিস্তারিত জানুন Nilpha.com-এ।`}
        keywords={[
          doctor.name, 
          doctor.specialty, 
          clinic?.name || '', 
          'Nilphamari Doctor', 
          'নীলফামারীর ডাক্তার', 
          'Best Doctor in Nilphamari', 
          specialty?.bnName || '',
          'নীলফামারী ডাক্তার লিস্ট',
          'ডক্টর কুটুম নীলফামারী',
          'Doctor Kutum',
          'Nilphamari Medical Directory',
          'সিরিয়াল কন্টাক্ট',
          'Doctor Appoinment Nilphamari'
        ]}
        ogImage={doctor.image}
        ogUrl={`/doctors/${doctorSlug}`}
        ogType="profile"
        canonical={`/doctors/${doctorSlug}`}
        schemas={[physSchema, faqSchema, breadcrumbSchema]}
      />

      <Breadcrumbs items={[
        { label: 'Doctors', link: '/doctors' },
        { label: doctor.specialty, link: `/specialists/${doctor.specialty.toLowerCase()}` },
        { label: doctor.name }
      ]} />

      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200 border border-slate-100 flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-100 blur-2xl rounded-full scale-110 opacity-50" />
            <img src={doctor.image} alt={`${doctor.name} - ${doctor.specialty} Specialist`} className="w-32 h-32 rounded-[48px] object-cover relative border-4 border-white shadow-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">{doctor.name}</h1>
            <p className="text-blue-600 font-black text-[10px] uppercase tracking-widest mt-1 italic">{doctor.specialty} Specialist</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
               <div className="bg-slate-100 px-3 py-1.5 rounded-xl text-[9px] font-black text-slate-600 uppercase flex items-center gap-1.5">
                  <MapPin size={12} className="text-blue-500" /> {clinic?.name || 'চেম্বার'}
               </div>
               <div className="bg-rose-50 px-3 py-1.5 rounded-xl text-[9px] font-black text-rose-600 uppercase flex items-center gap-1.5">
                  <Clock size={12} /> {doctor.schedule}
               </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 font-bold leading-relaxed italic max-w-sm">{doctor.degree}</p>
          <div className="flex gap-4 pt-2">
            <div className="flex items-center gap-1.5 bg-yellow-50 text-yellow-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-tight">
              <Star size={12} fill="currentColor" /> {doctor.rating} Rating
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-tight">
              <ShieldCheck size={12} /> Verified Specialist
            </div>
          </div>
        </motion.div>

        <section className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 space-y-6">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
            <MapPin size={18} className="text-blue-600" /> {doctor.name} Chamber Address & Fees
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4">
               <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 shrink-0"><MapPin size={20} /></div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinic / Hospital</p>
                  <Link to={`/hospitals/${clinic ? slugify(clinic.name) : 'general'}`} className="text-xs font-black text-slate-800 hover:text-blue-600 transition-colors">{clinic?.name || "Available on request"}</Link>
                  <p className="text-[10px] text-slate-500 mt-0.5">{clinic?.address}</p>
               </div>
            </div>
            <div className="flex gap-4">
               <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 shrink-0"><Clock size={20} /></div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visiting Schedule</p>
                  <p className="text-xs font-black text-slate-800">{doctor.schedule}</p>
               </div>
            </div>
            <div className="flex gap-4">
               <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 shrink-0 text-emerald-600"><Microscope size={20} /></div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consultation Fee</p>
                  <p className="text-xs font-black text-emerald-600">৳{doctor.consultationFee}</p>
               </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 space-y-6">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
             <Calendar size={18} className="text-blue-600" /> পরিদর্শনের দিনসমূহ (Visiting Days)
          </h2>
          <div className="flex flex-wrap gap-2">
             {['শনিবার', 'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার'].map(day => {
               // Check availability based on Bengali weekday names
               const isAvailable = checkDay(doctor.schedule, day);
               return (
                  <div key={day} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tight border-2 transition-all ${isAvailable ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm' : 'bg-slate-50 text-slate-300 border-slate-50 opacity-50'}`}>
                     {day}
                  </div>
               );
             })}
          </div>
        </section>

        <section className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 space-y-6">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
             <User size={18} className="text-blue-600" /> Medical Qualification of {doctor.name}
          </h2>
          <div className="p-5 bg-slate-50 rounded-[32px] border border-slate-100">
             <p className="text-xs text-slate-700 font-medium leading-relaxed italic">{doctor.degree}</p>
          </div>
        </section>

        <section className="bg-blue-600 rounded-[40px] p-8 text-white space-y-6 shadow-xl shadow-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest">Quick Appointment</h2>
              <p className="text-[10px] opacity-70 font-medium">সিরিয়ালের জন্য এখনই কল করুন</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Phone size={24} />
            </div>
          </div>
          <a href={`tel:${HOTLINE}`} className="block bg-white text-blue-600 p-5 rounded-3xl text-center font-black text-lg tracking-widest active:scale-95 transition-all shadow-lg">
            {HOTLINE}
          </a>
          <button 
            onClick={() => setShowBookingModal(true)}
            className="w-full bg-emerald-600 text-white p-5 rounded-3xl text-center font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
             <MessageSquare size={18} /> অনলাইনে সিরিয়াল দিন
          </button>
        </section>

        <BookingModal 
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          doctorName={doctor.name}
          doctorSpecialty={doctor.specialty}
          hotline={HOTLINE}
        />
        
        {/* FAQs Section */}
        <section className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 space-y-6">
           <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">FAQ about {doctor.name}</h2>
           <div className="space-y-6">
              {[
                { q: `${doctor.name}-এর অ্যাপয়েন্টমেন্ট কীভাবে নেব?`, a: `Nilpha.com এর মাধ্যমে অথবা আমাদের হটলাইন ${HOTLINE} এ কল করে আপনি সিরিয়াল নিশ্চিত করতে পারেন।` },
                { q: `${doctor.name} কোথায় প্রাকটিস করেন?`, a: `${doctor.name} বর্তমানে ${clinic?.name || "বিভিন্ন ক্লিনিকে"} নিয়মিত চেম্বার করছেন।` },
                { q: `What is the visiting hour?`, a: `${doctor.name} is available: ${doctor.schedule}` },
                { q: `${doctor.name} এর সিরিয়াল নম্বর কত?`, a: `সিরিয়াল নম্বর জানতে আমাদের হটলাইনে কল করুন বা অ্যাপে বুকিং স্টেটাস চেক করুন।` },
                { q: `Does doctor provide video consultation?`, a: `Please check the Nilpha app for video consultation availability for ${doctor.name}.` }
              ].map((faq, idx) => (
                <div key={idx} className="space-y-2 group">
                   <p className="text-[11px] font-black text-slate-800 group-hover:text-blue-600 transition-colors uppercase tracking-tight italic">Q: {faq.q}</p>
                   <p className="text-[10px] text-slate-500 font-medium leading-relaxed">A: {faq.a}</p>
                </div>
              ))}
           </div>
        </section>

        {/* Patient Reviews */}
        <section className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 space-y-6">
           <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Patient Reviews & Ratings</h2>
           <div className="flex items-center gap-4 p-5 bg-yellow-50 rounded-[32px] border border-yellow-100">
              <div className="text-4xl font-black text-yellow-600">{doctor.rating}</div>
              <div className="space-y-1">
                 <div className="flex gap-0.5 text-yellow-500">
                    {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < Math.floor(doctor.rating) ? "currentColor" : "none"} />)}
                 </div>
                 <p className="text-[10px] font-black text-yellow-700 uppercase">Excellent Service Rating</p>
              </div>
           </div>
        </section>

        {/* Internal Linking: Related Doctors */}
        <section className="space-y-4">
           <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest px-2">More {doctor.specialty} Specialists</h2>
           <div className="grid grid-cols-1 gap-3">
             {DOCTORS.filter(d => d.specialty === doctor.specialty && d.id !== doctor.id).slice(0, 3).map(rd => (
               <Link key={rd.id} to={`/doctors/${slugify(rd.name)}`} className="bg-white p-4 rounded-[28px] border border-slate-100 flex items-center gap-4 active:scale-95 transition-all shadow-sm group">
                  <img src={rd.image} className="w-10 h-10 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all" alt={rd.name} />
                  <div className="flex-1">
                     <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{rd.name}</p>
                     <p className="text-[8px] text-slate-400 font-bold uppercase">{rd.districts[0]}</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-600" />
               </Link>
             ))}
           </div>
        </section>

        {doctor.clinics.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest px-2">Doctors in {clinic?.name || 'Same Hospital'}</h2>
            <div className="grid grid-cols-1 gap-3">
              {DOCTORS.filter(d => d.clinics.some(c => doctor.clinics.includes(c)) && d.id !== doctor.id).slice(0, 3).map(rd => (
                <Link key={rd.id} to={`/doctors/${slugify(rd.name)}`} className="bg-white p-4 rounded-[28px] border border-slate-100 flex items-center gap-4 active:scale-95 transition-all shadow-sm group">
                    <img src={rd.image} className="w-10 h-10 rounded-xl object-cover" alt={rd.name} />
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{rd.name}</p>
                      <p className="text-[8px] text-blue-600 font-bold uppercase">{rd.specialty}</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-300" />
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 space-y-6">
           <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Health Tips & Articles</h2>
           <div className="space-y-4">
              {[
                `How to choose the best ${doctor.specialty} in Nilphamari?`,
                `Essential health tips for patients in ${doctor.districts[0]}`,
                `Understanding the services at ${clinic?.name || 'top clinics'}`
              ].map((title, idx) => (
                <Link key={idx} to="/" className="flex items-center justify-between group">
                   <p className="text-[11px] font-bold text-slate-600 group-hover:text-blue-600 transition-colors uppercase tracking-tight italic line-clamp-1">→ {title}</p>
                   <ArrowRight size={12} className="text-slate-300 group-hover:text-blue-600" />
                </Link>
              ))}
           </div>
        </section>
      </div>
      <SEOFooter />
    </div>
  );
};

// --- Clinic / Hospital Landing Page ---
export const ClinicLandingPage: React.FC = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [showBookingModal, setShowBookingModal] = React.useState(false);
  const [selectedDoctor, setSelectedDoctor] = React.useState<any>(null);
  const clinic = CLINICS.find(c => slugify(c.name) === slug || c.id === slug);

  if (!clinic) return <div className="p-20 text-center font-black uppercase text-slate-400">Clinic Not Found</div>;

  const hospitalDocs = DOCTORS.filter(d => d.clinics.includes(clinic.id));
  const clinicSlug = slugify(clinic.name);

  // Clinic Schema
  const clinicSchema = {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    "name": clinic.name,
    "address": {
       "@type": "PostalAddress",
       "streetAddress": clinic.address,
       "addressLocality": clinic.district,
       "addressCountry": "BD"
    },
    "image": clinic.image,
    "url": `https://nilpha.com/hospitals/${clinicSlug}`,
    "telephone": `+88${HOTLINE}`
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <SEO 
        title={`${clinic.name} | Doctors List & Location, ${clinic.district} | Nilpha`}
        description={`Find doctors in ${clinic.name}, ${clinic.address}. View visiting hours, departments, and book appointments online on Nilpha.com. ${clinic.name}-এর ডাক্তারদের তালিকা ও সিরিয়াল নম্বর দেখুন। নীলফামারীর উন্নত চিকিৎসাসেবা ও বিশেষজ্ঞ ডাক্তারদের তথ্য।`}
        keywords={[
          clinic.name, 
          clinic.district + ' Hospital', 
          'Doctors in ' + clinic.name, 
          'নীলফামারী ক্লিনিক',
          'ডক্টর কুটুম',
          'Nilpha Hospitals',
          'Nilphamari Clinic List',
          'নীলফামারী হাসপাতালের তালিকা'
        ]}
        ogImage={clinic.image}
        ogUrl={`/hospitals/${clinicSlug}`}
        canonical={`/hospitals/${clinicSlug}`}
        schemas={[clinicSchema]}
      />

      <Breadcrumbs items={[
        { label: 'Hospitals', link: '/hospitals' },
        { label: clinic.name }
      ]} />

      <div className="p-6 space-y-6 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative h-64 rounded-[48px] overflow-hidden shadow-2xl">
           <img src={clinic.image} alt={`${clinic.name} - Nilpha Network`} className="w-full h-full object-cover" />
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent flex flex-col justify-end p-8">
              <h1 className="text-3xl font-black text-white leading-tight tracking-tighter uppercase">{clinic.name} | Hospital in {clinic.district}</h1>
              <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mt-2">{clinic.district} • Reliable Healthcare Partner</p>
           </div>
        </motion.div>

        <section className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 space-y-4">
           <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <MapPin size={14} /> Contact Information & Address
           </h2>
           <p className="text-sm font-bold text-slate-700 leading-relaxed">{clinic.address}</p>
           <div className="pt-4 border-t border-slate-50 flex gap-4">
              <a href={`tel:${HOTLINE}`} className="flex-1 bg-emerald-50 text-emerald-600 p-4 rounded-2xl text-[10px] font-black uppercase text-center active:scale-95 transition-all">Call Reception</a>
              <button className="flex-1 bg-blue-50 text-blue-600 p-4 rounded-2xl text-[10px] font-black uppercase text-center active:scale-95 transition-all">Get Directions</button>
           </div>
        </section>

        <section className="space-y-4">
           <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Available Specialists ({hospitalDocs.length})</h2>
              <div className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black">All Deparments</div>
              {selectedDoctor && (
                <BookingModal 
                  isOpen={showBookingModal}
                  onClose={() => setShowBookingModal(false)}
                  doctorName={selectedDoctor.name}
                  doctorSpecialty={selectedDoctor.specialty}
                  hotline={HOTLINE}
                />
              )}
           </div>
           
           <div className="grid grid-cols-1 gap-4">
             {hospitalDocs.map(doc => (
               <div key={doc.id} onClick={() => navigate(`/doctors/${slugify(doc.name)}`)} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-all cursor-pointer group relative">
                  <img src={doc.image} className="w-20 h-24 rounded-[24px] object-cover border bg-slate-50 shadow-sm" alt={`${doc.name} - ${doc.specialty}`} />
                  <div className="flex-1 space-y-1">
                     <p className="text-base font-black text-slate-800 leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight">{doc.name}</p>
                     <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mt-1 italic">{doc.specialty}</p>
                     <p className="text-[9px] text-slate-400 font-bold leading-relaxed mt-2 italic line-clamp-3">{doc.degree}</p>
                     
                     <div className="pt-3 border-t border-slate-50 mt-3 flex flex-wrap gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDoctor(doc);
                            setShowBookingModal(true);
                          }}
                          className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-tight shadow-sm flex items-center gap-1.5"
                        >
                           <MessageSquare size={10} /> সিরিয়াল
                        </button>
                        <a 
                          href={`tel:${HOTLINE}`}
                          onClick={(e) => e.stopPropagation()}
                          className="bg-blue-600 text-white px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-tight shadow-sm flex items-center gap-1.5"
                        >
                           <Phone size={10} /> কল
                        </a>
                     </div>
                  </div>
                  <div className="absolute top-6 right-6 w-9 h-9 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                     <ChevronRight size={16} />
                  </div>
               </div>
             ))}
           </div>
        </section>
      </div>
      <SEOFooter />
    </div>
  );
};

// --- Specialist / Department Landing Page ---
export const SpecialistLandingPage: React.FC = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [showBookingModal, setShowBookingModal] = React.useState(false);
    const [selectedDoctor, setSelectedDoctor] = React.useState<any>(null);
    const specialtyData = SPECIALTIES.find(s => slugify(s.name) === slug || s.id === slug);
    const specialtyName = specialtyData ? specialtyData.name : slug;
    const specialtyDocs = DOCTORS.filter(d => d.specialty.toLowerCase() === specialtyName?.toLowerCase());

    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            <SEO 
                title={`Best ${specialtyName} Doctors in Nilphamari | Specialist List | Nilpha`}
                description={`Find the best ${specialtyName} doctors in Nilphamari. View doctor profile, degrees, chamber address and book appointments online on Nilpha.com. নীলফামারী জেলার সেরা ${specialtyData?.bnName || specialtyName} বিশেষজ্ঞদের তালিকা এখানে পাবেন।`}
                keywords={[
                   specialtyName + ' in Nilphamari', 
                   specialtyName + ' doctor list', 
                   'নীলফামারী ' + (specialtyData?.bnName || '') + ' বিশেষজ্ঞ',
                   'Nilphamari Specialist Doctors',
                   'ডক্টর কুটুম নীলফামারী',
                   'নীলফামারী ডাক্তার লিস্ট'
                ]}
                ogUrl={`/specialists/${slug}`}
                canonical={`/specialists/${slug}`}
            />

            <Breadcrumbs items={[
                { label: 'Specialists', link: '/specialists' },
                { label: specialtyName || 'List' }
            ]} />

            <div className="p-6 space-y-8 max-w-2xl mx-auto">
                <header className="text-center space-y-3">
                   <div className="w-16 h-16 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center text-white text-3xl shadow-xl shadow-blue-500/20">
                      {specialtyData?.icon || '🩺'}
                   </div>
                   <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{specialtyName} Doctors in Nilphamari</h1>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">নীলফামারী জেলার বিশেষজ্ঞ ডাক্তারদের তালিকা</p>
                </header>

                <div className="grid grid-cols-1 gap-4">
                    {specialtyDocs.map(doc => (
                        <div key={doc.id} onClick={() => navigate(`/doctors/${slugify(doc.name)}`)} className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm flex items-start gap-4 active:scale-95 transition-all group relative cursor-pointer">
                            <img src={doc.image} className="w-16 h-16 rounded-[24px] object-cover border bg-slate-50 shadow-sm" alt={`${doc.name} - ${doc.specialty}`} />
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{doc.name}</p>
                                <p className="text-[9px] text-slate-400 font-bold leading-tight italic line-clamp-2 mt-1">{doc.degree}</p>
                                
                                <div className="pt-3 flex flex-wrap gap-2">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedDoctor(doc);
                                        setShowBookingModal(true);
                                      }}
                                      className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[8px] font-black uppercase flex items-center gap-1 shadow-sm"
                                    >
                                       <MessageSquare size={10} /> সিরিয়াল দিন
                                    </button>
                                    <a 
                                      href={`tel:${HOTLINE}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[8px] font-black uppercase flex items-center gap-1 shadow-sm"
                                    >
                                       <Phone size={10} /> কল করুন
                                    </a>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                        </div>
                    ))}

                    {selectedDoctor && (
                        <BookingModal 
                          isOpen={showBookingModal}
                          onClose={() => setShowBookingModal(false)}
                          doctorName={selectedDoctor.name}
                          doctorSpecialty={selectedDoctor.specialty}
                          hotline={HOTLINE}
                        />
                    )}

                   {specialtyDocs.length === 0 && (
                       <div className="py-20 text-center space-y-4">
                          <Search size={40} className="mx-auto text-slate-200" />
                          <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No specialists found in this category</p>
                       </div>
                   )}
                </div>
            </div>
            <SEOFooter />
        </div>
    );
};

// --- Dictionary / District Index Page ---
export const DistrictLandingPage: React.FC = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [showBookingModal, setShowBookingModal] = React.useState(false);
    const [selectedDoctor, setSelectedDoctor] = React.useState<any>(null);
    const districtDocs = DOCTORS.filter(d => d.districts.some(dist => slugify(dist) === slug || dist.toLowerCase() === slug?.toLowerCase()));

    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            <SEO 
                title={`All Doctors in ${slug} | Best Medical Specialists | Nilpha`}
                description={`Comprehensive list of doctors and medical specialists in ${slug}. Find clinics, diagnostic centers and hospital information on Nilpha.com. ${slug} জেলার সকল ডাক্তার এবং হাসপাতালের তথ্য এখানে পাবেন।`}
                canonical={`/districts/${slug}`}
            />
            <Breadcrumbs items={[{ label: slug || 'District' }]} />
            <div className="p-6 space-y-6 max-w-2xl mx-auto text-center">
                <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{slug} Medical Directory</h1>
                <p className="text-xs text-slate-500 font-medium">{slug} জেলার সকল ডাক্তার এবং হাসপাতালের তথ্য এখানে পাবেন।</p>
                
                <div className="grid grid-cols-1 gap-4 mt-8">
                   {districtDocs.map(doc => (
                       <div key={doc.id} onClick={() => navigate(`/doctors/${slugify(doc.name)}`)} className="bg-white p-5 rounded-[32px] border border-slate-100 flex items-start gap-4 text-left shadow-sm hover:shadow-md transition-all cursor-pointer group">
                           <img src={doc.image} className="w-20 h-24 rounded-[24px] object-cover border bg-slate-50" alt={`${doc.name} - ${doc.specialty}`} />
                           <div className="flex-1 space-y-1">
                               <p className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{doc.name}</p>
                               <p className="text-[10px] text-blue-600 uppercase font-black italic">{doc.specialty}</p>
                               
                               <div className="pt-3 flex flex-wrap gap-2">
                                   <button 
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       setSelectedDoctor(doc);
                                       setShowBookingModal(true);
                                     }}
                                     className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[8px] font-black uppercase flex items-center gap-1 shadow-sm"
                                   >
                                      <MessageSquare size={10} /> সিরিয়াল
                                   </button>
                                   <a 
                                     href={`tel:${HOTLINE}`}
                                     onClick={(e) => e.stopPropagation()}
                                     className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[8px] font-black uppercase flex items-center gap-1 shadow-sm"
                                   >
                                      <Phone size={10} /> কল
                                   </a>
                               </div>
                           </div>
                       </div>
                   ))}
                </div>

                {selectedDoctor && (
                    <BookingModal 
                        isOpen={showBookingModal}
                        onClose={() => setShowBookingModal(false)}
                        doctorName={selectedDoctor.name}
                        doctorSpecialty={selectedDoctor.specialty}
                        hotline={HOTLINE}
                    />
                )}
            </div>
            <SEOFooter />
        </div>
    )
}

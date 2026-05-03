
import { Doctor, Clinic, Medicine, LabTest } from './types';

export const DISTRICTS = ['Dhaka', 'Chattogram', 'Sylhet', 'Rajshahi', 'Khulna', 'Barishal', 'Rangpur', 'Mymensingh', 'Nilphamari'];

export const SPECIALTIES = [
  { id: 'medicine', name: 'Medicine', icon: '💊', bnName: 'মেডিসিন' },
  { id: 'cardiology', name: 'Cardiology', icon: '🫀', bnName: 'হৃদরোগ' },
  { id: 'neuromedicine', name: 'Neuromedicine', icon: '🧠', bnName: 'নিউরোলজি' },
  { id: 'gynecology', name: 'Gynecology', icon: '🤰', bnName: 'গাইনী' },
  { id: 'orthopedics', name: 'Orthopedics', icon: '🦴', bnName: 'হাড়-জোড়া' },
  { id: 'pediatrics', name: 'Pediatrics', icon: '👶', bnName: 'শিশু' },
  { id: 'surgery', name: 'Surgery', icon: '🔪', bnName: 'সার্জারি' },
  { id: 'urology', name: 'Urology', icon: '💧', bnName: 'ইউরোলজি' },
  { id: 'endocrinology', name: 'Endocrinology', icon: '🩸', bnName: 'ডায়াবেটিস' },
  { id: 'ent', name: 'ENT', icon: '👂', bnName: 'নাক-কান-গলা' },
  { id: 'dermatology', name: 'Dermatology', icon: '✨', bnName: 'চর্ম-যৌন' },
  { id: 'ophthalmology', name: 'Ophthalmology', icon: '👁️', bnName: 'চক্ষু' },
  { id: 'psychiatry', name: 'Psychiatry', icon: '🧘', bnName: 'মানসিক' },
  { id: 'dentistry', name: 'Dentistry', icon: '🦷', bnName: 'দন্ত' },
  { id: 'gastroenterology', name: 'Gastroenterology', icon: '🧪', bnName: 'পরিপাকতন্ত্র' },
];

export const DOCTORS: Doctor[] = [
  // --- Medicine ---
  { id: 'med1', name: 'Dr. Md. Shariful Islam', degree: 'MBBS, BCS (Health), FCPS (Medicine)', specialty: 'Medicine', districts: ['Nilphamari', 'Dhaka'], clinics: ['c-madina', 'c-janata'], schedule: 'প্রতিদিন: বিকাল ৩:০০ - রাত ৯:০০', availableToday: true, rating: 4.8, image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200', consultationFee: 500 },
  { id: 'med2', name: 'Dr. Md. Sazzad Hossain', degree: 'MBBS, BCS (Health), MD (Internal Medicine)', specialty: 'Medicine', districts: ['Nilphamari', 'Dhaka'], clinics: ['c-greensign'], schedule: 'শনি-বৃহস্পতি: বিকাল ৪:০০ - রাত ৮:০০', availableToday: true, rating: 4.7, image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200', consultationFee: 600 },
  { id: 'med3', name: 'Dr. Amitabha Roy', degree: 'MBBS, FCPS (Medicine)', specialty: 'Medicine', districts: ['Nilphamari'], clinics: ['c-ar'], schedule: 'প্রতিদিন: বিকাল ৫:০০ - রাত ৮:০০', availableToday: true, rating: 4.7, image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200', consultationFee: 500 },
  { id: 'med-ibadat', name: 'Dr. Md. Aminur Rahman', degree: 'MBBS, BCS (Health), FCPS (Medicine)', specialty: 'Medicine', districts: ['Nilphamari'], clinics: ['c-ibadat'], schedule: 'প্রতিদিন: বিকাল ৫:০০ - রাত ৯:০০', availableToday: true, rating: 4.8, image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200', consultationFee: 500 },

  // --- Cardiology ---
  { id: 'card1', name: 'Dr. Md. Asad Alam', degree: 'MBBS, BCS (Health), CCD (BIRDEM), D-Card (BSMMU)', specialty: 'Cardiology', districts: ['Nilphamari', 'Dhaka'], clinics: ['c-greensign'], schedule: 'প্রতিদিন: বিকাল ৩:০০ - রাত ৯:০০', availableToday: true, rating: 4.9, image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200', consultationFee: 600 },
  { id: 'card2', name: 'Dr. Md. Mahfuz Ali', degree: 'MBBS, BCS (Health), FCPS (Medicine), D-Card', specialty: 'Cardiology', districts: ['Nilphamari'], clinics: ['c-greensign'], schedule: 'শনি-বৃহস্পতি: বিকাল ৩:০০ - রাত ১০:০০', availableToday: true, rating: 4.8, image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200', consultationFee: 600 },
  { id: 'card-ibadat', name: 'Dr. Md. Rezwanul Haque', degree: 'MBBS, BCS (Health), D-Card', specialty: 'Cardiology', districts: ['Nilphamari'], clinics: ['c-ibadat'], schedule: 'প্রতিদিন: বিকাল ৫:০০ - রাত ৯:০০', availableToday: true, rating: 4.7, image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200', consultationFee: 600 },

  // --- Neuromedicine ---
  { id: 'neuro1', name: 'Dr. Md. Asaduzzaman (Asad)', degree: 'MBBS, BCS (Health), FCPS (Medicine), MD (Neurology)', specialty: 'Neuromedicine', districts: ['Nilphamari', 'Dhaka'], clinics: ['c-greensign'], schedule: 'শুক্রবার: সকাল ১০:০০ - রাত ৮:০০', availableToday: false, rating: 4.9, image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200', consultationFee: 800 },
  { id: 'neuro2', name: 'Dr. Md. Kaykobad Hossain', degree: 'MBBS, BCS, FCPS, MD (Neurology)', specialty: 'Neuromedicine', districts: ['Nilphamari'], clinics: ['c-madina'], schedule: 'সোম-বুধ: বিকাল ৩:০০ - রাত ৮:০০', availableToday: true, rating: 4.9, image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200', consultationFee: 800 },

  // --- Gynecology ---
  { id: 'gyn1', name: 'Dr. Wabaida Najmin (Mukta)', degree: 'MBBS, BCS (Health), DGO (DMC)', specialty: 'Gynecology', districts: ['Nilphamari', 'Dhaka'], clinics: ['c-greensign'], schedule: 'প্রতিদিন: বিকাল ৪:০০ - রাত ৯:০০', availableToday: true, rating: 4.9, image: 'https://images.unsplash.com/photo-1559839734-2b71f1536780?auto=format&fit=crop&q=80&w=200', consultationFee: 500 },
  { id: 'gyn2', name: 'Dr. Rumana Afroz', degree: 'MBBS, PGT, EOCT, DMU, CCD, MPH', specialty: 'Gynecology', districts: ['Nilphamari'], clinics: ['c-greensign'], schedule: 'শনি-বৃহস্পতি: বিকাল ৪:০০ - রাত ১০:০০', availableToday: true, rating: 4.9, image: 'https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?auto=format&fit=crop&q=80&w=200', consultationFee: 500 },
  { id: 'gyn3', name: 'Dr. Shahnaz Begum', degree: 'MBBS, FCPS, MS (Gynae)', specialty: 'Gynecology', districts: ['Nilphamari'], clinics: ['c-ar'], schedule: 'প্রতিদিন: সকাল ১০:০০ - দুপুর ২:০০', availableToday: true, rating: 4.8, image: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&q=80&w=200', consultationFee: 600 },
  { id: 'gyn-ibadat', name: 'Dr. Mosammat Sharmin Akter', degree: 'MBBS, BCS (Health), MS (Gynae)', specialty: 'Gynecology', districts: ['Nilphamari'], clinics: ['c-ibadat'], schedule: 'প্রতিদিন: বিকাল ২:০০ - রাত ৮:০০', availableToday: true, rating: 4.8, image: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=200', consultationFee: 600 },

  // --- Orthopedics ---
  { id: 'orth1', name: 'Dr. Md. Rezaul Karim', degree: 'MBBS, MS (Orthopedics), D-Ortho', specialty: 'Orthopedics', districts: ['Nilphamari', 'Dhaka'], clinics: ['c-greensign'], schedule: 'প্রতিদিন: বিকাল ৫:০০ - রাত ৯:০০', availableToday: true, rating: 4.8, image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200', consultationFee: 700 },
  { id: 'orth2', name: 'Dr. Md. Golam Sarwar', degree: 'MBBS, BCS (Health), FCPS (Ortho)', specialty: 'Orthopedics', districts: ['Nilphamari'], clinics: ['c-madina'], schedule: 'রবি, মঙ্গল, বৃহস্পতি: বিকাল ৪:০০ - রাত ৮:০০', availableToday: false, rating: 4.8, image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200', consultationFee: 600 },
  { id: 'orth3', name: 'Dr. Md. Jakir Hossain', degree: 'MBBS, MS (Orthopedics)', specialty: 'Orthopedics', districts: ['Nilphamari'], clinics: ['c-ibadat'], schedule: 'প্রতিদিন: বিকাল ৫:০০ - রাত ৯:০০', availableToday: true, rating: 4.7, image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200', consultationFee: 600 },

  // --- Pediatrics ---
  { id: 'ped1', name: 'Dr. Shah Md. Moazzem', degree: 'MBBS, DCH (Child), BCS', specialty: 'Pediatrics', districts: ['Nilphamari', 'Dhaka'], clinics: ['c-greensign'], schedule: 'প্রতিদিন: বিকাল ৩:০০ - রাত ১০:০০', availableToday: true, rating: 4.9, image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200', consultationFee: 500 },
  { id: 'ped-ibadat', name: 'Dr. Md. Rafiqul Islam', degree: 'MBBS, BCS (Health), DCH (Child)', specialty: 'Pediatrics', districts: ['Nilphamari'], clinics: ['c-ibadat'], schedule: 'প্রতিদিন: বিকাল ৫:০০ - রাত ৯:০০', availableToday: true, rating: 4.8, image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200', consultationFee: 500 },

  // --- Surgery ---
  { id: 'sur1', name: 'Dr. Md. Emdadul Haque', degree: 'MBBS, FCPS (Surgery)', specialty: 'Surgery', districts: ['Nilphamari', 'Dhaka'], clinics: ['c-greensign'], schedule: 'প্রতিদিন: বিকাল ৪:০০ - রাত ৯:০০', availableToday: true, rating: 4.8, image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200', consultationFee: 700 },
  { id: 'sur2', name: 'Dr. Md. Zahidul Islam', degree: 'MBBS, MS (Surgery)', specialty: 'Surgery', districts: ['Nilphamari'], clinics: ['c-ibadat', 'c-janata'], schedule: 'প্রতিদিন: বিকাল ৫:০০ - রাত ৯:০০', availableToday: true, rating: 4.8, image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200', consultationFee: 700 },

  // --- Urology ---
  { id: 'uro1', name: 'Dr. Md. Shafiqul Alam', degree: 'MBBS, MS (Urology)', specialty: 'Urology', districts: ['Nilphamari', 'Dhaka'], clinics: ['c-greensign'], schedule: 'প্রতিদিন: বিকাল ৩:০০ - রাত ৮:০০', availableToday: true, rating: 4.8, image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200', consultationFee: 800 },
  { id: 'uro2', name: 'Dr. Md. Nuruzzaman Mia', degree: 'MBBS, BCS (Health), MS (Urology)', specialty: 'Urology', districts: ['Nilphamari'], clinics: ['c-madina'], schedule: 'প্রতিদিন: বিকাল ৪:০০ - রাত ৯:০০', availableToday: true, rating: 4.7, image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200', consultationFee: 800 },

  // --- Endocrinology ---
  { id: 'end1', name: 'Dr. Md. Masum Billah', degree: 'MBBS, DEM (BIRDEM), FCPS (Endo)', specialty: 'Endocrinology', districts: ['Nilphamari', 'Dhaka'], clinics: ['c-greensign'], schedule: 'প্রতিদিন: বিকাল ৪:০০ - রাত ৯:০০', availableToday: true, rating: 4.8, image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200', consultationFee: 800 },
  { id: 'end2', name: 'Dr. Ahmed Tanveer', degree: 'MBBS, MD (Endocrinology)', specialty: 'Endocrinology', districts: ['Nilphamari'], clinics: ['c-madina'], schedule: 'শুক্রবার: বিকাল ৩:০০ - রাত ৯:০০', availableToday: false, rating: 4.9, image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200', consultationFee: 800 },

  // --- ENT ---
  { id: 'ent1', name: 'Dr. Md. Mahbubur Rahman', degree: 'MBBS, DLO (ENT)', specialty: 'ENT', districts: ['Nilphamari', 'Dhaka'], clinics: ['c-greensign'], schedule: 'প্রতিদিন: বিকাল ৩:০০ - রাত ৮:০০', availableToday: true, rating: 4.8, image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200', consultationFee: 500 },
  { id: 'ent2', name: 'Dr. Md. Rashidul Islam', degree: 'MBBS, DLO (ENT)', specialty: 'ENT', districts: ['Nilphamari'], clinics: ['c-ar'], schedule: 'শনি-বৃহস্পতি: বিকাল ৫:০০ - রাত ৯:০০', availableToday: true, rating: 4.8, image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200', consultationFee: 500 },

  // --- Dermatology ---
  { id: 'derm1', name: 'Dr. Fahim Kishwar', degree: 'MBBS, DDV, CCD, FCPS', specialty: 'Dermatology', districts: ['Nilphamari', 'Dhaka'], clinics: ['c-ar'], schedule: 'শুক্রবার: বিকাল ৩:০০ - রাত ৯:০০', availableToday: false, rating: 4.8, image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200', consultationFee: 600 },
  { id: 'derm2', name: 'Dr. Md. Nurul Islam', degree: 'MBBS, DDV (Skin)', specialty: 'Dermatology', districts: ['Nilphamari'], clinics: ['c-ibadat'], schedule: 'প্রতিদিন: বিকাল ৫:০০ - রাত ৯:০০', availableToday: true, rating: 4.7, image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200', consultationFee: 600 },

  // --- Ophthalmology ---
  { id: 'eye1', name: 'Dr. Md. Mostofa Kamal', degree: 'MBBS, DO (Eye)', specialty: 'Ophthalmology', districts: ['Nilphamari', 'Dhaka'], clinics: ['c-greensign'], schedule: 'শনি-বৃহস্পতি: বিকাল ৪:০০ - রাত ৮:০০', availableToday: true, rating: 4.8, image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200', consultationFee: 500 },
  { id: 'eye2', name: 'Dr. S. M. Nazmul Haque', degree: 'MBBS, DO (Eye)', specialty: 'Ophthalmology', districts: ['Nilphamari'], clinics: ['c-madina', 'c-janata'], schedule: 'রবি-বৃহস্পতি: বিকাল ৫:০০ - রাত ৯:০০', availableToday: true, rating: 4.7, image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200', consultationFee: 500 },

  // --- Psychiatry ---
  { id: 'psy1', name: 'Dr. Md. Mahbubur Rahman', degree: 'MBBS, MD (Psychiatry)', specialty: 'Psychiatry', districts: ['Nilphamari', 'Dhaka'], clinics: ['c-greensign'], schedule: 'প্রতিদিন: বিকাল ৩:০০ - রাত ৮:০০', availableToday: true, rating: 4.8, image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200', consultationFee: 1000 },
  { id: 'psy2', name: 'Dr. Md. Enamul Haque', degree: 'MBBS, MD (Psychiatry)', specialty: 'Psychiatry', districts: ['Nilphamari'], clinics: ['c-madina'], schedule: 'প্রতিদিন: সন্ধ্যা ৬:০০ - রাত ৯:০০', availableToday: true, rating: 4.8, image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200', consultationFee: 1000 },

  // --- Dentistry ---
  { id: 'dent1', name: 'Dr. Md. Arifur Rahman', degree: 'BDS, PGT (Dental)', specialty: 'Dentistry', districts: ['Nilphamari', 'Dhaka'], clinics: ['c-greensign'], schedule: 'প্রতিদিন: বিকাল ৩:০০ - রাত ৯:০০', availableToday: true, rating: 4.8, image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200', consultationFee: 400 },
  { id: 'dent2', name: 'Dr. Md. Al-Amin', degree: 'BDS (Dental)', specialty: 'Dentistry', districts: ['Nilphamari'], clinics: ['c-ar'], schedule: 'প্রতিদিন: বিকাল ৪:০০ - রাত ১০:০০', availableToday: true, rating: 4.8, image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200', consultationFee: 400 },

  // --- Gastroenterology ---
  { id: 'gas1', name: 'Dr. Md. Sayedur Rahman', degree: 'MBBS, MD (Gastroenterology)', specialty: 'Gastroenterology', districts: ['Nilphamari', 'Dhaka'], clinics: ['c-greensign'], schedule: 'প্রতিদিন: বিকাল ৩:০০ - রাত ৮:০০', availableToday: true, rating: 4.8, image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200', consultationFee: 800 },
  { id: 'gas2', name: 'Dr. Md. Mizanur Rahman', degree: 'MBBS, MD (Hepatology)', specialty: 'Gastroenterology', districts: ['Nilphamari'], clinics: ['c-madina'], schedule: 'প্রতিদিন: বিকাল ৪:০০ - রাত ৮:০০', availableToday: true, rating: 4.9, image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200', consultationFee: 800 },

  // --- Janata Clinic Doctors ---
  { id: 'j-gyn1', name: 'Dr. Parul Rani Roy', degree: 'MBBS, DGO (Dhaka), FCPS (LP) Gynae & Obs', specialty: 'Gynecology', districts: ['Nilphamari'], clinics: ['c-janata'], schedule: 'প্রতিদিন: সকাল ১০-২ ও বিকাল ৪-৮', availableToday: true, rating: 4.9, image: 'https://images.unsplash.com/photo-1559839734-2b71f1536780?auto=format&fit=crop&q=80&w=200', consultationFee: 500 },
  { id: 'j-gyn2', name: 'Dr. Farzana Akter', degree: 'MBBS, BCS (Health), CMU, DMU (Ultrasonology)', specialty: 'Gynecology', districts: ['Nilphamari'], clinics: ['c-janata'], schedule: 'প্রতিদিন: বিকাল ৩:০০ - রাত ৮:০০', availableToday: true, rating: 4.8, image: 'https://images.unsplash.com/photo-1623854767233-2d2c322cc4e2?auto=format&fit=crop&q=80&w=200', consultationFee: 500 },
  { id: 'j-gyn3', name: 'Dr. Afroza Khanom', degree: 'MBBS (BUP), CMU, DMU (Ultra)', specialty: 'Gynecology', districts: ['Nilphamari'], clinics: ['c-janata'], schedule: 'প্রতিদিন: সকাল ১০:০০ - রাত ৮:০০', availableToday: true, rating: 4.7, image: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&q=80&w=200', consultationFee: 400 },
  { id: 'j-sur1', name: 'Dr. Md. Sohrab Hossain', degree: 'MBBS, FCPS (Surgery)', specialty: 'Surgery', districts: ['Nilphamari'], clinics: ['c-janata'], schedule: 'প্রতিদিন: বিকাল ৩-৮টা (শুক্র বন্ধ)', availableToday: true, rating: 4.9, image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200', consultationFee: 700 },
  { id: 'j-sur2', name: 'Dr. Md. Abdullahhel Mafi', degree: 'MBBS, BCS (Health), FCPS Part-2 (Surgery)', specialty: 'Surgery', districts: ['Nilphamari'], clinics: ['c-janata'], schedule: 'প্রতিদিন: দুপুর ১:০০ - রাত ৯:০০', availableToday: true, rating: 4.8, image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200', consultationFee: 500 },
  { id: 'j-med1', name: 'Dr. Md. Masud Parvez', degree: 'MBBS, BCS (Health), MD (Internal Medicine)', specialty: 'Medicine', districts: ['Nilphamari'], clinics: ['c-janata'], schedule: 'প্রতিদিন: বিকাল ৪-৮টা (শুক্র বন্ধ)', availableToday: true, rating: 4.9, image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200', consultationFee: 700 },
  { id: 'j-med2', name: 'Dr. Tawhida Nasrin', degree: 'MBBS, BCS (Health), FCPS (Medicine) Final Part, DMU', specialty: 'Medicine', districts: ['Nilphamari'], clinics: ['c-janata'], schedule: 'শুক্রবার: সকাল ১০:০০ - রাত ৮:০০', availableToday: false, rating: 4.7, image: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=200', consultationFee: 500 },
  { id: 'j-med3', name: 'Dr. Md. Atiar Rahman Sheikh', degree: 'MBBS, BCS (Health)', specialty: 'Medicine', districts: ['Nilphamari'], clinics: ['c-janata'], schedule: 'প্রতিদিন: দুপুর ১-৮টা (শুক্র বন্ধ)', availableToday: true, rating: 4.7, image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200', consultationFee: 500 },
  { id: 'j-med4', name: 'Dr. Nihar Ranjan Chowdhury', degree: 'MBBS, BCS (Health)', specialty: 'Medicine', districts: ['Nilphamari'], clinics: ['c-janata'], schedule: 'প্রতিদিন: বিকাল ৩:০০ - রাত ৯:০০', availableToday: true, rating: 4.8, image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200', consultationFee: 500 },
  { id: 'j-ped1', name: 'Dr. Komlakanto Roy', degree: 'MBBS, PGT, DCH (Child)', specialty: 'Pediatrics', districts: ['Nilphamari'], clinics: ['c-janata'], schedule: 'প্রতিদিন: বিকাল ৫:০০ - রাত ৯:০০', availableToday: true, rating: 4.8, image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200', consultationFee: 300 },
  { id: 'j-pain1', name: 'Dr. Shahriar Ahmed Shakil', degree: 'MBBS (Dhaka), ACPS (Pain, Psychology), PGT (Ortho)', specialty: 'Medicine', districts: ['Nilphamari'], clinics: ['c-janata'], schedule: 'বৃহস্পতিবার: দুপুর ২:০০ - রাত ৮:০০', availableToday: false, rating: 4.9, image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200', consultationFee: 500 },
  { id: 'j-orth1', name: 'Dr. Md. Mostofa Al Bani (Rikkon)', degree: 'MBBS, BCS (Health), D-Ortho, MS, AO Spine (Switzerland)', specialty: 'Orthopedics', districts: ['Nilphamari'], clinics: ['c-janata'], schedule: 'শনিবার: দুপুর ২:০০ - রাত ৯:০০', availableToday: false, rating: 4.9, image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200', consultationFee: 700 },
  { id: 'j-med5', name: 'Dr. Rituparna Roy', degree: 'MBBS (BUP), CMU (Ultra)', specialty: 'Medicine', districts: ['Nilphamari'], clinics: ['c-janata'], schedule: 'প্রতিদিন: দুপুর ২:০০ - রাত ১০:০০', availableToday: true, rating: 4.7, image: 'https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?auto=format&fit=crop&q=80&w=200', consultationFee: 400 },
  { id: 'j-skin', name: 'Dr. Partha Sarothi', degree: 'MBBS (Dhaka), DDV (BSMMU), Skin & VD Specialist', specialty: 'Dermatology', districts: ['Nilphamari'], clinics: ['c-janata'], schedule: 'প্রতিদিন: বিকাল ৩:০০ - রাত ৯:০০', availableToday: true, rating: 4.9, image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200', consultationFee: 500 },
];

export const EMERGENCY_SERVICES = [
  { id: 'e1', name: 'ECG (ইসিজি)', price: 600, icon: '💓', description: 'বাসায় গিয়ে ইসিজি করা হয়' },
  { id: 'e2', name: 'Blood Collection', price: 200, icon: '🩸', description: 'ল্যাব টেস্টের জন্য রক্ত সংগ্রহ' },
  { id: 'e3', name: 'Nurse Care', price: 1500, icon: '👩‍⚕️', description: 'দক্ষ নার্সিং সেবা (১২ ঘণ্টা)' },
  { id: 'e4', name: 'BP Check', price: 100, icon: '🩺', description: 'ব্লাড প্রেসার ও সুগার চেক' },
];

export const LAB_TESTS: LabTest[] = [
  { id: 'lt1', name: 'RBS (রক্তের সুগার)', price: 200 },
  { id: 'lt2', name: 'FBS & 2HRS', price: 400 },
  { id: 'lt3', name: 'S.Creatinine (কিডনি)', price: 500 },
  { id: 'lt4', name: 'CBC (রক্ত পরীক্ষা)', price: 600 },
  { id: 'lt5', name: 'SGPT (লিভার)', price: 500 },
  { id: 'lt6', name: 'SGOT', price: 600 },
  { id: 'lt31', name: 'Troponin- I (হার্ট অ্যাটাক)', price: 1500 },
  { id: 'lt40', name: 'TSH (থাইরয়েড)', price: 1000 },
  { id: 'lt48', name: 'HBA1C (ডায়াবেটিস ৩ মাস)', price: 1200 },
  { id: 'lt73', name: 'USG Whole Abdomen', price: 750 },
  { id: 'lt79', name: 'ECG (ইসিজি)', price: 600 },
  { id: 'lt82', name: 'X-Ray Chest', price: 600 },
];

export const MEDICINES: Medicine[] = [
  { id: 'm1', name: 'Napa Extend', price: 20, discount: 5, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=200', description: 'Pain relief' },
  { id: 'm2', name: 'Seclo 20', price: 150, discount: 10, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=200', description: 'Acidity' },
  { id: 'm3', name: 'Fexo 120', price: 90, discount: 0, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=200', description: 'Allergy' },
];

export const CLINICS: Clinic[] = [
  { id: 'c-madina', name: 'মদিনা ডায়াগনস্টিক ক্লিনিক এন্ড কনসালটেশন', district: 'Nilphamari', address: 'জেনারেল হাসপাতাল রোড, হাসপাতাল মোড়, নীলফামারী', doctors: ['med1','neuro2','orth2','uro2','end2','eye2','psy2','gas2'], image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800' },
  { id: 'c-greensign', name: 'গ্রিন সাইন ডিজিটাল ডায়াগনস্টিক অ্যান্ড হাসপাতাল', district: 'Nilphamari', address: 'নীলফামারী সদর', doctors: ['med2', 'card1', 'card2', 'neuro1', 'gyn1', 'gyn2', 'orth1', 'ped1', 'sur1', 'uro1', 'end1', 'ent1', 'eye1', 'psy1', 'dent1', 'gas1'], image: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&q=80&w=800' },
  { id: 'c-ar', name: 'এ.আর. জেনারেল হাসপাতাল', district: 'Nilphamari', address: 'সদর হাসপাতাল রোড, নীলফামারী', doctors: ['med3','gyn3','ent2','derm1','dent2'], image: 'https://images.unsplash.com/photo-1587350859728-117699f8aee1?auto=format&fit=crop&q=80&w=800' },
  { id: 'c-ibadat', name: 'ইবাদত হাসপাতাল', district: 'Nilphamari', address: 'পুরাতন স্টেশন রোড, নীলফামারী', doctors: ['sur2','derm2','orth3', 'med-ibadat', 'card-ibadat', 'gyn-ibadat', 'ped-ibadat'], image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800' },
  { id: 'c-janata', name: 'জনতা ক্লিনিক এন্ড ডায়াগনস্টিক সেন্টার', district: 'Nilphamari', address: 'হাসপাতাল রোড, শান্তিনগর মোড় (ব্রিজ সংলগ্ন), নীলফামারী সদর, নীলফামারী।', doctors: ['j-gyn1', 'j-gyn2', 'j-gyn3', 'j-sur1', 'j-sur2', 'j-med1', 'j-med2', 'j-med3', 'j-med4', 'j-ped1', 'j-pain1', 'j-orth1', 'j-med5', 'j-skin'], image: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&q=80&w=800' },
];

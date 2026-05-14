
export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR'
}

export interface Profile {
  id: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  status: 'active' | 'pending' | 'suspended';
}

export interface AppSetting {
  key: string;
  value: string;
}

export interface Doctor {
  id: string;
  name: string;
  degree: string;
  specialty: string;
  districts: string[];
  clinics: string[];
  schedule: string;
  availableToday: boolean;
  rating: number;
  image: string;
  isVideoConsultant?: boolean;
  consultationFee?: number;
}

export interface Clinic {
  id: string;
  name: string;
  district: string;
  address: string;
  doctors: string[];
  image: string;
}

export interface Medicine {
  id: string;
  name: string;
  price: number;
  discount: number;
  image: string;
  description: string;
}

export interface LabTest {
  id: string;
  name: string;
  price: number;
}

export interface Order {
  id?: string;
  created_at?: string;
  user_id: string;
  user_email: string;
  item_name: string;
  amount: number;
  shipping: number;
  payment_method: string;
  payment_type?: 'online' | 'offline';
  sender_name: string;
  sender_contact: string;
  patient_name?: string;
  trx_id: string;
  hospital_name?: string;
  status: 'pending' | 'verified' | 'processing' | 'completed' | 'cancelled';
}

export interface Prescription {
  id: string;
  created_at: string;
  patient_id: string;
  patient_name: string;
  doctor_id: string;
  doctor_name: string;
  doctor_specialty: string;
  medicines: string;
  notes: string;
  next_visit_date?: string;
}

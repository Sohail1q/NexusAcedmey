export interface NexusClass {
  teacher: string;
  category: string;
  className: string;
  startTime: string;
  endTime: string;
  duration: string;
  monthlyFee: number;
  admissionFee: number;
}

export interface NexusStudent {
  id: string;
  name: string;
  fatherName: string;
  guardianName?: string;
  guardianNumber?: string;
  studentNumber?: string;
  gmail?: string;
  photo?: string;
  photoUrl?: string;
  photoLink?: string;
  className?: string;
  admissionDate?: string;
  registeredAt?: string;
  monthlyFee?: number;
  admissionFee?: number;
  dues: number;
  totalPaid: number;
  lastAdmissionDate?: string;
}

export interface NexusAttendanceRecord {
  studentId: string;
  status: 'Present' | 'Absent' | 'Leave';
}

export interface NexusTestRecord {
  id: string;
  date: string;
  className: string;
  testName: string;
  totalMarks: number;
  passingMarks: number;
  scores: Array<{ studentId: string; marks: number }>;
}

export interface NexusSettings {
  name: string;
  subtitle: string;
  address: string;
  logo: string;
  backgroundColor: string;
  backgroundImage: string;
  adminPin?: string;
  currency?: string;
}

export interface CloudConfig {
  provider: 'firebase' | 'cloudflare' | 'built-in' | 'supabase';
  firebase?: {
    apiKey?: string;
    authDomain?: string;
    projectId?: string;
    firestoreDatabaseId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
  };
  cloudflare?: {
    accountId?: string;
    databaseId?: string;
    apiToken?: string;
    customEndpoint?: string;
  };
  supabase?: {
    url?: string;
    anonKey?: string;
  };
}

export interface AppState {
  settings: NexusSettings;
  classes: NexusClass[];
  students: NexusStudent[];
  attendance?: Record<string, Record<string, NexusAttendanceRecord[]>>;
  attendanceRecords?: Record<string, Record<string, NexusAttendanceRecord[]>>;
  tests?: NexusTestRecord[];
  testRecords?: NexusTestRecord[];
  cloudConfig?: CloudConfig;
  savedAt?: string;
  version?: number;
}

export interface ReceiptData {
  receiptNo: string;
  date: string;
  studentId: string;
  studentName: string;
  fatherName: string;
  className: string;
  monthlyFee: number;
  admissionFee: number;
  prevDues: number;
  paidAmount: number;
  remainingDues: number;
}

export type NexusTab =
  | 'dashboard'
  | 'admission'
  | 'registration'
  | 'classes'
  | 'attendance'
  | 'test-marks'
  | 'student-info'
  | 'dues'
  | 'directory'
  | 'settings'
  | 'apps'
  | 'deployment';

export type ActiveTab = NexusTab;

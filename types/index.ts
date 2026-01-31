// Types untuk sistem absensi IoT
export interface ProgramStudi {
  id: string;
  code: string;
  name: string;
  faculty?: string | null;
  createdAt: Date;
  updatedAt?: Date;
  _count?: {
    students: number;
  };
}

export interface Student {
  id: string;
  name: string;
  class: string;
  nis: string;
  uid: string; // KTM UID - required
  prodiId?: string | null;
  prodi?: ProgramStudi;
  lastAttendance?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export interface AttendanceLog {
  id: string;
  uid: string;
  studentId?: string;
  studentName: string;
  class: string;
  status: 'HADIR' | 'TIDAK HADIR' | 'IZIN' | 'DITOLAK' | 'UNKNOWN';
  timestamp: Date;
  source?: 'KTM' | 'manual'; // Track if via KTM or manual
}

export interface SystemStatus {
  isConnected: boolean;
  mode: 'NORMAL' | 'REGISTER';
  totalStudents: number;
  totalLogs: number;
}

export interface SerialCommand {
  command: string;
  params?: string[];
}

export interface WebSocketMessage {
  type: 'STATUS' | 'RFID_SCAN' | 'ERROR' | 'INFO';
  data: any;
  timestamp?: string;
}

export interface DashboardStats {
  totalStudents: number;
  todayAttendance: number;
  activeStudent: string;
  masterCardStatus: boolean;
  recentLogs: AttendanceLog[];
}

export type UserRole = 'ADMIN' | 'TEACHER' | 'STAFF';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
}

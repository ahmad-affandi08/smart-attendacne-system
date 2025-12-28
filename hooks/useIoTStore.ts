import { create } from 'zustand';
import type { SystemStatus, AttendanceLog, Student, ProgramStudi } from '@/types';
import { toast } from 'sonner';

interface IoTStore {
  // Connection state
  isConnected: boolean;
  connectionMode: 'serial' | 'wifi' | null;
  setConnected: (status: boolean) => void;
  setConnectionMode: (mode: 'serial' | 'wifi' | null) => void;

  // System status
  systemStatus: SystemStatus | null;
  setSystemStatus: (status: SystemStatus) => void;

  // Program Studi
  prodi: ProgramStudi[];
  setProdi: (prodi: ProgramStudi[]) => void;
  fetchProdi: () => Promise<void>;
  addProdi: (prodi: Omit<ProgramStudi, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProdi: (id: string, prodi: Partial<ProgramStudi>) => Promise<void>;
  removeProdi: (id: string) => Promise<void>;

  // Students
  students: Student[];
  setStudents: (students: Student[]) => void;
  addStudent: (student: Student) => Promise<void>;
  updateStudent: (id: string, student: Partial<Student>) => Promise<void>;
  removeStudent: (id: string) => Promise<void>;
  fetchStudents: () => Promise<void>;
  checkUid: (uid: string) => Promise<Student | null>;

  // Attendance logs
  attendanceLogs: AttendanceLog[];
  addAttendanceLog: (log: Omit<AttendanceLog, 'id' | 'timestamp'>) => Promise<void>;
  setAttendanceLogs: (logs: AttendanceLog[]) => void;
  fetchAttendanceLogs: () => Promise<void>;
  deleteAttendanceLog: (id: string) => Promise<void>;
  deleteAllAttendanceLogs: () => Promise<void>;

  // Serial logs (raw messages from Arduino)
  serialLogs: Array<{ id: string; message: string; timestamp: Date; type: string }>;
  addSerialLog: (message: string, type?: string) => void;
  clearSerialLogs: () => void;

  // UI state
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useIoTStore = create<IoTStore>((set, get) => ({
  // Connection state
  isConnected: false,
  connectionMode: null,
  setConnected: (status) => set({ isConnected: status }),
  setConnectionMode: (mode) => set({ connectionMode: mode }),

  // System status
  systemStatus: null,
  setSystemStatus: (status) => set({ systemStatus: status }),

  // Program Studi
  prodi: [],
  setProdi: (prodi) => set({ prodi }),

  fetchProdi: async () => {
    try {
      const response = await fetch('/api/prodi');
      if (!response.ok) throw new Error('Failed to fetch prodi');

      const prodi = await response.json();
      set({ prodi });
    } catch (error) {
      console.error('Error fetching prodi:', error);
    }
  },

  addProdi: async (prodiData) => {
    try {
      const response = await fetch('/api/prodi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prodiData),
      });

      if (!response.ok) throw new Error('Failed to add prodi');

      const newProdi = await response.json();
      set((state) => ({
        prodi: [...state.prodi, newProdi],
      }));
    } catch (error) {
      console.error('Error adding prodi:', error);
      throw error;
    }
  },

  updateProdi: async (id, prodiData) => {
    try {
      const response = await fetch(`/api/prodi/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prodiData),
      });

      if (!response.ok) throw new Error('Failed to update prodi');

      const updatedProdi = await response.json();
      set((state) => ({
        prodi: state.prodi.map((p) => (p.id === id ? updatedProdi : p)),
      }));
    } catch (error) {
      console.error('Error updating prodi:', error);
      throw error;
    }
  },

  removeProdi: async (id) => {
    try {
      const response = await fetch(`/api/prodi/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove prodi');
      }

      set((state) => ({
        prodi: state.prodi.filter((p) => p.id !== id),
      }));
    } catch (error) {
      console.error('Error removing prodi:', error);
      throw error;
    }
  },

  // Students
  students: [],
  setStudents: (students) => set({ students }),

  addStudent: async (student) => {
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: student.name,
          class: student.class,
          nis: student.nis,
          uid: student.uid,
        }),
      });

      if (!response.ok) throw new Error('Failed to add student');

      const newStudent = await response.json();
      set((state) => ({ students: [...state.students, newStudent] }));
    } catch (error) {
      console.error('Error adding student:', error);
      throw error;
    }
  },

  updateStudent: async (id, updatedStudent) => {
    try {
      const response = await fetch(`/api/students/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedStudent),
      });

      if (!response.ok) throw new Error('Failed to update student');

      const updated = await response.json();
      set((state) => ({
        students: state.students.map((s) => (s.id === id ? updated : s)),
      }));
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  },

  removeStudent: async (id) => {
    try {
      const response = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete student');

      set((state) => ({
        students: state.students.filter((s) => s.id !== id),
      }));
    } catch (error) {
      console.error('Error removing student:', error);
      throw error;
    }
  },

  fetchStudents: async () => {
    try {
      const response = await fetch('/api/students');
      if (!response.ok) throw new Error('Failed to fetch students');

      const students = await response.json();
      set({ students });
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  },

  checkUid: async (uid: string) => {
    try {
      const response = await fetch('/api/students/check-uid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to check UID');
      }

      const data = await response.json();
      return data.found ? data.student : null;
    } catch (error) {
      console.error('Error checking UID:', error);
      return null;
    }
  },

  // Attendance logs
  // Attendance logs
  attendanceLogs: [],

  addAttendanceLog: async (log) => {
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      });

      // Handle 409 Conflict (sudah absen hari ini)
      if (response.status === 409) {
        const errorData = await response.json();
        console.warn('Already attended today:', errorData);
        // Toast sudah ditampilkan di useSerialConnection berdasarkan status Arduino
        // Jangan tampilkan toast di sini untuk menghindari duplikasi
        return;
      }

      if (!response.ok) throw new Error('Failed to add attendance log');

      const newLog = await response.json();
      set((state) => ({
        attendanceLogs: [newLog, ...state.attendanceLogs].slice(0, 100),
      }));
    } catch (error) {
      console.error('Error adding attendance log:', error);
      throw error;
    }
  },

  setAttendanceLogs: (logs) => set({ attendanceLogs: logs }),

  fetchAttendanceLogs: async () => {
    try {
      const response = await fetch('/api/attendance');
      if (!response.ok) throw new Error('Failed to fetch attendance logs');

      const logs = await response.json();
      set({ attendanceLogs: logs });
    } catch (error) {
      console.error('Error fetching attendance logs:', error);
    }
  },

  deleteAttendanceLog: async (id: string) => {
    try {
      const response = await fetch(`/api/attendance/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete attendance log');

      set((state) => ({
        attendanceLogs: state.attendanceLogs.filter((log) => log.id !== id),
      }));
    } catch (error) {
      console.error('Error deleting attendance log:', error);
      throw error;
    }
  },

  deleteAllAttendanceLogs: async () => {
    try {
      const response = await fetch('/api/attendance/delete-all', {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete all attendance logs');

      set({ attendanceLogs: [] });
    } catch (error) {
      console.error('Error deleting all attendance logs:', error);
      throw error;
    }
  },

  // Serial logs (raw messages from Arduino)
  serialLogs: [],

  addSerialLog: (message: string, type: string = 'INFO') => {
    const newLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      message,
      type,
      timestamp: new Date(),
    };

    set((state) => ({
      serialLogs: [newLog, ...state.serialLogs].slice(0, 500), // Keep last 500 logs
    }));
  },

  clearSerialLogs: () => set({ serialLogs: [] }),

  // UI state
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
}));

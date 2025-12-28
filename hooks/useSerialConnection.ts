import { useEffect, useState } from 'react';
import { serialService } from '@/services/serialService';
import { useIoTStore } from './useIoTStore';
import type { WebSocketMessage, Student } from '@/types';

export function useSerialConnection() {
  const [error, setError] = useState<string | null>(null);
  const { 
    setConnected, 
    addAttendanceLog, 
    setSystemStatus,
    addStudent,
    checkUid,
    students 
  } = useIoTStore();

  useEffect(() => {
    const unsubscribe = serialService.subscribe((message: WebSocketMessage) => {
      console.log('Received message:', message);

      // Handle async operations
      (async () => {
        switch (message.type) {
          case 'ATTENDANCE':
            // Check if student exists by UID
            const student = await checkUid(message.data.uid);
            if (student) {
              await addAttendanceLog({
                uid: message.data.uid,
                studentName: student.name,
                class: student.class,
                status: 'HADIR',
                source: 'ktp',
              });
            } else {
              // UID not registered
              await addAttendanceLog({
                uid: message.data.uid,
                studentName: 'UNKNOWN',
                class: 'UNKNOWN',
                status: 'DITOLAK',
                source: 'ktp',
              });
            }
            break;

          case 'STUDENT_ADDED':
            // Add student to store when Arduino confirms
            const newStudent: Student = {
              id: Date.now().toString(),
              name: message.data.name,
              class: message.data.class,
              nis: message.data.nis,
              uid: message.data.uid,
              createdAt: new Date(),
            };
            await addStudent(newStudent);
            console.log('Student added to store:', newStudent);
            break;

          case 'ERROR':
            setError(message.data.message);
            setTimeout(() => setError(null), 5000);
            break;
        }
      })();
    });

    return () => {
      unsubscribe();
    };
  }, [addAttendanceLog, setSystemStatus, addStudent, checkUid, students]);

  const connect = async () => {
    try {
      const success = await serialService.connect();
      setConnected(success);
      if (!success) {
        setError('Gagal terhubung ke perangkat');
      }
      return success;
    } catch (err) {
      setError('Error: ' + (err as Error).message);
      return false;
    }
  };

  const disconnect = async () => {
    await serialService.disconnect();
    setConnected(false);
  };

  return {
    connect,
    disconnect,
    isConnected: serialService.getConnectionStatus(),
    error,
    serialService,
  };
}

import { useEffect, useState } from 'react';
import { serialService } from '@/services/serialService';
import { websocketService } from '@/lib/websocketService';
import { useIoTStore } from './useIoTStore';
import type { WebSocketMessage, Student } from '@/types';
import { toast } from 'sonner';

export function useSerialConnection() {
  const [error, setError] = useState<string | null>(null);
  const { 
    setConnected, 
    addAttendanceLog, 
    addStudent,
    checkUid,
    isConnected,
    connectionMode,
    setConnectionMode
  } = useIoTStore();

  useEffect(() => {
    // Handle messages from both Serial and WiFi
    const handleMsg = async (message: WebSocketMessage) => {
      console.log('📨 Received message:', message);

      switch (message.type) {
        case 'ATTENDANCE':
          console.log('👤 Processing attendance:', message.data);
          console.log('🔍 Raw status dari Arduino:', JSON.stringify(message.data.status));
          
          // Normalize status (trim dan uppercase untuk comparison)
          const normalizedStatus = message.data.status?.trim().toUpperCase();
          console.log('📊 Status normalized:', JSON.stringify(normalizedStatus));
          
          // Cek jika status DITOLAK (KTP tidak terdaftar di Arduino)
          if (normalizedStatus === 'DITOLAK' || message.data.name === 'UNKNOWN') {
            console.log('❌ Card REJECTED by Arduino (not registered)');
            
            // Try to save rejection log, handle if already exists
            try {
              await addAttendanceLog({
                uid: message.data.uid,
                studentName: 'UNKNOWN',
                class: 'UNKNOWN',
                status: 'DITOLAK',
                source: 'ktp',
              });
              
              toast.error('❌ KTP tidak terdaftar!', {
                description: `UID: ${message.data.uid}`,
                duration: 4000,
              });
            } catch (error: any) {
              // Handle 409 jika UNKNOWN sudah scan hari ini
              if (error.message && error.message.includes('Sudah absen')) {
                console.log('⚠️ UNKNOWN card already scanned today');
                toast.warning('⚠️ KTP tidak terdaftar sudah di-scan hari ini!', {
                  description: 'Silakan daftarkan KTP terlebih dahulu',
                  duration: 5000,
                });
              } else {
                console.error('Failed to log rejection:', error);
              }
            }
            return; // STOP di sini
          }
          
          // Check if student exists by UID
          const student = await checkUid(message.data.uid);
          
          if (student) {
            console.log('🔎 Comparing:', normalizedStatus, '===', 'SUDAH_ABSEN', '?', normalizedStatus === 'SUDAH_ABSEN');
            
            // Cek jika status SUDAH_ABSEN dari Arduino
            if (normalizedStatus === 'SUDAH_ABSEN') {
              console.log('⚠️ DETECTED: Student already attended today:', student.name);
              console.log('🚫 STOPPING: Will not save to database');
              toast.warning(`⚠️ ${student.name} sudah absen hari ini!`, {
                description: 'Mahasiswa hanya bisa absen 1 kali per hari',
                duration: 5000,
              });
              // STOP di sini, jangan save ke database
              return;
            }
            
            console.log('✅ Status is HADIR, proceeding to save...');
            
            // Save ke database untuk status HADIR
            try {
              await addAttendanceLog({
                uid: message.data.uid,
                studentId: student.id,
                studentName: student.name,
                class: student.class,
                status: 'HADIR',
                source: 'ktp',
              });
              
              // Success notification
              toast.success(`${student.name} berhasil absen!`, {
                description: `Kelas: ${student.class}`,
                duration: 3000,
              });
            } catch (error: any) {
              console.error('Failed to add attendance:', error);
              
              // Handle 409 Conflict (already attended)
              if (error.message && error.message.includes('Sudah absen')) {
                console.log('⚠️ API says: Already attended today');
                toast.warning(`⚠️ ${student.name} sudah absen hari ini!`, {
                  description: 'Mahasiswa hanya bisa absen 1 kali per hari',
                  duration: 5000,
                });
              } else {
                toast.error('Gagal menyimpan absensi', {
                  description: error.message || 'Silakan coba lagi',
                });
              }
            }
          } else {
            console.log('❌ UID not found in database (fallback handler)');
            // This should not happen if DITOLAK check above works
            toast.error('❌ KTP tidak terdaftar!', {
              description: `UID: ${message.data.uid}`,
              duration: 4000,
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

        default:
          console.log('Unhandled message type:', message.type);
      }
    };

    // Subscribe to both Serial and WiFi messages
    console.log('🔌 Setting up message subscriptions...');
    const unsubscribeSerial = serialService.subscribe(handleMsg);
    const unsubscribeWifi = websocketService.onMessage(handleMsg);

    return () => {
      console.log('🔌 Cleaning up subscriptions...');
      unsubscribeSerial();
      unsubscribeWifi();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connect = async (mode: 'serial' | 'wifi' = 'serial', wifiIP?: string) => {
    try {
      if (mode === 'wifi' && wifiIP) {
        await websocketService.connect(wifiIP);
        const isConnected = websocketService.getConnectionStatus();
        setConnected(isConnected);
        if (isConnected) {
          setConnectionMode('wifi');
          setError(null);
        } else {
          setError('Gagal terhubung ke WiFi');
        }
        return isConnected;
      } else {
        const success = await serialService.connect();
        setConnected(success);
        if (success) {
          setConnectionMode('serial');
          setError(null);
        } else {
          setError('Gagal terhubung ke perangkat');
        }
        return success;
      }
    } catch (err) {
      setError('Error: ' + (err as Error).message);
      return false;
    }
  };

  const disconnect = async () => {
    if (connectionMode === 'wifi') {
      await websocketService.disconnect();
    } else {
      await serialService.disconnect();
    }
    setConnected(false);
    setConnectionMode(null);
  };

  const sendCommand = (command: string) => {
    if (connectionMode === 'wifi') {
      websocketService.sendCommand(command);
    } else {
      serialService.sendCommand(command);
    }
  };

  return {
    connect,
    disconnect,
    sendCommand,
    isConnected,
    connectionMode,
    error,
    serialService,
    websocketService,
  };
}

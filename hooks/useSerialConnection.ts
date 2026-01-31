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
        case 'RFID_SCAN':
          console.log('🔍 RFID Scan received (Reader Mode):', message.data.uid);
          
          // Check if student exists in database
          const student = await checkUid(message.data.uid);
          
          if (!student) {
            console.log('❌ UID not found in database');
            
            // Send feedback to ESP8266
            try {
              if (connectionMode === 'wifi') {
                await websocketService.sendCommand('LCD:KTM TIDAK|TERDAFTAR');
                await websocketService.sendCommand('BEEP_ERROR');
              }
            } catch (error) {
              console.error('Failed to send feedback to ESP8266:', error);
            }
            
            toast.error('❌ KTM tidak terdaftar!', {
              description: `UID: ${message.data.uid}`,
              duration: 4000,
            });
            return;
          }
          
          console.log('✅ Student found:', student.name);
          
          // Try to save attendance
          try {
            await addAttendanceLog({
              uid: message.data.uid,
              studentId: student.id,
              studentName: student.name,
              class: student.class,
              status: 'HADIR',
              source: 'KTM',
            });
            
            // Send SUCCESS feedback to ESP8266
            try {
              if (connectionMode === 'wifi') {
                await websocketService.sendCommand(`LCD:HADIR|${student.name.substring(0, 16)}`);
                await websocketService.sendCommand('BEEP_SUCCESS');
              }
            } catch (error) {
              console.error('Failed to send success feedback to ESP8266:', error);
            }
            
            // Success notification
            toast.success(`✅ ${student.name} berhasil absen!`, {
              description: `Kelas: ${student.class}`,
              duration: 3000,
            });
          } catch (error: any) {
            console.error('Failed to add attendance:', error);
            
            // Handle 409 Conflict (already attended)
            if (error.message && error.message.includes('Sudah absen')) {
              console.log('⚠️ Student already attended today');
              
              // Send ALREADY ATTENDED feedback to ESP8266
              try {
                if (connectionMode === 'wifi') {
                  await websocketService.sendCommand('LCD:SUDAH ABSEN!|' + student.name.substring(0, 16));
                  await websocketService.sendCommand('BEEP_ERROR');
                }
              } catch (error) {
                console.error('Failed to send duplicate feedback to ESP8266:', error);
              }
              
              toast.warning(`⚠️ ${student.name} sudah absen hari ini!`, {
                description: 'Mahasiswa hanya bisa absen 1 kali per hari',
                duration: 5000,
              });
            } else {
              // Send ERROR feedback to ESP8266
              try {
                if (connectionMode === 'wifi') {
                  await websocketService.sendCommand('LCD:ERROR|GAGAL SIMPAN');
                  await websocketService.sendCommand('BEEP_ERROR');
                }
              } catch (error) {
                console.error('Failed to send error feedback to ESP8266:', error);
              }
              
              toast.error('Gagal menyimpan absensi', {
                description: error.message || 'Silakan coba lagi',
              });
            }
          }
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

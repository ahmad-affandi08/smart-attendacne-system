import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(d);
}

export function formatTime(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(d);
}

export function formatUID(uid: string): string {
  return uid.toUpperCase().replace(/\s/g, '');
}

export function parseSerialMessage(message: string): {
  type: string;
  data: any;
} | null {
  try {
    console.log('[Parser] Raw message:', message);
    
    // Handle RFID scan from ESP8266 (Reader Only Mode)
    if (message.startsWith('RFID_SCAN:')) {
      const uid = message.substring(10).trim();
      console.log('[Parser] RFID Scanned (Reader Mode):', uid);
      return {
        type: 'RFID_SCAN',
        data: { uid }
      };
    }
    
    // Handle success response (should NOT be parsed as attendance)
    if (message.startsWith('WEB_OK:')) {
      console.log('[Parser] INFO message:', message.substring(7).trim());
      return {
        type: 'INFO',
        data: { message: message.substring(7).trim() }
      };
    }
    
    // Handle error response
    if (message.startsWith('WEB_ERROR:')) {
      console.log('[Parser] ERROR message:', message.substring(10).trim());
      return {
        type: 'ERROR',
        data: { message: message.substring(10).trim() }
      };
    }
    
    if (message.startsWith('WEB_MASTER_SET:')) {
      return {
        type: 'MASTER_SET',
        data: { uid: message.substring(15).trim() }
      };
    }
    
    if (message.startsWith('ACTIVE_STUDENT:')) {
      const data = message.substring(15).trim();
      if (data === 'NONE') {
        return {
          type: 'STATUS',
          data: { activeStudent: null }
        };
      }
      const parts = data.split(',');
      return {
        type: 'STATUS',
        data: {
          activeStudent: {
            name: parts[0],
            class: parts[1],
            nis: parts[2]
          }
        }
      };
    }
    
    if (message.startsWith('MASTER_CARD:')) {
      return {
        type: 'STATUS',
        data: { masterCard: message.substring(12).trim() }
      };
    }
    
    // Handle student list response (from LIST_Mahasiswa)
    if (message.startsWith('WEB_Mahasiswa:')) {
      const data = message.substring(10).trim();
      const parts = data.split(',');
      if (parts.length >= 3) {
        console.log('[Parser] STUDENT_LIST item:', parts);
        return {
          type: 'STUDENT_LIST',
          data: {
            name: parts[0],
            class: parts[1],
            nis: parts[2],
            uid: parts[3] || ''
          }
        };
      }
    }
    
    // Handle student added response
    if (message.startsWith('WEB_Mahasiswa_ADDED:')) {
      const data = message.substring(16).trim();
      const parts = data.split(',');
      return {
        type: 'STUDENT_ADDED',
        data: {
          name: parts[0],
          class: parts[1],
          nis: parts[2],
          uid: parts[3] || ''
        }
      };
    }
    
    // Handle active student set response
    if (message.startsWith('WEB_ACTIVE_SET:')) {
      const data = message.substring(15).trim();
      const parts = data.split(',');
      return {
        type: 'ACTIVE_STUDENT_SET',
        data: {
          name: parts[0],
          class: parts[1],
          nis: parts[2]
        }
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing serial message:', error);
    return null;
  }
}

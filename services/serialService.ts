// Service untuk komunikasi dengan ESP8266 via Serial/WebSocket
import { parseSerialMessage } from '@/lib/utils';
import type { SerialCommand, WebSocketMessage } from '@/types';

class SerialService {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private isConnected: boolean = false;
  private listeners: Array<(message: WebSocketMessage) => void> = [];

  async connect(): Promise<boolean> {
    try {
      // Check if Web Serial API is available
      if (!('serial' in navigator)) {
        throw new Error('Web Serial API not supported in this browser');
      }

      // Request port access
      this.port = await (navigator as any).serial.requestPort();
      
      // Open connection with ESP8266 baud rate (115200)
      await this.port.open({ baudRate: 115200 });
      
      this.isConnected = true;
      
      // Start reading
      this.startReading();
      
      // Get writer
      if (this.port.writable) {
        this.writer = this.port.writable.getWriter();
      }
      
      // Get initial status and student list
      await this.sendCommand('STATUS');
      
      // Small delay then get student list
      setTimeout(() => {
        this.sendCommand('LIST_Mahasiswa');
      }, 500);
      
      return true;
    } catch (error) {
      console.error('Serial connection error:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.reader) {
      await this.reader.cancel();
      this.reader.releaseLock();
      this.reader = null;
    }

    if (this.writer) {
      this.writer.releaseLock();
      this.writer = null;
    }

    if (this.port) {
      await this.port.close();
      this.port = null;
    }

    this.isConnected = false;
  }

  private async startReading(): Promise<void> {
    if (!this.port || !this.port.readable) return;

    this.reader = this.port.readable.getReader();
    const textDecoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { value, done } = await this.reader.read();
        if (done) break;

        const text = textDecoder.decode(value);
        buffer += text;

        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed) {
            this.processMessage(trimmed);
          }
        }
      }
    } catch (error) {
      console.error('Serial reading error:', error);
    } finally {
      this.reader.releaseLock();
    }
  }

  private processMessage(message: string): void {
    console.log('[Serial] Raw:', message);

    const parsed = parseSerialMessage(message);
    if (parsed) {
      console.log('[Serial] Parsed:', parsed.type, parsed.data);
      const wsMessage: WebSocketMessage = {
        type: parsed.type as any,
        data: parsed.data,
        timestamp: new Date().toISOString()
      };
      
      this.notifyListeners(wsMessage);
    } else {
      console.log('[Serial] Not parsed (ignored):', message);
    }
  }

  async sendCommand(command: string, params?: string[]): Promise<boolean> {
    if (!this.writer || !this.isConnected) {
      console.error('Serial not connected');
      return false;
    }

    try {
      let fullCommand = command;
      if (params && params.length > 0) {
        fullCommand += ',' + params.join(',');
      }
      fullCommand += '\n';

      const encoder = new TextEncoder();
      await this.writer.write(encoder.encode(fullCommand));
      
      console.log('[Serial Send]', fullCommand.trim());
      return true;
    } catch (error) {
      console.error('Serial write error:', error);
      return false;
    }
  }

  // Convenience methods untuk Arduino commands
  async addStudent(name: string, kelas: string, nis: string, uid: string): Promise<boolean> {
    return this.sendCommand('ADD_Mahasiswa', [name, kelas, nis, uid]);
  }

  async getStatus(): Promise<boolean> {
    return this.sendCommand('STATUS');
  }

  async getStudentList(): Promise<boolean> {
    return this.sendCommand('LIST_Mahasiswa');
  }

  async getLogs(): Promise<boolean> {
    return this.sendCommand('GET_LOG');
  }

  async requestScan(): Promise<boolean> {
    return this.sendCommand('SCAN');
  }

  async setModeNormal(): Promise<boolean> {
    return this.sendCommand('MODE_NORMAL');
  }

  async setModeRegister(): Promise<boolean> {
    return this.sendCommand('MODE_REGISTER');
  }

  async reset(): Promise<boolean> {
    return this.sendCommand('RESET');
  }

  // Listener management
  subscribe(callback: (message: WebSocketMessage) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners(message: WebSocketMessage): void {
    this.listeners.forEach(callback => callback(message));
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
export const serialService = new SerialService();

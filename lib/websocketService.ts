import { parseSerialMessage } from './utils';

type MessageCallback = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private listeners: MessageCallback[] = [];
  private reconnectTimer: NodeJS.Timeout | null = null;
  private ipAddress: string = '';
  private shouldReconnect: boolean = false;
  private isConnecting: boolean = false;

  connect(ipAddress: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        // Prevent duplicate connections
        if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
          console.log('Already connected or connecting');
          resolve(true);
          return;
        }

        this.isConnecting = true;
        this.ipAddress = ipAddress;
        this.shouldReconnect = true;
        const wsUrl = `ws://${ipAddress}:81`;
        
        console.log('Connecting to WebSocket:', wsUrl);
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnecting = false;
          resolve(true);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          reject(new Error('Gagal terhubung ke WebSocket'));
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.isConnecting = false;
          if (this.shouldReconnect) {
            this.attemptReconnect();
          }
        };

        this.ws.onmessage = (event) => {
          const message = event.data;
          console.log('📡 WebSocket received:', message);
          
          const parsed = parseSerialMessage(message);
          if (parsed) {
            console.log('✅ Parsed message:', parsed);
            this.notifyListeners(parsed);
          } else {
            console.warn('⚠️ Failed to parse message:', message);
          }
        };

        // Timeout jika tidak connect dalam 5 detik
        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            this.isConnecting = false;
            this.ws?.close();
            reject(new Error('Koneksi timeout'));
          }
        }, 5000);

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect(): void {
    console.log('Disconnecting WebSocket...');
    this.shouldReconnect = false;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  sendCommand(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket tidak terhubung'));
        return;
      }

      try {
        this.ws.send(command);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  onMessage(callback: MessageCallback): () => void {
    console.log('➕ Adding message listener');
    this.listeners.push(callback);
    console.log(`📋 Total listeners: ${this.listeners.length}`);
    return () => {
      console.log('➖ Removing message listener');
      this.listeners = this.listeners.filter(l => l !== callback);
      console.log(`📋 Total listeners: ${this.listeners.length}`);
    };
  }

  getConnectionStatus(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private notifyListeners(data: any): void {
    console.log(`📢 Notifying ${this.listeners.length} listeners with:`, data);
    this.listeners.forEach(callback => callback(data));
  }

  private attemptReconnect(): void {
    if (this.reconnectTimer || !this.shouldReconnect) return;
    
    console.log('Attempting to reconnect in 5 seconds...');
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.ipAddress && this.shouldReconnect) {
        this.connect(this.ipAddress).catch(err => {
          console.error('Reconnection failed:', err);
        });
      }
    }, 5000);
  }
}

export const websocketService = new WebSocketService();

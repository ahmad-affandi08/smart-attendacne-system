'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSerialConnection } from "@/hooks/useSerialConnection";
import { useIoTStore } from "@/hooks/useIoTStore";
import { Wifi, WifiOff, RefreshCw, AlertCircle, Trash2, Radio } from "lucide-react";
import { toast } from "sonner";

type ConnectionMode = 'serial' | 'wifi';

export function ConnectionCard() {
  const serialConnection = useSerialConnection();
  const { isConnected, connectionMode: globalConnectionMode } = useIoTStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [localMode, setLocalMode] = useState<ConnectionMode>('serial');
  const [wifiIP, setWifiIP] = useState('192.168.1.100');

  const error = serialConnection.error;

  const handleConnectSerial = async () => {
    setLocalMode('serial');
    setIsConnecting(true);
    const success = await serialConnection.connect('serial');
    setIsConnecting(false);
    if (success) {
      toast.success('Terhubung via USB Serial!', {
        description: 'Perangkat siap digunakan',
      });
    }
  };

  const handleConnectWifi = async () => {
    setLocalMode('wifi');
    setIsConnecting(true);
    try {
      const success = await serialConnection.connect('wifi', wifiIP);
      if (success) {
        toast.success('Terhubung via WiFi!', {
          description: `Connected to ${wifiIP}`,
        });
      } else {
        toast.error('Gagal terhubung via WiFi', {
          description: 'Periksa alamat IP dan koneksi jaringan',
        });
      }
    } catch (err) {
      toast.error('Error WiFi', {
        description: (err as Error).message,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await serialConnection.disconnect();
    toast.info('Terputus', {
      description: 'Koneksi diputus',
    });
  };

  const handleReset = async () => {
    if (!isConnected) {
      toast.error('Perangkat belum terhubung!', {
        description: 'Hubungkan perangkat terlebih dahulu',
      });
      return;
    }

    const confirmed = confirm(
      '⚠️ PERHATIAN!\n\nApakah Anda yakin ingin menghapus SEMUA data?\n\n' +
      '• Semua data mahasiswa akan dihapus\n' +
      '• Semua riwayat absensi akan dihilangkan\n' +
      '• Data EEPROM Arduino akan dikosongkan\n' +
      '• Data database akan dihapus\n\n' +
      'Tindakan ini TIDAK DAPAT dibatalkan!'
    );

    if (!confirmed) return;

    setIsResetting(true);
    try {
      // 1. Reset Arduino EEPROM
      serialConnection.sendCommand('RESET');
      
      // 2. Clear database (attendance logs)
      const response = await fetch('/api/attendance', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Gagal menghapus data database');
      }

      toast.success('Data berhasil dihapus!', {
        description: 'Semua data di perangkat dan database telah dibersihkan',
        duration: 5000,
      });

      // Refresh page to update UI
      window.location.reload();
    } catch (error) {
      console.error('Failed to reset:', error);
      toast.error('Gagal menghapus data', {
        description: error instanceof Error ? error.message : 'Silakan coba lagi',
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isConnected ? (
            <Wifi className="h-5 w-5 text-black" />
          ) : (
            <WifiOff className="h-5 w-5 text-gray-500" />
          )}
          Koneksi ESP8266
        </CardTitle>
        <CardDescription>
          {isConnected
            ? `Terhubung via ${globalConnectionMode === 'serial' ? 'USB Serial' : 'WiFi'}`
            : "Pilih mode koneksi"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-gray-100 p-3 text-sm text-gray-900">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {!isConnected && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={localMode === 'serial' ? 'default' : 'outline'}
                onClick={() => setLocalMode('serial')}
                className="flex-1"
              >
                <Radio className="mr-2 h-4 w-4" />
                USB Serial
              </Button>
              <Button
                variant={localMode === 'wifi' ? 'default' : 'outline'}
                onClick={() => setLocalMode('wifi')}
                className="flex-1"
              >
                <Wifi className="mr-2 h-4 w-4" />
                WiFi
              </Button>
            </div>

            {localMode === 'wifi' && (
              <div className="space-y-2">
                <Label htmlFor="ip-address">IP Address ESP8266</Label>
                <Input
                  id="ip-address"
                  type="text"
                  placeholder="192.168.1.100"
                  value={wifiIP}
                  onChange={(e) => setWifiIP(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Cek IP di LCD atau Serial Monitor saat ESP8266 menyala
                </p>
              </div>
            )}

            <Button
              onClick={localMode === 'serial' ? handleConnectSerial : handleConnectWifi}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Menghubungkan...
                </>
              ) : (
                `Hubungkan via ${localMode === 'serial' ? 'USB' : 'WiFi'}`
              )}
            </Button>
          </div>
        )}

        {isConnected && (
          <div className="flex gap-2">
            <Button
              onClick={handleDisconnect}
              variant="destructive"
              className="flex-1"
            >
              Putuskan Koneksi
            </Button>
            <Button
              onClick={handleReset}
              disabled={isResetting}
              variant="outline"
              className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
            >
              {isResetting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Hapus Semua Data
                </>
              )}
            </Button>
          </div>
        )}

        {!isConnected && localMode === 'serial' && (
          <div className="rounded-lg bg-gray-100 p-3 text-sm text-gray-900">
            <p className="font-medium mb-1">Cara menghubungkan via USB:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Pastikan ESP8266 terhubung via USB</li>
              <li>Klik tombol "Hubungkan via USB"</li>
              <li>Pilih port COM yang sesuai</li>
              <li>Browser akan meminta izin akses serial</li>
            </ol>
          </div>
        )}

        {localMode === 'wifi' && !isConnected && (
          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
            <p className="font-medium mb-1">Mode WiFi:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>ESP8266 harus terhubung ke WiFi</li>
              <li>IP Address ditampilkan di LCD saat startup</li>
              <li>Pastikan laptop & ESP8266 di jaringan yang sama</li>
              <li>WebSocket port: 81</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

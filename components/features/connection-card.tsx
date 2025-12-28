'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSerialConnection } from "@/hooks/useSerialConnection";
import { useIoTStore } from "@/hooks/useIoTStore";
import { Wifi, WifiOff, RefreshCw, AlertCircle } from "lucide-react";

export function ConnectionCard() {
  const { connect, disconnect, isConnected, error } = useSerialConnection();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    await connect();
    setIsConnecting(false);
  };

  const handleDisconnect = async () => {
    await disconnect();
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
            ? "Terhubung dengan perangkat IoT"
            : "Belum terhubung dengan perangkat"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-gray-100 p-3 text-sm text-gray-900">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="flex gap-2">
          {!isConnected ? (
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Menghubungkan...
                </>
              ) : (
                "Hubungkan Perangkat"
              )}
            </Button>
          ) : (
            <Button
              onClick={handleDisconnect}
              variant="destructive"
              className="w-full"
            >
              Putuskan Koneksi
            </Button>
          )}
        </div>

        {!isConnected && (
          <div className="rounded-lg bg-gray-100 p-3 text-sm text-gray-900">
            <p className="font-medium mb-1">Cara menghubungkan:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Pastikan ESP8266 terhubung via USB</li>
              <li>Klik tombol "Hubungkan Perangkat"</li>
              <li>Pilih port COM yang sesuai</li>
              <li>Browser akan meminta izin akses serial</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

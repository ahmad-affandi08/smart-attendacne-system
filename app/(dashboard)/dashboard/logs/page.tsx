'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { useIoTStore } from '@/hooks/useIoTStore';
import { serialService } from '@/services/serialService';
import { Trash2, Download, Terminal, Clock, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function LogsPage() {
  const { serialLogs, addSerialLog, clearSerialLogs, isConnected } = useIoTStore();
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showClearDialog, setShowClearDialog] = useState(false);

  // Subscribe to serial messages
  useEffect(() => {
    const unsubscribe = serialService.subscribe((message) => {
      // Add raw message to logs
      const logMessage = `[${message.type}] ${JSON.stringify(message.data)}`;
      addSerialLog(logMessage, message.type);
    });

    return () => unsubscribe();
  }, [addSerialLog]);

  // Auto scroll to bottom
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [serialLogs, autoScroll]);

  const handleClearLogs = () => {
    setShowClearDialog(true);
  };

  const confirmClearLogs = () => {
    clearSerialLogs();
    setShowClearDialog(false);
  };

  const handleDownloadLogs = () => {
    const logsText = serialLogs
      .map((log) => `[${format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}] [${log.type}] ${log.message}`)
      .join('\n');

    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `serial-logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'ERROR':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'STATUS':
      case 'ATTENDANCE':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'INFO':
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'ERROR':
        return 'bg-red-50 border-red-200';
      case 'STATUS':
      case 'ATTENDANCE':
        return 'bg-green-50 border-green-200';
      case 'INFO':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Logs Koneksi</h1>
          <p className="text-gray-500 mt-1">Pesan real-time dari ESP8266/Arduino</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? 'default' : 'secondary'} className={isConnected ? 'bg-green-600' : ''}>
            {isConnected ? 'Terhubung' : 'Terputus'}
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <Terminal className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serialLogs.length}</div>
            <p className="text-xs text-gray-500">Maksimal 500 logs tersimpan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status Koneksi</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isConnected ? 'Aktif' : 'Tidak Aktif'}</div>
            <p className="text-xs text-gray-500">
              {serialLogs.length > 0
                ? `Terakhir: ${format(new Date(serialLogs[0].timestamp), 'HH:mm:ss')}`
                : 'Belum ada data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto Scroll</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm">Scroll otomatis ke bawah</span>
            </label>
          </CardContent>
        </Card>
      </div>

      {/* Logs Display */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Serial Logs</CardTitle>
              <CardDescription>Pesan real-time dari perangkat IoT</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadLogs} disabled={serialLogs.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearLogs} disabled={serialLogs.length === 0}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-black rounded-lg p-4 h-[500px] overflow-y-auto font-mono text-sm">
            {serialLogs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Terminal className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Belum ada logs</p>
                  <p className="text-xs mt-1">Hubungkan ke ESP8266 untuk melihat pesan</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {serialLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2 rounded border ${getLogColor(log.type)} flex items-start gap-2`}
                  >
                    {getLogIcon(log.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                        <span className="font-semibold">{format(new Date(log.timestamp), 'HH:mm:ss.SSS')}</span>
                        <Badge variant="outline" className="text-xs">
                          {log.type}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-900 break-all">{log.message}</div>
                    </div>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      {!isConnected && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900">Koneksi Terputus</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Hubungkan ke ESP8266 melalui sidebar untuk melihat logs real-time.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clear Logs Confirmation Dialog */}
      <AlertDialog
        isOpen={showClearDialog}
        onClose={() => setShowClearDialog(false)}
        onConfirm={confirmClearLogs}
        title="Hapus Semua Logs"
        description="Apakah Anda yakin ingin menghapus semua logs? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus Semua"
        cancelText="Batal"
        variant="warning"
      />
    </div>
  );
}

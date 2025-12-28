'use client';

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useIoTStore } from "@/hooks/useIoTStore";
import { formatTime } from "@/lib/utils";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export function RealtimeAttendance() {
  const { attendanceLogs } = useIoTStore();
  const recentLogs = attendanceLogs.slice(0, 10);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'HADIR':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'TIDAK HADIR':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'IZIN':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <XCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'HADIR':
        return 'success';
      case 'TIDAK HADIR':
        return 'danger';
      case 'IZIN':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Absensi Real-time
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentLogs.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-300 mb-2" />
            <p>Belum ada data absensi</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(log.status)}
                  <div>
                    <p className="font-medium text-gray-900">{log.studentName}</p>
                    <p className="text-sm text-gray-500">
                      {log.class} 
                      {log.source === 'manual' && (
                        <span className="ml-2 text-xs text-gray-400">
                          (Manual)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={getStatusBadgeVariant(log.status)}>
                    {log.status}
                  </Badge>
                  <p className="mt-1 text-xs text-gray-500">
                    {formatTime(log.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useIoTStore } from "@/hooks/useIoTStore";
import { formatDate, formatTime } from "@/lib/utils";
import { ClipboardList, Download, Search, Calendar, CheckCircle, XCircle } from "lucide-react";

export default function AttendancePage() {
  const { attendanceLogs } = useIoTStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const filteredLogs = attendanceLogs.filter((log) => {
    const matchesSearch =
      log.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.class.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.uid.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesDate = true;
    if (dateFilter) {
      const logDate = new Date(log.timestamp).toISOString().split('T')[0];
      matchesDate = logDate === dateFilter;
    }

    return matchesSearch && matchesDate;
  });

  const exportToCSV = () => {
    const headers = ['Tanggal', 'Waktu', 'UID', 'Nama', 'Kelas', 'Status'];
    const rows = filteredLogs.map(log => [
      new Date(log.timestamp).toLocaleDateString('id-ID'),
      formatTime(log.timestamp),
      log.uid,
      log.studentName,
      log.class,
      log.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `absensi_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = {
    total: filteredLogs.length,
    hadir: filteredLogs.filter(log => log.status === 'HADIR').length,
    ditolak: filteredLogs.filter(log => log.status === 'DITOLAK').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Riwayat Absensi</h1>
          <p className="text-gray-500 mt-1">
            Lihat dan kelola data absensi Mahasiswa
          </p>
        </div>
        <Button onClick={exportToCSV} disabled={filteredLogs.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Scan</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <ClipboardList className="h-8 w-8 text-black" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Hadir</p>
                <p className="text-2xl font-bold text-black mt-1">{stats.hadir}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-black" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ditolak</p>
                <p className="text-2xl font-bold text-gray-700 mt-1">{stats.ditolak}</p>
              </div>
              <XCircle className="h-8 w-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Cari berdasarkan nama, kelas, atau UID..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                type="date"
                className="pl-10"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Data Absensi ({filteredLogs.length})</CardTitle>
          <CardDescription>
            Riwayat lengkap semua aktivitas scan kartu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <ClipboardList className="mx-auto h-12 w-12 text-gray-300 mb-2" />
              <p>Belum ada data absensi</p>
              <p className="text-sm mt-1">Data akan muncul setelah ada aktivitas scan</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Waktu
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      UID
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Nama
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Kelas
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p className="font-medium text-gray-900">
                            {new Date(log.timestamp).toLocaleDateString('id-ID')}
                          </p>
                          <p className="text-gray-500">{formatTime(log.timestamp)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {log.uid}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {log.studentName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {log.class}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            log.status === 'HADIR'
                              ? 'success'
                              : log.status === 'DITOLAK'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {log.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

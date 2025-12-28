'use client';

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { useIoTStore } from "@/hooks/useIoTStore";
import { formatDate, formatTime } from "@/lib/utils";
import { ClipboardList, Download, Search, Calendar, CheckCircle, XCircle, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function AttendancePage() {
  const { attendanceLogs, deleteAttendanceLog, deleteAllAttendanceLogs } = useIoTStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Alert Dialog states
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  });
  const [deleteAllDialog, setDeleteAllDialog] = useState(false);

  const filteredLogs = attendanceLogs.filter((log) => {
    const matchesSearch =
      log.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.class.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.uid.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesDateRange = true;
    if (startDate || endDate) {
      const logDate = new Date(log.timestamp).toISOString().split('T')[0];

      if (startDate && endDate) {
        matchesDateRange = logDate >= startDate && logDate <= endDate;
      } else if (startDate) {
        matchesDateRange = logDate >= startDate;
      } else if (endDate) {
        matchesDateRange = logDate <= endDate;
      }
    }

    return matchesSearch && matchesDateRange;
  });

  const exportToCSV = () => {
    const escapeCSVField = (field: string | number) => {
      const stringField = String(field);
      return `"${stringField.replace(/"/g, '""')}"`;
    };

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
      headers.map(escapeCSVField).join(';'),
      ...rows.map(row => row.map(escapeCSVField).join(';'))
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `absensi_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: string) => {
    setDeleteDialog({ isOpen: true, id });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.id) return;

    try {
      setIsDeleting(true);
      await deleteAttendanceLog(deleteDialog.id);
      toast.success('Riwayat absensi berhasil dihapus');
      setDeleteDialog({ isOpen: false, id: null });
    } catch (error) {
      toast.error('Gagal menghapus riwayat absensi');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    setDeleteAllDialog(true);
  };

  const confirmDeleteAll = async () => {
    try {
      setIsDeleting(true);
      await deleteAllAttendanceLogs();
      toast.success('Semua riwayat absensi berhasil dihapus');
      setDeleteAllDialog(false);
    } catch (error) {
      toast.error('Gagal menghapus semua riwayat absensi');
    } finally {
      setIsDeleting(false);
    }
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
        <div className="flex gap-2">
          <Button
            onClick={handleDeleteAll}
            disabled={attendanceLogs.length === 0 || isDeleting}
            variant="outline"
            className="bg-red-500 text-white hover:bg-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus Semua
          </Button>
          <Button onClick={exportToCSV} disabled={filteredLogs.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
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
          <div className="grid gap-4 md:grid-cols-3">
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
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Tanggal Mulai"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                type="date"
                className="pl-10"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Tanggal Akhir"
              />
            </div>
          </div>
          {(startDate || endDate) && (
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {startDate && endDate
                  ? `${new Date(startDate).toLocaleDateString('id-ID')} - ${new Date(endDate).toLocaleDateString('id-ID')}`
                  : startDate
                    ? `Dari ${new Date(startDate).toLocaleDateString('id-ID')}`
                    : `Sampai ${new Date(endDate).toLocaleDateString('id-ID')}`
                }
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="h-6 text-xs"
              >
                Reset
              </Button>
            </div>
          )}
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
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                      Aksi
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
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(log.id)}
                          disabled={isDeleting}
                          className="bg-red-500 text-white rounded-lg hover:text-white hover:bg-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Single Alert Dialog */}
      <AlertDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, id: null })}
        onConfirm={confirmDelete}
        title="Hapus Riwayat Absensi"
        description="Apakah Anda yakin ingin menghapus riwayat absensi ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Delete All Alert Dialog */}
      <AlertDialog
        isOpen={deleteAllDialog}
        onClose={() => setDeleteAllDialog(false)}
        onConfirm={confirmDeleteAll}
        title="Hapus Semua Riwayat"
        description="Apakah Anda yakin ingin menghapus SEMUA riwayat absensi? Tindakan ini akan menghapus seluruh data dan tidak dapat dibatalkan!"
        confirmText="Hapus Semua"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

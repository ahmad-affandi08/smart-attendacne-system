'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectionCard } from "@/components/features/connection-card";
import { RealtimeAttendance } from "@/components/features/realtime-attendance";
import { useIoTStore } from "@/hooks/useIoTStore";
import { Users, UserCheck, ClipboardList, XCircle, Clock } from "lucide-react";

export default function DashboardPage() {
  const { students, attendanceLogs } = useIoTStore();

  const todayLogs = attendanceLogs.filter((log) => {
    const today = new Date();
    const logDate = new Date(log.timestamp);
    return (
      logDate.getDate() === today.getDate() &&
      logDate.getMonth() === today.getMonth() &&
      logDate.getFullYear() === today.getFullYear()
    );
  });

  // Breakdown status hari ini
  const todayHadir = todayLogs.filter(log => log.status === 'HADIR').length;
  const todayTidakHadir = todayLogs.filter(log => log.status === 'TIDAK HADIR').length;
  const todayIzin = todayLogs.filter(log => log.status === 'IZIN').length;

  const stats = [
    {
      title: "Total Mahasiswa",
      value: students.length,
      icon: Users,
      color: "bg-black",
    },
    {
      title: "Hadir Hari Ini",
      value: todayHadir,
      icon: UserCheck,
      color: "bg-green-600",
    },
    {
      title: "Tidak Hadir",
      value: todayTidakHadir,
      icon: XCircle,
      color: "bg-red-600",
    },
    {
      title: "Izin",
      value: todayIzin,
      icon: Clock,
      color: "bg-yellow-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Monitoring sistem absensi real-time
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.color} rounded-full p-2`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-1">
        <ConnectionCard />
      </div>

      {/* Realtime Attendance */}
      <RealtimeAttendance />

      {/* Quick Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Statistik Absensi Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-500">Total Scan</p>
              <p className="text-2xl font-bold mt-1">{todayLogs.length}</p>
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm text-green-700">Hadir</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {todayHadir}
              </p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">Tidak Hadir</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {todayTidakHadir}
              </p>
            </div>
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <p className="text-sm text-yellow-700">Izin</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {todayIzin}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

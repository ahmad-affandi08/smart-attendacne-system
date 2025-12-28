'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  GraduationCap,
  Wifi,
  WifiOff,
  Icon,
  Activity,
} from "lucide-react";
import { useIoTStore } from "@/hooks/useIoTStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { serialService } from "@/services/serialService";
import { toast } from "sonner";
import { useState } from "react";

const menuItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Mahasiswa",
    href: "/dashboard/students",
    icon: Users,
  },
  {
    title: "Riwayat Absensi",
    href: "/dashboard/attendance",
    icon: ClipboardList,
  },
  {
    title: "Program Studi",
    href: "/dashboard/program-studi",
    icon: GraduationCap,
  },
  {
    title: "Logs Koneksi",
    href: "/dashboard/logs",
    icon: Activity
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isConnected, setConnected } = useIoTStore();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const success = await serialService.connect();
      if (success) {
        setConnected(true);
        toast.success("Berhasil terhubung ke ESP8266!");
      } else {
        toast.error("Gagal terhubung. Pastikan port dipilih dengan benar.");
      }
    } catch (error: any) {
      console.error('Connection error:', error);
      toast.error(error.message || "Gagal terhubung ke perangkat");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await serialService.disconnect();
      setConnected(false);
      toast.info("Koneksi diputus");
    } catch (error) {
      toast.error("Gagal memutuskan koneksi");
    }
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6">
          <h1 className="text-xl font-bold text-black">TapHadir</h1>
        </div>

        {/* Connection Status */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              {isConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-600">Terhubung</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-500">Terputus</span>
                </>
              )}
            </div>

            {/* Connect/Disconnect Button */}
            {isConnected ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDisconnect}
                className="w-full"
              >
                <WifiOff className="mr-2 h-4 w-4" />
                Putuskan
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full bg-black hover:bg-gray-800"
              >
                <Wifi className="mr-2 h-4 w-4" />
                {isConnecting ? "Menghubungkan..." : "Hubungkan"}
              </Button>
            )}
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-black text-white"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.title}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <p className="text-xs text-gray-500">© 2025 TapHadir</p>
        </div>
      </div>
    </aside>
  );
}

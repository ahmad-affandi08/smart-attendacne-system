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
import { useSerialConnection } from "@/hooks/useSerialConnection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  const { isConnected, connectionMode } = useIoTStore();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6">
          <div className="flex items-center gap-3">
            <img src="/Logo.png" alt="TapHadir Logo" className="h-20 w-20 object-contain" />
            <h1 className="text-xl font-bold text-black">TapHadir</h1>
          </div>
        </div>

        {/* Connection Status */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="space-y-2">
            <div className="flex flex-col items-center justify-center gap-1">
              {isConnected ? (
                <>
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Terhubung</span>
                  </div>
                  {connectionMode && (
                    <span className="text-xs text-gray-500">
                      via {connectionMode === 'serial' ? 'USB Serial' : 'WiFi'}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <WifiOff className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-500">Terputus</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    Hubungkan di Dashboard
                  </span>
                </>
              )}
            </div>
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
        <div className="border-t border-gray-200 p-4 text-center font-semibold">
          <p className="text-xs text-gray-500">© 2025 TapHadir</p>
        </div>
      </div>
    </aside>
  );
}

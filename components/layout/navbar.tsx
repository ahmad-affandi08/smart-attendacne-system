'use client';

import { Button } from "@/components/ui/button";
import { Bell, User, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="fixed left-64 right-0 top-0 z-30 border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-between px-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Sistem Absensi IoT
          </h2>
          <p className="text-sm text-gray-500">
            Monitoring &amp; Manajemen Real-time
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>

          <div className="mx-2 h-6 w-px bg-gray-200" />

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white">
              <User className="h-4 w-4" />
            </div>
            <div className="text-sm">
              <p className="font-medium">{session?.user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500">{session?.user?.role || 'ADMIN'}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}

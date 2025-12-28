import LoginForm from '@/components/auth/login-form'
import { GraduationCap } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-black text-white flex-col justify-center items-center p-12">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white text-black p-3 rounded-lg">
              <GraduationCap className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold">Smart Attendance</h1>
          </div>
          <p className="text-gray-300 text-lg leading-relaxed">
            Sistem absensi pintar berbasis IoT untuk memudahkan pengelolaan kehadiran Mahasiswa secara real-time dan efisien.
          </p>
          <div className="mt-12 space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-white/10 p-2 rounded">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Real-time Monitoring</h3>
                <p className="text-gray-400 text-sm">Pantau kehadiran Mahasiswa secara langsung</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-white/10 p-2 rounded">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Integrasi IoT</h3>
                <p className="text-gray-400 text-sm">Terhubung dengan perangkat ESP8266</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-white/10 p-2 rounded">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Laporan Lengkap</h3>
                <p className="text-gray-400 text-sm">Analisis data kehadiran yang komprehensif</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="bg-black text-white p-3 rounded-lg">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold">Smart Attendance</h1>
          </div>

          {/* Login Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Selamat Datang</h2>
              <p className="text-gray-600">Silakan masuk untuk melanjutkan</p>
            </div>

            <LoginForm />

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-500">
                Smart Attendance System v1.0
              </p>
            </div>
          </div>

          {/* Helper Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Default: <span className="font-mono text-gray-700">admin@admin.com</span> / <span className="font-mono text-gray-700">admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

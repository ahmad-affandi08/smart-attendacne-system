import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wifi, Users, CreditCard, Clock, ArrowRight, CheckCircle } from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: Wifi,
      title: "Koneksi Real-time",
      description: "Komunikasi langsung dengan ESP8266 via Web Serial API untuk monitoring real-time",
    },
    {
      icon: CreditCard,
      title: "KTP Mahasiswa",
      description: "Setiap mahasiswa memiliki KTP dengan UID unik untuk identifikasi otomatis",
    },
    {
      icon: Users,
      title: "Manajemen Mahasiswa",
      description: "Kelola data mahasiswa, program studi, dan scan KTP untuk registrasi",
    },
    {
      icon: Clock,
      title: "Riwayat Lengkap",
      description: "Catat dan pantau semua aktivitas absensi dengan timestamp akurat",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            TapHadir
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Solusi Absensi IoT Menggunakan Identitas Kependudukan (e-KTP).
            Mudah, cepat, dan akurat untuk kebutuhan sekolah modern.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="gap-2">
                Mulai Sekarang
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline">
              Pelajari Lebih Lanjut
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-2 hover:border-black transition-colors">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-black flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* How It Works */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Cara Kerja Sistem
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              "Hubungkan ESP8266 dengan komputer via USB",
              "Tambahkan program studi untuk organisasi data",
              "Daftarkan mahasiswa dengan scan KTP untuk mendapatkan UID unik",
              "Mahasiswa tap KTP pada reader untuk absensi otomatis",
              "Data absensi tersimpan real-time dan dapat diekspor",
            ].map((step, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black text-white font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-lg text-gray-700">{step}</p>
                </div>
                <CheckCircle className="h-6 w-6 text-gray-900 flex-shrink-0 mt-1" />
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 bg-black rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Siap Modernisasi Sistem Absensi Anda?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Mulai gunakan sistem absensi pintar berbasis IoT sekarang juga
          </p>
          <Link href="/login">
            <Button size="lg" variant="secondary" className="gap-2">
              Akses Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center text-gray-500 text-sm">
          <p>© 2025 Smart Absensi Sistem. Dibuat dengan Next.js & ESP8266</p>
        </div>
      </div>
    </div>
  );
}

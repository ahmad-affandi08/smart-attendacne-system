import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { DataInitializer } from "@/components/providers/data-initializer";
import { AuthProvider } from "@/components/providers/auth-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TapHadir - Solusi Absensi IoT dengan e-KTP",
  description: "Sistem absensi pintar berbasis IoT dengan RFID dan ESP8266",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/app/favicon.ico" type="image/x-icon" />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <DataInitializer />
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

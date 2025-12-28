# 🎓 Smart Absensi Sistem - IoT RFID

Sistem absensi pintar berbasis **IoT** dengan teknologi **RFID** dan **ESP8266**. Menggunakan konsep inovatif **1 Master Card untuk semua Mahasiswa**, memudahkan proses absensi di sekolah.

## ✨ Fitur Utama

- 🔌 **Real-time Connection**: Komunikasi langsung dengan ESP8266 via Web Serial API
- 💳 **1 Master Card System**: Satu kartu untuk mencatat kehadiran semua Mahasiswa
- 👥 **Manajemen Mahasiswa**: CRUD Mahasiswa dengan sistem Mahasiswa aktif
- 📊 **Dashboard Modern**: Monitoring absensi real-time dengan UI yang responsif
- 📈 **Statistik & Export**: Lihat statistik dan export data ke CSV
- 🔒 **Sistem Aman**: Validasi master card untuk setiap absensi

## 🛠️ Tech Stack

### Frontend
- **Next.js 16** - React Framework dengan App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - State management
- **Lucide Icons** - Icon library
- **Sonner** - Toast notifications

### Hardware
- **ESP8266** (NodeMCU/Wemos D1 Mini)
- **MFRC522** - RFID Reader
- **LCD I2C 16x2** - Display
- **Buzzer** - Audio feedback

### Communication
- **Web Serial API** - Browser to hardware communication
- Baud rate: **115200**

## 📦 Instalasi

### 1. Clone Repository
```bash
git clone <repository-url>
cd smart-attendacne-system
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Jalankan Development Server
```bash
npm run dev

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

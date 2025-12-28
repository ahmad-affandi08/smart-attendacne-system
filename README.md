# 🎯 TapHadir

**Solusi Absensi IoT Menggunakan Identitas Kependudukan (e-KTP)**

Sistem absensi pintar berbasis **IoT** dengan teknologi **RFID** dan **ESP8266**. Memanfaatkan **e-KTP** sebagai kartu identitas untuk absensi otomatis yang mudah, cepat, dan akurat.

---

## ✨ Fitur Utama

### 🔐 Autentikasi & Keamanan
- **Login System** dengan NextAuth.js
- **Role-based Access Control** (Admin)
- **Session Management** dengan JWT
- **Protected Routes** dengan middleware

### 🔌 Koneksi Real-time
- **Web Serial API** untuk komunikasi langsung dengan ESP8266
- **Real-time Logs** dari perangkat IoT
- **Auto-reconnect** dan status monitoring
- **Baud rate 115200** untuk komunikasi cepat

### 💳 Sistem e-KTP
- **Scan e-KTP** untuk absensi otomatis
- **UID Unik** setiap e-KTP tersimpan di database
- **Validasi Real-time** dengan feedback visual dan audio
- **Riwayat Lengkap** semua aktivitas scan

### 👥 Manajemen Mahasiswa
- **CRUD Mahasiswa** lengkap dengan validasi
- **Program Studi** management
- **Import/Export Data** dalam format CSV
- **Search & Filter** data mahasiswa

### 📊 Dashboard & Monitoring
- **Dashboard Modern** dengan statistik real-time
- **Grafik Kehadiran** interaktif
- **Export CSV** dengan format yang rapi
- **Logs Koneksi** untuk debugging

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.1.6 | React Framework dengan App Router |
| **TypeScript** | 5.3.3 | Type-safe JavaScript |
| **Tailwind CSS** | 4.0.0 | Utility-first CSS framework |
| **NextAuth.js** | 5.0.0-beta | Authentication system |
| **Prisma ORM** | 6.19.1 | Database ORM |
| **Zustand** | 5.0.3 | State management |
| **Zod** | 3.24.1 | Schema validation |
| **Lucide React** | 0.468.0 | Icon library |
| **Sonner** | 1.7.3 | Toast notifications |
| **Recharts** | 2.15.0 | Chart library |

### Backend & Database
- **SQLite** - Lightweight database
- **Prisma** - Type-safe database client
- **bcryptjs** - Password hashing

### Hardware
- **ESP8266** (NodeMCU/Wemos D1 Mini)
- **MFRC522** - RFID Reader Module
- **LCD I2C 16x2** - Display module
- **Buzzer** - Audio feedback
- **LED** - Visual indicator

### Communication
- **Web Serial API** - Browser to hardware communication
- **Baud rate: 115200**
- **Protocol: Serial UART**

---

## 📦 Instalasi

### Prerequisites
- **Node.js** 18.x atau lebih baru
- **npm** atau **yarn** atau **pnpm**
- **Browser** yang support Web Serial API (Chrome, Edge, Opera)
- **ESP8266** dengan firmware yang sesuai

### 1. Clone Repository
```bash
git clone <repository-url>
cd smart-attendacne-system
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Database
```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database dengan admin user
npx prisma db seed
```

### 4. Setup Environment Variables
Buat file `.env` di root project:
```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-this-in-production-min-32-chars"
```

### 5. Jalankan Development Server
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

---

## 🔑 Default Login

Setelah seed database, gunakan kredensial berikut:

- **Email**: `admin@admin.com`
- **Password**: `admin123`

> ⚠️ **PENTING**: Ganti password default setelah login pertama kali!

---

## 🚀 Cara Penggunaan

### 1. Login ke Sistem
- Akses `http://localhost:3000/login`
- Masukkan email dan password
- Klik "Masuk"

### 2. Hubungkan ESP8266
- Klik tombol **"Hubungkan"** di sidebar
- Pilih port serial ESP8266
- Tunggu hingga status berubah menjadi **"Terhubung"**

### 3. Tambah Mahasiswa
- Buka menu **"Mahasiswa"**
- Klik **"Tambah Mahasiswa"**
- Isi data: Nama, Kelas, NIS, UID e-KTP
- Klik **"Simpan"**

### 4. Scan e-KTP untuk Absensi
- Pastikan ESP8266 terhubung
- Tempelkan e-KTP ke RFID reader
- Sistem akan otomatis mencatat kehadiran
- Lihat hasil di **"Riwayat Absensi"**

### 5. Export Data
- Buka **"Riwayat Absensi"**
- Filter data sesuai kebutuhan
- Klik **"Export CSV"**
- File akan terdownload otomatis

---

## 📁 Struktur Project

```
.
├── app/                      # Next.js App Router
│   ├── (dashboard)/         # Dashboard route group
│   │   ├── dashboard/       # Dashboard pages
│   │   │   ├── students/    # Manajemen mahasiswa
│   │   │   ├── attendance/  # Riwayat absensi
│   │   │   ├── program-studi/ # Program studi
│   │   │   └── logs/        # Serial logs
│   │   └── layout.tsx       # Dashboard layout
│   ├── api/                 # API routes
│   │   ├── auth/           # NextAuth endpoints
│   │   ├── students/       # Student CRUD
│   │   ├── attendance/     # Attendance logs
│   │   └── prodi/          # Program studi
│   ├── login/              # Login page
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page
│
├── components/             # React components
│   ├── auth/              # Auth components
│   ├── layout/            # Layout components
│   ├── providers/         # Context providers
│   └── ui/                # Reusable UI components
│
├── hooks/                 # Custom React hooks
│   └── useIoTStore.ts    # Zustand store
│
├── lib/                   # Utilities & configs
│   ├── prisma.ts         # Prisma client
│   ├── utils.ts          # Helper functions
│   └── validations/      # Zod schemas
│
├── prisma/               # Database
│   ├── schema.prisma    # Database schema
│   ├── migrations/      # Migration files
│   └── seed.ts          # Seed script
│
├── services/            # Business logic
│   └── serialService.ts # Serial communication
│
├── types/               # TypeScript types
│   ├── index.ts        # Main types
│   └── next-auth.d.ts  # NextAuth types
│
├── auth.ts             # NextAuth config
├── auth.config.ts      # Auth configuration
└── middleware.ts       # Route protection
```

---

## 🔧 Konfigurasi ESP8266

### Pin Configuration
```cpp
// MFRC522 RFID
#define RST_PIN  D3
#define SS_PIN   D4

// LCD I2C
#define SDA_PIN  D2
#define SCL_PIN  D1

// Buzzer & LED
#define BUZZER_PIN D0
#define LED_PIN    D8
```

### Serial Commands
| Command | Parameter | Description |
|---------|-----------|-------------|
| `STATUS` | - | Get system status |
| `LIST_Mahasiswa` | - | Get student list |
| `ADD_Mahasiswa` | name,class,nis,uid | Add new student |
| `SCAN` | - | Request card scan |
| `MODE_NORMAL` | - | Set normal mode |
| `MODE_REGISTER` | - | Set register mode |
| `RESET` | - | Reset system |

### Message Format
```
WEB,UID,NAMA,KELAS,STATUS
WEB_OK:message
WEB_ERROR:message
ACTIVE_STUDENT:name,class,nis
```

---

## 📊 Database Schema

### User
- `id` - Unique identifier
- `name` - User name
- `email` - Email (unique)
- `password` - Hashed password
- `role` - User role (ADMIN)

### Student
- `id` - Unique identifier
- `name` - Student name
- `class` - Class name
- `nis` - Student ID (unique)
- `uid` - e-KTP UID (unique)
- `prodiId` - Program studi reference

### AttendanceLog
- `id` - Unique identifier
- `uid` - e-KTP UID
- `studentName` - Student name
- `class` - Class name
- `status` - Attendance status
- `timestamp` - Scan time

### ProgramStudi
- `id` - Unique identifier
- `code` - Program code (unique)
- `name` - Program name
- `faculty` - Faculty name

---

## 🎨 Fitur UI/UX

- ✅ **Responsive Design** - Mobile & Desktop friendly
- ✅ **Dark Mode Ready** - Elegant black-white theme
- ✅ **Loading States** - Smooth loading indicators
- ✅ **Error Handling** - User-friendly error messages
- ✅ **Toast Notifications** - Real-time feedback
- ✅ **Form Validation** - Client & server-side validation
- ✅ **Auto-scroll Logs** - Real-time log monitoring
- ✅ **CSV Export** - Properly formatted data export

---

## 🔒 Keamanan

- ✅ **Password Hashing** dengan bcryptjs (10 rounds)
- ✅ **JWT Session** tokens
- ✅ **Protected Routes** dengan middleware
- ✅ **CSRF Protection** (built-in NextAuth)
- ✅ **SQL Injection Protection** (Prisma ORM)
- ✅ **XSS Protection** (React default)

---

## 🐛 Troubleshooting

### Port Serial Tidak Terdeteksi
- Pastikan driver CH340/CP2102 sudah terinstall
- Coba port USB lain
- Restart browser
- Gunakan browser yang support Web Serial API

### Koneksi Terputus
- Cek kabel USB
- Pastikan baud rate 115200
- Tutup aplikasi lain yang menggunakan port serial (Arduino IDE, Serial Monitor)

### Login Gagal
- Pastikan sudah run `npx prisma db seed`
- Cek file `.env` sudah benar
- Clear browser cache dan cookies

### CSV Export Berantakan di Excel
- Buka file dengan "Import Data" di Excel
- Pilih delimiter: Semicolon (;)
- Encoding: UTF-8

---

## 📝 Development

### Build untuk Production
```bash
npm run build
```

### Run Production Server
```bash
npm start
```

### Database Commands
```bash
# View database in browser
npx prisma studio

# Reset database
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**TapHadir Team**

---

## 🙏 Acknowledgments

- Next.js Team
- Prisma Team
- NextAuth.js Team
- ESP8266 Community

---

<div align="center">

**TapHadir** - Solusi Absensi IoT dengan e-KTP

Made with ❤️ using Next.js & ESP8266

</div>

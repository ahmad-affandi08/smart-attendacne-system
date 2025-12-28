# Smart Absensi Sistem - Project Structure

## 📁 Struktur Project

```
.
├── app/                    # Main Application Code (Langsung di Root)
│   ├── (dashboard)/        # Route Group: Dashboard Area
│   │   ├── dashboard/
│   │   │   ├── page.tsx           # Main dashboard
│   │   │   ├── students/          # Manajemen Mahasiswa
│   │   │   │   └── page.tsx
│   │   │   ├── master-card/       # Setup kartu master
│   │   │   │   └── page.tsx
│   │   │   ├── attendance/        # Riwayat absensi
│   │   │   │   └── page.tsx
│   │   │   └── settings/          # Pengaturan sistem
│   │   │       └── page.tsx
│   │   └── layout.tsx      # Sidebar/Navbar khusus dashboard
│   ├── globals.css         # Global Styles & Tailwind Directives
│   ├── layout.tsx          # Root Layout (HTML/Body)
│   ├── page.tsx            # Landing Page
│   └── not-found.tsx       # 404 Custom Page (optional)
│
├── components/             # Components ditaruh SEJAJAR dengan folder app
│   ├── ui/                 # Reusable Components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   └── toaster.tsx
│   ├── layout/             # Layout Components
│   │   ├── sidebar.tsx
│   │   └── navbar.tsx
│   └── features/           # Komponen spesifik fitur
│       ├── connection-card.tsx
│       └── realtime-attendance.tsx
│
├── hooks/                  # Custom Hooks
│   ├── useIoTStore.ts      # Zustand state management
│   └── useSerialConnection.ts
│
├── lib/                    # Configs & Utilities
│   └── utils.ts            # Helper functions (cn, formatDate, parseSerial)
│
├── services/               # API Call Logic & Business Logic
│   └── serialService.ts    # Serial communication with ESP8266
│
├── types/                  # TypeScript Interfaces
│   └── index.ts            # Student, Attendance, MasterCard, etc.
│
├── public/                 # Assets statis (images, fonts)
│
├── .env.example            # Environment variables template
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── README.md               # Project overview & features
├── INSTALLATION.md         # Detailed installation guide
├── QUICKSTART.md           # Quick start guide
├── PROJECT_RULES.md        # This file
├── tailwind.config.ts
└── tsconfig.json
```

## 🎯 Prinsip Arsitektur

### 1. Route Groups
- `(dashboard)` - Group routes dengan shared layout (sidebar + navbar)
- URL tidak berubah, tetap `/dashboard` bukan `/(dashboard)/dashboard`

### 2. Component Organization
- **ui/** - Pure presentational components (Button, Card, etc.)
- **layout/** - Layout-specific components (Sidebar, Navbar)
- **features/** - Business logic components (ConnectionCard, RealtimeAttendance)

### 3. State Management
- **Zustand** untuk global state (IoT connection, students, logs)
- React hooks untuk local state
- No Redux - keep it simple

### 4. Data Flow
```
ESP8266 → Serial → SerialService → Zustand Store → Components → UI
```

### 5. Type Safety
- All data structures defined in `types/index.ts`
- TypeScript strict mode enabled
- No `any` types allowed

## 🚀 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State**: Zustand
- **Icons**: Lucide React
- **Notifications**: Sonner
- **Hardware Communication**: Web Serial API

## 📝 Naming Conventions

### Files
- Components: PascalCase (`ConnectionCard.tsx`)
- Utilities: camelCase (`serialService.ts`, `utils.ts`)
- Pages: lowercase (`page.tsx`, `layout.tsx`)

### Components
- Client components: `'use client'` directive at top
- Server components: default (no directive)

### Styling
- Use Tailwind utility classes
- Custom classes in `globals.css` only if needed
- Use `cn()` utility for conditional classes

## 🔌 IoT Integration

### Serial Communication
```typescript
// Connect to ESP8266
serialService.connect()

// Send commands
serialService.addStudent(name, class, nis)
serialService.setActiveStudent(index)
serialService.setMasterCard(uid)

// Subscribe to messages
serialService.subscribe((message) => {
  // Handle real-time data
})
```

### Message Format from ESP8266
```
WEB,UID,NAMA,KELAS,STATUS
WEB_OK:message
WEB_ERROR:message
WEB_MASTER_SET:uid
ACTIVE_STUDENT:name,class,nis
```

## 📊 State Structure

```typescript
interface IoTStore {
  isConnected: boolean
  students: Student[]
  activeStudent: Student | null
  attendanceLogs: AttendanceLog[]
  masterCardUID: string | null
  systemStatus: SystemStatus | null
}
```

## 🎨 Design System

### Colors
- Primary: Blue (#2563EB)
- Success: Green (#16A34A)
- Warning: Yellow (#EAB308)
- Danger: Red (#DC2626)
- Gray: Slate (#64748B)

### Spacing
- Use Tailwind spacing scale (0.5, 1, 2, 4, 6, 8, etc.)
- Consistent padding/margin throughout

### Typography
- Font: Geist Sans (default), Geist Mono (code)
- Scale: text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl

## 🔒 Security Notes

- No authentication implemented (untuk edukasi)
- Serial communication tidak terenkripsi
- Data tersimpan di client-side (Zustand)
- Untuk production: implementasi auth, database, API layer

## 🧪 Testing (Future)

- Jest + React Testing Library
- Playwright untuk E2E
- Mock Serial API untuk testing

## 📦 Build & Deployment

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start
```

## 🎯 Best Practices

1. **Keep components small** - Max 200 lines
2. **Use custom hooks** - Extract reusable logic
3. **Type everything** - No implicit any
4. **Error handling** - Always handle errors gracefully
5. **Accessibility** - Use semantic HTML, ARIA labels
6. **Performance** - Use React.memo, useMemo when needed

## 📚 Documentation

Setiap file kompleks harus punya comment:
```typescript
/**
 * Service untuk komunikasi serial dengan ESP8266
 * Menggunakan Web Serial API untuk real-time communication
 */
export class SerialService {
  // ...
}
```

---

**Last Updated**: December 28, 2025
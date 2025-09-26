# Student Attendance Monitoring System

A comprehensive Next.js application for managing student attendance with QR code scanning, role-based authentication, and detailed reporting.

## Features

### 🔐 Role-Based Authentication
- **Admin**: Manage users, academic years, departments, courses, and generate reports
- **Teacher**: Generate QR codes, scan attendance, manage schedules, and create reports
- **Student**: View personal QR code and attendance history

### 📱 QR Code System
- Secure QR generation with HMAC signatures
- Idempotent QR generation (one per student per semester)
- Real-time QR scanning with webcam integration
- Server-side signature verification

### 📊 Schedule Management
- Dynamic schedule creation and management
- Schedule overrides for half-days and cancellations
- Audit logging for all schedule changes
- Calendar integration ready

### 📈 Reports & Analytics
- CSV attendance reports
- Admin analytics dashboard
- Audit trail for all actions
- Export functionality

### 🔒 Security Features
- RBAC middleware protecting routes
- File upload validation and limits
- Rate limiting ready
- Audit logging for accountability

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, ShadCN UI, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: PostgreSQL with Prisma ORM
- **QR**: QRCode.js + ZXing for generation/scanning
- **Authentication**: NextAuth.js with credentials provider
- **File Uploads**: Built-in file handling with validation

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- npm/yarn

### 1. Installation

```bash
git clone <repository>
cd attendance
npm install
```

### 2. Environment Setup

Create a `.env` file in the root:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/attendance?schema=public"
QR_SECRET="your-32-character-secret-key-here"
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Database Setup

```bash
# Push schema to database
npm run db:push

# Seed with sample data
npm run db:seed

# (Optional) Open Prisma Studio
npm run db:studio
```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` and sign in with:

- **Admin**: `admin@attendance.local` / `admin123`
- **Teacher**: `teacher@attendance.local` / `teacher123`
- **Student**: `student@attendance.local` / `student123`

## API Endpoints

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth.js endpoints

### QR System
- `POST /api/qr/generate` - Generate student QR (Teacher)
- `POST /api/qr/verify` - Verify QR signature (Public)

### Teacher
- `POST /api/teacher/scan` - Record attendance via QR scan
- `POST /api/teacher/schedule-override` - Create schedule overrides

### Admin
- `POST /api/admin/activate-term` - Activate academic year/semester

### Reports
- `GET /api/reports/attendance` - Generate CSV attendance report

### File Uploads
- `POST /api/upload` - Upload absence proof attachments

### Notifications
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications` - Mark notifications as read

## Database Schema

### Core Tables
- `users` - Authentication and role management
- `students`, `teachers` - Role-specific data
- `departments`, `courses`, `subjects` - Academic structure
- `academic_years`, `semesters` - Academic periods
- `schedules`, `schedule_overrides` - Class scheduling
- `enrollments` - Student-subject associations
- `attendance` - Attendance records
- `qr_logs` - QR code generation tracking

### Supporting Tables
- `attendance_attachments` - File uploads for excuses
- `notifications` - System messages
- `audit_logs` - Action tracking
- `reports` - Report metadata
- `settings` - Global configuration
- `announcements` - System announcements

## Usage Guide

### For Administrators

1. **Initial Setup**
   - Create academic years and semesters
   - Set up departments and courses
   - Add teachers and students
   - Activate current academic term

2. **User Management**
   - Create teacher/student accounts
   - Assign departments and roles
   - Manage enrollments

3. **Reports**
   - Generate attendance reports
   - View system analytics
   - Export data in CSV format

### For Teachers

1. **QR Code Generation**
   - Navigate to "Generate QR Codes"
   - Enter student ID, academic year, and semester
   - Download or display QR codes for students

2. **Attendance Scanning**
   - Open "QR Scanner" page
   - Allow camera access
   - Scan student QR codes to mark attendance
   - Add notes or schedule information

3. **Schedule Management**
   - Create schedule overrides for half-days
   - Mark cancelled classes
   - Add reasons for changes

### For Students

1. **QR Code Access**
   - View personal QR code once enrolled
   - Show to teacher for attendance marking
   - Download for offline access

2. **Attendance History**
   - View personal attendance records
   - Upload excuse documentation
   - Track attendance percentage

## Development

### Project Structure

```
app/
├── api/                 # API routes
├── admin/              # Admin pages
├── teacher/            # Teacher pages
├── student/            # Student pages
├── page.tsx            # Main dashboard
└── layout.tsx          # Root layout

components/
├── ui/                 # ShadCN components
└── SessionProvider.tsx # Auth wrapper

lib/
├── db.ts              # Prisma client
├── qr.ts              # QR utilities
├── csv.ts             # CSV generation
├── audit.ts           # Audit logging
└── utils.ts           # Utilities

prisma/
└── schema.prisma      # Database schema

scripts/
└── seed.ts            # Database seeding
```

### Key Features Implementation

#### QR Code Security
- Payload includes: `student_id`, `uuid`, `academic_year_id`, `semester_id`, `issued_at`, `signature`
- HMAC-SHA256 signature verification
- Server-side validation against active terms

#### File Uploads
- 10MB size limit
- Type validation (images, PDFs)
- Secure filename generation
- Database tracking

#### Audit Trail
- All critical actions logged
- User identification and role tracking
- Metadata storage for context
- Searchable audit history

### Extending the System

#### Adding New Reports
1. Create new endpoint in `/api/reports/`
2. Implement data fetching logic
3. Add CSV/PDF generation
4. Update UI with new report option

#### Custom Notifications
1. Use `createNotification()` utility
2. Send to specific users or global
3. Include in dashboard components
4. Mark as read functionality

#### Additional QR Features
1. Extend QR payload in `lib/qr.ts`
2. Update verification logic
3. Modify scanner to handle new data
4. Update database schema if needed

## Production Deployment

### Environment Variables
```env
DATABASE_URL="your-production-postgres-url"
QR_SECRET="secure-32-char-random-string"
NEXTAUTH_SECRET="secure-nextauth-secret"
NEXTAUTH_URL="https://yourdomain.com"
```

### Build and Deploy
```bash
npm run build
npm start
```

### Database Migration
```bash
npx prisma migrate deploy
```

## Security Considerations

- QR codes use HMAC signatures to prevent forgery
- File uploads are validated and size-limited
- Route protection via middleware
- Audit logging for accountability
- Secure file storage outside web root

## Support

For issues and feature requests, please check the documentation or create an issue in the repository.

## License

MIT License - See LICENSE file for details.
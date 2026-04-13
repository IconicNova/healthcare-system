# HomeCare Pro

A comprehensive, HIPAA-compliant home care management platform built with Next.js 14, Tailwind CSS, Prisma, and PostgreSQL.

## Features
- **Client Management:** Manage patient profiles, care plans, and medical history.
- **Staff Scheduling:** Prevent overlapping visit conflicts, handle recurring shifts, and monitor staff availability.
- **Billing & Payroll:** Generate invoices and timesheets seamlessly.
- **Role-Based Access Control:** Strict authorization across `ADMIN`, `MANAGER`, `SUPERVISOR`, and `STAFF` roles.
- **Security First:** AES-256-GCM encryption for PHI data (Social Security Numbers).

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth v4 (JWT-based)
- **Styling:** TailwindCSS + Radix UI Primitives

## Getting Started

1. **Clone & Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/homecare"
   NEXTAUTH_SECRET="generate-a-secure-random-string"
   NEXTAUTH_URL="http://localhost:3000"
   ENCRYPTION_KEY="32-byte-hex-encoded-string-for-ssn-encryption"
   ```

3. **Database Setup**
   Ensure your database is running, then apply migrations:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

## Production Deployment
This app is designed for deployment on Vercel:
1. Ensure all environment variables (including `ENCRYPTION_KEY`) are set in Vercel.
2. The build command will automatically run `prisma migrate deploy` to safely update the database schema.

## Security Notes
- Sessions are limited to 8 hours to align with HIPAA auto-logoff requirements.
- API endpoints strictly whitelist database sort fields to prevent information disclosure.
- PII such as SSN is strictly AES encrypted before being stored at rest.

# Review Scope

## Target

Homecare Pro - A comprehensive Next.js-based homecare management system that handles client care, staff scheduling, visit management, billing, insurance claims, and payroll processing.

## Files

### Core Application Files
- **Pages & Routes** (50+ files in `src/app/`)
  - Authentication flow (`/login`, `/auth/layout`)
  - Dashboard pages (clients, staff, visits, care plans, billing, payroll, reports, settings)
  - API routes for all CRUD operations and business logic

### Key Backend Components
- **Database Schema** (`prisma/schema.prisma`) - 25+ models including Organization, Client, Staff, Visit, Invoice, InsuranceClaim, Timesheet, Medication, CarePlan
- **Authentication** (`src/lib/auth.js`, `src/app/api/auth/[...nextauth]/route.js`)
- **Prisma Client** (`src/lib/prisma.js`)

### UI Components
- Reusable components (`src/components/ui/`) - Button, Input, Modal, Card, StatusBadge, EmptyState
- Layout components (loading spinner, providers)

### Framework Configuration
- Next.js 14.2.35 with App Router
- Tailwind CSS + PostCSS
- Prisma ORM with PostgreSQL
- NextAuth.js for authentication
- Zod for validation

## Flags

- Security Focus: no
- Performance Critical: no
- Strict Mode: no
- Framework: Next.js

## Review Phases

1. **Code Quality & Architecture** - Code complexity, maintainability, SOLID principles, component structure
2. **Security & Performance** - OWASP Top 10, input validation, database performance, scalability
3. **Testing & Documentation** - Test coverage, API documentation, README completeness
4. **Best Practices & Standards** - Framework patterns, deprecated APIs, CI/CD practices
5. **Consolidated Report** - Executive summary with prioritized findings

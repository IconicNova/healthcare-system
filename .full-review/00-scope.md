# Review Scope

## Target

Full codebase review of Homecare Pro - a comprehensive home care management system built with Next.js, Prisma, and PostgreSQL.

**Project Statistics:**
- 218 files, ~125,017 words
- 408 graph nodes, 315 edges, 137 communities
- Framework: Next.js 14 (App Router)
- Database: Prisma ORM with PostgreSQL
- Authentication: NextAuth.js

## Files Included

### Core Application Structure
- `src/app/(dashboard)/` - Dashboard pages (clients, staff, care-plans, billing, payroll, scheduling, etc.)
- `src/app/api/` - All API route handlers (GET/POST/PATCH/DELETE endpoints)
- `src/components/` - UI components and layout components
- `src/lib/` - Utility libraries (prisma.js, auth.js, rate-limit.js)

### Key Modules
- **API Routes**: ~70+ route handlers for CRUD operations
- **Care Delivery**: Visit management, form charting, EVV (Electronic Visit Verification)
- **Billing**: Invoicing, payments, insurance claims, batch operations
- **Payroll**: Timesheets, payslips, pay calculations
- **Scheduling**: Calendar views, availability management, conflict detection
- **Settings**: Organization, services, billing/payroll configuration

### Configuration & Infrastructure
- `prisma/schema.prisma` - Database schema
- `CI_CD_OPERATIONAL_REVIEW.md` - CI/CD pipeline documentation
- `tailwind.config.js`, `postcss.config.js` - Styling configuration
- `src/lib/rate-limit.js` - Rate limiting implementation

## Flags

- Security Focus: no
- Performance Critical: no
- Strict Mode: no
- Framework: Next.js 14 (auto-detected)

## Review Phases

1. **Code Quality & Architecture** (Steps 1A-1B)
   - Code complexity, maintainability, duplication analysis
   - Component boundaries, API design, data modeling

2. **Security & Performance** (Steps 2A-2B)
   - OWASP Top 10, authentication/authorization review
   - Database performance, caching, memory management

3. **Testing & Documentation** (Steps 3A-3B)
   - Test coverage analysis (Playwright E2E)
   - API docs, architecture docs, README completeness

4. **Best Practices & Standards** (Steps 4A-4B)
   - Next.js/React patterns, modern JavaScript features
   - CI/CD pipeline (GitHub Actions), deployment strategy

5. **Consolidated Report** (Step 5)
   - Executive summary with prioritized action items
   - Findings by category and severity

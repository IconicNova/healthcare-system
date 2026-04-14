# HomeCare Pro - Complete User Guide

**Together Care Health Services** - Premium Home Care Management System

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [Client Management](#client-management)
4. [Staff Management](#staff-management)
5. [Care Planning](#care-planning)
6. [Scheduling & Visits](#scheduling--visits)
7. [Care Delivery](#care-delivery)
8. [Billing & Invoicing](#billing--invoicing)
9. [Payroll Management](#payroll-management)
10. [Reports & Analytics](#reports--analytics)
11. [Settings & Configuration](#settings--configuration)
12. [Advanced Features](#advanced-features)
13. [Role-Based Access](#role-based-access)

---

## Getting Started

### Login
- Navigate to `/login`
- Enter your email and password
- You will be redirected to the Dashboard upon successful authentication

### Main Navigation (Sidebar)
The sidebar provides access to all major sections:
- **Dashboard** - Overview and KPIs
- **Clients** - Client management
- **Staff** - Staff/caregiver management
- **Care Delivery** - Daily care operations
- **Scheduling** - Visit scheduling calendar
- **Care Plans** - Care plan management
- **Billing** - Invoices and payments
- **Payroll** - Timesheets and payslips
- **Reports** - Analytics and reports
- **Notifications** - System notifications
- **Settings** - Organization configuration

---

## Dashboard

The dashboard provides a comprehensive overview of your home care operations.

### Key Features:

#### 1. KPI Metrics Grid
- Active Clients count
- Active Staff count
- Visits Today
- Revenue (Monthly)
- Click on any metric to view related details

#### 2. Visit Chart
- Visual representation of visits over time
- Filter by date range
- View visit status breakdown

#### 3. Revenue Chart
- Monthly revenue tracking
- Compare periods
- Revenue trends

#### 4. Upcoming Shifts
- View scheduled visits for the day/week
- Quick access to visit details

#### 5. Recent Invoices
- Latest invoice activity
- Payment status tracking

#### 6. Alerts Panel
- System notifications
- Important reminders
- Action items

#### 7. EVV Widget (Electronic Visit Verification)
- Clock in/out functionality
- Visit verification
- GPS check-in (if enabled)

### Best Practices:
- Check the dashboard daily for upcoming visits
- Monitor alerts for urgent actions
- Review revenue metrics weekly

---

## Client Management

### Overview
Manage all client information, care details, and associated data.

### Features:

#### 1. Client List
- View all clients in a sortable table
- Filter by status (Active, Inactive, Pending, On Hold, Discharged)
- Search by name, email, phone, or city
- Pagination for large datasets

#### 2. Add New Client
Click "Add Client" to create a new client record:
- **Personal Information**: First name, last name, email, phone
- **Address**: Full address including city, state, zip code
- **Medical Information**: Insurance type, SSN (optional)
- **Status**: Set initial status (typically Pending or Active)
- **Avatar**: Upload profile photo (optional)

#### 3. Client Profile
View detailed client information:
- **Overview Tab**: Basic information and contact details
- **Care Plans**: Associated care plans
- **Visits**: Visit history and upcoming visits
- **Medical Info**: Allergies, conditions, physician details
- **Medications**: Current medication list
- **Emergency Contacts**: Emergency contact information
- **Forms**: Completed client forms
- **Documents**: Uploaded documents

#### 4. Edit Client
- Update any client information
- Change client status
- Modify medical information

#### 5. Client Actions
- **View**: Open detailed client profile
- **Edit**: Modify client information
- **Remove**: Delete client (with confirmation)

### Best Practices:
- Keep client information up to date
- Add emergency contacts for all clients
- Regularly review and update medical information
- Upload relevant documents (insurance cards, IDs)

---

## Staff Management

### Overview
Manage caregivers, nurses, and administrative staff.

### Features:

#### 1. Staff List
- View all staff members
- Filter by status, role, and branch
- Search by name, email, or phone
- View skills and certifications

#### 2. Add New Staff Member
Click "Add Staff Member":
- **Employee Information**: Employee ID, name, email, phone
- **Role**: Manager, Supervisor, or Staff
- **Pay Type**: Hourly, Per Visit, or Salary
- **Compensation**: Hourly rate or salary amount
- **Branch**: Assign to branch location
- **Status**: Active, Inactive, On Leave, Terminated
- **License Information**: License number and expiry date
- **Hire Date**: Employment start date

#### 3. Staff Profile
Detailed staff information:
- **Overview Tab**: Basic information and employment details
- **Skills & Certifications**: View and manage skills
- **Visits**: Assigned visits
- **Timesheets**: Work history and timesheets
- **Availability**: Work schedule availability

#### 4. Skills Management
Add and manage staff skills:
- Skill name (e.g., "CPR Certified", "Wound Care")
- Skill level (Basic, Intermediate, Advanced)

#### 5. Certifications Management
Track staff certifications:
- Certification name
- Certification number
- Issuing organization
- Issue and expiry dates

#### 6. Availability Management
Set staff availability:
- Day of week
- Available time ranges
- Mark unavailable days

### Best Practices:
- Keep skills and certifications current
- Set accurate availability schedules
- Monitor license expiry dates
- Regularly update staff contact information

---

## Care Planning

### Overview
Create and manage personalized care plans for clients.

### Features:

#### 1. Care Plans List
- View all care plans
- Filter by status (Active, Inactive)
- Search by care plan name
- View associated client and staff

#### 2. Create Care Plan
Click "Create Care Plan":
- **Basic Information**:
  - Care plan name
  - Description
  - Start date
  - End date (optional)
- **Client Selection**: Choose the client
- **Primary Staff**: Assign primary caregiver (optional)
- **Services**: Add services with frequency and instructions
  - Select service from available services
  - Set frequency (Daily, Weekly, Bi-weekly, Monthly, As Needed, Custom)
  - Add specific instructions
  - Set service order

#### 3. Care Plan Detail
View comprehensive care plan information:
- **Status Badge**: Active/Inactive indicator
- **Client Information**: Assigned client details
- **Primary Staff**: Caregiver information
- **Duration**: Start and end dates
- **Visit Statistics**: Upcoming and completed visits
- **Description**: Care plan notes
- **Scheduled Services**: List of services with frequencies
- **Recent Visits**: Visit history

#### 4. Edit Care Plan
- Modify care plan details
- Update services
- Change assigned staff
- Extend or end care plan

#### 5. Generate Visits from Care Plan
- Automatically create scheduled visits based on care plan services
- Specify date range for visit generation
- Review generated visits before confirmation

### Best Practices:
- Create detailed care plans with clear instructions
- Review and update care plans regularly
- Ensure services are properly ordered by priority
- Monitor care plan effectiveness through visit outcomes

---

## Scheduling & Visits

### Overview
Schedule and manage client visits using an interactive calendar.

### Features:

#### 1. Calendar Views
- **Month View**: Overview of all visits in a month
- **Week View**: Detailed weekly schedule
- **Day View**: Hour-by-hour daily schedule

#### 2. Visit Statuses
- **Vacant**: Unassigned visit needing staff
- **Scheduled**: Planned visit
- **Offered**: Visit offered to staff
- **In Progress**: Currently occurring visit
- **Clocked In**: Staff has checked in
- **Completed**: Visit finished
- **Approved**: Completed and verified
- **Missed**: Visit not completed
- **Late**: Completed after scheduled time
- **Cancelled**: Visit cancelled
- **On Hold**: Temporarily paused
- **No Show**: Staff did not arrive

#### 3. Create Visit
Click "Create Visit":
- **Client**: Select client
- **Care Plan**: Optional关联 care plan
- **Service**: Select service type
- **Staff**: Assign caregiver (optional for vacant visits)
- **Date & Time**: Start and end times
- **Branch**: Select branch location
- **Description**: Visit notes

#### 4. Visit Management
- **Drag and Drop**: Reschedule visits by dragging on calendar
- **Click to View**: Open visit details popup
- **Edit**: Modify visit details
- **Delete**: Remove visit (with confirmation)

#### 5. Filters
- Filter by staff member
- Filter by client
- Filter by branch
- Filter by status
- Status count badges for quick overview

### Best Practices:
- Review vacant visits daily and assign staff
- Use drag-and-drop for quick rescheduling
- Monitor visit statuses for compliance
- Set up visit conflict detection to prevent double-booking

---

## Care Delivery

### Overview
Daily care operations documentation and task management.

### Features:

#### 1. Client Selection
- Search and select client
- View client address and visit count
- Quick access to client's scheduled visits

#### 2. Tasks View
- View assigned tasks for selected client
- Mark tasks as completed
- Add task notes
- Track task completion status

#### 3. Progress Notes
- Document client progress
- Add narrative notes
- Track changes over time
- (Feature in development)

#### 4. Visit Reports
- Complete visit documentation
- Service delivery confirmation
- Client condition notes
- (Feature in development)

#### 5. Vitals Tracking
- Record client vital signs
- Track trends over time
- Alert thresholds
- (Feature in development)

#### 6. Medications (Care Delivery)
- View client medication list
- Medication administration recording
- Track medication compliance
- (Feature in development)

### Best Practices:
- Complete tasks before ending visit
- Document any changes in client condition
- Communicate urgent issues via notifications
- Maintain consistent documentation quality

---

## Medications Management

### Overview
Track and administer client medications.

### Features:

#### 1. Medication List
- Select client to view medications
- View medication details:
  - Name
  - Dosage
  - Frequency
  - Route
  - Status

#### 2. Medication Detail
- Full medication information
- Administration history
- Track each administration event

#### 3. Administer Medication
Record medication administration:
- **Status**: Administered, Held, Refused, Not Given
- **Dosage**: Amount administered
- **Unit**: mg, mL, etc.
- **Reason**: For non-administration
- **Comments**: Additional notes

#### 4. Administration History
- View past administrations
- Track patterns
- Identify missed doses

### Best Practices:
- Verify medication before administration
- Document immediately after administration
- Report refused medications promptly
- Monitor for medication interactions

---

## Billing & Invoicing

### Overview
Manage invoices, payments, and insurance claims.

### Features:

#### 1. Billing Summary
- Total Revenue
- Outstanding Invoices
- Paid This Month
- Average Invoice Value

#### 2. Invoices Tab
- View all invoices
- Filter by status (Draft, Sent, Paid, Partially Paid, Overdue, Cancelled)
- Create new invoice
- Generate batch invoices from visits

#### 3. Create Invoice
- Select client
- Add invoice items:
  - Description
  - Quantity
  - Unit price
- Set due date
- Add notes

#### 4. Batch Invoice Generation
- Select date range
- Choose uninvoiced visits
- Generate invoices automatically
- Review before finalizing

#### 5. Payments Tab
- View all payments
- Record new payment:
  - Select invoice
  - Payment amount
  - Payment method
  - Payment date
  - Reference number

#### 6. Insurance Claims Tab
- View all insurance claims
- Filter by status
- Create new claim:
  - Claim number
  - Insurance type and ID
  - Diagnosis code
  - Authorization number
  - Service date
  - Amount
- Track claim status:
  - Pending
  - Submitted
  - In Review
  - Approved
  - Denied
  - Appealed
  - Paid
  - Voided

#### 7. Invoice Actions
- **View Details**: Full invoice information
- **Send Invoice**: Email invoice to client
- **Record Payment**: Add payment to invoice
- **Download**: Export invoice as PDF

### Best Practices:
- Generate invoices promptly after visit completion
- Follow up on overdue invoices
- Track insurance claim statuses
- Reconcile payments regularly

---

## Payroll Management

### Overview
Manage staff timesheets, payslips, and accounting exports.

### Features:

#### 1. Payroll Summary
- Total Hours (Period)
- Total Payroll Cost
- Average Hourly Rate
- Active Timesheets

#### 2. Timesheets Tab
- View all timesheets
- Filter by status (Draft, Submitted, Approved, Rejected, Paid)
- Generate timesheets from visits
- View timesheet details

#### 3. Generate Timesheets
- Select date range
- Choose staff member(s)
- Generate from completed visits
- Review generated entries

#### 4. Timesheet Detail
- View individual entries
- Edit hours
- Add notes
- Approve/reject timesheet

#### 5. Pay Summary Tab
- View pay summaries by staff
- Total hours and earnings
- Overtime calculations
- Pay period breakdown

#### 6. Payslips Tab
- View generated payslips
- Download payslips
- Email payslips to staff

#### 7. Export to Accounting
- Export payroll data
- Select accounting format
- Generate export file
- Import to accounting software

### Best Practices:
- Generate timesheets weekly
- Review hours before approval
- Reconcile timesheets with visit records
- Export to accounting monthly

---

## Reports & Analytics

### Overview
Comprehensive reporting and data analysis.

### Features:

#### 1. Financial Report
- Revenue analysis
- Expense tracking
- Profit margins
- Payment trends
- Export financial data

#### 2. Staff Performance
- Hours worked per staff
- Visit completion rates
- Client satisfaction
- Overtime tracking
- Performance metrics

#### 3. Client History
- Client visit history
- Care plan compliance
- Service utilization
- Status changes
- Medical history

#### 4. Visit Logs
- All visit records
- Filter by date, staff, client
- Visit duration analysis
- Completion rates
- Export visit data

#### 5. Compliance Dashboard
- Regulatory compliance tracking
- Documentation completion
- Certification expiry alerts
- Audit trail
- Compliance scores

### Best Practices:
- Review financial reports monthly
- Monitor staff performance quarterly
- Track compliance continuously
- Export reports for external auditing

---

## Settings & Configuration

### Overview
Organization-wide settings and configurations.

### Features:

#### 1. Organization Settings
- Organization name and details
- Contact information
- Address management
- Branding settings

#### 2. Users & Roles
- Manage user accounts
- Assign roles:
  - Super Admin
  - Admin
  - Manager
  - Supervisor
  - Staff
  - Client
- Activate/deactivate users
- Reset passwords

#### 3. Services Configuration
- Define service types
- Set base rates
- Configure durations
- Add service descriptions

#### 4. Scheduling Rules
- Working hours configuration
- Visit duration defaults
- Scheduling constraints
- Conflict detection settings

#### 5. Billing Settings
- Payment terms
- Tax rates
- Invoice numbering
- Payment methods

#### 6. Payroll Settings
- Pay periods
- Overtime rules
- Tax configurations
- Deduction settings

#### 7. Notification Settings
- Email notifications
- In-app notifications
- Alert thresholds
- Notification preferences

### Best Practices:
- Review settings quarterly
- Keep user roles current
- Update service rates annually
- Test notification systems regularly

---

## Advanced Features

### 1. Form System
- Dynamic form templates
- Client intake forms
- Assessment forms
- Visit documentation forms
- Auto-save functionality
- Form validation

### 2. Document Management
- Upload client documents
- Organize by category
- Version control
- Secure storage

### 3. Notifications System
- Real-time notifications
- Unread count tracking
- Mark as read
- Notification history

### 4. Audit Logs
- Track all system changes
- User activity monitoring
- Compliance reporting
- Change history

### 5. Search & Filters
- Global search capability
- Advanced filtering options
- Saved filter presets
- Quick navigation

---

## Role-Based Access

### Super Admin
- Full system access
- Organization management
- User management
- System configuration
- All reports access

### Admin
- Full organization access
- User management (limited)
- All reports access
- Settings configuration

### Manager
- Client management
- Staff management
- Scheduling
- Billing access
- Reports access

### Supervisor
- Client oversight
- Staff supervision
- Visit approval
- Reports access

### Staff
- Personal timesheets
- Assigned visits
- Care delivery documentation
- Personal profile

### Client
- Personal information view
- Care plan view
- Visit history
- Document access

---

## Keyboard Shortcuts

- `Ctrl/Cmd + K` - Quick search (coming soon)
- `Esc` - Close modal/dialog
- `Tab` - Navigate form fields

---

## Tips for Efficient Use

### Daily Tasks
1. Check dashboard for upcoming visits
2. Review alerts and notifications
3. Approve pending timesheets
4. Verify completed visits

### Weekly Tasks
1. Generate timesheets
2. Review vacant visits
3. Check upcoming care plan expirations
4. Review financial summary

### Monthly Tasks
1. Generate invoices
2. Export payroll data
3. Review compliance reports
4. Update staff certifications

### Best Practices Summary
- Keep all information up to date
- Document visits promptly
- Review and approve timesheets weekly
- Monitor certification expirations
- Regular data backups
- Train staff on proper documentation

---

## Support & Resources

### Getting Help
- Check this guide for feature documentation
- Contact system administrator for access issues
- Report bugs through support channel

### System Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Stable internet connection
- JavaScript enabled

---

*Last Updated: 2026*
*HomeCare Pro v0.1.0*

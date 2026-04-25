import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { chartingTemplates } from '../src/lib/charting-templates.js';

const prisma = new PrismaClient();

async function main() {
  // Hash password for all users
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  // Get or Create Organization
  let organization = await prisma.organization.findFirst({
    where: { email: 'info@advancedcarepartners.com' },
  });
  if (!organization) {
    organization = await prisma.organization.create({
      data: {
        name: 'Advanced Care Partners',
        email: 'info@advancedcarepartners.com',
        phone: '(555) 123-4567',
        address: '100 Healthcare Blvd',
        city: 'Atlanta',
        state: 'GA',
        zipCode: '30303',
        status: true,
      },
    });
  }

  // Get or Create Branches
  let atlantaMain = await prisma.branch.findFirst({
    where: { email: 'atlanta@advancedcarepartners.com' },
  });
  if (!atlantaMain) {
    atlantaMain = await prisma.branch.create({
      data: {
        name: 'Atlanta Main Office',
        email: 'atlanta@advancedcarepartners.com',
        phone: '(555) 123-4500',
        address: '100 Healthcare Blvd',
        city: 'Atlanta',
        state: 'GA',
        zipCode: '30303',
        organizationId: organization.id,
        status: true,
      },
    });
  }

  let mariettaBranch = await prisma.branch.findFirst({
    where: { email: 'marietta@advancedcarepartners.com' },
  });
  if (!mariettaBranch) {
    mariettaBranch = await prisma.branch.create({
      data: {
        name: 'Marietta Branch',
        email: 'marietta@advancedcarepartners.com',
        phone: '(555) 123-4600',
        address: '2500 Roswell Rd',
        city: 'Marietta',
        state: 'GA',
        zipCode: '30062',
        organizationId: organization.id,
        status: true,
      },
    });
  }

  // Create or update Users
  const adminUser = await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: organization.id,
        email: 'admin@homecarepro.com',
      },
    },
    update: {
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Mitchell',
      role: 'ADMIN',
      status: true,
      branchId: atlantaMain.id,
    },
    create: {
      email: 'admin@homecarepro.com',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Mitchell',
      role: 'ADMIN',
      status: true,
      organizationId: organization.id,
      branchId: atlantaMain.id,
    },
  });

  await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: organization.id,
        email: 'superadmin@homecarepro.com',
      },
    },
    update: {
      password: hashedPassword,
      firstName: 'Michael',
      lastName: 'Thompson',
      role: 'SUPER_ADMIN',
      status: true,
      branchId: atlantaMain.id,
    },
    create: {
      email: 'superadmin@homecarepro.com',
      password: hashedPassword,
      firstName: 'Michael',
      lastName: 'Thompson',
      role: 'SUPER_ADMIN',
      status: true,
      organizationId: organization.id,
      branchId: atlantaMain.id,
    },
  });

  const managerUser = await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: organization.id,
        email: 'manager@homecarepro.com',
      },
    },
    update: {
      password: hashedPassword,
      firstName: 'Jennifer',
      lastName: 'Davis',
      role: 'MANAGER',
      status: true,
      branchId: atlantaMain.id,
    },
    create: {
      email: 'manager@homecarepro.com',
      password: hashedPassword,
      firstName: 'Jennifer',
      lastName: 'Davis',
      role: 'MANAGER',
      status: true,
      organizationId: organization.id,
      branchId: atlantaMain.id,
    },
  });

  const supervisorUser = await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: organization.id,
        email: 'supervisor@homecarepro.com',
      },
    },
    update: {
      password: hashedPassword,
      firstName: 'Robert',
      lastName: 'Wilson',
      role: 'SUPERVISOR',
      status: true,
      branchId: mariettaBranch.id,
    },
    create: {
      email: 'supervisor@homecarepro.com',
      password: hashedPassword,
      firstName: 'Robert',
      lastName: 'Wilson',
      role: 'SUPERVISOR',
      status: true,
      organizationId: organization.id,
      branchId: mariettaBranch.id,
    },
  });

  const staffUser = await prisma.user.upsert({
    where: {
      organizationId_email: {
        organizationId: organization.id,
        email: 'staff@homecarepro.com',
      },
    },
    update: {
      password: hashedPassword,
      firstName: 'Emily',
      lastName: 'Rodriguez',
      role: 'STAFF',
      status: true,
      branchId: atlantaMain.id,
    },
    create: {
      email: 'staff@homecarepro.com',
      password: hashedPassword,
      firstName: 'Emily',
      lastName: 'Rodriguez',
      role: 'STAFF',
      status: true,
      organizationId: organization.id,
      branchId: atlantaMain.id,
    },
  });

  // Create Staff Profiles
  const staff1 = await prisma.staff.upsert({
    where: {
      organizationId_email: {
        organizationId: organization.id,
        email: 'emily.rodriguez@advancedcarepartners.com',
      },
    },
    update: {
      employeeId: 'EMP-001',
      firstName: 'Emily',
      lastName: 'Rodriguez',
      phone: '(555) 234-5001',
      role: 'Registered Nurse',
      payType: 'HOURLY',
      hourlyRate: 45.00,
      status: 'ACTIVE',
      licenseNumber: 'RN-GA-12345',
      licenseExpiry: new Date('2025-12-31'),
      branchId: atlantaMain.id,
      userId: staffUser.id,
    },
    create: {
      employeeId: 'EMP-001',
      firstName: 'Emily',
      lastName: 'Rodriguez',
      email: 'emily.rodriguez@advancedcarepartners.com',
      phone: '(555) 234-5001',
      role: 'Registered Nurse',
      payType: 'HOURLY',
      hourlyRate: 45.00,
      status: 'ACTIVE',
      licenseNumber: 'RN-GA-12345',
      licenseExpiry: new Date('2025-12-31'),
      organizationId: organization.id,
      branchId: atlantaMain.id,
      userId: staffUser.id,
    },
  });

  const staff2 = await prisma.staff.create({
    data: {
      employeeId: 'EMP-002',
      firstName: 'David',
      lastName: 'Chen',
      email: 'david.chen@advancedcarepartners.com',
      phone: '(555) 234-5002',
      role: 'Physical Therapist',
      payType: 'HOURLY',
      hourlyRate: 55.00,
      status: 'ACTIVE',
      licenseNumber: 'PT-GA-67890',
      licenseExpiry: new Date('2026-06-30'),
      organizationId: organization.id,
      branchId: atlantaMain.id,
    },
  });

  const staff3 = await prisma.staff.create({
    data: {
      employeeId: 'EMP-003',
      firstName: 'Lisa',
      lastName: 'Johnson',
      email: 'lisa.johnson@advancedcarepartners.com',
      phone: '(555) 234-5003',
      role: 'Home Health Aide',
      payType: 'HOURLY',
      hourlyRate: 25.00,
      status: 'ACTIVE',
      licenseNumber: 'HHA-GA-11111',
      licenseExpiry: new Date('2025-09-15'),
      organizationId: organization.id,
      branchId: mariettaBranch.id,
    },
  });

  const staff4 = await prisma.staff.create({
    data: {
      employeeId: 'EMP-004',
      firstName: 'James',
      lastName: 'Williams',
      email: 'james.williams@advancedcarepartners.com',
      phone: '(555) 234-5004',
      role: 'Occupational Therapist',
      payType: 'HOURLY',
      hourlyRate: 52.00,
      status: 'ACTIVE',
      licenseNumber: 'OT-GA-22222',
      licenseExpiry: new Date('2026-03-20'),
      organizationId: organization.id,
      branchId: atlantaMain.id,
    },
  });

  const staff5 = await prisma.staff.create({
    data: {
      employeeId: 'EMP-005',
      firstName: 'Maria',
      lastName: 'Garcia',
      email: 'maria.garcia@advancedcarepartners.com',
      phone: '(555) 234-5005',
      role: 'Speech Therapist',
      payType: 'HOURLY',
      hourlyRate: 50.00,
      status: 'ACTIVE',
      licenseNumber: 'ST-GA-33333',
      licenseExpiry: new Date('2025-11-10'),
      organizationId: organization.id,
      branchId: mariettaBranch.id,
    },
  });

  // Add skills to staff
  await prisma.staffSkill.createMany({
    data: [
      { staffId: staff1.id, name: 'IV Therapy', level: 'Expert' },
      { staffId: staff1.id, name: 'Wound Care', level: 'Expert' },
      { staffId: staff1.id, name: 'Medication Administration', level: 'Expert' },
      { staffId: staff2.id, name: 'Gait Training', level: 'Expert' },
      { staffId: staff2.id, name: 'Strength Training', level: 'Advanced' },
      { staffId: staff2.id, name: 'Balance Therapy', level: 'Advanced' },
      { staffId: staff3.id, name: 'Personal Care', level: 'Expert' },
      { staffId: staff3.id, name: 'Mobility Assistance', level: 'Advanced' },
      { staffId: staff4.id, name: 'ADL Training', level: 'Expert' },
      { staffId: staff4.id, name: 'Home Safety Assessment', level: 'Advanced' },
      { staffId: staff5.id, name: 'Swallowing Therapy', level: 'Expert' },
      { staffId: staff5.id, name: 'Language Therapy', level: 'Advanced' },
    ],
  });

  // Add certifications
  await prisma.staffCertification.createMany({
    data: [
      {
        staffId: staff1.id,
        name: 'Certified Wound Care Nurse',
        number: 'CWCN-2023-001',
        issuedBy: 'National Certification Corporation',
        issueDate: new Date('2023-01-15'),
        expiryDate: new Date('2026-01-15'),
      },
      {
        staffId: staff2.id,
        name: 'Orthopedic Certified Specialist',
        number: 'OCS-2022-045',
        issuedBy: 'American Board of Physical Therapy Specialties',
        issueDate: new Date('2022-06-20'),
        expiryDate: new Date('2027-06-20'),
      },
    ],
  });

  // Add availability for staff
  const availabilityData = [
    { staffId: staff1.id, dayOfWeek: 1, startTime: '08:00', endTime: '17:00', isAvailable: true },
    { staffId: staff1.id, dayOfWeek: 2, startTime: '08:00', endTime: '17:00', isAvailable: true },
    { staffId: staff1.id, dayOfWeek: 3, startTime: '08:00', endTime: '17:00', isAvailable: true },
    { staffId: staff1.id, dayOfWeek: 4, startTime: '08:00', endTime: '17:00', isAvailable: true },
    { staffId: staff1.id, dayOfWeek: 5, startTime: '08:00', endTime: '17:00', isAvailable: true },
    { staffId: staff2.id, dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isAvailable: true },
    { staffId: staff2.id, dayOfWeek: 2, startTime: '09:00', endTime: '18:00', isAvailable: true },
    { staffId: staff2.id, dayOfWeek: 3, startTime: '09:00', endTime: '18:00', isAvailable: true },
    { staffId: staff2.id, dayOfWeek: 4, startTime: '09:00', endTime: '18:00', isAvailable: true },
    { staffId: staff3.id, dayOfWeek: 1, startTime: '07:00', endTime: '15:00', isAvailable: true },
    { staffId: staff3.id, dayOfWeek: 2, startTime: '07:00', endTime: '15:00', isAvailable: true },
    { staffId: staff3.id, dayOfWeek: 3, startTime: '07:00', endTime: '15:00', isAvailable: true },
    { staffId: staff3.id, dayOfWeek: 5, startTime: '07:00', endTime: '15:00', isAvailable: true },
  ];
  await prisma.staffAvailability.createMany({ data: availabilityData });

  // Create Services
  await prisma.service.createMany({
    data: [
      {
        name: 'Skilled Nursing',
        description: 'Professional nursing care including medication management, wound care, and health monitoring',
        duration: 60,
        baseRate: 125.00,
        organizationId: organization.id,
      },
      {
        name: 'Physical Therapy',
        description: 'Rehabilitation services to improve mobility, strength, and balance',
        duration: 60,
        baseRate: 130.00,
        organizationId: organization.id,
      },
      {
        name: 'Occupational Therapy',
        description: 'Therapy to help with activities of daily living and independence',
        duration: 60,
        baseRate: 125.00,
        organizationId: organization.id,
      },
      {
        name: 'Home Health Aide',
        description: 'Personal care assistance with bathing, dressing, and meal preparation',
        duration: 120,
        baseRate: 50.00,
        organizationId: organization.id,
      },
      {
        name: 'Speech Therapy',
        description: 'Treatment for speech, language, and swallowing disorders',
        duration: 60,
        baseRate: 125.00,
        organizationId: organization.id,
      },
      {
        name: 'Meet & Greet',
        description: 'Initial consultation to assess care needs and create personalized care plan',
        duration: 30,
        baseRate: 75.00,
        organizationId: organization.id,
      },
    ],
  });

  // Get services with IDs
  const serviceList = await prisma.service.findMany({
    where: { organizationId: organization.id },
    orderBy: { name: 'asc' },
  });

  // Create Form Templates with rich schemas
  await prisma.formTemplate.createMany({
    data: [
      {
        name: 'Initial Assessment',
        description: 'Comprehensive initial client assessment form',
        organizationId: organization.id,
        category: 'Assessment',
        isRequired: true,
        status: true,
        schema: JSON.stringify({
          sections: [
            {
              name: 'Client Information',
              fields: [
                { name: 'clientName', label: 'Client Name', type: 'text', required: true },
                { name: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true },
                { name: 'primaryPhone', label: 'Primary Phone', type: 'tel', required: true },
              ],
            },
            {
              name: 'Health Status',
              fields: [
                { name: 'chiefComplaint', label: 'Chief Complaint', type: 'textarea', required: true },
                { name: 'medicalHistory', label: 'Medical History', type: 'textarea', required: false },
                { name: 'currentMedications', label: 'Current Medications', type: 'textarea', required: true },
                { name: 'allergies', label: 'Allergies', type: 'textarea', required: true },
              ],
            },
            {
              name: 'Functional Assessment',
              fields: [
                { name: 'mobility', label: 'Mobility Level', type: 'select', options: ['Independent', 'Assistive Device', 'Assistance Required', 'Dependent'], required: true },
                { name: 'adlStatus', label: 'ADL Status', type: 'select', options: ['Independent', 'Partial Assistance', 'Full Assistance'], required: true },
              ],
            },
          ],
        }),
      },
      {
        name: 'Vital Signs',
        description: 'Daily vital signs monitoring form',
        organizationId: organization.id,
        category: 'Vitals',
        isRequired: false,
        status: true,
        schema: JSON.stringify({
          sections: [
            {
              name: 'Vital Signs',
              fields: [
                { name: 'bloodPressure', label: 'Blood Pressure (mmHg)', type: 'text', placeholder: 'e.g., 120/80', required: true },
                { name: 'heartRate', label: 'Heart Rate (bpm)', type: 'number', required: true },
                { name: 'temperature', label: 'Temperature (F)', type: 'number', required: true },
                { name: 'respiratoryRate', label: 'Respiratory Rate', type: 'number', required: true },
                { name: 'oxygenSaturation', label: 'Oxygen Saturation (%)', type: 'number', required: false },
                { name: 'painLevel', label: 'Pain Level (0-10)', type: 'number', min: 0, max: 10, required: true },
              ],
            },
            {
              name: 'Observations',
              fields: [
                { name: 'observations', label: 'Clinical Observations', type: 'textarea', required: false },
              ],
            },
          ],
        }),
      },
      {
        name: 'ADL Assessment',
        description: 'Activities of Daily Living assessment',
        organizationId: organization.id,
        category: 'ADLs',
        isRequired: false,
        status: true,
        schema: JSON.stringify({
          sections: [
            {
              name: 'ADL Assessment',
              fields: [
                { name: 'bathing', label: 'Bathing', type: 'select', options: ['Independent', 'Supervision', 'Partial Assist', 'Total Assist'], required: true },
                { name: 'dressing', label: 'Dressing', type: 'select', options: ['Independent', 'Supervision', 'Partial Assist', 'Total Assist'], required: true },
                { name: 'toileting', label: 'Toileting', type: 'select', options: ['Independent', 'Supervision', 'Partial Assist', 'Total Assist'], required: true },
                { name: 'transferring', label: 'Transferring', type: 'select', options: ['Independent', 'Supervision', 'Partial Assist', 'Total Assist'], required: true },
                { name: 'mobility', label: 'Mobility', type: 'select', options: ['Independent', 'Supervision', 'Partial Assist', 'Total Assist'], required: true },
                { name: 'continence', label: 'Continence', type: 'select', options: ['Continence', 'Occasional Incontinence', 'Incontinent'], required: true },
              ],
            },
          ],
        }),
      },
      {
        name: 'Medication Administration Record',
        description: 'Medication administration documentation',
        organizationId: organization.id,
        category: 'Medications',
        isRequired: true,
        status: true,
        schema: JSON.stringify({
          sections: [
            {
              name: 'Medication Details',
              fields: [
                { name: 'medicationName', label: 'Medication Name', type: 'text', required: true },
                { name: 'dosage', label: 'Dosage', type: 'text', required: true },
                { name: 'route', label: 'Route', type: 'select', options: ['Oral', 'Topical', 'Intravenous', 'Inhalation', 'Other'], required: true },
                { name: 'administeredTime', label: 'Time Administered', type: 'time', required: true },
                { name: 'status', label: 'Status', type: 'select', options: ['Administered', 'Held', 'Refused', 'Not Given'], required: true },
                { name: 'reason', label: 'Reason (if not administered)', type: 'textarea', required: false },
              ],
            },
          ],
        }),
      },
      {
        name: 'Visit Notes',
        description: 'General visit documentation',
        organizationId: organization.id,
        category: 'Documentation',
        isRequired: false,
        status: true,
        schema: JSON.stringify({
          sections: [
            {
              name: 'Visit Documentation',
              fields: [
                { name: 'subjective', label: 'Subjective (Patient Reports)', type: 'textarea', required: false },
                { name: 'objective', label: 'Objective (Observations)', type: 'textarea', required: false },
                { name: 'assessment', label: 'Assessment', type: 'textarea', required: true },
                { name: 'plan', label: 'Plan', type: 'textarea', required: true },
              ],
            },
          ],
        }),
      },
      {
        name: 'Wound Care Assessment',
        description: 'Wound care documentation form',
        organizationId: organization.id,
        category: 'Wound Care',
        isRequired: false,
        status: true,
        schema: JSON.stringify({
          sections: [
            {
              name: 'Wound Assessment',
              fields: [
                { name: 'woundLocation', label: 'Wound Location', type: 'text', required: true },
                { name: 'woundType', label: 'Wound Type', type: 'select', options: ['Surgical Incision', 'Pressure Ulcer', 'Venous Ulcer', 'Arterial Ulcer', 'Diabetic Ulcer', 'Other'], required: true },
                { name: 'length', label: 'Length (cm)', type: 'number', required: false },
                { name: 'width', label: 'Width (cm)', type: 'number', required: false },
                { name: 'depth', label: 'Depth (cm)', type: 'number', required: false },
                { name: 'exudate', label: 'Exudate', type: 'select', options: ['None', 'Minimal', 'Moderate', 'Heavy'], required: true },
                { name: 'odor', label: 'Odor', type: 'select', options: ['None', 'Mild', 'Moderate', 'Strong'], required: true },
                { name: 'surroundingSkin', label: 'Surrounding Skin Condition', type: 'textarea', required: false },
              ],
            },
            {
              name: 'Treatment',
              fields: [
                { name: 'dressingType', label: 'Dressing Type', type: 'text', required: false },
                { name: 'treatmentNotes', label: 'Treatment Notes', type: 'textarea', required: false },
              ],
            },
          ],
        }),
      },
      ...chartingTemplates.map((template) => ({
        organizationId: organization.id,
        name: template.name,
        description: template.description,
        category: template.category,
        isRequired: template.isRequired,
        status: template.status,
        schema: template.schema,
      })),
    ],
  });

  // Get form templates with IDs
  const formTemplateList = await prisma.formTemplate.findMany({
    where: { organizationId: organization.id },
    orderBy: { name: 'asc' },
  });

  // Create Clients
  await prisma.client.createMany({
    data: [
      {
        firstName: 'Margaret',
        lastName: 'Anderson',
        dateOfBirth: new Date('1945-03-15'),
        gender: 'Female',
        phone: '(555) 345-6001',
        address: '1234 Peachtree St',
        city: 'Atlanta',
        state: 'GA',
        zipCode: '30309',
        status: 'ACTIVE',
        insuranceType: 'Medicare',
        insuranceId: 'MC-1234-5678-9012',
        organizationId: organization.id,
        branchId: atlantaMain.id,
      },
      {
        firstName: 'Robert',
        lastName: 'Harrison',
        dateOfBirth: new Date('1938-07-22'),
        gender: 'Male',
        phone: '(555) 345-6002',
        address: '567 West Paces Ferry',
        city: 'Atlanta',
        state: 'GA',
        zipCode: '30305',
        status: 'ACTIVE',
        insuranceType: 'Medicare',
        insuranceId: 'MC-2345-6789-0123',
        organizationId: organization.id,
        branchId: atlantaMain.id,
      },
      {
        firstName: 'Dorothy',
        lastName: 'Patterson',
        dateOfBirth: new Date('1952-11-08'),
        gender: 'Female',
        phone: '(555) 345-6003',
        address: '890 Roswell Rd',
        city: 'Marietta',
        state: 'GA',
        zipCode: '30062',
        status: 'ACTIVE',
        insuranceType: 'Private Insurance',
        insuranceId: 'PI-3456-7890-1234',
        organizationId: organization.id,
        branchId: mariettaBranch.id,
      },
      {
        firstName: 'Charles',
        lastName: 'Brooks',
        dateOfBirth: new Date('1941-05-30'),
        gender: 'Male',
        phone: '(555) 345-6004',
        address: '234 Highland Ave',
        city: 'Atlanta',
        state: 'GA',
        zipCode: '30307',
        status: 'ACTIVE',
        insuranceType: 'Medicaid',
        insuranceId: 'MD-4567-8901-2345',
        organizationId: organization.id,
        branchId: atlantaMain.id,
      },
      {
        firstName: 'Barbara',
        lastName: 'Collins',
        dateOfBirth: new Date('1949-09-12'),
        gender: 'Female',
        phone: '(555) 345-6005',
        address: '456 North Druid Hills',
        city: 'Atlanta',
        state: 'GA',
        zipCode: '30329',
        status: 'ACTIVE',
        insuranceType: 'Medicare',
        insuranceId: 'MC-5678-9012-3456',
        organizationId: organization.id,
        branchId: atlantaMain.id,
      },
      {
        firstName: 'William',
        lastName: 'Turner',
        dateOfBirth: new Date('1935-01-25'),
        gender: 'Male',
        phone: '(555) 345-6006',
        address: '789 Perimeter Center',
        city: 'Atlanta',
        state: 'GA',
        zipCode: '30346',
        status: 'ACTIVE',
        insuranceType: 'Private Insurance',
        insuranceId: 'PI-6789-0123-4567',
        organizationId: organization.id,
        branchId: atlantaMain.id,
      },
      {
        firstName: 'Helen',
        lastName: 'Phillips',
        dateOfBirth: new Date('1950-06-18'),
        gender: 'Female',
        phone: '(555) 345-6007',
        address: '321 Sandy Springs Rd',
        city: 'Marietta',
        state: 'GA',
        zipCode: '30066',
        status: 'ACTIVE',
        insuranceType: 'Medicare',
        insuranceId: 'MC-7890-1234-5678',
        organizationId: organization.id,
        branchId: mariettaBranch.id,
      },
      {
        firstName: 'Richard',
        lastName: 'Evans',
        dateOfBirth: new Date('1943-12-03'),
        gender: 'Male',
        phone: '(555) 345-6008',
        address: '654 Buckhead Ave',
        city: 'Atlanta',
        state: 'GA',
        zipCode: '30305',
        status: 'ACTIVE',
        insuranceType: 'Medicare',
        insuranceId: 'MC-8901-2345-6789',
        organizationId: organization.id,
        branchId: atlantaMain.id,
      },
      {
        firstName: 'Patricia',
        lastName: 'Cooper',
        dateOfBirth: new Date('1947-04-07'),
        gender: 'Female',
        phone: '(555) 345-6009',
        address: '987 Vinings Rd',
        city: 'Marietta',
        state: 'GA',
        zipCode: '30066',
        status: 'ACTIVE',
        insuranceType: 'Private Insurance',
        insuranceId: 'PI-9012-3456-7890',
        organizationId: organization.id,
        branchId: mariettaBranch.id,
      },
      {
        firstName: 'Joseph',
        lastName: 'Morgan',
        dateOfBirth: new Date('1936-08-29'),
        gender: 'Male',
        phone: '(555) 345-6010',
        address: '147 Lenox Rd',
        city: 'Atlanta',
        state: 'GA',
        zipCode: '30326',
        status: 'ACTIVE',
        insuranceType: 'Medicare',
        insuranceId: 'MC-0123-4567-8901',
        organizationId: organization.id,
        branchId: atlantaMain.id,
      },
    ],
  });

  // Get clients with IDs
  const clientList = await prisma.client.findMany({
    where: { organizationId: organization.id },
    orderBy: { firstName: 'asc' },
  });

  // Add Emergency Contacts
  const emergencyContacts = [
    { clientId: clientList[0].id, name: 'John Anderson', relation: 'Son', phone: '(555) 456-7001', email: 'j.anderson@email.com' },
    { clientId: clientList[1].id, name: 'Susan Harrison', relation: 'Daughter', phone: '(555) 456-7002', email: 's.harrison@email.com' },
    { clientId: clientList[2].id, name: 'Michael Patterson', relation: 'Son', phone: '(555) 456-7003', email: 'm.patterson@email.com' },
    { clientId: clientList[3].id, name: 'Linda Brooks', relation: 'Daughter', phone: '(555) 456-7004', email: 'l.brooks@email.com' },
    { clientId: clientList[4].id, name: 'Thomas Collins', relation: 'Son', phone: '(555) 456-7005', email: 't.collins@email.com' },
  ];
  await prisma.emergencyContact.createMany({ data: emergencyContacts });

  // Add Medications
  const medications = [
    { clientId: clientList[0].id, name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', notes: 'Take with food' },
    { clientId: clientList[0].id, name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', notes: 'Take with meals' },
    { clientId: clientList[1].id, name: 'Aspirin', dosage: '81mg', frequency: 'Once daily', notes: 'Take with food' },
    { clientId: clientList[1].id, name: 'Atorvastatin', dosage: '20mg', frequency: 'Once daily', notes: 'Take in evening' },
    { clientId: clientList[2].id, name: 'Levothyroxine', dosage: '75mcg', frequency: 'Once daily', notes: 'Take on empty stomach' },
  ];
  await prisma.medication.createMany({ data: medications });

  // Add Medical History
  const medicalHistory = [
    { clientId: clientList[0].id, condition: 'Hypertension', diagnosis: 'Essential Hypertension Stage 1', date: new Date('2018-05-15'), notes: 'Well controlled with medication' },
    { clientId: clientList[0].id, condition: 'Type 2 Diabetes', diagnosis: 'Type 2 Diabetes Mellitus', date: new Date('2015-03-20'), notes: 'A1C 6.8%' },
    { clientId: clientList[1].id, condition: 'Coronary Artery Disease', diagnosis: 'CAD, stable angina', date: new Date('2017-08-10'), notes: 'Post-CABG 2018' },
    { clientId: clientList[2].id, condition: 'Hypothyroidism', diagnosis: 'Primary Hypothyroidism', date: new Date('2010-11-05'), notes: 'Thyroidectomy 2010' },
  ];
  await prisma.medicalHistory.createMany({ data: medicalHistory });

  // Create Care Plans
  await prisma.carePlan.createMany({
    data: [
      {
        name: 'Post-Surgery Recovery - Margaret Anderson',
        description: 'Comprehensive care plan for post-hip replacement recovery including wound care, mobility assistance, and medication management',
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-04-15'),
        status: true,
        organizationId: organization.id,
        branchId: atlantaMain.id,
        clientId: clientList[0].id,
        staffId: staff1.id,
        serviceId: serviceList[0].id,
      },
      {
        name: 'Cardiac Rehabilitation - Robert Harrison',
        description: 'Physical therapy focused on cardiac rehabilitation, improving endurance and mobility',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-05-01'),
        status: true,
        organizationId: organization.id,
        branchId: atlantaMain.id,
        clientId: clientList[1].id,
        staffId: staff2.id,
        serviceId: serviceList[1].id,
      },
      {
        name: 'Stroke Recovery - Dorothy Patterson',
        description: 'Multidisciplinary approach to stroke recovery including PT, OT, and ST',
        startDate: new Date('2024-01-20'),
        endDate: null,
        status: true,
        organizationId: organization.id,
        branchId: mariettaBranch.id,
        clientId: clientList[2].id,
        staffId: staff4.id,
        serviceId: serviceList[2].id,
      },
    ],
  });

  // Get care plans with IDs
  const carePlanList = await prisma.carePlan.findMany({
    where: { organizationId: organization.id },
    orderBy: { name: 'asc' },
  });

  // Create Visits
  await prisma.visit.createMany({
    data: [
      // Margaret Anderson visits
      {
        title: 'Wound Care & Medication Review',
        description: 'Check surgical incision, change dressing, review medications',
        startTime: new Date('2024-03-15T09:00:00Z'),
        endTime: new Date('2024-03-15T10:00:00Z'),
        status: 'SCHEDULED',
        organizationId: organization.id,
        branchId: atlantaMain.id,
        carePlanId: carePlanList[0].id,
        clientId: clientList[0].id,
        staffId: staff1.id,
        userId: staffUser.id,
      },
      {
        title: 'Wound Care Follow-up',
        description: 'Assess wound healing, provide patient education',
        startTime: new Date('2024-03-18T09:00:00Z'),
        endTime: new Date('2024-03-18T10:00:00Z'),
        status: 'SCHEDULED',
        organizationId: organization.id,
        branchId: atlantaMain.id,
        carePlanId: carePlanList[0].id,
        clientId: clientList[0].id,
        staffId: staff1.id,
        userId: staffUser.id,
      },
      {
        title: 'Weekly Nursing Visit',
        description: 'Routine assessment and care',
        startTime: new Date('2024-03-20T14:00:00Z'),
        endTime: new Date('2024-03-20T15:00:00Z'),
        status: 'COMPLETED',
        actualStart: new Date('2024-03-20T14:05:00Z'),
        actualEnd: new Date('2024-03-20T14:55:00Z'),
        notes: 'Patient doing well, wound healing nicely',
        organizationId: organization.id,
        branchId: atlantaMain.id,
        carePlanId: carePlanList[0].id,
        clientId: clientList[0].id,
        staffId: staff1.id,
        userId: staffUser.id,
      },
      // Robert Harrison visits
      {
        title: 'Physical Therapy Session',
        description: 'Cardiac rehab exercises, gait training',
        startTime: new Date('2024-03-15T10:00:00Z'),
        endTime: new Date('2024-03-15T11:00:00Z'),
        status: 'SCHEDULED',
        organizationId: organization.id,
        branchId: atlantaMain.id,
        carePlanId: carePlanList[1].id,
        clientId: clientList[1].id,
        staffId: staff2.id,
      },
      {
        title: 'Strength Training',
        description: 'Upper and lower body exercises',
        startTime: new Date('2024-03-16T10:00:00Z'),
        endTime: new Date('2024-03-16T11:00:00Z'),
        status: 'SCHEDULED',
        organizationId: organization.id,
        branchId: atlantaMain.id,
        carePlanId: carePlanList[1].id,
        clientId: clientList[1].id,
        staffId: staff2.id,
      },
      // Dorothy Patterson visits
      {
        title: 'Occupational Therapy',
        description: 'ADL training, home safety assessment',
        startTime: new Date('2024-03-15T13:00:00Z'),
        endTime: new Date('2024-03-15T14:00:00Z'),
        status: 'SCHEDULED',
        organizationId: organization.id,
        branchId: mariettaBranch.id,
        carePlanId: carePlanList[2].id,
        clientId: clientList[2].id,
        staffId: staff4.id,
      },
      {
        title: 'Speech Therapy',
        description: 'Swallowing assessment and exercises',
        startTime: new Date('2024-03-17T11:00:00Z'),
        endTime: new Date('2024-03-17T12:00:00Z'),
        status: 'SCHEDULED',
        organizationId: organization.id,
        branchId: mariettaBranch.id,
        clientId: clientList[2].id,
        staffId: staff5.id,
      },
      // Additional visits
      {
        title: 'Home Health Aide Visit',
        description: 'Personal care assistance',
        startTime: new Date('2024-03-18T08:00:00Z'),
        endTime: new Date('2024-03-18T10:00:00Z'),
        status: 'SCHEDULED',
        organizationId: organization.id,
        branchId: atlantaMain.id,
        clientId: clientList[3].id,
        staffId: staff3.id,
      },
      {
        title: 'Nursing Assessment',
        description: 'Comprehensive health assessment',
        startTime: new Date('2024-03-19T09:00:00Z'),
        endTime: new Date('2024-03-19T10:00:00Z'),
        status: 'SCHEDULED',
        organizationId: organization.id,
        branchId: atlantaMain.id,
        clientId: clientList[4].id,
        staffId: staff1.id,
      },
      {
        title: 'Physical Therapy',
        description: 'Mobility and balance training',
        startTime: new Date('2024-03-19T14:00:00Z'),
        endTime: new Date('2024-03-19T15:00:00Z'),
        status: 'SCHEDULED',
        organizationId: organization.id,
        branchId: atlantaMain.id,
        clientId: clientList[5].id,
        staffId: staff2.id,
      },
      {
        title: 'Home Health Aide',
        description: 'Bathing and dressing assistance',
        startTime: new Date('2024-03-20T10:00:00Z'),
        endTime: new Date('2024-03-20T12:00:00Z'),
        status: 'SCHEDULED',
        organizationId: organization.id,
        branchId: mariettaBranch.id,
        clientId: clientList[6].id,
        staffId: staff3.id,
      },
      {
        title: 'Occupational Therapy',
        description: 'Kitchen safety and meal prep training',
        startTime: new Date('2024-03-21T11:00:00Z'),
        endTime: new Date('2024-03-21T12:00:00Z'),
        status: 'SCHEDULED',
        organizationId: organization.id,
        branchId: atlantaMain.id,
        clientId: clientList[7].id,
        staffId: staff4.id,
      },
      {
        title: 'Speech Therapy Follow-up',
        description: 'Progress assessment and new exercises',
        startTime: new Date('2024-03-21T14:00:00Z'),
        endTime: new Date('2024-03-21T15:00:00Z'),
        status: 'SCHEDULED',
        organizationId: organization.id,
        branchId: mariettaBranch.id,
        clientId: clientList[8].id,
        staffId: staff5.id,
      },
      {
        title: 'Weekly Nursing Check-in',
        description: 'Medication review and vitals check',
        startTime: new Date('2024-03-22T09:00:00Z'),
        endTime: new Date('2024-03-22T10:00:00Z'),
        status: 'SCHEDULED',
        organizationId: organization.id,
        branchId: atlantaMain.id,
        clientId: clientList[9].id,
        staffId: staff1.id,
      },
      // More visits to reach 25+
      {
        title: 'Skilled Nursing Visit',
        description: 'Routine nursing care',
        startTime: new Date('2024-03-25T09:00:00Z'),
        endTime: new Date('2024-03-25T10:00:00Z'),
        status: 'SCHEDULED',
        organizationId: organization.id,
        branchId: atlantaMain.id,
        clientId: clientList[0].id,
        staffId: staff1.id,
      },
      {
        title: 'Physical Therapy',
        description: 'Gait and balance training',
        startTime: new Date('2024-03-25T10:00:00Z'),
        endTime: new Date('2024-03-25T11:00:00Z'),
        status: 'SCHEDULED',
        organizationId: organization.id,
        branchId: atlantaMain.id,
        clientId: clientList[1].id,
        staffId: staff2.id,
      },
      {
        title: 'Home Health Aide',
        description: 'Personal care and light housekeeping',
        startTime: new Date('2024-03-25T13:00:00Z'),
        endTime: new Date('2024-03-25T15:00:00Z'),
        status: 'SCHEDULED',
        organizationId: organization.id,
        branchId: mariettaBranch.id,
        clientId: clientList[2].id,
        staffId: staff3.id,
      },
      {
        title: 'Occupational Therapy',
        description: 'Upper extremity strengthening',
        startTime: new Date('2024-03-26T10:00:00Z'),
        endTime: new Date('2024-03-26T11:00:00Z'),
        status: 'SCHEDULED',
        organizationId: organization.id,
        branchId: atlantaMain.id,
        clientId: clientList[3].id,
        staffId: staff4.id,
      },
      {
        title: 'Speech Therapy',
        description: 'Communication exercises',
        startTime: new Date('2024-03-26T14:00:00Z'),
        endTime: new Date('2024-03-26T15:00:00Z'),
        status: 'SCHEDULED',
        organizationId: organization.id,
        branchId: mariettaBranch.id,
        clientId: clientList[4].id,
        staffId: staff5.id,
      },
      {
        title: 'Skilled Nursing',
        description: 'Wound assessment and care',
        startTime: new Date('2024-03-27T09:00:00Z'),
        endTime: new Date('2024-03-27T10:00:00Z'),
        status: 'SCHEDULED',
        organizationId: organization.id,
        branchId: atlantaMain.id,
        clientId: clientList[5].id,
        staffId: staff1.id,
      },
      {
        title: 'Physical Therapy',
        description: 'Cardiac conditioning',
        startTime: new Date('2024-03-27T11:00:00Z'),
        endTime: new Date('2024-03-27T12:00:00Z'),
        status: 'SCHEDULED',
        organizationId: organization.id,
        branchId: atlantaMain.id,
        clientId: clientList[6].id,
        staffId: staff2.id,
      },
      {
        title: 'Home Health Aide',
        description: 'Meal preparation assistance',
        startTime: new Date('2024-03-27T14:00:00Z'),
        endTime: new Date('2024-03-27T16:00:00Z'),
        status: 'SCHEDULED',
        organizationId: organization.id,
        branchId: mariettaBranch.id,
        clientId: clientList[7].id,
        staffId: staff3.id,
      },
      {
        title: 'Occupational Therapy',
        description: 'Transfer training',
        startTime: new Date('2024-03-28T10:00:00Z'),
        endTime: new Date('2024-03-28T11:00:00Z'),
        status: 'SCHEDULED',
        organizationId: organization.id,
        branchId: atlantaMain.id,
        clientId: clientList[8].id,
        staffId: staff4.id,
      },
      {
        title: 'Speech Therapy',
        description: 'Cognitive exercises',
        startTime: new Date('2024-03-28T13:00:00Z'),
        endTime: new Date('2024-03-28T14:00:00Z'),
        status: 'SCHEDULED',
        organizationId: organization.id,
        branchId: mariettaBranch.id,
        clientId: clientList[9].id,
        staffId: staff5.id,
      },
    ],
  });

  // Get visits with IDs
  const visitList = await prisma.visit.findMany({
    where: { organizationId: organization.id },
    orderBy: { startTime: 'desc' },
    take: 10,
  });

  // Add Visit Tasks
  const visitTasks = [
    { visitId: visitList[0].id, title: 'Change surgical dressing', completed: false },
    { visitId: visitList[0].id, title: 'Check vital signs', completed: false },
    { visitId: visitList[0].id, title: 'Review medication list', completed: false },
    { visitId: visitList[1].id, title: 'Assess wound healing', completed: false },
    { visitId: visitList[1].id, title: 'Provide patient education', completed: false },
  ];
  await prisma.visitTask.createMany({ data: visitTasks });

  // Add Visit Notes
  const visitNotes = [
    { visitId: visitList[2].id, content: 'Patient tolerated visit well. Wound healing nicely with no signs of infection. Patient reports minimal pain.' },
    { visitId: visitList[2].id, content: 'Blood pressure 128/82, Heart rate 72, Temperature 98.6 F. All vitals within normal range.' },
  ];
  await prisma.visitNote.createMany({ data: visitNotes });

  // Create Client Forms (linked to templates)
  const clientForms = [
    {
      templateId: formTemplateList[0].id, // Initial Assessment
      clientId: clientList[0].id,
      status: 'APPROVED',
      submittedAt: new Date('2024-01-10'),
      approvedAt: new Date('2024-01-10'),
      formData: JSON.stringify({
        clientName: 'Margaret Anderson',
        dateOfBirth: '1945-03-15',
        primaryPhone: '(555) 345-6001',
        chiefComplaint: 'Post-hip replacement recovery',
        mobility: 'Partial Assist',
        adlStatus: 'Partial Assistance',
      }),
    },
    {
      templateId: formTemplateList[0].id, // Initial Assessment
      clientId: clientList[1].id,
      status: 'APPROVED',
      submittedAt: new Date('2024-02-01'),
      approvedAt: new Date('2024-02-01'),
      formData: JSON.stringify({
        clientName: 'Robert Harrison',
        dateOfBirth: '1938-07-22',
        primaryPhone: '(555) 345-6002',
        chiefComplaint: 'Cardiac rehabilitation',
        mobility: 'Supervision',
        adlStatus: 'Independent',
      }),
    },
    {
      templateId: formTemplateList[0].id, // Initial Assessment
      clientId: clientList[2].id,
      status: 'APPROVED',
      submittedAt: new Date('2024-01-15'),
      approvedAt: new Date('2024-01-15'),
      formData: JSON.stringify({
        clientName: 'Dorothy Patterson',
        dateOfBirth: '1952-11-08',
        primaryPhone: '(555) 345-6003',
        chiefComplaint: 'Stroke recovery',
        mobility: 'Assistance Required',
        adlStatus: 'Full Assistance',
      }),
    },
  ];
  await prisma.clientForm.createMany({ data: clientForms });

  // Create Invoices
  await prisma.invoice.createMany({
    data: [
      {
        invoiceNumber: 'INV-2024-001',
        amount: 625.00,
        status: 'PAID',
        dueDate: new Date('2024-02-15'),
        paidDate: new Date('2024-02-10'),
        notes: 'Skilled Nursing services - Week 1',
        organizationId: organization.id,
        branchId: atlantaMain.id,
        clientId: clientList[0].id,
        userId: adminUser.id,
        visitId: visitList[2].id,
      },
      {
        invoiceNumber: 'INV-2024-002',
        amount: 390.00,
        status: 'PAID',
        dueDate: new Date('2024-02-20'),
        paidDate: new Date('2024-02-18'),
        notes: 'Physical Therapy sessions',
        organizationId: organization.id,
        branchId: atlantaMain.id,
        clientId: clientList[1].id,
        userId: adminUser.id,
      },
      {
        invoiceNumber: 'INV-2024-003',
        amount: 500.00,
        status: 'SENT',
        dueDate: new Date('2024-03-15'),
        notes: 'Occupational Therapy - March week 1',
        organizationId: organization.id,
        branchId: mariettaBranch.id,
        clientId: clientList[2].id,
        userId: adminUser.id,
      },
      {
        invoiceNumber: 'INV-2024-004',
        amount: 250.00,
        status: 'SENT',
        dueDate: new Date('2024-03-20'),
        notes: 'Home Health Aide services',
        organizationId: organization.id,
        branchId: atlantaMain.id,
        clientId: clientList[3].id,
        userId: adminUser.id,
      },
      {
        invoiceNumber: 'INV-2024-005',
        amount: 625.00,
        status: 'DRAFT',
        dueDate: new Date('2024-03-25'),
        notes: 'Skilled Nursing - Upcoming week',
        organizationId: organization.id,
        branchId: atlantaMain.id,
        clientId: clientList[4].id,
        userId: adminUser.id,
      },
    ],
  });

  // Add Invoice Items
  const inv1 = await prisma.invoice.findFirst({ where: { invoiceNumber: 'INV-2024-001' } });
  const inv2 = await prisma.invoice.findFirst({ where: { invoiceNumber: 'INV-2024-002' } });
  const inv3 = await prisma.invoice.findFirst({ where: { invoiceNumber: 'INV-2024-003' } });
  const invoiceItems = [
    { invoiceId: inv1.id, description: 'Skilled Nursing - 5 visits', quantity: 5, unitPrice: 125.00, amount: 625.00 },
    { invoiceId: inv2.id, description: 'Physical Therapy - 3 sessions', quantity: 3, unitPrice: 130.00, amount: 390.00 },
    { invoiceId: inv3.id, description: 'Occupational Therapy - 4 sessions', quantity: 4, unitPrice: 125.00, amount: 500.00 },
  ];
  await prisma.invoiceItem.createMany({ data: invoiceItems });

  // Create Timesheets
  await prisma.timesheet.createMany({
    data: [
      {
        startDate: new Date('2024-03-11'),
        endDate: new Date('2024-03-15'),
        totalHours: 35.0,
        status: 'APPROVED',
        notes: 'Regular weekly hours',
        organizationId: organization.id,
        branchId: atlantaMain.id,
        staffId: staff1.id,
        userId: staffUser.id,
      },
      {
        startDate: new Date('2024-03-11'),
        endDate: new Date('2024-03-15'),
        totalHours: 30.0,
        status: 'APPROVED',
        notes: 'Regular weekly hours',
        organizationId: organization.id,
        branchId: atlantaMain.id,
        staffId: staff2.id,
        userId: staffUser.id,
      },
      {
        startDate: new Date('2024-03-11'),
        endDate: new Date('2024-03-15'),
        totalHours: 24.0,
        status: 'SUBMITTED',
        notes: 'Part-time schedule',
        organizationId: organization.id,
        branchId: mariettaBranch.id,
        staffId: staff3.id,
        userId: staffUser.id,
      },
      {
        startDate: new Date('2024-03-18'),
        endDate: new Date('2024-03-22'),
        totalHours: 35.0,
        status: 'DRAFT',
        notes: 'Current week in progress',
        organizationId: organization.id,
        branchId: atlantaMain.id,
        staffId: staff1.id,
        userId: staffUser.id,
      },
    ],
  });

  // Add Timesheet Entries
  const latestTimesheet = await prisma.timesheet.findFirst({ orderBy: { createdAt: 'desc' } });
  const timesheetEntries = [
    { timesheetId: latestTimesheet.id, date: new Date('2024-03-11'), hours: 7.0, notes: 'Client visits', billable: true },
    { timesheetId: latestTimesheet.id, date: new Date('2024-03-12'), hours: 8.0, notes: 'Client visits', billable: true },
    { timesheetId: latestTimesheet.id, date: new Date('2024-03-13'), hours: 7.0, notes: 'Client visits', billable: true },
    { timesheetId: latestTimesheet.id, date: new Date('2024-03-14'), hours: 6.5, notes: 'Client visits + documentation', billable: true },
    { timesheetId: latestTimesheet.id, date: new Date('2024-03-15'), hours: 6.5, notes: 'Client visits', billable: true },
  ];
  await prisma.timesheetEntry.createMany({ data: timesheetEntries });

  // Create Notifications
  const notifications = [
    { userId: adminUser.id, title: 'New Client Registration', message: 'Charles Brooks has been registered as a new client', type: 'info', read: false },
    { userId: adminUser.id, title: 'Invoice Payment Received', message: 'Payment of $625.00 received for invoice INV-2024-001', type: 'success', read: true },
    { userId: managerUser.id, title: 'Timesheet Approval Required', message: 'Lisa Johnson submitted a timesheet for approval', type: 'warning', read: false },
    { userId: supervisorUser.id, title: 'Visit Completed', message: 'Emily Rodriguez completed scheduled visit with Margaret Anderson', type: 'info', read: true },
    { userId: staffUser.id, title: 'New Visit Scheduled', message: 'You have a new visit scheduled with Margaret Anderson on March 15th', type: 'info', read: false },
  ];
  await prisma.notification.createMany({ data: notifications });

  // Create Audit Logs
  const auditLogs = [
    { userId: adminUser.id, action: 'CREATE', entity: 'Client', entityId: clientList[0].id, changes: JSON.stringify({ name: 'Margaret Anderson' }) },
    { userId: adminUser.id, action: 'CREATE', entity: 'CarePlan', entityId: carePlanList[0].id, changes: JSON.stringify({ name: 'Post-Surgery Recovery' }) },
    { userId: managerUser.id, action: 'UPDATE', entity: 'Invoice', entityId: null, changes: JSON.stringify({ status: 'SENT' }) },
  ];
  await prisma.auditLog.createMany({ data: auditLogs });

  // Create Documents
  const documents = [
    { clientId: clientList[0].id, name: 'Medical History.pdf', type: 'Medical Record', url: '/documents/medical-history-ma.pdf', size: 245678, uploadedBy: 'Sarah Mitchell' },
    { clientId: clientList[0].id, name: 'Insurance Card.pdf', type: 'Insurance', url: '/documents/insurance-card-ma.pdf', size: 123456, uploadedBy: 'Sarah Mitchell' },
    { clientId: clientList[1].id, name: 'Cardiology Report.pdf', type: 'Medical Record', url: '/documents/cardiology-rh.pdf', size: 345678, uploadedBy: 'Jennifer Davis' },
    { clientId: clientList[1].id, name: 'Medication List.pdf', type: 'Medical Record', url: '/documents/medication-list-rh.pdf', size: 89012, uploadedBy: 'Jennifer Davis' },
    { clientId: clientList[2].id, name: 'Stroke Assessment.pdf', type: 'Medical Record', url: '/documents/stroke-assessment-dp.pdf', size: 456789, uploadedBy: 'Robert Wilson' },
    { clientId: clientList[2].id, name: 'Care Plan.pdf', type: 'Care Plan', url: '/documents/care-plan-dp.pdf', size: 167890, uploadedBy: 'Robert Wilson' },
    { clientId: clientList[3].id, name: 'Consent Form.pdf', type: 'Legal', url: '/documents/consent-cb.pdf', size: 78901, uploadedBy: 'Sarah Mitchell' },
    { clientId: clientList[4].id, name: 'Advance Directive.pdf', type: 'Legal', url: '/documents/advance-directive-bc.pdf', size: 134567, uploadedBy: 'Sarah Mitchell' },
  ];
  await prisma.document.createMany({ data: documents });

  // Create Drug Interactions
  const drugInteractions = [
    {
      drug1: 'Warfarin',
      drug2: 'Aspirin',
      severity: 'HIGH',
      description: 'Increased risk of bleeding when warfarin is combined with aspirin.',
      recommendation: 'Monitor INR closely. Consider alternative pain management or reduce aspirin dose.',
    },
    {
      drug1: 'Warfarin',
      drug2: 'Ibuprofen',
      severity: 'HIGH',
      description: 'NSAIDs may increase the anticoagulant effect of warfarin.',
      recommendation: 'Avoid concomitant use if possible. Use acetaminophen for pain relief instead.',
    },
    {
      drug1: 'Clopidogrel',
      drug2: 'Omeprazole',
      severity: 'MODERATE',
      description: 'Omeprazole may reduce the effectiveness of clopidogrel.',
      recommendation: 'Consider using pantoprazole instead of omeprazole.',
    },
    {
      drug1: 'Simvastatin',
      drug2: 'Amlodipine',
      severity: 'MODERATE',
      description: 'Amlodipine may increase simvastatin levels, increasing risk of myopathy.',
      recommendation: 'Limit simvastatin dose to 20mg daily when used with amlodipine.',
    },
    {
      drug1: 'Lisinopril',
      drug2: 'Potassium',
      severity: 'MODERATE',
      description: 'ACE inhibitors may increase potassium levels when combined with potassium supplements.',
      recommendation: 'Monitor potassium levels regularly.',
    },
    {
      drug1: 'Metformin',
      drug2: 'Contrast Dye',
      severity: 'HIGH',
      description: 'Risk of lactic acidosis when metformin is used with iodinated contrast.',
      recommendation: 'Hold metformin before and for 48 hours after contrast imaging.',
    },
    {
      drug1: 'Digoxin',
      drug2: 'Amiodarone',
      severity: 'HIGH',
      description: 'Amiodarone can increase digoxin levels to toxic levels.',
      recommendation: 'Reduce digoxin dose by 50% when starting amiodarone. Monitor digoxin levels.',
    },
    {
      drug1: 'Levothyroxine',
      drug2: 'Calcium',
      severity: 'LOW',
      description: 'Calcium supplements may reduce absorption of levothyroxine.',
      recommendation: 'Separate administration by at least 4 hours.',
    },
    {
      drug1: 'Levothyroxine',
      drug2: 'Iron',
      severity: 'LOW',
      description: 'Iron supplements may reduce absorption of levothyroxine.',
      recommendation: 'Separate administration by at least 4 hours.',
    },
    {
      drug1: 'Warfarin',
      drug2: 'Vitamin K',
      severity: 'HIGH',
      description: 'Vitamin K can reverse the anticoagulant effect of warfarin.',
      recommendation: 'Maintain consistent vitamin K intake. Monitor INR closely.',
    },
    {
      drug1: 'Metoprolol',
      drug2: 'Verapamil',
      severity: 'HIGH',
      description: 'Increased risk of bradycardia and heart block.',
      recommendation: 'Avoid concomitant use or monitor heart rate closely.',
    },
    {
      drug1: 'Fluoxetine',
      drug2: 'Tramadol',
      severity: 'HIGH',
      description: 'Increased risk of serotonin syndrome.',
      recommendation: 'Avoid concomitant use or monitor for signs of serotonin syndrome.',
    },
    {
      drug1: 'Allopurinol',
      drug2: 'Azathioprine',
      severity: 'CONTRAINDICATED',
      description: 'Allopurinol can increase azathioprine levels to toxic levels.',
      recommendation: 'Do not use together. Consider alternative medication.',
    },
    {
      drug1: 'Methotrexate',
      drug2: 'NSAIDs',
      severity: 'HIGH',
      description: 'NSAIDs may increase methotrexate toxicity.',
      recommendation: 'Avoid high-dose NSAIDs. Monitor methotrexate levels.',
    },
    {
      drug1: 'Tadalafil',
      drug2: 'Nitroglycerin',
      severity: 'CONTRAINDICATED',
      description: 'Severe hypotension may occur when PDE5 inhibitors are used with nitrates.',
      recommendation: 'Do not use together. Maintain 24-48 hour separation.',
    },
    {
      drug1: 'Spironolactone',
      drug2: 'Lisinopril',
      severity: 'MODERATE',
      description: 'Increased risk of hyperkalemia.',
      recommendation: 'Monitor potassium levels regularly.',
    },
    {
      drug1: 'Ciprofloxacin',
      drug2: 'Theophylline',
      severity: 'MODERATE',
      description: 'Ciprofloxacin may increase theophylline levels.',
      recommendation: 'Monitor theophylline levels and adjust dose if needed.',
    },
    {
      drug1: 'Clarithromycin',
      drug2: 'Simvastatin',
      severity: 'HIGH',
      description: 'Macrolide antibiotics can increase simvastatin levels significantly.',
      recommendation: 'Hold simvastatin during clarithromycin treatment.',
    },
    {
      drug1: 'Sertraline',
      drug2: 'Fentanyl',
      severity: 'MODERATE',
      description: 'Risk of serotonin syndrome when SSRIs are combined with fentanyl.',
      recommendation: 'Monitor for signs of serotonin syndrome.',
    },
    {
      drug1: 'Diltiazem',
      drug2: 'Atorvastatin',
      severity: 'LOW',
      description: 'Diltiazem may increase atorvastatin levels.',
      recommendation: 'Monitor for signs of statin toxicity. Consider dose adjustment.',
    },
  ];
  await prisma.drugInteraction.createMany({ data: drugInteractions });

  console.log('Database seeded successfully!');
  console.log(`Created: 1 Organization, 2 Branches, 5 Users, 5 Staff, 6 Services`);
  console.log(`Created: 10 Clients, 3 Care Plans, 27+ Visits`);
  console.log(`Created: Emergency contacts, Medications, Medical history, Forms`);
  console.log(`Created: Invoices, Timesheets, Notifications, Audit logs, Documents`);
  console.log(`Created: 20 Drug Interaction rules for safety alerts`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

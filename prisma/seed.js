import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Hash password for all users
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create Organization
  const organization = await prisma.organization.create({
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

  // Create Branches
  const atlantaMain = await prisma.branch.create({
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

  const mariettaBranch = await prisma.branch.create({
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

  // Create Users
  const adminUser = await prisma.user.create({
    data: {
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

  const superAdminUser = await prisma.user.create({
    data: {
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

  const managerUser = await prisma.user.create({
    data: {
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

  const supervisorUser = await prisma.user.create({
    data: {
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

  const staffUser = await prisma.user.create({
    data: {
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
  const staff1 = await prisma.staff.create({
    data: {
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
  const services = await prisma.service.createMany({
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

  // Create Clients
  const clients = await prisma.client.createMany({
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
  const carePlans = await prisma.carePlan.createMany({
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
  const visits = await prisma.visit.createMany({
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

  // Create Forms
  const forms = [
    { clientId: clientList[0].id, name: 'HIPAA Consent Form', type: 'Consent', status: 'APPROVED', submittedAt: new Date('2024-01-10'), approvedAt: new Date('2024-01-10') },
    { clientId: clientList[0].id, name: 'Medical Release Authorization', type: 'Authorization', status: 'APPROVED', submittedAt: new Date('2024-01-10'), approvedAt: new Date('2024-01-11') },
    { clientId: clientList[1].id, name: 'HIPAA Consent Form', type: 'Consent', status: 'APPROVED', submittedAt: new Date('2024-02-01'), approvedAt: new Date('2024-02-01') },
    { clientId: clientList[2].id, name: 'HIPAA Consent Form', type: 'Consent', status: 'APPROVED', submittedAt: new Date('2024-01-15'), approvedAt: new Date('2024-01-15') },
    { clientId: clientList[2].id, name: 'Care Plan Authorization', type: 'Authorization', status: 'PENDING', submittedAt: new Date('2024-03-01') },
  ];
  await prisma.form.createMany({ data: forms });

  // Create Invoices
  const invoices = await prisma.invoice.createMany({
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
  const timesheets = await prisma.timesheet.createMany({
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

  console.log('Database seeded successfully!');
  console.log(`Created: 1 Organization, 2 Branches, 5 Users, 5 Staff, 6 Services`);
  console.log(`Created: 10 Clients, 3 Care Plans, 27+ Visits`);
  console.log(`Created: Emergency contacts, Medications, Medical history, Forms`);
  console.log(`Created: Invoices, Timesheets, Notifications, Audit logs`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export const chartingTemplates = [
  {
    name: 'RN/LPN Documentation (Georgia)',
    description: 'Visit-based nursing documentation for Georgia field staff.',
    category: 'Assessment',
    isRequired: true,
    status: true,
    schema: {
      sections: [
        {
          name: 'Visit Details',
          fields: [
            { name: 'patientInitials', label: 'Patient Name/Initials', type: 'text', required: true },
            { name: 'visitDate', label: 'Date', type: 'date', required: true },
            { name: 'visitTime', label: 'Visit Time', type: 'time', required: true },
            { name: 'visitType', label: 'Visit Type', type: 'select', options: ['Routine Visit', 'PRN Visit', 'Start of Care', 'Recertification'], required: true },
            { name: 'caregiverRelationship', label: 'Relationship to Patient', type: 'select', options: ['Self', 'Parent', 'Guardian', 'Spouse', 'Other'], required: true },
          ],
        },
        {
          name: 'Clinical Assessment',
          fields: [
            { name: 'bloodPressure', label: 'Blood Pressure', type: 'text', required: false, placeholder: 'e.g. 120/80' },
            { name: 'pulse', label: 'Pulse', type: 'text', required: false },
            { name: 'temperature', label: 'Temperature', type: 'text', required: false },
            { name: 'respiratoryStatus', label: 'Respiratory Status', type: 'textarea', required: false },
            { name: 'painAssessment', label: 'Pain Assessment', type: 'textarea', required: false },
            { name: 'skinCondition', label: 'Skin Condition', type: 'textarea', required: false },
            { name: 'nursingNotes', label: 'Nursing Notes', type: 'textarea', required: true },
          ],
        },
        {
          name: 'Interventions & Coordination',
          fields: [
            { name: 'skilledInterventions', label: 'Skilled Interventions Performed', type: 'textarea', required: true },
            { name: 'medicationReviewCompleted', label: 'Medication Review Completed', type: 'checkbox', required: false },
            { name: 'careCoordinationNotes', label: 'Care Coordination Notes', type: 'textarea', required: false },
            { name: 'physicianNotificationNeeded', label: 'Physician Notification Needed', type: 'radio', options: ['Yes', 'No'], required: true },
          ],
        },
        {
          name: 'Visit Sign Off',
          fields: [
            { name: 'caregiverResponse', label: 'Patient/Caregiver Response to Care', type: 'textarea', required: false },
            { name: 'nextVisitPlan', label: 'Plan For Next Visit', type: 'textarea', required: true },
            { name: 'clinicianSignature', label: 'Clinician Signature', type: 'text', required: true },
          ],
        },
      ],
    },
  },
  {
    name: 'Patient Logs',
    description: 'Patient and caregiver observations recorded during the visit.',
    category: 'Documentation',
    isRequired: true,
    status: true,
    schema: {
      sections: [
        {
          name: 'Log Entry',
          fields: [
            { name: 'logDate', label: 'Log Date', type: 'date', required: true },
            { name: 'logTime', label: 'Log Time', type: 'time', required: true },
            { name: 'caregiverPresent', label: 'Caregiver Present', type: 'select', options: ['Yes', 'No'], required: true },
            { name: 'summary', label: 'Visit Summary', type: 'textarea', required: true },
          ],
        },
        {
          name: 'Observations & ADLs',
          fields: [
            { name: 'clientMood', label: 'Client Mood / Affect', type: 'textarea', required: false },
            { name: 'adlsAddressed', label: 'ADLs Addressed', type: 'textarea', required: true },
            { name: 'safetyConcerns', label: 'Safety Concerns Observed', type: 'textarea', required: false },
          ],
        },
        {
          name: 'Communication & Follow Up',
          fields: [
            { name: 'familyCommunication', label: 'Family / Care Team Communication', type: 'textarea', required: false },
            { name: 'followUpNeeded', label: 'Follow Up Needed', type: 'textarea', required: false },
            { name: 'staffInitials', label: 'Staff Initials', type: 'text', required: true },
          ],
        },
      ],
    },
  },
  {
    name: 'Physician Order Form',
    description: 'Physician order capture tied to service tasks and care plan updates.',
    category: 'Orders',
    isRequired: false,
    status: true,
    schema: {
      sections: [
        {
          name: 'Order Information',
          fields: [
            { name: 'orderDate', label: 'Order Date', type: 'date', required: true },
            { name: 'physicianName', label: 'Physician Name', type: 'text', required: true },
            { name: 'orderType', label: 'Order Type', type: 'select', options: ['Medication', 'Treatment', 'Therapy', 'Lab', 'Other'], required: true },
            { name: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
          ],
        },
        {
          name: 'Clinical Order Details',
          fields: [
            { name: 'orderSummary', label: 'Order Summary', type: 'textarea', required: true },
            { name: 'instructions', label: 'Instructions / Parameters', type: 'textarea', required: true },
            { name: 'priorityLevel', label: 'Priority Level', type: 'radio', options: ['Routine', 'Urgent'], required: true },
          ],
        },
        {
          name: 'Agency Follow Up',
          fields: [
            { name: 'verbalOrderReceived', label: 'Verbal Order Received', type: 'checkbox', required: false },
            { name: 'agencyFollowUpPlan', label: 'Agency Follow Up Plan', type: 'textarea', required: true },
            { name: 'orderVerifiedBy', label: 'Order Verified By', type: 'text', required: true },
          ],
        },
      ],
    },
  },
];

export async function ensureOrganizationChartingTemplates(prisma, organizationId) {
  for (const template of chartingTemplates) {
    await prisma.formTemplate.upsert({
      where: {
        organizationId_name: {
          organizationId,
          name: template.name,
        },
      },
      update: {
        description: template.description,
        category: template.category,
        isRequired: template.isRequired,
        status: template.status,
        schema: template.schema,
      },
      create: {
        organizationId,
        name: template.name,
        description: template.description,
        category: template.category,
        isRequired: template.isRequired,
        status: template.status,
        schema: template.schema,
      },
    });
  }
}

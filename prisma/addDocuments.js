import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding documents to existing clients...');

  // Get all clients
  const clientList = await prisma.client.findMany({
    orderBy: { firstName: 'asc' },
  });

  if (clientList.length === 0) {
    console.log('No clients found. Run the main seed first.');
    return;
  }

  // Define documents for clients
  const documents = [
    { clientId: clientList[0]?.id, name: 'Medical History.pdf', type: 'Medical Record', url: '/documents/medical-history-ma.pdf', size: 245678, uploadedBy: 'Sarah Mitchell' },
    { clientId: clientList[0]?.id, name: 'Insurance Card.pdf', type: 'Insurance', url: '/documents/insurance-card-ma.pdf', size: 123456, uploadedBy: 'Sarah Mitchell' },
    { clientId: clientList[1]?.id, name: 'Cardiology Report.pdf', type: 'Medical Record', url: '/documents/cardiology-rh.pdf', size: 345678, uploadedBy: 'Jennifer Davis' },
    { clientId: clientList[1]?.id, name: 'Medication List.pdf', type: 'Medical Record', url: '/documents/medication-list-rh.pdf', size: 89012, uploadedBy: 'Jennifer Davis' },
    { clientId: clientList[2]?.id, name: 'Stroke Assessment.pdf', type: 'Medical Record', url: '/documents/stroke-assessment-dp.pdf', size: 456789, uploadedBy: 'Robert Wilson' },
    { clientId: clientList[2]?.id, name: 'Care Plan.pdf', type: 'Care Plan', url: '/documents/care-plan-dp.pdf', size: 167890, uploadedBy: 'Robert Wilson' },
    { clientId: clientList[3]?.id, name: 'Consent Form.pdf', type: 'Legal', url: '/documents/consent-cb.pdf', size: 78901, uploadedBy: 'Sarah Mitchell' },
    { clientId: clientList[4]?.id, name: 'Advance Directive.pdf', type: 'Legal', url: '/documents/advance-directive-bc.pdf', size: 134567, uploadedBy: 'Sarah Mitchell' },
  ].filter(doc => doc.clientId); // Filter out documents without valid client IDs

  // Check if documents already exist
  const existingDocs = await prisma.document.count();
  if (existingDocs > 0) {
    console.log(`Documents already exist (${existingDocs} documents). Skipping...`);
    return;
  }

  // Create documents
  await prisma.document.createMany({ data: documents });

  console.log(`Successfully added ${documents.length} documents!`);
}

main()
  .catch((e) => {
    console.error('Error adding documents:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

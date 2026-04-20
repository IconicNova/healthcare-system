const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- START ---');
  let clientsCount = await prisma.client.count();
  let staffCount = await prisma.staff.count();
  console.log(`Clients count: ${clientsCount}`);
  console.log(`Staff count: ${staffCount}`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });

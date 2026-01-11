import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Seed data will be added here
  console.log('Seeding database...');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

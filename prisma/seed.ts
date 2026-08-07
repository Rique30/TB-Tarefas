import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedDatabase } from "../src/lib/seed-data";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

seedDatabase(prisma)
  .then((summary) => {
    console.log("Seed concluído:", summary);
    console.log('Equipe original: senha "tbaviation123" para os e-mails @tbaviation.com.br');
    console.log('Equipe adicional: senha "1234" para gpereira, cchiavelli, tantonelli, hcuin, mgonzalez, rbraz e rleonardi @tbaviation.com.br');
    console.log('Cliente de exemplo: cliente@exemplo.com / senha "cliente123"');
    console.log('Admin: usuário "ltavares" (ou ltavares@tbaviation.com.br) / senha "1234"');
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

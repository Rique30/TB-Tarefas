import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedDatabase } from "../src/lib/seed-data";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

seedDatabase(prisma)
  .then((summary) => {
    console.log("Seed concluído:", summary);
    console.log('Equipe interna: senha "tbaviation123" para todos os e-mails @tbaviation.com.br e henriquets.2628@gmail.com');
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

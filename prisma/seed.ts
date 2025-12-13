import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cloudclash.local' },
    update: {},
    create: {
      email: 'admin@cloudclash.local',
      password: hashedPassword,
      role: 'ADMIN',
      isPremium: true,
    },
  });

  console.log('✅ Default admin user created:', admin.email);
  console.log('📧 Email: admin@cloudclash.local');
  console.log('🔑 Password: admin123');
  console.log('⚠️ Please change the password after first login!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

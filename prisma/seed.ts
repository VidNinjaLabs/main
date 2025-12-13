import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cloudclash.local' },
    update: {
      role: 'ADMIN',
      isPremium: true,
      subscription: {
        upsert: {
          create: {
            status: 'ACTIVE',
            expiresAt: new Date('9999-12-31T23:59:59Z'),
          },
          update: {
            status: 'ACTIVE',
            expiresAt: new Date('9999-12-31T23:59:59Z'),
          },
        },
      },
    },
    create: {
      email: 'admin@cloudclash.local',
      password: hashedPassword,
      role: 'ADMIN',
      isPremium: true,
      subscription: {
        create: {
          status: 'ACTIVE',
          expiresAt: new Date('9999-12-31T23:59:59Z'),
        },
      },
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

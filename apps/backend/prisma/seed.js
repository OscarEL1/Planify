import 'dotenv/config';
import bcrypt from 'bcrypt';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

const requiredVariables = [
  'DEFAULT_USER_NAME',
  'DEFAULT_USER_EMAIL',
  'DEFAULT_USER_PASSWORD',
];

function validateEnvironment() {
  const missingVariables = requiredVariables.filter((variable) => !process.env[variable]);

  if (missingVariables.length > 0) {
    throw new Error(`Faltan variables de entorno: ${missingVariables.join(', ')}`);
  }
}

async function main() {
  validateEnvironment();

  const name = process.env.DEFAULT_USER_NAME.trim();
  const email = process.env.DEFAULT_USER_EMAIL.trim().toLowerCase();
  const password = await bcrypt.hash(process.env.DEFAULT_USER_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      password,
      role: Role.MIEMBRO_EQUIPO,
    },
    create: {
      name,
      email,
      password,
      role: Role.MIEMBRO_EQUIPO,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  console.log('Usuario predeterminado disponible:', user);
}

main()
  .catch((error) => {
    console.error('No se pudo crear el usuario predeterminado:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

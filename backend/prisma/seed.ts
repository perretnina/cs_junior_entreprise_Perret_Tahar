import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { hash } from 'bcrypt';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL manquante');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  const rl = createInterface({ input, output });

  try {
    const email = (await rl.question('Email du Bureau : '))
      .trim()
      .toLowerCase();

    const password = await rl.question('Mot de passe : ');

    if (!email.includes('@') || password.length < 12) {
      throw new Error(
        'Email invalide ou mot de passe de moins de 12 caractères',
      );
    }

    const passwordHash = await hash(password, 12);

    // Mandat valable jusqu'à la fin du 31 décembre 2026.
    const bureauValidUntil = new Date('2026-12-31T23:59:59.999Z');

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash,
        isBureau: true,
        bureauValidUntil,
      },
      create: {
        email,
        passwordHash,
        isBureau: true,
        isIntervenant: false,
        bureauValidUntil,
      },
    });

    console.log(`Compte Bureau créé ou actualisé : ${user.email}`);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
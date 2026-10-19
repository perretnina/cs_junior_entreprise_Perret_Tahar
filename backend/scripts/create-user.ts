
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
    // 1. Informations du compte
    const email = (await rl.question('Email : '))
      .trim()
      .toLowerCase();

    const password = await rl.question('Mot de passe : ');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Adresse e-mail invalide');
    }

    if (password.length < 12) {
      throw new Error('Le mot de passe doit contenir au moins 12 caractères');
    }

    // 2. Choix du rôle
    console.log('\nRôle :');
    console.log('1. Bureau');
    console.log('2. Intervenant');
    console.log('3. Bureau + Intervenant');

    const choice = (await rl.question('Choix (1, 2 ou 3) : '))
      .trim();

    if (!['1', '2', '3'].includes(choice)) {
      throw new Error('Choix invalide');
    }

    const isBureau = choice === '1' || choice === '3';
    const isIntervenant = choice === '2' || choice === '3';

    // 3. Date d'expiration du mandat Bureau
    let bureauValidUntil: Date | null = null;

    if (isBureau) {
      const year = (
        await rl.question('Année de fin du mandat (ex : 2026) : ')
      ).trim();

      if (!/^\d{4}$/.test(year)) {
        throw new Error('Année invalide');
      }

      bureauValidUntil = new Date(`${year}-12-31T23:59:59.999Z`);

      if (
        Number.isNaN(bureauValidUntil.getTime()) ||
        bureauValidUntil <= new Date()
      ) {
        throw new Error('La date de fin du mandat doit être future');
      }
    }

    // 4. Informations de la fiche Intervenant
    let firstName = '';
    let lastName = '';
    let schoolEndDate: Date | null = null;

    if (isIntervenant) {
      const existingIntervenant = await prisma.intervenant.findUnique({
        where: { email },
      });

      if (existingIntervenant?.userId !== null &&
          existingIntervenant?.userId !== undefined) {
        throw new Error(
          'Cette fiche Intervenant est déjà associée à un compte',
        );
      }

      if (!existingIntervenant) {
        firstName = (await rl.question('Prénom : ')).trim();
        lastName = (await rl.question('Nom : ')).trim();

        const dateInput = (
          await rl.question(
            'Date de fin de scolarité (AAAA-MM-JJ) : ',
          )
        ).trim();

        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
          throw new Error('Format de date invalide');
        }

        schoolEndDate = new Date(`${dateInput}T00:00:00.000Z`);

        if (
          !firstName ||
          !lastName ||
          Number.isNaN(schoolEndDate.getTime()) ||
          schoolEndDate.toISOString().slice(0, 10) !== dateInput
        ) {
          throw new Error('Informations Intervenant invalides');
        }
      } else {
        console.log(
          `Fiche existante trouvée : ${existingIntervenant.firstName} ${existingIntervenant.lastName}`,
        );
      }
    }

    // 5. Vérifier que le compte n'existe pas déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('Un utilisateur possède déjà cet e-mail');
    }

    // 6. Création atomique du compte et de sa fiche
    const passwordHash = await hash(password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          isBureau,
          isIntervenant,
          bureauValidUntil,
        },
      });

      if (isIntervenant) {
        const existingIntervenant = await tx.intervenant.findUnique({
          where: { email },
        });

        if (existingIntervenant) {
          if (existingIntervenant.userId !== null) {
            throw new Error(
              'Cette fiche Intervenant est déjà associée à un compte',
            );
          }

          await tx.intervenant.update({
            where: { id: existingIntervenant.id },
            data: { userId: newUser.id },
          });
        } else {
          await tx.intervenant.create({
            data: {
              firstName,
              lastName,
              email,
              schoolEndDate: schoolEndDate!,
              userId: newUser.id,
            },
          });
        }
      }

      return newUser;
    });

    // 7. Confirmation
    console.log('\nUtilisateur créé avec succès');
    console.log(`Email : ${user.email}`);
    console.log(`Bureau : ${user.isBureau}`);
    console.log(`Intervenant : ${user.isIntervenant}`);

    if (user.isBureau) {
      console.log(
        `Mandat valide jusqu'au : ${user.bureauValidUntil?.toISOString()}`,
      );
    }

    if (user.isIntervenant) {
      console.log('Fiche Intervenant associée : oui');
    }
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { hash } from 'bcrypt';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const rl = createInterface({ input, output, terminal: input.isTTY && output.isTTY });

async function askNonEmpty(label: string): Promise<string> {
  while (true) {
    const value = (await rl.question(label)).trim();
    if (value) return value;
    console.log('Ce champ ne peut pas être vide.');
  }
}

async function askEmail(): Promise<string> {
  while (true) {
    const email = (await askNonEmpty('Email : ')).toLowerCase();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return email;
    console.log('Adresse e-mail invalide.');
  }
}

async function askPassword(): Promise<string> {
  while (true) {
    let password: string;
    if (input.isTTY && output.isTTY) {
      // Désactiver temporairement l'écho du terminal (Unix/macOS).
      // readline utilise normalement l'écho de l'entrée ; on masque via _writeToOutput.
      const originalWrite = (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput;
      const terminalRl = rl as unknown as { _writeToOutput: (s: string) => void };
      terminalRl._writeToOutput = (s: string) => {
        if (s.includes('Mot de passe : ')) output.write(s);
      };
      try {
        password = await rl.question('Mot de passe : ');
      } finally {
        terminalRl._writeToOutput = originalWrite;
        output.write('\n');
      }
    } else {
      console.log('Attention : saisie masquée indisponible sans terminal interactif.');
      password = await rl.question('Mot de passe : ');
    }
    if (password.length >= 12) return password;
    console.log('Le mot de passe doit contenir au moins 12 caractères.');
  }
}

async function askChoice(): Promise<'1' | '2' | '3'> {
  console.log('\nRôle :\n1. Bureau\n2. Intervenant\n3. Bureau + Intervenant');
  while (true) {
    const choice = (await rl.question('Choix (1, 2 ou 3) : ')).trim();
    if (choice === '1' || choice === '2' || choice === '3') return choice;
    console.log('Choix invalide.');
  }
}

async function askMandateEnd(): Promise<Date> {
  while (true) {
    const year = (await rl.question("Année d'expiration du mandat Bureau (AAAA) : ")).trim();
    if (!/^\d{4}$/.test(year)) {
      console.log('Saisis une année sur quatre chiffres.');
      continue;
    }
    const date = new Date(`${year}-12-31T23:59:59.999Z`);
    if (Number.isNaN(date.getTime()) || date <= new Date()) {
      console.log('La fin du mandat doit être dans le futur.');
      continue;
    }
    return date;
  }
}

async function askSchoolEnd(): Promise<Date> {
  while (true) {
    const value = (await rl.question('Date de fin de scolarité (AAAA-MM-JJ) : ')).trim();
    const date = new Date(`${value}T00:00:00.000Z`);
    if (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value) {
      return date;
    }
    console.log('Date invalide. Utilise le format AAAA-MM-JJ.');
  }
}

async function confirm(): Promise<boolean> {
  while (true) {
    const answer = (await rl.question('Confirmer la création ? (o/n) : ')).trim().toLowerCase();
    if (answer === 'o' || answer === 'oui') return true;
    if (answer === 'n' || answer === 'non') return false;
    console.log('Réponds par o ou n.');
  }
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL manquante');

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    console.log('\n=== CRÉATION D’UTILISATEUR ===\n');
    const email = await askEmail();
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error('Un utilisateur possède déjà cet e-mail');

    const password = await askPassword();
    const choice = await askChoice();
    const isBureau = choice === '1' || choice === '3';
    const isIntervenant = choice === '2' || choice === '3';
    const bureauValidUntil = isBureau ? await askMandateEnd() : null;

    let firstName = '';
    let lastName = '';
    let schoolEndDate: Date | null = null;
    let existingIntervenant = null;

    if (isIntervenant) {
      existingIntervenant = await prisma.intervenant.findUnique({ where: { email } });
      if (existingIntervenant?.userId != null) {
        throw new Error('Cette fiche Intervenant est déjà associée à un compte');
      }
      if (existingIntervenant) {
        firstName = existingIntervenant.firstName;
        lastName = existingIntervenant.lastName;
        schoolEndDate = existingIntervenant.schoolEndDate;
        console.log(`Fiche existante trouvée : ${firstName} ${lastName}`);
      } else {
        firstName = await askNonEmpty('Prénom : ');
        lastName = await askNonEmpty('Nom : ');
        schoolEndDate = await askSchoolEnd();
      }
      if (schoolEndDate && schoolEndDate.getTime() < Date.now()) {
        console.log('Attention : la date de fin de scolarité est déjà passée.');
      }
    }

    console.log('\n========== RÉCAPITULATIF ==========');
    console.log(`Email : ${email}`);
    console.log(`Rôle : ${choice === '1' ? 'Bureau' : choice === '2' ? 'Intervenant' : 'Bureau + Intervenant'}`);
    if (bureauValidUntil) console.log(`Mandat Bureau jusqu’au : ${bureauValidUntil.toISOString().slice(0, 10)}`);
    if (isIntervenant) {
      console.log(`Prénom : ${firstName}`);
      console.log(`Nom : ${lastName}`);
      console.log(`Fin de scolarité : ${schoolEndDate!.toISOString().slice(0, 10)}`);
      console.log(`Fiche Intervenant : ${existingIntervenant ? 'existante' : 'à créer'}`);
    }
    console.log('===================================\n');
    if (!(await confirm())) {
      console.log('Création annulée. Aucune donnée modifiée.');
      return;
    }

    const passwordHash = await hash(password, 12);
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { email, passwordHash, isBureau, isIntervenant, bureauValidUntil },
      });
      if (isIntervenant) {
        const intervenant = await tx.intervenant.findUnique({ where: { email } });
        if (intervenant) {
          if (intervenant.userId !== null) {
            throw new Error('Cette fiche Intervenant est déjà associée à un compte');
          }
          await tx.intervenant.update({ where: { id: intervenant.id }, data: { userId: newUser.id } });
        } else {
          await tx.intervenant.create({
            data: { firstName, lastName, email, schoolEndDate: schoolEndDate!, userId: newUser.id },
          });
        }
      }
      return newUser;
    });

    console.log('\nUtilisateur créé avec succès.');
    console.log(`Email : ${user.email}`);
    console.log(`Bureau : ${user.isBureau}`);
    console.log(`Intervenant : ${user.isIntervenant}`);
    if (user.isBureau) console.log(`Mandat valide jusqu’au : ${user.bureauValidUntil?.toISOString()}`);
    if (user.isIntervenant) console.log('Fiche Intervenant associée : oui');
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

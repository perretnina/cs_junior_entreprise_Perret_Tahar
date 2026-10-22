
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  Domaine,
  StatutProspect,
  StatutMission,
} from '../src/generated/prisma/client.js';
import { hash } from 'bcrypt';

const TEST_PREFIX = '[TEST JE] ';
const TEST_SUFFIX = '@test.local';

type Role = 'BUREAU' | 'INTERVENANT' | 'BUREAU_INTERVENANT';

type TestUser = {
  email: string;
  password: string;
  role: Role;
};

type TestIntervenant = {
  email: string;
  firstName: string;
  lastName: string;
  schoolEndDate: string;
};

type TestProspect = {
  key: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: StatutProspect;
  domain: Domaine;
};

type TestMission = {
  title: string;
  prospectKey: string;
  price: string;
  startDate: string;
  endDate: string;
  signedAt: string | null;
  status: StatutMission;
  domain: Domaine;
  intervenantEmails: string[];
};

async function readJson<T>(filename: string): Promise<T> {
  const url = new URL(`../test-data/${filename}`, import.meta.url);
  const content = await readFile(url, 'utf8');
  return JSON.parse(content) as T;
}

function toDate(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new Error(`Date invalide : ${value}`);
  }

  return date;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL manquante');
  }

  const url = new URL(connectionString);

  if (!['localhost', '127.0.0.1', '::1'].includes(url.hostname)) {
    throw new Error('Ce script est réservé à une base locale.');
  }

  const credentials = await readJson<{ users: TestUser[] }>(
    'test-credentials.local.json',
  );

  const intervenants = await readJson<TestIntervenant[]>(
    'intervenants.json',
  );

  const prospects = await readJson<TestProspect[]>(
    'prospects.json',
  );

  const missions = await readJson<TestMission[]>(
    'missions.json',
  );

  const users = credentials.users;

  // Vérifier les fichiers avant toute insertion.
  if (
    !Array.isArray(users) ||
    !Array.isArray(intervenants) ||
    !Array.isArray(prospects) ||
    !Array.isArray(missions)
  ) {
    throw new Error('Format des fichiers JSON invalide.');
  }

  const unique = (values: string[]) =>
    new Set(values).size === values.length;

  const userEmails = users.map((u) => u.email);
  const intervenantEmails = intervenants.map((i) => i.email);
  const prospectKeys = prospects.map((p) => p.key);
  const prospectNames = prospects.map((p) => p.name);
  const missionTitles = missions.map((m) => m.title);

  if (
    !unique(userEmails) ||
    !unique(intervenantEmails) ||
    !unique(prospectKeys) ||
    !unique(prospectNames) ||
    !unique(missionTitles)
  ) {
    throw new Error('Doublons détectés dans les fichiers JSON.');
  }

  for (const user of users) {
    if (
      !user.email.endsWith(TEST_SUFFIX) ||
      user.password.length < 12 ||
      !['BUREAU', 'INTERVENANT', 'BUREAU_INTERVENANT'].includes(
        user.role,
      )
    ) {
      throw new Error(`Compte de test invalide : ${user.email}`);
    }

    const hasIntervenantRole = user.role !== 'BUREAU';
    const hasProfile = intervenantEmails.includes(user.email);

    if (hasIntervenantRole !== hasProfile) {
      throw new Error(
        `Profil Intervenant incohérent : ${user.email}`,
      );
    }
  }

  for (const intervenant of intervenants) {
    if (
      !userEmails.includes(intervenant.email) ||
      !intervenant.firstName ||
      !intervenant.lastName
    ) {
      throw new Error(
        `Intervenant invalide : ${intervenant.email}`,
      );
    }

    toDate(intervenant.schoolEndDate);
  }

  for (const prospect of prospects) {
    if (
      !prospect.name.startsWith(TEST_PREFIX) ||
      !Object.values(StatutProspect).includes(prospect.status) ||
      !Object.values(Domaine).includes(prospect.domain)
    ) {
      throw new Error(`Prospect invalide : ${prospect.name}`);
    }
  }

  for (const mission of missions) {
    if (
      !mission.title.startsWith(TEST_PREFIX) ||
      !prospectKeys.includes(mission.prospectKey) ||
      !Object.values(StatutMission).includes(mission.status) ||
      !Object.values(Domaine).includes(mission.domain) ||
      !Array.isArray(mission.intervenantEmails) ||
      !unique(mission.intervenantEmails) ||
      mission.intervenantEmails.some(
        (email) => !intervenantEmails.includes(email),
      )
    ) {
      throw new Error(`Mission invalide : ${mission.title}`);
    }

    toDate(mission.startDate);
    toDate(mission.endDate);

    if (mission.signedAt) {
      toDate(mission.signedAt);
    }

    if (
      !Number.isFinite(Number(mission.price)) ||
      Number(mission.price) < 0
    ) {
      throw new Error(`Prix invalide : ${mission.title}`);
    }
  }

  // Préparer les mots de passe hachés.
  const preparedUsers = await Promise.all(
    users.map(async (user) => ({
      ...user,
      passwordHash: await hash(user.password, 12),
    })),
  );

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    // Toutes les écritures sont atomiques.
    await prisma.$transaction(
      async (tx) => {
        // Vérifier les conflits avec les données existantes.
        const existingUsers = await tx.user.findMany({
          where: { email: { in: userEmails } },
        });

        const existingIntervenants = await tx.intervenant.findMany({
          where: { email: { in: intervenantEmails } },
        });

        const existingProspects = await tx.prospect.findMany({
          where: { name: { in: prospectNames } },
        });

        const existingMissions = await tx.mission.findMany({
          where: { title: { in: missionTitles } },
        });

        if (
          existingUsers.length ||
          existingIntervenants.length ||
          existingProspects.length ||
          existingMissions.length
        ) {
          throw new Error(
            'Des données de test existent déjà. ' +
            'Lance d’abord data:delete-test.',
          );
        }

        const userIds = new Map<string, number>();

        // 1. Comptes utilisateurs
        for (const user of preparedUsers) {
          const isBureau = user.role !== 'INTERVENANT';
          const isIntervenant = user.role !== 'BUREAU';

          const created = await tx.user.create({
            data: {
              email: user.email,
              passwordHash: user.passwordHash,
              isBureau,
              isIntervenant,
              bureauValidUntil: isBureau
                ? new Date('2027-12-31T23:59:59.999Z')
                : null,
            },
          });

          userIds.set(user.email, created.id);
        }

        // 2. Fiches Intervenant
        const intervenantIds = new Map<string, number>();

        for (const intervenant of intervenants) {
          const userId = userIds.get(intervenant.email);

          if (userId === undefined) {
            throw new Error('Utilisateur introuvable.');
          }

          const created = await tx.intervenant.create({
            data: {
              firstName: intervenant.firstName,
              lastName: intervenant.lastName,
              email: intervenant.email,
              schoolEndDate: toDate(intervenant.schoolEndDate),
              userId,
            },
          });

          intervenantIds.set(intervenant.email, created.id);
        }

        // 3. Prospects
        const prospectIds = new Map<string, number>();

        for (const prospect of prospects) {
          const created = await tx.prospect.create({
            data: {
              name: prospect.name,
              email: prospect.email,
              phone: prospect.phone,
              status: prospect.status,
              domain: prospect.domain,
            },
          });

          prospectIds.set(prospect.key, created.id);
        }

        // 4. Missions et affectations
        for (const mission of missions) {
          const prospectId = prospectIds.get(mission.prospectKey);

          if (prospectId === undefined) {
            throw new Error('Prospect introuvable.');
          }

          await tx.mission.create({
            data: {
              title: mission.title,
              price: mission.price,
              startDate: toDate(mission.startDate),
              endDate: toDate(mission.endDate),
              signedAt: mission.signedAt
                ? toDate(mission.signedAt)
                : null,
              status: mission.status,
              domain: mission.domain,
              prospectId,
              intervenants: {
                create: mission.intervenantEmails.map((email) => {
                  const intervenantId = intervenantIds.get(email);

                  if (intervenantId === undefined) {
                    throw new Error(
                      `Intervenant introuvable : ${email}`,
                    );
                  }

                  return { intervenantId };
                }),
              },
            },
          });
        }
      },
      { timeout: 30000 },
    );

    console.log('\nDonnées de test créées :');
    console.log(`- ${users.length} utilisateurs`);
    console.log(`- ${intervenants.length} intervenants`);
    console.log(`- ${prospects.length} prospects`);
    console.log(`- ${missions.length} missions`);
    console.log('\nCréation terminée.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

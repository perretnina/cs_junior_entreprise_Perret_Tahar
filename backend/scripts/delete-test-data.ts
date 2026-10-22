
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

type Credentials = {
  users: { email: string }[];
};

type ProspectData = {
  name: string;
};

type MissionData = {
  title: string;
};

async function readJson<T>(filename: string): Promise<T> {
  const url = new URL(`../test-data/${filename}`, import.meta.url);
  return JSON.parse(await readFile(url, 'utf8')) as T;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL manquante');
  }

  const url = new URL(connectionString);

  if (!['localhost', '127.0.0.1', '::1'].includes(url.hostname)) {
    throw new Error('Suppression autorisée uniquement en local.');
  }

  const credentials = await readJson<Credentials>(
    'test-credentials.local.json',
  );

  const intervenantData = await readJson<{ email: string }[]>(
    'intervenants.json',
  );

  const prospectData = await readJson<ProspectData[]>(
    'prospects.json',
  );

  const missionData = await readJson<MissionData[]>(
    'missions.json',
  );

  const userEmails = credentials.users.map((u) => u.email);
  const intervenantEmails = intervenantData.map((i) => i.email);
  const prospectNames = prospectData.map((p) => p.name);
  const missionTitles = missionData.map((m) => m.title);

  if (
    userEmails.some((e) => !e.endsWith('@test.local')) ||
    intervenantEmails.some((e) => !e.endsWith('@test.local')) ||
    prospectNames.some((n) => !n.startsWith('[TEST JE] ')) ||
    missionTitles.some((n) => !n.startsWith('[TEST JE] '))
  ) {
    throw new Error('Marqueurs de données de test invalides.');
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  const rl = createInterface({ input, output });

  try {
    const [users, intervenants, prospects, missions] =
      await Promise.all([
        prisma.user.findMany({
          where: { email: { in: userEmails } },
          select: { id: true, email: true },
        }),
        prisma.intervenant.findMany({
          where: { email: { in: intervenantEmails } },
          select: { id: true, email: true, userId: true },
        }),
        prisma.prospect.findMany({
          where: { name: { in: prospectNames } },
          select: { id: true, name: true },
        }),
        prisma.mission.findMany({
          where: { title: { in: missionTitles } },
          select: { id: true, title: true, prospectId: true },
        }),
      ]);

    console.log('\nDonnées trouvées :');
    console.log(`- ${users.length} comptes`);
    console.log(`- ${intervenants.length} intervenants`);
    console.log(`- ${prospects.length} prospects`);
    console.log(`- ${missions.length} missions`);

    if (
      users.length +
      intervenants.length +
      prospects.length +
      missions.length === 0
    ) {
      console.log('Aucune donnée à supprimer.');
      return;
    }

    const confirmation = await rl.question(
      '\nTape SUPPRIMER pour confirmer : ',
    );

    if (confirmation !== 'SUPPRIMER') {
      console.log('Opération annulée.');
      return;
    }

    const result = await prisma.$transaction(
      async (tx) => {
        // Recharger les enregistrements dans la transaction.
        const selectedUsers = await tx.user.findMany({
          where: { email: { in: userEmails } },
          select: { id: true },
        });

        const selectedIntervenants = await tx.intervenant.findMany({
          where: { email: { in: intervenantEmails } },
          select: { id: true, userId: true },
        });

        const selectedProspects = await tx.prospect.findMany({
          where: { name: { in: prospectNames } },
          select: { id: true },
        });

        const selectedMissions = await tx.mission.findMany({
          where: { title: { in: missionTitles } },
          select: { id: true, prospectId: true },
        });

        const userIds = selectedUsers.map((u) => u.id);
        const intervenantIds = selectedIntervenants.map((i) => i.id);
        const prospectIds = selectedProspects.map((p) => p.id);
        const missionIds = selectedMissions.map((m) => m.id);

        // Empêcher la suppression de comptes auxquels des
        // fiches Intervenant extérieures seraient associées.
        const externalProfiles = await tx.intervenant.count({
          where: {
            userId: { in: userIds },
            id: { notIn: intervenantIds },
          },
        });

        // Empêcher la suppression des intervenants liés
        // à des missions extérieures au jeu de test.
        const externalAssignments =
          await tx.missionIntervenant.count({
            where: {
              intervenantId: { in: intervenantIds },
              missionId: { notIn: missionIds },
            },
          });

        // Empêcher la suppression de prospects associés
        // à des missions extérieures au jeu de test.
        const externalMissions = await tx.mission.count({
          where: {
            prospectId: { in: prospectIds },
            id: { notIn: missionIds },
          },
        });

        // Vérifier que les missions ciblées n'appartiennent
        // pas à des prospects extérieurs au jeu de test.
        const foreignMissions = selectedMissions.some(
          (m) => !prospectIds.includes(m.prospectId),
        );

        // Vérifier que les fiches ciblées ne sont pas liées
        // à des comptes extérieurs au jeu de test.
        const foreignProfiles = selectedIntervenants.some(
          (i) => i.userId !== null && !userIds.includes(i.userId),
        );

        if (
          externalProfiles ||
          externalAssignments ||
          externalMissions ||
          foreignMissions ||
          foreignProfiles
        ) {
          throw new Error(
            'Suppression annulée : certaines données sont ' +
            'liées à des enregistrements extérieurs au jeu de test.',
          );
        }

        // 1. Associations missions-intervenants.
        const links = await tx.missionIntervenant.deleteMany({
          where: {
            OR: [
              { missionId: { in: missionIds } },
              { intervenantId: { in: intervenantIds } },
            ],
          },
        });

        // 2. Missions.
        const deletedMissions = await tx.mission.deleteMany({
          where: { id: { in: missionIds } },
        });

        // 3. Prospects.
        const deletedProspects = await tx.prospect.deleteMany({
          where: { id: { in: prospectIds } },
        });

        // 4. Intervenants.
        const deletedIntervenants = await tx.intervenant.deleteMany({
          where: { id: { in: intervenantIds } },
        });

        // 5. Comptes.
        const deletedUsers = await tx.user.deleteMany({
          where: { id: { in: userIds } },
        });

        return {
          links: links.count,
          missions: deletedMissions.count,
          prospects: deletedProspects.count,
          intervenants: deletedIntervenants.count,
          users: deletedUsers.count,
        };
      },
      { timeout: 30000 },
    );

    console.log('\nSuppression terminée :');
    console.log(`- ${result.users} comptes`);
    console.log(`- ${result.intervenants} intervenants`);
    console.log(`- ${result.prospects} prospects`);
    console.log(`- ${result.missions} missions`);
    console.log(`- ${result.links} affectations`);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

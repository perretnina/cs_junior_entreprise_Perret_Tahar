import 'dotenv/config';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { Test } from '@nestjs/testing';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { hash } from 'bcrypt';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('API + Prisma + PostgreSQL (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let bureauToken: string;
  let intervenantToken: string;

  let bureauId: number;
  let intervenantUserId: number;
  let intervenantId: number;
  let prospectId: number;
  let missionId: number;

  const suffix = `integration-${process.pid}-${Date.now()}`;

  const bureauEmail = `bureau-${suffix}@example.test`;
  const intervenantEmail = `intervenant-${suffix}@example.test`;

  const password = 'IntegrationTestPassword_2026!';

  beforeAll(async () => {
    // Utilisation de la base PostgreSQL actuelle
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL est manquante dans le fichier .env');
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET est manquante dans le fichier .env');
    }

    // Initialisation de NestJS
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = app.get(PrismaService);

    // Création des utilisateurs temporaires
    const passwordHash = await hash(password, 4);

    const bureau = await prisma.user.create({
      data: {
        email: bureauEmail,
        passwordHash,
        isBureau: true,
        bureauValidUntil: new Date('2099-12-31T23:59:59.999Z'),
      },
    });

    bureauId = bureau.id;

    const intervenant = await prisma.user.create({
      data: {
        email: intervenantEmail,
        passwordHash,
        isIntervenant: true,
        intervenant: {
          create: {
            firstName: 'Test',
            lastName: 'Integration',
            email: intervenantEmail,
            schoolEndDate: new Date('2099-09-30T00:00:00.000Z'),
          },
        },
      },
      include: {
        intervenant: true,
      },
    });

    intervenantUserId = intervenant.id;
    intervenantId = intervenant.intervenant!.id;

    // Connexion Bureau
    const bureauLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: bureauEmail,
        password,
        activeSpace: 'bureau',
      })
      .expect(201);

    bureauToken = bureauLogin.body.accessToken;

    // Connexion Intervenant
    const intervenantLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: intervenantEmail,
        password,
        activeSpace: 'intervenant',
      })
      .expect(201);

    intervenantToken = intervenantLogin.body.accessToken;
  });

  afterAll(async () => {
    // Suppression uniquement des données créées par les tests
    if (prisma) {
      if (missionId) {
        await prisma.missionIntervenant.deleteMany({
          where: { missionId },
        });

        await prisma.mission.deleteMany({
          where: { id: missionId },
        });
      }

      if (prospectId) {
        await prisma.prospect.deleteMany({
          where: { id: prospectId },
        });
      }

      if (intervenantId) {
        await prisma.intervenant.deleteMany({
          where: { id: intervenantId },
        });
      }

      if (intervenantUserId) {
        await prisma.user.deleteMany({
          where: { id: intervenantUserId },
        });
      }

      if (bureauId) {
        await prisma.user.deleteMany({
          where: { id: bureauId },
        });
      }
    }

    if (app) {
      await app.close();
    }
  });

  // ============================================================
  // AUTHENTIFICATION
  // ============================================================

  it('refuse les accès sans token et les tokens invalides', async () => {
    await request(app.getHttpServer())
      .get('/missions')
      .expect(401);

    await request(app.getHttpServer())
      .get('/missions')
      .set('Authorization', 'Bearer invalid')
      .expect(401);
  });

  it('authentifie le Bureau et interdit les routes Bureau à un intervenant', async () => {
    const me = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${bureauToken}`)
      .expect(200);

    expect(me.body.email).toBe(bureauEmail);

    await request(app.getHttpServer())
      .get('/prospects')
      .set('Authorization', `Bearer ${intervenantToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .get('/missions')
      .set('Authorization', `Bearer ${intervenantToken}`)
      .expect(403);
  });

  // ============================================================
  // PROSPECTION
  // ============================================================

  it('crée et modifie un prospect en base via HTTP', async () => {
    const created = await request(app.getHttpServer())
      .post('/prospects')
      .set('Authorization', `Bearer ${bureauToken}`)
      .send({
        name: `Client ${suffix}`,
        domain: 'INFORMATIQUE',
      })
      .expect(201);

    prospectId = created.body.id;

    const updated = await request(app.getHttpServer())
      .patch(`/prospects/${prospectId}`)
      .set('Authorization', `Bearer ${bureauToken}`)
      .send({
        status: 'A_RECONTACTER',
      })
      .expect(200);

    expect(updated.body.status).toBe('A_RECONTACTER');

    const prospectInDatabase = await prisma.prospect.findUnique({
      where: { id: prospectId },
    });

    expect(prospectInDatabase?.status).toBe('A_RECONTACTER');
  });

  // ============================================================
  // MISSIONS
  // ============================================================

  it('crée une mission affectée et protège les montants côté intervenant', async () => {
    const created = await request(app.getHttpServer())
      .post('/missions')
      .set('Authorization', `Bearer ${bureauToken}`)
      .send({
        title: `Mission ${suffix}`,
        price: 1500,
        startDate: '2026-11-01',
        endDate: '2026-12-01',
        signedAt: '2026-10-25',
        status: 'SIGNE',
        domain: 'INFORMATIQUE',
        prospectId,
        intervenantIds: [intervenantId],
      })
      .expect(201);

    missionId = created.body.id;

    expect(Number(created.body.price)).toBe(1500);

    // L'intervenant consulte uniquement ses missions
    const mine = await request(app.getHttpServer())
      .get('/missions/mine')
      .set('Authorization', `Bearer ${intervenantToken}`)
      .expect(200);

    const assigned = mine.body.find(
      (m: { id: number }) => m.id === missionId,
    );

    expect(assigned).toBeDefined();

    // Les données financières ne doivent pas être exposées
    expect(assigned).not.toHaveProperty('price');
    expect(assigned).not.toHaveProperty('signedAt');

    // Le Bureau ne peut pas accéder à l'espace Intervenant
    await request(app.getHttpServer())
      .get('/missions/mine')
      .set('Authorization', `Bearer ${bureauToken}`)
      .expect(403);
  });

  it('rejette une mission dont la fin dépasse la scolarité', async () => {
    await request(app.getHttpServer())
      .post('/missions')
      .set('Authorization', `Bearer ${bureauToken}`)
      .send({
        title: `Mission invalide ${suffix}`,
        price: 100,
        startDate: '2099-09-01',
        endDate: '2099-10-01',
        status: 'DEVIS',
        domain: 'INFORMATIQUE',
        prospectId,
        intervenantIds: [intervenantId],
      })
      .expect(400);
  });

  // ============================================================
  // KPI
  // ============================================================

  it('expose les KPI au Bureau uniquement', async () => {
    const result = await request(app.getHttpServer())
      .get('/kpi?startDate=2026-01-01&endDate=2026-12-31')
      .set('Authorization', `Bearer ${bureauToken}`)
      .expect(200);

    expect(result.body).toHaveProperty('totalMissions');

    await request(app.getHttpServer())
      .get('/kpi')
      .set('Authorization', `Bearer ${intervenantToken}`)
      .expect(403);
  });

  // ============================================================
  // CONTRAINTES MÉTIER
  // ============================================================

  it('empêche de supprimer un prospect associé à une mission', async () => {
    await request(app.getHttpServer())
      .delete(`/prospects/${prospectId}`)
      .set('Authorization', `Bearer ${bureauToken}`)
      .expect(400);
  });
});
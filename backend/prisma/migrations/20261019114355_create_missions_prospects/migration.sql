-- CreateEnum
CREATE TYPE "Domaine" AS ENUM ('INFORMATIQUE', 'MICROELECTRONIQUE');

-- CreateEnum
CREATE TYPE "StatutProspect" AS ENUM ('PAS_ENCORE_CONTACTE', 'A_RECONTACTER', 'PAS_INTERESSE', 'EN_COURS', 'A_FIDELISER');

-- CreateEnum
CREATE TYPE "StatutMission" AS ENUM ('DEVIS', 'SIGNE', 'FACTURE_ACOMPTE_EMISE', 'FACTURE_ACOMPTE_PAYEE', 'EN_COURS', 'FACTURE_SOLDE_EMISE', 'FACTURE_SOLDE_PAYEE', 'TERMINEE');

-- CreateTable
CREATE TABLE "Prospect" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" "StatutProspect" NOT NULL DEFAULT 'PAS_ENCORE_CONTACTE',
    "domain" "Domaine" NOT NULL,

    CONSTRAINT "Prospect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mission" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "signedAt" DATE,
    "status" "StatutMission" NOT NULL DEFAULT 'DEVIS',
    "domain" "Domaine" NOT NULL,
    "prospectId" INTEGER NOT NULL,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionIntervenant" (
    "missionId" INTEGER NOT NULL,
    "intervenantId" INTEGER NOT NULL,

    CONSTRAINT "MissionIntervenant_pkey" PRIMARY KEY ("missionId","intervenantId")
);

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionIntervenant" ADD CONSTRAINT "MissionIntervenant_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "Mission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionIntervenant" ADD CONSTRAINT "MissionIntervenant_intervenantId_fkey" FOREIGN KEY ("intervenantId") REFERENCES "Intervenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

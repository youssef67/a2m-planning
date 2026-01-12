-- CreateEnum
CREATE TYPE "StatutChantier" AS ENUM ('ACTIF', 'EN_PAUSE', 'TERMINE');

-- CreateTable
CREATE TABLE "chantiers" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(200) NOT NULL,
    "statut" "StatutChantier" NOT NULL DEFAULT 'ACTIF',
    "raisonPause" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chantiers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chantiers_statut_idx" ON "chantiers"("statut");

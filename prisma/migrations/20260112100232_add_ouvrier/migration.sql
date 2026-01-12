-- CreateEnum
CREATE TYPE "TypeOuvrier" AS ENUM ('SALARIE', 'SOUS_TRAITANT');

-- CreateEnum
CREATE TYPE "StatutOuvrier" AS ENUM ('ACTIF', 'ARCHIVE');

-- CreateTable
CREATE TABLE "ouvriers" (
    "id" SERIAL NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "prenom" VARCHAR(100) NOT NULL,
    "type" "TypeOuvrier" NOT NULL,
    "statut" "StatutOuvrier" NOT NULL DEFAULT 'ACTIF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ouvriers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ouvriers_statut_idx" ON "ouvriers"("statut");

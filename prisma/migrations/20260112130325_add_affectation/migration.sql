-- CreateEnum
CREATE TYPE "Periode" AS ENUM ('JOURNEE', 'MATIN', 'APRES_MIDI');

-- CreateEnum
CREATE TYPE "StatutPresence" AS ENUM ('TRAVAIL', 'CONGE_PAYE', 'MALADIE', 'ABSENCE', 'FORMATION');

-- CreateTable
CREATE TABLE "affectations" (
    "id" SERIAL NOT NULL,
    "ouvrierId" INTEGER NOT NULL,
    "chantierId" INTEGER,
    "date" DATE NOT NULL,
    "periode" "Periode" NOT NULL,
    "statutPresence" "StatutPresence" NOT NULL DEFAULT 'TRAVAIL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affectations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "affectations_date_idx" ON "affectations"("date");

-- CreateIndex
CREATE INDEX "affectations_chantierId_date_idx" ON "affectations"("chantierId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "affectations_ouvrierId_date_periode_key" ON "affectations"("ouvrierId", "date", "periode");

-- AddForeignKey
ALTER TABLE "affectations" ADD CONSTRAINT "affectations_ouvrierId_fkey" FOREIGN KEY ("ouvrierId") REFERENCES "ouvriers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affectations" ADD CONSTRAINT "affectations_chantierId_fkey" FOREIGN KEY ("chantierId") REFERENCES "chantiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

'use server'

import { revalidateTag, revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { creerAffectationSchema } from '@/schemas/affectation'
import { indisponibiliteSchema, modifierIndisponibiliteSchema } from '@/schemas/indisponibilite'
import { logModification } from '@/lib/historique'
import { detecterConflitPeriode, type ConflitPeriode } from '@/lib/affectations'
import type { Periode, StatutPresence } from '@/generated/prisma/client'

export async function creerAffectation(formData: FormData) {
  const authResult = await requireAuth()
  if ('error' in authResult) return { error: authResult.error }

  const ouvrierIdRaw = formData.get('ouvrierId')
  const ouvrierId = ouvrierIdRaw ? parseInt(ouvrierIdRaw.toString(), 10) : NaN
  const chantierIdRaw = formData.get('chantierId')
  const chantierId = chantierIdRaw ? parseInt(chantierIdRaw.toString(), 10) : NaN
  const date = formData.get('date')?.toString() ?? ''
  const periode = formData.get('periode')?.toString() ?? ''

  const validation = creerAffectationSchema.safeParse({
    ouvrierId,
    chantierId,
    date,
    periode
  })

  if (!validation.success) {
    const firstError = validation.error.issues[0]
    return { error: firstError?.message ?? 'Données invalides' }
  }

  // Validate ouvrierId exists and is ACTIF
  const ouvrier = await prisma.ouvrier.findUnique({
    where: { id: validation.data.ouvrierId }
  })

  if (!ouvrier) {
    return { error: "L'ouvrier n'existe pas" }
  }

  if (ouvrier.statut !== 'ACTIF') {
    return { error: "L'ouvrier doit être actif pour être affecté" }
  }

  // Validate chantierId exists and is not TERMINE
  const chantier = await prisma.chantier.findUnique({
    where: { id: validation.data.chantierId }
  })

  if (!chantier) {
    return { error: "Le chantier n'existe pas" }
  }

  if (chantier.statut === 'TERMINE') {
    return { error: 'Impossible d\'affecter sur un chantier terminé' }
  }

  try {
    const affectation = await prisma.affectation.create({
      data: {
        ouvrierId: validation.data.ouvrierId,
        chantierId: validation.data.chantierId,
        date: new Date(validation.data.date),
        periode: validation.data.periode as Periode
      }
    })

    revalidateTag('chantiers', 'max')
    revalidateTag('affectations', 'max')
    return { success: true, affectation }
  } catch (error) {
    // Handle unique constraint violation (duplicate affectation)
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return { error: 'Cet ouvrier a déjà une affectation pour cette date et période' }
    }
    return { error: "Erreur lors de la création de l'affectation" }
  }
}

export async function creerIndisponibilite(formData: FormData) {
  const authResult = await requireAuth()
  if ('error' in authResult) return { error: authResult.error }

  const ouvrierIdRaw = formData.get('ouvrierId')
  const ouvrierId = ouvrierIdRaw ? parseInt(ouvrierIdRaw.toString(), 10) : NaN
  const date = formData.get('date')?.toString() ?? ''
  const periode = formData.get('periode')?.toString() ?? ''
  const statutPresence = formData.get('statutPresence')?.toString() ?? ''

  const validation = indisponibiliteSchema.safeParse({
    ouvrierId,
    date,
    periode,
    statutPresence
  })

  if (!validation.success) {
    const firstError = validation.error.issues[0]
    return { error: firstError?.message ?? 'Données invalides' }
  }

  // Validate ouvrierId exists and is ACTIF
  const ouvrier = await prisma.ouvrier.findUnique({
    where: { id: validation.data.ouvrierId }
  })

  if (!ouvrier) {
    return { error: "L'ouvrier n'existe pas" }
  }

  if (ouvrier.statut !== 'ACTIF') {
    return { error: "L'ouvrier doit être actif" }
  }

  try {
    const affectation = await prisma.affectation.create({
      data: {
        ouvrierId: validation.data.ouvrierId,
        chantierId: null,
        date: new Date(validation.data.date),
        periode: validation.data.periode as Periode,
        statutPresence: validation.data.statutPresence as StatutPresence
      }
    })

    await logModification('CREATE', 'Affectation', affectation.id, null, affectation)
    revalidateTag('affectations', 'max')
    return { success: true, affectation }
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return { error: 'Cet ouvrier a déjà une affectation pour cette date et période' }
    }
    return { error: "Erreur lors de la création de l'indisponibilité" }
  }
}

export async function modifierIndisponibilite(id: number, formData: FormData) {
  const authResult = await requireAuth()
  if ('error' in authResult) return { error: authResult.error }

  const periode = formData.get('periode')?.toString() ?? ''
  const statutPresence = formData.get('statutPresence')?.toString() ?? ''

  // Validate fields with Zod schema
  const validation = modifierIndisponibiliteSchema.safeParse({
    periode,
    statutPresence
  })

  if (!validation.success) {
    const firstError = validation.error.issues[0]
    return { error: firstError?.message ?? 'Données invalides' }
  }

  // Validate affectation exists and is an indisponibilité
  const existing = await prisma.affectation.findUnique({
    where: { id }
  })

  if (!existing) {
    return { error: "L'indisponibilité n'existe pas" }
  }

  if (existing.chantierId !== null) {
    return { error: "Cette affectation n'est pas une indisponibilité" }
  }

  try {
    const updated = await prisma.affectation.update({
      where: { id },
      data: {
        periode: validation.data.periode as Periode,
        statutPresence: validation.data.statutPresence as StatutPresence
      }
    })

    await logModification('UPDATE', 'Affectation', id, existing, updated)
    revalidateTag('affectations', 'max')
    return { success: true, affectation: updated }
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return { error: 'Conflit avec une affectation existante pour cette période' }
    }
    return { error: "Erreur lors de la modification de l'indisponibilité" }
  }
}

export async function supprimerIndisponibilite(id: number) {
  const authResult = await requireAuth()
  if ('error' in authResult) return { error: authResult.error }

  // Validate affectation exists and is an indisponibilité
  const existing = await prisma.affectation.findUnique({
    where: { id }
  })

  if (!existing) {
    return { error: "L'indisponibilité n'existe pas" }
  }

  if (existing.chantierId !== null) {
    return { error: "Cette affectation n'est pas une indisponibilité" }
  }

  try {
    await prisma.affectation.delete({
      where: { id }
    })

    await logModification('DELETE', 'Affectation', id, existing, null)
    revalidateTag('affectations', 'max')
    return { success: true }
  } catch {
    return { error: "Erreur lors de la suppression de l'indisponibilité" }
  }
}

export async function reassignerAffectation(affectationId: number, nouveauChantierId: number) {
  const authResult = await requireAuth()
  if ('error' in authResult) return { error: authResult.error }

  // Validate affectation exists and is not an indisponibilité
  const existing = await prisma.affectation.findUnique({
    where: { id: affectationId }
  })

  if (!existing) {
    return { error: "L'affectation n'existe pas" }
  }

  if (existing.chantierId === null) {
    return { error: 'Impossible de réaffecter une indisponibilité' }
  }

  // Validate new chantier exists and is not TERMINE
  const chantier = await prisma.chantier.findUnique({
    where: { id: nouveauChantierId }
  })

  if (!chantier) {
    return { error: "Le chantier n'existe pas" }
  }

  if (chantier.statut === 'TERMINE') {
    return { error: 'Impossible de réaffecter vers un chantier terminé' }
  }

  const updated = await prisma.affectation.update({
    where: { id: affectationId },
    data: { chantierId: nouveauChantierId }
  })

  await logModification('UPDATE', 'Affectation', affectationId, existing, updated)
  revalidateTag('affectations', 'max')
  return { success: true, affectation: updated }
}

export async function modifierPeriodeAffectation(affectationId: number, nouvellePeriode: Periode) {
  const authResult = await requireAuth()
  if ('error' in authResult) return { error: authResult.error }

  // Validate affectation exists
  const existing = await prisma.affectation.findUnique({
    where: { id: affectationId }
  })

  if (!existing) {
    return { error: "L'affectation n'existe pas" }
  }

  // Check for unique constraint violation (same ouvrier, date, new periode)
  const conflict = await prisma.affectation.findFirst({
    where: {
      ouvrierId: existing.ouvrierId,
      date: existing.date,
      periode: nouvellePeriode,
      id: { not: affectationId }
    }
  })

  if (conflict) {
    return { error: 'Une affectation existe déjà pour cette période' }
  }

  // Check if target period is blocked by an indisponibilité
  const indisponibilite = await prisma.affectation.findFirst({
    where: {
      ouvrierId: existing.ouvrierId,
      date: existing.date,
      chantierId: null,
      statutPresence: { not: 'TRAVAIL' },
      OR: [
        { periode: 'JOURNEE' },
        { periode: nouvellePeriode }
      ],
      id: { not: affectationId }
    }
  })

  if (indisponibilite) {
    return { error: "L'ouvrier est indisponible pour cette période" }
  }

  try {
    const updated = await prisma.affectation.update({
      where: { id: affectationId },
      data: { periode: nouvellePeriode }
    })

    await logModification('UPDATE', 'Affectation', affectationId, existing, updated)
    revalidateTag('affectations', 'max')
    return { success: true, affectation: updated }
  } catch (error) {
    if (
      error instanceof Error &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return { error: 'Conflit avec une affectation existante pour cette période' }
    }
    return { error: 'Erreur lors de la modification de la période' }
  }
}

export async function supprimerAffectation(id: number) {
  const authResult = await requireAuth()
  if ('error' in authResult) return { error: authResult.error }

  // Validate affectation exists and is a work assignment (chantierId is not null)
  const existing = await prisma.affectation.findUnique({
    where: { id }
  })

  if (!existing) {
    return { error: "L'affectation n'existe pas" }
  }

  if (existing.chantierId === null) {
    return { error: "Utilisez supprimerIndisponibilite pour les indisponibilités" }
  }

  try {
    await prisma.affectation.delete({
      where: { id }
    })

    await logModification('DELETE', 'Affectation', id, existing, null)
    revalidateTag('affectations', 'max')
    revalidatePath('/planning/ouvrier')
    revalidatePath('/planning/chantier')
    return { success: true }
  } catch {
    return { error: "Erreur lors de la suppression de l'affectation" }
  }
}

export async function convertirEnIndisponibilite(affectationId: number, statutPresence: StatutPresence) {
  const authResult = await requireAuth()
  if ('error' in authResult) return { error: authResult.error }

  // Validate statutPresence is a valid indisponibilité type
  const validStatuts: StatutPresence[] = ['CONGE_PAYE', 'MALADIE', 'ABSENCE', 'FORMATION']
  if (!validStatuts.includes(statutPresence)) {
    return { error: 'Statut de présence invalide' }
  }

  // Validate affectation exists and is a work assignment
  const existing = await prisma.affectation.findUnique({
    where: { id: affectationId }
  })

  if (!existing) {
    return { error: "L'affectation n'existe pas" }
  }

  if (existing.chantierId === null) {
    return { error: "Cette affectation est déjà une indisponibilité" }
  }

  const updated = await prisma.affectation.update({
    where: { id: affectationId },
    data: {
      chantierId: null,
      statutPresence
    }
  })

  await logModification('UPDATE', 'Affectation', affectationId, existing, updated)
  revalidateTag('affectations', 'max')
  return { success: true, affectation: updated }
}

export async function verifierConflitAffectation(
  ouvrierId: number,
  date: string,
  periode: Periode
): Promise<{ conflit: ConflitPeriode | null }> {
  const authResult = await requireAuth()
  if ('error' in authResult) return { conflit: null }

  const conflit = await detecterConflitPeriode(ouvrierId, date, periode)
  return { conflit }
}

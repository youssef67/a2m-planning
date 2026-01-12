'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { creerAffectationSchema } from '@/schemas/affectation'
import type { Periode } from '@/generated/prisma/client'

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

    revalidatePath('/chantiers')
    revalidatePath('/planning')
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

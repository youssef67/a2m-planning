'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import {
  creerChantierSchema,
  modifierChantierSchema,
  changerStatutChantierSchema
} from '@/schemas/chantier'
import type { StatutChantier } from '@/generated/prisma/client'

export async function creerChantier(formData: FormData) {
  const authResult = await requireAuth()
  if ('error' in authResult) return { error: authResult.error }

  const validation = creerChantierSchema.safeParse({
    nom: formData.get('nom')
  })

  if (!validation.success) {
    const firstError = validation.error.issues[0]
    return { error: firstError?.message ?? 'Données invalides' }
  }

  try {
    const chantier = await prisma.chantier.create({
      data: validation.data
    })

    revalidatePath('/chantiers')
    return { success: true, chantier }
  } catch {
    return { error: 'Erreur lors de la création du chantier' }
  }
}

export async function modifierChantier(formData: FormData) {
  const authResult = await requireAuth()
  if ('error' in authResult) return { error: authResult.error }

  const idRaw = formData.get('id')
  const id = idRaw ? parseInt(idRaw.toString(), 10) : NaN

  const validation = modifierChantierSchema.safeParse({
    id,
    nom: formData.get('nom')
  })

  if (!validation.success) {
    const firstError = validation.error.issues[0]
    return { error: firstError?.message ?? 'Données invalides' }
  }

  try {
    await prisma.chantier.update({
      where: { id: validation.data.id },
      data: { nom: validation.data.nom }
    })

    revalidatePath('/chantiers')
    return { success: true }
  } catch {
    return { error: 'Erreur lors de la modification du chantier' }
  }
}

export async function changerStatutChantier(formData: FormData) {
  const authResult = await requireAuth()
  if ('error' in authResult) return { error: authResult.error }

  const idRaw = formData.get('id')
  const id = idRaw ? parseInt(idRaw.toString(), 10) : NaN
  const statut = formData.get('statut') as StatutChantier
  const raisonPause = formData.get('raisonPause')?.toString() || undefined

  const validation = changerStatutChantierSchema.safeParse({
    id,
    statut,
    raisonPause
  })

  if (!validation.success) {
    const firstError = validation.error.issues[0]
    return { error: firstError?.message ?? 'Données invalides' }
  }

  try {
    const data: { statut: StatutChantier; raisonPause?: string | null } = {
      statut: validation.data.statut as StatutChantier
    }

    // Clear raisonPause when reactivating, set when pausing
    if (validation.data.statut === 'EN_PAUSE') {
      data.raisonPause = validation.data.raisonPause || null
    } else if (validation.data.statut === 'ACTIF') {
      data.raisonPause = null
    }

    await prisma.chantier.update({
      where: { id: validation.data.id },
      data
    })

    revalidatePath('/chantiers')
    return { success: true }
  } catch {
    return { error: 'Erreur lors du changement de statut du chantier' }
  }
}

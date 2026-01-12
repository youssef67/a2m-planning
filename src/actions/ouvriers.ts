'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import {
  creerOuvrierSchema,
  modifierOuvrierSchema,
  archiverOuvrierSchema
} from '@/schemas/ouvrier'

export async function creerOuvrier(formData: FormData) {
  const authResult = await requireAuth()
  if ('error' in authResult) return { error: authResult.error }

  const validation = creerOuvrierSchema.safeParse({
    nom: formData.get('nom'),
    prenom: formData.get('prenom'),
    type: formData.get('type')
  })

  if (!validation.success) {
    const firstError = validation.error.issues[0]
    return { error: firstError?.message ?? 'Données invalides' }
  }

  try {
    const ouvrier = await prisma.ouvrier.create({
      data: validation.data
    })

    revalidatePath('/ouvriers')
    return { success: true, ouvrier }
  } catch {
    return { error: 'Erreur lors de la création de l\'ouvrier' }
  }
}

export async function modifierOuvrier(formData: FormData) {
  const authResult = await requireAuth()
  if ('error' in authResult) return { error: authResult.error }

  const idRaw = formData.get('id')
  const id = idRaw ? parseInt(idRaw.toString(), 10) : NaN

  const validation = modifierOuvrierSchema.safeParse({
    id,
    nom: formData.get('nom'),
    prenom: formData.get('prenom'),
    type: formData.get('type')
  })

  if (!validation.success) {
    const firstError = validation.error.issues[0]
    return { error: firstError?.message ?? 'Données invalides' }
  }

  try {
    await prisma.ouvrier.update({
      where: { id: validation.data.id },
      data: {
        nom: validation.data.nom,
        prenom: validation.data.prenom,
        type: validation.data.type
      }
    })

    revalidatePath('/ouvriers')
    return { success: true }
  } catch {
    return { error: 'Erreur lors de la modification de l\'ouvrier' }
  }
}

export async function archiverOuvrier(formData: FormData) {
  const authResult = await requireAuth()
  if ('error' in authResult) return { error: authResult.error }

  const idRaw = formData.get('id')
  const id = idRaw ? parseInt(idRaw.toString(), 10) : NaN

  const validation = archiverOuvrierSchema.safeParse({ id })

  if (!validation.success) {
    return { error: 'ID invalide' }
  }

  try {
    await prisma.ouvrier.update({
      where: { id: validation.data.id },
      data: { statut: 'ARCHIVE' }
    })

    revalidatePath('/ouvriers')
    return { success: true }
  } catch {
    return { error: 'Erreur lors de l\'archivage de l\'ouvrier' }
  }
}

export async function restaurerOuvrier(formData: FormData) {
  const authResult = await requireAuth()
  if ('error' in authResult) return { error: authResult.error }

  const idRaw = formData.get('id')
  const id = idRaw ? parseInt(idRaw.toString(), 10) : NaN

  const validation = archiverOuvrierSchema.safeParse({ id })

  if (!validation.success) {
    return { error: 'ID invalide' }
  }

  try {
    await prisma.ouvrier.update({
      where: { id: validation.data.id },
      data: { statut: 'ACTIF' }
    })

    revalidatePath('/ouvriers')
    return { success: true }
  } catch {
    return { error: 'Erreur lors de la restauration de l\'ouvrier' }
  }
}

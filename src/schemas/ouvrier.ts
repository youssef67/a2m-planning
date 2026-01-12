import { z } from 'zod'

export const creerOuvrierSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  prenom: z.string().min(1, 'Le prénom est requis').max(100, 'Le prénom ne peut pas dépasser 100 caractères'),
  type: z.enum(['SALARIE', 'SOUS_TRAITANT'], {
    error: 'Le type doit être SALARIE ou SOUS_TRAITANT'
  })
})

export const modifierOuvrierSchema = creerOuvrierSchema.extend({
  id: z.number().int().positive('ID invalide')
})

export const archiverOuvrierSchema = z.object({
  id: z.number().int().positive('ID invalide')
})

export type CreerOuvrierInput = z.infer<typeof creerOuvrierSchema>
export type ModifierOuvrierInput = z.infer<typeof modifierOuvrierSchema>
export type ArchiverOuvrierInput = z.infer<typeof archiverOuvrierSchema>

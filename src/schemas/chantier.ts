import { z } from 'zod'

export const creerChantierSchema = z.object({
  nom: z.string().min(1, 'Le nom est requis').max(200, 'Le nom ne peut pas dépasser 200 caractères')
})

export const modifierChantierSchema = creerChantierSchema.extend({
  id: z.number().int().positive('ID invalide')
})

export const changerStatutChantierSchema = z.object({
  id: z.number().int().positive('ID invalide'),
  statut: z.enum(['ACTIF', 'EN_PAUSE', 'TERMINE'], {
    error: 'Le statut doit être ACTIF, EN_PAUSE ou TERMINE'
  }),
  raisonPause: z.string().max(500, 'La raison ne peut pas dépasser 500 caractères').optional()
})

export type CreerChantierInput = z.infer<typeof creerChantierSchema>
export type ModifierChantierInput = z.infer<typeof modifierChantierSchema>
export type ChangerStatutChantierInput = z.infer<typeof changerStatutChantierSchema>

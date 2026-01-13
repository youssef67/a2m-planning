import { z } from 'zod'

export const indisponibiliteSchema = z.object({
  ouvrierId: z.number().int().positive("L'ouvrier est requis"),
  date: z.string().min(1, 'La date est requise'),
  periode: z.enum(['JOURNEE', 'MATIN', 'APRES_MIDI'], {
    error: 'La période est requise'
  }),
  statutPresence: z.enum(['CONGE_PAYE', 'MALADIE', 'ABSENCE', 'FORMATION'], {
    error: 'Le statut est invalide'
  })
})

export const modifierIndisponibiliteSchema = indisponibiliteSchema.pick({
  periode: true,
  statutPresence: true
})

export const indisponibiliteEnMasseSchema = z.object({
  ouvrierIds: z.array(z.number().int().positive()).min(1, 'Au moins un ouvrier requis'),
  dates: z.array(z.string().min(1)).min(1, 'Au moins un jour requis'),
  periode: z.enum(['JOURNEE', 'MATIN', 'APRES_MIDI'], {
    error: 'La période est requise'
  }),
  statutPresence: z.enum(['CONGE_PAYE', 'MALADIE', 'ABSENCE', 'FORMATION'], {
    error: 'Le statut est invalide'
  }),
  ecraserConflits: z.boolean().default(true)
})

export type IndisponibiliteInput = z.infer<typeof indisponibiliteSchema>
export type ModifierIndisponibiliteInput = z.infer<typeof modifierIndisponibiliteSchema>
export type IndisponibiliteEnMasseInput = z.infer<typeof indisponibiliteEnMasseSchema>

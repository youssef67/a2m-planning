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

export type IndisponibiliteInput = z.infer<typeof indisponibiliteSchema>
export type ModifierIndisponibiliteInput = z.infer<typeof modifierIndisponibiliteSchema>

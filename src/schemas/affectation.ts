import { z } from 'zod'

export const creerAffectationSchema = z.object({
  ouvrierId: z.number().int().positive("L'ouvrier est requis"),
  chantierId: z.number().int().positive('Le chantier est requis'),
  date: z.string().min(1, 'La date est requise'),
  periode: z.enum(['JOURNEE', 'MATIN', 'APRES_MIDI'], {
    error: 'La période est requise'
  })
})

export type CreerAffectationInput = z.infer<typeof creerAffectationSchema>

export const creerAffectationsEnMasseSchema = z.object({
  ouvrierIds: z.array(z.number().int().positive()).min(1, 'Au moins un ouvrier requis'),
  chantierId: z.number().int().positive('Le chantier est requis'),
  dates: z.array(z.string().min(1)).min(1, 'Au moins une date requise'),
  periode: z.enum(['JOURNEE', 'MATIN', 'APRES_MIDI'], {
    error: 'La période est requise'
  })
})

export type CreerAffectationsEnMasseInput = z.infer<typeof creerAffectationsEnMasseSchema>

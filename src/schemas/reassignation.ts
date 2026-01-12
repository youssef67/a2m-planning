import { z } from 'zod'

export const reassignationSchema = z.object({
  affectationId: z.number().int().positive("L'affectation est requise"),
  nouveauChantierId: z.number().int().positive('Le nouveau chantier est requis')
})

export type ReassignationInput = z.infer<typeof reassignationSchema>

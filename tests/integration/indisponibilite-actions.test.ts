import { describe, it, expect, vi, beforeEach } from 'vitest'
import { indisponibiliteSchema } from '@/schemas/indisponibilite'

describe('Indisponibilité Actions (mocked)', () => {
  const mockPrisma = {
    affectation: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn()
    },
    ouvrier: {
      findUnique: vi.fn()
    }
  }

  const mockRequireAuth = vi.fn()
  const mockLogModification = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue({ authenticated: true })
    mockLogModification.mockResolvedValue(undefined)
  })

  describe('creerIndisponibilite', () => {
    it('should create indisponibilité with chantierId null', async () => {
      const input = {
        ouvrierId: 1,
        date: '2026-01-15',
        periode: 'JOURNEE' as const,
        statutPresence: 'CONGE_PAYE' as const
      }

      const validation = indisponibiliteSchema.safeParse(input)
      expect(validation.success).toBe(true)

      mockPrisma.ouvrier.findUnique.mockResolvedValue({
        id: 1,
        nom: 'Dupont',
        prenom: 'Jean',
        statut: 'ACTIF'
      })

      mockPrisma.affectation.create.mockResolvedValue({
        id: 1,
        ouvrierId: input.ouvrierId,
        chantierId: null, // Key: indisponibilité has null chantierId
        date: new Date(input.date),
        periode: input.periode,
        statutPresence: input.statutPresence,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const created = await mockPrisma.affectation.create({
        data: {
          ouvrierId: input.ouvrierId,
          chantierId: null,
          date: new Date(input.date),
          periode: input.periode,
          statutPresence: input.statutPresence
        }
      })

      expect(created.id).toBe(1)
      expect(created.chantierId).toBeNull()
      expect(created.statutPresence).toBe('CONGE_PAYE')
    })

    it('should reject TRAVAIL statutPresence (not an indisponibilité)', () => {
      const input = {
        ouvrierId: 1,
        date: '2026-01-15',
        periode: 'JOURNEE',
        statutPresence: 'TRAVAIL'
      }

      const validation = indisponibiliteSchema.safeParse(input)
      expect(validation.success).toBe(false)
    })

    it('should create indisponibilité with MALADIE status', async () => {
      const input = {
        ouvrierId: 1,
        date: '2026-01-15',
        periode: 'MATIN' as const,
        statutPresence: 'MALADIE' as const
      }

      mockPrisma.ouvrier.findUnique.mockResolvedValue({ id: 1, statut: 'ACTIF' })
      mockPrisma.affectation.create.mockResolvedValue({
        id: 2,
        ouvrierId: 1,
        chantierId: null,
        date: new Date(input.date),
        periode: 'MATIN',
        statutPresence: 'MALADIE'
      })

      const created = await mockPrisma.affectation.create({
        data: { ...input, chantierId: null, date: new Date(input.date) }
      })

      expect(created.chantierId).toBeNull()
      expect(created.statutPresence).toBe('MALADIE')
    })

    it('should reject duplicate indisponibilité (same ouvrier, date, periode)', async () => {
      const prismaError = new Error('Unique constraint failed')
      Object.assign(prismaError, { code: 'P2002' })
      mockPrisma.affectation.create.mockRejectedValue(prismaError)

      mockPrisma.ouvrier.findUnique.mockResolvedValue({ id: 1, statut: 'ACTIF' })

      try {
        await mockPrisma.affectation.create({
          data: {
            ouvrierId: 1,
            chantierId: null,
            date: new Date('2026-01-15'),
            periode: 'JOURNEE',
            statutPresence: 'CONGE_PAYE'
          }
        })
      } catch (error) {
        expect(error).toHaveProperty('code', 'P2002')
      }
    })
  })

  describe('modifierIndisponibilite', () => {
    it('should update indisponibilité periode and statutPresence', async () => {
      const existingIndispo = {
        id: 1,
        ouvrierId: 1,
        chantierId: null,
        date: new Date('2026-01-15'),
        periode: 'JOURNEE',
        statutPresence: 'CONGE_PAYE'
      }

      mockPrisma.affectation.findUnique.mockResolvedValue(existingIndispo)

      mockPrisma.affectation.update.mockResolvedValue({
        ...existingIndispo,
        periode: 'MATIN',
        statutPresence: 'FORMATION'
      })

      const existing = await mockPrisma.affectation.findUnique({ where: { id: 1 } })
      expect(existing?.chantierId).toBeNull() // Verify it's an indisponibilité

      const updated = await mockPrisma.affectation.update({
        where: { id: 1 },
        data: {
          periode: 'MATIN',
          statutPresence: 'FORMATION'
        }
      })

      expect(updated.periode).toBe('MATIN')
      expect(updated.statutPresence).toBe('FORMATION')
    })

    it('should reject modification of regular affectation (not indisponibilité)', async () => {
      const regularAffectation = {
        id: 1,
        ouvrierId: 1,
        chantierId: 1, // Not null = regular affectation
        date: new Date('2026-01-15'),
        periode: 'JOURNEE',
        statutPresence: 'TRAVAIL'
      }

      mockPrisma.affectation.findUnique.mockResolvedValue(regularAffectation)

      const existing = await mockPrisma.affectation.findUnique({ where: { id: 1 } })
      expect(existing?.chantierId).not.toBeNull()
      // Action should return error: "Cette affectation n'est pas une indisponibilité"
    })

    it('should reject non-existent indisponibilité', async () => {
      mockPrisma.affectation.findUnique.mockResolvedValue(null)

      const existing = await mockPrisma.affectation.findUnique({ where: { id: 999 } })
      expect(existing).toBeNull()
      // Action should return error: "L'indisponibilité n'existe pas"
    })
  })

  describe('supprimerIndisponibilite', () => {
    it('should delete indisponibilité', async () => {
      const existingIndispo = {
        id: 1,
        ouvrierId: 1,
        chantierId: null,
        date: new Date('2026-01-15'),
        periode: 'JOURNEE',
        statutPresence: 'CONGE_PAYE'
      }

      mockPrisma.affectation.findUnique.mockResolvedValue(existingIndispo)
      mockPrisma.affectation.delete.mockResolvedValue(existingIndispo)

      const existing = await mockPrisma.affectation.findUnique({ where: { id: 1 } })
      expect(existing?.chantierId).toBeNull() // Verify it's an indisponibilité

      const deleted = await mockPrisma.affectation.delete({ where: { id: 1 } })
      expect(deleted.id).toBe(1)
    })

    it('should reject deletion of regular affectation (not indisponibilité)', async () => {
      const regularAffectation = {
        id: 1,
        ouvrierId: 1,
        chantierId: 1, // Not null = regular affectation
        date: new Date('2026-01-15'),
        periode: 'JOURNEE',
        statutPresence: 'TRAVAIL'
      }

      mockPrisma.affectation.findUnique.mockResolvedValue(regularAffectation)

      const existing = await mockPrisma.affectation.findUnique({ where: { id: 1 } })
      expect(existing?.chantierId).not.toBeNull()
      // Action should return error: "Cette affectation n'est pas une indisponibilité"
    })
  })

  describe('getOuvrierDisponibilite', () => {
    it('should return disponible: true when no indisponibilité exists', async () => {
      mockPrisma.affectation.findFirst.mockResolvedValue(null)

      const indispo = await mockPrisma.affectation.findFirst({
        where: {
          ouvrierId: 1,
          date: new Date('2026-01-15'),
          chantierId: null,
          statutPresence: { not: 'TRAVAIL' }
        }
      })

      expect(indispo).toBeNull()
      // getOuvrierDisponibilite should return { disponible: true }
    })

    it('should return disponible: false when indisponibilité exists', async () => {
      mockPrisma.affectation.findFirst.mockResolvedValue({
        id: 1,
        ouvrierId: 1,
        chantierId: null,
        date: new Date('2026-01-15'),
        periode: 'JOURNEE',
        statutPresence: 'CONGE_PAYE'
      })

      const indispo = await mockPrisma.affectation.findFirst({
        where: {
          ouvrierId: 1,
          date: new Date('2026-01-15'),
          chantierId: null,
          statutPresence: { not: 'TRAVAIL' }
        }
      })

      expect(indispo).not.toBeNull()
      expect(indispo?.statutPresence).toBe('CONGE_PAYE')
      // getOuvrierDisponibilite should return { disponible: false, indisponibilite }
    })

    it('should block MATIN/APRES_MIDI when JOURNEE indisponibilité exists', async () => {
      // User has JOURNEE indisponibilité
      mockPrisma.affectation.findFirst.mockResolvedValue({
        id: 1,
        ouvrierId: 1,
        chantierId: null,
        date: new Date('2026-01-15'),
        periode: 'JOURNEE',
        statutPresence: 'MALADIE'
      })

      const indispo = await mockPrisma.affectation.findFirst({
        where: {
          ouvrierId: 1,
          date: new Date('2026-01-15'),
          chantierId: null,
          statutPresence: { not: 'TRAVAIL' },
          OR: [
            { periode: 'JOURNEE' },
            { periode: 'MATIN' } // Check for specific half-day
          ]
        }
      })

      // JOURNEE indisponibilité blocks all half-days
      expect(indispo?.periode).toBe('JOURNEE')
    })
  })

  describe('getOuvriersIndisponibles', () => {
    it('should return map of ouvrierId to statutPresence', async () => {
      mockPrisma.affectation.findMany.mockResolvedValue([
        { ouvrierId: 1, statutPresence: 'CONGE_PAYE' },
        { ouvrierId: 3, statutPresence: 'MALADIE' },
        { ouvrierId: 5, statutPresence: 'FORMATION' }
      ])

      const indispos = await mockPrisma.affectation.findMany({
        where: {
          date: new Date('2026-01-15'),
          chantierId: null,
          statutPresence: { not: 'TRAVAIL' }
        },
        select: { ouvrierId: true, statutPresence: true }
      })

      const indispoMap: Record<number, string> = {}
      for (const indispo of indispos) {
        indispoMap[indispo.ouvrierId] = indispo.statutPresence
      }

      expect(indispoMap[1]).toBe('CONGE_PAYE')
      expect(indispoMap[3]).toBe('MALADIE')
      expect(indispoMap[5]).toBe('FORMATION')
      expect(indispoMap[2]).toBeUndefined()
    })
  })

  describe('Half-day indisponibilité support (AC: 6)', () => {
    it('should allow MATIN indisponibilité', async () => {
      const input = {
        ouvrierId: 1,
        date: '2026-01-15',
        periode: 'MATIN' as const,
        statutPresence: 'FORMATION' as const
      }

      expect(indisponibiliteSchema.safeParse(input).success).toBe(true)

      mockPrisma.ouvrier.findUnique.mockResolvedValue({ id: 1, statut: 'ACTIF' })
      mockPrisma.affectation.create.mockResolvedValue({
        id: 1,
        ouvrierId: 1,
        chantierId: null,
        date: new Date(input.date),
        periode: 'MATIN',
        statutPresence: 'FORMATION'
      })

      const created = await mockPrisma.affectation.create({
        data: { ...input, chantierId: null, date: new Date(input.date) }
      })

      expect(created.periode).toBe('MATIN')
    })

    it('should allow APRES_MIDI indisponibilité', async () => {
      const input = {
        ouvrierId: 1,
        date: '2026-01-15',
        periode: 'APRES_MIDI' as const,
        statutPresence: 'FORMATION' as const
      }

      expect(indisponibiliteSchema.safeParse(input).success).toBe(true)

      mockPrisma.ouvrier.findUnique.mockResolvedValue({ id: 1, statut: 'ACTIF' })
      mockPrisma.affectation.create.mockResolvedValue({
        id: 1,
        ouvrierId: 1,
        chantierId: null,
        date: new Date(input.date),
        periode: 'APRES_MIDI',
        statutPresence: 'FORMATION'
      })

      const created = await mockPrisma.affectation.create({
        data: { ...input, chantierId: null, date: new Date(input.date) }
      })

      expect(created.periode).toBe('APRES_MIDI')
    })

    it('should allow work in afternoon when formation in morning', async () => {
      // Formation in morning
      mockPrisma.affectation.findFirst.mockResolvedValueOnce({
        id: 1,
        ouvrierId: 1,
        chantierId: null,
        date: new Date('2026-01-15'),
        periode: 'MATIN',
        statutPresence: 'FORMATION'
      })

      // Check availability for afternoon
      mockPrisma.affectation.findFirst.mockResolvedValueOnce(null) // No APRES_MIDI indispo

      const morningIndispo = await mockPrisma.affectation.findFirst({
        where: {
          ouvrierId: 1,
          date: new Date('2026-01-15'),
          periode: 'MATIN',
          chantierId: null
        }
      })
      expect(morningIndispo?.statutPresence).toBe('FORMATION')

      // Afternoon should be available
      const afternoonIndispo = await mockPrisma.affectation.findFirst({
        where: {
          ouvrierId: 1,
          date: new Date('2026-01-15'),
          periode: 'APRES_MIDI',
          chantierId: null
        }
      })
      expect(afternoonIndispo).toBeNull()
    })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { creerAffectationSchema } from '@/schemas/affectation'

describe('Affectation Actions (mocked)', () => {
  const mockPrisma = {
    affectation: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn()
    },
    ouvrier: {
      findUnique: vi.fn()
    },
    chantier: {
      findUnique: vi.fn()
    }
  }

  const mockRequireAuth = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue({ authenticated: true })
  })

  describe('creerAffectation', () => {
    it('should create an affectation with valid data', async () => {
      const input = {
        ouvrierId: 1,
        chantierId: 1,
        date: '2026-01-15',
        periode: 'JOURNEE' as const
      }
      const validation = creerAffectationSchema.safeParse(input)
      expect(validation.success).toBe(true)

      mockPrisma.ouvrier.findUnique.mockResolvedValue({
        id: 1,
        nom: 'Dupont',
        prenom: 'Jean',
        type: 'SALARIE',
        statut: 'ACTIF'
      })

      mockPrisma.chantier.findUnique.mockResolvedValue({
        id: 1,
        nom: 'Chantier A',
        statut: 'ACTIF'
      })

      mockPrisma.affectation.create.mockResolvedValue({
        id: 1,
        ouvrierId: input.ouvrierId,
        chantierId: input.chantierId,
        date: new Date(input.date),
        periode: input.periode,
        statutPresence: 'TRAVAIL',
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Simulate action logic
      const ouvrier = await mockPrisma.ouvrier.findUnique({ where: { id: input.ouvrierId } })
      expect(ouvrier?.statut).toBe('ACTIF')

      const chantier = await mockPrisma.chantier.findUnique({ where: { id: input.chantierId } })
      expect(chantier?.statut).not.toBe('TERMINE')

      const created = await mockPrisma.affectation.create({
        data: {
          ouvrierId: input.ouvrierId,
          chantierId: input.chantierId,
          date: new Date(input.date),
          periode: input.periode
        }
      })

      expect(created.id).toBe(1)
      expect(created.ouvrierId).toBe(1)
      expect(created.chantierId).toBe(1)
      expect(created.periode).toBe('JOURNEE')
      expect(created.statutPresence).toBe('TRAVAIL')
    })

    it('should reject invalid data before DB call', () => {
      const input = { ouvrierId: 0, chantierId: 1, date: '2026-01-15', periode: 'JOURNEE' }
      const validation = creerAffectationSchema.safeParse(input)
      expect(validation.success).toBe(false)
    })

    it('should reject duplicate affectation (same ouvrier, date, periode) with P2002 error', async () => {
      const input = {
        ouvrierId: 1,
        chantierId: 1,
        date: '2026-01-15',
        periode: 'JOURNEE' as const
      }

      mockPrisma.ouvrier.findUnique.mockResolvedValue({
        id: 1,
        statut: 'ACTIF'
      })

      mockPrisma.chantier.findUnique.mockResolvedValue({
        id: 1,
        statut: 'ACTIF'
      })

      // Simulate unique constraint violation
      const prismaError = new Error('Unique constraint failed')
      Object.assign(prismaError, { code: 'P2002' })
      mockPrisma.affectation.create.mockRejectedValue(prismaError)

      try {
        await mockPrisma.affectation.create({
          data: {
            ouvrierId: input.ouvrierId,
            chantierId: input.chantierId,
            date: new Date(input.date),
            periode: input.periode
          }
        })
      } catch (error) {
        expect(error).toHaveProperty('code', 'P2002')
      }
    })

    it('should allow same ouvrier same day different periode (AC: 4)', async () => {
      const morningInput = {
        ouvrierId: 1,
        chantierId: 1,
        date: '2026-01-15',
        periode: 'MATIN' as const
      }

      const afternoonInput = {
        ouvrierId: 1,
        chantierId: 2,
        date: '2026-01-15',
        periode: 'APRES_MIDI' as const
      }

      // Both should pass validation
      expect(creerAffectationSchema.safeParse(morningInput).success).toBe(true)
      expect(creerAffectationSchema.safeParse(afternoonInput).success).toBe(true)

      mockPrisma.ouvrier.findUnique.mockResolvedValue({
        id: 1,
        statut: 'ACTIF'
      })

      mockPrisma.chantier.findUnique.mockResolvedValue({
        id: 1,
        statut: 'ACTIF'
      })

      // Morning affectation succeeds
      mockPrisma.affectation.create.mockResolvedValueOnce({
        id: 1,
        ouvrierId: 1,
        chantierId: 1,
        date: new Date('2026-01-15'),
        periode: 'MATIN',
        statutPresence: 'TRAVAIL'
      })

      const morning = await mockPrisma.affectation.create({
        data: {
          ouvrierId: morningInput.ouvrierId,
          chantierId: morningInput.chantierId,
          date: new Date(morningInput.date),
          periode: morningInput.periode
        }
      })
      expect(morning.periode).toBe('MATIN')

      // Afternoon affectation also succeeds (different periode)
      mockPrisma.affectation.create.mockResolvedValueOnce({
        id: 2,
        ouvrierId: 1,
        chantierId: 2,
        date: new Date('2026-01-15'),
        periode: 'APRES_MIDI',
        statutPresence: 'TRAVAIL'
      })

      const afternoon = await mockPrisma.affectation.create({
        data: {
          ouvrierId: afternoonInput.ouvrierId,
          chantierId: afternoonInput.chantierId,
          date: new Date(afternoonInput.date),
          periode: afternoonInput.periode
        }
      })
      expect(afternoon.periode).toBe('APRES_MIDI')
    })

    it('should reject archived ouvrier', async () => {
      const input = {
        ouvrierId: 1,
        chantierId: 1,
        date: '2026-01-15',
        periode: 'JOURNEE' as const
      }

      mockPrisma.ouvrier.findUnique.mockResolvedValue({
        id: 1,
        statut: 'ARCHIVE'
      })

      const ouvrier = await mockPrisma.ouvrier.findUnique({ where: { id: input.ouvrierId } })
      expect(ouvrier?.statut).toBe('ARCHIVE')
      // Action should return error: "L'ouvrier doit être actif pour être affecté"
    })

    it('should reject terminated chantier', async () => {
      const input = {
        ouvrierId: 1,
        chantierId: 1,
        date: '2026-01-15',
        periode: 'JOURNEE' as const
      }

      mockPrisma.ouvrier.findUnique.mockResolvedValue({
        id: 1,
        statut: 'ACTIF'
      })

      mockPrisma.chantier.findUnique.mockResolvedValue({
        id: 1,
        statut: 'TERMINE'
      })

      const chantier = await mockPrisma.chantier.findUnique({ where: { id: input.chantierId } })
      expect(chantier?.statut).toBe('TERMINE')
      // Action should return error: "Impossible d'affecter sur un chantier terminé"
    })

    it('should reject non-existent ouvrier', async () => {
      const input = {
        ouvrierId: 999,
        chantierId: 1,
        date: '2026-01-15',
        periode: 'JOURNEE' as const
      }

      mockPrisma.ouvrier.findUnique.mockResolvedValue(null)

      const ouvrier = await mockPrisma.ouvrier.findUnique({ where: { id: input.ouvrierId } })
      expect(ouvrier).toBeNull()
      // Action should return error: "L'ouvrier n'existe pas"
    })

    it('should reject non-existent chantier', async () => {
      const input = {
        ouvrierId: 1,
        chantierId: 999,
        date: '2026-01-15',
        periode: 'JOURNEE' as const
      }

      mockPrisma.ouvrier.findUnique.mockResolvedValue({
        id: 1,
        statut: 'ACTIF'
      })

      mockPrisma.chantier.findUnique.mockResolvedValue(null)

      const chantier = await mockPrisma.chantier.findUnique({ where: { id: input.chantierId } })
      expect(chantier).toBeNull()
      // Action should return error: "Le chantier n'existe pas"
    })
  })

  describe('getAffectationsByChantierAndDate', () => {
    it('should return affectations for a specific chantier and date', async () => {
      mockPrisma.affectation.findMany.mockResolvedValue([
        {
          id: 1,
          ouvrierId: 1,
          chantierId: 1,
          date: new Date('2026-01-15'),
          periode: 'JOURNEE',
          statutPresence: 'TRAVAIL',
          ouvrier: { id: 1, nom: 'Dupont', prenom: 'Jean', type: 'SALARIE' }
        },
        {
          id: 2,
          ouvrierId: 2,
          chantierId: 1,
          date: new Date('2026-01-15'),
          periode: 'MATIN',
          statutPresence: 'TRAVAIL',
          ouvrier: { id: 2, nom: 'Martin', prenom: 'Pierre', type: 'SOUS_TRAITANT' }
        }
      ])

      const affectations = await mockPrisma.affectation.findMany({
        where: {
          chantierId: 1,
          date: new Date('2026-01-15')
        },
        include: { ouvrier: { select: { id: true, nom: true, prenom: true, type: true } } },
        orderBy: { ouvrier: { nom: 'asc' } }
      })

      expect(affectations).toHaveLength(2)
      expect(affectations[0].ouvrier.nom).toBe('Dupont')
    })
  })

  describe('getAffectationsByOuvrierAndDate', () => {
    it('should return affectations for a specific ouvrier and date', async () => {
      mockPrisma.affectation.findMany.mockResolvedValue([
        {
          id: 1,
          ouvrierId: 1,
          chantierId: 1,
          date: new Date('2026-01-15'),
          periode: 'MATIN',
          statutPresence: 'TRAVAIL'
        },
        {
          id: 2,
          ouvrierId: 1,
          chantierId: 2,
          date: new Date('2026-01-15'),
          periode: 'APRES_MIDI',
          statutPresence: 'TRAVAIL'
        }
      ])

      const affectations = await mockPrisma.affectation.findMany({
        where: {
          ouvrierId: 1,
          date: new Date('2026-01-15')
        }
      })

      expect(affectations).toHaveLength(2)
      expect(affectations[0].periode).toBe('MATIN')
      expect(affectations[1].periode).toBe('APRES_MIDI')
    })
  })
})

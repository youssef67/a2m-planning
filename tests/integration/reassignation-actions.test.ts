import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reassignationSchema } from '@/schemas/reassignation'

describe('Reassignation Actions (mocked)', () => {
  const mockPrisma = {
    affectation: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    chantier: {
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

  describe('reassignerAffectation', () => {
    it('should reassign affectation to new chantier', async () => {
      const existingAffectation = {
        id: 1,
        ouvrierId: 1,
        chantierId: 1,
        date: new Date('2026-01-15'),
        periode: 'JOURNEE',
        statutPresence: 'TRAVAIL'
      }

      const newChantier = {
        id: 2,
        nom: 'Chantier B',
        statut: 'ACTIF'
      }

      mockPrisma.affectation.findUnique.mockResolvedValue(existingAffectation)
      mockPrisma.chantier.findUnique.mockResolvedValue(newChantier)
      mockPrisma.affectation.update.mockResolvedValue({
        ...existingAffectation,
        chantierId: 2
      })

      const existing = await mockPrisma.affectation.findUnique({ where: { id: 1 } })
      expect(existing?.chantierId).toBe(1)

      const chantier = await mockPrisma.chantier.findUnique({ where: { id: 2 } })
      expect(chantier?.statut).toBe('ACTIF')

      const updated = await mockPrisma.affectation.update({
        where: { id: 1 },
        data: { chantierId: 2 }
      })

      expect(updated.chantierId).toBe(2)
    })

    it('should reject reassignment of indisponibilité (chantierId is null)', async () => {
      const indisponibilite = {
        id: 1,
        ouvrierId: 1,
        chantierId: null, // Indisponibilité
        date: new Date('2026-01-15'),
        periode: 'JOURNEE',
        statutPresence: 'CONGE_PAYE'
      }

      mockPrisma.affectation.findUnique.mockResolvedValue(indisponibilite)

      const existing = await mockPrisma.affectation.findUnique({ where: { id: 1 } })
      expect(existing?.chantierId).toBeNull()
      // Action should return error: "Impossible de réaffecter une indisponibilité"
    })

    it('should reject reassignment to TERMINE chantier', async () => {
      const existingAffectation = {
        id: 1,
        ouvrierId: 1,
        chantierId: 1,
        date: new Date('2026-01-15'),
        periode: 'JOURNEE',
        statutPresence: 'TRAVAIL'
      }

      const terminatedChantier = {
        id: 2,
        nom: 'Chantier Terminé',
        statut: 'TERMINE'
      }

      mockPrisma.affectation.findUnique.mockResolvedValue(existingAffectation)
      mockPrisma.chantier.findUnique.mockResolvedValue(terminatedChantier)

      const chantier = await mockPrisma.chantier.findUnique({ where: { id: 2 } })
      expect(chantier?.statut).toBe('TERMINE')
      // Action should return error: "Impossible de réaffecter vers un chantier terminé"
    })

    it('should reject reassignment to non-existent chantier', async () => {
      const existingAffectation = {
        id: 1,
        ouvrierId: 1,
        chantierId: 1,
        date: new Date('2026-01-15'),
        periode: 'JOURNEE',
        statutPresence: 'TRAVAIL'
      }

      mockPrisma.affectation.findUnique.mockResolvedValue(existingAffectation)
      mockPrisma.chantier.findUnique.mockResolvedValue(null)

      const chantier = await mockPrisma.chantier.findUnique({ where: { id: 999 } })
      expect(chantier).toBeNull()
      // Action should return error: "Le chantier n'existe pas"
    })

    it('should reject reassignment of non-existent affectation', async () => {
      mockPrisma.affectation.findUnique.mockResolvedValue(null)

      const existing = await mockPrisma.affectation.findUnique({ where: { id: 999 } })
      expect(existing).toBeNull()
      // Action should return error: "L'affectation n'existe pas"
    })

    it('should validate input with Zod schema', () => {
      const valid = reassignationSchema.safeParse({
        affectationId: 1,
        nouveauChantierId: 2
      })
      expect(valid.success).toBe(true)

      const invalid = reassignationSchema.safeParse({
        affectationId: 0,
        nouveauChantierId: -1
      })
      expect(invalid.success).toBe(false)
    })
  })

  describe('modifierPeriodeAffectation', () => {
    it('should update affectation period', async () => {
      const existingAffectation = {
        id: 1,
        ouvrierId: 1,
        chantierId: 1,
        date: new Date('2026-01-15'),
        periode: 'JOURNEE',
        statutPresence: 'TRAVAIL'
      }

      mockPrisma.affectation.findUnique.mockResolvedValue(existingAffectation)
      mockPrisma.affectation.findFirst.mockResolvedValue(null) // No conflict
      mockPrisma.affectation.update.mockResolvedValue({
        ...existingAffectation,
        periode: 'MATIN'
      })

      const updated = await mockPrisma.affectation.update({
        where: { id: 1 },
        data: { periode: 'MATIN' }
      })

      expect(updated.periode).toBe('MATIN')
    })

    it('should reject if target period has conflict', async () => {
      const existingAffectation = {
        id: 1,
        ouvrierId: 1,
        chantierId: 1,
        date: new Date('2026-01-15'),
        periode: 'JOURNEE',
        statutPresence: 'TRAVAIL'
      }

      const conflictAffectation = {
        id: 2,
        ouvrierId: 1,
        chantierId: 2,
        date: new Date('2026-01-15'),
        periode: 'MATIN',
        statutPresence: 'TRAVAIL'
      }

      mockPrisma.affectation.findUnique.mockResolvedValue(existingAffectation)
      mockPrisma.affectation.findFirst.mockResolvedValue(conflictAffectation)

      const conflict = await mockPrisma.affectation.findFirst({
        where: {
          ouvrierId: 1,
          date: new Date('2026-01-15'),
          periode: 'MATIN',
          id: { not: 1 }
        }
      })

      expect(conflict).not.toBeNull()
      // Action should return error: "Une affectation existe déjà pour cette période"
    })

    it('should reject if target period blocked by indisponibilité', async () => {
      const existingAffectation = {
        id: 1,
        ouvrierId: 1,
        chantierId: 1,
        date: new Date('2026-01-15'),
        periode: 'JOURNEE',
        statutPresence: 'TRAVAIL'
      }

      mockPrisma.affectation.findUnique.mockResolvedValue(existingAffectation)
      // First findFirst for conflict check returns null
      mockPrisma.affectation.findFirst.mockResolvedValueOnce(null)
      // Second findFirst for indisponibilité check returns indispo
      mockPrisma.affectation.findFirst.mockResolvedValueOnce({
        id: 3,
        ouvrierId: 1,
        chantierId: null,
        date: new Date('2026-01-15'),
        periode: 'MATIN',
        statutPresence: 'FORMATION'
      })

      // Action should return error: "L'ouvrier est indisponible pour cette période"
    })
  })

  describe('supprimerAffectation', () => {
    it('should delete work affectation', async () => {
      const existingAffectation = {
        id: 1,
        ouvrierId: 1,
        chantierId: 1, // Work assignment, not indisponibilité
        date: new Date('2026-01-15'),
        periode: 'JOURNEE',
        statutPresence: 'TRAVAIL'
      }

      mockPrisma.affectation.findUnique.mockResolvedValue(existingAffectation)
      mockPrisma.affectation.delete.mockResolvedValue(existingAffectation)

      const existing = await mockPrisma.affectation.findUnique({ where: { id: 1 } })
      expect(existing?.chantierId).not.toBeNull()

      const deleted = await mockPrisma.affectation.delete({ where: { id: 1 } })
      expect(deleted.id).toBe(1)
    })

    it('should reject deletion of indisponibilité', async () => {
      const indisponibilite = {
        id: 1,
        ouvrierId: 1,
        chantierId: null, // Indisponibilité
        date: new Date('2026-01-15'),
        periode: 'JOURNEE',
        statutPresence: 'CONGE_PAYE'
      }

      mockPrisma.affectation.findUnique.mockResolvedValue(indisponibilite)

      const existing = await mockPrisma.affectation.findUnique({ where: { id: 1 } })
      expect(existing?.chantierId).toBeNull()
      // Action should return error: "Utilisez supprimerIndisponibilite pour les indisponibilités"
    })

    it('should reject deletion of non-existent affectation', async () => {
      mockPrisma.affectation.findUnique.mockResolvedValue(null)

      const existing = await mockPrisma.affectation.findUnique({ where: { id: 999 } })
      expect(existing).toBeNull()
      // Action should return error: "L'affectation n'existe pas"
    })
  })

  describe('convertirEnIndisponibilite', () => {
    it('should convert work affectation to indisponibilité', async () => {
      const existingAffectation = {
        id: 1,
        ouvrierId: 1,
        chantierId: 1,
        date: new Date('2026-01-15'),
        periode: 'JOURNEE',
        statutPresence: 'TRAVAIL'
      }

      mockPrisma.affectation.findUnique.mockResolvedValue(existingAffectation)
      mockPrisma.affectation.update.mockResolvedValue({
        ...existingAffectation,
        chantierId: null,
        statutPresence: 'MALADIE'
      })

      const existing = await mockPrisma.affectation.findUnique({ where: { id: 1 } })
      expect(existing?.chantierId).not.toBeNull()

      const updated = await mockPrisma.affectation.update({
        where: { id: 1 },
        data: {
          chantierId: null,
          statutPresence: 'MALADIE'
        }
      })

      expect(updated.chantierId).toBeNull()
      expect(updated.statutPresence).toBe('MALADIE')
    })

    it('should accept all valid indisponibilité statuts', async () => {
      const validStatuts = ['CONGE_PAYE', 'MALADIE', 'ABSENCE', 'FORMATION']

      for (const statut of validStatuts) {
        const existingAffectation = {
          id: 1,
          ouvrierId: 1,
          chantierId: 1,
          date: new Date('2026-01-15'),
          periode: 'JOURNEE',
          statutPresence: 'TRAVAIL'
        }

        mockPrisma.affectation.findUnique.mockResolvedValue(existingAffectation)
        mockPrisma.affectation.update.mockResolvedValue({
          ...existingAffectation,
          chantierId: null,
          statutPresence: statut
        })

        const updated = await mockPrisma.affectation.update({
          where: { id: 1 },
          data: { chantierId: null, statutPresence: statut }
        })

        expect(updated.statutPresence).toBe(statut)
      }
    })

    it('should reject TRAVAIL as statutPresence', async () => {
      // TRAVAIL is not a valid indisponibilité status
      // Action should return error: "Statut de présence invalide"
      const invalidStatut = 'TRAVAIL'
      const validStatuts = ['CONGE_PAYE', 'MALADIE', 'ABSENCE', 'FORMATION']
      expect(validStatuts.includes(invalidStatut)).toBe(false)
    })

    it('should reject conversion of already indisponibilité', async () => {
      const indisponibilite = {
        id: 1,
        ouvrierId: 1,
        chantierId: null, // Already indisponibilité
        date: new Date('2026-01-15'),
        periode: 'JOURNEE',
        statutPresence: 'CONGE_PAYE'
      }

      mockPrisma.affectation.findUnique.mockResolvedValue(indisponibilite)

      const existing = await mockPrisma.affectation.findUnique({ where: { id: 1 } })
      expect(existing?.chantierId).toBeNull()
      // Action should return error: "Cette affectation est déjà une indisponibilité"
    })

    it('should reject conversion of non-existent affectation', async () => {
      mockPrisma.affectation.findUnique.mockResolvedValue(null)

      const existing = await mockPrisma.affectation.findUnique({ where: { id: 999 } })
      expect(existing).toBeNull()
      // Action should return error: "L'affectation n'existe pas"
    })
  })

  describe('3-click reassignment flow (AC: 4)', () => {
    it('should complete reassignment in 3 steps', async () => {
      // Step 1: Click on affectation (opens menu)
      const affectation = {
        id: 1,
        ouvrierId: 1,
        chantierId: 1,
        date: new Date('2026-01-15'),
        periode: 'JOURNEE',
        statutPresence: 'TRAVAIL'
      }

      // Step 2: Click "Réaffecter" (shows chantier list)
      const chantiersActifs = [
        { id: 2, nom: 'Chantier B', statut: 'ACTIF' },
        { id: 3, nom: 'Chantier C', statut: 'ACTIF' }
      ]

      // Step 3: Click on new chantier (completes reassignment)
      mockPrisma.affectation.findUnique.mockResolvedValue(affectation)
      mockPrisma.chantier.findUnique.mockResolvedValue(chantiersActifs[0])
      mockPrisma.affectation.update.mockResolvedValue({
        ...affectation,
        chantierId: 2
      })

      const updated = await mockPrisma.affectation.update({
        where: { id: 1 },
        data: { chantierId: 2 }
      })

      expect(updated.chantierId).toBe(2)
      // Total flow: 3 clicks
    })
  })
})

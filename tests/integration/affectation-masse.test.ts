import { describe, it, expect, vi, beforeEach } from 'vitest'
import { creerAffectationsEnMasse } from '@/actions/affectations'
import { prisma } from '@/lib/prisma'

// Mock auth
vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ userId: 1 })
}))

// Mock revalidateTag
vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn()
}))

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    chantier: {
      findUnique: vi.fn()
    },
    ouvrier: {
      findMany: vi.fn()
    },
    affectation: {
      deleteMany: vi.fn(),
      createMany: vi.fn()
    },
    $transaction: vi.fn()
  }
}))

const mockChantierFindUnique = vi.mocked(prisma.chantier.findUnique)
const mockOuvrierFindMany = vi.mocked(prisma.ouvrier.findMany)
const mockTransaction = vi.mocked(prisma.$transaction)

describe('creerAffectationsEnMasse (Story 2.12)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Validation des données', () => {
    it('should return error when ouvrierIds is empty', async () => {
      const result = await creerAffectationsEnMasse({
        ouvrierIds: [],
        chantierId: 1,
        dates: ['2026-01-13'],
        periode: 'JOURNEE'
      })

      expect(result).toHaveProperty('error', 'Au moins un ouvrier requis')
    })

    it('should return error when dates is empty', async () => {
      const result = await creerAffectationsEnMasse({
        ouvrierIds: [1],
        chantierId: 1,
        dates: [],
        periode: 'JOURNEE'
      })

      expect(result).toHaveProperty('error', 'Au moins une date requise')
    })

    it('should return error when chantierId is invalid', async () => {
      const result = await creerAffectationsEnMasse({
        ouvrierIds: [1],
        chantierId: -1,
        dates: ['2026-01-13'],
        periode: 'JOURNEE'
      })

      expect(result).toHaveProperty('error')
    })
  })

  describe('Validation du chantier', () => {
    it('should return error when chantier does not exist', async () => {
      mockChantierFindUnique.mockResolvedValue(null)

      const result = await creerAffectationsEnMasse({
        ouvrierIds: [1],
        chantierId: 999,
        dates: ['2026-01-13'],
        periode: 'JOURNEE'
      })

      expect(result).toHaveProperty('error', "Le chantier n'existe pas")
    })

    it('should return error when chantier is TERMINE', async () => {
      mockChantierFindUnique.mockResolvedValue({
        id: 1,
        nom: 'Chantier Test',
        statut: 'TERMINE'
      } as never)

      const result = await creerAffectationsEnMasse({
        ouvrierIds: [1],
        chantierId: 1,
        dates: ['2026-01-13'],
        periode: 'JOURNEE'
      })

      expect(result).toHaveProperty('error', "Impossible d'affecter sur un chantier terminé")
    })
  })

  describe('Validation des ouvriers', () => {
    it('should return error when ouvrier does not exist', async () => {
      mockChantierFindUnique.mockResolvedValue({
        id: 1,
        nom: 'Chantier Test',
        statut: 'EN_COURS'
      } as never)
      mockOuvrierFindMany.mockResolvedValue([])

      const result = await creerAffectationsEnMasse({
        ouvrierIds: [999],
        chantierId: 1,
        dates: ['2026-01-13'],
        periode: 'JOURNEE'
      })

      expect(result).toHaveProperty('error', "Un ou plusieurs ouvriers n'existent pas")
    })

    it('should return error when some ouvriers are not ACTIF', async () => {
      mockChantierFindUnique.mockResolvedValue({
        id: 1,
        nom: 'Chantier Test',
        statut: 'EN_COURS'
      } as never)
      mockOuvrierFindMany.mockResolvedValue([
        { id: 1, nom: 'Dupont', prenom: 'Jean', statut: 'ACTIF' },
        { id: 2, nom: 'Martin', prenom: 'Marie', statut: 'INACTIF' }
      ] as never)

      const result = await creerAffectationsEnMasse({
        ouvrierIds: [1, 2],
        chantierId: 1,
        dates: ['2026-01-13'],
        periode: 'JOURNEE'
      })

      expect(result).toHaveProperty('error', 'Tous les ouvriers doivent être actifs')
    })
  })

  describe('Création en masse sans conflit', () => {
    it('should create affectations successfully', async () => {
      mockChantierFindUnique.mockResolvedValue({
        id: 1,
        nom: 'Chantier Test',
        statut: 'EN_COURS'
      } as never)
      mockOuvrierFindMany.mockResolvedValue([
        { id: 1, nom: 'Dupont', prenom: 'Jean', statut: 'ACTIF' }
      ] as never)
      mockTransaction.mockImplementation(async (callback) => {
        // Simuler la transaction
        const tx = {
          affectation: {
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
            createMany: vi.fn().mockResolvedValue({ count: 3 })
          }
        }
        return callback(tx as never)
      })

      const result = await creerAffectationsEnMasse({
        ouvrierIds: [1],
        chantierId: 1,
        dates: ['2026-01-13', '2026-01-14', '2026-01-15'],
        periode: 'JOURNEE'
      })

      expect(result).toHaveProperty('success', true)
      expect(result).toHaveProperty('count', 3)
    })

    it('should return correct count for multiple ouvriers and dates', async () => {
      mockChantierFindUnique.mockResolvedValue({
        id: 1,
        nom: 'Chantier Test',
        statut: 'EN_COURS'
      } as never)
      mockOuvrierFindMany.mockResolvedValue([
        { id: 1, nom: 'Dupont', prenom: 'Jean', statut: 'ACTIF' },
        { id: 2, nom: 'Martin', prenom: 'Marie', statut: 'ACTIF' }
      ] as never)
      mockTransaction.mockImplementation(async (callback) => {
        const tx = {
          affectation: {
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
            createMany: vi.fn().mockResolvedValue({ count: 6 }) // 2 ouvriers x 3 dates
          }
        }
        return callback(tx as never)
      })

      const result = await creerAffectationsEnMasse({
        ouvrierIds: [1, 2],
        chantierId: 1,
        dates: ['2026-01-13', '2026-01-14', '2026-01-15'],
        periode: 'JOURNEE'
      })

      expect(result).toHaveProperty('success', true)
      expect(result).toHaveProperty('count', 6)
    })
  })

  describe('Création en masse avec conflits (écrasement)', () => {
    it('should delete conflicting JOURNEE affectations when creating JOURNEE', async () => {
      mockChantierFindUnique.mockResolvedValue({
        id: 1,
        nom: 'Chantier Test',
        statut: 'EN_COURS'
      } as never)
      mockOuvrierFindMany.mockResolvedValue([
        { id: 1, nom: 'Dupont', prenom: 'Jean', statut: 'ACTIF' }
      ] as never)

      const mockDeleteMany = vi.fn().mockResolvedValue({ count: 1 })
      const mockCreateMany = vi.fn().mockResolvedValue({ count: 1 })

      mockTransaction.mockImplementation(async (callback) => {
        const tx = {
          affectation: {
            deleteMany: mockDeleteMany,
            createMany: mockCreateMany
          }
        }
        return callback(tx as never)
      })

      const result = await creerAffectationsEnMasse({
        ouvrierIds: [1],
        chantierId: 1,
        dates: ['2026-01-13'],
        periode: 'JOURNEE'
      })

      expect(result).toHaveProperty('success', true)
      expect(mockDeleteMany).toHaveBeenCalled()
    })

    it('should delete conflicting MATIN and JOURNEE when creating MATIN', async () => {
      mockChantierFindUnique.mockResolvedValue({
        id: 1,
        nom: 'Chantier Test',
        statut: 'EN_COURS'
      } as never)
      mockOuvrierFindMany.mockResolvedValue([
        { id: 1, nom: 'Dupont', prenom: 'Jean', statut: 'ACTIF' }
      ] as never)

      const mockDeleteMany = vi.fn().mockResolvedValue({ count: 1 })
      const mockCreateMany = vi.fn().mockResolvedValue({ count: 1 })

      mockTransaction.mockImplementation(async (callback) => {
        const tx = {
          affectation: {
            deleteMany: mockDeleteMany,
            createMany: mockCreateMany
          }
        }
        return callback(tx as never)
      })

      const result = await creerAffectationsEnMasse({
        ouvrierIds: [1],
        chantierId: 1,
        dates: ['2026-01-13'],
        periode: 'MATIN'
      })

      expect(result).toHaveProperty('success', true)
      // Should delete MATIN or JOURNEE conflicts
      expect(mockDeleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ periode: 'MATIN' }, { periode: 'JOURNEE' }]
          })
        })
      )
    })
  })

  describe('Gestion des erreurs', () => {
    it('should return error when transaction fails', async () => {
      mockChantierFindUnique.mockResolvedValue({
        id: 1,
        nom: 'Chantier Test',
        statut: 'EN_COURS'
      } as never)
      mockOuvrierFindMany.mockResolvedValue([
        { id: 1, nom: 'Dupont', prenom: 'Jean', statut: 'ACTIF' }
      ] as never)
      mockTransaction.mockRejectedValue(new Error('Transaction failed'))

      const result = await creerAffectationsEnMasse({
        ouvrierIds: [1],
        chantierId: 1,
        dates: ['2026-01-13'],
        periode: 'JOURNEE'
      })

      expect(result).toHaveProperty('error', 'Erreur lors de la création des affectations')
    })
  })

  describe('Périodes', () => {
    it('should work with JOURNEE period', async () => {
      mockChantierFindUnique.mockResolvedValue({
        id: 1,
        nom: 'Chantier Test',
        statut: 'EN_COURS'
      } as never)
      mockOuvrierFindMany.mockResolvedValue([
        { id: 1, nom: 'Dupont', prenom: 'Jean', statut: 'ACTIF' }
      ] as never)
      mockTransaction.mockImplementation(async (callback) => {
        const tx = {
          affectation: {
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
            createMany: vi.fn().mockResolvedValue({ count: 1 })
          }
        }
        return callback(tx as never)
      })

      const result = await creerAffectationsEnMasse({
        ouvrierIds: [1],
        chantierId: 1,
        dates: ['2026-01-13'],
        periode: 'JOURNEE'
      })

      expect(result).toHaveProperty('success', true)
    })

    it('should work with MATIN period', async () => {
      mockChantierFindUnique.mockResolvedValue({
        id: 1,
        nom: 'Chantier Test',
        statut: 'EN_COURS'
      } as never)
      mockOuvrierFindMany.mockResolvedValue([
        { id: 1, nom: 'Dupont', prenom: 'Jean', statut: 'ACTIF' }
      ] as never)
      mockTransaction.mockImplementation(async (callback) => {
        const tx = {
          affectation: {
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
            createMany: vi.fn().mockResolvedValue({ count: 1 })
          }
        }
        return callback(tx as never)
      })

      const result = await creerAffectationsEnMasse({
        ouvrierIds: [1],
        chantierId: 1,
        dates: ['2026-01-13'],
        periode: 'MATIN'
      })

      expect(result).toHaveProperty('success', true)
    })

    it('should work with APRES_MIDI period', async () => {
      mockChantierFindUnique.mockResolvedValue({
        id: 1,
        nom: 'Chantier Test',
        statut: 'EN_COURS'
      } as never)
      mockOuvrierFindMany.mockResolvedValue([
        { id: 1, nom: 'Dupont', prenom: 'Jean', statut: 'ACTIF' }
      ] as never)
      mockTransaction.mockImplementation(async (callback) => {
        const tx = {
          affectation: {
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
            createMany: vi.fn().mockResolvedValue({ count: 1 })
          }
        }
        return callback(tx as never)
      })

      const result = await creerAffectationsEnMasse({
        ouvrierIds: [1],
        chantierId: 1,
        dates: ['2026-01-13'],
        periode: 'APRES_MIDI'
      })

      expect(result).toHaveProperty('success', true)
    })
  })
})

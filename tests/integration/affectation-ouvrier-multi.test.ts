import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import { creerAffectationsEnMasse } from '@/actions/affectations'
import type { Periode } from '@/generated/prisma/client'

// Mock requireAuth
vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn(() => Promise.resolve({ user: { id: 1 } }))
}))

// Mock revalidateTag
vi.mock('next/cache', () => ({
  revalidateTag: vi.fn()
}))

// Mock prisma
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

describe('Affectation Multi-Ouvriers depuis Vue Ouvrier - Intégration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('creerAffectationsEnMasse depuis Vue Ouvrier', () => {
    it('crée des affectations pour plusieurs ouvriers vers un chantier sur plusieurs jours', async () => {
      const mockChantier = {
        id: 1,
        nom: 'Chantier A',
        statut: 'ACTIF',
        raisonPause: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const mockOuvriers = [
        {
          id: 1,
          nom: 'Dupont',
          prenom: 'Jean',
          statut: 'ACTIF',
          type: 'SALARIE',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          nom: 'Martin',
          prenom: 'Pierre',
          statut: 'ACTIF',
          type: 'SOUS_TRAITANT',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      vi.mocked(prisma.chantier.findUnique).mockResolvedValue(mockChantier)
      vi.mocked(prisma.ouvrier.findMany).mockResolvedValue(mockOuvriers)
      vi.mocked(prisma.$transaction).mockResolvedValue(4) // 2 ouvriers x 2 jours

      const result = await creerAffectationsEnMasse({
        ouvrierIds: [1, 2],
        chantierId: 1,
        dates: ['2024-01-15', '2024-01-16'],
        periode: 'JOURNEE' as Periode
      })

      expect(result).toEqual({ success: true, count: 4 })
    })

    it('crée des affectations MATIN pour un ouvrier unique', async () => {
      const mockChantier = {
        id: 2,
        nom: 'Chantier B',
        statut: 'ACTIF',
        raisonPause: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const mockOuvriers = [
        {
          id: 3,
          nom: 'Bernard',
          prenom: 'Marie',
          statut: 'ACTIF',
          type: 'SALARIE',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      vi.mocked(prisma.chantier.findUnique).mockResolvedValue(mockChantier)
      vi.mocked(prisma.ouvrier.findMany).mockResolvedValue(mockOuvriers)
      vi.mocked(prisma.$transaction).mockResolvedValue(5) // 1 ouvrier x 5 jours

      const result = await creerAffectationsEnMasse({
        ouvrierIds: [3],
        chantierId: 2,
        dates: ['2024-01-15', '2024-01-16', '2024-01-17', '2024-01-18', '2024-01-19'],
        periode: 'MATIN' as Periode
      })

      expect(result).toEqual({ success: true, count: 5 })
    })

    it('crée des affectations APRES_MIDI pour plusieurs ouvriers', async () => {
      const mockChantier = {
        id: 1,
        nom: 'Chantier A',
        statut: 'ACTIF',
        raisonPause: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const mockOuvriers = [
        {
          id: 1,
          nom: 'Dupont',
          prenom: 'Jean',
          statut: 'ACTIF',
          type: 'SALARIE',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          nom: 'Martin',
          prenom: 'Pierre',
          statut: 'ACTIF',
          type: 'SOUS_TRAITANT',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 3,
          nom: 'Bernard',
          prenom: 'Marie',
          statut: 'ACTIF',
          type: 'SALARIE',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      vi.mocked(prisma.chantier.findUnique).mockResolvedValue(mockChantier)
      vi.mocked(prisma.ouvrier.findMany).mockResolvedValue(mockOuvriers)
      vi.mocked(prisma.$transaction).mockResolvedValue(3) // 3 ouvriers x 1 jour

      const result = await creerAffectationsEnMasse({
        ouvrierIds: [1, 2, 3],
        chantierId: 1,
        dates: ['2024-01-15'],
        periode: 'APRES_MIDI' as Periode
      })

      expect(result).toEqual({ success: true, count: 3 })
    })

    it('rejette si le chantier n\'existe pas', async () => {
      vi.mocked(prisma.chantier.findUnique).mockResolvedValue(null)

      const result = await creerAffectationsEnMasse({
        ouvrierIds: [1],
        chantierId: 999,
        dates: ['2024-01-15'],
        periode: 'JOURNEE' as Periode
      })

      expect(result).toEqual({ error: "Le chantier n'existe pas" })
    })

    it('rejette si le chantier est terminé', async () => {
      vi.mocked(prisma.chantier.findUnique).mockResolvedValue({
        id: 1,
        nom: 'Chantier Terminé',
        statut: 'TERMINE',
        raisonPause: null,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      const result = await creerAffectationsEnMasse({
        ouvrierIds: [1],
        chantierId: 1,
        dates: ['2024-01-15'],
        periode: 'JOURNEE' as Periode
      })

      expect(result).toEqual({ error: "Impossible d'affecter sur un chantier terminé" })
    })

    it('rejette si un ouvrier n\'existe pas', async () => {
      const mockChantier = {
        id: 1,
        nom: 'Chantier A',
        statut: 'ACTIF',
        raisonPause: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.mocked(prisma.chantier.findUnique).mockResolvedValue(mockChantier)
      vi.mocked(prisma.ouvrier.findMany).mockResolvedValue([])

      const result = await creerAffectationsEnMasse({
        ouvrierIds: [999],
        chantierId: 1,
        dates: ['2024-01-15'],
        periode: 'JOURNEE' as Periode
      })

      expect(result).toEqual({ error: "Un ou plusieurs ouvriers n'existent pas" })
    })

    it('rejette si un ouvrier est inactif', async () => {
      const mockChantier = {
        id: 1,
        nom: 'Chantier A',
        statut: 'ACTIF',
        raisonPause: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const mockOuvriers = [
        {
          id: 1,
          nom: 'Dupont',
          prenom: 'Jean',
          statut: 'INACTIF',
          type: 'SALARIE',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      vi.mocked(prisma.chantier.findUnique).mockResolvedValue(mockChantier)
      vi.mocked(prisma.ouvrier.findMany).mockResolvedValue(mockOuvriers)

      const result = await creerAffectationsEnMasse({
        ouvrierIds: [1],
        chantierId: 1,
        dates: ['2024-01-15'],
        periode: 'JOURNEE' as Periode
      })

      expect(result).toEqual({ error: 'Tous les ouvriers doivent être actifs' })
    })

    it('rejette avec liste vide d\'ouvriers', async () => {
      const result = await creerAffectationsEnMasse({
        ouvrierIds: [],
        chantierId: 1,
        dates: ['2024-01-15'],
        periode: 'JOURNEE' as Periode
      })

      expect(result).toHaveProperty('error')
    })

    it('rejette avec liste vide de dates', async () => {
      const result = await creerAffectationsEnMasse({
        ouvrierIds: [1],
        chantierId: 1,
        dates: [],
        periode: 'JOURNEE' as Periode
      })

      expect(result).toHaveProperty('error')
    })

    it('écrase les affectations existantes en conflit', async () => {
      const mockChantier = {
        id: 2,
        nom: 'Nouveau Chantier',
        statut: 'ACTIF',
        raisonPause: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const mockOuvriers = [
        {
          id: 1,
          nom: 'Dupont',
          prenom: 'Jean',
          statut: 'ACTIF',
          type: 'SALARIE',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      vi.mocked(prisma.chantier.findUnique).mockResolvedValue(mockChantier)
      vi.mocked(prisma.ouvrier.findMany).mockResolvedValue(mockOuvriers)

      // La transaction gère la suppression et la création
      vi.mocked(prisma.$transaction).mockResolvedValue(1)

      const result = await creerAffectationsEnMasse({
        ouvrierIds: [1],
        chantierId: 2,
        dates: ['2024-01-15'],
        periode: 'JOURNEE' as Periode
      })

      expect(result).toEqual({ success: true, count: 1 })
    })
  })

  describe('Validation des données', () => {
    it('rejette une période invalide', async () => {
      const result = await creerAffectationsEnMasse({
        ouvrierIds: [1],
        chantierId: 1,
        dates: ['2024-01-15'],
        periode: 'INVALIDE' as Periode
      })

      expect(result).toHaveProperty('error')
    })

    it('gère les dates au format ISO', async () => {
      const mockChantier = {
        id: 1,
        nom: 'Chantier A',
        statut: 'ACTIF',
        raisonPause: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const mockOuvriers = [
        {
          id: 1,
          nom: 'Dupont',
          prenom: 'Jean',
          statut: 'ACTIF',
          type: 'SALARIE',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      vi.mocked(prisma.chantier.findUnique).mockResolvedValue(mockChantier)
      vi.mocked(prisma.ouvrier.findMany).mockResolvedValue(mockOuvriers)
      vi.mocked(prisma.$transaction).mockResolvedValue(1)

      const result = await creerAffectationsEnMasse({
        ouvrierIds: [1],
        chantierId: 1,
        dates: ['2024-01-15'],
        periode: 'JOURNEE' as Periode
      })

      expect(result).toEqual({ success: true, count: 1 })
    })
  })
})

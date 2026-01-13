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

describe('Affectation Multi-Ouvriers Chantier - Intégration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('creerAffectationsEnMasse', () => {
    it('crée des affectations pour plusieurs ouvriers sur plusieurs jours', async () => {
      const mockChantier = { id: 1, nom: 'Chantier A', statut: 'ACTIF' }
      const mockOuvriers = [
        { id: 1, nom: 'Dupont', prenom: 'Jean', statut: 'ACTIF' },
        { id: 2, nom: 'Martin', prenom: 'Pierre', statut: 'ACTIF' }
      ]

      vi.mocked(prisma.chantier.findUnique).mockResolvedValue(mockChantier)
      vi.mocked(prisma.ouvrier.findMany).mockResolvedValue(mockOuvriers)
      vi.mocked(prisma.$transaction).mockResolvedValue(6) // 2 ouvriers x 3 jours

      const result = await creerAffectationsEnMasse({
        ouvrierIds: [1, 2],
        chantierId: 1,
        dates: ['2024-01-15', '2024-01-16', '2024-01-17'],
        periode: 'JOURNEE' as Periode
      })

      expect(result).toEqual({ success: true, count: 6 })
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
        statut: 'TERMINE'
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
      vi.mocked(prisma.chantier.findUnique).mockResolvedValue({
        id: 1,
        nom: 'Chantier A',
        statut: 'ACTIF'
      })
      vi.mocked(prisma.ouvrier.findMany).mockResolvedValue([
        { id: 1, nom: 'Dupont', prenom: 'Jean', statut: 'ACTIF' }
        // Ouvrier 2 n'existe pas
      ])

      const result = await creerAffectationsEnMasse({
        ouvrierIds: [1, 2],
        chantierId: 1,
        dates: ['2024-01-15'],
        periode: 'JOURNEE' as Periode
      })

      expect(result).toEqual({ error: "Un ou plusieurs ouvriers n'existent pas" })
    })

    it('rejette si un ouvrier est inactif', async () => {
      vi.mocked(prisma.chantier.findUnique).mockResolvedValue({
        id: 1,
        nom: 'Chantier A',
        statut: 'ACTIF'
      })
      vi.mocked(prisma.ouvrier.findMany).mockResolvedValue([
        { id: 1, nom: 'Dupont', prenom: 'Jean', statut: 'ACTIF' },
        { id: 2, nom: 'Martin', prenom: 'Pierre', statut: 'INACTIF' }
      ])

      const result = await creerAffectationsEnMasse({
        ouvrierIds: [1, 2],
        chantierId: 1,
        dates: ['2024-01-15'],
        periode: 'JOURNEE' as Periode
      })

      expect(result).toEqual({ error: 'Tous les ouvriers doivent être actifs' })
    })

    it('rejette les données invalides (dates vides)', async () => {
      const result = await creerAffectationsEnMasse({
        ouvrierIds: [1],
        chantierId: 1,
        dates: [],
        periode: 'JOURNEE' as Periode
      })

      expect(result).toHaveProperty('error')
    })

    it('rejette les données invalides (ouvriers vides)', async () => {
      const result = await creerAffectationsEnMasse({
        ouvrierIds: [],
        chantierId: 1,
        dates: ['2024-01-15'],
        periode: 'JOURNEE' as Periode
      })

      expect(result).toHaveProperty('error')
    })
  })
})

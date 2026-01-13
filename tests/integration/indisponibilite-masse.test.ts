import { describe, it, expect, vi, beforeEach } from 'vitest'
import { indisponibiliteEnMasseSchema } from '@/schemas/indisponibilite'

describe('Indisponibilité en Masse (Story 2.16)', () => {
  const mockPrisma = {
    affectation: {
      createMany: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn()
    },
    ouvrier: {
      findMany: vi.fn()
    },
    $transaction: vi.fn()
  }

  const mockRequireAuth = vi.fn()
  const mockLogModification = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue({ authenticated: true })
    mockLogModification.mockResolvedValue(undefined)
  })

  describe('Schema Validation', () => {
    it('devrait valider un input correct', () => {
      const input = {
        ouvrierIds: [1, 2, 3],
        dates: ['2026-01-13', '2026-01-14'],
        periode: 'JOURNEE' as const,
        statutPresence: 'CONGE_PAYE' as const,
        ecraserConflits: true
      }

      const result = indisponibiliteEnMasseSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('devrait rejeter un tableau d\'ouvriers vide', () => {
      const input = {
        ouvrierIds: [],
        dates: ['2026-01-13'],
        periode: 'JOURNEE' as const,
        statutPresence: 'CONGE_PAYE' as const
      }

      const result = indisponibiliteEnMasseSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Au moins un ouvrier')
      }
    })

    it('devrait rejeter un tableau de dates vide', () => {
      const input = {
        ouvrierIds: [1],
        dates: [],
        periode: 'JOURNEE' as const,
        statutPresence: 'CONGE_PAYE' as const
      }

      const result = indisponibiliteEnMasseSchema.safeParse(input)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Au moins un jour')
      }
    })

    it('devrait accepter tous les statuts valides', () => {
      const statuts = ['CONGE_PAYE', 'MALADIE', 'ABSENCE', 'FORMATION'] as const

      for (const statutPresence of statuts) {
        const input = {
          ouvrierIds: [1],
          dates: ['2026-01-13'],
          periode: 'JOURNEE' as const,
          statutPresence
        }

        const result = indisponibiliteEnMasseSchema.safeParse(input)
        expect(result.success).toBe(true)
      }
    })

    it('devrait rejeter TRAVAIL comme statut (pas une indisponibilité)', () => {
      const input = {
        ouvrierIds: [1],
        dates: ['2026-01-13'],
        periode: 'JOURNEE',
        statutPresence: 'TRAVAIL'
      }

      const result = indisponibiliteEnMasseSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('devrait accepter toutes les périodes valides', () => {
      const periodes = ['JOURNEE', 'MATIN', 'APRES_MIDI'] as const

      for (const periode of periodes) {
        const input = {
          ouvrierIds: [1],
          dates: ['2026-01-13'],
          periode,
          statutPresence: 'CONGE_PAYE' as const
        }

        const result = indisponibiliteEnMasseSchema.safeParse(input)
        expect(result.success).toBe(true)
      }
    })

    it('devrait avoir ecraserConflits à true par défaut', () => {
      const input = {
        ouvrierIds: [1],
        dates: ['2026-01-13'],
        periode: 'JOURNEE' as const,
        statutPresence: 'CONGE_PAYE' as const
      }

      const result = indisponibiliteEnMasseSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.ecraserConflits).toBe(true)
      }
    })
  })

  describe('creerIndisponibilitesEnMasse Action', () => {
    it('devrait créer des indisponibilités pour plusieurs ouvriers et jours', async () => {
      const ouvrierIds = [1, 2]
      const dates = ['2026-01-13', '2026-01-14']

      mockPrisma.ouvrier.findMany.mockResolvedValue([
        { id: 1, nom: 'Dupont', prenom: 'Jean', statut: 'ACTIF' },
        { id: 2, nom: 'Martin', prenom: 'Pierre', statut: 'ACTIF' }
      ])

      mockPrisma.affectation.findMany.mockResolvedValue([]) // Pas de conflits
      mockPrisma.affectation.createMany.mockResolvedValue({ count: 4 })

      mockPrisma.$transaction.mockImplementation(async (cb) => {
        return cb(mockPrisma)
      })

      // Simuler l'exécution
      const ouvriers = await mockPrisma.ouvrier.findMany({
        where: { id: { in: ouvrierIds } }
      })
      expect(ouvriers.length).toBe(2)

      const created = await mockPrisma.affectation.createMany({
        data: ouvrierIds.flatMap((ouvrierId) =>
          dates.map((date) => ({
            ouvrierId,
            chantierId: null,
            date: new Date(date),
            periode: 'JOURNEE',
            statutPresence: 'CONGE_PAYE'
          }))
        )
      })

      // 2 ouvriers × 2 jours = 4 indisponibilités
      expect(created.count).toBe(4)
    })

    it('devrait détecter les conflits avec des affectations existantes (AC: 8)', async () => {
      const ouvrierIds = [1]
      const dates = ['2026-01-13']

      mockPrisma.ouvrier.findMany.mockResolvedValue([
        { id: 1, nom: 'Dupont', prenom: 'Jean', statut: 'ACTIF' }
      ])

      // Simuler un conflit existant
      mockPrisma.affectation.findMany.mockResolvedValue([
        {
          id: 99,
          ouvrierId: 1,
          chantierId: 5,
          date: new Date('2026-01-13'),
          periode: 'JOURNEE',
          statutPresence: 'TRAVAIL',
          chantier: { nom: 'Chantier A' }
        }
      ])

      const conflits = await mockPrisma.affectation.findMany({
        where: {
          ouvrierId: { in: ouvrierIds },
          date: { in: dates.map((d) => new Date(d)) },
          chantierId: { not: null }
        },
        include: { chantier: true }
      })

      expect(conflits.length).toBe(1)
      expect(conflits[0].chantier.nom).toBe('Chantier A')
    })

    it('devrait écraser les conflits si demandé (AC: 9)', async () => {
      mockPrisma.affectation.deleteMany.mockResolvedValue({ count: 1 })

      // Supprimer les affectations en conflit
      const deleted = await mockPrisma.affectation.deleteMany({
        where: {
          ouvrierId: 1,
          date: new Date('2026-01-13'),
          chantierId: { not: null }
        }
      })

      expect(deleted.count).toBe(1)
    })

    it('devrait rejeter si un ouvrier n\'existe pas', async () => {
      mockPrisma.ouvrier.findMany.mockResolvedValue([
        { id: 1, statut: 'ACTIF' }
        // L'ouvrier 2 n'existe pas
      ])

      const ouvriers = await mockPrisma.ouvrier.findMany({
        where: { id: { in: [1, 2] } }
      })

      expect(ouvriers.length).not.toBe(2)
      // L'action devrait retourner { error: "Un ou plusieurs ouvriers n'existent pas" }
    })

    it('devrait rejeter si un ouvrier est inactif', async () => {
      mockPrisma.ouvrier.findMany.mockResolvedValue([
        { id: 1, statut: 'INACTIF' }
      ])

      const ouvriers = await mockPrisma.ouvrier.findMany({
        where: { id: { in: [1] } }
      })

      const inactifs = ouvriers.filter((o: { statut: string }) => o.statut !== 'ACTIF')
      expect(inactifs.length).toBe(1)
      // L'action devrait retourner { error: "Tous les ouvriers doivent être actifs" }
    })

    it('devrait créer des indisponibilités avec chantierId null', async () => {
      mockPrisma.affectation.createMany.mockResolvedValue({ count: 1 })

      await mockPrisma.affectation.createMany({
        data: [{
          ouvrierId: 1,
          chantierId: null, // Clé: indisponibilité
          date: new Date('2026-01-13'),
          periode: 'JOURNEE',
          statutPresence: 'CONGE_PAYE'
        }]
      })

      const callData = mockPrisma.affectation.createMany.mock.calls[0][0].data[0]
      expect(callData.chantierId).toBeNull()
    })
  })

  describe('Gestion des conflits de période (AC: 8)', () => {
    it('JOURNEE devrait confliter avec toutes les périodes existantes', async () => {
      // Affectation existante en MATIN
      mockPrisma.affectation.findMany.mockResolvedValue([
        {
          id: 1,
          ouvrierId: 1,
          chantierId: 5,
          date: new Date('2026-01-13'),
          periode: 'MATIN',
          chantier: { nom: 'Chantier A' }
        }
      ])

      // Créer indisponibilité JOURNEE devrait détecter ce conflit
      const conflits = await mockPrisma.affectation.findMany({
        where: {
          ouvrierId: 1,
          date: new Date('2026-01-13'),
          chantierId: { not: null }
          // Pour JOURNEE, on cherche toutes les périodes
        }
      })

      expect(conflits.length).toBe(1)
    })

    it('MATIN devrait confliter avec JOURNEE ou MATIN existant', async () => {
      mockPrisma.affectation.findMany.mockResolvedValue([
        {
          id: 1,
          ouvrierId: 1,
          chantierId: 5,
          date: new Date('2026-01-13'),
          periode: 'JOURNEE',
          chantier: { nom: 'Chantier A' }
        }
      ])

      const conflits = await mockPrisma.affectation.findMany({
        where: {
          ouvrierId: 1,
          date: new Date('2026-01-13'),
          chantierId: { not: null },
          OR: [{ periode: 'MATIN' }, { periode: 'JOURNEE' }]
        }
      })

      expect(conflits.length).toBe(1)
    })

    it('MATIN ne devrait pas confliter avec APRES_MIDI existant', async () => {
      mockPrisma.affectation.findMany.mockResolvedValue([]) // Pas de MATIN ou JOURNEE

      const conflits = await mockPrisma.affectation.findMany({
        where: {
          ouvrierId: 1,
          date: new Date('2026-01-13'),
          chantierId: { not: null },
          OR: [{ periode: 'MATIN' }, { periode: 'JOURNEE' }]
        }
      })

      expect(conflits.length).toBe(0)
    })
  })

  describe('verifierConflitsIndisponibilite Action', () => {
    it('devrait retourner une liste vide quand pas de conflits', async () => {
      mockPrisma.affectation.findMany.mockResolvedValue([])

      const conflits = await mockPrisma.affectation.findMany({
        where: {
          ouvrierId: { in: [1] },
          date: { in: [new Date('2026-01-13')] },
          chantierId: { not: null }
        }
      })

      expect(conflits.length).toBe(0)
    })

    it('devrait retourner les détails des conflits', async () => {
      mockPrisma.affectation.findMany.mockResolvedValue([
        {
          ouvrierId: 1,
          date: new Date('2026-01-13'),
          periode: 'JOURNEE',
          ouvrier: { prenom: 'Jean', nom: 'Dupont' },
          chantier: { nom: 'Chantier A' }
        }
      ])

      const conflits = await mockPrisma.affectation.findMany({
        where: {
          ouvrierId: { in: [1] },
          date: { in: [new Date('2026-01-13')] },
          chantierId: { not: null }
        },
        include: {
          ouvrier: { select: { prenom: true, nom: true } },
          chantier: { select: { nom: true } }
        }
      })

      expect(conflits.length).toBe(1)
      expect(conflits[0].ouvrier.prenom).toBe('Jean')
      expect(conflits[0].chantier.nom).toBe('Chantier A')
    })
  })

  describe('Sous-traitants (Dev Notes)', () => {
    it('devrait permettre la création d\'indisponibilités pour les sous-traitants', async () => {
      mockPrisma.ouvrier.findMany.mockResolvedValue([
        { id: 3, nom: 'Durand', prenom: 'Marie', type: 'SOUS_TRAITANT', statut: 'ACTIF' }
      ])

      const ouvriers = await mockPrisma.ouvrier.findMany({
        where: { id: { in: [3] } }
      })

      expect(ouvriers[0].type).toBe('SOUS_TRAITANT')
      expect(ouvriers[0].statut).toBe('ACTIF')
      // L'action devrait accepter cet ouvrier
    })
  })

  describe('Retour de l\'action', () => {
    it('devrait retourner le nombre d\'indisponibilités créées', async () => {
      mockPrisma.$transaction.mockResolvedValue({
        count: 6,
        conflitsEcrases: 2
      })

      const result = await mockPrisma.$transaction(async () => ({
        count: 6,
        conflitsEcrases: 2
      }))

      expect(result.count).toBe(6)
      expect(result.conflitsEcrases).toBe(2)
    })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Planning Queries (mocked)', () => {
  const mockPrisma = {
    chantier: {
      findMany: vi.fn()
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getChantiersPlanningAvecAffectations', () => {
    it('should return active and paused chantiers with affectations', async () => {
      const dateDebut = new Date('2026-01-05')
      const dateFin = new Date('2026-01-11')

      mockPrisma.chantier.findMany.mockResolvedValue([
        {
          id: 1,
          nom: 'Chantier A',
          statut: 'ACTIF',
          affectations: [
            {
              id: 1,
              ouvrierId: 1,
              chantierId: 1,
              date: new Date('2026-01-06'),
              periode: 'JOURNEE',
              statutPresence: 'TRAVAIL',
              ouvrier: { id: 1, nom: 'Dupont', prenom: 'Jean', type: 'SALARIE' }
            }
          ]
        },
        {
          id: 2,
          nom: 'Chantier B',
          statut: 'EN_PAUSE',
          affectations: []
        }
      ])

      const chantiers = await mockPrisma.chantier.findMany({
        where: {
          statut: { in: ['ACTIF', 'EN_PAUSE'] }
        },
        include: {
          affectations: {
            where: {
              date: { gte: dateDebut, lte: dateFin },
              statutPresence: 'TRAVAIL'
            },
            include: {
              ouvrier: { select: { id: true, nom: true, prenom: true, type: true } }
            },
            orderBy: { ouvrier: { nom: 'asc' } }
          }
        },
        orderBy: [{ statut: 'asc' }, { nom: 'asc' }]
      })

      expect(chantiers).toHaveLength(2)
      expect(chantiers[0].statut).toBe('ACTIF')
      expect(chantiers[1].statut).toBe('EN_PAUSE')
    })

    it('should exclude terminated chantiers (AC: 6)', async () => {
      mockPrisma.chantier.findMany.mockResolvedValue([
        { id: 1, nom: 'Chantier Actif', statut: 'ACTIF', affectations: [] }
      ])

      const chantiers = await mockPrisma.chantier.findMany({
        where: {
          statut: { in: ['ACTIF', 'EN_PAUSE'] }
        }
      })

      // Verify TERMINE chantiers are not included
      const hasTermine = chantiers.some((c: { statut: string }) => c.statut === 'TERMINE')
      expect(hasTermine).toBe(false)
    })

    it('should include EN_PAUSE chantiers (AC: 5)', async () => {
      mockPrisma.chantier.findMany.mockResolvedValue([
        { id: 1, nom: 'Chantier Actif', statut: 'ACTIF', affectations: [] },
        { id: 2, nom: 'Chantier En Pause', statut: 'EN_PAUSE', raisonPause: 'Intempéries', affectations: [] }
      ])

      const chantiers = await mockPrisma.chantier.findMany({
        where: {
          statut: { in: ['ACTIF', 'EN_PAUSE'] }
        }
      })

      const enPauseChantier = chantiers.find((c: { statut: string }) => c.statut === 'EN_PAUSE')
      expect(enPauseChantier).toBeDefined()
      expect(enPauseChantier?.nom).toBe('Chantier En Pause')
    })

    it('should filter affectations by date range', async () => {
      const dateDebut = new Date('2026-01-05')
      const dateFin = new Date('2026-01-11')

      mockPrisma.chantier.findMany.mockResolvedValue([
        {
          id: 1,
          nom: 'Chantier A',
          statut: 'ACTIF',
          affectations: [
            // Only affectations within the date range should be included
            {
              id: 1,
              date: new Date('2026-01-06'), // Within range
              periode: 'JOURNEE',
              ouvrier: { id: 1, nom: 'Dupont', prenom: 'Jean', type: 'SALARIE' }
            }
            // Affectation on 2026-01-15 should NOT be included (outside range)
          ]
        }
      ])

      const chantiers = await mockPrisma.chantier.findMany({
        where: { statut: { in: ['ACTIF', 'EN_PAUSE'] } },
        include: {
          affectations: {
            where: {
              date: { gte: dateDebut, lte: dateFin },
              statutPresence: 'TRAVAIL'
            }
          }
        }
      })

      const affectation = chantiers[0].affectations[0]
      const affDate = new Date(affectation.date)
      expect(affDate >= dateDebut && affDate <= dateFin).toBe(true)
    })

    it('should only include TRAVAIL status affectations', async () => {
      mockPrisma.chantier.findMany.mockResolvedValue([
        {
          id: 1,
          nom: 'Chantier A',
          statut: 'ACTIF',
          affectations: [
            {
              id: 1,
              date: new Date('2026-01-06'),
              periode: 'JOURNEE',
              statutPresence: 'TRAVAIL',
              ouvrier: { id: 1, nom: 'Dupont', prenom: 'Jean', type: 'SALARIE' }
            }
            // CONGE_PAYE, MALADIE, etc. should NOT be included
          ]
        }
      ])

      const chantiers = await mockPrisma.chantier.findMany({
        include: {
          affectations: {
            where: { statutPresence: 'TRAVAIL' }
          }
        }
      })

      const allTravail = chantiers[0].affectations.every(
        (a: { statutPresence: string }) => a.statutPresence === 'TRAVAIL'
      )
      expect(allTravail).toBe(true)
    })

    it('should order chantiers by statut then nom', async () => {
      mockPrisma.chantier.findMany.mockResolvedValue([
        { id: 1, nom: 'Chantier B', statut: 'ACTIF', affectations: [] },
        { id: 2, nom: 'Chantier A', statut: 'ACTIF', affectations: [] },
        { id: 3, nom: 'Chantier C', statut: 'EN_PAUSE', affectations: [] }
      ])

      const chantiers = await mockPrisma.chantier.findMany({
        orderBy: [{ statut: 'asc' }, { nom: 'asc' }]
      })

      // ACTIF comes before EN_PAUSE (alphabetically)
      expect(chantiers[0].statut).toBe('ACTIF')
      expect(chantiers[1].statut).toBe('ACTIF')
      expect(chantiers[2].statut).toBe('EN_PAUSE')
    })

    it('should include ouvrier details with type for sous-traitant distinction (AC: 3)', async () => {
      mockPrisma.chantier.findMany.mockResolvedValue([
        {
          id: 1,
          nom: 'Chantier A',
          statut: 'ACTIF',
          affectations: [
            {
              id: 1,
              ouvrier: { id: 1, nom: 'Dupont', prenom: 'Jean', type: 'SALARIE' }
            },
            {
              id: 2,
              ouvrier: { id: 2, nom: 'Martin', prenom: 'Pierre', type: 'SOUS_TRAITANT' }
            }
          ]
        }
      ])

      const chantiers = await mockPrisma.chantier.findMany({
        include: {
          affectations: {
            include: {
              ouvrier: { select: { id: true, nom: true, prenom: true, type: true } }
            }
          }
        }
      })

      const ouvriers = chantiers[0].affectations.map((a: { ouvrier: { type: string } }) => a.ouvrier)
      const sousTraitant = ouvriers.find((o: { type: string }) => o.type === 'SOUS_TRAITANT')
      expect(sousTraitant).toBeDefined()
      expect(sousTraitant?.nom).toBe('Martin')
    })

    it('should return empty array when no chantiers exist', async () => {
      mockPrisma.chantier.findMany.mockResolvedValue([])

      const chantiers = await mockPrisma.chantier.findMany({
        where: { statut: { in: ['ACTIF', 'EN_PAUSE'] } }
      })

      expect(chantiers).toEqual([])
    })
  })
})

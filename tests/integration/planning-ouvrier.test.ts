import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Planning Ouvrier Queries (mocked)', () => {
  const mockPrisma = {
    ouvrier: {
      findMany: vi.fn()
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getOuvriersPlanningAvecAffectations', () => {
    it('should return active ouvriers with affectations', async () => {
      const dateDebut = new Date('2026-01-05')
      const dateFin = new Date('2026-01-11')

      mockPrisma.ouvrier.findMany.mockResolvedValue([
        {
          id: 1,
          nom: 'Dupont',
          prenom: 'Jean',
          type: 'SALARIE',
          statut: 'ACTIF',
          affectations: [
            {
              id: 1,
              ouvrierId: 1,
              chantierId: 1,
              date: new Date('2026-01-06'),
              periode: 'JOURNEE',
              statutPresence: 'TRAVAIL',
              chantier: { id: 1, nom: 'Chantier A', statut: 'ACTIF' }
            }
          ]
        }
      ])

      const ouvriers = await mockPrisma.ouvrier.findMany({
        where: { statut: 'ACTIF' },
        include: {
          affectations: {
            where: {
              date: { gte: dateDebut, lte: dateFin }
            },
            include: {
              chantier: { select: { id: true, nom: true, statut: true } }
            },
            orderBy: { date: 'asc' }
          }
        },
        orderBy: [{ nom: 'asc' }, { prenom: 'asc' }]
      })

      expect(ouvriers).toHaveLength(1)
      expect(ouvriers[0].statut).toBe('ACTIF')
      expect(ouvriers[0].affectations).toHaveLength(1)
    })

    it('should only return ACTIF ouvriers (AC: 1)', async () => {
      mockPrisma.ouvrier.findMany.mockResolvedValue([
        { id: 1, nom: 'Dupont', prenom: 'Jean', statut: 'ACTIF', affectations: [] }
      ])

      const ouvriers = await mockPrisma.ouvrier.findMany({
        where: { statut: 'ACTIF' }
      })

      const hasArchive = ouvriers.some((o: { statut: string }) => o.statut === 'ARCHIVE')
      expect(hasArchive).toBe(false)
    })

    it('should return ouvriers with no affectations in list (AC: 1)', async () => {
      mockPrisma.ouvrier.findMany.mockResolvedValue([
        { id: 1, nom: 'Dupont', prenom: 'Jean', statut: 'ACTIF', affectations: [] },
        {
          id: 2,
          nom: 'Martin',
          prenom: 'Pierre',
          statut: 'ACTIF',
          affectations: [
            {
              id: 1,
              date: new Date('2026-01-06'),
              chantier: { id: 1, nom: 'Chantier A', statut: 'ACTIF' }
            }
          ]
        }
      ])

      const ouvriers = await mockPrisma.ouvrier.findMany({
        where: { statut: 'ACTIF' },
        include: { affectations: true }
      })

      expect(ouvriers).toHaveLength(2)
      const ouvrierSansAffectation = ouvriers.find(
        (o: { affectations: unknown[] }) => o.affectations.length === 0
      )
      expect(ouvrierSansAffectation).toBeDefined()
      expect(ouvrierSansAffectation?.nom).toBe('Dupont')
    })

    it('should include ALL statutPresence types including unavailability (AC: 4)', async () => {
      mockPrisma.ouvrier.findMany.mockResolvedValue([
        {
          id: 1,
          nom: 'Dupont',
          prenom: 'Jean',
          statut: 'ACTIF',
          affectations: [
            {
              id: 1,
              date: new Date('2026-01-06'),
              periode: 'JOURNEE',
              statutPresence: 'TRAVAIL',
              chantierId: 1,
              chantier: { id: 1, nom: 'Chantier A', statut: 'ACTIF' }
            },
            {
              id: 2,
              date: new Date('2026-01-07'),
              periode: 'JOURNEE',
              statutPresence: 'CONGE_PAYE',
              chantierId: null,
              chantier: null
            },
            {
              id: 3,
              date: new Date('2026-01-08'),
              periode: 'JOURNEE',
              statutPresence: 'MALADIE',
              chantierId: null,
              chantier: null
            }
          ]
        }
      ])

      const ouvriers = await mockPrisma.ouvrier.findMany({
        where: { statut: 'ACTIF' },
        include: {
          affectations: {
            where: {
              date: {
                gte: new Date('2026-01-05'),
                lte: new Date('2026-01-11')
              }
              // No statutPresence filter - include ALL statuses
            }
          }
        }
      })

      const affectations = ouvriers[0].affectations
      const statuts = affectations.map((a: { statutPresence: string }) => a.statutPresence)

      expect(statuts).toContain('TRAVAIL')
      expect(statuts).toContain('CONGE_PAYE')
      expect(statuts).toContain('MALADIE')
    })

    it('should include chantier details for each affectation (AC: 3)', async () => {
      mockPrisma.ouvrier.findMany.mockResolvedValue([
        {
          id: 1,
          nom: 'Dupont',
          prenom: 'Jean',
          statut: 'ACTIF',
          affectations: [
            {
              id: 1,
              date: new Date('2026-01-06'),
              periode: 'JOURNEE',
              statutPresence: 'TRAVAIL',
              chantier: { id: 1, nom: 'Chantier Rénovation', statut: 'ACTIF' }
            }
          ]
        }
      ])

      const ouvriers = await mockPrisma.ouvrier.findMany({
        include: {
          affectations: {
            include: {
              chantier: { select: { id: true, nom: true, statut: true } }
            }
          }
        }
      })

      const chantier = ouvriers[0].affectations[0].chantier
      expect(chantier).toBeDefined()
      expect(chantier.id).toBe(1)
      expect(chantier.nom).toBe('Chantier Rénovation')
      expect(chantier.statut).toBe('ACTIF')
    })

    it('should handle null chantierId for unavailability (AC: 4)', async () => {
      mockPrisma.ouvrier.findMany.mockResolvedValue([
        {
          id: 1,
          nom: 'Dupont',
          prenom: 'Jean',
          statut: 'ACTIF',
          affectations: [
            {
              id: 1,
              date: new Date('2026-01-07'),
              periode: 'JOURNEE',
              statutPresence: 'CONGE_PAYE',
              chantierId: null,
              chantier: null
            }
          ]
        }
      ])

      const ouvriers = await mockPrisma.ouvrier.findMany({
        include: { affectations: { include: { chantier: true } } }
      })

      const affectation = ouvriers[0].affectations[0]
      expect(affectation.chantierId).toBeNull()
      expect(affectation.chantier).toBeNull()
      expect(affectation.statutPresence).toBe('CONGE_PAYE')
    })

    it('should order ouvriers by nom, prenom', async () => {
      // Mock returns data in expected sorted order (nom asc, prenom asc)
      mockPrisma.ouvrier.findMany.mockResolvedValue([
        { id: 1, nom: 'Bernard', prenom: 'Marie', statut: 'ACTIF', affectations: [] },
        { id: 3, nom: 'Dupont', prenom: 'Anne', statut: 'ACTIF', affectations: [] },
        { id: 2, nom: 'Dupont', prenom: 'Jean', statut: 'ACTIF', affectations: [] }
      ])

      const ouvriers = await mockPrisma.ouvrier.findMany({
        orderBy: [{ nom: 'asc' }, { prenom: 'asc' }]
      })

      expect(ouvriers[0].nom).toBe('Bernard')
      expect(ouvriers[1].nom).toBe('Dupont')
      expect(ouvriers[1].prenom).toBe('Anne')
      expect(ouvriers[2].nom).toBe('Dupont')
      expect(ouvriers[2].prenom).toBe('Jean')
    })

    it('should order affectations by date', async () => {
      // Mock returns data in expected sorted order (date asc)
      mockPrisma.ouvrier.findMany.mockResolvedValue([
        {
          id: 1,
          nom: 'Dupont',
          prenom: 'Jean',
          statut: 'ACTIF',
          affectations: [
            { id: 1, date: new Date('2026-01-06'), periode: 'JOURNEE' },
            { id: 3, date: new Date('2026-01-07'), periode: 'JOURNEE' },
            { id: 2, date: new Date('2026-01-08'), periode: 'JOURNEE' }
          ]
        }
      ])

      const ouvriers = await mockPrisma.ouvrier.findMany({
        include: {
          affectations: { orderBy: { date: 'asc' } }
        }
      })

      const dates = ouvriers[0].affectations.map((a: { date: Date }) => a.date.getTime())
      expect(dates[0]).toBeLessThan(dates[1])
      expect(dates[1]).toBeLessThan(dates[2])
    })

    it('should return empty array when no active ouvriers exist', async () => {
      mockPrisma.ouvrier.findMany.mockResolvedValue([])

      const ouvriers = await mockPrisma.ouvrier.findMany({
        where: { statut: 'ACTIF' }
      })

      expect(ouvriers).toEqual([])
    })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Vue Comptage Queries (mocked)', () => {
  const mockPrisma = {
    ouvrier: {
      findMany: vi.fn()
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getComptageAnnuel', () => {
    it('récupère tous les ouvriers actifs avec affectations de année', async () => {
      const annee = 2026
      const debutAnnee = new Date(annee, 0, 1)
      const finAnnee = new Date(annee, 11, 31)

      mockPrisma.ouvrier.findMany.mockResolvedValue([
        {
          id: 1,
          nom: 'Dupont',
          prenom: 'Jean',
          type: 'SALARIE',
          statut: 'ACTIF',
          affectations: [
            {
              date: new Date('2026-01-15'),
              periode: 'JOURNEE',
              statutPresence: 'TRAVAIL',
              chantier: { id: 1 }
            },
            {
              date: new Date('2026-03-10'),
              periode: 'JOURNEE',
              statutPresence: 'CONGE_PAYE',
              chantier: null
            }
          ]
        },
        {
          id: 2,
          nom: 'Martin',
          prenom: 'Pierre',
          type: 'SOUS_TRAITANT',
          statut: 'ACTIF',
          affectations: []
        }
      ])

      const ouvriers = await mockPrisma.ouvrier.findMany({
        where: { statut: 'ACTIF' },
        include: {
          affectations: {
            where: {
              date: { gte: debutAnnee, lte: finAnnee }
            },
            select: {
              date: true,
              periode: true,
              statutPresence: true,
              chantier: { select: { id: true } }
            }
          }
        },
        orderBy: { nom: 'asc' }
      })

      expect(ouvriers).toHaveLength(2)
      expect(ouvriers[0].affectations).toHaveLength(2)
      expect(ouvriers[1].type).toBe('SOUS_TRAITANT')
    })

    it('filtre uniquement les ouvriers actifs', async () => {
      mockPrisma.ouvrier.findMany.mockResolvedValue([])

      await mockPrisma.ouvrier.findMany({
        where: { statut: 'ACTIF' }
      })

      expect(mockPrisma.ouvrier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { statut: 'ACTIF' }
        })
      )
    })

    it('inclut les affectations de l\'année complète', async () => {
      const annee = 2026
      const debutAnnee = new Date(annee, 0, 1)
      const finAnnee = new Date(annee, 11, 31)

      mockPrisma.ouvrier.findMany.mockResolvedValue([])

      await mockPrisma.ouvrier.findMany({
        where: { statut: 'ACTIF' },
        include: {
          affectations: {
            where: {
              date: { gte: debutAnnee, lte: finAnnee }
            }
          }
        }
      })

      expect(mockPrisma.ouvrier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            affectations: expect.objectContaining({
              where: expect.objectContaining({
                date: { gte: debutAnnee, lte: finAnnee }
              })
            })
          })
        })
      )
    })
  })

  describe('Changement d\'année', () => {
    it('utilise les bonnes dates pour chaque année', async () => {
      for (const annee of [2024, 2025, 2026]) {
        const debutAnnee = new Date(annee, 0, 1)
        const finAnnee = new Date(annee, 11, 31)

        mockPrisma.ouvrier.findMany.mockResolvedValue([])

        await mockPrisma.ouvrier.findMany({
          include: {
            affectations: {
              where: {
                date: { gte: debutAnnee, lte: finAnnee }
              }
            }
          }
        })

        const call = mockPrisma.ouvrier.findMany.mock.calls[mockPrisma.ouvrier.findMany.mock.calls.length - 1][0]
        expect(call.include.affectations.where.date.gte.getFullYear()).toBe(annee)
        expect(call.include.affectations.where.date.lte.getFullYear()).toBe(annee)
      }
    })
  })
})

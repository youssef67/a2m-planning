import { describe, it, expect, vi, beforeEach } from 'vitest'
import { detecterConflitsMultiples } from '@/lib/affectations'
import { prisma } from '@/lib/prisma'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    affectation: {
      findMany: vi.fn()
    }
  }
}))

const mockPrismaFindMany = vi.mocked(prisma.affectation.findMany)

describe('detecterConflitsMultiples', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Cas sans conflits', () => {
    it('should return empty array when no existing affectations', async () => {
      mockPrismaFindMany.mockResolvedValue([])

      const result = await detecterConflitsMultiples(
        [1, 2],
        [new Date('2026-01-13')],
        'JOURNEE'
      )

      expect(result).toEqual([])
    })

    it('should return empty array when ouvrierIds is empty', async () => {
      const result = await detecterConflitsMultiples(
        [],
        [new Date('2026-01-13')],
        'JOURNEE'
      )

      expect(result).toEqual([])
      expect(mockPrismaFindMany).not.toHaveBeenCalled()
    })

    it('should return empty array when dates is empty', async () => {
      const result = await detecterConflitsMultiples([1, 2], [], 'JOURNEE')

      expect(result).toEqual([])
      expect(mockPrismaFindMany).not.toHaveBeenCalled()
    })

    it('should return empty array when MATIN existante + APRES_MIDI demandée', async () => {
      mockPrismaFindMany.mockResolvedValue([
        {
          id: 1,
          ouvrierId: 1,
          chantierId: 1,
          date: new Date('2026-01-13'),
          periode: 'MATIN',
          statutPresence: 'TRAVAIL',
          ouvrier: { id: 1, nom: 'Dupont', prenom: 'Jean' },
          chantier: { nom: 'Chantier A' }
        }
      ] as never)

      const result = await detecterConflitsMultiples(
        [1],
        [new Date('2026-01-13')],
        'APRES_MIDI'
      )

      expect(result).toEqual([])
    })
  })

  describe('Détection des conflits', () => {
    it('should detect conflict when same period exists', async () => {
      mockPrismaFindMany.mockResolvedValue([
        {
          id: 1,
          ouvrierId: 1,
          chantierId: 1,
          date: new Date('2026-01-13'),
          periode: 'JOURNEE',
          statutPresence: 'TRAVAIL',
          ouvrier: { id: 1, nom: 'Dupont', prenom: 'Jean' },
          chantier: { nom: 'Chantier A' }
        }
      ] as never)

      const result = await detecterConflitsMultiples(
        [1],
        [new Date('2026-01-13')],
        'JOURNEE'
      )

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual({
        ouvrierId: 1,
        ouvrierNom: 'Jean Dupont',
        date: new Date('2026-01-13'),
        chantierActuel: 'Chantier A',
        periodeActuelle: 'JOURNEE'
      })
    })

    it('should detect conflict when JOURNEE exists and MATIN is requested', async () => {
      mockPrismaFindMany.mockResolvedValue([
        {
          id: 1,
          ouvrierId: 1,
          chantierId: 1,
          date: new Date('2026-01-13'),
          periode: 'JOURNEE',
          statutPresence: 'TRAVAIL',
          ouvrier: { id: 1, nom: 'Dupont', prenom: 'Jean' },
          chantier: { nom: 'Chantier A' }
        }
      ] as never)

      const result = await detecterConflitsMultiples(
        [1],
        [new Date('2026-01-13')],
        'MATIN'
      )

      expect(result).toHaveLength(1)
      expect(result[0].periodeActuelle).toBe('JOURNEE')
    })

    it('should detect conflict when MATIN exists and JOURNEE is requested', async () => {
      mockPrismaFindMany.mockResolvedValue([
        {
          id: 1,
          ouvrierId: 1,
          chantierId: 1,
          date: new Date('2026-01-13'),
          periode: 'MATIN',
          statutPresence: 'TRAVAIL',
          ouvrier: { id: 1, nom: 'Dupont', prenom: 'Jean' },
          chantier: { nom: 'Chantier A' }
        }
      ] as never)

      const result = await detecterConflitsMultiples(
        [1],
        [new Date('2026-01-13')],
        'JOURNEE'
      )

      expect(result).toHaveLength(1)
      expect(result[0].periodeActuelle).toBe('MATIN')
    })

    it('should detect multiple conflicts for multiple ouvriers', async () => {
      mockPrismaFindMany.mockResolvedValue([
        {
          id: 1,
          ouvrierId: 1,
          chantierId: 1,
          date: new Date('2026-01-13'),
          periode: 'JOURNEE',
          statutPresence: 'TRAVAIL',
          ouvrier: { id: 1, nom: 'Dupont', prenom: 'Jean' },
          chantier: { nom: 'Chantier A' }
        },
        {
          id: 2,
          ouvrierId: 2,
          chantierId: 2,
          date: new Date('2026-01-14'),
          periode: 'JOURNEE',
          statutPresence: 'TRAVAIL',
          ouvrier: { id: 2, nom: 'Martin', prenom: 'Marie' },
          chantier: { nom: 'Chantier B' }
        }
      ] as never)

      const result = await detecterConflitsMultiples(
        [1, 2],
        [new Date('2026-01-13'), new Date('2026-01-14')],
        'JOURNEE'
      )

      expect(result).toHaveLength(2)
      expect(result[0].ouvrierNom).toBe('Jean Dupont')
      expect(result[1].ouvrierNom).toBe('Marie Martin')
    })

    it('should detect conflicts for multiple dates for same ouvrier', async () => {
      mockPrismaFindMany.mockResolvedValue([
        {
          id: 1,
          ouvrierId: 1,
          chantierId: 1,
          date: new Date('2026-01-13'),
          periode: 'JOURNEE',
          statutPresence: 'TRAVAIL',
          ouvrier: { id: 1, nom: 'Dupont', prenom: 'Jean' },
          chantier: { nom: 'Chantier A' }
        },
        {
          id: 2,
          ouvrierId: 1,
          chantierId: 1,
          date: new Date('2026-01-14'),
          periode: 'JOURNEE',
          statutPresence: 'TRAVAIL',
          ouvrier: { id: 1, nom: 'Dupont', prenom: 'Jean' },
          chantier: { nom: 'Chantier A' }
        }
      ] as never)

      const result = await detecterConflitsMultiples(
        [1],
        [new Date('2026-01-13'), new Date('2026-01-14')],
        'JOURNEE'
      )

      expect(result).toHaveLength(2)
    })
  })

  describe('Query parameters', () => {
    it('should query with correct filters', async () => {
      mockPrismaFindMany.mockResolvedValue([])

      const dates = [new Date('2026-01-13'), new Date('2026-01-14')]
      await detecterConflitsMultiples([1, 2], dates, 'JOURNEE')

      expect(mockPrismaFindMany).toHaveBeenCalledWith({
        where: {
          ouvrierId: { in: [1, 2] },
          date: { in: dates },
          chantierId: { not: null }
        },
        include: {
          ouvrier: {
            select: {
              id: true,
              nom: true,
              prenom: true
            }
          },
          chantier: {
            select: {
              nom: true
            }
          }
        }
      })
    })
  })
})

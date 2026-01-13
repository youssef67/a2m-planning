import { describe, it, expect, vi, beforeEach } from 'vitest'
import { detecterConflitPeriode } from '@/lib/affectations'
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

describe('detecterConflitPeriode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Pas de conflit', () => {
    it('should return null when no existing affectations', async () => {
      mockPrismaFindMany.mockResolvedValue([])

      const result = await detecterConflitPeriode(1, '2026-01-15', 'JOURNEE')

      expect(result).toBeNull()
    })

    it('should return null when MATIN existante + APRES_MIDI demandée (pas de chevauchement)', async () => {
      mockPrismaFindMany.mockResolvedValue([
        {
          id: 1,
          ouvrierId: 1,
          chantierId: 1,
          date: new Date('2026-01-15'),
          periode: 'MATIN',
          statutPresence: 'TRAVAIL',
          chantier: { id: 1, nom: 'Chantier A' }
        }
      ] as never)

      const result = await detecterConflitPeriode(1, '2026-01-15', 'APRES_MIDI')

      expect(result).toBeNull()
    })

    it('should return null when APRES_MIDI existante + MATIN demandée (pas de chevauchement)', async () => {
      mockPrismaFindMany.mockResolvedValue([
        {
          id: 1,
          ouvrierId: 1,
          chantierId: 1,
          date: new Date('2026-01-15'),
          periode: 'APRES_MIDI',
          statutPresence: 'TRAVAIL',
          chantier: { id: 1, nom: 'Chantier A' }
        }
      ] as never)

      const result = await detecterConflitPeriode(1, '2026-01-15', 'MATIN')

      expect(result).toBeNull()
    })
  })

  describe('JOURNEE existante vers période partielle (JOURNEE_VERS_PARTIEL)', () => {
    it('should detect conflict when JOURNEE existante + MATIN demandée', async () => {
      mockPrismaFindMany.mockResolvedValue([
        {
          id: 1,
          ouvrierId: 1,
          chantierId: 1,
          date: new Date('2026-01-15'),
          periode: 'JOURNEE',
          statutPresence: 'TRAVAIL',
          chantier: { id: 1, nom: 'Chantier A' }
        }
      ] as never)

      const result = await detecterConflitPeriode(1, '2026-01-15', 'MATIN')

      expect(result).not.toBeNull()
      expect(result?.typeConflit).toBe('JOURNEE_VERS_PARTIEL')
      expect(result?.affectationExistante.id).toBe(1)
      expect(result?.affectationExistante.periode).toBe('JOURNEE')
      expect(result?.affectationExistante.chantier.nom).toBe('Chantier A')
    })

    it('should detect conflict when JOURNEE existante + APRES_MIDI demandée', async () => {
      mockPrismaFindMany.mockResolvedValue([
        {
          id: 1,
          ouvrierId: 1,
          chantierId: 1,
          date: new Date('2026-01-15'),
          periode: 'JOURNEE',
          statutPresence: 'TRAVAIL',
          chantier: { id: 1, nom: 'Chantier B' }
        }
      ] as never)

      const result = await detecterConflitPeriode(1, '2026-01-15', 'APRES_MIDI')

      expect(result).not.toBeNull()
      expect(result?.typeConflit).toBe('JOURNEE_VERS_PARTIEL')
      expect(result?.affectationExistante.chantier.nom).toBe('Chantier B')
    })
  })

  describe('Période partielle existante vers JOURNEE (PARTIEL_VERS_JOURNEE)', () => {
    it('should detect conflict when MATIN existante + JOURNEE demandée', async () => {
      mockPrismaFindMany.mockResolvedValue([
        {
          id: 2,
          ouvrierId: 1,
          chantierId: 2,
          date: new Date('2026-01-15'),
          periode: 'MATIN',
          statutPresence: 'TRAVAIL',
          chantier: { id: 2, nom: 'Chantier C' }
        }
      ] as never)

      const result = await detecterConflitPeriode(1, '2026-01-15', 'JOURNEE')

      expect(result).not.toBeNull()
      expect(result?.typeConflit).toBe('PARTIEL_VERS_JOURNEE')
      expect(result?.affectationExistante.id).toBe(2)
      expect(result?.affectationExistante.periode).toBe('MATIN')
      expect(result?.affectationExistante.chantier.nom).toBe('Chantier C')
    })

    it('should detect conflict when APRES_MIDI existante + JOURNEE demandée', async () => {
      mockPrismaFindMany.mockResolvedValue([
        {
          id: 3,
          ouvrierId: 1,
          chantierId: 3,
          date: new Date('2026-01-15'),
          periode: 'APRES_MIDI',
          statutPresence: 'TRAVAIL',
          chantier: { id: 3, nom: 'Chantier D' }
        }
      ] as never)

      const result = await detecterConflitPeriode(1, '2026-01-15', 'JOURNEE')

      expect(result).not.toBeNull()
      expect(result?.typeConflit).toBe('PARTIEL_VERS_JOURNEE')
      expect(result?.affectationExistante.periode).toBe('APRES_MIDI')
    })
  })

  describe('Même période (géré par contrainte DB)', () => {
    it('should return null when même période (contrainte DB gère ce cas)', async () => {
      mockPrismaFindMany.mockResolvedValue([
        {
          id: 1,
          ouvrierId: 1,
          chantierId: 1,
          date: new Date('2026-01-15'),
          periode: 'MATIN',
          statutPresence: 'TRAVAIL',
          chantier: { id: 1, nom: 'Chantier A' }
        }
      ] as never)

      const result = await detecterConflitPeriode(1, '2026-01-15', 'MATIN')

      expect(result).toBeNull()
    })
  })

  describe('Date handling', () => {
    it('should accept string date format', async () => {
      mockPrismaFindMany.mockResolvedValue([])

      await detecterConflitPeriode(1, '2026-01-15', 'JOURNEE')

      expect(mockPrismaFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            ouvrierId: 1,
            date: new Date('2026-01-15')
          })
        })
      )
    })

    it('should accept Date object', async () => {
      mockPrismaFindMany.mockResolvedValue([])
      const testDate = new Date('2026-01-20')

      await detecterConflitPeriode(1, testDate, 'MATIN')

      expect(mockPrismaFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: testDate
          })
        })
      )
    })
  })

  describe('Query filters', () => {
    it('should only query affectations with chantierId (not indisponibilités)', async () => {
      mockPrismaFindMany.mockResolvedValue([])

      await detecterConflitPeriode(1, '2026-01-15', 'JOURNEE')

      expect(mockPrismaFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            chantierId: { not: null }
          })
        })
      )
    })
  })
})

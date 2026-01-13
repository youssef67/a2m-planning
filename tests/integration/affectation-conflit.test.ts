import { describe, it, expect, vi, beforeEach } from 'vitest'
import { verifierConflitAffectation, modifierPeriodeAffectation } from '@/actions/affectations'
import { prisma } from '@/lib/prisma'

// Mock auth
vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ userId: 1 })
}))

// Mock revalidateTag
vi.mock('next/cache', () => ({
  revalidateTag: vi.fn()
}))

// Mock logModification
vi.mock('@/lib/historique', () => ({
  logModification: vi.fn().mockResolvedValue(undefined)
}))

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    affectation: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn()
    }
  }
}))

const mockFindMany = vi.mocked(prisma.affectation.findMany)
const mockFindFirst = vi.mocked(prisma.affectation.findFirst)
const mockFindUnique = vi.mocked(prisma.affectation.findUnique)
const mockUpdate = vi.mocked(prisma.affectation.update)

describe('Gestion des conflits de période (Story 2.11)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('verifierConflitAffectation', () => {
    it('should return null when no conflict exists', async () => {
      mockFindMany.mockResolvedValue([])

      const result = await verifierConflitAffectation(1, '2026-01-15', 'JOURNEE')

      expect(result.conflit).toBeNull()
    })

    it('should detect conflict when JOURNEE exists and MATIN is requested', async () => {
      mockFindMany.mockResolvedValue([
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

      const result = await verifierConflitAffectation(1, '2026-01-15', 'MATIN')

      expect(result.conflit).not.toBeNull()
      expect(result.conflit?.typeConflit).toBe('JOURNEE_VERS_PARTIEL')
      expect(result.conflit?.affectationExistante.chantier.nom).toBe('Chantier A')
    })

    it('should detect conflict when MATIN exists and JOURNEE is requested', async () => {
      mockFindMany.mockResolvedValue([
        {
          id: 2,
          ouvrierId: 1,
          chantierId: 2,
          date: new Date('2026-01-15'),
          periode: 'MATIN',
          statutPresence: 'TRAVAIL',
          chantier: { id: 2, nom: 'Chantier B' }
        }
      ] as never)

      const result = await verifierConflitAffectation(1, '2026-01-15', 'JOURNEE')

      expect(result.conflit).not.toBeNull()
      expect(result.conflit?.typeConflit).toBe('PARTIEL_VERS_JOURNEE')
    })

    it('should not detect conflict when MATIN exists and APRES_MIDI is requested', async () => {
      mockFindMany.mockResolvedValue([
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

      const result = await verifierConflitAffectation(1, '2026-01-15', 'APRES_MIDI')

      expect(result.conflit).toBeNull()
    })
  })

  describe('modifierPeriodeAffectation (conflict resolution)', () => {
    it('should successfully modify period when no other conflicts', async () => {
      const existingAffectation = {
        id: 1,
        ouvrierId: 1,
        chantierId: 1,
        date: new Date('2026-01-15'),
        periode: 'JOURNEE',
        statutPresence: 'TRAVAIL'
      }

      mockFindUnique.mockResolvedValue(existingAffectation as never)
      mockFindFirst.mockResolvedValue(null) // No conflicts
      mockUpdate.mockResolvedValue({
        ...existingAffectation,
        periode: 'MATIN'
      } as never)

      const result = await modifierPeriodeAffectation(1, 'MATIN')

      expect(result).toHaveProperty('success', true)
      expect(result).toHaveProperty('affectation')
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { periode: 'MATIN' }
      })
    })

    it('should return error when affectation does not exist', async () => {
      mockFindUnique.mockResolvedValue(null)

      const result = await modifierPeriodeAffectation(999, 'MATIN')

      expect(result).toHaveProperty('error', "L'affectation n'existe pas")
    })

    it('should return error when there is a conflict with another affectation', async () => {
      mockFindUnique.mockResolvedValue({
        id: 1,
        ouvrierId: 1,
        chantierId: 1,
        date: new Date('2026-01-15'),
        periode: 'JOURNEE',
        statutPresence: 'TRAVAIL'
      } as never)

      mockFindFirst.mockResolvedValue({
        id: 2,
        ouvrierId: 1,
        chantierId: 2,
        date: new Date('2026-01-15'),
        periode: 'MATIN',
        statutPresence: 'TRAVAIL'
      } as never)

      const result = await modifierPeriodeAffectation(1, 'MATIN')

      expect(result).toHaveProperty('error', 'Une affectation existe déjà pour cette période')
    })

    it('should return error when ouvrier has indisponibilité for the target period', async () => {
      mockFindUnique.mockResolvedValue({
        id: 1,
        ouvrierId: 1,
        chantierId: 1,
        date: new Date('2026-01-15'),
        periode: 'JOURNEE',
        statutPresence: 'TRAVAIL'
      } as never)

      // First findFirst: no direct period conflict
      mockFindFirst
        .mockResolvedValueOnce(null)
        // Second findFirst: indisponibilité found
        .mockResolvedValueOnce({
          id: 3,
          ouvrierId: 1,
          chantierId: null,
          date: new Date('2026-01-15'),
          periode: 'MATIN',
          statutPresence: 'MALADIE'
        } as never)

      const result = await modifierPeriodeAffectation(1, 'MATIN')

      expect(result).toHaveProperty('error', "L'ouvrier est indisponible pour cette période")
    })
  })

  describe('Full workflow: Conflict detection → Modal → Modification', () => {
    it('should complete full workflow for JOURNEE → MATIN modification', async () => {
      // Step 1: Detect conflict
      mockFindMany.mockResolvedValue([
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

      const conflictResult = await verifierConflitAffectation(1, '2026-01-15', 'MATIN')

      expect(conflictResult.conflit).not.toBeNull()
      expect(conflictResult.conflit?.affectationExistante.id).toBe(1)

      // Step 2: User confirms modification
      mockFindUnique.mockResolvedValue({
        id: 1,
        ouvrierId: 1,
        chantierId: 1,
        date: new Date('2026-01-15'),
        periode: 'JOURNEE',
        statutPresence: 'TRAVAIL'
      } as never)
      mockFindFirst.mockResolvedValue(null)
      mockUpdate.mockResolvedValue({
        id: 1,
        ouvrierId: 1,
        chantierId: 1,
        date: new Date('2026-01-15'),
        periode: 'MATIN',
        statutPresence: 'TRAVAIL'
      } as never)

      const modifyResult = await modifierPeriodeAffectation(1, 'MATIN')

      expect(modifyResult).toHaveProperty('success', true)
      expect((modifyResult as { affectation: { periode: string } }).affectation.periode).toBe('MATIN')
    })
  })
})

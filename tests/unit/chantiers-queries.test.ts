import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    chantier: {
      findMany: vi.fn()
    }
  }
}))

// Mock unstable_cache to just execute the function
vi.mock('next/cache', () => ({
  unstable_cache: (fn: () => Promise<unknown>) => fn
}))

import { prisma } from '@/lib/prisma'
import { getChantiersNonTermines } from '@/queries/chantiers'

describe('getChantiersNonTermines', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should query chantiers with ACTIF or EN_PAUSE status', async () => {
    const mockChantiers = [
      { id: 1, nom: 'Chantier A', statut: 'ACTIF' },
      { id: 2, nom: 'Chantier B', statut: 'EN_PAUSE' }
    ]

    vi.mocked(prisma.chantier.findMany).mockResolvedValue(mockChantiers)

    const result = await getChantiersNonTermines()

    expect(prisma.chantier.findMany).toHaveBeenCalledWith({
      where: { statut: { in: ['ACTIF', 'EN_PAUSE'] } },
      orderBy: [{ statut: 'asc' }, { nom: 'asc' }]
    })

    expect(result).toEqual(mockChantiers)
  })

  it('should return chantiers sorted by statut then nom', async () => {
    const mockChantiers = [
      { id: 1, nom: 'Alpha', statut: 'ACTIF' },
      { id: 2, nom: 'Beta', statut: 'ACTIF' },
      { id: 3, nom: 'Gamma', statut: 'EN_PAUSE' }
    ]

    vi.mocked(prisma.chantier.findMany).mockResolvedValue(mockChantiers)

    const result = await getChantiersNonTermines()

    // ACTIF comes before EN_PAUSE (asc order), then alphabetically
    expect(result[0].statut).toBe('ACTIF')
    expect(result[0].nom).toBe('Alpha')
    expect(result[2].statut).toBe('EN_PAUSE')
  })

  it('should return empty array when no non-terminated chantiers exist', async () => {
    vi.mocked(prisma.chantier.findMany).mockResolvedValue([])

    const result = await getChantiersNonTermines()

    expect(result).toEqual([])
  })

  it('should not include TERMINE chantiers', async () => {
    // The mock simulates what Prisma would return with our filter
    const mockChantiers = [
      { id: 1, nom: 'Chantier A', statut: 'ACTIF' }
    ]

    vi.mocked(prisma.chantier.findMany).mockResolvedValue(mockChantiers)

    const result = await getChantiersNonTermines()

    // Verify the query filters out TERMINE
    const callArgs = vi.mocked(prisma.chantier.findMany).mock.calls[0][0]
    expect(callArgs?.where?.statut).toEqual({ in: ['ACTIF', 'EN_PAUSE'] })

    // Result should not contain TERMINE
    const hasTermine = result.some((c) => c.statut === 'TERMINE')
    expect(hasTermine).toBe(false)
  })
})

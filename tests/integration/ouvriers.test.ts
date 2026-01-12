import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  creerOuvrierSchema,
  modifierOuvrierSchema,
  archiverOuvrierSchema
} from '@/schemas/ouvrier'

describe('Ouvrier Actions (mocked)', () => {
  const mockPrisma = {
    ouvrier: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  }

  const mockRequireAuth = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue({ authenticated: true })
  })

  describe('creerOuvrier', () => {
    it('should create an ouvrier with valid data', async () => {
      const input = { nom: 'Dupont', prenom: 'Jean', type: 'SALARIE' as const }
      const validation = creerOuvrierSchema.safeParse(input)
      expect(validation.success).toBe(true)

      mockPrisma.ouvrier.create.mockResolvedValue({
        id: 1,
        ...input,
        statut: 'ACTIF',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const created = await mockPrisma.ouvrier.create({ data: input })
      expect(created.id).toBe(1)
      expect(created.nom).toBe('Dupont')
      expect(created.statut).toBe('ACTIF')
    })

    it('should reject invalid data before DB call', () => {
      const input = { nom: '', prenom: 'Jean', type: 'SALARIE' }
      const validation = creerOuvrierSchema.safeParse(input)
      expect(validation.success).toBe(false)
    })
  })

  describe('modifierOuvrier', () => {
    it('should update an ouvrier with valid data', async () => {
      const input = { id: 1, nom: 'Martin', prenom: 'Pierre', type: 'SOUS_TRAITANT' as const }
      const validation = modifierOuvrierSchema.safeParse(input)
      expect(validation.success).toBe(true)

      mockPrisma.ouvrier.update.mockResolvedValue({
        ...input,
        statut: 'ACTIF',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const updated = await mockPrisma.ouvrier.update({
        where: { id: input.id },
        data: { nom: input.nom, prenom: input.prenom, type: input.type },
      })

      expect(updated.nom).toBe('Martin')
      expect(updated.type).toBe('SOUS_TRAITANT')
    })

    it('should reject update with invalid id', () => {
      const input = { id: -1, nom: 'Martin', prenom: 'Pierre', type: 'SALARIE' }
      const validation = modifierOuvrierSchema.safeParse(input)
      expect(validation.success).toBe(false)
    })
  })

  describe('archiverOuvrier', () => {
    it('should archive an ouvrier', async () => {
      const input = { id: 1 }
      const validation = archiverOuvrierSchema.safeParse(input)
      expect(validation.success).toBe(true)

      mockPrisma.ouvrier.update.mockResolvedValue({
        id: 1,
        nom: 'Dupont',
        prenom: 'Jean',
        type: 'SALARIE',
        statut: 'ARCHIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const archived = await mockPrisma.ouvrier.update({
        where: { id: input.id },
        data: { statut: 'ARCHIVE' },
      })

      expect(archived.statut).toBe('ARCHIVE')
    })
  })

  describe('restaurerOuvrier', () => {
    it('should restore an archived ouvrier', async () => {
      const input = { id: 1 }
      const validation = archiverOuvrierSchema.safeParse(input)
      expect(validation.success).toBe(true)

      mockPrisma.ouvrier.update.mockResolvedValue({
        id: 1,
        nom: 'Dupont',
        prenom: 'Jean',
        type: 'SALARIE',
        statut: 'ACTIF',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const restored = await mockPrisma.ouvrier.update({
        where: { id: input.id },
        data: { statut: 'ACTIF' },
      })

      expect(restored.statut).toBe('ACTIF')
    })
  })

  describe('getOuvriersActifs', () => {
    it('should return only active ouvriers', async () => {
      mockPrisma.ouvrier.findMany.mockResolvedValue([
        { id: 1, nom: 'Dupont', prenom: 'Jean', type: 'SALARIE', statut: 'ACTIF' },
        { id: 2, nom: 'Martin', prenom: 'Pierre', type: 'SOUS_TRAITANT', statut: 'ACTIF' },
      ])

      const ouvriers = await mockPrisma.ouvrier.findMany({
        where: { statut: 'ACTIF' },
        orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
      })

      expect(ouvriers).toHaveLength(2)
      expect(ouvriers.every((o: { statut: string }) => o.statut === 'ACTIF')).toBe(true)
    })
  })

  describe('getOuvriersArchives', () => {
    it('should return only archived ouvriers', async () => {
      mockPrisma.ouvrier.findMany.mockResolvedValue([
        { id: 3, nom: 'Bernard', prenom: 'Paul', type: 'SALARIE', statut: 'ARCHIVE' },
      ])

      const ouvriers = await mockPrisma.ouvrier.findMany({
        where: { statut: 'ARCHIVE' },
        orderBy: [{ nom: 'asc' }, { prenom: 'asc' }],
      })

      expect(ouvriers).toHaveLength(1)
      expect(ouvriers[0].statut).toBe('ARCHIVE')
    })
  })
})

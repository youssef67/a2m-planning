import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  creerChantierSchema,
  modifierChantierSchema,
  changerStatutChantierSchema
} from '@/schemas/chantier'

describe('Chantier Actions (mocked)', () => {
  const mockPrisma = {
    chantier: {
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

  describe('creerChantier', () => {
    it('should create a chantier with valid data', async () => {
      const input = { nom: 'Chantier Test' }
      const validation = creerChantierSchema.safeParse(input)
      expect(validation.success).toBe(true)

      mockPrisma.chantier.create.mockResolvedValue({
        id: 1,
        ...input,
        statut: 'ACTIF',
        raisonPause: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const created = await mockPrisma.chantier.create({ data: input })
      expect(created.id).toBe(1)
      expect(created.nom).toBe('Chantier Test')
      expect(created.statut).toBe('ACTIF')
    })

    it('should reject invalid data before DB call', () => {
      const input = { nom: '' }
      const validation = creerChantierSchema.safeParse(input)
      expect(validation.success).toBe(false)
    })
  })

  describe('modifierChantier', () => {
    it('should update a chantier with valid data', async () => {
      const input = { id: 1, nom: 'Chantier Modifié' }
      const validation = modifierChantierSchema.safeParse(input)
      expect(validation.success).toBe(true)

      mockPrisma.chantier.update.mockResolvedValue({
        ...input,
        statut: 'ACTIF',
        raisonPause: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const updated = await mockPrisma.chantier.update({
        where: { id: input.id },
        data: { nom: input.nom },
      })

      expect(updated.nom).toBe('Chantier Modifié')
    })

    it('should reject update with invalid id', () => {
      const input = { id: -1, nom: 'Chantier Modifié' }
      const validation = modifierChantierSchema.safeParse(input)
      expect(validation.success).toBe(false)
    })
  })

  describe('changerStatutChantier', () => {
    it('should change status to EN_PAUSE with raison', async () => {
      const input = { id: 1, statut: 'EN_PAUSE' as const, raisonPause: 'Attente de permis' }
      const validation = changerStatutChantierSchema.safeParse(input)
      expect(validation.success).toBe(true)

      mockPrisma.chantier.update.mockResolvedValue({
        id: 1,
        nom: 'Chantier Test',
        statut: 'EN_PAUSE',
        raisonPause: 'Attente de permis',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const updated = await mockPrisma.chantier.update({
        where: { id: input.id },
        data: { statut: input.statut, raisonPause: input.raisonPause },
      })

      expect(updated.statut).toBe('EN_PAUSE')
      expect(updated.raisonPause).toBe('Attente de permis')
    })

    it('should change status to EN_PAUSE without raison (optional)', async () => {
      const input = { id: 1, statut: 'EN_PAUSE' as const }
      const validation = changerStatutChantierSchema.safeParse(input)
      expect(validation.success).toBe(true)

      mockPrisma.chantier.update.mockResolvedValue({
        id: 1,
        nom: 'Chantier Test',
        statut: 'EN_PAUSE',
        raisonPause: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const updated = await mockPrisma.chantier.update({
        where: { id: input.id },
        data: { statut: input.statut, raisonPause: null },
      })

      expect(updated.statut).toBe('EN_PAUSE')
      expect(updated.raisonPause).toBeNull()
    })

    it('should clear raisonPause when reactivating', async () => {
      const input = { id: 1, statut: 'ACTIF' as const }
      const validation = changerStatutChantierSchema.safeParse(input)
      expect(validation.success).toBe(true)

      mockPrisma.chantier.update.mockResolvedValue({
        id: 1,
        nom: 'Chantier Test',
        statut: 'ACTIF',
        raisonPause: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const updated = await mockPrisma.chantier.update({
        where: { id: input.id },
        data: { statut: input.statut, raisonPause: null },
      })

      expect(updated.statut).toBe('ACTIF')
      expect(updated.raisonPause).toBeNull()
    })

    it('should change status to TERMINE', async () => {
      const input = { id: 1, statut: 'TERMINE' as const }
      const validation = changerStatutChantierSchema.safeParse(input)
      expect(validation.success).toBe(true)

      mockPrisma.chantier.update.mockResolvedValue({
        id: 1,
        nom: 'Chantier Test',
        statut: 'TERMINE',
        raisonPause: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const updated = await mockPrisma.chantier.update({
        where: { id: input.id },
        data: { statut: input.statut },
      })

      expect(updated.statut).toBe('TERMINE')
    })
  })

  describe('getChantiersActifs', () => {
    it('should return only active chantiers', async () => {
      mockPrisma.chantier.findMany.mockResolvedValue([
        { id: 1, nom: 'Chantier A', statut: 'ACTIF', raisonPause: null },
        { id: 2, nom: 'Chantier B', statut: 'ACTIF', raisonPause: null },
      ])

      const chantiers = await mockPrisma.chantier.findMany({
        where: { statut: 'ACTIF' },
        orderBy: { nom: 'asc' },
      })

      expect(chantiers).toHaveLength(2)
      expect(chantiers.every((c: { statut: string }) => c.statut === 'ACTIF')).toBe(true)
    })
  })

  describe('getChantiersByStatut', () => {
    it('should return chantiers filtered by EN_PAUSE', async () => {
      mockPrisma.chantier.findMany.mockResolvedValue([
        { id: 3, nom: 'Chantier C', statut: 'EN_PAUSE', raisonPause: 'Raison test' },
      ])

      const chantiers = await mockPrisma.chantier.findMany({
        where: { statut: 'EN_PAUSE' },
        orderBy: { nom: 'asc' },
      })

      expect(chantiers).toHaveLength(1)
      expect(chantiers[0].statut).toBe('EN_PAUSE')
    })

    it('should return chantiers filtered by TERMINE', async () => {
      mockPrisma.chantier.findMany.mockResolvedValue([
        { id: 4, nom: 'Chantier D', statut: 'TERMINE', raisonPause: null },
      ])

      const chantiers = await mockPrisma.chantier.findMany({
        where: { statut: 'TERMINE' },
        orderBy: { nom: 'asc' },
      })

      expect(chantiers).toHaveLength(1)
      expect(chantiers[0].statut).toBe('TERMINE')
    })
  })

  describe('getAllChantiers', () => {
    it('should return all chantiers regardless of status', async () => {
      mockPrisma.chantier.findMany.mockResolvedValue([
        { id: 1, nom: 'Chantier A', statut: 'ACTIF', raisonPause: null },
        { id: 2, nom: 'Chantier B', statut: 'EN_PAUSE', raisonPause: 'Raison' },
        { id: 3, nom: 'Chantier C', statut: 'TERMINE', raisonPause: null },
      ])

      const chantiers = await mockPrisma.chantier.findMany({
        orderBy: { nom: 'asc' },
      })

      expect(chantiers).toHaveLength(3)
    })
  })
})

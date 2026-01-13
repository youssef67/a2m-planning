import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/cache before importing the actions
vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn()
}))

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    affectation: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn()
    },
    ouvrier: {
      findUnique: vi.fn(),
      findMany: vi.fn()
    },
    chantier: {
      findUnique: vi.fn()
    },
    $transaction: vi.fn()
  }
}))

vi.mock('@/lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ authenticated: true })
}))

vi.mock('@/lib/historique', () => ({
  logModification: vi.fn().mockResolvedValue(undefined)
}))

vi.mock('@/lib/affectations', () => ({
  detecterConflitPeriode: vi.fn().mockResolvedValue(null)
}))

import { revalidateTag, revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import {
  creerAffectation,
  creerIndisponibilite,
  modifierIndisponibilite,
  supprimerIndisponibilite,
  reassignerAffectation,
  modifierPeriodeAffectation,
  supprimerAffectation,
  convertirEnIndisponibilite,
  creerAffectationsEnMasse
} from '@/actions/affectations'

describe('Synchronisation Cross-Vue - Story 3.2', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockOuvrier = {
    id: 1,
    nom: 'Dupont',
    prenom: 'Jean',
    type: 'SALARIE',
    statut: 'ACTIF',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const mockChantier = {
    id: 1,
    nom: 'Chantier A',
    statut: 'ACTIF',
    createdAt: new Date(),
    updatedAt: new Date(),
    raisonPause: null
  }

  const mockAffectation = {
    id: 1,
    ouvrierId: 1,
    chantierId: 1,
    date: new Date('2026-01-15'),
    periode: 'JOURNEE',
    statutPresence: 'TRAVAIL',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  describe('revalidatePlanningViews est appelé après chaque mutation', () => {
    it('creerAffectation invalide les 3 vues planning (AC: 1)', async () => {
      vi.mocked(prisma.ouvrier.findUnique).mockResolvedValue(mockOuvrier as never)
      vi.mocked(prisma.chantier.findUnique).mockResolvedValue(mockChantier as never)
      vi.mocked(prisma.affectation.create).mockResolvedValue(mockAffectation as never)

      const formData = new FormData()
      formData.set('ouvrierId', '1')
      formData.set('chantierId', '1')
      formData.set('date', '2026-01-15')
      formData.set('periode', 'JOURNEE')

      const result = await creerAffectation(formData)

      expect(result).toHaveProperty('success', true)
      expect(revalidateTag).toHaveBeenCalledWith('affectations', 'max')
      expect(revalidateTag).toHaveBeenCalledWith('chantiers', 'max')
      expect(revalidatePath).toHaveBeenCalledWith('/planning/comptage')
      expect(revalidatePath).toHaveBeenCalledWith('/planning/chantier')
      expect(revalidatePath).toHaveBeenCalledWith('/planning/ouvrier')
    })

    it('creerIndisponibilite invalide les 3 vues planning (AC: 2)', async () => {
      vi.mocked(prisma.ouvrier.findUnique).mockResolvedValue(mockOuvrier as never)
      vi.mocked(prisma.affectation.create).mockResolvedValue({
        ...mockAffectation,
        chantierId: null,
        statutPresence: 'CONGE_PAYE'
      } as never)

      const formData = new FormData()
      formData.set('ouvrierId', '1')
      formData.set('date', '2026-01-15')
      formData.set('periode', 'JOURNEE')
      formData.set('statutPresence', 'CONGE_PAYE')

      const result = await creerIndisponibilite(formData)

      expect(result).toHaveProperty('success', true)
      expect(revalidateTag).toHaveBeenCalledWith('affectations', 'max')
      expect(revalidatePath).toHaveBeenCalledWith('/planning/comptage')
      expect(revalidatePath).toHaveBeenCalledWith('/planning/chantier')
      expect(revalidatePath).toHaveBeenCalledWith('/planning/ouvrier')
    })

    it('modifierIndisponibilite invalide les 3 vues planning (AC: 3)', async () => {
      const indisponibilite = {
        ...mockAffectation,
        chantierId: null,
        statutPresence: 'CONGE_PAYE'
      }
      vi.mocked(prisma.affectation.findUnique).mockResolvedValue(indisponibilite as never)
      vi.mocked(prisma.affectation.update).mockResolvedValue({
        ...indisponibilite,
        statutPresence: 'MALADIE'
      } as never)

      const formData = new FormData()
      formData.set('periode', 'JOURNEE')
      formData.set('statutPresence', 'MALADIE')

      const result = await modifierIndisponibilite(1, formData)

      expect(result).toHaveProperty('success', true)
      expect(revalidateTag).toHaveBeenCalledWith('affectations', 'max')
      expect(revalidatePath).toHaveBeenCalledWith('/planning/comptage')
      expect(revalidatePath).toHaveBeenCalledWith('/planning/chantier')
      expect(revalidatePath).toHaveBeenCalledWith('/planning/ouvrier')
    })

    it('supprimerIndisponibilite invalide les 3 vues planning (AC: 4)', async () => {
      const indisponibilite = {
        ...mockAffectation,
        chantierId: null,
        statutPresence: 'CONGE_PAYE'
      }
      vi.mocked(prisma.affectation.findUnique).mockResolvedValue(indisponibilite as never)
      vi.mocked(prisma.affectation.delete).mockResolvedValue(indisponibilite as never)

      const result = await supprimerIndisponibilite(1)

      expect(result).toHaveProperty('success', true)
      expect(revalidateTag).toHaveBeenCalledWith('affectations', 'max')
      expect(revalidatePath).toHaveBeenCalledWith('/planning/comptage')
      expect(revalidatePath).toHaveBeenCalledWith('/planning/chantier')
      expect(revalidatePath).toHaveBeenCalledWith('/planning/ouvrier')
    })

    it('reassignerAffectation invalide les 3 vues planning (AC: 5)', async () => {
      vi.mocked(prisma.affectation.findUnique).mockResolvedValue(mockAffectation as never)
      vi.mocked(prisma.chantier.findUnique).mockResolvedValue({ ...mockChantier, id: 2 } as never)
      vi.mocked(prisma.affectation.update).mockResolvedValue({
        ...mockAffectation,
        chantierId: 2
      } as never)

      const result = await reassignerAffectation(1, 2)

      expect(result).toHaveProperty('success', true)
      expect(revalidateTag).toHaveBeenCalledWith('affectations', 'max')
      expect(revalidatePath).toHaveBeenCalledWith('/planning/comptage')
      expect(revalidatePath).toHaveBeenCalledWith('/planning/chantier')
      expect(revalidatePath).toHaveBeenCalledWith('/planning/ouvrier')
    })

    it('modifierPeriodeAffectation invalide les 3 vues planning (AC: 3)', async () => {
      vi.mocked(prisma.affectation.findUnique).mockResolvedValue(mockAffectation as never)
      vi.mocked(prisma.affectation.findFirst).mockResolvedValue(null as never)
      vi.mocked(prisma.affectation.update).mockResolvedValue({
        ...mockAffectation,
        periode: 'MATIN'
      } as never)

      const result = await modifierPeriodeAffectation(1, 'MATIN')

      expect(result).toHaveProperty('success', true)
      expect(revalidateTag).toHaveBeenCalledWith('affectations', 'max')
      expect(revalidatePath).toHaveBeenCalledWith('/planning/comptage')
      expect(revalidatePath).toHaveBeenCalledWith('/planning/chantier')
      expect(revalidatePath).toHaveBeenCalledWith('/planning/ouvrier')
    })

    it('supprimerAffectation invalide les 3 vues planning (AC: 4)', async () => {
      vi.mocked(prisma.affectation.findUnique).mockResolvedValue(mockAffectation as never)
      vi.mocked(prisma.affectation.delete).mockResolvedValue(mockAffectation as never)

      const result = await supprimerAffectation(1)

      expect(result).toHaveProperty('success', true)
      expect(revalidateTag).toHaveBeenCalledWith('affectations', 'max')
      expect(revalidatePath).toHaveBeenCalledWith('/planning/comptage')
      expect(revalidatePath).toHaveBeenCalledWith('/planning/chantier')
      expect(revalidatePath).toHaveBeenCalledWith('/planning/ouvrier')
    })

    it('convertirEnIndisponibilite invalide les 3 vues planning (AC: 3)', async () => {
      vi.mocked(prisma.affectation.findUnique).mockResolvedValue(mockAffectation as never)
      vi.mocked(prisma.affectation.update).mockResolvedValue({
        ...mockAffectation,
        chantierId: null,
        statutPresence: 'MALADIE'
      } as never)

      const result = await convertirEnIndisponibilite(1, 'MALADIE')

      expect(result).toHaveProperty('success', true)
      expect(revalidateTag).toHaveBeenCalledWith('affectations', 'max')
      expect(revalidatePath).toHaveBeenCalledWith('/planning/comptage')
      expect(revalidatePath).toHaveBeenCalledWith('/planning/chantier')
      expect(revalidatePath).toHaveBeenCalledWith('/planning/ouvrier')
    })

    it('creerAffectationsEnMasse invalide les 3 vues planning (AC: 1, 2)', async () => {
      vi.mocked(prisma.chantier.findUnique).mockResolvedValue(mockChantier as never)
      vi.mocked(prisma.ouvrier.findMany).mockResolvedValue([mockOuvrier] as never)
      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        return callback({
          affectation: {
            deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
            createMany: vi.fn().mockResolvedValue({ count: 1 })
          }
        })
      })

      const result = await creerAffectationsEnMasse({
        ouvrierIds: [1],
        chantierId: 1,
        dates: ['2026-01-15'],
        periode: 'JOURNEE'
      })

      expect(result).toHaveProperty('success', true)
      expect(revalidateTag).toHaveBeenCalledWith('affectations', 'max')
      expect(revalidateTag).toHaveBeenCalledWith('chantiers', 'max')
      expect(revalidatePath).toHaveBeenCalledWith('/planning/comptage')
      expect(revalidatePath).toHaveBeenCalledWith('/planning/chantier')
      expect(revalidatePath).toHaveBeenCalledWith('/planning/ouvrier')
    })
  })

  describe('Synchronisation Vue Chantier <-> Vue Comptage (AC: 1)', () => {
    it('après création sur Vue Chantier, le cache Comptage est invalidé', async () => {
      vi.mocked(prisma.ouvrier.findUnique).mockResolvedValue(mockOuvrier as never)
      vi.mocked(prisma.chantier.findUnique).mockResolvedValue(mockChantier as never)
      vi.mocked(prisma.affectation.create).mockResolvedValue(mockAffectation as never)

      const formData = new FormData()
      formData.set('ouvrierId', '1')
      formData.set('chantierId', '1')
      formData.set('date', '2026-01-15')
      formData.set('periode', 'JOURNEE')

      await creerAffectation(formData)

      // Vérifie que /planning/comptage est invalidé pour permettre la synchro cross-vue
      expect(revalidatePath).toHaveBeenCalledWith('/planning/comptage')
    })
  })

  describe('Synchronisation Vue Ouvrier <-> Vue Comptage (AC: 2)', () => {
    it('après création indisponibilité sur Vue Ouvrier, le cache Comptage est invalidé', async () => {
      vi.mocked(prisma.ouvrier.findUnique).mockResolvedValue(mockOuvrier as never)
      vi.mocked(prisma.affectation.create).mockResolvedValue({
        ...mockAffectation,
        chantierId: null,
        statutPresence: 'CONGE_PAYE'
      } as never)

      const formData = new FormData()
      formData.set('ouvrierId', '1')
      formData.set('date', '2026-01-15')
      formData.set('periode', 'JOURNEE')
      formData.set('statutPresence', 'CONGE_PAYE')

      await creerIndisponibilite(formData)

      // Vérifie que /planning/comptage est invalidé pour permettre la synchro cross-vue
      expect(revalidatePath).toHaveBeenCalledWith('/planning/comptage')
    })
  })

  describe('Modification de statut reflétée dans toutes les vues (AC: 3)', () => {
    it('changement PRESENT -> CONGE_PAYE invalide toutes les vues', async () => {
      vi.mocked(prisma.affectation.findUnique).mockResolvedValue(mockAffectation as never)
      vi.mocked(prisma.affectation.update).mockResolvedValue({
        ...mockAffectation,
        chantierId: null,
        statutPresence: 'CONGE_PAYE'
      } as never)

      const result = await convertirEnIndisponibilite(1, 'CONGE_PAYE')

      expect(result).toHaveProperty('success', true)
      // Toutes les vues doivent être invalidées
      expect(revalidatePath).toHaveBeenCalledWith('/planning/comptage')
      expect(revalidatePath).toHaveBeenCalledWith('/planning/chantier')
      expect(revalidatePath).toHaveBeenCalledWith('/planning/ouvrier')
    })
  })

  describe('Suppression reflétée dans toutes les vues (AC: 4)', () => {
    it('suppression affectation invalide toutes les vues', async () => {
      vi.mocked(prisma.affectation.findUnique).mockResolvedValue(mockAffectation as never)
      vi.mocked(prisma.affectation.delete).mockResolvedValue(mockAffectation as never)

      const result = await supprimerAffectation(1)

      expect(result).toHaveProperty('success', true)
      // Toutes les vues doivent être invalidées
      expect(revalidatePath).toHaveBeenCalledWith('/planning/comptage')
      expect(revalidatePath).toHaveBeenCalledWith('/planning/chantier')
      expect(revalidatePath).toHaveBeenCalledWith('/planning/ouvrier')
    })
  })
})

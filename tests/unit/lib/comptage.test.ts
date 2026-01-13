import { describe, it, expect } from 'vitest'
import { calculerStatistiquesMois, calculerStatistiquesAnnee, type AffectationComptage } from '@/lib/comptage'

describe('calculerStatistiquesMois', () => {
  describe('Sans affectation', () => {
    it('retourne 0 partout quand aucune affectation', () => {
      const result = calculerStatistiquesMois([], 1, 2026)

      expect(result).toEqual({
        joursTravailles: 0,
        conges: 0,
        absences: 0
      })
    })
  })

  describe('Jours travaillés', () => {
    it('compte une journée complète de travail', () => {
      const affectations: AffectationComptage[] = [
        {
          date: new Date('2026-01-15'),
          periode: 'JOURNEE',
          statutPresence: 'TRAVAIL',
          chantier: { id: 1 }
        }
      ]

      const result = calculerStatistiquesMois(affectations, 1, 2026)

      expect(result.joursTravailles).toBe(1)
    })

    it('compte une demi-journée (MATIN) comme 0.5', () => {
      const affectations: AffectationComptage[] = [
        {
          date: new Date('2026-01-15'),
          periode: 'MATIN',
          statutPresence: 'TRAVAIL',
          chantier: { id: 1 }
        }
      ]

      const result = calculerStatistiquesMois(affectations, 1, 2026)

      expect(result.joursTravailles).toBe(0.5)
    })

    it('compte une demi-journée (APRES_MIDI) comme 0.5', () => {
      const affectations: AffectationComptage[] = [
        {
          date: new Date('2026-01-15'),
          periode: 'APRES_MIDI',
          statutPresence: 'TRAVAIL',
          chantier: { id: 1 }
        }
      ]

      const result = calculerStatistiquesMois(affectations, 1, 2026)

      expect(result.joursTravailles).toBe(0.5)
    })
  })

  describe('Congés', () => {
    it('compte les congés payés', () => {
      const affectations: AffectationComptage[] = [
        {
          date: new Date('2026-01-15'),
          periode: 'JOURNEE',
          statutPresence: 'CONGE_PAYE',
          chantier: null
        }
      ]

      const result = calculerStatistiquesMois(affectations, 1, 2026)

      expect(result.conges).toBe(1)
      expect(result.joursTravailles).toBe(0)
    })

    it('compte les demi-journées de congé comme 0.5', () => {
      const affectations: AffectationComptage[] = [
        {
          date: new Date('2026-01-15'),
          periode: 'MATIN',
          statutPresence: 'CONGE_PAYE',
          chantier: null
        }
      ]

      const result = calculerStatistiquesMois(affectations, 1, 2026)

      expect(result.conges).toBe(0.5)
    })
  })

  describe('Absences', () => {
    it('compte les absences', () => {
      const affectations: AffectationComptage[] = [
        {
          date: new Date('2026-01-15'),
          periode: 'JOURNEE',
          statutPresence: 'ABSENCE',
          chantier: null
        }
      ]

      const result = calculerStatistiquesMois(affectations, 1, 2026)

      expect(result.absences).toBe(1)
    })

    it('compte les maladies comme absences', () => {
      const affectations: AffectationComptage[] = [
        {
          date: new Date('2026-01-15'),
          periode: 'JOURNEE',
          statutPresence: 'MALADIE',
          chantier: null
        }
      ]

      const result = calculerStatistiquesMois(affectations, 1, 2026)

      expect(result.absences).toBe(1)
    })

    it('compte les formations comme absences', () => {
      const affectations: AffectationComptage[] = [
        {
          date: new Date('2026-01-15'),
          periode: 'JOURNEE',
          statutPresence: 'FORMATION',
          chantier: null
        }
      ]

      const result = calculerStatistiquesMois(affectations, 1, 2026)

      expect(result.absences).toBe(1)
    })
  })

  describe('Mix travail/congés/absences', () => {
    it('calcule correctement un mois avec mix de statuts', () => {
      const affectations: AffectationComptage[] = [
        { date: new Date('2026-01-02'), periode: 'JOURNEE', statutPresence: 'TRAVAIL', chantier: { id: 1 } },
        { date: new Date('2026-01-03'), periode: 'JOURNEE', statutPresence: 'TRAVAIL', chantier: { id: 1 } },
        { date: new Date('2026-01-06'), periode: 'MATIN', statutPresence: 'TRAVAIL', chantier: { id: 1 } },
        { date: new Date('2026-01-06'), periode: 'APRES_MIDI', statutPresence: 'CONGE_PAYE', chantier: null },
        { date: new Date('2026-01-07'), periode: 'JOURNEE', statutPresence: 'MALADIE', chantier: null }
      ]

      const result = calculerStatistiquesMois(affectations, 1, 2026)

      expect(result.joursTravailles).toBe(2.5)
      expect(result.conges).toBe(0.5)
      expect(result.absences).toBe(1)
    })
  })

  describe('Filtrage par mois', () => {
    it('ne compte pas les affectations des autres mois', () => {
      const affectations: AffectationComptage[] = [
        { date: new Date('2026-01-15'), periode: 'JOURNEE', statutPresence: 'TRAVAIL', chantier: { id: 1 } },
        { date: new Date('2026-02-15'), periode: 'JOURNEE', statutPresence: 'TRAVAIL', chantier: { id: 1 } }
      ]

      const result = calculerStatistiquesMois(affectations, 1, 2026)

      expect(result.joursTravailles).toBe(1)
    })

    it('ne compte pas les affectations des autres années', () => {
      const affectations: AffectationComptage[] = [
        { date: new Date('2026-01-15'), periode: 'JOURNEE', statutPresence: 'TRAVAIL', chantier: { id: 1 } },
        { date: new Date('2025-01-15'), periode: 'JOURNEE', statutPresence: 'TRAVAIL', chantier: { id: 1 } }
      ]

      const result = calculerStatistiquesMois(affectations, 1, 2026)

      expect(result.joursTravailles).toBe(1)
    })
  })
})

describe('calculerStatistiquesAnnee', () => {
  it('retourne les statistiques pour les 12 mois', () => {
    const affectations: AffectationComptage[] = []

    const result = calculerStatistiquesAnnee(affectations, 2026)

    expect(Object.keys(result)).toHaveLength(12)
    expect(result[1]).toBeDefined()
    expect(result[12]).toBeDefined()
  })

  it('calcule correctement les stats par mois', () => {
    const affectations: AffectationComptage[] = [
      { date: new Date('2026-01-15'), periode: 'JOURNEE', statutPresence: 'TRAVAIL', chantier: { id: 1 } },
      { date: new Date('2026-03-10'), periode: 'JOURNEE', statutPresence: 'CONGE_PAYE', chantier: null },
      { date: new Date('2026-06-20'), periode: 'MATIN', statutPresence: 'MALADIE', chantier: null }
    ]

    const result = calculerStatistiquesAnnee(affectations, 2026)

    expect(result[1].joursTravailles).toBe(1)
    expect(result[3].conges).toBe(1)
    expect(result[6].absences).toBe(0.5)
    expect(result[2].joursTravailles).toBe(0)
  })
})

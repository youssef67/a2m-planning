import { describe, it, expect } from 'vitest'
import {
  formatPeriode,
  formatPeriodePrint,
  formatChantierNom,
  formatIndisponibilite,
  getThreeWeeksRange
} from '@/lib/print-planning-utils'

describe('formatPeriode', () => {
  it('retourne "Jour" pour JOURNEE', () => {
    expect(formatPeriode('JOURNEE')).toBe('Jour')
  })

  it('retourne "M" pour MATIN', () => {
    expect(formatPeriode('MATIN')).toBe('M')
  })

  it('retourne "AM" pour APRES_MIDI', () => {
    expect(formatPeriode('APRES_MIDI')).toBe('AM')
  })
})

describe('formatPeriodePrint (Story 2.17)', () => {
  it('retourne "" (vide) pour JOURNEE', () => {
    expect(formatPeriodePrint('JOURNEE')).toBe('')
  })

  it('retourne "M" pour MATIN', () => {
    expect(formatPeriodePrint('MATIN')).toBe('M')
  })

  it('retourne "AM" pour APRES_MIDI', () => {
    expect(formatPeriodePrint('APRES_MIDI')).toBe('AM')
  })
})

describe('formatChantierNom', () => {
  it('retourne le nom complet si <= maxLength', () => {
    expect(formatChantierNom('Villa', 15)).toBe('Villa')
  })

  it('retourne le nom complet si exactement maxLength', () => {
    expect(formatChantierNom('Résidence Lyon', 14)).toBe('Résidence Lyon')
  })

  it('tronque avec "…" si > maxLength', () => {
    expect(formatChantierNom('Résidence Les Lilas', 15)).toBe('Résidence Les …')
  })

  it('utilise maxLength=10 par défaut (Story 2.17)', () => {
    expect(formatChantierNom('Résidence Les Lilas')).toBe('Résidence…')
  })

  it('fonctionne avec maxLength personnalisé', () => {
    expect(formatChantierNom('Résidence Les Lilas', 10)).toBe('Résidence…')
  })

  it('gère les noms courts', () => {
    expect(formatChantierNom('A', 15)).toBe('A')
  })

  it('gère les noms vides', () => {
    expect(formatChantierNom('', 15)).toBe('')
  })
})

describe('formatIndisponibilite', () => {
  it('retourne "Congé" pour CONGE', () => {
    expect(formatIndisponibilite('CONGE')).toBe('Congé')
  })

  it('retourne "Maladie" pour MALADIE', () => {
    expect(formatIndisponibilite('MALADIE')).toBe('Maladie')
  })

  it('retourne "Formation" pour FORMATION', () => {
    expect(formatIndisponibilite('FORMATION')).toBe('Formation')
  })

  it('retourne "Absence" pour ABSENCE', () => {
    expect(formatIndisponibilite('ABSENCE')).toBe('Absence')
  })

  it('retourne le statut original si non reconnu', () => {
    expect(formatIndisponibilite('AUTRE')).toBe('AUTRE')
  })
})

describe('getThreeWeeksRange (Story 2.17)', () => {
  it('retourne exactement 3 semaines', () => {
    const weeks = getThreeWeeksRange(new Date('2026-01-13'))
    expect(weeks).toHaveLength(3)
  })

  it('chaque semaine a 7 jours', () => {
    const weeks = getThreeWeeksRange(new Date('2026-01-13'))
    weeks.forEach((week) => {
      expect(week.days).toHaveLength(7)
    })
  })

  it('retourne 21 jours au total', () => {
    const weeks = getThreeWeeksRange(new Date('2026-01-13'))
    const totalDays = weeks.reduce((sum, week) => sum + week.days.length, 0)
    expect(totalDays).toBe(21)
  })

  it('commence au lundi de la semaine donnée', () => {
    // 13 janvier 2026 est un lundi
    const weeks = getThreeWeeksRange(new Date('2026-01-13'))
    const firstDay = weeks[0].days[0]
    expect(firstDay.getDay()).toBe(1) // Lundi
  })

  it('normalise une date milieu de semaine au lundi', () => {
    // 15 janvier 2026 est un mercredi, doit normaliser au 13 janvier (lundi)
    const weeks = getThreeWeeksRange(new Date('2026-01-15'))
    const firstDay = weeks[0].days[0]
    expect(firstDay.getDay()).toBe(1) // Lundi
    expect(firstDay.getDate()).toBe(12) // 12 janvier 2026 (lundi)
  })

  it('la première semaine est numérotée 1', () => {
    const weeks = getThreeWeeksRange(new Date('2026-01-13'))
    expect(weeks[0].weekNumber).toBe(1)
    expect(weeks[1].weekNumber).toBe(2)
    expect(weeks[2].weekNumber).toBe(3)
  })

  it('weekStart et weekEnd sont correctement définis', () => {
    const weeks = getThreeWeeksRange(new Date('2026-01-13'))
    weeks.forEach((week) => {
      expect(week.weekStart.getDay()).toBe(1) // Lundi
      expect(week.weekEnd.getDay()).toBe(0) // Dimanche
    })
  })
})

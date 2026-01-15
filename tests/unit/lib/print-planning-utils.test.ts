import { describe, it, expect } from 'vitest'
import {
  formatPeriode,
  formatChantierNom,
  formatIndisponibilite
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

  it('utilise maxLength=15 par défaut', () => {
    expect(formatChantierNom('Résidence Les Lilas')).toBe('Résidence Les …')
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

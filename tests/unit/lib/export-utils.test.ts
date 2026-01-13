import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatTableauComptage, copyToClipboard, type OuvrierPourExport } from '@/lib/export-utils'
import type { Ouvrier } from '@/generated/prisma/client'

describe('formatTableauComptage', () => {
  const createOuvrier = (overrides: Partial<Ouvrier> = {}): Ouvrier => ({
    id: 1,
    nom: 'Dupont',
    prenom: 'Jean',
    type: 'SALARIE',
    actif: true,
    dateCreation: new Date(),
    dateModification: new Date(),
    ...overrides
  })

  const emptyStats = {
    joursTravailles: 0,
    conges: 0,
    absences: 0
  }

  it('génère un en-tête avec 37 colonnes (1 + 12*3)', () => {
    const data: OuvrierPourExport[] = []
    const result = formatTableauComptage(data, 2026)
    const header = result.split('\n')[0]
    const columns = header.split('\t')

    expect(columns).toHaveLength(37)
    expect(columns[0]).toBe('Ouvrier')
    expect(columns[1]).toBe('Jan (j)')
    expect(columns[2]).toBe('Jan (c)')
    expect(columns[3]).toBe('Jan (a)')
    expect(columns[34]).toBe('Déc (j)')
    expect(columns[35]).toBe('Déc (c)')
    expect(columns[36]).toBe('Déc (a)')
  })

  it('génère une ligne par ouvrier', () => {
    const data: OuvrierPourExport[] = [
      {
        ouvrier: createOuvrier({ id: 1, nom: 'Dupont', prenom: 'Jean' }),
        stats: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, emptyStats]))
      },
      {
        ouvrier: createOuvrier({ id: 2, nom: 'Martin', prenom: 'Pierre' }),
        stats: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, emptyStats]))
      }
    ]

    const result = formatTableauComptage(data, 2026)
    const lines = result.split('\n')

    expect(lines).toHaveLength(3) // header + 2 ouvriers
  })

  it('ajoute l\'icône 🔧 pour les sous-traitants', () => {
    const data: OuvrierPourExport[] = [
      {
        ouvrier: createOuvrier({ id: 1, nom: 'Durand', prenom: 'Marie', type: 'SOUS_TRAITANT' }),
        stats: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, emptyStats]))
      }
    ]

    const result = formatTableauComptage(data, 2026)
    const lines = result.split('\n')

    expect(lines[1]).toContain('Durand Marie 🔧')
  })

  it('n\'ajoute pas l\'icône pour les salariés', () => {
    const data: OuvrierPourExport[] = [
      {
        ouvrier: createOuvrier({ id: 1, nom: 'Dupont', prenom: 'Jean', type: 'SALARIE' }),
        stats: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, emptyStats]))
      }
    ]

    const result = formatTableauComptage(data, 2026)
    const lines = result.split('\n')

    expect(lines[1]).not.toContain('🔧')
    expect(lines[1]).toContain('Dupont Jean')
  })

  it('gère les mois sans données (retourne 0, 0, 0)', () => {
    const data: OuvrierPourExport[] = [
      {
        ouvrier: createOuvrier({ id: 1, nom: 'Dupont', prenom: 'Jean' }),
        stats: {} // Pas de stats
      }
    ]

    const result = formatTableauComptage(data, 2026)
    const lines = result.split('\n')
    const values = lines[1].split('\t')

    // Toutes les valeurs après le nom doivent être 0
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBe('0')
    }
  })

  it('inclut les valeurs correctes pour chaque mois', () => {
    const data: OuvrierPourExport[] = [
      {
        ouvrier: createOuvrier({ id: 1, nom: 'Dupont', prenom: 'Jean' }),
        stats: {
          1: { joursTravailles: 20, conges: 0, absences: 0 },
          2: { joursTravailles: 18, conges: 2, absences: 0 },
          3: { joursTravailles: 15, conges: 0, absences: 1 },
          4: emptyStats,
          5: emptyStats,
          6: emptyStats,
          7: emptyStats,
          8: emptyStats,
          9: emptyStats,
          10: emptyStats,
          11: emptyStats,
          12: emptyStats
        }
      }
    ]

    const result = formatTableauComptage(data, 2026)
    const lines = result.split('\n')
    const values = lines[1].split('\t')

    expect(values[0]).toBe('Dupont Jean')
    // Janvier
    expect(values[1]).toBe('20')
    expect(values[2]).toBe('0')
    expect(values[3]).toBe('0')
    // Février
    expect(values[4]).toBe('18')
    expect(values[5]).toBe('2')
    expect(values[6]).toBe('0')
    // Mars
    expect(values[7]).toBe('15')
    expect(values[8]).toBe('0')
    expect(values[9]).toBe('1')
  })

  it('utilise le caractère tabulation comme séparateur', () => {
    const data: OuvrierPourExport[] = [
      {
        ouvrier: createOuvrier({ id: 1, nom: 'Dupont', prenom: 'Jean' }),
        stats: Object.fromEntries(Array.from({ length: 12 }, (_, i) => [i + 1, emptyStats]))
      }
    ]

    const result = formatTableauComptage(data, 2026)

    expect(result).toContain('\t')
    expect(result).not.toContain(',')
  })
})

describe('copyToClipboard', () => {
  const originalClipboard = navigator.clipboard

  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined)
      }
    })
  })

  afterEach(() => {
    Object.assign(navigator, {
      clipboard: originalClipboard
    })
  })

  it('appelle navigator.clipboard.writeText avec le texte', async () => {
    const text = 'Test content'

    await copyToClipboard(text)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text)
  })

  it('copie un contenu multiligne', async () => {
    const text = 'Line 1\nLine 2\nLine 3'

    await copyToClipboard(text)

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text)
  })
})

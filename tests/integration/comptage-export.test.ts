import { describe, it, expect } from 'vitest'
import { formatTableauComptage, type OuvrierPourExport } from '@/lib/export-utils'
import type { Ouvrier } from '@/generated/prisma/client'

describe('Comptage Export - Integration', () => {
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

  describe('Workflow complet: formatage → copie', () => {
    it('génère un contenu compatible Excel avec plusieurs ouvriers', () => {
      const data: OuvrierPourExport[] = [
        {
          ouvrier: createOuvrier({ id: 1, nom: 'Dupont', prenom: 'Jean', type: 'SALARIE' }),
          stats: {
            1: { joursTravailles: 20, conges: 0, absences: 0 },
            2: { joursTravailles: 18, conges: 2, absences: 0 },
            3: { joursTravailles: 22, conges: 0, absences: 0 },
            4: { joursTravailles: 19, conges: 1, absences: 0 },
            5: { joursTravailles: 20, conges: 0, absences: 1 },
            6: { joursTravailles: 21, conges: 0, absences: 0 },
            7: { joursTravailles: 15, conges: 5, absences: 0 },
            8: { joursTravailles: 10, conges: 10, absences: 0 },
            9: { joursTravailles: 22, conges: 0, absences: 0 },
            10: { joursTravailles: 21, conges: 0, absences: 1 },
            11: { joursTravailles: 20, conges: 0, absences: 0 },
            12: { joursTravailles: 18, conges: 2, absences: 0 }
          }
        },
        {
          ouvrier: createOuvrier({ id: 2, nom: 'Martin', prenom: 'Pierre', type: 'SALARIE' }),
          stats: {
            1: { joursTravailles: 18, conges: 0, absences: 2 },
            2: { joursTravailles: 20, conges: 0, absences: 0 },
            3: { joursTravailles: 22, conges: 0, absences: 0 },
            4: { joursTravailles: 20, conges: 0, absences: 0 },
            5: { joursTravailles: 20, conges: 0, absences: 0 },
            6: { joursTravailles: 0, conges: 20, absences: 0 },
            7: { joursTravailles: 22, conges: 0, absences: 0 },
            8: { joursTravailles: 22, conges: 0, absences: 0 },
            9: { joursTravailles: 21, conges: 0, absences: 1 },
            10: { joursTravailles: 22, conges: 0, absences: 0 },
            11: { joursTravailles: 21, conges: 0, absences: 0 },
            12: { joursTravailles: 15, conges: 5, absences: 0 }
          }
        },
        {
          ouvrier: createOuvrier({ id: 3, nom: 'Durand', prenom: 'Marie', type: 'SOUS_TRAITANT' }),
          stats: {
            1: { joursTravailles: 15, conges: 0, absences: 0 },
            2: { joursTravailles: 16, conges: 0, absences: 0 },
            3: { joursTravailles: 18, conges: 0, absences: 0 },
            4: { joursTravailles: 17, conges: 0, absences: 0 },
            5: { joursTravailles: 15, conges: 0, absences: 0 },
            6: { joursTravailles: 16, conges: 0, absences: 0 },
            7: { joursTravailles: 14, conges: 0, absences: 0 },
            8: { joursTravailles: 15, conges: 0, absences: 0 },
            9: { joursTravailles: 17, conges: 0, absences: 0 },
            10: { joursTravailles: 18, conges: 0, absences: 0 },
            11: { joursTravailles: 16, conges: 0, absences: 0 },
            12: { joursTravailles: 12, conges: 0, absences: 0 }
          }
        }
      ]

      const result = formatTableauComptage(data, 2026)
      const lines = result.split('\n')

      // Vérifier la structure
      expect(lines).toHaveLength(4) // header + 3 ouvriers

      // Vérifier le header
      const header = lines[0].split('\t')
      expect(header[0]).toBe('Ouvrier')
      expect(header).toHaveLength(37)

      // Vérifier chaque ouvrier
      const dupont = lines[1].split('\t')
      expect(dupont[0]).toBe('Dupont Jean')
      expect(dupont[1]).toBe('20') // Jan (j)
      expect(dupont[22]).toBe('10') // Aoû (j)
      expect(dupont[23]).toBe('10') // Aoû (c)

      const martin = lines[2].split('\t')
      expect(martin[0]).toBe('Martin Pierre')
      expect(martin[16]).toBe('0')  // Jun (j) - congés tout le mois
      expect(martin[17]).toBe('20') // Jun (c)

      const durand = lines[3].split('\t')
      expect(durand[0]).toBe('Durand Marie 🔧')
    })

    it('génère un contenu qui peut être parsé en colonnes séparées par tabulation', () => {
      const data: OuvrierPourExport[] = [
        {
          ouvrier: createOuvrier({ id: 1, nom: 'Test', prenom: 'User' }),
          stats: Object.fromEntries(
            Array.from({ length: 12 }, (_, i) => [
              i + 1,
              { joursTravailles: i + 10, conges: 0, absences: 0 }
            ])
          )
        }
      ]

      const result = formatTableauComptage(data, 2026)

      // Simuler le parsing Excel (chaque \t = nouvelle colonne)
      const rows = result.split('\n').map((line) => line.split('\t'))

      // Toutes les lignes ont le même nombre de colonnes
      const columnCount = rows[0].length
      rows.forEach((row) => {
        expect(row).toHaveLength(columnCount)
      })

      // Les données sont bien parsées
      expect(rows[1][0]).toBe('Test User')
      expect(rows[1][1]).toBe('10') // Jan (j)
      expect(rows[1][4]).toBe('11') // Fév (j)
    })

    it('gère correctement les valeurs décimales (demi-journées)', () => {
      const data: OuvrierPourExport[] = [
        {
          ouvrier: createOuvrier({ id: 1, nom: 'Test', prenom: 'User' }),
          stats: {
            1: { joursTravailles: 18.5, conges: 0.5, absences: 1 },
            2: { joursTravailles: 0, conges: 0, absences: 0 },
            3: { joursTravailles: 0, conges: 0, absences: 0 },
            4: { joursTravailles: 0, conges: 0, absences: 0 },
            5: { joursTravailles: 0, conges: 0, absences: 0 },
            6: { joursTravailles: 0, conges: 0, absences: 0 },
            7: { joursTravailles: 0, conges: 0, absences: 0 },
            8: { joursTravailles: 0, conges: 0, absences: 0 },
            9: { joursTravailles: 0, conges: 0, absences: 0 },
            10: { joursTravailles: 0, conges: 0, absences: 0 },
            11: { joursTravailles: 0, conges: 0, absences: 0 },
            12: { joursTravailles: 0, conges: 0, absences: 0 }
          }
        }
      ]

      const result = formatTableauComptage(data, 2026)
      const values = result.split('\n')[1].split('\t')

      expect(values[1]).toBe('18.5') // Jan (j)
      expect(values[2]).toBe('0.5')  // Jan (c)
      expect(values[3]).toBe('1')    // Jan (a)
    })
  })
})

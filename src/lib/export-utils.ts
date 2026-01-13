import type { Ouvrier } from '@/generated/prisma/client'
import type { StatistiquesMois } from '@/lib/comptage'

export interface OuvrierPourExport {
  ouvrier: Ouvrier
  stats: Record<number, StatistiquesMois> // 1-12 → stats du mois
}

const MOIS_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

/**
 * Formate les données de comptage en texte tabulé pour copie Excel/Sheets
 */
export function formatTableauComptage(data: OuvrierPourExport[], _annee: number): string {
  // En-tête: Ouvrier + 3 colonnes par mois (j, c, a)
  const header = ['Ouvrier', ...MOIS_LABELS.flatMap((m) => [`${m} (j)`, `${m} (c)`, `${m} (a)`])]

  // Lignes de données
  const rows = data.map(({ ouvrier, stats }) => {
    const nom =
      ouvrier.type === 'SOUS_TRAITANT'
        ? `${ouvrier.nom} ${ouvrier.prenom} 🔧`
        : `${ouvrier.nom} ${ouvrier.prenom}`

    const statsValues = MOIS_LABELS.map((_, i) => {
      const s = stats[i + 1] || { joursTravailles: 0, conges: 0, absences: 0 }
      return [s.joursTravailles, s.conges, s.absences]
    }).flat()

    return [nom, ...statsValues]
  })

  return [header, ...rows].map((row) => row.join('\t')).join('\n')
}

/**
 * Copie du texte dans le presse-papiers
 */
export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text)
}

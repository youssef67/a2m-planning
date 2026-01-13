import type { Periode, StatutPresence } from '@/generated/prisma/client'

export interface StatistiquesMois {
  joursTravailles: number
  conges: number
  absences: number
}

export interface AffectationComptage {
  date: Date
  periode: Periode
  statutPresence: StatutPresence
  chantier: { id: number } | null
}

const STATUTS_CONGES: StatutPresence[] = ['CONGE_PAYE']
const STATUTS_ABSENCES: StatutPresence[] = ['ABSENCE', 'MALADIE', 'FORMATION']

export function calculerStatistiquesMois(
  affectations: AffectationComptage[],
  mois: number,
  annee: number
): StatistiquesMois {
  const affectationsMois = affectations.filter((a) => {
    const d = new Date(a.date)
    return d.getMonth() + 1 === mois && d.getFullYear() === annee
  })

  let joursTravailles = 0
  let conges = 0
  let absences = 0

  for (const a of affectationsMois) {
    const valeur = a.periode === 'JOURNEE' ? 1 : 0.5

    if (a.chantier !== null) {
      joursTravailles += valeur
    } else if (STATUTS_CONGES.includes(a.statutPresence)) {
      conges += valeur
    } else if (STATUTS_ABSENCES.includes(a.statutPresence)) {
      absences += valeur
    }
  }

  return { joursTravailles, conges, absences }
}

export function calculerStatistiquesAnnee(
  affectations: AffectationComptage[],
  annee: number
): Record<number, StatistiquesMois> {
  const result: Record<number, StatistiquesMois> = {}

  for (let mois = 1; mois <= 12; mois++) {
    result[mois] = calculerStatistiquesMois(affectations, mois, annee)
  }

  return result
}

/**
 * Utilitaires pour le formatage des données d'impression du planning
 */

import { addWeeks, startOfWeek, eachDayOfInterval, endOfWeek } from 'date-fns'

/**
 * Formate une période pour l'affichage dans le tableau d'impression
 * @param periode - La période à formater (JOURNEE, MATIN, APRES_MIDI)
 * @returns "Jour" | "M" | "AM"
 */
export function formatPeriode(periode: 'JOURNEE' | 'MATIN' | 'APRES_MIDI'): string {
  switch (periode) {
    case 'JOURNEE':
      return 'Jour'
    case 'MATIN':
      return 'M'
    case 'APRES_MIDI':
      return 'AM'
  }
}

/**
 * Formate une période pour l'impression individuelle ouvrier
 * @param periode - La période à formater (JOURNEE, MATIN, APRES_MIDI)
 * @returns "" | "M" | "AM" (vide pour journée complète)
 */
export function formatPeriodePrint(periode: 'JOURNEE' | 'MATIN' | 'APRES_MIDI'): string {
  switch (periode) {
    case 'JOURNEE':
      return ''
    case 'MATIN':
      return 'M'
    case 'APRES_MIDI':
      return 'AM'
  }
}

/**
 * Formate le nom d'un chantier en le tronquant si nécessaire
 * @param nom - Le nom du chantier
 * @param maxLength - La longueur maximale (défaut: 10)
 * @returns Le nom tronqué avec "…" si nécessaire
 */
export function formatChantierNom(nom: string, maxLength: number = 10): string {
  if (nom.length <= maxLength) return nom
  return nom.slice(0, maxLength - 1) + '…'
}

/**
 * Formate un statut d'indisponibilité pour l'affichage
 * @param statut - Le code du statut (CONGE, MALADIE, FORMATION, ABSENCE)
 * @returns Le texte complet du statut
 */
export function formatIndisponibilite(statut: string): string {
  const mapping: Record<string, string> = {
    'CONGE': 'Congé',
    'MALADIE': 'Maladie',
    'FORMATION': 'Formation',
    'ABSENCE': 'Absence',
  }
  return mapping[statut] || statut
}

export interface WeekData {
  weekNumber: number
  weekStart: Date
  weekEnd: Date
  days: Date[]
}

/**
 * Génère les données de 3 semaines à partir d'une date de début
 * @param startDate - La date de début (sera normalisée au lundi de la semaine)
 * @returns Tableau de 3 semaines avec leurs jours
 */
export function getThreeWeeksRange(startDate: Date): WeekData[] {
  const weeks: WeekData[] = []
  let currentWeekStart = startOfWeek(startDate, { weekStartsOn: 1 })

  for (let i = 0; i < 3; i++) {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start: currentWeekStart, end: weekEnd })

    weeks.push({
      weekNumber: i + 1,
      weekStart: currentWeekStart,
      weekEnd: weekEnd,
      days: days
    })

    currentWeekStart = addWeeks(currentWeekStart, 1)
  }

  return weeks
}

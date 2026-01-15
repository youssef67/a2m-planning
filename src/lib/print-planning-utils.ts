/**
 * Utilitaires pour le formatage des données d'impression du planning
 */

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
 * Formate le nom d'un chantier en le tronquant si nécessaire
 * @param nom - Le nom du chantier
 * @param maxLength - La longueur maximale (défaut: 15)
 * @returns Le nom tronqué avec "…" si nécessaire
 */
export function formatChantierNom(nom: string, maxLength: number = 15): string {
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

import { prisma } from '@/lib/prisma'
import type { Periode } from '@/generated/prisma/client'

/**
 * Type de conflit détecté entre périodes
 */
export type TypeConflitPeriode = 'JOURNEE_VERS_PARTIEL' | 'PARTIEL_VERS_JOURNEE'

/**
 * Information sur une affectation en conflit
 */
export interface ConflitPeriode {
  affectationExistante: {
    id: number
    date: Date
    periode: Periode
    chantier: {
      id: number
      nom: string
    }
  }
  typeConflit: TypeConflitPeriode
}

/**
 * Détecte si une nouvelle affectation entre en conflit avec une affectation existante
 *
 * Règles de chevauchement:
 * - JOURNEE existante + MATIN demandée → conflit (propose remplacer par MATIN)
 * - JOURNEE existante + APRES_MIDI demandée → conflit (propose remplacer par APRES_MIDI)
 * - MATIN existante + JOURNEE demandée → conflit (propose remplacer par JOURNEE)
 * - APRES_MIDI existante + JOURNEE demandée → conflit (propose remplacer par JOURNEE)
 * - MATIN existante + APRES_MIDI demandée → pas de conflit (autorisé)
 * - APRES_MIDI existante + MATIN demandée → pas de conflit (autorisé)
 *
 * @param ouvrierId - ID de l'ouvrier
 * @param date - Date de l'affectation (format YYYY-MM-DD ou Date)
 * @param nouvellePeriode - Période demandée pour la nouvelle affectation
 * @returns ConflitPeriode si conflit détecté, null sinon
 */
export async function detecterConflitPeriode(
  ouvrierId: number,
  date: string | Date,
  nouvellePeriode: Periode
): Promise<ConflitPeriode | null> {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  // Chercher les affectations existantes pour cet ouvrier à cette date
  // qui sont des affectations chantier (chantierId !== null)
  const affectationsExistantes = await prisma.affectation.findMany({
    where: {
      ouvrierId,
      date: dateObj,
      chantierId: { not: null }
    },
    include: {
      chantier: {
        select: {
          id: true,
          nom: true
        }
      }
    }
  })

  for (const affectation of affectationsExistantes) {
    // Skip si pas de chantier (ne devrait pas arriver avec le filtre)
    if (!affectation.chantier) continue

    const periodeExistante = affectation.periode

    // Vérifier les règles de chevauchement
    const conflit = verifierChevauchement(periodeExistante, nouvellePeriode)

    if (conflit) {
      return {
        affectationExistante: {
          id: affectation.id,
          date: affectation.date,
          periode: affectation.periode,
          chantier: {
            id: affectation.chantier.id,
            nom: affectation.chantier.nom
          }
        },
        typeConflit: conflit
      }
    }
  }

  return null
}

/**
 * Vérifie si deux périodes se chevauchent
 * @returns Type de conflit si chevauchement, null sinon
 */
function verifierChevauchement(
  periodeExistante: Periode,
  nouvellePeriode: Periode
): TypeConflitPeriode | null {
  // Même période = conflit géré par contrainte unique DB, pas ici
  if (periodeExistante === nouvellePeriode) {
    return null
  }

  // JOURNEE existante chevauche MATIN et APRES_MIDI
  if (periodeExistante === 'JOURNEE') {
    if (nouvellePeriode === 'MATIN' || nouvellePeriode === 'APRES_MIDI') {
      return 'JOURNEE_VERS_PARTIEL'
    }
  }

  // MATIN ou APRES_MIDI existante chevauche JOURNEE
  if (nouvellePeriode === 'JOURNEE') {
    if (periodeExistante === 'MATIN' || periodeExistante === 'APRES_MIDI') {
      return 'PARTIEL_VERS_JOURNEE'
    }
  }

  // MATIN et APRES_MIDI ne se chevauchent pas entre eux
  return null
}

/**
 * Information sur un conflit d'affectation multiple
 */
export interface ConflitAffectationMultiple {
  ouvrierId: number
  ouvrierNom: string
  date: Date
  chantierActuel: string
  periodeActuelle: Periode
}

/**
 * Détecte les conflits d'affectation pour plusieurs ouvriers sur plusieurs dates
 *
 * @param ouvrierIds - Liste des IDs d'ouvriers à vérifier
 * @param dates - Liste des dates à vérifier
 * @param periode - Période demandée
 * @returns Liste des conflits détectés
 */
export async function detecterConflitsMultiples(
  ouvrierIds: number[],
  dates: Date[],
  periode: Periode
): Promise<ConflitAffectationMultiple[]> {
  if (ouvrierIds.length === 0 || dates.length === 0) {
    return []
  }

  // Chercher les affectations existantes pour ces ouvriers et dates
  const affectationsExistantes = await prisma.affectation.findMany({
    where: {
      ouvrierId: { in: ouvrierIds },
      date: { in: dates },
      chantierId: { not: null }
    },
    include: {
      ouvrier: {
        select: {
          id: true,
          nom: true,
          prenom: true
        }
      },
      chantier: {
        select: {
          nom: true
        }
      }
    }
  })

  const conflits: ConflitAffectationMultiple[] = []

  for (const affectation of affectationsExistantes) {
    if (!affectation.chantier || !affectation.ouvrier) continue

    const periodeExistante = affectation.periode

    // Vérifier si la période demandée chevauche la période existante
    // Même période = conflit direct
    // JOURNEE existante + MATIN/APRES_MIDI demandée = conflit
    // MATIN/APRES_MIDI existante + JOURNEE demandée = conflit
    const estConflit =
      periodeExistante === periode ||
      periodeExistante === 'JOURNEE' ||
      periode === 'JOURNEE'

    if (estConflit) {
      conflits.push({
        ouvrierId: affectation.ouvrierId,
        ouvrierNom: `${affectation.ouvrier.prenom} ${affectation.ouvrier.nom}`,
        date: affectation.date,
        chantierActuel: affectation.chantier.nom,
        periodeActuelle: affectation.periode
      })
    }
  }

  return conflits
}

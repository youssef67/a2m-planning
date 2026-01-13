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

import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'

const createGetAffectationsByChantierAndDate = (chantierId: number, date: Date) =>
  unstable_cache(
    async () => {
      return prisma.affectation.findMany({
        where: {
          chantierId,
          date
        },
        include: {
          ouvrier: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              type: true
            }
          }
        },
        orderBy: {
          ouvrier: { nom: 'asc' }
        }
      })
    },
    ['affectations-chantier-date', String(chantierId), date.toISOString()],
    { revalidate: 60, tags: ['affectations'] }
  )

export async function getAffectationsByChantierAndDate(chantierId: number, date: Date) {
  return createGetAffectationsByChantierAndDate(chantierId, date)()
}

const createGetAffectationsByOuvrierAndDate = (ouvrierId: number, date: Date) =>
  unstable_cache(
    async () => {
      return prisma.affectation.findMany({
        where: {
          ouvrierId,
          date
        }
      })
    },
    ['affectations-ouvrier-date', String(ouvrierId), date.toISOString()],
    { revalidate: 60, tags: ['affectations'] }
  )

export async function getAffectationsByOuvrierAndDate(ouvrierId: number, date: Date) {
  return createGetAffectationsByOuvrierAndDate(ouvrierId, date)()
}

const createGetChantiersPlanningAvecAffectations = (dateDebut: Date, dateFin: Date) =>
  unstable_cache(
    async () => {
      return prisma.chantier.findMany({
        where: {
          statut: { in: ['ACTIF', 'EN_PAUSE'] }
        },
        include: {
          affectations: {
            where: {
              date: {
                gte: dateDebut,
                lte: dateFin
              },
              statutPresence: 'TRAVAIL'
            },
            include: {
              ouvrier: {
                select: {
                  id: true,
                  nom: true,
                  prenom: true,
                  type: true
                }
              }
            },
            orderBy: {
              ouvrier: { nom: 'asc' }
            }
          }
        },
        orderBy: [
          { statut: 'asc' },
          { nom: 'asc' }
        ]
      })
    },
    ['chantiers-planning', dateDebut.toISOString(), dateFin.toISOString()],
    { revalidate: 60, tags: ['chantiers', 'affectations'] }
  )

export async function getChantiersPlanningAvecAffectations(dateDebut: Date, dateFin: Date) {
  return createGetChantiersPlanningAvecAffectations(dateDebut, dateFin)()
}

const createGetOuvriersPlanningAvecAffectations = (dateDebut: Date, dateFin: Date) =>
  unstable_cache(
    async () => {
      return prisma.ouvrier.findMany({
        where: {
          statut: 'ACTIF'
        },
        include: {
          affectations: {
            where: {
              date: {
                gte: dateDebut,
                lte: dateFin
              }
            },
            include: {
              chantier: {
                select: { id: true, nom: true, statut: true }
              }
            },
            orderBy: { date: 'asc' }
          }
        },
        orderBy: [
          { nom: 'asc' },
          { prenom: 'asc' }
        ]
      })
    },
    ['ouvriers-planning', dateDebut.toISOString(), dateFin.toISOString()],
    { revalidate: 60, tags: ['ouvriers', 'affectations'] }
  )

export async function getOuvriersPlanningAvecAffectations(dateDebut: Date, dateFin: Date) {
  return createGetOuvriersPlanningAvecAffectations(dateDebut, dateFin)()
}

const createGetOuvrierDisponibilite = (ouvrierId: number, date: Date, periode: string) =>
  unstable_cache(
    async () => {
      // Check if ouvrier has an indisponibilité (chantierId is null AND statutPresence is not TRAVAIL)
      const indisponibilite = await prisma.affectation.findFirst({
        where: {
          ouvrierId,
          date,
          chantierId: null,
          statutPresence: { not: 'TRAVAIL' },
          OR: [
            { periode: 'JOURNEE' },
            { periode: periode as 'MATIN' | 'APRES_MIDI' | 'JOURNEE' }
          ]
        }
      })

      // Also check if JOURNEE indisponibilité blocks MATIN/APRES_MIDI
      if (!indisponibilite && periode !== 'JOURNEE') {
        const journeeIndispo = await prisma.affectation.findFirst({
          where: {
            ouvrierId,
            date,
            chantierId: null,
            statutPresence: { not: 'TRAVAIL' },
            periode: 'JOURNEE'
          }
        })
        return { disponible: !journeeIndispo, indisponibilite: journeeIndispo }
      }

      return { disponible: !indisponibilite, indisponibilite }
    },
    ['ouvrier-disponibilite', String(ouvrierId), date.toISOString(), periode],
    { revalidate: 60, tags: ['affectations'] }
  )

export async function getOuvrierDisponibilite(ouvrierId: number, date: Date, periode: string) {
  return createGetOuvrierDisponibilite(ouvrierId, date, periode)()
}

const createGetOuvriersIndisponibles = (date: Date, periode: string) =>
  unstable_cache(
    async () => {
      // Get all ouvriers with indisponibilités for this date/periode
      const indisponibilites = await prisma.affectation.findMany({
        where: {
          date,
          chantierId: null,
          statutPresence: { not: 'TRAVAIL' },
          OR: [
            { periode: 'JOURNEE' },
            { periode: periode as 'MATIN' | 'APRES_MIDI' | 'JOURNEE' }
          ]
        },
        select: {
          ouvrierId: true,
          statutPresence: true
        }
      })

      // Return a map of ouvrierId -> statutPresence
      const indispoMap: Record<number, string> = {}
      for (const indispo of indisponibilites) {
        indispoMap[indispo.ouvrierId] = indispo.statutPresence
      }
      return indispoMap
    },
    ['ouvriers-indisponibles', date.toISOString(), periode],
    { revalidate: 60, tags: ['affectations'] }
  )

export async function getOuvriersIndisponibles(date: Date, periode: string) {
  return createGetOuvriersIndisponibles(date, periode)()
}

export interface ConflitIndisponibilite {
  ouvrierId: number
  ouvrierNom: string
  date: Date
  chantierActuel: string
  periodeActuelle: string
}

export async function getConflitsIndisponibilite(
  ouvrierIds: number[],
  dates: Date[],
  periode: string
): Promise<ConflitIndisponibilite[]> {
  const conflits: ConflitIndisponibilite[] = []

  // Find all affectations that would conflict with the new indisponibilités
  const affectations = await prisma.affectation.findMany({
    where: {
      ouvrierId: { in: ouvrierIds },
      date: { in: dates },
      chantierId: { not: null },
      ...(periode === 'JOURNEE'
        ? {}
        : {
            OR: [{ periode: periode as 'MATIN' | 'APRES_MIDI' }, { periode: 'JOURNEE' }]
          })
    },
    include: {
      ouvrier: {
        select: { id: true, nom: true, prenom: true }
      },
      chantier: {
        select: { nom: true }
      }
    }
  })

  for (const affectation of affectations) {
    conflits.push({
      ouvrierId: affectation.ouvrierId,
      ouvrierNom: `${affectation.ouvrier.prenom} ${affectation.ouvrier.nom}`,
      date: affectation.date,
      chantierActuel: affectation.chantier?.nom ?? 'Inconnu',
      periodeActuelle: affectation.periode
    })
  }

  return conflits
}

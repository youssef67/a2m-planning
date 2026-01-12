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

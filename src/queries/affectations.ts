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

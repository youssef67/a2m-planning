import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'

const createGetComptageAnnuel = (annee: number) =>
  unstable_cache(
    async () => {
      const debutAnnee = new Date(annee, 0, 1)
      const finAnnee = new Date(annee, 11, 31)

      return prisma.ouvrier.findMany({
        where: { statut: 'ACTIF' },
        include: {
          affectations: {
            where: {
              date: { gte: debutAnnee, lte: finAnnee }
            },
            select: {
              date: true,
              periode: true,
              statutPresence: true,
              chantier: { select: { id: true } }
            }
          }
        },
        orderBy: { nom: 'asc' }
      })
    },
    ['comptage', String(annee)],
    { revalidate: 60, tags: ['affectations', 'ouvriers'] }
  )

export async function getComptageAnnuel(annee: number) {
  return createGetComptageAnnuel(annee)()
}

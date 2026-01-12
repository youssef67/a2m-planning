import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import type { StatutChantier } from '@/generated/prisma/client'

export const getChantiersActifs = unstable_cache(
  async () => {
    return prisma.chantier.findMany({
      where: { statut: 'ACTIF' },
      orderBy: { nom: 'asc' }
    })
  },
  ['chantiers-actifs'],
  { revalidate: 60, tags: ['chantiers'] }
)

const createGetChantiersByStatut = (statut: StatutChantier) =>
  unstable_cache(
    async () => {
      return prisma.chantier.findMany({
        where: { statut },
        orderBy: { nom: 'asc' }
      })
    },
    ['chantiers-by-statut', statut],
    { revalidate: 60, tags: ['chantiers'] }
  )

export async function getChantiersByStatut(statut: StatutChantier) {
  return createGetChantiersByStatut(statut)()
}

export const getAllChantiers = unstable_cache(
  async () => {
    return prisma.chantier.findMany({
      orderBy: { nom: 'asc' }
    })
  },
  ['chantiers-all'],
  { revalidate: 60, tags: ['chantiers'] }
)

export async function getChantierById(id: number) {
  return prisma.chantier.findUnique({
    where: { id }
  })
}

import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'

export const getOuvriersActifs = unstable_cache(
  async () => {
    return prisma.ouvrier.findMany({
      where: { statut: 'ACTIF' },
      orderBy: [{ nom: 'asc' }, { prenom: 'asc' }]
    })
  },
  ['ouvriers-actifs'],
  { revalidate: 60, tags: ['ouvriers'] }
)

export const getOuvriersArchives = unstable_cache(
  async () => {
    return prisma.ouvrier.findMany({
      where: { statut: 'ARCHIVE' },
      orderBy: [{ nom: 'asc' }, { prenom: 'asc' }]
    })
  },
  ['ouvriers-archives'],
  { revalidate: 60, tags: ['ouvriers'] }
)

export async function getOuvrierById(id: number) {
  return prisma.ouvrier.findUnique({
    where: { id }
  })
}

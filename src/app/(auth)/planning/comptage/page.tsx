import { Suspense } from 'react'
import { NavigationOnglets } from '@/components/features/planning/NavigationOnglets'
import { VueComptageClient } from '@/components/features/comptage/VueComptageClient'
import { getComptageAnnuel } from '@/queries/comptage'

export const metadata = {
  title: 'Comptage - A2M Planning'
}

interface PageProps {
  searchParams: Promise<{ annee?: string }>
}

async function ComptageContent({ annee }: { annee: number }) {
  const ouvriers = await getComptageAnnuel(annee)
  return <VueComptageClient ouvriers={ouvriers} annee={annee} />
}

export default async function PageComptage({ searchParams }: PageProps) {
  const params = await searchParams
  const annee = params.annee ? parseInt(params.annee) : new Date().getFullYear()

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Comptage
      </h1>

      <NavigationOnglets />

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Chargement des données...</div>
          </div>
        }
      >
        <ComptageContent annee={annee} />
      </Suspense>
    </div>
  )
}

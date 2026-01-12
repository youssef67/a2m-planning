import { getOuvriersActifs, getOuvriersArchives } from '@/queries/ouvriers'
import { OuvriersClient } from '@/components/features/OuvriersClient'

export default async function OuvriersPage() {
  const [ouvriersActifs, ouvriersArchives] = await Promise.all([
    getOuvriersActifs(),
    getOuvriersArchives()
  ])

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <OuvriersClient
        ouvriersActifs={ouvriersActifs}
        ouvriersArchives={ouvriersArchives}
      />
    </main>
  )
}

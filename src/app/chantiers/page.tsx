import { getAllChantiers } from '@/queries/chantiers'
import { ChantiersClient } from '@/components/features/ChantiersClient'

export default async function ChantiersPage() {
  const chantiers = await getAllChantiers()

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ChantiersClient chantiers={chantiers} />
    </main>
  )
}

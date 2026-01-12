import { Suspense } from 'react'
import { startOfWeek, endOfWeek, eachDayOfInterval, parseISO, isValid } from 'date-fns'
import { getOuvriersPlanningAvecAffectations } from '@/queries/affectations'
import { getChantiersNonTermines } from '@/queries/chantiers'
import { NavigationOnglets } from '@/components/features/planning/NavigationOnglets'
import { NavigationSemaine } from '@/components/features/planning/NavigationSemaine'
import { ListeOuvriers } from '@/components/features/planning/ListeOuvriers'
import { VueOuvrierClient } from '@/components/features/planning/VueOuvrierClient'

export const metadata = {
  title: 'Planning par ouvrier - A2M Planning'
}

interface PageProps {
  searchParams: Promise<{ semaine?: string; ouvrier?: string }>
}

function getWeekDates(semaineParam?: string) {
  let baseDate = new Date()

  if (semaineParam) {
    const parsed = parseISO(semaineParam)
    if (isValid(parsed)) {
      baseDate = parsed
    }
  }

  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(baseDate, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  return { weekStart, weekEnd, days }
}

function parseOuvrierId(ouvrierParam?: string): number | null {
  if (!ouvrierParam) return null
  const id = parseInt(ouvrierParam, 10)
  return isNaN(id) ? null : id
}

async function PlanningContent({
  semaine,
  ouvrierId
}: {
  semaine?: string
  ouvrierId: number | null
}) {
  const { weekStart, weekEnd, days } = getWeekDates(semaine)

  // Fetch ouvriers and chantiers in parallel
  const [ouvriers, chantiersNonTermines] = await Promise.all([
    getOuvriersPlanningAvecAffectations(weekStart, weekEnd),
    getChantiersNonTermines()
  ])

  const selectedOuvrier = ouvrierId
    ? ouvriers.find((o) => o.id === ouvrierId)
    : null

  return (
    <div className="flex flex-col sm:flex-row gap-6">
      <ListeOuvriers
        ouvriers={ouvriers.map((o) => ({
          id: o.id,
          nom: o.nom,
          prenom: o.prenom,
          type: o.type
        }))}
        selectedOuvrierId={ouvrierId}
      />

      <div className="flex-1">
        {selectedOuvrier ? (
          <VueOuvrierClient
            ouvrier={selectedOuvrier}
            joursSemaine={days}
            allOuvriers={ouvriers.map((o) => ({
              id: o.id,
              nom: o.nom,
              prenom: o.prenom
            }))}
            chantiersNonTermines={chantiersNonTermines}
          />
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-500">
              Sélectionnez un ouvrier pour voir son planning
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default async function PlanningOuvrierPage({ searchParams }: PageProps) {
  const params = await searchParams
  const semaine = params.semaine
  const ouvrierId = parseOuvrierId(params.ouvrier)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Planning par ouvrier
      </h1>

      <NavigationOnglets />
      <NavigationSemaine />

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Chargement du planning...</div>
          </div>
        }
      >
        <PlanningContent semaine={semaine} ouvrierId={ouvrierId} />
      </Suspense>
    </div>
  )
}

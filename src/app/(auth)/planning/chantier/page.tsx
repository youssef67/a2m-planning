import { Suspense } from 'react'
import { startOfWeek, endOfWeek, eachDayOfInterval, parseISO, isValid, format } from 'date-fns'
import { getChantiersPlanningAvecAffectations, getOuvriersIndisponibles } from '@/queries/affectations'
import { getChantiersActifs } from '@/queries/chantiers'
import { getOuvriersActifs } from '@/queries/ouvriers'
import { NavigationOnglets } from '@/components/features/planning/NavigationOnglets'
import { NavigationSemaine } from '@/components/features/planning/NavigationSemaine'
import { VueChantierClient } from '@/components/features/planning/VueChantierClient'

export const metadata = {
  title: 'Planning par chantier - A2M Planning'
}

interface PageProps {
  searchParams: Promise<{ semaine?: string }>
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

async function PlanningContent({ semaine }: { semaine?: string }) {
  const { weekStart, weekEnd, days } = getWeekDates(semaine)

  // Fetch all data in parallel
  const [chantiers, chantiersActifs, ouvriersActifs] = await Promise.all([
    getChantiersPlanningAvecAffectations(weekStart, weekEnd),
    getChantiersActifs(),
    getOuvriersActifs()
  ])

  // Fetch indisponibilités for each day of the week (for JOURNEE period)
  const indisponibilitesPromises = days.map(async (day) => {
    const indispo = await getOuvriersIndisponibles(day, 'JOURNEE')
    return { date: format(day, 'yyyy-MM-dd'), indispo }
  })

  const indisponibilitesResults = await Promise.all(indisponibilitesPromises)

  // Build map: dateString -> Record<ouvrierId, statutPresence>
  const indisponiblesByDate: Record<string, Record<number, string>> = {}
  for (const { date, indispo } of indisponibilitesResults) {
    indisponiblesByDate[date] = indispo
  }

  return (
    <VueChantierClient
      chantiers={chantiers}
      chantiersActifs={chantiersActifs}
      joursSemaine={days}
      ouvriersActifs={ouvriersActifs}
      indisponiblesByDate={indisponiblesByDate}
    />
  )
}

export default async function PlanningChantierPage({ searchParams }: PageProps) {
  const params = await searchParams
  const semaine = params.semaine

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Planning par chantier
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
        <PlanningContent semaine={semaine} />
      </Suspense>
    </div>
  )
}

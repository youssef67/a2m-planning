import { Suspense } from 'react'
import { startOfWeek, endOfWeek, eachDayOfInterval, parseISO, isValid } from 'date-fns'
import { getChantiersPlanningAvecAffectations } from '@/queries/affectations'
import { NavigationOnglets } from '@/components/features/planning/NavigationOnglets'
import { NavigationSemaine } from '@/components/features/planning/NavigationSemaine'
import { GrillePlanningChantier } from '@/components/features/planning/GrillePlanningChantier'

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
  const chantiers = await getChantiersPlanningAvecAffectations(weekStart, weekEnd)

  return (
    <GrillePlanningChantier
      chantiers={chantiers}
      joursSemaine={days}
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

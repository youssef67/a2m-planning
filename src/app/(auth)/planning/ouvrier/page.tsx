import { Suspense } from 'react'
import { startOfWeek, endOfWeek, eachDayOfInterval, parseISO, isValid, format, addWeeks } from 'date-fns'
import { getOuvriersPlanningAvecAffectations, getOuvriersIndisponibles } from '@/queries/affectations'
import { getChantiersNonTermines } from '@/queries/chantiers'
import { NavigationOnglets } from '@/components/features/planning/NavigationOnglets'
import { NavigationSemaine } from '@/components/features/planning/NavigationSemaine'
import { VueOuvrierListeClient } from '@/components/features/planning/VueOuvrierListeClient'
import { PrintableWeeklyPlanning } from '@/components/features/planning/PrintableWeeklyPlanning'
import { PrintableOuvrierPlanning } from '@/components/features/planning/PrintableOuvrierPlanning'

export const metadata = {
  title: 'Planning par ouvrier - A2M Planning'
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

  // Calculate 3-week range for print
  const threeWeekEnd = endOfWeek(addWeeks(weekStart, 2), { weekStartsOn: 1 })

  // Fetch ouvriers (1 week for display, 3 weeks for print) and chantiers in parallel
  const [ouvriers, ouvriersThreeWeeks, chantiersNonTermines] = await Promise.all([
    getOuvriersPlanningAvecAffectations(weekStart, weekEnd),
    getOuvriersPlanningAvecAffectations(weekStart, threeWeekEnd),
    getChantiersNonTermines()
  ])

  // Fetch indisponibilités for each day of the week
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
    <>
      <div className="no-print">
        <VueOuvrierListeClient
          ouvriers={ouvriers}
          joursSemaine={days}
          chantiersNonTermines={chantiersNonTermines}
          indisponiblesByDate={indisponiblesByDate}
        />
      </div>
      {/* Print-only: Weekly planning (1 week, all ouvriers on one page) */}
      <PrintableWeeklyPlanning
        ouvriers={ouvriers}
        weekStart={weekStart}
        weekEnd={weekEnd}
      />
      {/* Print-only: Individual ouvrier planning pages (3 weeks) */}
      <div className="print-only">
        {ouvriersThreeWeeks.map((ouvrier) => (
          <PrintableOuvrierPlanning
            key={ouvrier.id}
            ouvrier={ouvrier}
            weekStart={weekStart}
          />
        ))}
      </div>
    </>
  )
}

export default async function PlanningOuvrierPage({ searchParams }: PageProps) {
  const params = await searchParams
  const semaine = params.semaine

  return (
    <div>
      <div className="no-print">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Planning par ouvrier
        </h1>

        <NavigationOnglets />
        <NavigationSemaine />
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12 no-print">
            <div className="text-gray-500">Chargement du planning...</div>
          </div>
        }
      >
        <PlanningContent semaine={semaine} />
      </Suspense>
    </div>
  )
}

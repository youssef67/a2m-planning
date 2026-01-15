import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { getThreeWeeksRange, type WeekData } from '@/lib/print-planning-utils'
import type { Periode, TypeOuvrier } from '@/generated/prisma/client'

interface OuvrierData {
  id: number
  nom: string
  prenom: string
  type: TypeOuvrier
}

interface AffectationData {
  id: number
  date: Date
  periode: Periode
  ouvrier: OuvrierData
}

interface ChantierData {
  id: number
  nom: string
  affectations: AffectationData[]
}

interface PrintableChantierPlanningProps {
  chantier: ChantierData
  weekStart: Date
}

const joursAbrevies = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export function PrintableChantierPlanning({
  chantier,
  weekStart
}: PrintableChantierPlanningProps) {
  const weeks = getThreeWeeksRange(weekStart)
  const lastWeek = weeks[weeks.length - 1]

  const formatTitle = () => {
    const debut = format(weeks[0].weekStart, 'd MMMM', { locale: fr })
    const fin = format(lastWeek.weekEnd, 'd MMMM yyyy', { locale: fr })
    return `Planning du ${debut} au ${fin}`
  }

  const getOuvrierCount = (day: Date): number => {
    const dayStr = format(day, 'yyyy-MM-dd')
    const affectationsJour = chantier.affectations.filter(
      (a) => format(new Date(a.date), 'yyyy-MM-dd') === dayStr
    )
    return affectationsJour.length
  }

  const formatWeekLabel = (week: WeekData) => {
    const debutJour = format(week.weekStart, 'd', { locale: fr })
    const finJour = format(week.weekEnd, 'd', { locale: fr })
    const moisDebut = format(week.weekStart, 'MMM', { locale: fr })
    const moisFin = format(week.weekEnd, 'MMM', { locale: fr })

    if (moisDebut === moisFin) {
      return `${debutJour}-${finJour} ${moisFin}`
    }
    return `${debutJour} ${moisDebut} - ${finJour} ${moisFin}`
  }

  return (
    <div
      id={`printable-chantier-${chantier.id}`}
      className="printable-chantier"
    >
      {/* Header with chantier name */}
      <h1 className="printable-chantier-title">
        {chantier.nom.toUpperCase()}
      </h1>
      <h2 className="printable-chantier-subtitle">
        {formatTitle()}
      </h2>

      {/* 3-week table */}
      <table className="printable-chantier-table">
        <thead>
          <tr>
            <th className="week-col"></th>
            {joursAbrevies.map((jour, index) => (
              <th key={index}>{jour}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, weekIndex) => (
            <tr key={weekIndex}>
              <td className="week-col">
                <div className="week-label">Semaine {week.weekNumber}</div>
                <div className="week-dates">{formatWeekLabel(week)}</div>
              </td>
              {week.days.map((day, dayIndex) => {
                const count = getOuvrierCount(day)
                return (
                  <td key={dayIndex}>
                    <div className="cell-content">
                      <div className={count === 0 ? 'cell-aucun' : 'cell-ouvrier'}>
                        {count}
                      </div>
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="printable-chantier-legend">
        Nombre d'ouvriers présents par jour
      </div>
    </div>
  )
}

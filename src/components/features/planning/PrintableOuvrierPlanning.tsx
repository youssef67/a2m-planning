import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  formatPeriodePrint,
  formatChantierNom,
  formatIndisponibilite,
  getThreeWeeksRange,
  type WeekData
} from '@/lib/print-planning-utils'
import type { Periode, StatutPresence, Ouvrier, Chantier } from '@/generated/prisma/client'

type AffectationData = {
  id: number
  date: Date
  periode: Periode
  statutPresence: StatutPresence
  chantier: Pick<Chantier, 'id' | 'nom'> | null
}

type OuvrierWithAffectations = Pick<Ouvrier, 'id' | 'nom' | 'prenom' | 'type'> & {
  affectations: AffectationData[]
}

interface PrintableOuvrierPlanningProps {
  ouvrier: OuvrierWithAffectations
  weekStart: Date
}

const joursAbrevies = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export function PrintableOuvrierPlanning({
  ouvrier,
  weekStart
}: PrintableOuvrierPlanningProps) {
  const weeks = getThreeWeeksRange(weekStart)
  const lastWeek = weeks[weeks.length - 1]

  const formatTitle = () => {
    const debut = format(weeks[0].weekStart, 'd MMMM', { locale: fr })
    const fin = format(lastWeek.weekEnd, 'd MMMM yyyy', { locale: fr })
    return `Planning du ${debut} au ${fin}`
  }

  const getCellContent = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd')
    const affectationsJour = ouvrier.affectations.filter(
      (a) => format(new Date(a.date), 'yyyy-MM-dd') === dayStr
    )

    if (affectationsJour.length === 0) {
      return { nom: 'Aucun', periode: '' }
    }

    const affectation = affectationsJour[0]

    if (!affectation.chantier) {
      return {
        nom: formatIndisponibilite(affectation.statutPresence),
        periode: ''
      }
    }

    return {
      nom: formatChantierNom(affectation.chantier.nom),
      periode: formatPeriodePrint(affectation.periode)
    }
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
      id={`printable-ouvrier-${ouvrier.id}`}
      className="printable-ouvrier"
    >
      {/* Header with ouvrier name */}
      <h1 className="printable-ouvrier-title">
        {ouvrier.nom.toUpperCase()} {ouvrier.prenom.toUpperCase()}
      </h1>
      <h2 className="printable-ouvrier-subtitle">
        {formatTitle()}
      </h2>

      {/* 3-week table */}
      <table className="printable-ouvrier-table">
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
                const { nom, periode } = getCellContent(day)
                return (
                  <td key={dayIndex}>
                    <div className="cell-content">
                      <div className="cell-chantier">{nom}</div>
                      {periode && <div className="cell-periode">{periode}</div>}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      <div className="printable-ouvrier-legend">
        LÉGENDE : (vide) = Journée complète | M = Matin | AM = Après-midi
      </div>
    </div>
  )
}

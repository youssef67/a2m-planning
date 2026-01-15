import { format, eachDayOfInterval } from 'date-fns'
import { fr } from 'date-fns/locale'
import { formatPeriode, formatChantierNom, formatIndisponibilite } from '@/lib/print-planning-utils'
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

interface PrintableWeeklyPlanningProps {
  ouvriers: OuvrierWithAffectations[]
  weekStart: Date
  weekEnd: Date
}

const joursAbrevies = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export function PrintableWeeklyPlanning({
  ouvriers,
  weekStart,
  weekEnd
}: PrintableWeeklyPlanningProps) {
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const formatTitle = () => {
    const debutJour = format(weekStart, 'd', { locale: fr })
    const finJour = format(weekEnd, 'd', { locale: fr })
    const moisDebut = format(weekStart, 'MMMM', { locale: fr }).toUpperCase()
    const moisFin = format(weekEnd, 'MMMM', { locale: fr }).toUpperCase()
    const annee = format(weekEnd, 'yyyy')

    if (moisDebut === moisFin) {
      return `PLANNING SEMAINE DU ${debutJour} AU ${finJour} ${moisFin} ${annee}`
    }
    return `PLANNING SEMAINE DU ${debutJour} ${moisDebut} AU ${finJour} ${moisFin} ${annee}`
  }

  const getCellContent = (ouvrier: OuvrierWithAffectations, day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd')
    const affectationsJour = ouvrier.affectations.filter(
      (a) => format(new Date(a.date), 'yyyy-MM-dd') === dayStr
    )

    if (affectationsJour.length === 0) {
      return { nom: '-', periode: '' }
    }

    const affectation = affectationsJour[0]

    if (!affectation.chantier) {
      return {
        nom: formatIndisponibilite(affectation.statutPresence),
        periode: ''
      }
    }

    return {
      nom: formatChantierNom(affectation.chantier.nom, 15),
      periode: formatPeriode(affectation.periode)
    }
  }

  return (
    <div className="print-only planning-print-container">
      <h1 className="planning-print-title">{formatTitle()}</h1>

      <table className="planning-print-table">
        <thead>
          <tr>
            <th className="ouvrier-col">Ouvrier</th>
            {days.map((day, index) => (
              <th key={day.toISOString()}>
                {joursAbrevies[index]} {format(day, 'd', { locale: fr })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ouvriers.map((ouvrier) => (
            <tr key={ouvrier.id}>
              <td className="ouvrier-col">
                <div className="ouvrier-nom">
                  {ouvrier.nom} {ouvrier.prenom}
                </div>
                {ouvrier.type === 'SOUS_TRAITANT' && (
                  <div className="ouvrier-type">(Sous-traitant)</div>
                )}
              </td>
              {days.map((day) => {
                const { nom, periode } = getCellContent(ouvrier, day)
                return (
                  <td key={day.toISOString()}>
                    <div className="cell-chantier">{nom}</div>
                    {periode && <div className="cell-periode">{periode}</div>}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="planning-print-legend">
        LÉGENDE : Jour = Journée complète | M = Matin | AM = Après-midi
      </div>
    </div>
  )
}

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CarteChantier } from './CarteChantier'
import type { StatutChantier, Periode, TypeOuvrier } from '@/generated/prisma/client'

interface Affectation {
  id: number
  date: Date
  periode: Periode
  ouvrier: {
    id: number
    nom: string
    prenom: string
    type: TypeOuvrier
  }
}

interface Chantier {
  id: number
  nom: string
  statut: StatutChantier
  affectations: Affectation[]
}

interface GrillePlanningChantierProps {
  chantiers: Chantier[]
  joursSemaine: Date[]
}

const joursAbrevies = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export function GrillePlanningChantier({
  chantiers,
  joursSemaine
}: GrillePlanningChantierProps) {
  if (chantiers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Aucun chantier actif ou en pause trouvé.</p>
        <p className="text-gray-400 text-sm mt-2">
          Créez un chantier pour commencer à planifier.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header row with days */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 divide-x divide-gray-200 bg-gray-50">
          {joursSemaine.map((jour, index) => (
            <div
              key={jour.toISOString()}
              className="px-2 py-3 text-center"
            >
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {joursAbrevies[index]}
              </div>
              <div className="text-sm font-semibold text-gray-900 mt-1">
                {format(jour, 'd MMM', { locale: fr })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chantier cards */}
      <div className="space-y-4 overflow-x-auto">
        {chantiers.map((chantier) => (
          <CarteChantier
            key={chantier.id}
            chantier={chantier}
            joursSemaine={joursSemaine}
          />
        ))}
      </div>
    </div>
  )
}

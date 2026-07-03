import { NIVEAUX_LECTURE } from '../data/curriculum'
import { aller } from '../lib/routeur'
import { useProgres } from '../lib/progres'

export function Niveau({ id }: { id: string }) {
  const progres = useProgres()
  const niveau = NIVEAUX_LECTURE.find((n) => n.id === id)

  if (!niveau || !niveau.disponible) {
    return (
      <>
        <button className="retour" onClick={() => aller('/lecture')}>
          ← Niveaux
        </button>
        <p className="sous-titre" style={{ marginTop: 20 }}>
          Ce niveau arrive bientôt, in shâ Allah.
        </p>
      </>
    )
  }

  return (
    <>
      <button className="retour" onClick={() => aller('/lecture')}>
        ← Niveaux
      </button>
      <h2 className="titre-section">
        Niveau {niveau.num} — {niveau.nomFr}{' '}
        <span className="nom-ar ar" style={{ color: 'var(--or-fonce)' }}>{niveau.nomAr}</span>
      </h2>
      <p className="sous-titre">{niveau.description}</p>

      <div className="liste">
        {niveau.lecons.map((lecon, i) => {
          const faite = progres[lecon.id]?.terminee
          const score = progres[lecon.id]?.score
          return (
            <button
              key={lecon.id}
              className="carte carte-clic"
              onClick={() => aller(`/lecon/${lecon.id}`)}
            >
              <div className="lecon-ligne">
                <div className={`pastille ${faite ? 'faite' : ''}`}>
                  {faite ? '✓' : lecon.type === 'test' ? '★' : i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="titre-ar ar">{lecon.titreAr}</div>
                  <div className="titre-fr">
                    {lecon.titreFr}
                    {faite && score !== undefined ? ` · ${score}%` : ''}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </>
  )
}

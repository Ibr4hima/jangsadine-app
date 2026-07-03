import { NIVEAUX_LECTURE } from '../data/curriculum'
import { aller } from '../lib/routeur'
import { useProgres, compterTerminees } from '../lib/progres'

export function Lecture() {
  const progres = useProgres()

  return (
    <>
      <button className="retour" onClick={() => aller('/')}>
        ← Accueil
      </button>
      <h2 className="titre-section">
        Palier 1 — La Clé <span className="nom-ar ar" style={{ color: 'var(--or-fonce)' }}>المِفْتَاح</span>
      </h2>
      <p className="sous-titre">
        Huit niveaux pour apprendre à lire l'arabe, sur le modèle des qâʿida
        traditionnelles : on ne passe au niveau suivant qu'une fois le précédent
        maîtrisé.
      </p>

      <div className="liste">
        {NIVEAUX_LECTURE.map((niveau) => {
          const ids = niveau.lecons.map((l) => l.id)
          const faites = compterTerminees(ids, progres)
          const contenu = (
            <div className="palier">
              <div className="numero">{niveau.num}</div>
              <div className="contenu">
                <h3>
                  {niveau.nomFr}
                  <span className="nom-ar ar">{niveau.nomAr}</span>
                </h3>
                <p>{niveau.description}</p>
                {niveau.disponible ? (
                  <>
                    <div className="jauge">
                      <div
                        style={{
                          width: `${ids.length ? (faites / ids.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <p style={{ fontSize: '0.78rem', marginTop: 6 }}>
                      {faites} / {ids.length} leçons
                    </p>
                  </>
                ) : (
                  <div style={{ marginTop: 8 }}>
                    <span className="badge">Bientôt, in shâ Allah</span>
                  </div>
                )}
              </div>
            </div>
          )
          return niveau.disponible ? (
            <button
              key={niveau.id}
              className="carte carte-clic"
              onClick={() => aller(`/niveau/${niveau.id}`)}
            >
              {contenu}
            </button>
          ) : (
            <div key={niveau.id} className="carte carte-verrouillee">
              {contenu}
            </div>
          )
        })}
      </div>
    </>
  )
}

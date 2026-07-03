import { PALIERS, NIVEAUX_LECTURE } from '../data/curriculum'
import { aller } from '../lib/routeur'
import { useProgres, compterTerminees } from '../lib/progres'

export function Accueil() {
  const progres = useProgres()
  const lecons = NIVEAUX_LECTURE.flatMap((n) => n.lecons.map((l) => l.id))
  const faites = compterTerminees(lecons, progres)

  return (
    <>
      <header className="entete">
        <div className="logo ar">ع</div>
        <div>
          <h1>Jàng Araab</h1>
          <p>Apprendre l'arabe pour comprendre sa religion</p>
        </div>
      </header>

      <section className="hero">
        <p className="basmala ar">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
        <h2>Un chemin, cinq paliers</h2>
        <p>
          De la lecture des lettres jusqu'aux livres des savants : avance pas à
          pas, à ton rythme. Gratuit, pour l'amour d'Allah.
        </p>
      </section>

      <h2 className="titre-section">Les paliers</h2>
      <div className="liste">
        {PALIERS.map((palier) => {
          const carte = (
            <div className="palier">
              <div className="numero">{palier.num}</div>
              <div className="contenu">
                <h3>
                  {palier.nomFr}
                  <span className="nom-ar ar">{palier.nomAr}</span>
                </h3>
                <p>{palier.description}</p>
                {palier.sources && <div className="sources">{palier.sources}</div>}
                <div style={{ marginTop: 8 }}>
                  {palier.disponible ? (
                    <span className="badge badge-vert">
                      {faites > 0 && palier.id === 'lecture'
                        ? `${faites} leçon${faites > 1 ? 's' : ''} terminée${faites > 1 ? 's' : ''}`
                        : 'Commencer'}
                    </span>
                  ) : (
                    <span className="badge">Bientôt, in shâ Allah</span>
                  )}
                </div>
              </div>
            </div>
          )
          return palier.disponible ? (
            <button
              key={palier.id}
              className="carte carte-clic"
              onClick={() => aller('/lecture')}
            >
              {carte}
            </button>
          ) : (
            <div key={palier.id} className="carte carte-verrouillee">
              {carte}
            </div>
          )
        })}
      </div>

      <p className="pied-page">
        صدقة جارية — sadaqah jâriyah. Fait avec amour pour la oumma.
      </p>
    </>
  )
}

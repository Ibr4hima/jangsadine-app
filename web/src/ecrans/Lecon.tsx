// Le lecteur de leçon : enchaîne les étapes, calcule le score,
// enregistre la progression à la fin.

import { useCallback, useMemo, useRef, useState } from 'react'
import { leconParId, niveauDeLecon } from '../data/curriculum'
import { genererEtapes } from '../data/lecons'
import { aller } from '../lib/routeur'
import { marquerTerminee } from '../lib/progres'
import {
  EtapeDecouverte,
  EtapeFin,
  EtapeInfo,
  EtapePaires,
  EtapeQcm,
} from '../composants/Etapes'

export function Lecon({ id }: { id: string }) {
  const lecon = leconParId.get(id)
  const niveau = niveauDeLecon(id)
  const etapes = useMemo(() => (lecon ? genererEtapes(lecon) : []), [lecon])
  const [index, setIndex] = useState(0)
  const [prete, setPrete] = useState(false)
  // réponses aux exercices notés : true = juste du premier coup
  const reponses = useRef<boolean[]>([])
  const etapeNotee = useRef(false)

  const onAccompli = useCallback((justeDuPremierCoup?: boolean) => {
    if (justeDuPremierCoup !== undefined && !etapeNotee.current) {
      reponses.current.push(justeDuPremierCoup)
      etapeNotee.current = true
    }
    setPrete(true)
  }, [])

  if (!lecon || !niveau) {
    return (
      <>
        <button className="retour" onClick={() => aller('/lecture')}>
          ← Retour
        </button>
        <p className="sous-titre" style={{ marginTop: 20 }}>
          Leçon introuvable.
        </p>
      </>
    )
  }

  const etape = etapes[index]
  const derniere = index === etapes.length - 1
  const score = reponses.current.length
    ? Math.round(
        (reponses.current.filter(Boolean).length / reponses.current.length) * 100,
      )
    : null

  function continuer() {
    if (derniere) {
      marquerTerminee(lecon!.id, score ?? undefined)
      aller(`/niveau/${niveau!.id}`)
      return
    }
    etapeNotee.current = false
    setPrete(false)
    setIndex((i) => i + 1)
    window.scrollTo(0, 0)
  }

  return (
    <>
      <div className="lecteur-entete">
        <button
          className="fermer"
          aria-label="Quitter la leçon"
          onClick={() => aller(`/niveau/${niveau.id}`)}
        >
          ✕
        </button>
        <div className="lecteur-jauge">
          <div style={{ width: `${((index + 1) / etapes.length) * 100}%` }} />
        </div>
      </div>

      {etape.type === 'info' && (
        <EtapeInfo key={index} etape={etape} onAccompli={onAccompli} />
      )}
      {etape.type === 'decouverte' && (
        <EtapeDecouverte key={index} etape={etape} onAccompli={onAccompli} />
      )}
      {etape.type === 'qcm' && (
        <EtapeQcm key={index} etape={etape} onAccompli={onAccompli} />
      )}
      {etape.type === 'paires' && (
        <EtapePaires key={index} etape={etape} onAccompli={onAccompli} />
      )}
      {etape.type === 'fin' && <EtapeFin key={index} etape={etape} score={score} />}

      <div className="pied-lecon">
        <button
          className={`bouton ${derniere ? 'or' : ''}`}
          disabled={!prete && etape.type !== 'fin'}
          onClick={continuer}
        >
          {derniere ? 'Terminer la leçon' : 'Continuer'}
        </button>
      </div>
    </>
  )
}

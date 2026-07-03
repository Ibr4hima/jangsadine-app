// Les écrans d'exercice d'une leçon : découverte, QCM, paires, info, fin.

import { useEffect, useMemo, useState } from 'react'
import type { Carte, Etape } from '../data/lecons'
import { melanger } from '../data/lecons'
import { jouerArabe } from '../lib/audio'

interface PropsEtape<E> {
  etape: E
  /** Signale au lecteur que l'étape est accomplie (et si c'était juste du 1er coup) */
  onAccompli: (justeDuPremierCoup?: boolean) => void
}

export function EtapeInfo({ etape, onAccompli }: PropsEtape<Extract<Etape, { type: 'info' }>>) {
  useEffect(() => onAccompli(), [onAccompli])
  return (
    <div className="etape">
      <h2>{etape.titre}</h2>
      <p className="consigne">{etape.texte}</p>
      {etape.ar && (
        <div className="encart-ar ar" onClick={() => jouerArabe(etape.ar!)}>
          {etape.ar}
        </div>
      )}
    </div>
  )
}

export function EtapeDecouverte({
  etape,
  onAccompli,
}: PropsEtape<Extract<Etape, { type: 'decouverte' }>>) {
  const [ecoutees, setEcoutees] = useState<Set<number>>(new Set())
  useEffect(() => onAccompli(), [onAccompli])

  function ecouter(carte: Carte, i: number) {
    jouerArabe(carte.dire ?? carte.ar)
    setEcoutees((prev) => new Set(prev).add(i))
  }

  return (
    <div className="etape">
      <h2>{etape.titre}</h2>
      {etape.sousTitre && <p className="consigne">{etape.sousTitre}</p>}
      <div className="grille-cartes">
        {etape.cartes.map((carte, i) => (
          <button
            key={i}
            className={`carte-lettre ${ecoutees.has(i) ? 'ecoutee' : ''}`}
            onClick={() => ecouter(carte, i)}
          >
            <span className="glyphe ar">{carte.ar}</span>
            {carte.legende && <span className="legende">{carte.legende}</span>}
            {carte.sousLegende && (
              <span className="sous-legende">{carte.sousLegende}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export function EtapeQcm({ etape, onAccompli }: PropsEtape<Extract<Etape, { type: 'qcm' }>>) {
  const [reponse, setReponse] = useState<number | null>(null)

  function repondre(i: number) {
    if (reponse !== null) return
    setReponse(i)
    const correcte = i === etape.bonneReponse
    jouerArabe(
      etape.choix[etape.bonneReponse].dire ?? etape.choix[etape.bonneReponse].ar,
    )
    onAccompli(correcte)
  }

  const enonceTexte = etape.enonce.dire ?? etape.enonce.ar

  return (
    <div className="etape">
      <h2>{etape.question}</h2>
      <p className="consigne">
        {etape.audioSeul ? 'Touche le haut-parleur pour réécouter' : 'Touche la lettre pour l\'écouter'}
      </p>
      {etape.audioSeul ? (
        <button className="enonce-audio" onClick={() => jouerArabe(enonceTexte)} aria-label="Écouter">
          🔊
        </button>
      ) : (
        <div className="enonce-visuel ar" onClick={() => jouerArabe(enonceTexte)}>
          {etape.enonce.ar}
        </div>
      )}
      <div className="grille-choix">
        {etape.choix.map((choix, i) => {
          let classe = 'choix'
          if (etape.choixArabes) classe += ' grand-ar ar'
          if (reponse !== null) {
            if (i === reponse)
              classe += i === etape.bonneReponse ? ' correct' : ' incorrect'
            else if (i === etape.bonneReponse) classe += ' attendu'
          }
          return (
            <button key={i} className={classe} onClick={() => repondre(i)}>
              {choix.ar}
            </button>
          )
        })}
      </div>
      {reponse !== null && (
        <div className={`verdict ${reponse === etape.bonneReponse ? 'bon' : 'mauvais'}`}>
          {reponse === etape.bonneReponse
            ? 'أَحْسَنْت — Excellent !'
            : `La bonne réponse était : ${etape.choix[etape.bonneReponse].ar}`}
        </div>
      )}
    </div>
  )
}

export function EtapePaires({
  etape,
  onAccompli,
}: PropsEtape<Extract<Etape, { type: 'paires' }>>) {
  const gauches = useMemo(() => melanger(etape.paires.map((_, i) => i)), [etape])
  const droites = useMemo(() => melanger(etape.paires.map((_, i) => i)), [etape])
  const [selection, setSelection] = useState<{ cote: 'g' | 'd'; index: number } | null>(null)
  const [appariees, setAppariees] = useState<Set<number>>(new Set())
  const [erreur, setErreur] = useState<{ cote: 'g' | 'd'; index: number } | null>(null)
  const [sansFaute, setSansFaute] = useState(true)

  function toucher(cote: 'g' | 'd', index: number) {
    if (appariees.has(index)) return
    if (cote === 'g') jouerArabe(etape.paires[index].gauche.dire ?? etape.paires[index].gauche.ar)
    if (!selection || selection.cote === cote) {
      setSelection({ cote, index })
      return
    }
    // deux côtés sélectionnés : même paire ?
    if (selection.index === index) {
      const suivantes = new Set(appariees).add(index)
      setAppariees(suivantes)
      setSelection(null)
      if (suivantes.size === etape.paires.length) onAccompli(sansFaute)
    } else {
      setSansFaute(false)
      setErreur({ cote, index })
      setSelection(null)
      setTimeout(() => setErreur(null), 400)
    }
  }

  function classe(cote: 'g' | 'd', index: number, arabe: boolean) {
    let c = 'choix'
    if (arabe) c += ' grand-ar ar'
    if (appariees.has(index)) c += ' apparie'
    if (selection?.cote === cote && selection.index === index) c += ' selectionne'
    if (erreur?.cote === cote && erreur.index === index) c += ' incorrect'
    return c
  }

  return (
    <div className="etape">
      <h2>{etape.titre}</h2>
      <p className="consigne">Touche un élément de chaque colonne pour former les paires</p>
      <div className="colonnes-paires">
        <div className="liste" style={{ marginTop: 0 }}>
          {gauches.map((i) => (
            <button key={i} className={classe('g', i, true)} onClick={() => toucher('g', i)}>
              {etape.paires[i].gauche.ar}
            </button>
          ))}
        </div>
        <div className="liste" style={{ marginTop: 0 }}>
          {droites.map((i) => (
            <button key={i} className={classe('d', i, false)} onClick={() => toucher('d', i)}>
              {etape.paires[i].droite.ar}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function EtapeFin({
  etape,
  score,
}: {
  etape: Extract<Etape, { type: 'fin' }>
  score: number | null
}) {
  return (
    <div className="etape ecran-fin">
      <p className="titre-ar ar">{etape.titre}</p>
      {score !== null && <p className="score">{score}%</p>}
      <p className="consigne">{etape.texte}</p>
    </div>
  )
}

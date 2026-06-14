import AsyncStorage from '@react-native-async-storage/async-storage'
import { Asset } from 'expo-asset'
import {
  AudioPlayer,
  AudioMetadata,
  AudioStatus,
  createAudioPlayer,
  setAudioModeAsync,
  setIsAudioActiveAsync,
} from 'expo-audio'
import { readAsStringAsync } from 'expo-file-system/legacy'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Alert } from 'react-native'

// Logo de l'app affiché par défaut comme jaquette sur l'écran verrouillé
const LOGO_APP = require('../assets/images/logo.png')

export type Piste = {
  id: string
  titre: string
  sheikh: string
  url: string
  duree?: string
  href?: string
  programmeId?: string
  episodeIndex?: number
  // URL de jaquette affichée sur l'écran verrouillé (optionnel)
  pochette?: string
}

export type OptionsLecture = {
  // Démarre à cette position (secondes) au lieu de la reprise sauvegardée
  position?: number
  // true : ouvrir le lecteur plein écran au lancement (sinon on garde le mini lecteur)
  ouvrirLecteur?: boolean
}

// Progression : mise à jour ~2×/s pendant la lecture. Volontairement isolée
// dans son propre contexte pour que seul le lecteur (mini + plein écran) se
// re-render à cette fréquence — les listes/accueil restent immobiles.
type AudioProgressType = {
  progression: number
  tempsActuel: number
  dureeTotal: number
}

type AudioContextType = {
  piste: Piste | null
  enLecture: boolean
  vitesse: number
  volume: number
  lecteurOuvert: boolean
  setLecteurOuvert: (v: boolean) => void
  jouer: (p: Piste, suivantes?: Piste[], options?: OptionsLecture, playlistComplete?: Piste[]) => void
  pause: () => void
  reprendre: () => void
  seeker: (pct: number) => void
  avancer: (sec: number) => void
  reculer: (sec: number) => void
  changerVitesse: (v: number) => void
  changerVolume: (v: number) => void
  pisterSuivante: () => void
  pistePrecedente: () => void
  file: Piste[]
  playlist: Piste[]
  ajouterAFile: (p: Piste[]) => void
}

const AudioCtx = createContext<AudioContextType | null>(null)
const AudioProgressCtx = createContext<AudioProgressType | null>(null)

export function AudioProvider({ children }: { children: React.ReactNode }) {
  // Lecteur persistant unique : on change de piste via replace(), ce qui garde
  // les contrôles de l'écran verrouillé attachés en permanence.
  const playerRef = useRef<AudioPlayer | null>(null)
  const fileRef = useRef<Piste[]>([])
  const tempsRef = useRef(0)
  const dureeRef = useRef(0)
  const vitesseRef = useRef(1)
  // Ignore stale status updates briefly after a seek so the progress
  // bar never jumps backwards while expo-audio catches up
  const ignoreJusquaRef = useRef(0)
  // Compteur de génération : seul le chargement le plus récent applique sa
  // reprise / son watchdog — sinon une piste lancée pendant qu'une autre charge
  // encore pourrait se positionner ou s'interrompre à tort.
  const generationRef = useRef(0)
  const pisteIdRef = useRef<string | null>(null)
  const pisteRef = useRef<Piste | null>(null)
  const derniereSauvegardeRef = useRef(0)
  // Jaquette par défaut (logo de l'app) en data-URL base64, prête une fois
  // le logo embarqué lu au démarrage. URLSession charge les data: de façon fiable.
  const pochetteDefautRef = useRef<string | undefined>(undefined)
  // Position à appliquer dès que la nouvelle source est chargée (reprise)
  const repriseEnAttenteRef = useRef<number | null>(null)
  // Watchdog de chargement : alerte si la piste ne charge jamais
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Permet à pisterSuivante (mémorisé) d'appeler la dernière version de
  // chargerEtJouer sans créer de dépendance circulaire entre les useCallback.
  const chargerEtJouerRef = useRef<(p: Piste, suivantes?: Piste[], options?: OptionsLecture) => void>(() => {})

  const [piste, setPiste] = useState<Piste | null>(null)
  const [file, setFile] = useState<Piste[]>([])
  const [playlist, setPlaylist] = useState<Piste[]>([])
  const [enLecture, setEnLecture] = useState(false)
  const [progression, setProgression] = useState(0)
  const [tempsActuel, setTempsActuel] = useState(0)
  const [dureeTotal, setDureeTotal] = useState(0)
  const [vitesse, setVitesse] = useState(1)
  const [volume, setVolume] = useState(1)
  const [lecteurOuvert, setLecteurOuvert] = useState(false)

  useEffect(() => { fileRef.current = file }, [file])
  useEffect(() => { tempsRef.current = tempsActuel }, [tempsActuel])
  useEffect(() => { dureeRef.current = dureeTotal }, [dureeTotal])

  // On ne mémorise QUE la position du dernier audio écouté (pour « Reprendre
  // l'écoute » de l'accueil). Rejouer un autre audio repart toujours du début.
  const sauverDernierePosition = useCallback((temps: number, duree: number) => {
    // À moins de 20s de la fin on considère l'épisode terminé → on repart de 0.
    const pos = (duree > 0 && duree - temps < 20) ? 0 : Math.max(0, temps)
    AsyncStorage.setItem('jsd_derniere_position', String(pos)).catch(() => {})
  }, [])

  // Métadonnées de l'écran verrouillé : jaquette propre à la piste si fournie,
  // sinon le logo de l'app (dès qu'il est prêt).
  const construireMetadata = useCallback((p: Piste): AudioMetadata => ({
    title: p.titre,
    artist: p.sheikh,
    artworkUrl: p.pochette ?? pochetteDefautRef.current,
  }), [])

  const annulerWatchdog = useCallback(() => {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current)
      watchdogRef.current = null
    }
  }, [])

  const pisterSuivante = useCallback(async () => {
    const f = fileRef.current
    if (f.length > 0) {
      const [prochaine, ...reste] = f
      chargerEtJouerRef.current(prochaine, reste)
    }
  }, [])

  // Reçoit les mises à jour du lecteur (~2×/s). Stable : ne lit que des refs.
  const onUpdate = useCallback((status: AudioStatus) => {
    if (!status.isLoaded) return
    annulerWatchdog()

    const t = status.currentTime ?? 0
    const d = status.duration ?? 0
    setEnLecture(status.playing)
    if (d > 0) setDureeTotal(d)

    // Reprise : on attend que la durée soit connue puis on se positionne une fois
    if (repriseEnAttenteRef.current != null && d > 0) {
      const pos = repriseEnAttenteRef.current
      repriseEnAttenteRef.current = null
      if (pos > 1 && pos < d - 1) {
        ignoreJusquaRef.current = Date.now() + 900
        playerRef.current?.seekTo(pos).catch(() => {})
      }
    }

    if (Date.now() >= ignoreJusquaRef.current) {
      setTempsActuel(t)
      setProgression(d > 0 ? (t / d) * 100 : 0)
    }

    // Sauvegarde régulière de la position du dernier audio (toutes les 5s)
    if (pisteIdRef.current && status.playing && Date.now() - derniereSauvegardeRef.current > 5000) {
      derniereSauvegardeRef.current = Date.now()
      sauverDernierePosition(t, d)
    }

    if (status.didJustFinish) {
      // Épisode terminé : on oublie la position pour repartir du début
      AsyncStorage.setItem('jsd_derniere_position', '0').catch(() => {})
      pisterSuivante()
    }
  }, [annulerWatchdog, sauverDernierePosition, pisterSuivante])

  // Lit le logo embarqué une fois et le convertit en data-URL pour servir de
  // jaquette par défaut sur l'écran verrouillé.
  useEffect(() => {
    let annule = false
    ;(async () => {
      try {
        const asset = Asset.fromModule(LOGO_APP)
        await asset.downloadAsync()
        if (annule || !asset.localUri) return
        const b64 = await readAsStringAsync(asset.localUri, { encoding: 'base64' })
        if (annule) return
        pochetteDefautRef.current = `data:image/jpeg;base64,${b64}`
        // Une piste joue déjà : on pousse la jaquette tout de suite
        if (pisteRef.current && playerRef.current) {
          playerRef.current.updateLockScreenMetadata(construireMetadata(pisteRef.current))
        }
      } catch {}
    })()
    return () => { annule = true }
  }, [construireMetadata])

  // Création du lecteur persistant + configuration de la session audio (une fois)
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
      allowsRecording: false,
    }).catch(() => {})

    const p = createAudioPlayer(null, { updateInterval: 500 })
    playerRef.current = p
    const sub = p.addListener('playbackStatusUpdate', onUpdate)
    setIsAudioActiveAsync(true).catch(() => {})

    return () => {
      annulerWatchdog()
      sub?.remove?.()
      try { p.clearLockScreenControls() } catch {}
      try { p.remove() } catch {}
      playerRef.current = null
    }
    // onUpdate est stable (useCallback) — abonnement unique
  }, [onUpdate, annulerWatchdog])

  const chargerEtJouer = useCallback((p: Piste, suivantes: Piste[] = [], options?: OptionsLecture) => {
    const player = playerRef.current
    if (!player) return
    const generation = ++generationRef.current

    setPiste(p)
    pisteIdRef.current = p.id
    pisteRef.current = p
    if (options?.ouvrirLecteur === true) setLecteurOuvert(true)
    setFile(suivantes)
    AsyncStorage.setItem('jsd_derniere_piste', JSON.stringify(p)).catch(() => {})

    // Reprise uniquement si une position est explicitement demandée
    // (ex. « Reprendre l'écoute »). Sinon on repart toujours du début.
    const reprise = options?.position ?? 0
    AsyncStorage.setItem('jsd_derniere_position', String(reprise)).catch(() => {})
    setProgression(0)
    setTempsActuel(reprise)
    setDureeTotal(0)
    repriseEnAttenteRef.current = reprise > 1 ? reprise : null

    try {
      player.replace({ uri: p.url })
      player.setPlaybackRate(vitesseRef.current, 'high')
      player.play()

      // Affiche les contrôles sur l'écran verrouillé / centre de contrôle
      player.setActiveForLockScreen(
        true,
        construireMetadata(p),
        { showSeekForward: true, showSeekBackward: true },
      )
      setEnLecture(true)

      // Watchdog : si rien n'a chargé au bout de 20s, on prévient l'utilisateur
      annulerWatchdog()
      watchdogRef.current = setTimeout(() => {
        if (generation !== generationRef.current) return
        if (dureeRef.current > 0) return
        setEnLecture(false)
        Alert.alert(
          'Lecture impossible',
          'Le fichier audio n\'a pas pu être chargé. Vérifiez votre connexion internet puis réessayez.',
        )
      }, 20000)
    } catch (e) {
      if (generation !== generationRef.current) return
      console.error('Erreur audio:', e)
      setEnLecture(false)
      Alert.alert(
        'Lecture impossible',
        'Le fichier audio n\'a pas pu être chargé. Vérifiez votre connexion internet puis réessayez.',
      )
    }
  }, [annulerWatchdog, construireMetadata])

  useEffect(() => { chargerEtJouerRef.current = chargerEtJouer }, [chargerEtJouer])

  const playlistRef = useRef<Piste[]>([])

  const definirPlaylist = useCallback((liste: Piste[]) => {
    playlistRef.current = liste
    setPlaylist(liste)
    AsyncStorage.setItem('jsd_derniere_playlist', JSON.stringify(liste)).catch(() => {})
  }, [])

  const jouer = useCallback((p: Piste, suivantes: Piste[] = [], options?: OptionsLecture, playlistComplete?: Piste[]) => {
    if (playlistComplete) {
      definirPlaylist(playlistComplete)
    } else if (suivantes.length === 0 && playlistRef.current.some(t => t.id === p.id)) {
      // Resuming a track that's already in the current playlist — keep the full playlist intact.
      // On recale juste la file (suivantes) à partir de la piste reprise.
      const idx = playlistRef.current.findIndex(t => t.id === p.id)
      suivantes = idx >= 0 ? playlistRef.current.slice(idx + 1) : suivantes
    } else {
      definirPlaylist([p, ...suivantes])
    }
    chargerEtJouer(p, suivantes, options)
  }, [definirPlaylist, chargerEtJouer])

  const pause = useCallback(async () => {
    playerRef.current?.pause()
    if (pisteIdRef.current) sauverDernierePosition(tempsRef.current, dureeRef.current)
  }, [sauverDernierePosition])

  const reprendre = useCallback(async () => {
    playerRef.current?.play()
  }, [])

  const seekOptimiste = useCallback(async (newTime: number) => {
    setTempsActuel(newTime)
    if (dureeRef.current > 0) setProgression((newTime / dureeRef.current) * 100)
    ignoreJusquaRef.current = Date.now() + 900
    await playerRef.current?.seekTo(newTime).catch(() => {})
  }, [])

  const seeker = useCallback(async (pct: number) => {
    if (!playerRef.current || dureeRef.current === 0) return
    await seekOptimiste((pct / 100) * dureeRef.current)
  }, [seekOptimiste])

  const avancer = useCallback(async (sec: number) => {
    if (!playerRef.current) return
    await seekOptimiste(Math.min(tempsRef.current + sec, dureeRef.current))
  }, [seekOptimiste])

  const reculer = useCallback(async (sec: number) => {
    if (!playerRef.current) return
    await seekOptimiste(Math.max(tempsRef.current - sec, 0))
  }, [seekOptimiste])

  const changerVolume = useCallback(async (v: number) => {
    setVolume(v)
    if (playerRef.current) playerRef.current.volume = v
  }, [])

  const changerVitesse = useCallback(async (v: number) => {
    vitesseRef.current = v
    setVitesse(v)
    playerRef.current?.setPlaybackRate(v, 'high')
  }, [])

  const pistePrecedente = useCallback(async () => {
    if (tempsRef.current > 3) {
      await playerRef.current?.seekTo(0).catch(() => {})
    }
  }, [])

  const ajouterAFile = useCallback((pistes: Piste[]) => {
    setFile(prev => [...prev, ...pistes])
  }, [])

  // Valeur « contrôle » : ne change que sur de vrais événements (piste, lecture,
  // vitesse…). Toutes les fonctions sont useCallback-stables, donc cette valeur
  // garde la même identité pendant les mises à jour de progression.
  const controlValue = useMemo<AudioContextType>(() => ({
    piste, enLecture, vitesse, volume,
    lecteurOuvert, setLecteurOuvert,
    jouer, pause, reprendre, seeker, avancer, reculer,
    changerVitesse, changerVolume, pisterSuivante, pistePrecedente,
    file, playlist, ajouterAFile,
  }), [
    piste, enLecture, vitesse, volume, lecteurOuvert, file, playlist,
    jouer, pause, reprendre, seeker, avancer, reculer,
    changerVitesse, changerVolume, pisterSuivante, pistePrecedente, ajouterAFile,
  ])

  const progressValue = useMemo<AudioProgressType>(
    () => ({ progression, tempsActuel, dureeTotal }),
    [progression, tempsActuel, dureeTotal],
  )

  return (
    <AudioCtx.Provider value={controlValue}>
      <AudioProgressCtx.Provider value={progressValue}>
        {children}
      </AudioProgressCtx.Provider>
    </AudioCtx.Provider>
  )
}

export function useAudio() {
  const ctx = useContext(AudioCtx)
  if (!ctx) throw new Error('useAudio doit être dans AudioProvider')
  return ctx
}

export function useAudioProgress() {
  const ctx = useContext(AudioProgressCtx)
  if (!ctx) throw new Error('useAudioProgress doit être dans AudioProvider')
  return ctx
}

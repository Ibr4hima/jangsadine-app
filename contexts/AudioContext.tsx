import AsyncStorage from '@react-native-async-storage/async-storage'
import { Audio, AVPlaybackStatus } from 'expo-av'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Alert } from 'react-native'

export type Piste = {
  id: string
  titre: string
  sheikh: string
  url: string
  duree?: string
  href?: string
  programmeId?: string
  episodeIndex?: number
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
  const soundRef = useRef<Audio.Sound | null>(null)
  const fileRef = useRef<Piste[]>([])
  const tempsRef = useRef(0)
  const dureeRef = useRef(0)
  const vitesseRef = useRef(1)
  // Ignore stale status updates briefly after a seek so the progress
  // bar never jumps backwards while expo-av catches up
  const ignoreJusquaRef = useRef(0)
  // Compteur de génération : seul le chargement le plus récent garde
  // son son — sinon deux audios peuvent se lire en même temps quand on
  // lance une piste pendant que la précédente charge encore
  const chargementRef = useRef(0)
  // Positions de lecture sauvegardées par piste (reprise où on s'était arrêté)
  const positionsRef = useRef<Record<string, number>>({})
  const pisteIdRef = useRef<string | null>(null)
  const derniereSauvegardeRef = useRef(0)

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

  useEffect(() => {
    Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      allowsRecordingIOS: false,
      interruptionModeIOS: 1,
      interruptionModeAndroid: 1,
      playThroughEarpieceAndroid: false,
    })
  }, [])

  useEffect(() => { fileRef.current = file }, [file])
  useEffect(() => { tempsRef.current = tempsActuel }, [tempsActuel])
  useEffect(() => { dureeRef.current = dureeTotal }, [dureeTotal])

  // Charge les positions sauvegardées au démarrage
  useEffect(() => {
    AsyncStorage.getItem('jsd_positions')
      .then(v => { if (v) positionsRef.current = JSON.parse(v) })
      .catch(() => {})
  }, [])

  const persisterPositions = () => {
    AsyncStorage.setItem('jsd_positions', JSON.stringify(positionsRef.current)).catch(() => {})
  }

  const sauverPosition = (id: string, temps: number, duree: number) => {
    // À moins de 20s de la fin on considère l'épisode terminé :
    // la prochaine écoute reprendra du début
    if (duree > 0 && duree - temps < 20) delete positionsRef.current[id]
    else if (temps > 5) positionsRef.current[id] = temps
    else return
    persisterPositions()
  }

  const pisterSuivante = useCallback(async () => {
    const f = fileRef.current
    if (f.length > 0) {
      const [prochaine, ...reste] = f
      await chargerEtJouer(prochaine, reste)
    }
  }, [])

  const onUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return
    const t = (status.positionMillis ?? 0) / 1000
    const d = (status.durationMillis ?? 0) / 1000
    setEnLecture(status.isPlaying)
    setDureeTotal(d)
    if (Date.now() >= ignoreJusquaRef.current) {
      setTempsActuel(t)
      setProgression(d > 0 ? (t / d) * 100 : 0)
    }
    // Sauvegarde régulière de la position (toutes les 5s de lecture)
    const id = pisteIdRef.current
    if (id && status.isPlaying && Date.now() - derniereSauvegardeRef.current > 5000) {
      derniereSauvegardeRef.current = Date.now()
      sauverPosition(id, t, d)
    }
    if (status.didJustFinish) {
      // Épisode terminé : on oublie la position pour repartir du début
      if (id) { delete positionsRef.current[id]; persisterPositions() }
      pisterSuivante()
    }
  }, [pisterSuivante])

  const chargerEtJouer = async (p: Piste, suivantes: Piste[] = [], options?: OptionsLecture) => {
    const generation = ++chargementRef.current
    try {
      // Mémorise où on en était sur la piste précédente avant de zapper
      if (pisteIdRef.current && tempsRef.current > 0) {
        sauverPosition(pisteIdRef.current, tempsRef.current, dureeRef.current)
      }

      if (soundRef.current) {
        const ancien = soundRef.current
        soundRef.current = null
        await ancien.unloadAsync().catch(() => {})
      }
      if (generation !== chargementRef.current) return

      setPiste(p)
      pisteIdRef.current = p.id
      if (options?.ouvrirLecteur === true) setLecteurOuvert(true)
      setFile(suivantes)
      AsyncStorage.setItem('jsd_derniere_piste', JSON.stringify(p)).catch(() => {})

      // Position explicite, sinon reprise là où on s'était arrêté
      const reprise = options?.position ?? positionsRef.current[p.id] ?? 0
      setProgression(0)
      setTempsActuel(reprise)
      setDureeTotal(0)

      // Les connexions mobiles (3G…) font parfois échouer le handshake
      // SSL (NSURLError -1200) : on retente avant d'abandonner
      let derniereErreur: unknown = null
      for (let essai = 0; essai < 3; essai++) {
        try {
          if (essai > 0) await new Promise(r => setTimeout(r, 800 * essai))
          if (generation !== chargementRef.current) return
          const { sound } = await Audio.Sound.createAsync(
            { uri: p.url },
            {
              shouldPlay: true,
              rate: vitesseRef.current,
              progressUpdateIntervalMillis: 500,
              volume: 1.0,
              positionMillis: (options?.position != null ? reprise > 0 : reprise > 5) ? Math.round(reprise * 1000) : 0,
            },
            onUpdate
          )
          // Une piste plus récente a été lancée pendant le chargement :
          // on jette ce son pour ne pas avoir deux lectures en parallèle
          if (generation !== chargementRef.current) {
            sound.unloadAsync().catch(() => {})
            return
          }
          soundRef.current = sound
          setEnLecture(true)
          return
        } catch (e) {
          derniereErreur = e
        }
      }
      throw derniereErreur
    } catch (e) {
      if (generation !== chargementRef.current) return
      console.error('Erreur audio:', e)
      setEnLecture(false)
      Alert.alert(
        'Lecture impossible',
        'Le fichier audio n\'a pas pu être chargé. Vérifiez votre connexion internet puis réessayez.',
      )
    }
  }

  const playlistRef = useRef<Piste[]>([])

  const definirPlaylist = (liste: Piste[]) => {
    playlistRef.current = liste
    setPlaylist(liste)
    AsyncStorage.setItem('jsd_derniere_playlist', JSON.stringify(liste)).catch(() => {})
  }

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
  }, [onUpdate])

  const pause = useCallback(async () => {
    await soundRef.current?.pauseAsync()
    if (pisteIdRef.current) sauverPosition(pisteIdRef.current, tempsRef.current, dureeRef.current)
  }, [])

  const reprendre = useCallback(async () => {
    await soundRef.current?.playAsync()
  }, [])

  const seekOptimiste = async (newTime: number) => {
    setTempsActuel(newTime)
    if (dureeRef.current > 0) setProgression((newTime / dureeRef.current) * 100)
    ignoreJusquaRef.current = Date.now() + 900
    await soundRef.current?.setPositionAsync(newTime * 1000)
  }

  const seeker = useCallback(async (pct: number) => {
    if (!soundRef.current || dureeRef.current === 0) return
    await seekOptimiste((pct / 100) * dureeRef.current)
  }, [])

  const avancer = useCallback(async (sec: number) => {
    if (!soundRef.current) return
    await seekOptimiste(Math.min(tempsRef.current + sec, dureeRef.current))
  }, [])

  const reculer = useCallback(async (sec: number) => {
    if (!soundRef.current) return
    await seekOptimiste(Math.max(tempsRef.current - sec, 0))
  }, [])

  const changerVolume = useCallback(async (v: number) => {
    setVolume(v)
    await soundRef.current?.setVolumeAsync(v)
  }, [])

  const changerVitesse = useCallback(async (v: number) => {
    vitesseRef.current = v
    setVitesse(v)
    await soundRef.current?.setRateAsync(v, true)
  }, [])

  const pistePrecedente = useCallback(async () => {
    if (tempsRef.current > 3) {
      await soundRef.current?.setPositionAsync(0)
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

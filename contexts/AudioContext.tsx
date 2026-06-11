import { Audio, AVPlaybackStatus } from 'expo-av'
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

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

type AudioContextType = {
  piste: Piste | null
  enLecture: boolean
  progression: number
  tempsActuel: number
  dureeTotal: number
  vitesse: number
  volume: number
  lecteurOuvert: boolean
  setLecteurOuvert: (v: boolean) => void
  jouer: (p: Piste, suivantes?: Piste[]) => void
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
  ajouterAFile: (p: Piste[]) => void
}

const AudioCtx = createContext<AudioContextType | null>(null)

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const soundRef = useRef<Audio.Sound | null>(null)
  const fileRef = useRef<Piste[]>([])
  const tempsRef = useRef(0)
  const dureeRef = useRef(0)
  const vitesseRef = useRef(1)
  // Ignore stale status updates briefly after a seek so the progress
  // bar never jumps backwards while expo-av catches up
  const ignoreJusquaRef = useRef(0)

  const [piste, setPiste] = useState<Piste | null>(null)
  const [file, setFile] = useState<Piste[]>([])
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
    if (status.didJustFinish) pisterSuivante()
  }, [pisterSuivante])

  const chargerEtJouer = async (p: Piste, suivantes: Piste[] = []) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync()
        soundRef.current = null
      }
      setPiste(p)
      setLecteurOuvert(true)
      setFile(suivantes)
      setProgression(0)
      setTempsActuel(0)
      setDureeTotal(0)

      const { sound } = await Audio.Sound.createAsync(
        { uri: p.url },
        {
          shouldPlay: true,
          rate: vitesseRef.current,
          progressUpdateIntervalMillis: 500,
          volume: 1.0,
        },
        onUpdate
      )
      soundRef.current = sound
      setEnLecture(true)
    } catch (e) {
      console.error('Erreur audio:', e)
    }
  }

  const jouer = useCallback((p: Piste, suivantes: Piste[] = []) => {
    chargerEtJouer(p, suivantes)
  }, [onUpdate])

  const pause = useCallback(async () => {
    await soundRef.current?.pauseAsync()
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

  return (
    <AudioCtx.Provider value={{
      piste, enLecture, progression, tempsActuel, dureeTotal, vitesse, volume,
      lecteurOuvert, setLecteurOuvert,
      jouer, pause, reprendre, seeker, avancer, reculer,
      changerVitesse, changerVolume, pisterSuivante, pistePrecedente,
      file, ajouterAFile,
    }}>
      {children}
    </AudioCtx.Provider>
  )
}

export function useAudio() {
  const ctx = useContext(AudioCtx)
  if (!ctx) throw new Error('useAudio doit être dans AudioProvider')
  return ctx
}

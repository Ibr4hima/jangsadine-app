import AsyncStorage from '@react-native-async-storage/async-storage'
import { createDownloadResumable, deleteAsync, documentDirectory, DownloadProgressData, getInfoAsync, makeDirectoryAsync } from 'expo-file-system/legacy'
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

const DOSSIER = documentDirectory + 'audio/'

export type Telechargement = {
    id: string
    titre: string
    sheikh: string
    coursId: string
    coursTitre: string
    url: string
    cheminLocal: string
    taille: number
    dateTelechargement: string
    type?: 'cours' | 'conference' | 'khoutbah' | 'fatwa'
    numero?: number
}

export type ProgressionTelecharge = {
    id: string
    progression: number // 0-100
    enCours: boolean
}

type TelechargementContextType = {
    telechargements: Telechargement[]
    progressions: Record<string, ProgressionTelecharge>
    telecharger: (episode: {
        id: string
        titre: string
        sheikh: string
        coursId: string
        coursTitre: string
        url: string
        type?: 'cours' | 'conference' | 'khoutbah' | 'fatwa'
        numero?: number
    }) => Promise<void>
    supprimer: (id: string) => Promise<void>
    estTelecharge: (id: string) => boolean
    estEnCours: (id: string) => boolean
    getCheminLocal: (id: string) => string | null
    tailleTotal: number
}

const TelechargementCtx = createContext<TelechargementContextType | null>(null)
const STORAGE_KEY = 'jsd_telechargements'

export function TelechargementProvider({ children }: { children: React.ReactNode }) {
    const [telechargements, setTelechargements] = useState<Telechargement[]>([])
    const [progressions, setProgressions] = useState<Record<string, ProgressionTelecharge>>({})

    useEffect(() => {
        async function init() {
            // Créer le dossier si nécessaire
            const info = await getInfoAsync(DOSSIER)
            if (!info.exists) await makeDirectoryAsync(DOSSIER, { intermediates: true })

            // Charger depuis AsyncStorage
            const raw = await AsyncStorage.getItem(STORAGE_KEY)
            if (raw) {
                const data: Telechargement[] = JSON.parse(raw)
                // Vérifier que les fichiers existent encore
                const valides = await Promise.all(
                    data.map(async t => {
                        const info = await getInfoAsync(t.cheminLocal)
                        return info.exists ? t : null
                    })
                )
                const filtres = valides.filter(Boolean) as Telechargement[]
                setTelechargements(filtres)
                if (filtres.length !== data.length) {
                    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtres))
                }
            }
        }
        init().catch(e => console.warn('init téléchargements:', e))
    }, [])

    const telecharger = useCallback(async (episode: {
        id: string
        titre: string
        sheikh: string
        coursId: string
        coursTitre: string
        url: string
        type?: 'cours' | 'conference' | 'khoutbah' | 'fatwa'
        numero?: number
    }) => {
        // Déjà téléchargé ou en cours
        if (telechargements.find(t => t.id === episode.id)) return
        if (progressions[episode.id]?.enCours) return

        const chemin = DOSSIER + episode.id + '.mp3'

        // Initialiser progression
        setProgressions(prev => ({
            ...prev,
            [episode.id]: { id: episode.id, progression: 0, enCours: true }
        }))

        try {
            const callback = (dp: DownloadProgressData) => {
                const pct = dp.totalBytesExpectedToWrite > 0
                    ? (dp.totalBytesWritten / dp.totalBytesExpectedToWrite) * 100
                    : 0
                setProgressions(prev => ({
                    ...prev,
                    [episode.id]: { id: episode.id, progression: Math.round(pct), enCours: true }
                }))
            }

            const downloadResumable = createDownloadResumable(
                episode.url, chemin, {}, callback
            )

            const result = await downloadResumable.downloadAsync()
            if (!result) throw new Error('Téléchargement échoué')

            const fileInfo = await getInfoAsync(chemin)
            const taille = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0

            const nouveau: Telechargement = {
                id: episode.id,
                titre: episode.titre,
                sheikh: episode.sheikh,
                coursId: episode.coursId,
                coursTitre: episode.coursTitre,
                url: episode.url,
                cheminLocal: chemin,
                taille,
                dateTelechargement: new Date().toISOString(),
                type: episode.type ?? 'cours',
                numero: episode.numero,
            }

            const nouveaux = [...telechargements, nouveau]
            setTelechargements(nouveaux)
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nouveaux))

            setProgressions(prev => ({
                ...prev,
                [episode.id]: { id: episode.id, progression: 100, enCours: false }
            }))
        } catch (e) {
            console.error('Erreur téléchargement:', e)
            setProgressions(prev => {
                const next = { ...prev }
                delete next[episode.id]
                return next
            })
        }
    }, [telechargements, progressions])

    const supprimer = useCallback(async (id: string) => {
        const t = telechargements.find(t => t.id === id)
        if (!t) return
        try {
            await deleteAsync(t.cheminLocal, { idempotent: true })
        } catch (e) { }
        const filtres = telechargements.filter(t => t.id !== id)
        setTelechargements(filtres)
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtres))
    }, [telechargements])

    const estTelecharge = useCallback((id: string) => {
        return telechargements.some(t => t.id === id)
    }, [telechargements])

    const estEnCours = useCallback((id: string) => {
        return progressions[id]?.enCours ?? false
    }, [progressions])

    const getCheminLocal = useCallback((id: string) => {
        return telechargements.find(t => t.id === id)?.cheminLocal ?? null
    }, [telechargements])

    const tailleTotal = telechargements.reduce((acc, t) => acc + t.taille, 0)

    return (
        <TelechargementCtx.Provider value={{
            telechargements, progressions,
            telecharger, supprimer,
            estTelecharge, estEnCours, getCheminLocal,
            tailleTotal,
        }}>
            {children}
        </TelechargementCtx.Provider>
    )
}

export function useTelechargement() {
    const ctx = useContext(TelechargementCtx)
    if (!ctx) throw new Error('useTelechargement doit être dans TelechargementProvider')
    return ctx
}
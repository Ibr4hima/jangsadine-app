import AsyncStorage from '@react-native-async-storage/async-storage'

export type CoursProgramme = {
  id: string
  titre: string
  sheikh: string
  nb_episodes: number
  categories: { nom: string }
}

export type Programme = {
  id: string
  nom: string
  intention: string
  cours: CoursProgramme[]
  dateCreation: string
  episodesEcoutes: string[]
  coursTermines: string[]
}

const STORAGE_KEY = 'jsd_programmes'

export function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// Les anciens programmes n'ont pas coursTermines : on normalise à la lecture
export async function chargerProgrammes(): Promise<Programme[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const liste = JSON.parse(raw) as Programme[]
    return liste.map(p => ({ ...p, coursTermines: p.coursTermines ?? [], episodesEcoutes: p.episodesEcoutes ?? [] }))
  } catch {
    return []
  }
}

export async function sauvegarderProgrammes(p: Programme[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(p)).catch(() => {})
}

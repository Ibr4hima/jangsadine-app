import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Location from 'expo-location'

export type InfoGeo = {
  isoCountryCode: string | null
  city: string | null
  region: string | null
  country: string | null
}

const CLE_CACHE = 'geo_inverse_cache'
const TTL_MS = 24 * 60 * 60 * 1000 // 24h

// Cache mémoire partagé entre tous les écrans : une seule requête
// de géocodage par session, même si 4 écrans la demandent en même temps
let enCours: Promise<InfoGeo> | null = null
let memoire: { cle: string; date: number; info: InfoGeo } | null = null

// ~1,1 km de précision : suffisant pour ville/pays
const cleCoords = (lat: number, lon: number) => `${lat.toFixed(2)},${lon.toFixed(2)}`

const VIDE: InfoGeo = { isoCountryCode: null, city: null, region: null, country: null }

async function geocoder(latitude: number, longitude: number): Promise<InfoGeo> {
  const cle = cleCoords(latitude, longitude)

  if (memoire && memoire.cle === cle && Date.now() - memoire.date < TTL_MS) {
    return memoire.info
  }

  try {
    const brut = await AsyncStorage.getItem(CLE_CACHE)
    if (brut) {
      const sauve = JSON.parse(brut) as typeof memoire
      if (sauve && sauve.cle === cle && Date.now() - sauve.date < TTL_MS) {
        memoire = sauve
        return sauve.info
      }
    }
  } catch {}

  try {
    const geo = await Location.reverseGeocodeAsync({ latitude, longitude })
    const info: InfoGeo = {
      isoCountryCode: geo[0]?.isoCountryCode ?? null,
      city: geo[0]?.city ?? null,
      region: geo[0]?.region ?? null,
      country: geo[0]?.country ?? null,
    }
    memoire = { cle, date: Date.now(), info }
    AsyncStorage.setItem(CLE_CACHE, JSON.stringify(memoire)).catch(() => {})
    return info
  } catch {
    // Rate limit ou réseau : on renvoie le dernier cache connu même périmé,
    // sinon des valeurs nulles — jamais d'erreur non gérée
    if (memoire && memoire.cle === cle) return memoire.info
    return VIDE
  }
}

export async function geocoderInverse(latitude: number, longitude: number): Promise<InfoGeo> {
  if (enCours) return enCours
  enCours = geocoder(latitude, longitude).finally(() => { enCours = null })
  return enCours
}

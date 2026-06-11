import { colors, radius, spacing, typography } from '@/constants/theme'
import { geocoderInverse } from '@/lib/geo'
import * as adhan from 'adhan'
import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, StatusBar, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Circle } from 'react-native-svg'

type PriereInfo = { nom: string; heure: string; cle: string }

function enMinutes(h: string) {
  const [hh, mm] = h.split(':').map(Number)
  return hh * 60 + mm
}

function nowMin() {
  const n = new Date()
  return n.getHours() * 60 + n.getMinutes()
}

function fmt(date: Date) {
  return date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0')
}

function tempsRestant(heure: string): string {
  const now = new Date()
  const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
  let cibleSec = enMinutes(heure) * 60
  if (cibleSec <= nowSec) cibleSec += 86400
  const diff = cibleSec - nowSec
  const hh = Math.floor(diff / 3600)
  const mm = Math.floor((diff % 3600) / 60)
  const ss = diff % 60
  return hh.toString().padStart(2, '0') + ':' + mm.toString().padStart(2, '0') + ':' + ss.toString().padStart(2, '0')
}

function progressionPriere(heure: string): number {
  const now = nowMin()
  let cible = enMinutes(heure)
  if (cible <= now) cible += 1440
  const restant = cible - now
  return Math.max(0, Math.min(100, ((360 - restant) / 360) * 100))
}

function calculerMoitieNuit(maghrib: string, fajr: string): string {
  let maghribMin = enMinutes(maghrib)
  let fajrMin = enMinutes(fajr)
  if (fajrMin < maghribMin) fajrMin += 1440
  const milieu = maghribMin + Math.floor((fajrMin - maghribMin) / 2)
  const h = Math.floor(milieu / 60) % 24
  const m = milieu % 60
  return h.toString().padStart(2, '0') + ':' + m.toString().padStart(2, '0')
}

function calculerDernierTiers(maghrib: string, fajr: string): string {
  let maghribMin = enMinutes(maghrib)
  let fajrMin = enMinutes(fajr)
  if (fajrMin < maghribMin) fajrMin += 1440
  const debut = maghribMin + Math.floor(((fajrMin - maghribMin) * 2) / 3)
  const h = Math.floor(debut / 60) % 24
  const m = debut % 60
  return h.toString().padStart(2, '0') + ':' + m.toString().padStart(2, '0')
}

function getMethode(countryCode: string): adhan.CalculationParameters {
  const amerique = ['US', 'CA', 'MX', 'BR', 'AR', 'CO', 'CL', 'PE', 'VE']
  const moyen_orient = ['SA', 'AE', 'KW', 'QA', 'BH', 'OM', 'YE', 'IQ', 'SY', 'JO', 'LB', 'PS']
  const asie_sud = ['PK', 'IN', 'BD', 'AF', 'LK', 'NP']
  const egypte = ['EG', 'LY', 'SD']
  if (amerique.includes(countryCode)) return adhan.CalculationMethod.NorthAmerica()
  if (moyen_orient.includes(countryCode)) return adhan.CalculationMethod.UmmAlQura()
  if (asie_sud.includes(countryCode)) return adhan.CalculationMethod.Karachi()
  if (egypte.includes(countryCode)) return adhan.CalculationMethod.Egyptian()
  return adhan.CalculationMethod.MuslimWorldLeague()
}

function getNomMethode(countryCode: string): string {
  const amerique = ['US', 'CA', 'MX']
  const moyen_orient = ['SA', 'AE', 'KW', 'QA', 'BH', 'OM', 'YE', 'IQ', 'SY', 'JO', 'LB', 'PS']
  const asie_sud = ['PK', 'IN', 'BD', 'AF', 'LK', 'NP']
  const egypte = ['EG', 'LY', 'SD']
  if (amerique.includes(countryCode)) return 'ISNA'
  if (moyen_orient.includes(countryCode)) return 'Umm al-Qura'
  if (asie_sud.includes(countryCode)) return 'Karachi'
  if (egypte.includes(countryCode)) return 'Egyptian'
  return 'Muslim World League'
}

const RAYON = 80
const CIRCONF = 2 * Math.PI * RAYON
const TAILLE_SVG = 200

export default function Prieres() {
  const router = useRouter()
  const [horaires, setHoraires] = useState<PriereInfo[]>([])
  const [ville, setVille] = useState('')
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [tick, setTick] = useState(0)
  const [dateHijri, setDateHijri] = useState('')
  const [methodeNom, setMethodeNom] = useState('')
  const [fajrDemain, setFajrDemain] = useState('')

  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    async function init() {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setErreur('Position refusée — veuillez autoriser la géolocalisation')
        setLoading(false)
        return
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const { latitude, longitude } = loc.coords

      // Géocodage inverse
      const geo = await geocoderInverse(latitude, longitude)
      const countryCode = geo.isoCountryCode ?? 'FR'
      const nomVille = geo.city ?? geo.region ?? ''
      const nomPays = geo.country ?? ''
      setVille(nomVille && nomPays ? `${nomVille}, ${nomPays}` : nomVille || nomPays)
      setMethodeNom(getNomMethode(countryCode))

      // Date hijri
      try {
        const d = new Date()
        const ds = `${d.getDate()}-${d.getMonth() + 1}-${d.getFullYear()}`
        const res = await fetch(`https://api.aladhan.com/v1/timings/${ds}?latitude=${latitude}&longitude=${longitude}&method=3`)
        const data = await res.json()
        const hijri = data.data.date.hijri
        setDateHijri(`${hijri.day} ${hijri.month.en} ${hijri.year} H`)
      } catch (e) { }

      // Calcul prières
      const coords = new adhan.Coordinates(latitude, longitude)
      const methode = getMethode(countryCode)
      const d = new Date()
      const times = new adhan.PrayerTimes(coords, d, methode)

      const fajrFmt = fmt(times.fajr)
      const maghribFmt = fmt(times.maghrib)
      const ishaFmt = fmt(times.isha)

      const demain = new Date(d)
      demain.setDate(demain.getDate() + 1)
      const timesDemain = new adhan.PrayerTimes(coords, demain, methode)
      const fajrDemainFmt = fmt(timesDemain.fajr)
      setFajrDemain(fajrDemainFmt)

      const fajrAffiche = enMinutes(ishaFmt) < nowMin() ? fajrDemainFmt : fajrFmt

      setHoraires([
        { nom: 'Fajr', heure: fajrAffiche, cle: 'Fajr' },
        { nom: 'Lever du soleil', heure: fmt(times.sunrise), cle: 'Sunrise' },
        { nom: 'Dhuhr', heure: fmt(times.dhuhr), cle: 'Dhuhr' },
        { nom: 'Asr', heure: fmt(times.asr), cle: 'Asr' },
        { nom: 'Maghrib', heure: maghribFmt, cle: 'Maghrib' },
        { nom: 'Isha', heure: ishaFmt, cle: 'Isha' },
        { nom: 'Moitié de la nuit', heure: calculerMoitieNuit(maghribFmt, fajrDemainFmt), cle: 'MoitieNuit' },
        { nom: 'Dernier tiers de la nuit', heure: calculerDernierTiers(maghribFmt, fajrDemainFmt), cle: 'Tahajjud' },
      ])
      setLoading(false)
    }
    init().catch(e => console.warn('init:', e))
  }, [])

  const now = nowMin()
  const prieresPrincipales = horaires.filter(p => p.cle !== 'Sunrise' && p.cle !== 'Tahajjud' && p.cle !== 'MoitieNuit')
  const prochaine = prieresPrincipales.find(p => enMinutes(p.heure) > now) ?? { nom: 'Fajr', heure: fajrDemain, cle: 'Fajr' }
  const prog = prochaine ? progressionPriere(prochaine.heure) : 0
  const dashOffset = CIRCONF - (prog / 100) * CIRCONF

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.fondCreme }} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* Header bleu comme le site */}
      <View style={{
        backgroundColor: colors.bleu,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.lg,
        paddingBottom: spacing.xl,
        alignItems: 'center',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: spacing.md }}>
          <Pressable onPress={() => router.back()} style={{ padding: 4, marginRight: spacing.md }}>
            <ArrowLeft size={22} color="white" />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{
              fontFamily: typography.fontFamily.bold,
              fontSize: typography.size.xs,
              letterSpacing: 2, color: colors.or,
              textTransform: 'uppercase', marginBottom: 4,
            }}>
              Horaires
            </Text>
            <Text style={{
              fontFamily: typography.fontFamily.bold,
              fontSize: typography.size['2xl'],
              color: 'white',
            }}>
              Heures de prières
            </Text>
            {ville ? (
              <Text style={{
                fontFamily: typography.fontFamily.regular,
                fontSize: typography.size.sm,
                color: 'rgba(255,255,255,0.55)',
                marginTop: 4,
              }}>
                {ville}
              </Text>
            ) : null}
          </View>
          <View style={{ width: 30 }} />
        </View>

        {dateHijri ? (
          <View style={{
            backgroundColor: 'rgba(217,172,42,0.15)',
            borderWidth: 1, borderColor: 'rgba(217,172,42,0.4)',
            borderRadius: radius.full,
            paddingHorizontal: spacing.lg, paddingVertical: spacing.xs,
          }}>
            <Text style={{
              fontFamily: typography.fontFamily.medium,
              fontSize: typography.size.base,
              color: colors.or,
            }}>
              {dateHijri}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Barre or */}
      <View style={{ height: 3, backgroundColor: colors.or, opacity: 0.6 }} />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 32, marginBottom: spacing.md }}>🕌</Text>
          <Text style={{ fontFamily: typography.fontFamily.regular, color: '#aaa' }}>
            Récupération de votre position...
          </Text>
        </View>
      ) : erreur ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
          <Text style={{ fontSize: 32, marginBottom: spacing.md }}>⚠️</Text>
          <Text style={{ fontFamily: typography.fontFamily.regular, color: '#c00', textAlign: 'center' }}>
            {erreur}
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120 }}>

          {/* Cercle prochaine prière */}
          {prochaine && (
            <View style={{
              backgroundColor: 'white',
              borderRadius: 20,
              borderWidth: 2, borderColor: colors.or,
              padding: spacing.xl,
              alignItems: 'center',
              marginBottom: spacing.xl,
              shadowColor: colors.or,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.12,
              shadowRadius: 24,
              elevation: 4,
            }}>
              {/* SVG cercle */}
              <View style={{ width: TAILLE_SVG, height: TAILLE_SVG, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md }}>
                <Svg width={TAILLE_SVG} height={TAILLE_SVG} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
                  <Circle cx={TAILLE_SVG / 2} cy={TAILLE_SVG / 2} r={RAYON} fill="none" stroke="#f0f0f0" strokeWidth={10} />
                  <Circle
                    cx={TAILLE_SVG / 2} cy={TAILLE_SVG / 2} r={RAYON}
                    fill="none" stroke={colors.or} strokeWidth={10}
                    strokeLinecap="round"
                    strokeDasharray={CIRCONF}
                    strokeDashoffset={dashOffset}
                  />
                </Svg>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{
                    fontFamily: typography.fontFamily.regular,
                    fontSize: typography.size.xs,
                    color: '#aaa', letterSpacing: 1,
                    textTransform: 'uppercase', marginBottom: 4,
                  }}>
                    Prochaine Prière
                  </Text>
                  <Text style={{
                    fontFamily: typography.fontFamily.bold,
                    fontSize: typography.size.xl,
                    color: colors.bleu, marginBottom: 2,
                  }}>
                    {prochaine.nom}
                  </Text>
                  <Text style={{
                    fontFamily: typography.fontFamily.bold,
                    fontSize: typography.size['2xl'],
                    color: colors.or,
                  }}>
                    {prochaine.heure}
                  </Text>
                </View>
              </View>

              {/* Countdown */}
              <View style={{
                backgroundColor: colors.fondCreme,
                borderRadius: radius.full,
                paddingHorizontal: spacing.lg, paddingVertical: spacing.xs,
                borderWidth: 1, borderColor: colors.bordure,
              }}>
                <Text style={{
                  fontFamily: typography.fontFamily.medium,
                  fontSize: typography.size.sm,
                  color: colors.bleu,
                }}>
                  dans {tempsRestant(prochaine.heure)}
                </Text>
              </View>
            </View>
          )}

          {/* Liste prières */}
          <View style={{ gap: spacing.sm }}>
            {horaires.map(p => {
              const estProchaine = prochaine?.cle === p.cle
              const estPassee = enMinutes(p.heure) < now && !estProchaine
              const estTahajjud = p.cle === 'Tahajjud' || p.cle === 'MoitieNuit'
              return (
                <View key={p.cle} style={{
                  backgroundColor: estProchaine ? colors.bleu : 'white',
                  borderWidth: 1,
                  borderStyle: estTahajjud ? 'dashed' : 'solid',
                  borderColor: estProchaine ? colors.bleu : estTahajjud ? colors.or : colors.bordure,
                  borderRadius: radius.lg,
                  paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
                  flexDirection: 'row', alignItems: 'center',
                  justifyContent: 'space-between',
                  opacity: estPassee && !estTahajjud ? 0.45 : 1,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      width: 8, height: 8, borderRadius: 4,
                      backgroundColor: estProchaine ? colors.or : estTahajjud ? colors.or : '#ccc',
                      marginRight: spacing.md,
                    }} />
                    <View>
                      <Text style={{
                        fontFamily: estProchaine ? typography.fontFamily.bold : typography.fontFamily.medium,
                        fontSize: typography.size.md,
                        color: estProchaine ? 'white' : estPassee && !estTahajjud ? '#aaa' : colors.texte,
                      }}>
                        {p.nom}
                      </Text>
                      {p.cle === 'Tahajjud' ? (
                        <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.xs, color: colors.orFonce, marginTop: 2 }}>
                          Tahajjud — Prière de la nuit
                        </Text>
                      ) : p.cle === 'MoitieNuit' ? (
                        <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.xs, color: colors.orFonce, marginTop: 2 }}>
                          Fin de l'heure du Isha
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  <Text style={{
                    fontFamily: typography.fontFamily.bold,
                    fontSize: typography.size.lg,
                    color: estProchaine ? colors.or : estPassee && !estTahajjud ? '#ccc' : estTahajjud ? colors.orFonce : colors.bleu,
                  }}>
                    {p.heure}
                  </Text>
                </View>
              )
            })}
          </View>

          {/* Méthode */}
          <Text style={{
            textAlign: 'center',
            fontFamily: typography.fontFamily.regular,
            fontSize: typography.size.xs,
            color: '#ccc', marginTop: spacing.xl,
          }}>
          </Text>

        </ScrollView>
      )}
    </SafeAreaView>
  )
}
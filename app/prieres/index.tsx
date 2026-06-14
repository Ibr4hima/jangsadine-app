import { colors, radius, spacing, typography } from '@/constants/theme'
import { geocoderInverse } from '@/lib/geo'
import { getMethode, getNomMethode } from '@/lib/prieres'
import * as adhan from 'adhan'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import {
  ArrowLeft,
  CloudMoon,
  CloudSun,
  Hourglass,
  Moon,
  MoonStar,
  Sun,
  Sunrise,
  Sunset,
} from 'lucide-react-native'
import { ComponentType, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Circle, Path } from 'react-native-svg'

type PriereInfo = { nom: string; heure: string; cle: string }

// ─── palette héros (bleu logo, cohérent avec l'accueil) ───────
const BG_TOP = '#3d6ba3'
const BG_MID = '#2d578c'
const BG_BOT = '#234a7a'
const NUIT_TOP = '#1c3d66'
const W90 = 'rgba(255,255,255,0.90)'
const W70 = 'rgba(255,255,255,0.70)'
const W55 = 'rgba(255,255,255,0.55)'
const W18 = 'rgba(255,255,255,0.18)'
const W10 = 'rgba(255,255,255,0.10)'

// ─── helpers temps ────────────────────────────────────────────
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
  let cible = enMinutes(heure) * 60
  if (cible <= nowSec) cible += 86400
  const diff = cible - nowSec
  const hh = Math.floor(diff / 3600)
  const mm = Math.floor((diff % 3600) / 60)
  const ss = diff % 60
  if (hh > 0) return `${hh} h ${mm.toString().padStart(2, '0')} min`
  if (mm > 0) return `${mm} min ${ss.toString().padStart(2, '0')} s`
  return `${ss} s`
}
// Fraction écoulée entre la prière précédente et la prochaine
function progressEntre(prevHeure: string, nextHeure: string): number {
  const now = new Date()
  const n = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
  const a = enMinutes(prevHeure) * 60
  let b = enMinutes(nextHeure) * 60
  let x = n
  if (b <= a) b += 86400
  if (x < a) x += 86400
  return Math.max(0, Math.min(1, (x - a) / (b - a)))
}
function calculerMoitieNuit(maghrib: string, fajr: string): string {
  let maghribMin = enMinutes(maghrib)
  let fajrMin = enMinutes(fajr)
  if (fajrMin < maghribMin) fajrMin += 1440
  const milieu = maghribMin + Math.floor((fajrMin - maghribMin) / 2)
  return (Math.floor(milieu / 60) % 24).toString().padStart(2, '0') + ':' + (milieu % 60).toString().padStart(2, '0')
}
function calculerDernierTiers(maghrib: string, fajr: string): string {
  let maghribMin = enMinutes(maghrib)
  let fajrMin = enMinutes(fajr)
  if (fajrMin < maghribMin) fajrMin += 1440
  const debut = maghribMin + Math.floor(((fajrMin - maghribMin) * 2) / 3)
  return (Math.floor(debut / 60) % 24).toString().padStart(2, '0') + ':' + (debut % 60).toString().padStart(2, '0')
}

// ─── icônes par prière ────────────────────────────────────────
const ICONES: Record<string, ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  Fajr: CloudMoon,
  Sunrise: Sunrise,
  Dhuhr: Sun,
  Asr: CloudSun,
  Maghrib: Sunset,
  Isha: Moon,
  MoitieNuit: Hourglass,
  Tahajjud: MoonStar,
}

// ─── icône mains jointes (Material Symbols folded_hands) ─────
function IcoDuaa({ size = 20, color = '#d6ad3a' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path fill={color} d="M620-320v-109l-45-81q-7 5-11 13t-4 17v229L663-80h-93l-90-148v-252q0-31 15-57t41-43l-56-99q-20-38-17.5-80.5T495-832l68-68 276 324 41 496h-80l-39-464-203-238-6 6q-10 10-11.5 23t4.5 25l155 278v130h-80Zm-360 0v-130l155-278q6-12 4.5-25T408-776l-6-6-203 238-39 464H80l41-496 276-324 68 68q30 30 32.5 72.5T480-679l-56 99q26 17 41 43t15 57v252L390-80h-93l103-171v-229q0-9-4-17t-11-13l-45 81v109h-80Z" />
    </Svg>
  )
}

// ─── anneau de progression ────────────────────────────────────
const RAYON = 88
const CIRCONF = 2 * Math.PI * RAYON
const TAILLE_SVG = 210

export default function Prieres() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [horaires, setHoraires] = useState<PriereInfo[]>([])
  const [ville, setVille] = useState('')
  const [loading, setLoading] = useState(true)
  const [erreur, setErreur] = useState('')
  const [, setTick] = useState(0)
  const [methodeNom, setMethodeNom] = useState('')
  const [fajrDemain, setFajrDemain] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    // Format minute : 30 s suffisent au lieu d'un re-render par seconde de
    // toute la liste. L'anneau ne bouge que très lentement (imperceptible).
    const iv = setInterval(() => setTick(t => t + 1), 30000)
    return () => clearInterval(iv)
  }, [])

  async function charger() {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      setErreur('Position refusée — veuillez autoriser la géolocalisation')
      setLoading(false)
      return
    }

    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
    const { latitude, longitude } = loc.coords

    const geo = await geocoderInverse(latitude, longitude)
    const countryCode = geo.isoCountryCode ?? 'FR'
    const nomVille = geo.city ?? geo.region ?? ''
    const nomPays = geo.country ?? ''
    setVille(nomVille && nomPays ? `${nomVille}, ${nomPays}` : nomVille || nomPays)
    setMethodeNom(getNomMethode(countryCode))

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

  useEffect(() => {
    charger().catch(e => { console.warn('prieres:', e); setLoading(false) })
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    try { await charger() } catch { }
    setRefreshing(false)
  }

  const now = nowMin()
  const principales = horaires.filter(p => !['Sunrise', 'MoitieNuit', 'Tahajjud'].includes(p.cle))
  const idx = principales.findIndex(p => enMinutes(p.heure) > now)
  const prochaine = principales.length
    ? (idx === -1 ? { nom: 'Fajr', heure: fajrDemain, cle: 'Fajr' } : principales[idx])
    : null
  const precedente = principales.length
    ? (idx <= 0 ? principales[principales.length - 1] : principales[idx - 1])
    : null

  const prog = prochaine && precedente ? progressEntre(precedente.heure, prochaine.heure) : 0
  const dashOffset = CIRCONF - prog * CIRCONF

  const IconeProchaine = prochaine ? (ICONES[prochaine.cle] ?? Sun) : Sun

  return (
    <View style={{ flex: 1, backgroundColor: colors.fondCreme }}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.bleu} />
        }
      >
        {/* ── Héros ── */}
        <View style={{ borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden' }}>
          <LinearGradient
            colors={[BG_TOP, BG_MID, BG_BOT]}
            locations={[0, 0.55, 1]}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <View style={{ position: 'absolute', width: 380, height: 380, borderRadius: 190, backgroundColor: 'rgba(140,180,230,0.13)', top: -160, right: -120 }} />
          <View style={{ position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(214,173,58,0.07)', bottom: -100, left: -90 }} />

          <View style={{ paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }}>

            {/* nav */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync()
                  if (router.canGoBack()) router.back()
                  else router.push('/' as any)
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={({ pressed }) => ({
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: W10,
                  borderWidth: 1, borderColor: W18,
                  alignItems: 'center', justifyContent: 'center',
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <ArrowLeft size={20} color="#fff" strokeWidth={2.2} />
              </Pressable>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <View style={{ backgroundColor: 'rgba(214,173,58,0.16)', borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 4 }}>
                  <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, letterSpacing: 1.8, color: colors.or, textTransform: 'uppercase' }}>
                    Heures de prières
                  </Text>
                </View>
              </View>
              <View style={{ width: 40 }} />
            </View>

            {/* ville */}
            <View style={{ alignItems: 'center', marginBottom: spacing.xl }}>
              {ville ? (
                <View style={{
                  backgroundColor: W10, borderRadius: radius.full,
                  paddingHorizontal: 14, paddingVertical: 5,
                  borderWidth: 1, borderColor: W18,
                }}>
                  <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: W70 }}>
                    {ville}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* anneau prochaine prière */}
            {!loading && !erreur && prochaine && (
              <View style={{ alignItems: 'center' }}>
                <View style={{ width: TAILLE_SVG, height: TAILLE_SVG, alignItems: 'center', justifyContent: 'center' }}>
                  {/* disque de verre derrière le contenu */}
                  <View style={{
                    position: 'absolute',
                    width: RAYON * 2 - 18, height: RAYON * 2 - 18,
                    borderRadius: RAYON - 9,
                    backgroundColor: W10,
                    borderWidth: 1, borderColor: W18,
                  }} />
                  <Svg width={TAILLE_SVG} height={TAILLE_SVG} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
                    <Circle cx={TAILLE_SVG / 2} cy={TAILLE_SVG / 2} r={RAYON} fill="none" stroke={W18} strokeWidth={9} />
                    <Circle
                      cx={TAILLE_SVG / 2} cy={TAILLE_SVG / 2} r={RAYON}
                      fill="none" stroke={colors.or} strokeWidth={9}
                      strokeLinecap="round"
                      strokeDasharray={CIRCONF}
                      strokeDashoffset={dashOffset}
                    />
                  </Svg>
                  <View style={{ alignItems: 'center', gap: 2 }}>
                    <IconeProchaine size={26} color={colors.or} strokeWidth={2} />
                    <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.xs, color: W55, letterSpacing: 1.4, textTransform: 'uppercase', marginTop: 4 }}>
                      Prochaine prière
                    </Text>
                    <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: 30, color: '#fff' }}>
                      {prochaine.nom}
                    </Text>
                    <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size['2xl'], color: colors.or, fontVariant: ['tabular-nums'] }}>
                      {prochaine.heure}
                    </Text>
                  </View>
                </View>

                {/* compte à rebours */}
                <View style={{
                  backgroundColor: colors.or,
                  borderRadius: radius.full,
                  paddingHorizontal: spacing.lg, paddingVertical: 7,
                  marginTop: spacing.md,
                  shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5,
                }}>
                  <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.md, color: NUIT_TOP, fontVariant: ['tabular-nums'] }}>
                    dans {prochaine ? tempsRestant(prochaine.heure) : ''}
                  </Text>
                </View>
              </View>
            )}

            {loading && (
              <View style={{ alignItems: 'center', paddingVertical: spacing['2xl'], gap: spacing.md }}>
                <ActivityIndicator size="large" color={colors.or} />
                <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.base, color: W70 }}>
                  Détection de ta position…
                </Text>
              </View>
            )}
            {!!erreur && (
              <View style={{ alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm }}>
                <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base, color: W90, textAlign: 'center' }}>
                  {erreur}
                </Text>
              </View>
            )}
          </View>
        </View>

        {!loading && !erreur && (
          <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xl, gap: 8 }}>
            <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, letterSpacing: 1.6, color: colors.or, textTransform: 'uppercase', marginBottom: 4 }}>
              Aujourd'hui
            </Text>
            {horaires.map((p, i) => {
              const estIndicateur = p.cle === 'MoitieNuit' || p.cle === 'Tahajjud'
              const estProchaine = prochaine?.cle === p.cle && prochaine?.heure === p.heure
              const estPassee = !estIndicateur && enMinutes(p.heure) < now && !estProchaine
              const estSunrise = p.cle === 'Sunrise'
              const Icone = ICONES[p.cle] ?? Sun

              if (estIndicateur) {
                return (
                  <Animated.View key={p.cle} entering={FadeInDown.duration(400).delay(60 * i)}
                    style={{ borderRadius: radius.xl, overflow: 'hidden' }}>
                    <LinearGradient
                      colors={[colors.bleu, '#1c3d66']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 14, gap: spacing.md }}
                    >
                      <View style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(214,173,58,0.16)', alignItems: 'center', justifyContent: 'center' }}>
                        {p.cle === 'Tahajjud'
                          ? <IcoDuaa size={22} color={colors.or} />
                          : <Icone size={20} color={colors.or} strokeWidth={2} />
                        }
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.md, color: '#fff' }}>
                          {p.nom}
                        </Text>
                        <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.xs, color: colors.or, marginTop: 2 }}>
                          {p.cle === 'Tahajjud' ? 'Tahajjud — prière de la nuit' : "Fin de l'heure du Isha"}
                        </Text>
                      </View>
                      <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.lg, color: colors.or, fontVariant: ['tabular-nums'] }}>
                        {p.heure}
                      </Text>
                    </LinearGradient>
                  </Animated.View>
                )
              }

              return (
                <Animated.View key={p.cle} entering={FadeInDown.duration(400).delay(60 * i)}>
                  <View style={{
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: estProchaine ? colors.bleu : colors.blanc,
                    borderRadius: radius.xl,
                    paddingHorizontal: spacing.lg,
                    paddingVertical: 14,
                    gap: spacing.md,
                    shadowColor: '#3a4a5c',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: estProchaine ? 0.22 : 0.06,
                    shadowRadius: 12,
                    elevation: estProchaine ? 4 : 2,
                  }}>
                    <View style={{
                      width: 40, height: 40, borderRadius: 13,
                      backgroundColor: estProchaine ? 'rgba(255,255,255,0.15)' : estPassee ? '#f1f0ee' : '#dce8f5',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icone size={20} color={estProchaine ? colors.or : estPassee ? '#b5b2ac' : colors.bleu} strokeWidth={2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontFamily: estProchaine ? typography.fontFamily.bold : typography.fontFamily.medium,
                        fontSize: typography.size.md,
                        color: estProchaine ? '#fff' : estPassee ? '#b5b2ac' : colors.texte,
                      }}>
                        {p.nom}
                      </Text>
                      {estProchaine && (
                        <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.xs, color: colors.or, marginTop: 2, fontVariant: ['tabular-nums'] }}>
                          dans {tempsRestant(p.heure)}
                        </Text>
                      )}
                    </View>
                    <Text style={{
                      fontFamily: typography.fontFamily.bold,
                      fontSize: typography.size.lg,
                      color: estProchaine ? colors.or : estPassee ? '#c9c6c0' : colors.bleu,
                      fontVariant: ['tabular-nums'],
                    }}>
                      {p.heure}
                    </Text>
                  </View>
                </Animated.View>
              )
            })}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

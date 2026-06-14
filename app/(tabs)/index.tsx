import { MiniEgaliseur } from '@/components/AudioUI'
import { colors, radius, spacing, typography } from '@/constants/theme'
import { Piste, useAudio } from '@/contexts/AudioContext'
import { useTabBar } from '@/contexts/TabBarContext'
import { geocoderInverse } from '@/lib/geo'
import { getMethode } from '@/lib/prieres'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as adhan from 'adhan'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import * as Location from 'expo-location'
import { useFocusEffect, useRouter } from 'expo-router'
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import {
  Dimensions,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native'
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import TextTicker from 'react-native-text-ticker'

const { width: W } = Dimensions.get('window')

// ─── palette héros (bleu logo) ────────────────────────────────
const BG_TOP = '#3d6ba3'
const BG_MID = '#2d578c'
const BG_BOT = '#234a7a'
const W90 = 'rgba(255,255,255,0.90)'
const W70 = 'rgba(255,255,255,0.70)'
const W55 = 'rgba(255,255,255,0.55)'
const W18 = 'rgba(255,255,255,0.18)'
const W10 = 'rgba(255,255,255,0.10)'

// ─── icônes Material Symbols ──────────────────────────────────
type IcoProps = { size?: number; color?: string }

function IcoSearch({ size = 20, color = colors.bleu }: IcoProps) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" fill={color} /></Svg>
}
function IcoHeadphones({ size = 24, color = colors.bleu }: IcoProps) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M360-120H200q-33 0-56.5-23.5T120-200v-280q0-75 28.5-140.5t77-114q48.5-48.5 114-77T480-840q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-480v280q0 33-23.5 56.5T760-120H600v-320h160v-40q0-117-81.5-198.5T480-760q-117 0-198.5 81.5T200-480v40h160v320Z" fill={color} /></Svg>
}
function IcoMosque({ size = 24, color = colors.bleu }: IcoProps) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="m521-500 59-43 58 43-23-68 59-43h-72l-22-69-22 69h-73l59 43-23 68Zm-41 220q83 0 141.5-58T680-480q0-8-.5-16t-2.5-16q-11 47-49 77.5T539-404q-60 0-101-41t-41-101q0-46 26-82.5t68-51.5h-11q-84 0-142 58.5T280-480q0 84 58 142t142 58Zm0 252L346-160H160v-186L28-480l132-134v-186h186l134-132 134 132h186v186l132 134-132 134v186H614L480-28Zm0-112 100-100h140v-140l100-100-100-100v-140H580L480-820 380-720H240v140L140-480l100 100v140h140l100 100Zm0-340Z" fill={color} /></Svg>
}
function IcoProgramme({ size = 24, color = colors.bleu }: IcoProps) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M640-120q-33 0-56.5-23.5T560-200v-160q0-33 23.5-56.5T640-440h160q33 0 56.5 23.5T880-360v160q0 33-23.5 56.5T800-120H640Zm0-80h160v-160H640v160ZM80-240v-80h360v80H80Zm560-280q-33 0-56.5-23.5T560-600v-160q0-33 23.5-56.5T640-840h160q33 0 56.5 23.5T880-760v160q0 33-23.5 56.5T800-520H640Zm0-80h160v-160H640v160ZM80-640v-80h360v80H80Zm640 360Zm0-400Z" fill={color} /></Svg>
}
function IcoCompass({ size = 24, color = colors.bleu }: IcoProps) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M516-120 402-402 120-516v-56l720-268-268 720h-56Zm26-148 162-436-436 162 196 78 78 196Zm-78-196Z" fill={color} /></Svg>
}
function IcoPlay({ size = 18, color = '#fff' }: IcoProps) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M320-200v-560l440 280-440 280Z" fill={color} /></Svg>
}
function IcoChevron({ size = 18, color = '#bbb' }: IcoProps) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" fill={color} /></Svg>
}
function IcoNotes({ size = 16, color = colors.bleu }: IcoProps) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M700-120h40v-100h100v-40H740v-100h-40v100H600v40h100v100Zm20 80q-83 0-141.5-58.5T520-240q0-83 58.5-141.5T720-440q83 0 141.5 58.5T920-240q0 83-58.5 141.5T720-40ZM280-600h400v-80H280v80Zm187 480H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v268q-29-14-58.5-21t-61.5-7q-11 0-20.5.5T680-517v-3H280v80h245q-18 17-32.5 37T467-360H280v80h163q-2 10-2.5 19.5T440-240q0 33 6 61.5t21 58.5Z" fill={color} /></Svg>
}
function IcoDownload({ size = 16, color = colors.bleu }: IcoProps) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z" fill={color} /></Svg>
}
function IcoSettings({ size = 16, color = colors.bleu }: IcoProps) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Z" fill={color} /></Svg>
}
function IcoQuote({ size = 26, color = colors.or }: IcoProps) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="m228-240 92-160q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 23-5.5 42.5T458-480L320-240h-92Zm360 0 92-160q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 23-5.5 42.5T818-480L680-240h-92Z" fill={color} /></Svg>
}

// ─── helpers prières ──────────────────────────────────────────
type Priere = { nom: string; heure: string }

function enMinutes(h: string) {
  const [hh, mm] = h.split(':').map(Number)
  return hh * 60 + mm
}
function fmtH(date: Date) {
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
function progressEntre(prev: Priere, next: Priere): number {
  const now = new Date()
  const n = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
  const a = enMinutes(prev.heure) * 60
  let b = enMinutes(next.heure) * 60
  let x = n
  if (b <= a) b += 86400
  if (x < a) x += 86400
  return Math.max(0, Math.min(1, (x - a) / (b - a)))
}

function capitaliser(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ─── hadith du jour ───────────────────────────────────────────
const HADITHS = [
  { texte: 'Les actions ne valent que par les intentions, et chacun n\'a pour lui que ce qu\'il a eu réellement l\'intention de faire.', source: 'Boukhari & Mouslim' },
  { texte: 'Le meilleur d\'entre vous est celui qui apprend le Coran et l\'enseigne.', source: 'Boukhari' },
  { texte: 'Quiconque emprunte un chemin à la recherche d\'une science, Allah lui facilite un chemin vers le Paradis.', source: 'Mouslim' },
  { texte: 'La pudeur est une branche de la foi.', source: 'Boukhari & Mouslim' },
  { texte: 'Allah ne regarde ni vos corps ni vos visages, mais Il regarde vos cœurs.', source: 'Mouslim' },
  { texte: 'Le musulman est celui dont les musulmans sont à l\'abri de sa langue et de sa main.', source: 'Boukhari & Mouslim' },
  { texte: 'Aucun de vous ne sera véritablement croyant tant qu\'il n\'aimera pas pour son frère ce qu\'il aime pour lui-même.', source: 'Boukhari & Mouslim' },
  { texte: 'Celui qui croit en Allah et au Jour dernier, qu\'il dise du bien ou qu\'il se taise.', source: 'Boukhari & Mouslim' },
  { texte: 'La religion, c\'est la sincérité.', source: 'Mouslim' },
  { texte: 'Facilitez et ne rendez pas les choses difficiles, annoncez la bonne nouvelle et ne faites pas fuir les gens.', source: 'Boukhari & Mouslim' },
]

// ─── bouton avec scale animé ──────────────────────────────────
function PressableScale({ onPress, children, style, haptic = true }: {
  onPress: () => void
  children: ReactNode
  style?: any
  haptic?: boolean
}) {
  const scale = useSharedValue(1)
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
  return (
    <Pressable
      onPressIn={() => { scale.value = withSpring(0.96, { damping: 18, stiffness: 400 }) }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 14, stiffness: 300 }) }}
      onPress={() => { if (haptic) Haptics.selectionAsync(); onPress() }}
    >
      <Animated.View style={[style, aStyle]}>{children}</Animated.View>
    </Pressable>
  )
}

// ─── héros : salutation + carte prière ────────────────────────
function Hero({ onOuvrirPrieres }: { onOuvrirPrieres: () => void }) {
  const insets = useSafeAreaInsets()
  const [prieres, setPrieres] = useState<Priere[]>([])
  const [ville, setVille] = useState<string | null>(null)
  const [, setTick] = useState(0)
  const progress = useSharedValue(0)

  useEffect(() => {
    // Le compte à rebours est au format minute : 30 s suffisent (au lieu d'un
    // re-render par seconde). La barre s'anime de toute façon via withTiming.
    const iv = setInterval(() => setTick(t => t + 1), 30000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    async function init() {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') return
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const { latitude, longitude } = loc.coords
      const geo = await geocoderInverse(latitude, longitude)
      if (geo.city) setVille(geo.city)
      const countryCode = geo.isoCountryCode ?? 'FR'
      const coords = new adhan.Coordinates(latitude, longitude)
      const params = getMethode(countryCode)
      const times = new adhan.PrayerTimes(coords, new Date(), params)
      setPrieres([
        { nom: 'Fajr', heure: fmtH(times.fajr) },
        { nom: 'Dhuhr', heure: fmtH(times.dhuhr) },
        { nom: 'Asr', heure: fmtH(times.asr) },
        { nom: 'Maghrib', heure: fmtH(times.maghrib) },
        { nom: 'Isha', heure: fmtH(times.isha) },
      ])
    }
    init().catch(e => console.warn('prieres accueil:', e))
  }, [])

  const now = new Date()
  const nowM = now.getHours() * 60 + now.getMinutes()
  const idx = prieres.findIndex(p => enMinutes(p.heure) > nowM)
  const prochaine = prieres.length ? (idx === -1 ? prieres[0] : prieres[idx]) : null
  const precedente = prieres.length ? (idx <= 0 ? prieres[4] : prieres[idx - 1]) : null

  useEffect(() => {
    if (prochaine && precedente) {
      progress.value = withTiming(progressEntre(precedente, prochaine), { duration: 600 })
    }
  })

  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }))

  const dateFr = capitaliser(now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
  let dateHijri = ''
  try {
    dateHijri = new Intl.DateTimeFormat('fr-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' }).format(now)
  } catch { }

  return (
    <View style={{ borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden' }}>
      <LinearGradient
        colors={[BG_TOP, BG_MID, BG_BOT]}
        locations={[0, 0.55, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {/* brume décorative */}
      <View style={{ position: 'absolute', width: 380, height: 380, borderRadius: 190, backgroundColor: 'rgba(140,180,230,0.13)', top: -160, right: -120 }} />
      <View style={{ position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(214,173,58,0.08)', bottom: -120, left: -90 }} />

      <View style={{ paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl + 26 }}>

        {/* date */}
        <View style={{ marginBottom: spacing.lg }}>
          <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xl, color: '#fff', letterSpacing: -0.2 }}>
            {dateFr}
          </Text>
          {dateHijri ? (
            <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: W55, marginTop: 3, letterSpacing: 0.3 }}>
              {dateHijri}
            </Text>
          ) : null}
        </View>

        {/* carte prière */}
        <PressableScale onPress={onOuvrirPrieres} style={{
          backgroundColor: W10,
          borderRadius: radius.xl + 4,
          borderWidth: 1,
          borderColor: W18,
          padding: spacing.lg,
        }}>
          {prochaine ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.xs, color: W55, letterSpacing: 1.2, textTransform: 'uppercase' }}>
                    Prochaine prière{ville ? `  ·  ${ville}` : ''}
                  </Text>
                  <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: 30, color: '#fff', marginTop: 4 }}>
                    {prochaine.nom}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: 26, color: '#fff', fontVariant: ['tabular-nums'] }}>
                    {prochaine.heure}
                  </Text>
                  <View style={{ backgroundColor: colors.or, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4, marginTop: 6 }}>
                    <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.xs, color: '#1c3d66', fontVariant: ['tabular-nums'] }}>
                      dans {tempsRestant(prochaine.heure)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* progression entre les deux prières */}
              <View style={{ height: 5, borderRadius: 3, backgroundColor: W18, marginTop: spacing.lg, overflow: 'hidden' }}>
                <Animated.View style={[{ height: '100%', borderRadius: 3, backgroundColor: colors.or }, barStyle]} />
              </View>

              {/* les 5 horaires */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md }}>
                {prieres.map(p => {
                  const actif = p.nom === prochaine.nom
                  return (
                    <View key={p.nom} style={{ alignItems: 'center', gap: 3, minWidth: 52 }}>
                      <Text style={{ fontFamily: actif ? typography.fontFamily.bold : typography.fontFamily.medium, fontSize: typography.size.xs, color: actif ? colors.or : W55 }}>
                        {p.nom}
                      </Text>
                      <Text style={{ fontFamily: actif ? typography.fontFamily.bold : typography.fontFamily.regular, fontSize: typography.size.sm, color: actif ? '#fff' : W70, fontVariant: ['tabular-nums'] }}>
                        {p.heure}
                      </Text>
                    </View>
                  )
                })}
              </View>
            </>
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: spacing.md, gap: spacing.xs }}>
              <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base, color: W90 }}>
                Horaires de prière
              </Text>
              <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: W55, textAlign: 'center' }}>
                Activez la localisation pour afficher les horaires
              </Text>
            </View>
          )}
        </PressableScale>
      </View>
    </View>
  )
}

// ─── reprendre l'écoute ───────────────────────────────────────
function CarteReprendre() {
  const { piste, enLecture, jouer, pause, reprendre, setLecteurOuvert } = useAudio()
  const [derniere, setDerniere] = useState<Piste | null>(null)
  const [dernierePlaylist, setDernierePlaylist] = useState<Piste[] | null>(null)
  const dernierePositionRef = useRef(0)

  useEffect(() => {
    AsyncStorage.getItem('jsd_derniere_piste')
      .then(raw => { if (raw) setDerniere(JSON.parse(raw)) })
      .catch(() => { })
    AsyncStorage.getItem('jsd_derniere_playlist')
      .then(raw => { if (raw) setDernierePlaylist(JSON.parse(raw)) })
      .catch(() => { })
    AsyncStorage.getItem('jsd_derniere_position')
      .then(raw => { dernierePositionRef.current = raw ? Number(raw) || 0 : 0 })
      .catch(() => { })
  }, [])

  const affichee = piste ?? derniere
  if (!affichee) return null

  // Relance la dernière piste en restaurant sa playlist complète (pour la File du lecteur)
  const reprendreDerniere = (options?: { ouvrirLecteur?: boolean }) => {
    if (!derniere) return
    // Reprend le dernier audio exactement là où on l'avait laissé
    const opts = { ...options, position: dernierePositionRef.current }
    const liste = dernierePlaylist?.some(t => t.id === derniere.id) ? dernierePlaylist : null
    if (liste) {
      const idx = liste.findIndex(t => t.id === derniere.id)
      jouer(liste[idx], liste.slice(idx + 1), opts, liste)
    } else {
      jouer(derniere, [], opts)
    }
  }

  // Le rond or : lecture / pause, sans ouvrir le lecteur
  const basculer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    if (piste) { enLecture ? pause() : reprendre() }
    else reprendreDerniere({ ouvrirLecteur: false })
  }

  // Le reste de la carte : ouvre le lecteur plein écran
  const ouvrirLecteur = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (piste) setLecteurOuvert(true)
    else reprendreDerniere()
  }

  return (
    <Animated.View entering={FadeInDown.duration(500).delay(80)}>
      <PressableScale onPress={ouvrirLecteur} haptic={false} style={{
        marginHorizontal: spacing.xl,
        marginTop: spacing.lg,
        borderRadius: radius.xl + 4,
        overflow: 'hidden',
      }}>
        <LinearGradient
          colors={[colors.bleu, '#1c3d66']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md }}
        >
          <Pressable
            onPress={basculer}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
            style={({ pressed }) => ({
              width: 52, height: 52, borderRadius: 26, backgroundColor: colors.or,
              alignItems: 'center', justifyContent: 'center',
              shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 5,
              transform: [{ scale: pressed ? 0.9 : 1 }],
            })}
          >
            {piste && enLecture
              ? <MiniEgaliseur color="#1c3d66" hauteur={18} />
              : <IcoPlay size={20} color="#1c3d66" />}
          </Pressable>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.xs, color: 'rgba(255,255,255,0.55)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 }}>
              {piste && enLecture ? 'En cours d\'écoute' : 'Reprendre l\'écoute'}
            </Text>
            <TextTicker
              style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.md, color: '#fff' }}
              loop bounce={false} repeatSpacer={60} marqueeDelay={2500} scrollSpeed={18}
            >
              {affichee.titre}
            </TextTicker>
            <Text numberOfLines={1} style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
              {affichee.sheikh}
            </Text>
          </View>
          <IcoChevron size={20} color="rgba(255,255,255,0.5)" />
        </LinearGradient>
      </PressableScale>
    </Animated.View>
  )
}

// ─── accès rapide ─────────────────────────────────────────────
// Teinte unique, cohérente avec le bleu du logo / des héros
const TUILE_G1 = '#3d6ba3'
const TUILE_G2 = '#234a7a'

const SECTIONS = [
  { label: 'Cours audio',   icon: IcoHeadphones, href: '/audio'          },
  { label: 'Heures de prières', icon: IcoMosque, href: '/(tabs)/prieres' },
  { label: 'Mon programme', icon: IcoProgramme,  href: '/programme'      },
  { label: 'Qibla',         icon: IcoCompass,    href: '/qibla'          },
]

const RACCOURCIS = [
  { label: 'Téléchargements', icon: IcoDownload, href: '/telechargements'},
  { label: 'Notes',           icon: IcoNotes,    href: '/notes'          },
  { label: 'Paramètres',      icon: IcoSettings, href: '/parametres'     },
]

function AccesRapide({ onNav }: { onNav: (href: string) => void }) {
  const CARD_W = (W - spacing.xl * 2 - spacing.md) / 2
  return (
    <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xl }}>
      <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.lg, color: colors.texte, marginBottom: spacing.md }}>
        Accès rapide
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        {SECTIONS.map((s, i) => {
          const Icon = s.icon
          return (
            <Animated.View key={s.label} entering={FadeInDown.duration(500).delay(140 + i * 70)}>
              <PressableScale onPress={() => onNav(s.href)} style={{
                width: CARD_W,
                backgroundColor: colors.blanc,
                borderRadius: 26,
                paddingVertical: spacing.xl,
                paddingHorizontal: spacing.md,
                alignItems: 'center',
                overflow: 'hidden',
                shadowColor: '#2a3b52',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.10,
                shadowRadius: 22,
                elevation: 6,
              }}>
                {/* halo décoratif teinté */}
                <View style={{
                  position: 'absolute', width: 140, height: 140, borderRadius: 70,
                  backgroundColor: TUILE_G1, opacity: 0.06, top: -46, right: -34,
                }} />
                <View style={{
                  position: 'absolute', width: 70, height: 70, borderRadius: 35,
                  backgroundColor: TUILE_G2, opacity: 0.04, bottom: -24, left: -16,
                }} />

                {/* tuile icône en dégradé + halo coloré */}
                <View style={{
                  width: 60, height: 60, borderRadius: 20, overflow: 'hidden',
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: spacing.md,
                  shadowColor: TUILE_G2, shadowOffset: { width: 0, height: 7 },
                  shadowOpacity: 0.34, shadowRadius: 12, elevation: 6,
                }}>
                  <LinearGradient
                    colors={[TUILE_G1, TUILE_G2]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                  />
                  <Icon size={29} color="#fff" />
                </View>

                <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.md, color: colors.texte, textAlign: 'center' }}>
                  {s.label}
                </Text>
              </PressableScale>
            </Animated.View>
          )
        })}
      </View>

      {/* raccourcis secondaires */}
      <Animated.View entering={FadeInDown.duration(500).delay(420)}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.lg }}>
          {RACCOURCIS.map(r => {
            const Icon = r.icon
            return (
              <PressableScale key={r.label} onPress={() => onNav(r.href)} style={{
                flexDirection: 'row', alignItems: 'center', gap: 7,
                backgroundColor: colors.blanc,
                borderWidth: 1, borderColor: colors.bordure,
                borderRadius: radius.full,
                paddingHorizontal: spacing.md, paddingVertical: 9,
              }}>
                <Icon size={16} color={colors.bleu} />
                <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.sm, color: colors.texte }}>
                  {r.label}
                </Text>
              </PressableScale>
            )
          })}
        </View>
      </Animated.View>
    </View>
  )
}

// ─── hadith du jour ───────────────────────────────────────────
function HadithDuJour() {
  const jour = Math.floor(Date.now() / 86400000)
  const h = HADITHS[jour % HADITHS.length]
  return (
    <Animated.View entering={FadeInDown.duration(500).delay(520)} style={{ paddingHorizontal: spacing.xl }}>
      <View style={{
        backgroundColor: colors.blanc,
        borderRadius: radius.xl + 4,
        padding: spacing.lg,
        borderLeftWidth: 4,
        borderLeftColor: colors.bleu,
        shadowColor: '#3a4a5c',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 18,
        elevation: 3,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
          <IcoQuote size={20} color={colors.bleu} />
          <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.xs, color: colors.bleu, letterSpacing: 1.2, textTransform: 'uppercase' }}>
            Hadith du jour
          </Text>
        </View>
        <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.md, color: colors.texte, lineHeight: 24 }}>
          « {h.texte} »
        </Text>
        <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.sm, color: colors.texteMuted, marginTop: spacing.sm }}>
          — Rapporté par {h.source}
        </Text>
      </View>
    </Animated.View>
  )
}


// ─── page ─────────────────────────────────────────────────────
export default function Accueil() {
  const router = useRouter()
  const { showTabBar, hideTabBar } = useTabBar()

  useFocusEffect(useCallback(() => { hideTabBar() }, []))

  const naviguer = (href: string) => {
    showTabBar()
    router.push(href as any)
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.fondCreme }}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing['2xl'] }}
      >
        <Hero onOuvrirPrieres={() => naviguer('/(tabs)/prieres')} />

        {/* recherche — chevauche le bas du héros */}
        <Animated.View entering={FadeInDown.duration(500)} style={{ marginTop: -26, paddingHorizontal: spacing.xl }}>
          <PressableScale onPress={() => naviguer('/recherche')} style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.blanc,
            borderRadius: radius.full,
            paddingHorizontal: spacing.lg,
            paddingVertical: 15,
            gap: spacing.sm,
            shadowColor: '#1c3d66',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.14,
            shadowRadius: 22,
            elevation: 8,
          }}>
            <IcoSearch size={19} color={colors.bleu} />
            <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.base, color: '#9aa3ad', flex: 1 }}>
              Rechercher...
            </Text>
          </PressableScale>
        </Animated.View>

        <CarteReprendre />
        <AccesRapide onNav={naviguer} />
        <HadithDuJour />
      </ScrollView>
    </View>
  )
}

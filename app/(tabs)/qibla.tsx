import { colors, radius, spacing, typography } from '@/constants/theme'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import * as Location from 'expo-location'
import { useFocusEffect, useRouter } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Dimensions, Pressable, StatusBar, Text, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient as SvgGradient,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg'
import { useTabBar } from '@/contexts/TabBarContext'

const { width } = Dimensions.get('window')
const DIAL = width * 0.88
const DIAL_R = DIAL / 2

const KAABA_LAT = 21.4225
const KAABA_LNG = 39.8262

// palette bleu logo — la même que le lecteur plein écran
const BG_TOP = '#3d6ba3'
const BG_MID = '#2d578c'
const BG_BOT = '#1c3d66'
const W90 = 'rgba(255,255,255,0.90)'
const W60 = 'rgba(255,255,255,0.60)'
const W40 = 'rgba(255,255,255,0.40)'
const W30 = 'rgba(255,255,255,0.30)'
const W14 = 'rgba(255,255,255,0.14)'
const W07 = 'rgba(255,255,255,0.07)'

// ─── maths ───────────────────────────────────────────────────
function qiblaFrom(lat: number, lng: number): number {
  const dLng = (KAABA_LNG - lng) * Math.PI / 180
  const φ1 = lat * Math.PI / 180
  const φ2 = KAABA_LAT * Math.PI / 180
  const y = Math.sin(dLng) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dLng)
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360
}

function distanceTo(lat: number, lng: number): number {
  const R = 6371
  const dLat = (KAABA_LAT - lat) * Math.PI / 180
  const dLng = (KAABA_LNG - lng) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat * Math.PI / 180) * Math.cos(KAABA_LAT * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

function norm(a: number) { return ((a % 360) + 360) % 360 }

const CARDINAUX = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO']

// ─── cadran : graduations + labels tangentiels ───────────────
function DialSvg({ size }: { size: number }) {
  const cx = size / 2, cy = size / 2
  const OR = size / 2 - 6

  const ticks: React.ReactElement[] = []
  for (let i = 0; i < 72; i++) {
    const deg = i * 5
    const rad = (deg - 90) * Math.PI / 180
    const major = deg % 90 === 0
    const med = !major && deg % 30 === 0
    const len = major ? 20 : med ? 13 : 7
    ticks.push(
      <Line key={i}
        x1={cx + (OR - len) * Math.cos(rad)} y1={cy + (OR - len) * Math.sin(rad)}
        x2={cx + OR * Math.cos(rad)} y2={cy + OR * Math.sin(rad)}
        stroke={major ? W90 : med ? W60 : W30}
        strokeWidth={major ? 2.5 : 1.5}
        strokeLinecap="round"
      />
    )
  }

  // Labels placés en haut puis tournés autour du centre :
  // ils restent tangents au cercle et se lisent à l'endroit en haut
  const LBL_R = OR - 36
  const DEG_R = OR - 60

  return (
    <Svg width={size} height={size} style={{ position: 'absolute' }}>
      {ticks}
      {CARDINAUX.map((l, i) => {
        const deg = i * 45
        const principal = deg % 90 === 0
        return (
          <SvgText key={l}
            x={cx} y={cy - LBL_R + (principal ? 6 : 4)}
            transform={`rotate(${deg} ${cx} ${cy})`}
            textAnchor="middle"
            fill={l === 'N' ? colors.or : principal ? W90 : W40}
            fontSize={principal ? 17 : 10}
            fontWeight={principal ? 'bold' : 'normal'}
          >{l}</SvgText>
        )
      })}
      {[30, 60, 120, 150, 210, 240, 300, 330].map(deg => (
        <SvgText key={deg}
          x={cx} y={cy - DEG_R + 3}
          transform={`rotate(${deg} ${cx} ${cy})`}
          textAnchor="middle"
          fill={W30} fontSize={9}
        >{deg}</SvgText>
      ))}
    </Svg>
  )
}

// ─── aiguille : flèche dorée effilée avec pointe barbelée ────
function NeedleSvg({ size, aligne }: { size: number; aligne: boolean }) {
  const cx = size / 2, cy = size / 2
  const tipY = cy - size * 0.355
  const tailY = cy + size * 0.20

  return (
    <Svg width={size} height={size} style={{ position: 'absolute' }}>
      <Defs>
        <SvgGradient id="goldNeedle" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={aligne ? '#ffffff' : '#f0d488'} />
          <Stop offset="1" stopColor={aligne ? '#f0d488' : '#c8992b'} />
        </SvgGradient>
      </Defs>
      {/* flèche : pointe + barbes + fût effilé */}
      <Path
        d={`M ${cx} ${tipY}
            L ${cx + 13} ${tipY + 34}
            L ${cx + 4.5} ${tipY + 27}
            L ${cx + 4.5} ${cy}
            L ${cx - 4.5} ${cy}
            L ${cx - 4.5} ${tipY + 27}
            L ${cx - 13} ${tipY + 34}
            Z`}
        fill="url(#goldNeedle)"
      />
      {/* queue fine avec disque terminal */}
      <Line x1={cx} y1={cy} x2={cx} y2={tailY - 8}
        stroke={W40} strokeWidth={3} strokeLinecap="round" />
      <Circle cx={cx} cy={tailY} r={5.5} fill="none" stroke={W40} strokeWidth={3} />
    </Svg>
  )
}

export default function QiblaPage() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { hideTabBar, showTabBar } = useTabBar()

  const [perm, setPerm] = useState<'idle' | 'granted' | 'denied'>('idle')
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null)
  const [qiblaAngle, setQiblaAngle] = useState<number | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [boussole, setBoussole] = useState(0)
  const [aligne, setAligne] = useState(false)

  const lastHaptic = useRef(0)
  const prevDial = useRef(0)
  const prevNeedle = useRef(0)

  const dialRot = useSharedValue(0)
  const needleRot = useSharedValue(0)
  const glowOpacity = useSharedValue(0)
  const pulseScale = useSharedValue(1)

  // plein écran : pas de barre de menu sur cette page
  useFocusEffect(useCallback(() => {
    hideTabBar()
    return () => showTabBar()
  }, []))

  // Glow + vibration quand aligné
  useEffect(() => {
    if (aligne) {
      glowOpacity.value = withTiming(1, { duration: 350 })
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.018, { duration: 700 }),
          withTiming(1, { duration: 700 }),
        ),
        -1,
        true,
      )
      const now = Date.now()
      if (now - lastHaptic.current > 2200) {
        lastHaptic.current = now
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      }
    } else {
      glowOpacity.value = withTiming(0, { duration: 300 })
      pulseScale.value = withTiming(1, { duration: 200 })
    }
  }, [aligne])

  // GPS + permission (une seule fois à l'initialisation)
  useEffect(() => {
    let actif = true
    async function getPos() {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') { setPerm('denied'); return }
      if (!actif) return
      setPerm('granted')
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      if (!actif) return
      const { latitude: lat, longitude: lng } = loc.coords
      setPos({ lat, lng })
      setQiblaAngle(qiblaFrom(lat, lng))
      setDistance(distanceTo(lat, lng))
    }
    getPos().catch(e => console.warn('qibla GPS:', e))
    return () => { actif = false }
  }, [])

  // Magnétomètre uniquement quand l'écran est visible — s'arrête dès
  // qu'on passe à un autre onglet (les tabs restent montés en mémoire),
  // ce qui évitait l'arrêt du capteur et faisait chauffer l'appareil.
  useFocusEffect(useCallback(() => {
    let headingSub: Location.LocationSubscription | null = null
    Location.watchHeadingAsync(h => {
      // trueHeading = vrai nord (corrige la déclinaison magnétique),
      // déjà compensé en inclinaison et référencé au haut de l'appareil
      const cap = h.trueHeading >= 0 ? h.trueHeading : h.magHeading
      setBoussole(norm(cap))
    }).then(sub => { headingSub = sub }).catch(() => {})
    return () => { headingSub?.remove() }
  }, []))

  // Rotation du cadran
  useEffect(() => {
    let delta = boussole - prevDial.current
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    prevDial.current += delta
    dialRot.value = withTiming(-prevDial.current, { duration: 120, easing: Easing.out(Easing.quad) })
  }, [boussole])

  // Rotation de l'aiguille Qibla
  useEffect(() => {
    if (qiblaAngle === null) return
    const target = norm(qiblaAngle - boussole)
    let delta = target - prevNeedle.current
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    prevNeedle.current += delta
    needleRot.value = withTiming(prevNeedle.current, { duration: 120, easing: Easing.out(Easing.quad) })
    setAligne(target < 4 || target > 356)
  }, [boussole, qiblaAngle])

  const dialStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${dialRot.value}deg` }],
  }))
  const needleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${needleRot.value}deg` }],
  }))
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }))
  const compassWrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }))

  // écart signé vers la Qibla (pour le guidage gauche/droite)
  const ecart = qiblaAngle !== null
    ? (() => { let d = norm(qiblaAngle - boussole); if (d > 180) d -= 360; return d })()
    : 0
  const cardinalActuel = CARDINAUX[Math.round(boussole / 45) % 8]

  // ── Permission refusée ───────────────────────────────────────
  if (perm === 'denied') {
    return (
      <LinearGradient colors={[BG_TOP, BG_MID, BG_BOT]} locations={[0, 0.5, 1]} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <StatusBar barStyle="light-content" />
        <View style={{
          width: 72, height: 72, borderRadius: 36,
          backgroundColor: W07, borderWidth: 1, borderColor: W30,
          alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg,
        }}>
          <Svg width={32} height={32} viewBox="0 -960 960 960">
            <Path d="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 294q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm0 106Q319-217 239.5-334.5T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 100-79.5 217.5T480-80Z" fill={W90} />
          </Svg>
        </View>
        <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size['2xl'], color: W90, marginBottom: spacing.sm, textAlign: 'center' }}>
          Localisation requise
        </Text>
        <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.base, color: W60, textAlign: 'center', lineHeight: 22, maxWidth: 280 }}>
          Autorise la localisation dans les Réglages pour trouver la direction de la Qibla.
        </Text>
      </LinearGradient>
    )
  }

  // ── Chargement ───────────────────────────────────────────────
  if (!pos || qiblaAngle === null) {
    return (
      <LinearGradient colors={[BG_TOP, BG_MID, BG_BOT]} locations={[0, 0.5, 1]} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color={colors.or} style={{ marginBottom: spacing.lg }} />
        <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xl, color: W90, marginBottom: spacing.xs }}>
          Calcul en cours…
        </Text>
        <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.base, color: W60 }}>
          Détection de ta position
        </Text>
      </LinearGradient>
    )
  }

  return (
    <LinearGradient colors={[BG_TOP, BG_MID, BG_BOT]} locations={[0, 0.5, 1]} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />

      {/* brume décorative — même langage que le lecteur */}
      <View style={{ position: 'absolute', width: 600, height: 600, borderRadius: 300, backgroundColor: 'rgba(120,165,220,0.13)', top: -260, left: -200 }} />
      <View style={{ position: 'absolute', width: 480, height: 480, borderRadius: 240, backgroundColor: 'rgba(90,140,200,0.11)', top: 260, right: -220 }} />
      <View style={{ position: 'absolute', width: 460, height: 460, borderRadius: 230, backgroundColor: 'rgba(28,61,102,0.45)', bottom: -180, left: -140 }} />

      {/* ── Header ── */}
      <View style={{
        paddingTop: insets.top + spacing.sm,
        paddingHorizontal: spacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <Pressable
          onPress={() => {
            Haptics.selectionAsync()
            router.canGoBack() ? router.back() : router.push('/' as any)
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={({ pressed }) => ({
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: W07, borderWidth: 1, borderColor: W30,
            alignItems: 'center', justifyContent: 'center',
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <ArrowLeft size={20} color="#fff" strokeWidth={2.2} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <View style={{ backgroundColor: 'rgba(214,173,58,0.16)', borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 4 }}>
            <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, letterSpacing: 1.8, color: colors.or, textTransform: 'uppercase' }}>
              Direction de La Mecque
            </Text>
          </View>
          <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size['2xl'], color: '#fff' }}>
            Qibla
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Cap actuel ── */}
      <View style={{ alignItems: 'center', marginTop: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Text style={{
            fontFamily: typography.fontFamily.bold,
            fontSize: 54,
            color: aligne ? colors.or : W90,
            fontVariant: ['tabular-nums'],
            lineHeight: 60,
          }}>
            {Math.round(boussole)}°
          </Text>
          <Text style={{
            fontFamily: typography.fontFamily.bold,
            fontSize: typography.size.xl,
            color: aligne ? colors.or : W60,
          }}>
            {cardinalActuel}
          </Text>
        </View>
      </View>

      {/* ── Boussole ── */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={compassWrapStyle}>
          <View style={{ width: DIAL, height: DIAL }}>

            {/* Halo doré quand aligné */}
            <Animated.View style={[{
              position: 'absolute',
              top: -12, left: -12, right: -12, bottom: -12,
              borderRadius: (DIAL + 24) / 2,
              borderWidth: 2,
              borderColor: colors.or,
              shadowColor: colors.or,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 22,
            }, glowStyle]} />

            {/* Anneau extérieur */}
            <View style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              borderRadius: DIAL_R,
              borderWidth: 1.5,
              borderColor: aligne ? colors.or : W30,
            }} />

            {/* Disque intérieur (verre dépoli) */}
            <View style={{
              position: 'absolute', top: 12, left: 12, right: 12, bottom: 12,
              borderRadius: (DIAL - 24) / 2,
              backgroundColor: W07,
              borderWidth: 1,
              borderColor: W14,
            }} />

            {/* Cadran rotatif */}
            <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, dialStyle]}>
              <DialSvg size={DIAL} />
            </Animated.View>

            {/* Repère fixe en haut = direction du regard */}
            <View style={{ position: 'absolute', top: -4, left: DIAL_R - 8, width: 16, height: 18 }}>
              <Svg width={16} height={18} viewBox="0 0 16 18">
                <Path d="M 8 18 L 0 0 L 8 5 L 16 0 Z" fill={aligne ? colors.or : '#fff'} />
              </Svg>
            </View>

            {/* Aiguille Qibla */}
            <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, needleStyle]}>
              <NeedleSvg size={DIAL} aligne={aligne} />
            </Animated.View>

            {/* Centre Kaaba */}
            <View style={{
              position: 'absolute',
              top: DIAL_R - 26,
              left: DIAL_R - 26,
              width: 52, height: 52,
              borderRadius: 26,
              backgroundColor: aligne ? colors.or : '#16263e',
              borderWidth: 2,
              borderColor: aligne ? 'rgba(255,255,255,0.55)' : W30,
              alignItems: 'center', justifyContent: 'center',
              shadowColor: aligne ? colors.or : '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.5,
              shadowRadius: 10,
              elevation: 8,
            }}>
              <Text style={{ fontSize: 23 }}>🕋</Text>
            </View>

          </View>
        </Animated.View>
      </View>

      {/* ── Guidage ── */}
      <View style={{ alignItems: 'center', marginBottom: spacing.lg, minHeight: 46, justifyContent: 'center' }}>
        {aligne ? (
          <View style={{
            backgroundColor: 'rgba(214,173,58,0.14)',
            borderRadius: radius.full,
            paddingHorizontal: spacing.xl, paddingVertical: spacing.sm + 2,
            borderWidth: 1.5, borderColor: colors.or,
          }}>
            <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.base, color: colors.or }}>
              ✓  Vous faites face à la Qibla
            </Text>
          </View>
        ) : (
          <View style={{
            backgroundColor: W07,
            borderRadius: radius.full,
            paddingHorizontal: spacing.xl, paddingVertical: spacing.sm + 2,
            borderWidth: 1, borderColor: W30,
            flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
          }}>
            <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base, color: W90 }}>
              {ecart > 0 ? '↻' : '↺'}
            </Text>
            <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.base, color: W60 }}>
              Tournez {ecart > 0 ? 'à droite' : 'à gauche'} de{' '}
              <Text style={{ color: W90, fontFamily: typography.fontFamily.bold, fontVariant: ['tabular-nums'] }}>
                {Math.abs(Math.round(ecart))}°
              </Text>
            </Text>
          </View>
        )}
      </View>

      {/* ── Barre d'infos ── */}
      <View style={{
        flexDirection: 'row',
        marginHorizontal: spacing.xl,
        marginBottom: insets.bottom + spacing.lg,
        backgroundColor: W07,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: W14,
        overflow: 'hidden',
      }}>
        {([
          { label: 'Qibla', value: `${Math.round(qiblaAngle)}°` },
          { label: 'Distance', value: `${distance!.toLocaleString('fr-FR')} km` },
          { label: 'Position', value: `${pos.lat.toFixed(2)}°, ${pos.lng.toFixed(2)}°` },
        ] as const).map((item, i, arr) => (
          <View key={item.label} style={{
            flex: 1,
            alignItems: 'center',
            paddingVertical: spacing.lg,
            borderRightWidth: i < arr.length - 1 ? 1 : 0,
            borderRightColor: W14,
          }}>
            <Text style={{
              fontFamily: typography.fontFamily.bold,
              fontSize: i === 2 ? typography.size.sm : typography.size.md,
              color: W90,
              marginBottom: 3,
              fontVariant: ['tabular-nums'],
            }}>
              {item.value}
            </Text>
            <Text style={{
              fontFamily: typography.fontFamily.regular,
              fontSize: typography.size.xs,
              color: W60,
              letterSpacing: 0.8,
              textTransform: 'uppercase',
            }}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>

    </LinearGradient>
  )
}

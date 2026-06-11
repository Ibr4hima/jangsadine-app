import { colors, radius, spacing, typography } from '@/constants/theme'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import { Magnetometer } from 'expo-sensors'
import { ArrowLeft } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { Dimensions, Pressable, StatusBar, Text, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg'

const { width } = Dimensions.get('window')
const DIAL = width * 0.86
const DIAL_R = DIAL / 2

const KAABA_LAT = 21.4225
const KAABA_LNG = 39.8262

const BG_TOP = '#0d1b2e'
const BG_MID = '#1a3050'
const BG_BOT = '#2d578c'
const W90 = 'rgba(255,255,255,0.90)'
const W60 = 'rgba(255,255,255,0.60)'
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

// ─── SVG : cadran avec graduations + points cardinaux ────────
function DialSvg({ size }: { size: number }) {
  const cx = size / 2, cy = size / 2
  const OR = size / 2 - 5

  const ticks: React.ReactElement[] = []
  for (let i = 0; i < 72; i++) {
    const deg = i * 5
    const rad = (deg - 90) * Math.PI / 180
    const major = deg % 90 === 0
    const med = !major && deg % 45 === 0
    const len = major ? 22 : med ? 14 : 7
    const r1 = OR - len
    const r2 = OR
    ticks.push(
      <Line key={i}
        x1={cx + r1 * Math.cos(rad)} y1={cy + r1 * Math.sin(rad)}
        x2={cx + r2 * Math.cos(rad)} y2={cy + r2 * Math.sin(rad)}
        stroke={major ? W90 : med ? W60 : W30}
        strokeWidth={major ? 2.5 : 1.5}
        strokeLinecap="round"
      />
    )
  }

  const LR = OR - 34
  const DIRS: { l: string; deg: number; color: string; fs: number; fw: 'bold' | 'normal' }[] = [
    { l: 'N', deg: 0, color: colors.or, fs: 16, fw: 'bold' },
    { l: 'NE', deg: 45, color: W60, fs: 9, fw: 'normal' },
    { l: 'E', deg: 90, color: W90, fs: 13, fw: 'bold' },
    { l: 'SE', deg: 135, color: W60, fs: 9, fw: 'normal' },
    { l: 'S', deg: 180, color: W90, fs: 13, fw: 'bold' },
    { l: 'SO', deg: 225, color: W60, fs: 9, fw: 'normal' },
    { l: 'O', deg: 270, color: W90, fs: 13, fw: 'bold' },
    { l: 'NO', deg: 315, color: W60, fs: 9, fw: 'normal' },
  ]

  return (
    <Svg width={size} height={size} style={{ position: 'absolute' }}>
      {ticks}
      {DIRS.map(({ l, deg, color, fs, fw }) => {
        const rad = (deg - 90) * Math.PI / 180
        return (
          <SvgText key={l}
            x={cx + LR * Math.cos(rad)} y={cy + LR * Math.sin(rad) + fs * 0.37}
            textAnchor="middle"
            fill={color} fontSize={fs} fontWeight={fw}
          >{l}</SvgText>
        )
      })}
    </Svg>
  )
}

// ─── SVG : aiguille diamant ───────────────────────────────────
function NeedleSvg({ size, aligne }: { size: number; aligne: boolean }) {
  const cx = size / 2, cy = size / 2
  const hw = size * 0.044
  const tipT = cy - size * 0.33
  const tipB = cy + size * 0.23

  return (
    <Svg width={size} height={size} style={{ position: 'absolute' }}>
      {/* Pointe dorée vers la Qibla */}
      <Path
        d={`M ${cx} ${tipT} L ${cx + hw * 2.4} ${cy} L ${cx} ${cy - hw * 1.4} L ${cx - hw * 2.4} ${cy} Z`}
        fill={aligne ? '#ffffff' : colors.or}
      />
      {/* Contrepoids semi-transparent */}
      <Path
        d={`M ${cx} ${tipB} L ${cx + hw * 1.8} ${cy} L ${cx} ${cy - hw * 1.4} L ${cx - hw * 1.8} ${cy} Z`}
        fill={W30}
      />
      {/* Centre */}
      <Circle cx={cx} cy={cy} r={hw * 2.4} fill={aligne ? colors.or : W90} />
      <Circle cx={cx} cy={cy} r={hw * 1.1} fill={BG_MID} />
    </Svg>
  )
}

export default function QiblaPage() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

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
  const glowScale = useSharedValue(1)
  const pulseScale = useSharedValue(1)

  // Glow + haptic quand aligné
  useEffect(() => {
    if (aligne) {
      glowOpacity.value = withTiming(1, { duration: 350 })
      glowScale.value = withTiming(1.045, { duration: 600 })
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.015, { duration: 700 }),
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
      glowScale.value = withTiming(1, { duration: 400 })
      pulseScale.value = withTiming(1, { duration: 200 })
    }
  }, [aligne])

  // GPS + angle Qibla
  useEffect(() => {
    async function init() {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') { setPerm('denied'); return }
      setPerm('granted')
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      const { latitude: lat, longitude: lng } = loc.coords
      setPos({ lat, lng })
      setQiblaAngle(qiblaFrom(lat, lng))
      setDistance(distanceTo(lat, lng))
    }
    init().catch(e => console.warn('qibla init:', e))
  }, [])

  // Magnétomètre
  useEffect(() => {
    Magnetometer.setUpdateInterval(80)
    const sub = Magnetometer.addListener(({ x, y }) => {
      setBoussole(norm(-Math.atan2(y, x) * 180 / Math.PI))
    })
    return () => sub.remove()
  }, [])

  // Rotation du cadran (rose des vents)
  useEffect(() => {
    let delta = boussole - prevDial.current
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    prevDial.current += delta
    dialRot.value = withTiming(-prevDial.current, { duration: 110, easing: Easing.out(Easing.quad) })
  }, [boussole])

  // Rotation de l'aiguille Qibla
  useEffect(() => {
    if (qiblaAngle === null) return
    const target = norm(qiblaAngle - boussole)
    let delta = target - prevNeedle.current
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    prevNeedle.current += delta
    needleRot.value = withTiming(prevNeedle.current, { duration: 110, easing: Easing.out(Easing.quad) })
    setAligne(target < 3.5 || target > 356.5)
  }, [boussole, qiblaAngle])

  const dialStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${dialRot.value}deg` }],
  }))
  const needleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${needleRot.value}deg` }],
  }))
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }))
  const compassWrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }))

  // ── Permission refusée ───────────────────────────────────────
  if (perm === 'denied') {
    return (
      <LinearGradient colors={[BG_TOP, BG_MID, BG_BOT]} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <StatusBar barStyle="light-content" />
        <Text style={{ fontSize: 52, marginBottom: spacing.lg }}>📍</Text>
        <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size['2xl'], color: W90, marginBottom: spacing.sm, textAlign: 'center' }}>
          Accès refusé
        </Text>
        <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.base, color: W60, textAlign: 'center', lineHeight: 22 }}>
          Autorise la localisation dans les réglages pour utiliser la Qibla.
        </Text>
      </LinearGradient>
    )
  }

  // ── Chargement ───────────────────────────────────────────────
  if (!pos || qiblaAngle === null) {
    return (
      <LinearGradient colors={[BG_TOP, BG_MID, BG_BOT]} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <StatusBar barStyle="light-content" />
        <Text style={{ fontSize: 52, marginBottom: spacing.lg }}>🧭</Text>
        <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size['2xl'], color: W90, marginBottom: spacing.sm }}>
          Calcul en cours…
        </Text>
        <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.base, color: W60 }}>
          Détection de votre position GPS
        </Text>
      </LinearGradient>
    )
  }

  return (
    <LinearGradient colors={[BG_TOP, BG_MID, BG_BOT]} locations={[0, 0.45, 1]} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ── */}
      <View style={{
        paddingTop: insets.top + spacing.sm,
        paddingHorizontal: spacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: spacing.md,
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
          <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.lg, color: '#fff' }}>
            Qibla
          </Text>
          <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.xs, color: W60 }}>
            Direction de La Mecque
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Indicateur de cap en direct ── */}
      <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
        <Text style={{
          fontFamily: typography.fontFamily.bold,
          fontSize: 52,
          color: aligne ? colors.or : W90,
          fontVariant: ['tabular-nums'],
          lineHeight: 58,
        }}>
          {Math.round(boussole)}°
        </Text>
        <Text style={{
          fontFamily: typography.fontFamily.regular,
          fontSize: typography.size.xs,
          color: aligne ? colors.or : W60,
          letterSpacing: 1.4,
          textTransform: 'uppercase',
        }}>
          Cap actuel
        </Text>
      </View>

      {/* ── Boussole ── */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={compassWrapStyle}>
          <View style={{ width: DIAL, height: DIAL }}>

            {/* Halo doré quand aligné */}
            <Animated.View style={[{
              position: 'absolute',
              top: -10, left: -10, right: -10, bottom: -10,
              borderRadius: (DIAL + 20) / 2,
              borderWidth: 2,
              borderColor: colors.or,
              shadowColor: colors.or,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 20,
              elevation: 0,
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
              position: 'absolute', top: 14, left: 14, right: 14, bottom: 14,
              borderRadius: (DIAL - 28) / 2,
              backgroundColor: W07,
              borderWidth: 1,
              borderColor: W14,
            }} />

            {/* Cadran rotatif (graduations + cardinaux) */}
            <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, dialStyle]}>
              <DialSvg size={DIAL} />
            </Animated.View>

            {/* Indicateur Nord fixe (triangle doré en haut) */}
            <View style={{
              position: 'absolute',
              top: 18,
              left: DIAL_R - 6,
              width: 12, height: 12,
            }}>
              <Svg width={12} height={12} viewBox="0 0 12 12">
                <Path d="M 6 0 L 12 12 L 0 12 Z" fill={colors.or} opacity={0.9} />
              </Svg>
            </View>

            {/* Aiguille Qibla (tourne vers La Mecque) */}
            <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, needleStyle]}>
              <NeedleSvg size={DIAL} aligne={aligne} />
            </Animated.View>

            {/* Centre Kaaba */}
            <View style={{
              position: 'absolute',
              top: DIAL_R - 27,
              left: DIAL_R - 27,
              width: 54, height: 54,
              borderRadius: 27,
              backgroundColor: aligne ? colors.or : BG_MID,
              borderWidth: 2,
              borderColor: aligne ? 'rgba(255,255,255,0.5)' : W30,
              alignItems: 'center', justifyContent: 'center',
              shadowColor: aligne ? colors.or : '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.5,
              shadowRadius: 10,
              elevation: 8,
            }}>
              <Text style={{ fontSize: 24 }}>🕋</Text>
            </View>

          </View>
        </Animated.View>
      </View>

      {/* ── Badge alignement ── */}
      <View style={{ alignItems: 'center', marginVertical: spacing.lg }}>
        {aligne ? (
          <View style={{
            backgroundColor: 'rgba(214,173,58,0.14)',
            borderRadius: radius.full,
            paddingHorizontal: spacing.xl, paddingVertical: spacing.sm + 2,
            borderWidth: 1.5, borderColor: colors.or,
            flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
          }}>
            <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.base, color: colors.or }}>
              ✓  Face à la Qibla
            </Text>
          </View>
        ) : (
          <View style={{
            backgroundColor: W07,
            borderRadius: radius.full,
            paddingHorizontal: spacing.xl, paddingVertical: spacing.sm + 2,
            borderWidth: 1, borderColor: W30,
          }}>
            <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.base, color: W60 }}>
              Tournez-vous vers la Qibla
            </Text>
          </View>
        )}
      </View>

      {/* ── Barre d'infos ── */}
      <View style={{
        flexDirection: 'row',
        marginHorizontal: spacing.xl,
        marginBottom: insets.bottom + spacing.xl,
        backgroundColor: W07,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: W14,
        overflow: 'hidden',
      }}>
        {([
          { label: 'Qibla', value: `${Math.round(qiblaAngle)}°` },
          { label: 'Distance', value: `${distance!.toLocaleString()} km` },
          { label: 'Coordonnées', value: `${pos.lat.toFixed(2)}°, ${pos.lng.toFixed(2)}°` },
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

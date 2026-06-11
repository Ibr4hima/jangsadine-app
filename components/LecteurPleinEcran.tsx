import { colors, radius, spacing, typography } from '@/constants/theme'
import { useAudio } from '@/contexts/AudioContext'
import { supabase } from '@/lib/supabase'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Moon, Volume1, Volume2 } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import {
    Dimensions,
    Image,
    Pressable,
    ScrollView,
    StatusBar,
    Text,
    View,
} from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
    cancelAnimation,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import TextTicker from 'react-native-text-ticker'

// ─── colour tokens ────────────────────────────────────────────
const BG_TOP    = '#2C4060'
const BG_MID    = '#1E2F47'
const BG_BOT    = '#111E2F'
const W80       = 'rgba(255,255,255,0.80)'
const W60       = 'rgba(255,255,255,0.60)'
const W30       = 'rgba(255,255,255,0.30)'
const W12       = 'rgba(255,255,255,0.12)'
const W06       = 'rgba(255,255,255,0.06)'
const OR_DIM    = 'rgba(217,172,42,0.20)'

// ─── icons ────────────────────────────────────────────────────
function IcoBack({ size = 32, color = '#fff' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M339.5-108.5q-65.5-28.5-114-77t-77-114Q120-365 120-440h80q0 117 81.5 198.5T480-160q117 0 198.5-81.5T760-440q0-117-81.5-198.5T480-720h-6l62 62-56 58-160-160 160-160 56 58-62 62h6q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-440q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-80q-75 0-140.5-28.5ZM360-320v-180h-60v-60h120v240h-60Zm140 0q-17 0-28.5-11.5T460-360v-160q0-17 11.5-28.5T500-560h80q17 0 28.5 11.5T620-520v160q0 17-11.5 28.5T580-320h-80Zm20-60h40v-120h-40v120Z" fill={color} />
        </Svg>
    )
}
function IcoFwd({ size = 32, color = '#fff' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M360-320v-180h-60v-60h120v240h-60Zm140 0q-17 0-28.5-11.5T460-360v-160q0-17 11.5-28.5T500-560h80q17 0 28.5 11.5T620-520v160q0 17-11.5 28.5T580-320h-80Zm20-60h40v-120h-40v120ZM339.5-108.5q-65.5-28.5-114-77t-77-114Q120-365 120-440t28.5-140.5q28.5-65.5 77-114t114-77Q405-800 480-800h6l-62-62 56-58 160 160-160 160-56-58 62-62h-6q-117 0-198.5 81.5T200-440q0 117 81.5 198.5T480-160q117 0 198.5-81.5T760-440h80q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-80q-75 0-140.5-28.5Z" fill={color} />
        </Svg>
    )
}
function IcoPlay({ size = 36, color = '#1E2F47' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M320-200v-560l440 280-440 280Z" fill={color} />
        </Svg>
    )
}
function IcoPause({ size = 36, color = '#1E2F47' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M555-200v-560h205v560H555Zm-355 0v-560h205v560H200Z" fill={color} />
        </Svg>
    )
}
function IcoInfo({ size = 22, color = '#fff' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M423.5-703.5Q400-727 400-760t23.5-56.5Q447-840 480-840t56.5 23.5Q560-793 560-760t-23.5 56.5Q513-680 480-680t-56.5-23.5ZM420-120v-480h120v480H420Z" fill={color} />
        </Svg>
    )
}
function IcoChapters({ size = 22, color = '#fff' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M280-600v-80h560v80H280Zm0 160v-80h560v80H280Zm0 160v-80h560v80H280ZM160-600q-17 0-28.5-11.5T120-640q0-17 11.5-28.5T160-680q17 0 28.5 11.5T200-640q0 17-11.5 28.5T160-600Zm0 160q-17 0-28.5-11.5T120-480q0-17 11.5-28.5T160-520q17 0 28.5 11.5T200-480q0 17-11.5 28.5T160-440Zm0 160q-17 0-28.5-11.5T120-320q0-17 11.5-28.5T160-360q17 0 28.5 11.5T200-320q0 17-11.5 28.5T160-280Z" fill={color} />
        </Svg>
    )
}
function IcoQueue({ size = 22, color = '#fff' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M560-160v-80h240v80H560Zm0-160v-80h240v80H560ZM120-560v-80h240v80H120Zm0-160v-80h240v80H120Zm160 520L120-360l56-56 104 104 264-264 56 56-320 320Zm280-120v-80h240v80H560Z" fill={color} />
        </Svg>
    )
}

// ─── helpers ──────────────────────────────────────────────────
const { width: W, height: SCREEN_H } = Dimensions.get('window')
const ART_SIZE = W - spacing.xl * 2

const VITESSES = [1, 1.25, 1.5, 2, 0.75]
const SLEEP_OPTS = [
    { label: 'Désactivé', minutes: 0 },
    { label: '5 min',     minutes: 5  },
    { label: '10 min',    minutes: 10 },
    { label: '15 min',    minutes: 15 },
    { label: '30 min',    minutes: 30 },
    { label: '45 min',    minutes: 45 },
    { label: '1 h',       minutes: 60 },
]

function fmt(s: number) {
    if (!s || isNaN(s) || s < 0) return '0:00'
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sc = Math.floor(s % 60)
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sc).padStart(2,'0')}`
    return `${m}:${String(sc).padStart(2,'0')}`
}
const fmtVitesse = (v: number) => String(v).replace('.', ',')

// ─── Artwork ──────────────────────────────────────────────────
// Bug fix: never unmount this — use opacity/pointerEvents to hide
// so the Image never loses its loaded state.
function Artwork({ enLecture, hidden }: { enLecture: boolean; hidden: boolean }) {
    const scale = useSharedValue(enLecture ? 1 : 0.78)

    useEffect(() => {
        scale.value = withSpring(enLecture ? 1 : 0.78, { damping: 14, stiffness: 140 })
    }, [enLecture])

    const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

    return (
        <View
            pointerEvents={hidden ? 'none' : 'auto'}
            style={{
                position: hidden ? 'absolute' : 'relative',
                opacity: hidden ? 0 : 1,
                width: ART_SIZE, height: ART_SIZE,
                alignItems: 'center', justifyContent: 'center',
            }}
        >
            <Animated.View style={[{
                width: ART_SIZE, height: ART_SIZE,
                borderRadius: 22,
                backgroundColor: '#fff',
                alignItems: 'center', justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 24 },
                shadowOpacity: 0.55,
                shadowRadius: 36,
                elevation: 24,
            }, style]}>
                {/* subtle inner top-edge highlight */}
                <View style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    borderTopLeftRadius: 22, borderTopRightRadius: 22,
                }} />
                <Image
                    source={require('../assets/images/logo.png')}
                    style={{ width: ART_SIZE * 0.56, height: ART_SIZE * 0.56 }}
                    resizeMode="contain"
                />
            </Animated.View>
        </View>
    )
}

// ─── Progress bar ─────────────────────────────────────────────
function Progress({ tempsActuel, dureeTotal, onSeek }: {
    tempsActuel: number; dureeTotal: number; onSeek: (pct: number) => void
}) {
    const [scrub, setScrub] = useState<number | null>(null)
    const barW = useRef(W - spacing.xl * 2)
    const isScrubbing = scrub !== null

    const pct = (x: number) => Math.max(0, Math.min(100, (x / barW.current) * 100))

    const gesture = Gesture.Pan()
        .minDistance(0)
        .runOnJS(true)
        .onBegin(e  => setScrub(pct(e.x)))
        .onUpdate(e => setScrub(pct(e.x)))
        .onEnd(e => {
            onSeek(pct(e.x))
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        })
        .onFinalize(() => setScrub(null))

    const live     = isScrubbing ? scrub! : (dureeTotal > 0 ? (tempsActuel / dureeTotal) * 100 : 0)
    const tDisplay = isScrubbing && dureeTotal > 0 ? (scrub! / 100) * dureeTotal : tempsActuel
    const restant  = Math.max(0, dureeTotal - tDisplay)
    const H        = isScrubbing ? 12 : 6

    return (
        <View>
            <GestureDetector gesture={gesture}>
                <View
                    onLayout={e => { barW.current = e.nativeEvent.layout.width }}
                    style={{ height: 38, justifyContent: 'center' }}
                >
                    {/* track */}
                    <View style={{
                        height: H, backgroundColor: W12,
                        borderRadius: H / 2, overflow: 'hidden',
                    }}>
                        <View style={{
                            width: `${live}%` as any, height: '100%', borderRadius: H / 2,
                            backgroundColor: isScrubbing ? colors.or : W80,
                        }} />
                    </View>
                    {/* thumb dot when scrubbing */}
                    {isScrubbing && (
                        <View style={{
                            position: 'absolute',
                            left: `${live}%` as any,
                            width: 16, height: 16, borderRadius: 8,
                            backgroundColor: colors.or,
                            marginLeft: -8,
                            shadowColor: colors.or, shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: 0.8, shadowRadius: 8,
                        }} />
                    )}
                </View>
            </GestureDetector>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 }}>
                <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.xs, color: isScrubbing ? colors.or : W60, fontVariant: ['tabular-nums'] }}>
                    {fmt(tDisplay)}
                </Text>
                <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.xs, color: W60, fontVariant: ['tabular-nums'] }}>
                    -{fmt(restant)}
                </Text>
            </View>
        </View>
    )
}

// ─── Volume bar ────────────────────────────────────────────────
function Volume({ volume, onChange }: { volume: number; onChange: (v: number) => void }) {
    const [local, setLocal] = useState(volume)
    const [drag, setDrag] = useState(false)
    const barW   = useRef(W - spacing.xl * 2 - 72)
    const isDrag = useRef(false)
    const lastT  = useRef(0)

    useEffect(() => { if (!isDrag.current) setLocal(volume) }, [volume])

    const vol = (x: number) => Math.max(0, Math.min(1, x / barW.current))
    const send = (v: number, force = false) => {
        setLocal(v)
        const now = Date.now()
        if (force || now - lastT.current > 60) { lastT.current = now; onChange(v) }
    }

    const gesture = Gesture.Pan()
        .minDistance(0)
        .runOnJS(true)
        .onBegin(e => { isDrag.current = true; setDrag(true);  send(vol(e.x)) })
        .onUpdate(e => send(vol(e.x)))
        .onEnd(e    => send(vol(e.x), true))
        .onFinalize(() => { isDrag.current = false; setDrag(false) })

    const H = drag ? 8 : 4

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Volume1 size={18} color={W60} strokeWidth={2} />
            <GestureDetector gesture={gesture}>
                <View
                    onLayout={e => { barW.current = e.nativeEvent.layout.width }}
                    style={{ flex: 1, height: 36, justifyContent: 'center' }}
                >
                    <View style={{ height: H, backgroundColor: W12, borderRadius: H/2, overflow: 'hidden' }}>
                        <View style={{
                            width: `${local * 100}%` as any,
                            height: '100%', borderRadius: H/2,
                            backgroundColor: drag ? '#fff' : 'rgba(255,255,255,0.65)',
                        }} />
                    </View>
                    {drag && (
                        <View style={{
                            position: 'absolute', left: `${local * 100}%` as any,
                            width: 14, height: 14, borderRadius: 7, backgroundColor: '#fff',
                            marginLeft: -7,
                        }} />
                    )}
                </View>
            </GestureDetector>
            <Volume2 size={18} color={W60} strokeWidth={2} />
        </View>
    )
}

// ─── Play / Pause button with glow ────────────────────────────
function BoutonPlay({ enLecture, onPress }: { enLecture: boolean; onPress: () => void }) {
    const glow = useSharedValue(0)

    useEffect(() => {
        if (enLecture) {
            glow.value = withRepeat(
                withSequence(
                    withTiming(1,   { duration: 1800 }),
                    withTiming(0.3, { duration: 1800 }),
                ), -1, true
            )
        } else {
            cancelAnimation(glow)
            glow.value = withTiming(0, { duration: 400 })
        }
    }, [enLecture])

    const ringStyle = useAnimatedStyle(() => ({
        opacity: glow.value * 0.18,
        transform: [{ scale: 1 + glow.value * 0.12 }],
    }))

    return (
        <Pressable
            onPress={onPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={({ pressed }) => ({
                transform: [{ scale: pressed ? 0.90 : 1 }],
            })}
        >
            <View style={{ alignItems: 'center', justifyContent: 'center', width: 88, height: 88 }}>
                {/* pulsing glow ring */}
                <Animated.View style={[{
                    position: 'absolute',
                    width: 88, height: 88, borderRadius: 44,
                    backgroundColor: '#fff',
                }, ringStyle]} />
                {/* main circle */}
                <View style={{
                    width: 80, height: 80, borderRadius: 40,
                    backgroundColor: '#fff',
                    alignItems: 'center', justifyContent: 'center',
                    shadowColor: '#fff',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.22,
                    shadowRadius: 14,
                    elevation: 10,
                }}>
                    {enLecture
                        ? <IcoPause size={34} color={BG_MID} />
                        : <IcoPlay  size={34} color={BG_MID} />
                    }
                </View>
            </View>
        </Pressable>
    )
}

// ─── Skip button (icon + label) ───────────────────────────────
function Skip({ direction, onPress }: { direction: 'back' | 'fwd'; onPress: () => void }) {
    return (
        <Pressable
            onPress={onPress}
            hitSlop={{ top: 14, bottom: 14, left: 10, right: 10 }}
            style={({ pressed }) => ({
                alignItems: 'center', gap: 5,
                opacity: pressed ? 0.5 : 1,
                transform: [{ scale: pressed ? 0.86 : 1 }],
            })}
        >
            {direction === 'back'
                ? <IcoBack size={36} color="#fff" />
                : <IcoFwd  size={36} color="#fff" />
            }
            <Text style={{
                fontFamily: typography.fontFamily.semibold,
                fontSize: 11,
                color: W60,
                letterSpacing: 0.2,
            }}>
                10 sec
            </Text>
        </Pressable>
    )
}

// ─── Speed pill ───────────────────────────────────────────────
function SpeedPill({ vitesse, onPress }: { vitesse: number; onPress: () => void }) {
    const active = vitesse !== 1
    return (
        <Pressable
            onPress={onPress}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{ width: 56, alignItems: 'center' }}
        >
            <View style={{
                paddingHorizontal: 10, paddingVertical: 6,
                borderRadius: radius.full,
                backgroundColor: active ? OR_DIM : W06,
                borderWidth: 1,
                borderColor: active ? colors.or : W30,
            }}>
                <Text style={{
                    fontFamily: typography.fontFamily.bold,
                    fontSize: 13,
                    color: active ? colors.or : W80,
                    letterSpacing: 0.2,
                }}>
                    ×{fmtVitesse(vitesse)}
                </Text>
            </View>
        </Pressable>
    )
}

// ─── Sleep button ─────────────────────────────────────────────
function SleepBtn({ actif, restant, onPress }: { actif: boolean; restant: number; onPress: () => void }) {
    return (
        <Pressable
            onPress={onPress}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={{ width: 56, alignItems: 'center' }}
        >
            {actif ? (
                <View style={{ alignItems: 'center', gap: 3 }}>
                    <Moon size={22} color={colors.or} strokeWidth={2} fill={colors.or} />
                    <Text style={{
                        fontFamily: typography.fontFamily.semibold,
                        fontSize: 10, color: colors.or, fontVariant: ['tabular-nums'],
                    }}>
                        {fmt(restant)}
                    </Text>
                </View>
            ) : (
                <Moon size={24} color={W60} strokeWidth={2} />
            )}
        </Pressable>
    )
}

// ─── Tab bar button ───────────────────────────────────────────
function TabBtn({ label, active, children, onPress }: {
    label: string; active: boolean; children: React.ReactNode; onPress: () => void
}) {
    return (
        <Pressable
            onPress={onPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ alignItems: 'center', gap: 4, flex: 1 }}
        >
            {children}
            <Text style={{
                fontFamily: typography.fontFamily.medium,
                fontSize: typography.size.xs,
                color: active ? colors.or : W30,
            }}>
                {label}
            </Text>
        </Pressable>
    )
}

// ─── Main ─────────────────────────────────────────────────────
export default function LecteurPleinEcran() {
    const {
        piste, enLecture, tempsActuel, dureeTotal,
        vitesse, volume, pause, reprendre, seeker, avancer, reculer,
        changerVitesse, changerVolume, file, lecteurOuvert, setLecteurOuvert,
    } = useAudio()

    const [panel, setPanel]           = useState<'none' | 'description' | 'chapters' | 'queue'>('none')
    const [showSleep, setShowSleep]   = useState(false)
    const [sleepMin, setSleepMin]     = useState(0)
    const [sleepLeft, setSleepLeft]   = useState(0)
    const sleepRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const [markers, setMarkers]       = useState<{ id: string; titre: string; temps_secondes: number }[]>([])
    const [desc, setDesc]             = useState<string | null>(null)

    const translateY = useSharedValue(SCREEN_H)

    useEffect(() => {
        translateY.value = lecteurOuvert
            ? withSpring(0, { damping: 22, stiffness: 200, mass: 0.7 })
            : SCREEN_H
    }, [lecteurOuvert])

    const dismissGesture = Gesture.Pan()
        .activeOffsetY([0, 8])
        .failOffsetX([-22, 22])
        .onUpdate(e => { if (e.translationY > 0) translateY.value = e.translationY })
        .onEnd(e => {
            if (e.translationY > SCREEN_H * 0.18 || e.velocityY > 600) {
                translateY.value = withTiming(SCREEN_H, { duration: 260 }, () => {
                    runOnJS(setLecteurOuvert)(false)
                })
            } else {
                translateY.value = withSpring(0, { damping: 22, stiffness: 200 })
            }
        })

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }))

    // Sleep timer
    useEffect(() => {
        if (sleepRef.current) clearInterval(sleepRef.current)
        if (sleepMin > 0) {
            let r = sleepMin * 60
            setSleepLeft(r)
            sleepRef.current = setInterval(() => {
                r -= 1
                setSleepLeft(r)
                if (r <= 0) { pause(); setSleepMin(0); clearInterval(sleepRef.current!) }
            }, 1000)
        } else {
            setSleepLeft(0)
        }
        return () => { if (sleepRef.current) clearInterval(sleepRef.current) }
    }, [sleepMin])

    // Load metadata
    useEffect(() => {
        if (!piste) return
        setMarkers([])
        setDesc(null)
        setPanel('none')

        supabase.from('markers').select('id, titre, temps_secondes')
            .eq('episode_id', piste.id).order('temps_secondes')
            .then(({ data }) => { if (data) setMarkers(data) })

        supabase.from('episodes').select('description')
            .eq('id', piste.id).single()
            .then(({ data }) => { if (data?.description) setDesc(data.description) })
    }, [piste?.id])

    if (!piste) return null

    const cyclerVitesse = () => {
        Haptics.selectionAsync()
        const i = VITESSES.indexOf(vitesse)
        changerVitesse(VITESSES[(i + 1) % VITESSES.length])
    }

    const togglePlay = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        enLecture ? pause() : reprendre()
    }

    const skip = (fn: (s: number) => void) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        fn(10)
    }

    const panelOpen = panel !== 'none'
    const isQueue = panel === 'queue'

    return (
        <Animated.View style={[{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999,
        }, animStyle]}>
            <GestureDetector gesture={dismissGesture}>
                <View style={{ flex: 1 }}>
                    {/* ── Background ── */}
                    <LinearGradient
                        colors={[BG_TOP, BG_MID, BG_BOT]}
                        locations={[0, 0.5, 1]}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    />
                    {/* Fog blobs — large circles far off-screen give a soft edge = "smoke" */}
                    <View style={{ position: 'absolute', width: 700, height: 700, borderRadius: 350, backgroundColor: 'rgba(50,100,180,0.13)', top: -280, left: -200 }} />
                    <View style={{ position: 'absolute', width: 600, height: 600, borderRadius: 300, backgroundColor: 'rgba(30,70,140,0.10)', top: 250, right: -220 }} />
                    <View style={{ position: 'absolute', width: 500, height: 500, borderRadius: 250, backgroundColor: 'rgba(20,55,110,0.14)', bottom: -180, left: -150 }} />
                    <View style={{ position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(60,110,190,0.08)', bottom: 200, right: -80 }} />

                    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
                        <StatusBar barStyle="light-content" />

                        {/* ── Drag handle ── */}
                        <View style={{ alignItems: 'center', paddingTop: spacing.xs, paddingBottom: spacing.md }}>
                            <View style={{ width: 38, height: 5, borderRadius: 3, backgroundColor: W30 }} />
                        </View>

                        {/* ── Player or Queue ── */}
                        {!isQueue ? (
                            <View style={{ flex: 1, paddingHorizontal: spacing.xl }}>

                                {/* Artwork zone — always mounted */}
                                <View style={{
                                    flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 0,
                                }}>
                                    {/* Artwork: position:absolute when panel open so it stays mounted */}
                                    <Artwork enLecture={enLecture} hidden={panelOpen} />

                                    {/* Panel content on top */}
                                    {panelOpen && (
                                        <ScrollView
                                            style={{ alignSelf: 'stretch' }}
                                            showsVerticalScrollIndicator={false}
                                            contentContainerStyle={{ paddingVertical: spacing.sm }}
                                        >
                                            <View style={{
                                                backgroundColor: W06,
                                                borderRadius: radius.xl,
                                                borderWidth: 1,
                                                borderColor: W12,
                                                overflow: 'hidden',
                                            }}>
                                                {panel === 'description' && (
                                                    <View style={{ padding: spacing.lg }}>
                                                        <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.sm, color: colors.or, marginBottom: spacing.sm }}>
                                                            Description
                                                        </Text>
                                                        <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.md, color: desc ? W80 : W60, lineHeight: 23 }}>
                                                            {desc ?? 'Aucune description disponible'}
                                                        </Text>
                                                    </View>
                                                )}
                                                {panel === 'chapters' && (
                                                    markers.length === 0 ? (
                                                        <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                                                            <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.base, color: W60 }}>
                                                                Aucun chapitre
                                                            </Text>
                                                        </View>
                                                    ) : markers.map((m, i) => {
                                                        const actif = tempsActuel >= m.temps_secondes &&
                                                            (i === markers.length - 1 || tempsActuel < markers[i + 1].temps_secondes)
                                                        return (
                                                            <Pressable
                                                                key={m.id}
                                                                onPress={() => seeker((m.temps_secondes / dureeTotal) * 100)}
                                                                style={{
                                                                    flexDirection: 'row', alignItems: 'center',
                                                                    gap: spacing.md,
                                                                    paddingHorizontal: spacing.lg,
                                                                    paddingVertical: spacing.md,
                                                                    backgroundColor: actif ? 'rgba(217,172,42,0.12)' : 'transparent',
                                                                    borderBottomWidth: i < markers.length - 1 ? 1 : 0,
                                                                    borderBottomColor: W06,
                                                                }}
                                                            >
                                                                <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.xs, color: actif ? colors.or : W30, minWidth: 44, fontVariant: ['tabular-nums'] }}>
                                                                    {fmt(m.temps_secondes)}
                                                                </Text>
                                                                <Text style={{ flex: 1, fontFamily: actif ? typography.fontFamily.semibold : typography.fontFamily.regular, fontSize: typography.size.md, color: actif ? colors.or : W80 }}>
                                                                    {m.titre}
                                                                </Text>
                                                            </Pressable>
                                                        )
                                                    })
                                                )}
                                            </View>
                                        </ScrollView>
                                    )}
                                </View>

                                {/* Title + Sheikh */}
                                <View style={{ marginTop: spacing.lg, marginBottom: spacing.sm }}>
                                    <TextTicker
                                        style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xl, color: '#fff', lineHeight: 28 }}
                                        loop bounce={false} repeatSpacer={60} marqueeDelay={2500} scrollSpeed={18}
                                    >
                                        {piste.titre}
                                    </TextTicker>
                                    <Text numberOfLines={1} style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.md, color: W60, marginTop: 4 }}>
                                        {piste.sheikh}
                                    </Text>
                                </View>

                                {/* Progress */}
                                <Progress tempsActuel={tempsActuel} dureeTotal={dureeTotal} onSeek={seeker} />

                                {/* Controls */}
                                <View style={{
                                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                                    marginTop: spacing.lg, marginBottom: spacing.md,
                                }}>
                                    <SpeedPill vitesse={vitesse} onPress={cyclerVitesse} />
                                    <Skip direction="back" onPress={() => skip(reculer)} />
                                    <BoutonPlay enLecture={enLecture} onPress={togglePlay} />
                                    <Skip direction="fwd" onPress={() => skip(avancer)} />
                                    <SleepBtn
                                        actif={sleepMin > 0}
                                        restant={sleepLeft}
                                        onPress={() => { Haptics.selectionAsync(); setShowSleep(p => !p) }}
                                    />
                                </View>

                                {/* Volume */}
                                <Volume volume={volume} onChange={changerVolume} />

                                {/* Sleep panel */}
                                {showSleep && (
                                    <View style={{
                                        backgroundColor: W06, borderRadius: radius.xl,
                                        padding: spacing.md, marginTop: spacing.md,
                                        borderWidth: 1, borderColor: W12,
                                    }}>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' }}>
                                            {SLEEP_OPTS.map(opt => (
                                                <Pressable
                                                    key={opt.minutes}
                                                    onPress={() => { Haptics.selectionAsync(); setSleepMin(opt.minutes); setShowSleep(false) }}
                                                    style={{
                                                        paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
                                                        borderRadius: radius.full,
                                                        backgroundColor: sleepMin === opt.minutes ? OR_DIM : 'transparent',
                                                        borderWidth: 1,
                                                        borderColor: sleepMin === opt.minutes ? colors.or : W30,
                                                    }}
                                                >
                                                    <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.sm, color: sleepMin === opt.minutes ? colors.or : W80 }}>
                                                        {opt.label}
                                                    </Text>
                                                </Pressable>
                                            ))}
                                        </View>
                                    </View>
                                )}

                            </View>
                        ) : (
                            /* ── Queue ── */
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                style={{ flex: 1 }}
                                contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg }}
                            >
                                <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, letterSpacing: 1.5, color: colors.or, textTransform: 'uppercase', marginBottom: spacing.sm }}>
                                    En cours
                                </Text>

                                <View style={{ backgroundColor: W06, borderRadius: radius.lg, padding: spacing.md, flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl, borderWidth: 1, borderColor: W12 }}>
                                    <View style={{ width: 36, height: 36, borderRadius: radius.full, backgroundColor: colors.or, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md }}>
                                        {enLecture
                                            ? <View style={{ flexDirection: 'row', gap: 3, alignItems: 'flex-end', height: 16 }}>
                                                <View style={{ width: 3, height: 10, backgroundColor: BG_MID, borderRadius: 2 }} />
                                                <View style={{ width: 3, height: 16, backgroundColor: BG_MID, borderRadius: 2 }} />
                                                <View style={{ width: 3, height: 12, backgroundColor: BG_MID, borderRadius: 2 }} />
                                              </View>
                                            : <IcoPlay size={16} color={BG_MID} />
                                        }
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text numberOfLines={1} style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base, color: '#fff' }}>{piste.titre}</Text>
                                        <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: W60, marginTop: 2 }}>{piste.sheikh}</Text>
                                    </View>
                                </View>

                                {file.length > 0 && (
                                    <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, letterSpacing: 1.5, color: colors.or, textTransform: 'uppercase', marginBottom: spacing.sm }}>
                                        Suivants ({file.length})
                                    </Text>
                                )}

                                {file.length === 0
                                    ? <View style={{ alignItems: 'center', paddingVertical: spacing['2xl'] }}>
                                        <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.base, color: W60, textAlign: 'center' }}>
                                            Aucun épisode dans la file
                                        </Text>
                                      </View>
                                    : file.map((p, i) => (
                                        <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: i < file.length - 1 ? 1 : 0, borderBottomColor: W06 }}>
                                            <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.sm, color: W30, width: 28, fontVariant: ['tabular-nums'] }}>{i + 1}</Text>
                                            <View style={{ flex: 1 }}>
                                                <Text numberOfLines={1} style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.base, color: W80 }}>{p.titre}</Text>
                                                <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: W60, marginTop: 2 }}>{p.sheikh}</Text>
                                            </View>
                                        </View>
                                    ))
                                }
                            </ScrollView>
                        )}

                        {/* ── Bottom tab bar ── */}
                        <View style={{
                            flexDirection: 'row', alignItems: 'center',
                            paddingHorizontal: spacing.xl,
                            paddingTop: spacing.md, paddingBottom: spacing.sm,
                            borderTopWidth: 1, borderTopColor: W06,
                        }}>
                            <TabBtn
                                label="Description"
                                active={panel === 'description'}
                                onPress={() => { Haptics.selectionAsync(); setPanel(p => p === 'description' ? 'none' : 'description') }}
                            >
                                <IcoInfo size={22} color={panel === 'description' ? colors.or : W30} />
                            </TabBtn>

                            <TabBtn
                                label="Chapitres"
                                active={panel === 'chapters'}
                                onPress={() => { Haptics.selectionAsync(); setPanel(p => p === 'chapters' ? 'none' : 'chapters') }}
                            >
                                <IcoChapters size={22} color={panel === 'chapters' ? colors.or : W30} />
                            </TabBtn>

                            <TabBtn
                                label="File"
                                active={panel === 'queue'}
                                onPress={() => { Haptics.selectionAsync(); setPanel(p => p === 'queue' ? 'none' : 'queue') }}
                            >
                                <IcoQueue size={22} color={panel === 'queue' ? colors.or : W30} />
                            </TabBtn>
                        </View>
                    </SafeAreaView>
                </View>
            </GestureDetector>
        </Animated.View>
    )
}

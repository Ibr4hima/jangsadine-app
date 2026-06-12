import { colors, radius, spacing, typography } from '@/constants/theme'
import { useAudio } from '@/contexts/AudioContext'
import { supabase } from '@/lib/supabase'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { Moon } from 'lucide-react-native'
import { ReactNode, useEffect, useRef, useState } from 'react'
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
    interpolateColor,
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

// ─── palette : bleu du logo (#2d578c) ─────────────────────────
const BG_TOP  = '#3d6ba3'
const BG_MID  = '#2d578c'
const BG_BOT  = '#1c3d66'
const W85     = 'rgba(255,255,255,0.85)'
const W60     = 'rgba(255,255,255,0.60)'
const W35     = 'rgba(255,255,255,0.35)'
const W15     = 'rgba(255,255,255,0.15)'
const W08     = 'rgba(255,255,255,0.08)'
const OR_DIM  = 'rgba(214,173,58,0.22)'

// ─── icons ────────────────────────────────────────────────────
function IcoBack({ size = 36, color = '#fff' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M339.5-108.5q-65.5-28.5-114-77t-77-114Q120-365 120-440h80q0 117 81.5 198.5T480-160q117 0 198.5-81.5T760-440q0-117-81.5-198.5T480-720h-6l62 62-56 58-160-160 160-160 56 58-62 62h6q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-440q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-80q-75 0-140.5-28.5ZM360-320v-180h-60v-60h120v240h-60Zm140 0q-17 0-28.5-11.5T460-360v-160q0-17 11.5-28.5T500-560h80q17 0 28.5 11.5T620-520v160q0 17-11.5 28.5T580-320h-80Zm20-60h40v-120h-40v120Z" fill={color} />
        </Svg>
    )
}
function IcoFwd({ size = 36, color = '#fff' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M360-320v-180h-60v-60h120v240h-60Zm140 0q-17 0-28.5-11.5T460-360v-160q0-17 11.5-28.5T500-560h80q17 0 28.5 11.5T620-520v160q0 17-11.5 28.5T580-320h-80Zm20-60h40v-120h-40v120ZM339.5-108.5q-65.5-28.5-114-77t-77-114Q120-365 120-440t28.5-140.5q28.5-65.5 77-114t114-77Q405-800 480-800h6l-62-62 56-58 160 160-160 160-56-58 62-62h-6q-117 0-198.5 81.5T200-440q0 117 81.5 198.5T480-160q117 0 198.5-81.5T760-440h80q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-80q-75 0-140.5-28.5Z" fill={color} />
        </Svg>
    )
}
function IcoPlay({ size = 36, color = BG_MID }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M320-200v-560l440 280-440 280Z" fill={color} />
        </Svg>
    )
}
function IcoPause({ size = 36, color = BG_MID }: { size?: number; color?: string }) {
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

function IcoVolumeMute({ size = 22, color = '#fff' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M792-56 671-177q-25 16-53 27.5T560-131v-82q14-5 27.5-10t25.5-12L480-368v208L280-360H120v-240h128L56-792l56-56 736 736-56 56Zm-8-232-58-58q17-31 25.5-65t8.5-70q0-94-55-168T560-749v-82q124 28 202 125.5T840-500q0 53-14.5 102T784-288ZM650-422l-90-90v-130q47 22 73.5 66t26.5 96q0 15-2.5 29.5T650-422ZM480-592 376-696l104-104v208Zm-80 238v-94l-72-72H200v80h114l86 86Zm-36-130Z" fill={color} />
        </Svg>
    )
}
function IcoVolumeUp({ size = 22, color = '#fff' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M560-131v-82q90-26 145-100t55-187q0-113-55-187T560-787v-82q124 28 202 125.5T840-500q0 127-78 224.5T560-131ZM120-360v-240h160l200-280v800L280-360H120Zm440 40v-362q47 22 73.5 66t26.5 96q0 51-26.5 94.5T560-320ZM400-606l-86 86H200v80h114l86 86v-252Zm-36 126Z" fill={color} />
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

function clamp01(v: number) {
    'worklet'
    return Math.max(0, Math.min(1, v))
}

// ─── Artwork (always mounted) ─────────────────────────────────
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
                borderRadius: 24,
                backgroundColor: '#fff',
                alignItems: 'center', justifyContent: 'center',
                shadowColor: '#0A1B30',
                shadowOffset: { width: 0, height: 26 },
                shadowOpacity: 0.5,
                shadowRadius: 40,
                elevation: 24,
            }, style]}>
                <Image
                    source={require('../assets/images/logo.png')}
                    style={{ width: ART_SIZE * 0.63, height: ART_SIZE * 0.63 }}
                    resizeMode="contain"
                />
            </Animated.View>
        </View>
    )
}

// ─── Progress bar — 100% UI thread while scrubbing ────────────
// Shared values drive the fill, height, thumb and floating time
// bubble directly on the UI thread; React state is only used for
// the small time labels.
function Progress({ tempsActuel, dureeTotal, onSeek }: {
    tempsActuel: number; dureeTotal: number; onSeek: (pct: number) => void
}) {
    const barW      = useSharedValue(W - spacing.xl * 2)
    const prog      = useSharedValue(dureeTotal > 0 ? tempsActuel / dureeTotal : 0)
    const scrub     = useSharedValue(0)
    const scrubbing = useSharedValue(0)
    const [scrubLabel, setScrubLabel] = useState<number | null>(null)
    const isScrubbing = scrubLabel !== null

    useEffect(() => {
        if (isScrubbing) return
        const p = dureeTotal > 0 ? tempsActuel / dureeTotal : 0
        // Glide between the 500ms status ticks → continuous motion
        prog.value = withTiming(p, { duration: 480 })
    }, [tempsActuel, dureeTotal, isScrubbing])

    const finDeSeek = (v: number) => {
        onSeek(v * 100)
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }

    const gesture = Gesture.Pan()
        .minDistance(0)
        .onBegin(e => {
            scrubbing.value = withTiming(1, { duration: 130 })
            scrub.value = clamp01(e.x / barW.value)
            runOnJS(setScrubLabel)(scrub.value)
        })
        .onUpdate(e => {
            scrub.value = clamp01(e.x / barW.value)
            runOnJS(setScrubLabel)(scrub.value)
        })
        .onEnd(() => {
            prog.value = scrub.value
            runOnJS(finDeSeek)(scrub.value)
        })
        .onFinalize(() => {
            scrubbing.value = withTiming(0, { duration: 180 })
            runOnJS(setScrubLabel)(null)
        })

    const trackStyle = useAnimatedStyle(() => {
        const h = 6 + scrubbing.value * 8
        return { height: h, borderRadius: h / 2 }
    })

    const fillStyle = useAnimatedStyle(() => {
        const p = scrubbing.value * scrub.value + (1 - scrubbing.value) * prog.value
        return {
            width: p * barW.value,
            backgroundColor: interpolateColor(scrubbing.value, [0, 1], [W85, colors.or]),
        }
    })

    const thumbStyle = useAnimatedStyle(() => {
        const p = scrubbing.value * scrub.value + (1 - scrubbing.value) * prog.value
        return {
            opacity: scrubbing.value,
            transform: [
                { translateX: p * barW.value - 9 },
                { scale: 0.4 + scrubbing.value * 0.6 },
            ],
        }
    })

    const bubbleStyle = useAnimatedStyle(() => {
        const x = scrub.value * barW.value
        return {
            opacity: scrubbing.value,
            transform: [
                { translateX: Math.max(0, Math.min(x - 34, barW.value - 68)) },
                { translateY: -6 + scrubbing.value * 6 },
            ],
        }
    })

    const tDisplay = isScrubbing && dureeTotal > 0 ? scrubLabel! * dureeTotal : tempsActuel
    const restant  = Math.max(0, dureeTotal - tDisplay)

    return (
        <View>
            {/* floating time bubble */}
            <View style={{ height: 34 }}>
                <Animated.View style={[{
                    position: 'absolute', bottom: 2,
                    width: 68, paddingVertical: 4,
                    borderRadius: radius.full,
                    backgroundColor: colors.or,
                    alignItems: 'center',
                    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
                }, bubbleStyle]}>
                    <Text style={{
                        fontFamily: typography.fontFamily.bold,
                        fontSize: 13, color: BG_BOT,
                        fontVariant: ['tabular-nums'],
                    }}>
                        {fmt(tDisplay)}
                    </Text>
                </Animated.View>
            </View>

            <GestureDetector gesture={gesture}>
                <View
                    onLayout={e => { barW.value = e.nativeEvent.layout.width }}
                    style={{ height: 36, justifyContent: 'center' }}
                >
                    <Animated.View style={[{ backgroundColor: W15, overflow: 'hidden' }, trackStyle]}>
                        <Animated.View style={[{ height: '100%', borderRadius: 8 }, fillStyle]} />
                    </Animated.View>
                    <Animated.View style={[{
                        position: 'absolute',
                        width: 18, height: 18, borderRadius: 9,
                        backgroundColor: colors.or,
                        borderWidth: 2.5, borderColor: '#fff',
                        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.35, shadowRadius: 5,
                    }, thumbStyle]} />
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

// ─── Volume bar — 100% UI thread while dragging ───────────────
function VolumeBar({ volume, onChange }: { volume: number; onChange: (v: number) => void }) {
    const barW      = useSharedValue(W - spacing.xl * 2 - 72)
    const vol       = useSharedValue(volume)
    const scrubbing = useSharedValue(0)
    const isDragging = useRef(false)
    const lastChange = useRef(0)

    useEffect(() => {
        if (!isDragging.current) vol.value = volume
    }, [volume])

    const setDragging = (v: boolean) => { isDragging.current = v }
    const hapticLight = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const sendThrottled = (v: number) => {
        const now = Date.now()
        if (now - lastChange.current > 50) { lastChange.current = now; onChange(v) }
    }

    const gesture = Gesture.Pan()
        .minDistance(0)
        .onBegin(e => {
            scrubbing.value = withTiming(1, { duration: 130 })
            const v = clamp01(e.x / barW.value)
            vol.value = v
            runOnJS(setDragging)(true)
            runOnJS(onChange)(v)
        })
        .onUpdate(e => {
            const v = clamp01(e.x / barW.value)
            vol.value = v
            runOnJS(sendThrottled)(v)
        })
        .onEnd(e => {
            const v = clamp01(e.x / barW.value)
            vol.value = v
            runOnJS(onChange)(v)
            runOnJS(hapticLight)()
        })
        .onFinalize(() => {
            scrubbing.value = withTiming(0, { duration: 180 })
            runOnJS(setDragging)(false)
        })

    const trackStyle = useAnimatedStyle(() => {
        const h = 4 + scrubbing.value * 6
        return { height: h, borderRadius: h / 2 }
    })

    const fillStyle = useAnimatedStyle(() => ({
        width: vol.value * barW.value,
        backgroundColor: interpolateColor(scrubbing.value, [0, 1], ['rgba(255,255,255,0.7)', colors.or]),
    }))

    const thumbStyle = useAnimatedStyle(() => ({
        opacity: scrubbing.value,
        transform: [
            { translateX: vol.value * barW.value - 9 },
            { scale: 0.4 + scrubbing.value * 0.6 },
        ],
    }))

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <IcoVolumeMute size={20} color={W60} />
            <GestureDetector gesture={gesture}>
                <View
                    onLayout={e => { barW.value = e.nativeEvent.layout.width }}
                    style={{ flex: 1, height: 36, justifyContent: 'center' }}
                >
                    <Animated.View style={[{ backgroundColor: W15, overflow: 'hidden' }, trackStyle]}>
                        <Animated.View style={[{ height: '100%', borderRadius: 8 }, fillStyle]} />
                    </Animated.View>
                    <Animated.View style={[{
                        position: 'absolute',
                        width: 18, height: 18, borderRadius: 9,
                        backgroundColor: colors.or,
                        borderWidth: 2.5, borderColor: '#fff',
                        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.35, shadowRadius: 5,
                    }, thumbStyle]} />
                </View>
            </GestureDetector>
            <IcoVolumeUp size={20} color={W60} />
        </View>
    )
}

// ─── Play / Pause with pulsing glow ───────────────────────────
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
        opacity: glow.value * 0.20,
        transform: [{ scale: 1 + glow.value * 0.14 }],
    }))

    return (
        <Pressable
            onPress={onPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.90 : 1 }] })}
        >
            <View style={{ alignItems: 'center', justifyContent: 'center', width: 90, height: 90 }}>
                <Animated.View style={[{
                    position: 'absolute',
                    width: 90, height: 90, borderRadius: 45,
                    backgroundColor: '#fff',
                }, ringStyle]} />
                <View style={{
                    width: 82, height: 82, borderRadius: 41,
                    backgroundColor: '#fff',
                    alignItems: 'center', justifyContent: 'center',
                    shadowColor: '#fff',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 16,
                    elevation: 12,
                }}>
                    {enLecture
                        ? <IcoPause size={36} color={BG_MID} />
                        : <IcoPlay  size={36} color={BG_MID} />
                    }
                </View>
            </View>
        </Pressable>
    )
}

// ─── Tab bar button ───────────────────────────────────────────
function TabBtn({ label, active, children, onPress }: {
    label: string; active: boolean; children: ReactNode; onPress: () => void
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
                color: active ? colors.or : W35,
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

    const [panel, setPanel]         = useState<'none' | 'description' | 'chapters' | 'queue'>('none')
    const [showSleep, setShowSleep] = useState(false)
    const [sleepMin, setSleepMin]   = useState(0)
    const [sleepLeft, setSleepLeft] = useState(0)
    const sleepRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const [markers, setMarkers]     = useState<{ id: string; titre: string; temps_secondes: number }[]>([])
    const [desc, setDesc]           = useState<string | null>(null)

    const translateY = useSharedValue(SCREEN_H)

    useEffect(() => {
        translateY.value = lecteurOuvert
            ? withSpring(0, { damping: 22, stiffness: 200, mass: 0.7 })
            : SCREEN_H
    }, [lecteurOuvert])

    const finDeDrag = (ty: number, vy: number) => {
        'worklet'
        if (ty > SCREEN_H * 0.15 || vy > 500) {
            translateY.value = withTiming(SCREEN_H, { duration: 240 }, () => {
                runOnJS(setLecteurOuvert)(false)
            })
        } else {
            translateY.value = withSpring(0, { damping: 22, stiffness: 200 })
        }
    }

    const isQueue = panel === 'queue'

    // Full-screen drag-down to dismiss (disabled on queue so its
    // ScrollView keeps scrolling normally — use the handle there)
    const dismissGesture = Gesture.Pan()
        .enabled(!isQueue)
        .activeOffsetY(12)
        .failOffsetX([-18, 18])
        .onUpdate(e => { if (e.translationY > 0) translateY.value = e.translationY })
        .onEnd(e => finDeDrag(e.translationY, e.velocityY))

    // Handle zone always drags, instantly, even on the queue
    const handleGesture = Gesture.Pan()
        .minDistance(0)
        .onUpdate(e => { translateY.value = Math.max(0, e.translationY) })
        .onEnd(e => finDeDrag(e.translationY, e.velocityY))

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

    // Metadata
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

    // Le champ sheikh peut contenir le titre arabe du livre : on le rend
    // alors avec la police arabe de l'app
    const sousTitreArabe = /[؀-ۿ]/.test(piste.sheikh)

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

    const panelOpen = panel === 'description' || panel === 'chapters'

    return (
        <Animated.View style={[{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999,
        }, animStyle]}>
            <GestureDetector gesture={dismissGesture}>
                <View style={{ flex: 1 }}>
                    {/* ── Background : bleu logo + brume ── */}
                    <LinearGradient
                        colors={[BG_TOP, BG_MID, BG_BOT]}
                        locations={[0, 0.5, 1]}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    />
                    <View style={{ position: 'absolute', width: 700, height: 700, borderRadius: 350, backgroundColor: 'rgba(120,165,220,0.13)', top: -300, left: -220 }} />
                    <View style={{ position: 'absolute', width: 560, height: 560, borderRadius: 280, backgroundColor: 'rgba(90,140,200,0.11)', top: 280, right: -240 }} />
                    <View style={{ position: 'absolute', width: 520, height: 520, borderRadius: 260, backgroundColor: 'rgba(40,85,139,0.35)', bottom: -200, left: -160 }} />
                    <View style={{ position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(150,190,235,0.07)', bottom: 240, right: -100 }} />

                    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
                        <StatusBar barStyle="light-content" />

                        {/* ── Drag handle (always draggable) ── */}
                        <GestureDetector gesture={handleGesture}>
                            <View style={{ alignItems: 'center', paddingTop: spacing.xs, paddingBottom: spacing.md, alignSelf: 'stretch' }}>
                                <View style={{ width: 42, height: 5, borderRadius: 3, backgroundColor: W35 }} />
                            </View>
                        </GestureDetector>

                        {!isQueue ? (
                            <View style={{ flex: 1, paddingHorizontal: spacing.xl }}>

                                {/* Artwork / panel */}
                                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
                                    <Artwork enLecture={enLecture} hidden={panelOpen} />

                                    {panelOpen && (
                                        <ScrollView
                                            style={{ alignSelf: 'stretch' }}
                                            showsVerticalScrollIndicator={false}
                                            contentContainerStyle={{ paddingVertical: spacing.sm }}
                                        >
                                            <View style={{
                                                backgroundColor: W08,
                                                borderRadius: radius.xl,
                                                borderWidth: 1,
                                                borderColor: W15,
                                                overflow: 'hidden',
                                            }}>
                                                {panel === 'description' && (
                                                    <View style={{ padding: spacing.lg }}>
                                                        <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.sm, color: colors.or, marginBottom: spacing.sm }}>
                                                            Description
                                                        </Text>
                                                        <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.md, color: desc ? W85 : W60, lineHeight: 23 }}>
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
                                                                    backgroundColor: actif ? OR_DIM : 'transparent',
                                                                    borderBottomWidth: i < markers.length - 1 ? 1 : 0,
                                                                    borderBottomColor: W08,
                                                                }}
                                                            >
                                                                <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.xs, color: actif ? colors.or : W35, minWidth: 44, fontVariant: ['tabular-nums'] }}>
                                                                    {fmt(m.temps_secondes)}
                                                                </Text>
                                                                <Text style={{ flex: 1, fontFamily: actif ? typography.fontFamily.semibold : typography.fontFamily.regular, fontSize: typography.size.md, color: actif ? colors.or : W85 }}>
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
                                <View style={{ marginTop: spacing.lg, marginBottom: 2 }}>
                                    <TextTicker
                                        style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xl, color: '#fff', lineHeight: 28 }}
                                        loop bounce={false} repeatSpacer={60} marqueeDelay={2500} scrollSpeed={18}
                                    >
                                        {piste.titre}
                                    </TextTicker>
                                    <Text numberOfLines={1} style={{ fontFamily: sousTitreArabe ? typography.fontFamily.arabic : typography.fontFamily.regular, fontSize: typography.size.md, color: W60, marginTop: 4 }}>
                                        {piste.sheikh}
                                    </Text>
                                </View>

                                {/* Progress */}
                                <Progress tempsActuel={tempsActuel} dureeTotal={dureeTotal} onSeek={seeker} />

                                {/* Controls */}
                                <View style={{
                                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                                    marginTop: spacing.md, marginBottom: spacing.md,
                                }}>
                                    {/* speed pill */}
                                    <Pressable
                                        onPress={cyclerVitesse}
                                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                                        style={{ width: 56, alignItems: 'center' }}
                                    >
                                        <View style={{
                                            paddingHorizontal: 10, paddingVertical: 6,
                                            borderRadius: radius.full,
                                            backgroundColor: vitesse !== 1 ? OR_DIM : W08,
                                            borderWidth: 1,
                                            borderColor: vitesse !== 1 ? colors.or : W35,
                                        }}>
                                            <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: 13, color: vitesse !== 1 ? colors.or : W85 }}>
                                                ×{fmtVitesse(vitesse)}
                                            </Text>
                                        </View>
                                    </Pressable>

                                    <Pressable
                                        onPress={() => skip(reculer)}
                                        hitSlop={{ top: 16, bottom: 16, left: 12, right: 12 }}
                                        style={({ pressed }) => ({
                                            opacity: pressed ? 0.5 : 1,
                                            transform: [{ scale: pressed ? 0.86 : 1 }],
                                        })}
                                    >
                                        <IcoBack size={38} color="#fff" />
                                    </Pressable>

                                    <BoutonPlay enLecture={enLecture} onPress={togglePlay} />

                                    <Pressable
                                        onPress={() => skip(avancer)}
                                        hitSlop={{ top: 16, bottom: 16, left: 12, right: 12 }}
                                        style={({ pressed }) => ({
                                            opacity: pressed ? 0.5 : 1,
                                            transform: [{ scale: pressed ? 0.86 : 1 }],
                                        })}
                                    >
                                        <IcoFwd size={38} color="#fff" />
                                    </Pressable>

                                    {/* sleep */}
                                    <Pressable
                                        onPress={() => { Haptics.selectionAsync(); setShowSleep(p => !p) }}
                                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                                        style={{ width: 56, alignItems: 'center' }}
                                    >
                                        {sleepMin > 0 ? (
                                            <View style={{ alignItems: 'center', gap: 3 }}>
                                                <Moon size={22} color={colors.or} strokeWidth={2} fill={colors.or} />
                                                <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: 10, color: colors.or, fontVariant: ['tabular-nums'] }}>
                                                    {fmt(sleepLeft)}
                                                </Text>
                                            </View>
                                        ) : (
                                            <Moon size={24} color={W60} strokeWidth={2} />
                                        )}
                                    </Pressable>
                                </View>

                                {/* Volume */}
                                <VolumeBar volume={volume} onChange={changerVolume} />

                                {/* Sleep panel */}
                                {showSleep && (
                                    <View style={{
                                        backgroundColor: W08, borderRadius: radius.xl,
                                        padding: spacing.md, marginTop: spacing.md,
                                        borderWidth: 1, borderColor: W15,
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
                                                        borderColor: sleepMin === opt.minutes ? colors.or : W35,
                                                    }}
                                                >
                                                    <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.sm, color: sleepMin === opt.minutes ? colors.or : W85 }}>
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

                                <View style={{ backgroundColor: W08, borderRadius: radius.lg, padding: spacing.md, flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl, borderWidth: 1, borderColor: W15 }}>
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
                                        <Text style={{ fontFamily: sousTitreArabe ? typography.fontFamily.arabic : typography.fontFamily.regular, fontSize: typography.size.sm, color: W60, marginTop: 2 }}>{piste.sheikh}</Text>
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
                                        <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: i < file.length - 1 ? 1 : 0, borderBottomColor: W08 }}>
                                            <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.sm, color: W35, width: 28, fontVariant: ['tabular-nums'] }}>{i + 1}</Text>
                                            <View style={{ flex: 1 }}>
                                                <Text numberOfLines={1} style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.base, color: W85 }}>{p.titre}</Text>
                                                <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: W60, marginTop: 2 }}>{p.sheikh}</Text>
                                            </View>
                                        </View>
                                    ))
                                }
                            </ScrollView>
                        )}

                        {/* ── Bottom tabs ── */}
                        <View style={{
                            flexDirection: 'row', alignItems: 'center',
                            paddingHorizontal: spacing.xl,
                            paddingTop: spacing.md, paddingBottom: spacing.sm,
                            borderTopWidth: 1, borderTopColor: W08,
                        }}>
                            <TabBtn
                                label="Description"
                                active={panel === 'description'}
                                onPress={() => { Haptics.selectionAsync(); setPanel(p => p === 'description' ? 'none' : 'description') }}
                            >
                                <IcoInfo size={22} color={panel === 'description' ? colors.or : W35} />
                            </TabBtn>
                            <TabBtn
                                label="Chapitres"
                                active={panel === 'chapters'}
                                onPress={() => { Haptics.selectionAsync(); setPanel(p => p === 'chapters' ? 'none' : 'chapters') }}
                            >
                                <IcoChapters size={22} color={panel === 'chapters' ? colors.or : W35} />
                            </TabBtn>
                            <TabBtn
                                label="File"
                                active={isQueue}
                                onPress={() => { Haptics.selectionAsync(); setPanel(p => p === 'queue' ? 'none' : 'queue') }}
                            >
                                <IcoQueue size={22} color={isQueue ? colors.or : W35} />
                            </TabBtn>
                        </View>
                    </SafeAreaView>
                </View>
            </GestureDetector>
        </Animated.View>
    )
}

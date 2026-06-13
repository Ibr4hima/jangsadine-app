import { MiniEgaliseur } from '@/components/AudioUI'
import EditeurNote from '@/components/EditeurNote'
import { colors, radius, spacing, typography } from '@/constants/theme'
import { useAudio } from '@/contexts/AudioContext'
import type { Piste } from '@/contexts/AudioContext'
import { useTelechargement } from '@/contexts/TelechargementContext'
import { supabase } from '@/lib/supabase'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { ReactNode, useEffect, useRef, useState } from 'react'
import {
    Dimensions,
    Image,
    Pressable,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    View,
    ViewStyle,
} from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
    cancelAnimation,
    Easing,
    interpolateColor,
    runOnJS,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
    ZoomIn,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path, Circle as SvgCircle } from 'react-native-svg'
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
function IcoAddNotes({ size = 22, color = '#fff' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M700-120h40v-100h100v-40H740v-100h-40v100H600v40h100v100Zm20 80q-83 0-141.5-58.5T520-240q0-83 58.5-141.5T720-440q83 0 141.5 58.5T920-240q0 83-58.5 141.5T720-40ZM280-600h400v-80H280v80Zm187 480H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v268q-29-14-58.5-21t-61.5-7q-11 0-20.5.5T680-517v-3H280v80h245q-18 17-32.5 37T467-360H280v80h163q-2 10-2.5 19.5T440-240q0 33 6 61.5t21 58.5Z" fill={color} />
        </Svg>
    )
}
function IcoChapters({ size = 22, color = '#fff' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M120-80v-60h100v-30h-60v-60h60v-30H120v-60h160q17 0 28.5 11.5T320-280v40q0 17-11.5 28.5T280-200q17 0 28.5 11.5T320-160v40q0 17-11.5 28.5T280-80H120Zm0-280v-110q0-17 11.5-28.5T160-510h100v-30H120v-60h160q17 0 28.5 11.5T320-560v70q0 17-11.5 28.5T280-450h-100v30h140v60H120Zm60-280v-180h-60v-60h120v240h-60Zm180 440v-80h480v80H360Zm0-240v-80h480v80H360Zm0-240v-80h480v80H360Z" fill={color} />
        </Svg>
    )
}
function IcoQueue({ size = 22, color = '#fff' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M360-200v-80h480v80H360Zm0-240v-80h480v80H360Zm0-240v-80h480v80H360ZM200-160q-33 0-56.5-23.5T120-240q0-33 23.5-56.5T200-320q33 0 56.5 23.5T280-240q0 33-23.5 56.5T200-160Zm0-240q-33 0-56.5-23.5T120-480q0-33 23.5-56.5T200-560q33 0 56.5 23.5T280-480q0 33-23.5 56.5T200-400Zm0-240q-33 0-56.5-23.5T120-720q0-33 23.5-56.5T200-800q33 0 56.5 23.5T280-720q0 33-23.5 56.5T200-640Z" fill={color} />
        </Svg>
    )
}

function IcoDownload({ size = 24, color = '#fff' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z" fill={color} />
        </Svg>
    )
}
function IcoArrowDown({ size = 18, color = '#fff' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M480-240 240-480l56-56 144 144v-368h80v368l144-144 56 56-240 240Z" fill={color} />
        </Svg>
    )
}
function IcoCloudDone({ size = 24, color = '#fff' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M256-240q-97 0-166.5-63T20-458q0-88 56-153.5T224-688q20-97 92.5-154.5T490-900q109 0 189.5 70.5T771-650q79 16 129 75.5T950-442q0 86-61.5 144T740-240H490v-80h250q53 0 91.5-34.5T870-442q0-54-37.5-89T744-566l-5-1-21-2v-6q-17-99-84.5-165T490-806q-105 0-177 73.5T240-556v7l-7 2q-69 4-112 48T77-402q0 65 46.5 113.5T256-240h194v80H256Zm184-134L320-494l56-56 64 64 184-184 56 56-240 240Z" fill={color} />
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

// formateur de temps exécutable sur le thread UI
function fmtW(s: number) {
    'worklet'
    if (!s || isNaN(s) || s < 0) return '0:00'
    const h  = Math.floor(s / 3600)
    const m  = Math.floor((s % 3600) / 60)
    const sc = Math.floor(s % 60)
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n)
    if (h > 0) return h + ':' + pad(m) + ':' + pad(sc)
    return m + ':' + pad(sc)
}

// TextInput piloté par Reanimated : le temps défile sur le thread UI,
// sans aucun re-render React pendant le scrub
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

// ─── pressable à ressort (boutons de contrôle) ────────────────
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

function SpringTap({ onPress, children, style, hitSlop = 14, pressedScale = 0.86 }: {
    onPress: () => void
    children: ReactNode
    style?: ViewStyle
    hitSlop?: number
    pressedScale?: number
}) {
    const s = useSharedValue(1)
    const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }))
    return (
        <AnimatedPressable
            onPressIn={() => { s.value = withSpring(pressedScale, { damping: 16, stiffness: 480 }) }}
            onPressOut={() => { s.value = withSpring(1, { damping: 13, stiffness: 300 }) }}
            onPress={onPress}
            hitSlop={{ top: hitSlop, bottom: hitSlop, left: hitSlop, right: hitSlop }}
            style={[style, a]}
        >
            {children}
        </AnimatedPressable>
    )
}

// ─── Artwork (always mounted) ─────────────────────────────────
function Artwork({ enLecture, hidden }: { enLecture: boolean; hidden: boolean }) {
    const scale = useSharedValue(enLecture ? 1 : 0.78)
    const aura  = useSharedValue(0)

    useEffect(() => {
        scale.value = withSpring(enLecture ? 1 : 0.78, { damping: 14, stiffness: 140 })
        if (enLecture) {
            aura.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
                ), -1, true
            )
        } else {
            cancelAnimation(aura)
            aura.value = withTiming(0, { duration: 600 })
        }
    }, [enLecture])

    const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

    // halo doré qui respire derrière la pochette pendant la lecture
    const auraStyle = useAnimatedStyle(() => ({
        opacity: 0.05 + aura.value * 0.09,
        transform: [{ scale: (scale.value + 0.04) + aura.value * 0.05 }],
    }))

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
                position: 'absolute',
                width: ART_SIZE, height: ART_SIZE,
                borderRadius: 32,
                backgroundColor: colors.or,
            }, auraStyle]} />
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

// ─── Progress bar — 100 % UI thread ───────────────────────────
// Tout vit sur le thread UI : remplissage, hauteur, thumb, bulle
// flottante ET les libellés de temps (TextInput animés). Aucun
// re-render React pendant le scrub → fluidité parfaite.
function Progress({ tempsActuel, dureeTotal, onSeek, marks = [] }: {
    tempsActuel: number; dureeTotal: number; onSeek: (pct: number) => void
    // Positions des chapitres (fractions 0-1) : encoches sur la barre
    marks?: number[]
}) {
    const barW      = useSharedValue(W - spacing.xl * 2)
    const prog      = useSharedValue(dureeTotal > 0 ? tempsActuel / dureeTotal : 0)
    const scrub     = useSharedValue(0)
    const scrubbing = useSharedValue(0)   // 0→1 pendant le drag
    const tapping   = useSharedValue(0)   // 0→1→0 flash pendant le tap
    const tapPos    = useSharedValue(0)   // position du tap (0-1)
    const duree     = useSharedValue(dureeTotal)

    // Garde-fous côté JS : pas de lecture de shared values dans le
    // useEffect (peu fiable inter-threads) — un simple ref + deadline
    const dragJS     = useRef(false)
    const blockUntil = useRef(0)

    useEffect(() => { duree.value = dureeTotal }, [dureeTotal])

    useEffect(() => {
        // Bloque la progression pendant le drag et ~800 ms après un seek
        // (le temps que l'audio rapporte sa nouvelle position)
        if (dragJS.current || Date.now() < blockUntil.current) return
        prog.value = withTiming(
            dureeTotal > 0 ? tempsActuel / dureeTotal : 0,
            { duration: 480, easing: Easing.linear }
        )
    }, [tempsActuel, dureeTotal])

    const setDragJS = (v: boolean) => { dragJS.current = v }

    const finDeSeek = (v: number) => {
        blockUntil.current = Date.now() + 800
        onSeek(v * 100)
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }

    // ── tap : réponse VISUELLE dès le posé du doigt ──────────────
    // Le flash s'éteint TOUT SEUL (withSequence + withDelay) : aucune
    // dépendance aux callbacks de fin de geste, qui peuvent ne pas
    // être appelés si le geste est annulé par un geste parent.
    const tapGesture = Gesture.Tap()
        .onBegin(e => {
            tapPos.value = clamp01(e.x / barW.value)
            tapping.value = withSequence(
                withTiming(1, { duration: 50, easing: Easing.out(Easing.quad) }),
                withDelay(220, withTiming(0, { duration: 380, easing: Easing.out(Easing.cubic) }))
            )
        })
        .onEnd(e => {
            const p = clamp01(e.x / barW.value)
            tapPos.value = p
            prog.value = p
            runOnJS(finDeSeek)(p)
        })

    // ── pan : scrub fluide — n'active l'état visuel qu'après 4 px ─
    const panGesture = Gesture.Pan()
        .minDistance(4)
        .onBegin(e => {
            scrub.value = clamp01(e.x / barW.value)
        })
        .onStart(e => {
            scrubbing.value = withTiming(1, { duration: 100 })
            scrub.value = clamp01(e.x / barW.value)
            runOnJS(setDragJS)(true)
            runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light)
        })
        .onUpdate(e => {
            scrub.value = clamp01(e.x / barW.value)
        })
        .onEnd(() => {
            prog.value = scrub.value
            runOnJS(finDeSeek)(scrub.value)
        })
        .onFinalize(() => {
            scrubbing.value = withTiming(0, { duration: 180 })
            runOnJS(setDragJS)(false)
        })

    const gesture = Gesture.Race(tapGesture, panGesture)

    // Position effective : scrub > tap > prog selon l'état
    const pEff = (sv: number, sc: number, tv: number, tp: number, pv: number) => {
        'worklet'
        if (sv > 0) return sv * sc + (1 - sv) * pv
        if (tv > 0) return tv * tp + (1 - tv) * pv
        return pv
    }

    const trackStyle = useAnimatedStyle(() => {
        const h = 5 + scrubbing.value * 9
        return { height: h, borderRadius: h / 2 }
    })

    const fillStyle = useAnimatedStyle(() => {
        const p = pEff(scrubbing.value, scrub.value, tapping.value, tapPos.value, prog.value)
        const active = Math.max(scrubbing.value, tapping.value)
        return {
            width: p * barW.value,
            backgroundColor: interpolateColor(active, [0, 1], [W85, colors.or]),
        }
    })

    const thumbStyle = useAnimatedStyle(() => {
        const p = pEff(scrubbing.value, scrub.value, tapping.value, tapPos.value, prog.value)
        const active = Math.max(scrubbing.value, tapping.value)
        return {
            opacity: active,
            transform: [
                { translateX: p * barW.value - 11 },
                { scale: 0.3 + active * 0.7 },
            ],
        }
    })

    const bubbleStyle = useAnimatedStyle(() => {
        const x = (scrubbing.value > 0 ? scrub.value : tapPos.value) * barW.value
        const active = Math.max(scrubbing.value, tapping.value * 0.8)
        return {
            opacity: active,
            transform: [
                { translateX: Math.max(0, Math.min(x - 34, barW.value - 68)) },
                { translateY: -4 + active * 4 },
                { scale: 0.7 + active * 0.3 },
            ],
        }
    })

    // Temps 100 % UI thread — aucun re-render pendant scrub/tap
    const bubbleProps = useAnimatedProps(() => {
        const p = scrubbing.value > 0 ? scrub.value : tapPos.value
        return { text: fmtW(p * duree.value) } as any
    })
    const gaucheProps = useAnimatedProps(() => {
        const p = pEff(scrubbing.value, scrub.value, tapping.value, tapPos.value, prog.value)
        return { text: fmtW(p * duree.value) } as any
    })
    const droiteProps = useAnimatedProps(() => {
        const p = pEff(scrubbing.value, scrub.value, tapping.value, tapPos.value, prog.value)
        return { text: '-' + fmtW(Math.max(0, duree.value - p * duree.value)) } as any
    })
    const gaucheStyle = useAnimatedStyle(() => {
        const active = Math.max(scrubbing.value, tapping.value)
        return { color: interpolateColor(active, [0, 1], ['rgba(255,255,255,0.60)', colors.or]) }
    })

    return (
        <View>
            {/* bulle de temps flottante (déborde vers le haut pendant le
                scrub : la réserve est volontairement basse pour que la
                pill du chapitre reste proche de la barre) */}
            <View style={{ height: 16 }}>
                <Animated.View style={[{
                    position: 'absolute', bottom: 2,
                    width: 68, paddingVertical: 4,
                    borderRadius: radius.full,
                    backgroundColor: colors.or,
                    alignItems: 'center',
                    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
                }, bubbleStyle]}>
                    <AnimatedTextInput
                        editable={false}
                        defaultValue="0:00"
                        animatedProps={bubbleProps}
                        style={{
                            fontFamily: typography.fontFamily.bold,
                            fontSize: 13, color: BG_BOT,
                            fontVariant: ['tabular-nums'],
                            padding: 0, textAlign: 'center',
                        }}
                    />
                </Animated.View>
            </View>

            <GestureDetector gesture={gesture}>
                <View
                    onLayout={e => { barW.value = e.nativeEvent.layout.width }}
                    style={{ height: 36, justifyContent: 'center' }}
                >
                    <Animated.View style={[{ backgroundColor: W15, overflow: 'hidden' }, trackStyle]}>
                        <Animated.View style={[{ height: '100%', borderRadius: 8 }, fillStyle]} />
                        {/* Encoches des chapitres : petites coupures sur la barre */}
                        {marks.map((m, i) => (
                            <View
                                key={i}
                                style={{
                                    position: 'absolute',
                                    left: `${m * 100}%` as any,
                                    top: 0, bottom: 0, width: 2.5,
                                    backgroundColor: BG_BOT,
                                    opacity: 0.85,
                                }}
                            />
                        ))}
                    </Animated.View>
                    <Animated.View style={[{
                        position: 'absolute',
                        width: 22, height: 22, borderRadius: 11,
                        backgroundColor: colors.or,
                        borderWidth: 2.5, borderColor: '#fff',
                        shadowColor: colors.or,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.9,
                        shadowRadius: 8,
                        elevation: 8,
                    }, thumbStyle]} />
                </View>
            </GestureDetector>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -2 }}>
                <AnimatedTextInput
                    editable={false}
                    defaultValue="0:00"
                    animatedProps={gaucheProps}
                    style={[{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.xs, fontVariant: ['tabular-nums'], padding: 0 }, gaucheStyle]}
                />
                <AnimatedTextInput
                    editable={false}
                    defaultValue="-0:00"
                    animatedProps={droiteProps}
                    style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.xs, color: W60, fontVariant: ['tabular-nums'], padding: 0, textAlign: 'right' }}
                />
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

    // tap : réponse visuelle dès le posé du doigt
    const tapGesture = Gesture.Tap()
        .onBegin(e => {
            vol.value = withTiming(clamp01(e.x / barW.value), { duration: 60, easing: Easing.out(Easing.quad) })
        })
        .onEnd(e => {
            const v = clamp01(e.x / barW.value)
            vol.value = v
            runOnJS(onChange)(v)
            runOnJS(hapticLight)()
        })

    // pan : drag fluide — état visuel actif qu'après 4 px
    const panGesture = Gesture.Pan()
        .minDistance(4)
        .onStart(e => {
            scrubbing.value = withTiming(1, { duration: 100 })
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

    const gesture = Gesture.Race(tapGesture, panGesture)

    const trackStyle = useAnimatedStyle(() => {
        const h = 4 + scrubbing.value * 8
        return { height: h, borderRadius: h / 2 }
    })

    const fillStyle = useAnimatedStyle(() => ({
        width: vol.value * barW.value,
        backgroundColor: interpolateColor(scrubbing.value, [0, 1], ['rgba(255,255,255,0.7)', colors.or]),
    }))

    const thumbStyle = useAnimatedStyle(() => ({
        opacity: scrubbing.value,
        transform: [
            { translateX: vol.value * barW.value - 11 },
            { scale: 0.3 + scrubbing.value * 0.7 },
        ],
    }))

    // raccourcis : tap sur les icônes = muet / volume max, avec glisse animée
    const allerA = (v: number) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        vol.value = withTiming(v, { duration: 240, easing: Easing.out(Easing.cubic) })
        onChange(v)
    }

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <SpringTap onPress={() => allerA(0)} hitSlop={10} pressedScale={0.8}>
                <IcoVolumeMute size={20} color={W60} />
            </SpringTap>
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
                        width: 22, height: 22, borderRadius: 11,
                        backgroundColor: colors.or,
                        borderWidth: 2.5, borderColor: '#fff',
                        shadowColor: colors.or,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.9,
                        shadowRadius: 8,
                        elevation: 8,
                    }, thumbStyle]} />
                </View>
            </GestureDetector>
            <SpringTap onPress={() => allerA(1)} hitSlop={10} pressedScale={0.8}>
                <IcoVolumeUp size={20} color={W60} />
            </SpringTap>
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
        <SpringTap onPress={onPress} hitSlop={10} pressedScale={0.9}>
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
                    {/* zoom subtil au changement play ↔ pause */}
                    <Animated.View key={enLecture ? 'pause' : 'play'} entering={ZoomIn.duration(180)}>
                        {enLecture
                            ? <IcoPause size={36} color={BG_MID} />
                            : <IcoPlay  size={36} color={BG_MID} />
                        }
                    </Animated.View>
                </View>
            </View>
        </SpringTap>
    )
}

// ─── Bouton téléchargement (3 états) ─────────────────────────
// État 1 : non téléchargé — icône download W60
// État 2 : en cours — anneau de progression SVG + flèche qui rebondit
// État 3 : téléchargé — cloud_done doré avec entrée ZoomIn

const RING = 44
const RING_RADIUS = 17
const RING_CIRC = 2 * Math.PI * RING_RADIUS

function BoutonTelechargement({ piste }: { piste: Piste }) {
    const { estTelecharge, estEnCours, progressions, telecharger } = useTelechargement()

    const telecharge = estTelecharge(piste.id)
    const enCours    = estEnCours(piste.id)
    const progression = progressions[piste.id]?.progression ?? 0

    // Flèche : rebond vertical infini pendant le téléchargement
    const arrowY = useSharedValue(0)
    useEffect(() => {
        if (enCours) {
            arrowY.value = withRepeat(
                withSequence(
                    withTiming(-4, { duration: 400, easing: Easing.out(Easing.quad) }),
                    withTiming( 4, { duration: 500, easing: Easing.in(Easing.quad) }),
                ),
                -1, false
            )
        } else {
            cancelAnimation(arrowY)
            arrowY.value = withTiming(0, { duration: 200 })
        }
    }, [enCours])

    const arrowStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: arrowY.value }],
    }))

    // Halo doré qui pulse au téléchargement terminé
    const glow = useSharedValue(0)
    useEffect(() => {
        if (telecharge) {
            glow.value = withDelay(100, withRepeat(
                withSequence(
                    withTiming(1,   { duration: 1400, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0.2, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
                ), -1, true
            ))
        } else {
            cancelAnimation(glow)
            glow.value = withTiming(0, { duration: 300 })
        }
    }, [telecharge])

    const glowStyle = useAnimatedStyle(() => ({
        opacity: glow.value * 0.3,
        transform: [{ scale: 1 + glow.value * 0.18 }],
    }))

    const onPress = () => {
        if (telecharge || enCours) return
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        telecharger({
            id:          piste.id,
            titre:       piste.titre,
            sheikh:      piste.sheikh,
            coursId:     piste.programmeId ?? '',
            coursTitre:  piste.sheikh,
            url:         piste.url,
        })
    }

    const strokeOffset = RING_CIRC * (1 - progression / 100)

    return (
        <SpringTap
            onPress={onPress}
            hitSlop={12}
            pressedScale={0.86}
            style={{ width: 56, alignItems: 'center', justifyContent: 'center' }}
        >
            <View style={{ width: RING, height: RING, alignItems: 'center', justifyContent: 'center' }}>

                {/* Anneau de progression SVG — visible seulement en cours */}
                {enCours && (
                    <Svg
                        width={RING} height={RING}
                        style={{ position: 'absolute', top: 0, left: 0 }}
                    >
                        {/* Fond de la piste */}
                        <SvgCircle
                            cx={RING / 2} cy={RING / 2} r={RING_RADIUS}
                            fill="none"
                            stroke="rgba(255,255,255,0.14)"
                            strokeWidth={2.5}
                        />
                        {/* Arc de progression doré */}
                        <SvgCircle
                            cx={RING / 2} cy={RING / 2} r={RING_RADIUS}
                            fill="none"
                            stroke={colors.or}
                            strokeWidth={2.5}
                            strokeDasharray={`${RING_CIRC} ${RING_CIRC}`}
                            strokeDashoffset={strokeOffset}
                            strokeLinecap="round"
                            transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
                        />
                    </Svg>
                )}

                {/* Halo doré derrière l'icône cloud_done */}
                {telecharge && (
                    <Animated.View style={[{
                        position: 'absolute',
                        width: RING, height: RING, borderRadius: RING / 2,
                        backgroundColor: colors.or,
                    }, glowStyle]} />
                )}

                {/* Icône selon l'état */}
                {telecharge ? (
                    <Animated.View key="done" entering={ZoomIn.springify().damping(16)}>
                        <IcoCloudDone size={24} color={colors.or} />
                    </Animated.View>
                ) : enCours ? (
                    <Animated.View style={arrowStyle}>
                        <IcoArrowDown size={18} color="rgba(255,255,255,0.85)" />
                    </Animated.View>
                ) : (
                    <IcoDownload size={24} color={W60} />
                )}
            </View>
        </SpringTap>
    )
}

// ─── Main ─────────────────────────────────────────────────────
export default function LecteurPleinEcran() {
    const {
        piste, enLecture, tempsActuel, dureeTotal,
        vitesse, volume, pause, reprendre, seeker, avancer, reculer,
        changerVitesse, changerVolume, jouer, file, playlist, lecteurOuvert, setLecteurOuvert,
    } = useAudio()

    const [panel, setPanel]     = useState<'none' | 'chapters' | 'queue'>('none')
    const [markers, setMarkers] = useState<{ id: string; titre: string; temps_secondes: number }[]>([])
    const [noteVisible, setNoteVisible] = useState(false)
    const [tsNote, setTsNote]       = useState(0)
    // Piste lancée depuis la File : on reste sur la liste au lieu de
    // basculer sur la vue lecteur
    const garderPanelRef = useRef(false)

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

    // Metadata
    useEffect(() => {
        if (!piste) return
        setMarkers([])
        if (garderPanelRef.current) garderPanelRef.current = false
        else setPanel('none')

        // Les markers peuvent être rattachés à un épisode classique ou à
        // un livre audio : côté app l'id d'un livre est préfixé `livre_`
        // alors qu'en base ils sont enregistrés sous l'uuid brut.
        // On tente les identifiants candidats l'un après l'autre.
        let annule = false
        const charger = async () => {
            const candidats = piste.id.startsWith('livre_')
                ? [piste.id.slice(6), piste.id]
                : [piste.id]
            for (const idC of candidats) {
                const { data, error } = await supabase
                    .from('episode_markers')
                    .select('id, titre, temps_secondes')
                    .eq('episode_id', idC)
                    .order('temps_secondes')
                if (annule) return
                if (!error && data && data.length > 0) { setMarkers(data); return }
            }
        }
        charger()
        return () => { annule = true }
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

    const panelOpen = panel === 'chapters'

    // Chapitre en cours d'écoute + encoches sur la barre de progression
    const chapitreActuel = markers.length > 0
        ? [...markers].reverse().find(m => tempsActuel >= m.temps_secondes) ?? markers[0]
        : null
    const marksFractions = dureeTotal > 0
        ? markers.map(m => m.temps_secondes / dureeTotal).filter(f => f > 0.005 && f < 0.995)
        : []

    const ouvrirNote = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        setTsNote(tempsActuel)
        setNoteVisible(true)
    }

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
                                            contentContainerStyle={{ paddingVertical: 4 }}
                                        >
                                            {markers.length === 0 ? (
                                                <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                                                    <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.base, color: W60 }}>
                                                        Aucun chapitre
                                                    </Text>
                                                </View>
                                            ) : markers.map((m, i) => {
                                                const actif = tempsActuel >= m.temps_secondes &&
                                                    (i === markers.length - 1 || tempsActuel < markers[i + 1].temps_secondes)
                                                const passe = !actif && tempsActuel > m.temps_secondes
                                                const debutSuivant = i < markers.length - 1 ? markers[i + 1].temps_secondes : dureeTotal
                                                const dureeChap = Math.max(0, debutSuivant - m.temps_secondes)
                                                const restant = actif
                                                    ? Math.max(0, dureeChap - (tempsActuel - m.temps_secondes))
                                                    : dureeChap
                                                return (
                                                    <Pressable
                                                        key={m.id}
                                                        onPress={() => { Haptics.selectionAsync(); seeker((m.temps_secondes / dureeTotal) * 100) }}
                                                        style={({ pressed }) => ({
                                                            flexDirection: 'row', alignItems: 'center',
                                                            paddingHorizontal: spacing.md,
                                                            paddingVertical: 12,
                                                            backgroundColor: actif
                                                                ? 'rgba(214,173,58,0.09)'
                                                                : pressed ? 'rgba(255,255,255,0.04)' : 'transparent',
                                                            borderLeftWidth: actif ? 3 : 3,
                                                            borderLeftColor: actif ? colors.or : 'transparent',
                                                            borderBottomWidth: i < markers.length - 1 ? 1 : 0,
                                                            borderBottomColor: 'rgba(255,255,255,0.05)',
                                                        })}
                                                    >
                                                        {/* Numéro / égaliseur */}
                                                        <View style={{
                                                            width: 30, height: 30, borderRadius: 15,
                                                            backgroundColor: actif ? colors.or : passe ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.12)',
                                                            alignItems: 'center', justifyContent: 'center',
                                                            marginRight: 14, flexShrink: 0,
                                                        }}>
                                                            {actif && enLecture
                                                                ? <MiniEgaliseur color={BG_BOT} hauteur={13} epaisseur={2.5} />
                                                                : <Text style={{
                                                                    fontFamily: typography.fontFamily.bold,
                                                                    fontSize: 11,
                                                                    color: actif ? BG_BOT : passe ? W60 : W85,
                                                                    fontVariant: ['tabular-nums'],
                                                                }}>
                                                                    {i + 1}
                                                                </Text>
                                                            }
                                                        </View>

                                                        {/* Titre */}
                                                        <Text
                                                            numberOfLines={2}
                                                            style={{
                                                                flex: 1,
                                                                fontFamily: actif ? typography.fontFamily.bold : typography.fontFamily.medium,
                                                                fontSize: typography.size.base,
                                                                color: actif ? colors.or : passe ? W85 : W85,
                                                                lineHeight: 20,
                                                            }}
                                                        >
                                                            {m.titre}
                                                        </Text>

                                                        {/* Durée / countdown */}
                                                        {dureeTotal > 0 && (
                                                            <Text style={{
                                                                fontFamily: typography.fontFamily.medium,
                                                                fontSize: typography.size.xs,
                                                                color: actif ? 'rgba(214,173,58,0.85)' : W60,
                                                                marginLeft: 10,
                                                                fontVariant: ['tabular-nums'],
                                                                minWidth: 44, textAlign: 'right',
                                                            }}>
                                                                {actif ? `-${fmt(restant)}` : fmt(dureeChap)}
                                                            </Text>
                                                        )}
                                                    </Pressable>
                                                )
                                            })}
                                        </ScrollView>
                                    )}
                                </View>

                                {/* Title + Sheikh */}
                                <View style={{ marginTop: spacing.lg, marginBottom: chapitreActuel ? 6 : spacing.md }}>
                                    <TextTicker
                                        style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xl, color: '#fff', lineHeight: 28 }}
                                        loop bounce={false} repeatSpacer={60} marqueeDelay={2500} scrollSpeed={18}
                                    >
                                        {piste.titre}
                                    </TextTicker>
                                    <TextTicker
                                        style={{ fontFamily: sousTitreArabe ? typography.fontFamily.arabic : typography.fontFamily.regular, fontSize: typography.size.md, color: W60, marginTop: 4 }}
                                        loop bounce={false} repeatSpacer={60} marqueeDelay={2500} scrollSpeed={18}
                                    >
                                        {piste.sheikh}
                                    </TextTicker>
                                </View>

                                {/* Chapitre en cours — centré, au-dessus de la barre */}
                                {chapitreActuel && (
                                    <Pressable
                                        onPress={() => { Haptics.selectionAsync(); setPanel('chapters') }}
                                        style={{
                                            alignSelf: 'center',
                                            backgroundColor: 'rgba(255,255,255,0.06)',
                                            borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
                                            borderRadius: radius.full,
                                            paddingHorizontal: 13, paddingVertical: 5,
                                            // Pas de marge : la réserve de la bulle flottante (34px dans
                                            // Progress) équilibre exactement l'espace sous la barre
                                            // (libellés temps + marge contrôles + inset du cercle play)
                                            marginBottom: 0,
                                            // Descend visuellement la pill sans toucher au reste
                                            transform: [{ translateY: 8 }],
                                            maxWidth: W - spacing.xl * 2 - 20,
                                            overflow: 'hidden',
                                        }}
                                    >
                                        <TextTicker
                                            style={{
                                                fontFamily: typography.fontFamily.semibold,
                                                fontSize: typography.size.xs,
                                                color: W85,
                                                letterSpacing: 0.2,
                                            }}
                                            loop bounce={false} repeatSpacer={60} marqueeDelay={2500} scrollSpeed={18}
                                        >
                                            {chapitreActuel.titre}
                                        </TextTicker>
                                    </Pressable>
                                )}

                                {/* Progress */}
                                <Progress tempsActuel={tempsActuel} dureeTotal={dureeTotal} onSeek={seeker} marks={marksFractions} />

                                {/* Controls */}
                                <View style={{
                                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                                    marginTop: spacing.md, marginBottom: spacing.md,
                                }}>
                                    {/* speed pill */}
                                    <SpringTap
                                        onPress={cyclerVitesse}
                                        hitSlop={12}
                                        pressedScale={0.88}
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
                                    </SpringTap>

                                    <SpringTap onPress={() => skip(reculer)} hitSlop={16} pressedScale={0.82}>
                                        <IcoBack size={38} color="#fff" />
                                    </SpringTap>

                                    <BoutonPlay enLecture={enLecture} onPress={togglePlay} />

                                    <SpringTap onPress={() => skip(avancer)} hitSlop={16} pressedScale={0.82}>
                                        <IcoFwd size={38} color="#fff" />
                                    </SpringTap>

                                    {/* download */}
                                    <BoutonTelechargement piste={piste} />
                                </View>

                                {/* Volume */}
                                <VolumeBar volume={volume} onChange={changerVolume} />

                            </View>
                        ) : (
                            /* ── Queue : liste complète ── */
                            (() => {
                                // Utilise la playlist complète si dispo, sinon current + file
                                const liste = playlist.length > 0 ? playlist : [piste, ...file]

                                const jouerIndex = (i: number) => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                                    garderPanelRef.current = true
                                    jouer(liste[i], liste.slice(i + 1), undefined, liste)
                                }
                                const togglePlay = () => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                                    enLecture ? pause() : reprendre()
                                }

                                return (
                                    <ScrollView
                                        showsVerticalScrollIndicator={false}
                                        style={{ flex: 1 }}
                                        contentContainerStyle={{ paddingBottom: spacing.lg }}
                                    >
                                        {/* ── En-tête ── */}
                                        <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.md }}>
                                            <Text style={{
                                                fontFamily: typography.fontFamily.bold,
                                                fontSize: typography.size.xs,
                                                letterSpacing: 1.8,
                                                color: colors.or,
                                                textTransform: 'uppercase',
                                            }}>
                                                Playlist · {liste.length} épisode{liste.length > 1 ? 's' : ''}
                                            </Text>
                                        </View>

                                        {/* ── Liste ── */}
                                        {liste.map((ep, i) => {
                                            const actif = ep.id === piste.id
                                            const epArabe = /[؀-ۿ]/.test(ep.sheikh)

                                            return (
                                                <Pressable
                                                    key={ep.id}
                                                    onPress={() => actif ? togglePlay() : jouerIndex(i)}
                                                    style={({ pressed }) => ({
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        paddingHorizontal: spacing.xl,
                                                        paddingVertical: 13,
                                                        backgroundColor: actif
                                                            ? 'rgba(214,173,58,0.10)'
                                                            : pressed ? W08 : 'transparent',
                                                        borderLeftWidth: actif ? 3 : 0,
                                                        borderLeftColor: colors.or,
                                                        marginBottom: 1,
                                                    })}
                                                >
                                                    {/* Numéro / icône état */}
                                                    <View style={{
                                                        width: 32, height: 32,
                                                        alignItems: 'center', justifyContent: 'center',
                                                        marginRight: 14,
                                                    }}>
                                                        {actif ? (
                                                            <View style={{
                                                                width: 32, height: 32, borderRadius: 16,
                                                                backgroundColor: colors.or,
                                                                alignItems: 'center', justifyContent: 'center',
                                                            }}>
                                                                {enLecture
                                                                    ? <MiniEgaliseur color={BG_MID} hauteur={14} epaisseur={2.5} />
                                                                    : <IcoPlay size={14} color={BG_MID} />
                                                                }
                                                            </View>
                                                        ) : (
                                                            <Text style={{
                                                                fontFamily: typography.fontFamily.medium,
                                                                fontSize: typography.size.sm,
                                                                color: W60,
                                                                fontVariant: ['tabular-nums'],
                                                            }}>
                                                                {i + 1}
                                                            </Text>
                                                        )}
                                                    </View>

                                                    {/* Titre + sheikh */}
                                                    <View style={{ flex: 1, minWidth: 0 }}>
                                                        <Text
                                                            numberOfLines={1}
                                                            style={{
                                                                fontFamily: actif ? typography.fontFamily.bold : typography.fontFamily.medium,
                                                                fontSize: typography.size.base,
                                                                color: actif ? colors.or : W85,
                                                            }}
                                                        >
                                                            {ep.titre}
                                                        </Text>
                                                        <Text
                                                            numberOfLines={1}
                                                            style={{
                                                                fontFamily: epArabe ? typography.fontFamily.arabic : typography.fontFamily.regular,
                                                                fontSize: typography.size.xs,
                                                                color: actif ? 'rgba(214,173,58,0.7)' : W60,
                                                                marginTop: 3,
                                                            }}
                                                        >
                                                            {ep.sheikh}
                                                        </Text>
                                                    </View>

                                                    {/* Durée */}
                                                    {ep.duree ? (
                                                        <Text style={{
                                                            fontFamily: typography.fontFamily.regular,
                                                            fontSize: typography.size.xs,
                                                            color: actif ? 'rgba(214,173,58,0.6)' : W35,
                                                            marginLeft: 10,
                                                            fontVariant: ['tabular-nums'],
                                                        }}>
                                                            {ep.duree}
                                                        </Text>
                                                    ) : null}
                                                </Pressable>
                                            )
                                        })}
                                    </ScrollView>
                                )
                            })()
                        )}

                        {/* ── Bottom tabs — pilule verre ── */}
                        <View style={{
                            paddingHorizontal: spacing.xl,
                            paddingTop: spacing.sm,
                            paddingBottom: spacing.xs,
                        }}>
                            <View style={{
                                flexDirection: 'row',
                                backgroundColor: 'rgba(255,255,255,0.04)',
                                borderRadius: radius.full,
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.07)',
                                padding: 4,
                            }}>
                                {[
                                    { label: 'Notes',    active: noteVisible,         icon: <IcoAddNotes  size={21} color={noteVisible          ? colors.or : W60} />, onPress: ouvrirNote },
                                    { label: 'Chapitres',active: panel === 'chapters', icon: <IcoChapters size={21} color={panel === 'chapters'  ? colors.or : W60} />, onPress: () => { Haptics.selectionAsync(); setPanel(p => p === 'chapters' ? 'none' : 'chapters') } },
                                    { label: 'Playlist', active: isQueue,             icon: <IcoQueue     size={21} color={isQueue               ? colors.or : W60} />, onPress: () => { Haptics.selectionAsync(); setPanel(p => p === 'queue' ? 'none' : 'queue') } },
                                ].map(tab => (
                                    <Pressable
                                        key={tab.label}
                                        onPress={tab.onPress}
                                        style={{
                                            flex: 1, alignItems: 'center', justifyContent: 'center',
                                            gap: 4,
                                            paddingVertical: 8,
                                            borderRadius: radius.full,
                                            backgroundColor: tab.active ? 'rgba(214,173,58,0.12)' : 'transparent',
                                        }}
                                    >
                                        {tab.icon}
                                        <Text style={{
                                            fontFamily: tab.active ? typography.fontFamily.semibold : typography.fontFamily.medium,
                                            fontSize: typography.size.xs,
                                            color: tab.active ? colors.or : W60,
                                        }}>
                                            {tab.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    </SafeAreaView>
                </View>
            </GestureDetector>

            {/* ── Prise de notes pendant l'écoute ── */}
            <EditeurNote
                visible={noteVisible}
                episode={{ id: piste.id, titre: piste.titre, sheikh: piste.sheikh }}
                timestamp={tsNote}
                onClose={() => setNoteVisible(false)}
            />
        </Animated.View>
    )
}

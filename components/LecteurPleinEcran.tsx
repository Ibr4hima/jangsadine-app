import { MiniEgaliseur } from '@/components/AudioUI'
import EditeurNote from '@/components/EditeurNote'
import FondAurore from '@/components/FondAurore'
import { colors, radius, spacing, typography } from '@/constants/theme'
import { useAudio, useAudioProgress } from '@/contexts/AudioContext'
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
    FadeIn,
    withTiming,
    ZoomIn,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path, Circle as SvgCircle } from 'react-native-svg'
import TextTicker from '@/components/Marquee'

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

const VITESSES = [1, 1.15, 1.25, 1.5, 2, 0.75]

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

// ─── Bouton ±10 s animé ───────────────────────────────────────
// Tap : l'icône tourne d'un cran dans le sens du saut puis revient à
// ressort. Long-press : saut au chapitre précédent/suivant (rotation plus
// ample, haptique distincte gérée par l'appelant).
function BoutonSkip({ sens, onSkip, onLongSkip }: {
    sens: 1 | -1; onSkip: () => void; onLongSkip?: () => void
}) {
    const s   = useSharedValue(1)
    const rot = useSharedValue(0)

    const press = () => {
        onSkip()
        rot.value = withSequence(
            withTiming(sens * 42, { duration: 130, easing: Easing.out(Easing.quad) }),
            withSpring(0, { damping: 9, stiffness: 150 }),
        )
    }

    const longPress = () => {
        if (!onLongSkip) return
        onLongSkip()
        rot.value = withSequence(
            withTiming(sens * 90, { duration: 180, easing: Easing.out(Easing.quad) }),
            withSpring(0, { damping: 10, stiffness: 130 }),
        )
    }

    const iconStyle = useAnimatedStyle(() => ({
        transform: [{ scale: s.value }, { rotate: `${rot.value}deg` }],
    }))

    return (
        <AnimatedPressable
            onPressIn={() => { s.value = withSpring(0.82, { damping: 16, stiffness: 480 }) }}
            onPressOut={() => { s.value = withSpring(1, { damping: 13, stiffness: 300 }) }}
            onPress={press}
            onLongPress={longPress}
            delayLongPress={350}
            hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
        >
            <Animated.View style={iconStyle}>
                {sens < 0 ? <IcoBack size={38} color="#fff" /> : <IcoFwd size={38} color="#fff" />}
            </Animated.View>
        </AnimatedPressable>
    )
}

// ─── Artwork (always mounted) ─────────────────────────────────
// Swipe horizontal sur la pochette = ±10 s : elle suit le doigt avec
// résistance et une légère inclinaison, un badge « ±10 s » apparaît sur le
// bord, puis tout revient à ressort. Le glisser vertical n'est pas capturé
// (il continue de fermer le lecteur via le geste parent).
function Artwork({ enLecture, hidden, onSwipeSkip, onDoubleTap, transition }: {
    enLecture: boolean; hidden: boolean; onSwipeSkip: (sens: 1 | -1) => void; onDoubleTap: () => void
    // Changement de piste directionnel : suivante → la pochette sort à
    // gauche et la nouvelle entre de la droite (précédente : miroir)
    transition: { id: string; dir: 1 | -1 } | null
}) {
    const scale = useSharedValue(enLecture ? 1 : 0.78)
    const aura  = useSharedValue(0)
    const tx      = useSharedValue(0)
    const opac    = useSharedValue(1)

    useEffect(() => {
        if (!transition) return
        const dir = transition.dir
        tx.value = withSequence(
            withTiming(-dir * ART_SIZE * 0.55, { duration: 150, easing: Easing.in(Easing.quad) }),
            withTiming(dir * ART_SIZE * 0.55, { duration: 0 }),
            withSpring(0, { damping: 15, stiffness: 170 }),
        )
        opac.value = withSequence(
            withTiming(0, { duration: 140 }),
            withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) }),
        )
    }, [transition?.id])
    const badgeAv = useSharedValue(0)   // « +10 s » (swipe vers la droite)
    const badgeRe = useSharedValue(0)   // « -10 s » (swipe vers la gauche)

    useEffect(() => {
        scale.value = withSpring(enLecture ? 1 : 0.78, { damping: 14, stiffness: 140 })
        if (enLecture) {
            // double battement organique (boum-boum … boum-boum), plus
            // vivant qu'une respiration symétrique
            aura.value = withRepeat(
                withSequence(
                    withTiming(1,    { duration: 460,  easing: Easing.out(Easing.quad) }),
                    withTiming(0.35, { duration: 680,  easing: Easing.inOut(Easing.ease) }),
                    withTiming(0.78, { duration: 420,  easing: Easing.out(Easing.quad) }),
                    withTiming(0,    { duration: 1040, easing: Easing.inOut(Easing.ease) }),
                ), -1, false
            )
        } else {
            cancelAnimation(aura)
            aura.value = withTiming(0, { duration: 600 })
        }
    }, [enLecture])

    const swipe = Gesture.Pan()
        .enabled(!hidden)
        .activeOffsetX([-16, 16])
        .failOffsetY([-24, 24])
        .onUpdate(e => {
            // résistance : la pochette ne suit qu'un tiers du doigt
            tx.value = e.translationX * 0.35
        })
        .onEnd(e => {
            const flash = (sv: typeof badgeAv) => {
                'worklet'
                sv.value = withSequence(
                    withTiming(1, { duration: 110 }),
                    withDelay(340, withTiming(0, { duration: 240 })),
                )
            }
            if (e.translationX > 56 || e.velocityX > 900) {
                flash(badgeAv)
                runOnJS(onSwipeSkip)(1)
            } else if (e.translationX < -56 || e.velocityX < -900) {
                flash(badgeRe)
                runOnJS(onSwipeSkip)(-1)
            }
            tx.value = withSpring(0, { damping: 15, stiffness: 240 })
        })

    // Double-tap = play/pause (le rebond d'échelle vient du changement
    // d'état enLecture, déjà animé à ressort)
    const doubleTap = Gesture.Tap()
        .numberOfTaps(2)
        .maxDelay(260)
        .onEnd((_e, reussi) => { if (reussi) runOnJS(onDoubleTap)() })
    const gestes = Gesture.Race(doubleTap, swipe)

    const style = useAnimatedStyle(() => ({
        opacity: opac.value,
        transform: [
            { translateX: tx.value },
            { rotate: `${tx.value / 30}deg` },
            { scale: scale.value },
        ],
    }))

    // halo doré qui respire derrière la pochette pendant la lecture
    const auraStyle = useAnimatedStyle(() => ({
        opacity: 0.05 + aura.value * 0.09,
        transform: [
            { translateX: tx.value * 0.5 },
            { scale: (scale.value + 0.04) + aura.value * 0.05 },
        ],
    }))

    const badgeAvStyle = useAnimatedStyle(() => ({
        opacity: badgeAv.value,
        transform: [{ scale: 0.8 + badgeAv.value * 0.2 }],
    }))
    const badgeReStyle = useAnimatedStyle(() => ({
        opacity: badgeRe.value,
        transform: [{ scale: 0.8 + badgeRe.value * 0.2 }],
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
            <GestureDetector gesture={gestes}>
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
            </GestureDetector>

            {/* badges ±10 s sur les bords */}
            <Animated.View pointerEvents="none" style={[{
                position: 'absolute', right: 16,
                backgroundColor: colors.or, borderRadius: radius.full,
                paddingHorizontal: 12, paddingVertical: 6,
                shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
            }, badgeAvStyle]}>
                <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: 14, color: BG_BOT }}>+10 s</Text>
            </Animated.View>
            <Animated.View pointerEvents="none" style={[{
                position: 'absolute', left: 16,
                backgroundColor: colors.or, borderRadius: radius.full,
                paddingHorizontal: 12, paddingVertical: 6,
                shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
            }, badgeReStyle]}>
                <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: 14, color: BG_BOT }}>-10 s</Text>
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

    // Scrub de précision : plus le doigt descend sous la barre, plus le
    // défilement ralentit (paliers 1 → ½ → ¼ → fin) — façon Apple Music.
    const lastX    = useSharedValue(0)
    const rateSV   = useSharedValue(1)
    const minuteSV = useSharedValue(-1)
    // Élastique de bord : position brute non bornée pendant le drag ; le
    // surplus au-delà de [0,1] étire la barre avec résistance (rubber-band).
    const brutSV  = useSharedValue(0)
    const surSV   = useSharedValue(0)   // dépassement signé (au-delà du bord)
    const buteeSV = useSharedValue(0)   // -1 / 0 / 1 : bord actuellement touché

    // Garde-fous côté JS : pas de lecture de shared values dans le
    // useEffect (peu fiable inter-threads) — un simple ref + deadline
    const dragJS     = useRef(false)
    const blockUntil = useRef(0)
    const lastTickJS = useRef(0)

    // Tic haptique à chaque minute franchie pendant le scrub (throttlé)
    const ticMinute = () => {
        const now = Date.now()
        if (now - lastTickJS.current > 60) {
            lastTickJS.current = now
            Haptics.selectionAsync()
        }
    }
    // Butée : claque au contact du bord (début/fin) pendant le scrub
    const ticButee = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium) }

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
    // Précision progressive : le déplacement horizontal est appliqué de
    // façon incrémentale, multiplié par un taux qui diminue quand le doigt
    // s'éloigne verticalement de la barre (1 → ½ → ¼ → fin). Un tic
    // haptique marque chaque minute franchie.
    const panGesture = Gesture.Pan()
        .minDistance(4)
        .onBegin(e => {
            scrub.value = clamp01(e.x / barW.value)
        })
        .onStart(e => {
            scrubbing.value = withTiming(1, { duration: 100 })
            scrub.value = clamp01(e.x / barW.value)
            brutSV.value = scrub.value
            surSV.value = 0
            buteeSV.value = 0
            lastX.value = e.x
            rateSV.value = 1
            minuteSV.value = Math.floor((scrub.value * duree.value) / 60)
            runOnJS(setDragJS)(true)
            runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light)
        })
        .onUpdate(e => {
            const dy = Math.abs(e.translationY)
            const rate = dy < 55 ? 1 : dy < 115 ? 0.5 : dy < 175 ? 0.25 : 0.1
            rateSV.value = rate
            const dx = e.x - lastX.value
            lastX.value = e.x
            // position brute non bornée → surplus élastique au-delà des bords
            brutSV.value = brutSV.value + (dx / barW.value) * rate
            scrub.value = clamp01(brutSV.value)
            surSV.value = brutSV.value - scrub.value
            // haptique de butée à l'instant où on touche un bord
            const signe = surSV.value > 0.0005 ? 1 : surSV.value < -0.0005 ? -1 : 0
            if (signe !== 0 && buteeSV.value === 0) runOnJS(ticButee)()
            buteeSV.value = signe
            const m = Math.floor((scrub.value * duree.value) / 60)
            if (m !== minuteSV.value) {
                minuteSV.value = m
                runOnJS(ticMinute)()
            }
        })
        .onEnd(() => {
            prog.value = scrub.value
            runOnJS(finDeSeek)(scrub.value)
        })
        .onFinalize(() => {
            scrubbing.value = withTiming(0, { duration: 180 })
            surSV.value = withSpring(0, { damping: 14, stiffness: 260 })
            buteeSV.value = 0
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

    // Rubber-band : le dépassement étire la barre (ancrée au bord opposé),
    // avec une courbe de résistance qui sature vite — jamais plus de ~5 %.
    const stretchStyle = useAnimatedStyle(() => {
        const sur = surSV.value
        if (sur === 0) return { transform: [{ translateX: 0 }, { scaleX: 1 }] }
        const a = Math.abs(sur)
        const k = Math.min(0.05, (a * 0.4) / (1 + a * 6))
        const w = barW.value
        return {
            transform: [
                { translateX: (sur > 0 ? -1 : 1) * (w * k) / 2 },
                { scaleX: 1 + k },
            ],
        }
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
                { translateX: Math.max(0, Math.min(x - 40, barW.value - 80)) },
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
    // Droite : durée totale, fixe — simple indicateur, pas de décompte
    const droiteProps = useAnimatedProps(() => {
        return { text: fmtW(duree.value) } as any
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
                    width: 80, paddingVertical: 5,
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
                            fontSize: 15, color: BG_BOT,
                            fontVariant: ['tabular-nums'],
                            padding: 0, textAlign: 'center',
                        }}
                    />
                </Animated.View>
            </View>

            <GestureDetector gesture={gesture}>
                <Animated.View
                    onLayout={e => { barW.value = e.nativeEvent.layout.width }}
                    style={[{ height: 36, justifyContent: 'center' }, stretchStyle]}
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
                </Animated.View>
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
// Même recette que la barre de progression : pendant la glisse, RIEN ne
// passe par l'état React (le remplissage vit sur le thread UI, le volume
// matériel est réglé via le canal « live » sans setState) → aucun
// re-render du lecteur pendant le drag, fluidité parfaite. L'état n'est
// resynchronisé qu'au relâché.
function VolumeBar({ volume, onChange, onChangeLive }: {
    volume: number; onChange: (v: number) => void; onChangeLive: (v: number) => void
}) {
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
    // Application « live » du volume matériel pendant le drag (sans état
    // React), throttlée à ~30 ms pour rester réactif sans saturer le natif
    const sendLive = (v: number) => {
        const now = Date.now()
        if (now - lastChange.current > 30) { lastChange.current = now; onChangeLive(v) }
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
            runOnJS(sendLive)(v)
        })
        .onUpdate(e => {
            const v = clamp01(e.x / barW.value)
            vol.value = v
            runOnJS(sendLive)(v)
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
// `chargement` : anneau doré tournant autour du bouton pendant le
// buffering — l'app ne paraît jamais figée sur un réseau lent.
function BoutonPlay({ enLecture, chargement, onPress }: { enLecture: boolean; chargement: boolean; onPress: () => void }) {
    const glow = useSharedValue(0)
    const spin = useSharedValue(0)

    useEffect(() => {
        if (chargement) {
            spin.value = 0
            spin.value = withRepeat(withTiming(360, { duration: 900, easing: Easing.linear }), -1, false)
        } else {
            cancelAnimation(spin)
        }
    }, [chargement])
    const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }))
    // 0 = play, 1 = pause : le passage de l'un à l'autre est un morphing
    // continu (rotation + fondu croisé), pas un simple échange d'icônes.
    const mode = useSharedValue(enLecture ? 1 : 0)

    useEffect(() => {
        mode.value = withTiming(enLecture ? 1 : 0, { duration: 240, easing: Easing.inOut(Easing.quad) })
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

    const playStyle = useAnimatedStyle(() => ({
        opacity: 1 - mode.value,
        transform: [{ rotate: `${mode.value * 90}deg` }, { scale: 1 - mode.value * 0.35 }],
    }))
    const pauseStyle = useAnimatedStyle(() => ({
        opacity: mode.value,
        transform: [{ rotate: `${(mode.value - 1) * 90}deg` }, { scale: 0.65 + mode.value * 0.35 }],
    }))

    return (
        <SpringTap onPress={onPress} hitSlop={10} pressedScale={0.9}>
            <View style={{ alignItems: 'center', justifyContent: 'center', width: 90, height: 90 }}>
                <Animated.View style={[{
                    position: 'absolute',
                    width: 90, height: 90, borderRadius: 45,
                    backgroundColor: '#fff',
                }, ringStyle]} />
                {/* anneau de chargement (buffering) */}
                {chargement && (
                    <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: 96, height: 96 }, spinStyle]}>
                        <Svg width={96} height={96}>
                            <SvgCircle
                                cx={48} cy={48} r={45}
                                stroke={colors.or} strokeWidth={3} fill="none"
                                strokeDasharray="80 203" strokeLinecap="round"
                            />
                        </Svg>
                    </Animated.View>
                )}
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
                    {/* morphing play ↔ pause : rotation + fondu croisé */}
                    <View style={{ width: 36, height: 36 }}>
                        <Animated.View style={[{ position: 'absolute' }, playStyle]}>
                            <IcoPlay size={36} color={BG_MID} />
                        </Animated.View>
                        <Animated.View style={[{ position: 'absolute' }, pauseStyle]}>
                            <IcoPause size={36} color={BG_MID} />
                        </Animated.View>
                    </View>
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
    const { estTelecharge, estEnCours, progressions, telecharger, annuler } = useTelechargement()

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
        if (telecharge) return
        if (enCours) { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); annuler(piste.id); return }
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
        piste, enLecture,
        vitesse, volume, enChargement, pause, reprendre, seeker, avancer, reculer,
        changerVitesse, changerVitesseLive, changerVolume, changerVolumeLive, jouer, file, playlist, lecteurOuvert, setLecteurOuvert,
    } = useAudio()
    const { tempsActuel, dureeTotal } = useAudioProgress()

    const [panel, setPanel]     = useState<'none' | 'chapters' | 'queue'>('none')
    const [markers, setMarkers] = useState<{ id: string; titre: string; temps_secondes: number }[]>([])
    const [noteVisible, setNoteVisible] = useState(false)
    const [tsNote, setTsNote]       = useState(0)
    // Piste lancée depuis la File : on reste sur la liste au lieu de
    // basculer sur la vue lecteur
    const garderPanelRef = useRef(false)

    const translateY = useSharedValue(SCREEN_H)

    // ── Changement de piste directionnel ──
    // Compare la position de l'ancienne et de la nouvelle piste dans la
    // playlist : en avant → dir 1 (sort à gauche, entre de la droite).
    const prevPisteIdRef = useRef<string | null>(null)
    const [transitionPiste, setTransitionPiste] = useState<{ id: string; dir: 1 | -1 } | null>(null)
    useEffect(() => {
        if (!piste) return
        if (prevPisteIdRef.current === null || prevPisteIdRef.current === piste.id) {
            prevPisteIdRef.current = piste.id
            return
        }
        const anc = playlist.findIndex(t => t.id === prevPisteIdRef.current)
        const nouv = playlist.findIndex(t => t.id === piste.id)
        prevPisteIdRef.current = piste.id
        setTransitionPiste({ id: piste.id, dir: anc >= 0 && nouv >= 0 && nouv < anc ? -1 : 1 })
    }, [piste?.id, playlist])

    // ── Réglage de vitesse au glisser (long-press sur la pilule ×N) ──
    // Long-press → HUD ; sans lever le doigt, glisser règle la vitesse au
    // centième (0,75 → 2,00), appliquée en direct à l'audio. Relâcher valide.
    const [reglageVitesse, setReglageVitesse] = useState(false)
    const vitLiveSV = useSharedValue(1)
    const vitDepartSV = useSharedValue(1)
    const dernierApplyRef = useRef(0)
    const dernierCranRef = useRef(0)

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

    // Transition « liquide » : l'artwork arrive de plus bas et plus petit que
    // la feuille (croissance + parallaxe) comme s'il grandissait depuis le
    // mini-lecteur ; le titre suit avec une parallaxe plus douce. Piloté par
    // translateY → le drag de fermeture rejoue la transition en miroir.
    const artEntree = useAnimatedStyle(() => {
        const t = Math.min(1, Math.max(0, translateY.value / SCREEN_H))
        return {
            opacity: 1 - t * 0.25,
            transform: [
                { translateY: t * SCREEN_H * 0.35 },
                { scale: 1 - t * 0.45 },
            ],
        }
    })
    const titreEntree = useAnimatedStyle(() => {
        const t = Math.min(1, Math.max(0, translateY.value / SCREEN_H))
        return {
            opacity: 1 - t * 0.5,
            transform: [{ translateY: t * SCREEN_H * 0.12 }],
        }
    })

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

    // Fermé → complètement démonté : sans cela, le lecteur (translaté hors
    // écran) continuait de se re-rendre 2×/s (progression) et ses marquees /
    // animations tournaient en permanence. Le drag de fermeture anime d'abord,
    // puis setLecteurOuvert(false) démonte ; l'ouverture remonte et glisse.
    if (!piste || !lecteurOuvert) return null

    // Le champ sheikh peut contenir le titre arabe du livre : on le rend
    // alors avec la police arabe de l'app
    const sousTitreArabe = /[؀-ۿ]/.test(piste.sheikh)

    const cyclerVitesse = () => {
        Haptics.selectionAsync()
        const i = VITESSES.indexOf(vitesse)
        changerVitesse(VITESSES[(i + 1) % VITESSES.length])
    }

    const debutReglageVitesse = () => {
        setReglageVitesse(true)
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }
    const liveReglageVitesse = (v: number) => {
        // application audio en direct, throttlée (~80 ms)
        const now = Date.now()
        if (now - dernierApplyRef.current > 80) {
            dernierApplyRef.current = now
            changerVitesseLive(v)
        }
        // petit tic à chaque cran de 0,05
        const cran = Math.round(v * 20)
        if (cran !== dernierCranRef.current) {
            dernierCranRef.current = cran
            Haptics.selectionAsync()
        }
    }
    const finReglageVitesse = (v: number) => {
        setReglageVitesse(false)
        changerVitesse(Math.round(v * 100) / 100)
    }

    const panVitesse = Gesture.Pan()
        .activateAfterLongPress(350)
        .onStart(() => {
            vitDepartSV.value = vitesse
            vitLiveSV.value = vitesse
            runOnJS(debutReglageVitesse)()
        })
        .onUpdate(e => {
            // 220 px de course ≈ toute la plage 0,75 → 2,00
            const v = Math.min(2, Math.max(0.75, vitDepartSV.value + (e.translationX / 220) * 1.25))
            const arrondi = Math.round(v * 100) / 100
            if (arrondi !== vitLiveSV.value) {
                vitLiveSV.value = arrondi
                runOnJS(liveReglageVitesse)(arrondi)
            }
        })
        .onEnd(() => {
            runOnJS(finReglageVitesse)(vitLiveSV.value)
        })
        .onFinalize((_e, reussi) => {
            if (!reussi) runOnJS(finReglageVitesse)(vitLiveSV.value)
        })
    const tapVitesse = Gesture.Tap()
        .maxDuration(330)
        .onEnd((_e, reussi) => { if (reussi) runOnJS(cyclerVitesse)() })
    const gesteVitesse = Gesture.Race(panVitesse, tapVitesse)

    // HUD : libellé ×N,NN + jauge, pilotés sur le thread UI
    const vitesseProps = useAnimatedProps(() => {
        const cent = Math.round(vitLiveSV.value * 100)
        const ent = Math.floor(cent / 100)
        const dec = cent % 100
        return { text: '×' + ent + ',' + (dec < 10 ? '0' + dec : '' + dec) } as any
    })
    const remplissageVitesse = useAnimatedStyle(() => ({
        width: ((vitLiveSV.value - 0.75) / 1.25) * 210,
    }))

    const togglePlay = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        enLecture ? pause() : reprendre()
    }

    const skip = (fn: (s: number) => void) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        fn(10)
    }

    const swipeSkip = (sens: 1 | -1) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        sens > 0 ? avancer(10) : reculer(10)
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

    // Long-press ±10 s → chapitre précédent/suivant. En arrière : si on est
    // à plus de 3 s dans le chapitre, on revient à son début (convention des
    // lecteurs de musique) ; sinon au chapitre d'avant.
    const allerChapitre = (sens: 1 | -1) => {
        if (!markers.length || dureeTotal <= 0) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
            return
        }
        const idx = markers.findIndex((m, i) =>
            tempsActuel >= m.temps_secondes &&
            (i === markers.length - 1 || tempsActuel < markers[i + 1].temps_secondes))
        let cible: number
        if (sens > 0) {
            if (idx >= markers.length - 1) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); return }
            cible = markers[idx + 1].temps_secondes
        } else {
            const debut = idx >= 0 ? markers[idx].temps_secondes : 0
            cible = (idx >= 0 && tempsActuel - debut > 3) ? debut : (idx > 0 ? markers[idx - 1].temps_secondes : 0)
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
        seeker((cible / dureeTotal) * 100)
    }

    return (
        <Animated.View style={[{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999,
        }, animStyle]}>
            <GestureDetector gesture={dismissGesture}>
                <View style={{ flex: 1, overflow: 'hidden' }}>
                    {/* ── Background : bleu logo + brume ── */}
                    <LinearGradient
                        colors={[BG_TOP, BG_MID, BG_BOT]}
                        locations={[0, 0.5, 1]}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    />
                    <FondAurore actif={lecteurOuvert} />

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
                                    <Animated.View style={artEntree}>
                                        <Artwork enLecture={enLecture} hidden={panelOpen} onSwipeSkip={swipeSkip} onDoubleTap={togglePlay} transition={transitionPiste} />
                                    </Animated.View>

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
                                <Animated.View style={[{ marginTop: spacing.lg, marginBottom: chapitreActuel ? 6 : spacing.md }, titreEntree]}>
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
                                </Animated.View>

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
                                    {/* HUD de réglage fin de la vitesse (long-press + glisser) */}
                                    {reglageVitesse && (
                                        <Animated.View
                                            entering={FadeIn.duration(120)}
                                            pointerEvents="none"
                                            style={{ position: 'absolute', top: -74, left: 0, right: 0, alignItems: 'center', zIndex: 10 }}
                                        >
                                            <View style={{
                                                backgroundColor: 'rgba(10,27,48,0.90)',
                                                borderRadius: radius.full,
                                                borderWidth: 1, borderColor: W15,
                                                paddingHorizontal: 20, paddingVertical: 10,
                                                alignItems: 'center', gap: 7,
                                                shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
                                                shadowOpacity: 0.35, shadowRadius: 16, elevation: 10,
                                            }}>
                                                <AnimatedTextInput
                                                    editable={false}
                                                    defaultValue="×1,00"
                                                    animatedProps={vitesseProps}
                                                    style={{
                                                        fontFamily: typography.fontFamily.bold,
                                                        fontSize: 20, color: colors.or,
                                                        fontVariant: ['tabular-nums'],
                                                        padding: 0, textAlign: 'center',
                                                    }}
                                                />
                                                <View style={{ width: 210, height: 4, borderRadius: 2, backgroundColor: W15, overflow: 'hidden' }}>
                                                    <Animated.View style={[{ height: '100%', borderRadius: 2, backgroundColor: colors.or }, remplissageVitesse]} />
                                                </View>
                                            </View>
                                        </Animated.View>
                                    )}
                                    {/* speed pill — tap : cycle ; long-press + glisser : réglage fin */}
                                    <GestureDetector gesture={gesteVitesse}>
                                        <View style={{ width: 56, alignItems: 'center' }} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
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
                                        </View>
                                    </GestureDetector>

                                    <BoutonSkip sens={-1} onSkip={() => skip(reculer)} onLongSkip={() => allerChapitre(-1)} />

                                    <BoutonPlay enLecture={enLecture} chargement={enChargement} onPress={togglePlay} />

                                    <BoutonSkip sens={1} onSkip={() => skip(avancer)} onLongSkip={() => allerChapitre(1)} />

                                    {/* download */}
                                    <BoutonTelechargement piste={piste} />
                                </View>

                                {/* Volume */}
                                <VolumeBar volume={volume} onChange={changerVolume} onChangeLive={changerVolumeLive} />

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

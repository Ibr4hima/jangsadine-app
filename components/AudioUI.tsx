import { colors, spacing, typography } from '@/constants/theme'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { ReactNode, useEffect } from 'react'
import { Pressable, Text, View, ViewStyle } from 'react-native'
import Animated, {
    cancelAnimation,
    Easing,
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'

// ─── palette héros (cohérente bibliothèque / accueil / prières) ─
export const BG_TOP = '#3d6ba3'
export const BG_MID = '#2d578c'
export const BG_BOT = '#234a7a'
export const W90 = 'rgba(255,255,255,0.90)'
export const W70 = 'rgba(255,255,255,0.70)'
export const W55 = 'rgba(255,255,255,0.55)'
export const W14 = 'rgba(255,255,255,0.14)'
export const W10 = 'rgba(255,255,255,0.10)'

export const couleurBg: Record<string, string> = {
    Aqeedah: '#e8f0f8', Fiqh: '#faf3dc', Hadith: '#eaf4ee',
    'Tafsir & Sciences du Coran': '#fde8f0', Seerah: '#fdf0eb',
    Invocations: '#DEE8CE', 'Éthique & Bons comportements': '#f2eefa',
    'Séries de cours': '#EDE8D0',
}
export const couleurTxt: Record<string, string> = {
    Aqeedah: '#28558b', Fiqh: '#b8911f', Hadith: '#2d7a4f',
    'Tafsir & Sciences du Coran': '#a02060', Seerah: '#c05c2e',
    Invocations: '#06402B', 'Éthique & Bons comportements': '#6b3db5',
    'Séries de cours': '#654321',
}

// ─── icônes ───────────────────────────────────────────────────
export function IconLivre({ size = 16, color = 'white' }: { size?: number, color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M560-564v-68q33-14 67.5-21t72.5-7q26 0 51 4t49 10v64q-24-9-48.5-13.5T700-600q-38 0-73 9.5T560-564Zm0 220v-68q33-14 67.5-21t72.5-7q26 0 51 4t49 10v64q-24-9-48.5-13.5T700-380q-38 0-73 9t-67 27Zm0-110v-68q33-14 67.5-21t72.5-7q26 0 51 4t49 10v64q-24-9-48.5-13.5T700-490q-38 0-73 9.5T560-454ZM260-320q47 0 91.5 10.5T440-278v-394q-41-24-87-36t-93-12q-36 0-71.5 7T120-692v396q35-12 69.5-18t70.5-6Zm260 42q44-21 88.5-31.5T700-320q36 0 70.5 6t69.5 18v-396q-33-14-68.5-21t-71.5-7q-47 0-93 12t-87 36v394Zm-40 118q-48-38-104-59t-116-21q-42 0-82.5 11T100-198q-21 11-40.5-1T40-234v-482q0-11 5.5-21T62-752q46-24 96-36t102-12q58 0 113.5 15T480-740q51-30 106.5-45T700-800q52 0 102 12t96 36q11 5 16.5 15t5.5 21v482q0 23-19.5 35t-40.5 1q-37-20-77.5-31T700-240q-60 0-116 21t-104 59Z" fill={color} />
        </Svg>
    )
}
export function IconCasque({ size = 16, color = 'white' }: { size?: number, color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M360-120H200q-33 0-56.5-23.5T120-200v-280q0-75 28.5-140.5t77-114q48.5-48.5 114-77T480-840q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-480v280q0 33-23.5 56.5T760-120H600v-320h160v-40q0-117-81.5-198.5T480-760q-117 0-198.5 81.5T200-480v40h160v320Z" fill={color} />
        </Svg>
    )
}
export function IconPlay({ size = 16, color = 'white' }: { size?: number, color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M320-200v-560l440 280-440 280Z" fill={color} />
        </Svg>
    )
}
export function IconMusicNote({ size = 18, color = 'white' }: { size?: number, color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M400-120q-66 0-113-47t-47-113q0-66 47-113t113-47q23 0 42.5 5.5T480-418v-422h240v160H560v400q0 66-47 113t-113 47Z" fill={color} />
        </Svg>
    )
}
export function IconMusicCast({ size = 18, color = 'white' }: { size?: number, color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M560-160q-66 0-113-47t-47-113q0-66 47-113t113-47q23 0 42.5 5.5T640-458v-342h240v120H720v360q0 66-47 113t-113 47ZM80-320q0-99 38-186.5T221-659q65-65 152.5-103T560-800v80q-82 0-155 31.5t-127.5 86Q378-590 436-615t124-25v80q-100 0-170 70t-70 170h-80Z" fill={color} />
        </Svg>
    )
}
export function IconPause({ size = 16, color = 'white' }: { size?: number, color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M560-200v-560h160v560H560Zm-320 0v-560h160v560H240Z" fill={color} />
        </Svg>
    )
}

// ─── pressable avec scale ressort ─────────────────────────────
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function PressableScale({ onPress, style, children }: {
    onPress: () => void
    style?: ViewStyle | ViewStyle[]
    children: ReactNode
}) {
    const s = useSharedValue(1)
    const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }))
    return (
        <AnimatedPressable
            onPressIn={() => { s.value = withSpring(0.975, { damping: 18, stiffness: 420 }) }}
            onPressOut={() => { s.value = withSpring(1, { damping: 15, stiffness: 320 }) }}
            onPress={onPress}
            style={[style as any, a]}
        >
            {children}
        </AnimatedPressable>
    )
}

// ─── ondulation type Apple Podcasts ──────────────────────────
// 5 points ronds qui s'étirent verticalement en capsules depuis
// le centre, chacun avec son propre rythme organique
export function MiniEgaliseur({ color = 'white', hauteur = 18, epaisseur = 2.5 }: { color?: string, hauteur?: number, epaisseur?: number }) {
    const v1 = useSharedValue(0)
    const v2 = useSharedValue(0)
    const v3 = useSharedValue(0)
    const v4 = useSharedValue(0)
    const v5 = useSharedValue(0)

    useEffect(() => {
        const lancer = (v: typeof v1, etapes: [number, number][]) => {
            v.value = withRepeat(
                withSequence(...etapes.map(([h, d]) =>
                    withTiming(h, { duration: d, easing: Easing.inOut(Easing.ease) })
                )),
                -1, false,
            )
        }
        lancer(v1, [[0.55, 260], [0.15, 300], [0.90, 240], [0.30, 320], [0.70, 280], [0.05, 300]])
        lancer(v2, [[1.00, 230], [0.40, 270], [0.80, 250], [0.10, 310], [0.95, 260], [0.50, 240]])
        lancer(v3, [[0.30, 280], [0.85, 240], [0.20, 300], [1.00, 250], [0.45, 290], [0.75, 230]])
        lancer(v4, [[0.70, 250], [0.25, 290], [0.60, 260], [0.05, 280], [0.85, 240], [0.35, 300]])
        lancer(v5, [[0.20, 300], [0.65, 250], [0.10, 290], [0.50, 270], [0.90, 230], [0.25, 310]])
        return () => {
            cancelAnimation(v1); cancelAnimation(v2); cancelAnimation(v3)
            cancelAnimation(v4); cancelAnimation(v5)
        }
    }, [])

    const H = hauteur
    const ep = epaisseur
    const s1 = useAnimatedStyle(() => ({ height: ep + v1.value * (H - ep) }))
    const s2 = useAnimatedStyle(() => ({ height: ep + v2.value * (H - ep) }))
    const s3 = useAnimatedStyle(() => ({ height: ep + v3.value * (H - ep) }))
    const s4 = useAnimatedStyle(() => ({ height: ep + v4.value * (H - ep) }))
    const s5 = useAnimatedStyle(() => ({ height: ep + v5.value * (H - ep) }))
    const barre = { width: ep, borderRadius: ep / 2, backgroundColor: color } as const

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: ep * 0.8, height: H }}>
            <Animated.View style={[barre, s1]} />
            <Animated.View style={[barre, s2]} />
            <Animated.View style={[barre, s3]} />
            <Animated.View style={[barre, s4]} />
            <Animated.View style={[barre, s5]} />
        </View>
    )
}
// ─── squelettes de chargement (pulse) ─────────────────────────
export function Squelette({ h, style }: { h: number, style?: ViewStyle }) {
    const op = useSharedValue(0.35)
    useEffect(() => {
        op.value = withRepeat(withSequence(
            withTiming(0.65, { duration: 700, easing: Easing.inOut(Easing.ease) }),
            withTiming(0.35, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        ), -1, true)
        return () => cancelAnimation(op)
    }, [])
    const a = useAnimatedStyle(() => ({ opacity: op.value }))
    return <Animated.View style={[{ height: h, borderRadius: 18, backgroundColor: '#dde3ea' }, style, a]} />
}

export function Squelettes({ n = 4, h = 76 }: { n?: number, h?: number }) {
    return (
        <View style={{ gap: spacing.sm }}>
            {Array.from({ length: n }).map((_, i) => <Squelette key={i} h={h} />)}
        </View>
    )
}

// ─── héros dégradé ────────────────────────────────────────────
export function HerosDetail({ paddingTop, children }: { paddingTop: number, children: ReactNode }) {
    return (
        <View style={{ borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' }}>
            <LinearGradient
                colors={[BG_TOP, BG_MID, BG_BOT]}
                locations={[0, 0.6, 1]}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <View style={{ position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(140,180,230,0.12)', top: -140, right: -100 }} />
            <View style={{ position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(214,173,58,0.06)', bottom: -80, left: -70 }} />

            <View style={{ paddingTop, paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }}>
                {children}
            </View>
        </View>
    )
}

// ─── bouton pilule du héros (verre dépoli) ────────────────────
export function BoutonHeros({ icone, label, onPress, actif }: {
    icone: ReactNode
    label: string
    onPress: () => void
    actif?: boolean
}) {
    return (
        <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress() }}
            style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 8,
                backgroundColor: actif ? 'rgba(214,173,58,0.28)' : W10,
                borderWidth: 1, borderColor: actif ? 'rgba(214,173,58,0.6)' : W14,
                borderRadius: 999,
                paddingHorizontal: spacing.lg, paddingVertical: 10,
                opacity: pressed ? 0.75 : 1,
            })}
        >
            {icone}
            <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.sm, color: 'white' }}>
                {label}
            </Text>
        </Pressable>
    )
}

// ─── en-tête de section du contenu ────────────────────────────
export function EnTeteSection({ eyebrow, titre }: { eyebrow: string, titre?: string }) {
    return (
        <View style={{ marginBottom: spacing.md }}>
            <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, letterSpacing: 1.6, color: colors.or, textTransform: 'uppercase' }}>
                {eyebrow}
            </Text>
            {titre ? (
                <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xl, color: colors.texte, marginTop: 4 }}>
                    {titre}
                </Text>
            ) : null}
        </View>
    )
}

// ─── état vide ────────────────────────────────────────────────
export function EtatVideDetail({ message }: { message: string }) {
    return (
        <Animated.View entering={FadeIn.duration(300)} style={{ alignItems: 'center', paddingVertical: spacing['3xl'] }}>
            <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.base, color: colors.texteMuted, textAlign: 'center' }}>
                {message}
            </Text>
        </Animated.View>
    )
}

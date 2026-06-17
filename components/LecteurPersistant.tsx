import { MiniEgaliseur } from '@/components/AudioUI'
import { colors, radius, spacing, typography } from '@/constants/theme'
import { useAudio, useAudioProgress } from '@/contexts/AudioContext'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { ReactNode, useEffect } from 'react'
import { Pressable, View, ViewStyle } from 'react-native'
import Animated, {
    cancelAnimation,
    Easing,
    FadeInDown,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'
import TextTicker from 'react-native-text-ticker'

// ─── palette (identique aux héros de l'app) ───────────────────
const BG_L = '#3d6ba3'
const BG_R = '#1c3d66'
const W70 = 'rgba(255,255,255,0.70)'

const W12 = 'rgba(255,255,255,0.12)'

// ─── icônes ───────────────────────────────────────────────────
function IconPlay({ size = 20, color = 'white' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M320-200v-560l440 280-440 280Z" fill={color} />
        </Svg>
    )
}
function IconPause({ size = 20, color = 'white' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M560-200v-560h160v560H560Zm-320 0v-560h160v560H240Z" fill={color} />
        </Svg>
    )
}
function IconSuivant({ size = 20, color = 'white' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M660-240v-480h80v480h-80Zm-440 0v-480l360 240-360 240Zm80-240Zm0 90 136-90-136-90v180Z" fill={color} />
        </Svg>
    )
}

// ─── égaliseur au repos (5 points dorés statiques) ────────────
function BarresRepos() {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2.5 }}>
            {[6, 11, 16, 11, 6].map((h, i) => (
                <View key={i} style={{ width: 2.5, height: h, borderRadius: 1.5, backgroundColor: colors.or, opacity: 0.85 }} />
            ))}
        </View>
    )
}

// ─── bouton scale ressort ─────────────────────────────────────
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

function Tap({ onPress, style, children, hitSlop = 12 }: {
    onPress: () => void
    style?: ViewStyle
    children: ReactNode
    hitSlop?: number
}) {
    const s = useSharedValue(1)
    const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }))
    return (
        <AnimatedPressable
            onPressIn={() => { s.value = withSpring(0.82, { damping: 16, stiffness: 500 }) }}
            onPressOut={() => { s.value = withSpring(1, { damping: 14, stiffness: 340 }) }}
            onPress={onPress}
            hitSlop={{ top: hitSlop, bottom: hitSlop, left: hitSlop, right: hitSlop }}
            style={[style, a]}
        >
            {children}
        </AnimatedPressable>
    )
}

// ─── sous-composant isolant les mises à jour ~2×/s ───────────
// Lui seul s'abonne à useAudioProgress. Le corps du lecteur ne
// dépend que de useAudio (piste/lecture, valeurs stables), donc il
// ne se re-render plus à chaque tick : seule la barre se rafraîchit,
// ce qui évite la surchauffe sur longue écoute.

function BarreProgression() {
    const { progression } = useAudioProgress()
    return (
        <View style={{ height: 3, backgroundColor: W12 }}>
            <View style={{
                width: `${progression}%` as any,
                height: '100%',
                backgroundColor: colors.or,
                borderTopRightRadius: 2,
                borderBottomRightRadius: 2,
            }} />
        </View>
    )
}

// ─── mini lecteur persistant ──────────────────────────────────
export default function LecteurPersistant() {
    const { piste, enLecture, pause, reprendre, pisterSuivante, setLecteurOuvert } = useAudio()

    // Pulsation subtile du bouton play
    const playScale = useSharedValue(1)
    useEffect(() => {
        if (enLecture) {
            playScale.value = withRepeat(
                withSequence(
                    withTiming(1.06, { duration: 900, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1,    { duration: 900, easing: Easing.inOut(Easing.ease) }),
                ),
                -1, true
            )
        } else {
            cancelAnimation(playScale)
            playScale.value = withTiming(1, { duration: 220 })
        }
    }, [enLecture])
    const playPulse = useAnimatedStyle(() => ({ transform: [{ scale: playScale.value }] }))

    // Rebond de la vignette au changement de piste
    const artScale = useSharedValue(1)
    useEffect(() => {
        artScale.value = withSequence(
            withSpring(0.86, { damping: 14, stiffness: 320 }),
            withSpring(1,    { damping: 12, stiffness: 260 }),
        )
    }, [piste?.id])
    const artStyle = useAnimatedStyle(() => ({ transform: [{ scale: artScale.value }] }))

    if (!piste) return null

    const sousTitreArabe = /[؀-ۿ]/.test(piste.sheikh)

    const ouvrir = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        setLecteurOuvert(true)
    }
    const onPressPlay = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        enLecture ? pause() : reprendre()
    }
    const onPressSuivant = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        pisterSuivante()
    }

    return (
        <Animated.View
            entering={FadeInDown.springify().damping(18).stiffness(160)}
            style={{
                borderRadius: 22,
                overflow: 'hidden',
                shadowColor: '#08162a',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.26,
                shadowRadius: 24,
                elevation: 14,
            }}
        >
            <LinearGradient
                colors={[BG_L, BG_R]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            >
                {/* Barre de progression dorée */}
                <BarreProgression />

                {/* Corps : [Pressable ouvrir] | [Boutons] */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingLeft: 9,
                    paddingRight: 10,
                    paddingVertical: 7,
                    gap: 9,
                }}>
                    {/* Zone pressable ouvrir le lecteur (logo + info) */}
                    <Pressable
                        onPress={ouvrir}
                        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9, minWidth: 0 }}
                    >
                        {/* Vignette égaliseur */}
                        <Animated.View style={[{
                            width: 38, height: 38,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }, artStyle]}>
                            {enLecture
                                ? <MiniEgaliseur color={colors.or} hauteur={16} />
                                : <BarresRepos />}
                        </Animated.View>

                        {/* Titre + sheikh */}
                        <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
                            <TextTicker
                                style={{
                                    fontFamily: typography.fontFamily.semibold,
                                    fontSize: typography.size.sm,
                                    color: '#fff',
                                }}
                                loop bounce={false} repeatSpacer={60} marqueeDelay={2500} scrollSpeed={18}
                            >
                                {piste.titre}
                            </TextTicker>
                            <TextTicker
                                style={{
                                    fontFamily: sousTitreArabe ? typography.fontFamily.arabic : typography.fontFamily.regular,
                                    fontSize: typography.size.xs,
                                    color: W70,
                                } as any}
                                loop bounce={false} repeatSpacer={50} marqueeDelay={3500} scrollSpeed={18}
                            >
                                {piste.sheikh}
                            </TextTicker>
                        </View>
                    </Pressable>

                    {/* Boutons de contrôle (indépendants du Pressable ouvrir) */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                        {/* Skip suivant */}
                        <Tap onPress={onPressSuivant} style={{
                            width: 31, height: 31, borderRadius: 16,
                            backgroundColor: W12,
                            alignItems: 'center', justifyContent: 'center',
                        }}>
                            <IconSuivant size={17} color="rgba(255,255,255,0.80)" />
                        </Tap>

                        {/* Play / Pause : fond doré, icône bleue */}
                        <Animated.View style={playPulse}>
                            <Tap onPress={onPressPlay} style={{
                                width: 39, height: 39, borderRadius: 20,
                                backgroundColor: colors.or,
                                alignItems: 'center', justifyContent: 'center',
                                shadowColor: colors.or,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.50,
                                shadowRadius: 10,
                                elevation: 7,
                            }}>
                                {enLecture
                                    ? <IconPause size={17} color={colors.bleu} />
                                    : <IconPlay size={17} color={colors.bleu} />}
                            </Tap>
                        </Animated.View>
                    </View>
                </View>
            </LinearGradient>
        </Animated.View>
    )
}

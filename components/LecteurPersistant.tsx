import { colors, radius, spacing, typography } from '@/constants/theme'
import { useAudio } from '@/contexts/AudioContext'
import * as Haptics from 'expo-haptics'
import { ReactNode, useEffect } from 'react'
import { Image, Pressable, View, ViewStyle } from 'react-native'
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
function IconSuivant({ size = 22, color = '#8e98a4' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M660-240v-480h80v480h-80Zm-440 0v-480l360 240-360 240Zm80-240Zm0 90 136-90-136-90v180Z" fill={color} />
        </Svg>
    )
}

function formaterTemps(s: number) {
    if (!s || isNaN(s)) return '0:00'
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = Math.floor(s % 60)
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
    return `${m}:${sec.toString().padStart(2, '0')}`
}

// ─── bouton avec scale ressort ────────────────────────────────
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

function Tap({ onPress, style, children, hitSlop = 10 }: {
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
            onPress={e => { e.stopPropagation?.(); onPress() }}
            hitSlop={{ top: hitSlop, bottom: hitSlop, left: hitSlop, right: hitSlop }}
            style={[style, a]}
        >
            {children}
        </AnimatedPressable>
    )
}

export default function LecteurPersistant() {
    const { piste, enLecture, progression, tempsActuel, dureeTotal, pause, reprendre, pisterSuivante, setLecteurOuvert } = useAudio()

    // Pulsation du bouton play pendant la lecture
    const playScale = useSharedValue(1)
    useEffect(() => {
        if (enLecture) {
            playScale.value = withRepeat(
                withSequence(
                    withTiming(1.05, { duration: 950, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 950, easing: Easing.inOut(Easing.ease) }),
                ),
                -1, true
            )
        } else {
            cancelAnimation(playScale)
            playScale.value = withTiming(1, { duration: 220 })
        }
    }, [enLecture])
    const playPulse = useAnimatedStyle(() => ({ transform: [{ scale: playScale.value }] }))

    // Scale de la vignette logo quand on change de piste
    const artScale = useSharedValue(1)
    useEffect(() => {
        artScale.value = withSequence(
            withSpring(0.88, { damping: 14, stiffness: 320 }),
            withSpring(1, { damping: 12, stiffness: 260 }),
        )
    }, [piste?.id])
    const artStyle = useAnimatedStyle(() => ({ transform: [{ scale: artScale.value }] }))

    if (!piste) return null

    const onPressPlay = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        enLecture ? pause() : reprendre()
    }
    const onPressSuivant = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        pisterSuivante()
    }

    return (
        <Animated.View entering={FadeInDown.springify().damping(18).stiffness(160)}>
            <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setLecteurOuvert(true) }}
                style={({ pressed }) => ({ opacity: pressed ? 0.96 : 1 })}
            >
                <View style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 28,
                    shadowColor: '#0f1f35',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.12,
                    shadowRadius: 20,
                    elevation: 10,
                    overflow: 'hidden',
                }}>
                    {/* Barre de progression dorée */}
                    <View style={{ height: 3.5, backgroundColor: '#eef0f5' }}>
                        <View style={{
                            width: `${progression}%` as any,
                            height: '100%',
                            backgroundColor: colors.or,
                            borderTopRightRadius: 2,
                            borderBottomRightRadius: 2,
                        }} />
                    </View>

                    {/* Corps */}
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingLeft: 10,
                        paddingRight: 10,
                        paddingVertical: 10,
                        gap: 10,
                    }}>
                        {/* Logo de l'app */}
                        <Animated.View style={[{
                            width: 50, height: 50,
                            borderRadius: 16,
                            overflow: 'hidden',
                            backgroundColor: '#dce8f5',
                        }, artStyle]}>
                            <Image
                                source={require('../assets/images/logo.png')}
                                style={{ width: 50, height: 50 }}
                                resizeMode="cover"
                            />
                        </Animated.View>

                        {/* Titre + sheikh + temps */}
                        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                            <TextTicker
                                style={{
                                    fontFamily: typography.fontFamily.semibold,
                                    fontSize: typography.size.base,
                                    color: colors.texte,
                                }}
                                loop bounce={false} repeatSpacer={60} marqueeDelay={2800} scrollSpeed={10}
                            >
                                {piste.titre}
                            </TextTicker>
                            <TextTicker
                                style={{
                                    fontFamily: typography.fontFamily.regular,
                                    fontSize: typography.size.xs,
                                    color: colors.texteMuted,
                                    fontVariant: ['tabular-nums'],
                                } as any}
                                loop bounce={false} repeatSpacer={40} marqueeDelay={4000} scrollSpeed={12}
                            >
                                {piste.sheikh}{dureeTotal > 0 ? ` · ${formaterTemps(tempsActuel)} / ${formaterTemps(dureeTotal)}` : ''}
                            </TextTicker>
                        </View>

                        {/* Skip suivant */}
                        <Tap onPress={onPressSuivant} style={{
                            width: 38, height: 38, borderRadius: 19,
                            alignItems: 'center', justifyContent: 'center',
                            backgroundColor: '#f4f6f9',
                        }}>
                            <IconSuivant size={21} color={colors.bleu} />
                        </Tap>

                        {/* Play / Pause */}
                        <Animated.View style={playPulse}>
                            <Tap onPress={onPressPlay} style={{
                                width: 48, height: 48, borderRadius: 24,
                                backgroundColor: colors.bleu,
                                alignItems: 'center', justifyContent: 'center',
                                shadowColor: colors.bleu,
                                shadowOffset: { width: 0, height: 5 },
                                shadowOpacity: 0.38,
                                shadowRadius: 10,
                                elevation: 7,
                            }}>
                                {enLecture ? <IconPause size={20} color="white" /> : <IconPlay size={20} color="white" />}
                            </Tap>
                        </Animated.View>
                    </View>
                </View>
            </Pressable>
        </Animated.View>
    )
}

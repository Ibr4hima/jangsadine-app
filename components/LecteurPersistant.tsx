import { colors, radius, spacing, typography } from '@/constants/theme'
import { useAudio } from '@/contexts/AudioContext'
import { useNotes } from '@/contexts/NotesContext'
import * as Haptics from 'expo-haptics'
import { ReactNode, useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View, ViewStyle } from 'react-native'
import Animated, {
    cancelAnimation,
    Easing,
    FadeInDown,
    FadeOutDown,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'
import TextTicker from 'react-native-text-ticker'

function IconPlay({ size = 18, color = 'white' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M320-200v-560l440 280-440 280Z" fill={color} />
        </Svg>
    )
}

function IconPause({ size = 18, color = 'white' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M560-200v-560h160v560H560Zm-320 0v-560h160v560H240Z" fill={color} />
        </Svg>
    )
}

// Material Symbols : skip_next
function IconSuivant({ size = 22, color = '#666' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M660-240v-480h80v480h-80Zm-440 0v-480l360 240-360 240Zm80-240Zm0 90 136-90-136-90v180Z" fill={color} />
        </Svg>
    )
}

// Material Symbols : edit_note
function IconNote({ size = 22, color = '#666' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M160-400v-80h280v80H160Zm0-160v-80h440v80H160Zm0-160v-80h440v80H160Zm360 560v-123l221-220q9-9 20-13t22-4q12 0 23 4.5t20 13.5l37 37q8 9 12.5 20t4.5 22q0 11-4 22.5T863-380L643-160H520Zm300-263-37-37 37 37ZM580-220h38l121-122-18-19-19-18-122 121v38Zm141-141-19-18 37 37-18-19Z" fill={color} />
        </Svg>
    )
}

function formaterTemps(s: number) {
    if (!s || isNaN(s)) return '0:00'
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = Math.floor(s % 60)
    if (h > 0) return h + ':' + m.toString().padStart(2, '0') + ':' + sec.toString().padStart(2, '0')
    return m + ':' + sec.toString().padStart(2, '0')
}

// ─── bouton avec retour tactile (scale ressort) ───────────────
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

function Tap({ onPress, style, children, hitSlop = 8 }: {
    onPress: () => void
    style?: ViewStyle
    children: ReactNode
    hitSlop?: number
}) {
    const s = useSharedValue(1)
    const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }))
    return (
        <AnimatedPressable
            onPressIn={() => { s.value = withSpring(0.86, { damping: 16, stiffness: 420 }) }}
            onPressOut={() => { s.value = withSpring(1, { damping: 14, stiffness: 320 }) }}
            onPress={e => { e.stopPropagation?.(); onPress() }}
            hitSlop={{ top: hitSlop, bottom: hitSlop, left: hitSlop, right: hitSlop }}
            style={[style, a]}
        >
            {children}
        </AnimatedPressable>
    )
}

// ─── égaliseur animé ──────────────────────────────────────────
function Egaliseur({ enLecture }: { enLecture: boolean }) {
    const b1 = useSharedValue(0.25)
    const b2 = useSharedValue(0.45)
    const b3 = useSharedValue(0.35)

    useEffect(() => {
        if (enLecture) {
            b1.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 320, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0.2, { duration: 420, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0.75, { duration: 380, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0.3, { duration: 350, easing: Easing.inOut(Easing.ease) }),
                ),
                -1, false
            )
            b2.value = withRepeat(
                withSequence(
                    withTiming(0.35, { duration: 280, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0.9, { duration: 360, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0.45, { duration: 310, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0.2, { duration: 330, easing: Easing.inOut(Easing.ease) }),
                ),
                -1, false
            )
            b3.value = withRepeat(
                withSequence(
                    withTiming(0.6, { duration: 370, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0.2, { duration: 300, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 450, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0.4, { duration: 290, easing: Easing.inOut(Easing.ease) }),
                ),
                -1, false
            )
        } else {
            cancelAnimation(b1)
            cancelAnimation(b2)
            cancelAnimation(b3)
            b1.value = withTiming(0.25, { duration: 400 })
            b2.value = withTiming(0.25, { duration: 400 })
            b3.value = withTiming(0.25, { duration: 400 })
        }
    }, [enLecture])

    const MAX_H = 16
    const MIN_H = 3

    const s1 = useAnimatedStyle(() => ({ height: b1.value * MAX_H + MIN_H }))
    const s2 = useAnimatedStyle(() => ({ height: b2.value * MAX_H + MIN_H }))
    const s3 = useAnimatedStyle(() => ({ height: b3.value * MAX_H + MIN_H }))

    const barStyle = {
        width: 3,
        borderRadius: 2,
        backgroundColor: enLecture ? colors.bleu : '#B8C0CC',
    } as const

    return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: MAX_H + MIN_H }}>
            <Animated.View style={[barStyle, s1]} />
            <Animated.View style={[barStyle, s2]} />
            <Animated.View style={[barStyle, s3]} />
        </View>
    )
}

export default function LecteurPersistant() {
    const { piste, enLecture, progression, tempsActuel, dureeTotal, pause, reprendre, pisterSuivante, setLecteurOuvert } = useAudio()
    const { ajouterNote } = useNotes()
    const [noteVisible, setNoteVisible] = useState(false)
    const [texteNote, setTexteNote] = useState('')

    // pulsation douce du bouton play pendant la lecture
    const playScale = useSharedValue(1)
    useEffect(() => {
        if (enLecture) {
            playScale.value = withRepeat(
                withSequence(
                    withTiming(1.04, { duration: 900, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
                ),
                -1, true
            )
        } else {
            cancelAnimation(playScale)
            playScale.value = withTiming(1, { duration: 250 })
        }
    }, [enLecture])
    const playPulse = useAnimatedStyle(() => ({ transform: [{ scale: playScale.value }] }))

    if (!piste) return null

    const onPressPlay = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        enLecture ? pause() : reprendre()
    }

    const onPressSuivant = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        pisterSuivante()
    }

    const sauvegarderNote = async () => {
        if (!texteNote.trim() || !piste) return
        await ajouterNote({
            episode_id: piste.id,
            episode_titre: piste.titre,
            sheikh: piste.sheikh,
            timestamp: tempsActuel,
            texte: texteNote.trim(),
        })
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        setTexteNote('')
        setNoteVisible(false)
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'position' : undefined}>

            {/* ── Panneau note ── */}
            {noteVisible && (
                <Animated.View
                    entering={FadeInDown.duration(250)}
                    exiting={FadeOutDown.duration(180)}
                    style={{
                        backgroundColor: colors.blanc,
                        borderRadius: radius.xl + 4,
                        padding: spacing.md,
                        marginBottom: spacing.sm,
                        shadowColor: '#1c2a3a',
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.10,
                        shadowRadius: 16,
                        elevation: 8,
                    }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: spacing.sm }}>
                        <IconNote size={18} color={colors.bleu} />
                        <Text style={{
                            flex: 1,
                            fontFamily: typography.fontFamily.semibold,
                            fontSize: typography.size.sm,
                            color: colors.bleu,
                        }}>
                            Note à {formaterTemps(tempsActuel)}
                        </Text>
                        <Pressable
                            onPress={() => { setNoteVisible(false); setTexteNote('') }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Text style={{ color: '#AAB0BD', fontSize: 16, fontWeight: '600' }}>✕</Text>
                        </Pressable>
                    </View>
                    <TextInput
                        value={texteNote}
                        onChangeText={setTexteNote}
                        placeholder="Écris ta note ici..."
                        placeholderTextColor="#C0C6D0"
                        multiline
                        autoFocus
                        style={{
                            fontFamily: typography.fontFamily.regular,
                            fontSize: typography.size.base,
                            color: colors.texte,
                            minHeight: 56,
                            maxHeight: 120,
                            textAlignVertical: 'top',
                            lineHeight: 20,
                        }}
                    />
                    <Pressable
                        onPress={sauvegarderNote}
                        style={({ pressed }) => ({
                            marginTop: spacing.sm,
                            backgroundColor: texteNote.trim() ? colors.bleu : '#c4cedb',
                            borderRadius: radius.md,
                            paddingVertical: spacing.sm,
                            alignItems: 'center',
                            transform: [{ scale: pressed ? 0.98 : 1 }],
                        })}
                    >
                        <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.sm, color: colors.blanc }}>
                            Sauvegarder
                        </Text>
                    </Pressable>
                </Animated.View>
            )}

            {/* ── Mini lecteur ── */}
            <Animated.View entering={FadeInDown.duration(350)}>
                <Pressable onPress={() => setLecteurOuvert(true)}>
                    <View style={{
                        backgroundColor: colors.blanc,
                        borderRadius: 26,
                        shadowColor: '#1c2a3a',
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.10,
                        shadowRadius: 16,
                        elevation: 8,
                        overflow: 'hidden',
                    }}>
                        {/* Barre de progression */}
                        <View style={{ height: 3, backgroundColor: '#EEF0F5' }}>
                            <View style={{
                                width: `${progression}%` as any,
                                height: '100%',
                                backgroundColor: colors.or,
                                borderTopRightRadius: 2,
                                borderBottomRightRadius: 2,
                            }} />
                        </View>

                        {/* Contenu */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingLeft: spacing.md,
                            paddingRight: spacing.sm + 2,
                            paddingVertical: spacing.sm + 1,
                            gap: spacing.sm,
                        }}>
                            {/* Égaliseur */}
                            <View style={{
                                width: 44,
                                height: 44,
                                borderRadius: 14,
                                backgroundColor: '#EBF2FC',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <Egaliseur enLecture={enLecture} />
                            </View>

                            {/* Infos */}
                            <View style={{ flex: 1, minWidth: 0 }}>
                                <TextTicker
                                    style={{
                                        fontFamily: typography.fontFamily.semibold,
                                        fontSize: typography.size.sm,
                                        color: colors.texte,
                                    }}
                                    loop bounce={false} repeatSpacer={50} marqueeDelay={2500} scrollSpeed={10}
                                >
                                    {piste.titre}
                                </TextTicker>
                                <Text numberOfLines={1} style={{
                                    fontFamily: typography.fontFamily.regular,
                                    fontSize: typography.size.xs,
                                    color: colors.texteMuted,
                                    marginTop: 2,
                                    fontVariant: ['tabular-nums'],
                                }}>
                                    {piste.sheikh} · {formaterTemps(tempsActuel)}{dureeTotal > 0 ? ` / ${formaterTemps(dureeTotal)}` : ''}
                                </Text>
                            </View>

                            {/* Note */}
                            <Tap onPress={() => setNoteVisible(p => !p)} style={{
                                width: 36, height: 36, borderRadius: 18,
                                alignItems: 'center', justifyContent: 'center',
                                backgroundColor: noteVisible ? '#EBF2FC' : 'transparent',
                            }}>
                                <IconNote size={21} color={noteVisible ? colors.bleu : '#8e98a4'} />
                            </Tap>

                            {/* Suivant */}
                            <Tap onPress={onPressSuivant} style={{
                                width: 36, height: 36, borderRadius: 18,
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                <IconSuivant size={22} color="#8e98a4" />
                            </Tap>

                            {/* Play / Pause */}
                            <Animated.View style={playPulse}>
                                <Tap onPress={onPressPlay} style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 22,
                                    backgroundColor: colors.bleu,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    shadowColor: colors.bleu,
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.32,
                                    shadowRadius: 9,
                                    elevation: 6,
                                }}>
                                    {enLecture ? <IconPause size={19} color="white" /> : <IconPlay size={19} color="white" />}
                                </Tap>
                            </Animated.View>
                        </View>
                    </View>
                </Pressable>
            </Animated.View>

        </KeyboardAvoidingView>
    )
}

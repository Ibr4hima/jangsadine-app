import { colors, radius, spacing, typography } from '@/constants/theme'
import { useAudio } from '@/contexts/AudioContext'
import { useNotes } from '@/contexts/NotesContext'
import { SkipForward } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native'
import Animated, {
    cancelAnimation,
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'
import TextTicker from 'react-native-text-ticker'

function IconPlay({ size = 18, color = 'white' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z" fill={color} />
        </Svg>
    )
}

function IconPause({ size = 18, color = 'white' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M520-200v-560h240v560H520Zm-320 0v-560h240v560H200Zm400-80h80v-400h-80v400Zm-320 0h80v-400h-80v400Zm0-400v400-400Zm320 0v400-400Z" fill={color} />
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

// Animated equalizer bars
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
    const { piste, enLecture, progression, tempsActuel, dureeTotal, pause, reprendre, pisterSuivante } = useAudio()
    const { ajouterNote } = useNotes()
    const [noteVisible, setNoteVisible] = useState(false)
    const [texteNote, setTexteNote] = useState('')
    const [pleinEcran, setPleinEcran] = useState(false)

    if (!piste) return null

    const onPressPlay = () => enLecture ? pause() : reprendre()

    const sauvegarderNote = async () => {
        if (!texteNote.trim() || !piste) return
        await ajouterNote({
            episode_id: piste.id,
            episode_titre: piste.titre,
            sheikh: piste.sheikh,
            timestamp: tempsActuel,
            texte: texteNote.trim(),
        })
        setTexteNote('')
        setNoteVisible(false)
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'position' : undefined}>

            {/* Note panel */}
            {noteVisible && (
                <View style={{
                    backgroundColor: colors.blanc,
                    borderRadius: radius.xl,
                    borderWidth: 1,
                    borderColor: '#E2E6EE',
                    padding: spacing.md,
                    marginBottom: spacing.sm,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.08,
                    shadowRadius: 16,
                    elevation: 8,
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                        <Text style={{
                            flex: 1,
                            fontFamily: typography.fontFamily.semibold,
                            fontSize: typography.size.sm,
                            color: colors.bleu,
                        }}>
                            📝 Note à {formaterTemps(tempsActuel)}
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
                        style={{
                            marginTop: spacing.sm,
                            backgroundColor: colors.bleu,
                            borderRadius: radius.md,
                            paddingVertical: spacing.sm,
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.sm, color: colors.blanc }}>
                            Sauvegarder
                        </Text>
                    </Pressable>
                </View>
            )}

            {/* Mini player */}
            <Pressable onPress={() => setPleinEcran(true)}>
                <View style={{
                    backgroundColor: colors.blanc,
                    borderRadius: 22,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.09,
                    shadowRadius: 18,
                    elevation: 10,
                    overflow: 'hidden',
                }}>
                    {/* Progress bar at top */}
                    <View style={{ height: 2.5, backgroundColor: '#EEF0F5' }}>
                        <View style={{
                            width: `${progression}%` as any,
                            height: '100%',
                            backgroundColor: colors.bleu,
                        }} />
                    </View>

                    {/* Content */}
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm + 2,
                        gap: spacing.sm,
                    }}>
                        {/* Equalizer box */}
                        <View style={{
                            width: 44,
                            height: 44,
                            borderRadius: radius.md,
                            backgroundColor: '#EBF2FC',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Egaliseur enLecture={enLecture} />
                        </View>

                        {/* Info */}
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
                            }}>
                                {piste.sheikh} · {formaterTemps(tempsActuel)}
                            </Text>
                        </View>

                        {/* Add note */}
                        <Pressable
                            onPress={e => { e.stopPropagation?.(); setNoteVisible(p => !p) }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={{ padding: 4 }}
                        >
                            <Text style={{ fontSize: 18 }}>📝</Text>
                        </Pressable>

                        {/* Next track */}
                        <Pressable
                            onPress={e => { e.stopPropagation?.(); pisterSuivante() }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={{ padding: 4 }}
                        >
                            <SkipForward size={20} color={colors.texteMuted} strokeWidth={1.8} />
                        </Pressable>

                        {/* Play / Pause */}
                        <Pressable
                            onPress={e => { e.stopPropagation?.(); onPressPlay() }}
                            style={{
                                width: 42,
                                height: 42,
                                borderRadius: radius.full,
                                backgroundColor: colors.bleu,
                                alignItems: 'center',
                                justifyContent: 'center',
                                shadowColor: colors.bleu,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 6,
                            }}
                        >
                            {enLecture ? <IconPause size={18} color="white" /> : <IconPlay size={18} color="white" />}
                        </Pressable>
                    </View>
                </View>
            </Pressable>

            {/* Full screen player */}
            {pleinEcran && (() => {
                const LecteurPleinEcran = require('./LecteurPleinEcran').default
                return <LecteurPleinEcran visible={pleinEcran} onClose={() => setPleinEcran(false)} />
            })()}
        </KeyboardAvoidingView>
    )
}

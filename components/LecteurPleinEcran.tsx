import { colors, radius, spacing, typography } from '@/constants/theme'
import { useAudio } from '@/contexts/AudioContext'
import { supabase } from '@/lib/supabase'
import { ChevronDown, ListMusic, Moon, SkipBack, SkipForward } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import {
    Animated as RNAnimated,
    Dimensions,
    Image,
    Modal,
    PanResponder,
    Pressable,
    ScrollView,
    StatusBar,
    Text,
    View,
} from 'react-native'
import Animated, {
    cancelAnimation,
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import TextTicker from 'react-native-text-ticker'
import Svg, { Path } from 'react-native-svg'

function IconReplay10({ size = 32, color = colors.texte }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M339.5-108.5q-65.5-28.5-114-77t-77-114Q120-365 120-440h80q0 117 81.5 198.5T480-160q117 0 198.5-81.5T760-440q0-117-81.5-198.5T480-720h-6l62 62-56 58-160-160 160-160 56 58-62 62h6q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-440q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-80q-75 0-140.5-28.5ZM360-320v-180h-60v-60h120v240h-60Zm140 0q-17 0-28.5-11.5T460-360v-160q0-17 11.5-28.5T500-560h80q17 0 28.5 11.5T620-520v160q0 17-11.5 28.5T580-320h-80Zm20-60h40v-120h-40v120Z" fill={color} />
        </Svg>
    )
}

function IconForward10({ size = 32, color = colors.texte }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M360-320v-180h-60v-60h120v240h-60Zm140 0q-17 0-28.5-11.5T460-360v-160q0-17 11.5-28.5T500-560h80q17 0 28.5 11.5T620-520v160q0 17-11.5 28.5T580-320h-80Zm20-60h40v-120h-40v120ZM339.5-108.5q-65.5-28.5-114-77t-77-114Q120-365 120-440t28.5-140.5q28.5-65.5 77-114t114-77Q405-800 480-800h6l-62-62 56-58 160 160-160 160-56-58 62-62h-6q-117 0-198.5 81.5T200-440q0 117 81.5 198.5T480-160q117 0 198.5-81.5T760-440h80q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-80q-75 0-140.5-28.5Z" fill={color} />
        </Svg>
    )
}

function IconPlay({ size = 34, color = 'white' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z" fill={color} />
        </Svg>
    )
}

function IconPause({ size = 34, color = 'white' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M520-200v-560h240v560H520Zm-320 0v-560h240v560H200Zm400-80h80v-400h-80v400Zm-320 0h80v-400h-80v400Zm0-400v400-400Zm320 0v400-400Z" fill={color} />
        </Svg>
    )
}

function IconSpeed({ size = 18, color = colors.texte }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M480-316.5q38-.5 56-27.5l224-336-336 224q-27 18-28.5 55t22.5 61q24 24 62 23.5Zm0-483.5q59 0 113.5 16.5T696-734l-76 48q-33-17-68.5-25.5T480-720q-133 0-226.5 93.5T160-400q0 42 11.5 83t32.5 77h552q23-38 33.5-79t10.5-85q0-36-8.5-70T766-540l48-76q30 47 47.5 100T880-406q1 57-13 109t-41 99q-11 18-30 28t-40 10H204q-21 0-40-10t-30-28q-26-45-40-95.5T80-400q0-83 31.5-155.5t86-127Q252-737 325-768.5T480-800Zm7 313Z" fill={color} />
        </Svg>
    )
}

function IconInfo({ size = 20, color = colors.texte }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M423.5-703.5Q400-727 400-760t23.5-56.5Q447-840 480-840t56.5 23.5Q560-793 560-760t-23.5 56.5Q513-680 480-680t-56.5-23.5ZM420-120v-480h120v480H420Z" fill={color} />
        </Svg>
    )
}

function IconListChapters({ size = 20, color = colors.texte }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M280-600v-80h560v80H280Zm0 160v-80h560v80H280Zm0 160v-80h560v80H280ZM160-600q-17 0-28.5-11.5T120-640q0-17 11.5-28.5T160-680q17 0 28.5 11.5T200-640q0 17-11.5 28.5T160-600Zm0 160q-17 0-28.5-11.5T120-480q0-17 11.5-28.5T160-520q17 0 28.5 11.5T200-480q0 17-11.5 28.5T160-440Zm0 160q-17 0-28.5-11.5T120-320q0-17 11.5-28.5T160-360q17 0 28.5 11.5T200-320q0 17-11.5 28.5T160-280Z" fill={color} />
        </Svg>
    )
}

const { width, height } = Dimensions.get('window')
const ARTWORK_SIZE = width * 0.70

const VITESSES = [0.75, 1, 1.25, 1.5, 2]
const SLEEP_OPTIONS = [
    { label: 'Désactivé', minutes: 0 },
    { label: '5 min', minutes: 5 },
    { label: '10 min', minutes: 10 },
    { label: '15 min', minutes: 15 },
    { label: '30 min', minutes: 30 },
    { label: '45 min', minutes: 45 },
    { label: '1h', minutes: 60 },
]

function formaterTemps(s: number) {
    if (!s || isNaN(s)) return '0:00'
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = Math.floor(s % 60)
    if (h > 0) return h + ':' + m.toString().padStart(2, '0') + ':' + sec.toString().padStart(2, '0')
    return m + ':' + sec.toString().padStart(2, '0')
}

function formaterSleep(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return m + ':' + sec.toString().padStart(2, '0')
}

function ArtworkAnime({ enLecture }: { enLecture: boolean }) {
    const artScale = useSharedValue(enLecture ? 1 : 0.93)
    const pulseScale = useSharedValue(1)
    const pulseOpacity = useSharedValue(0)
    const pulse2Scale = useSharedValue(1)
    const pulse2Opacity = useSharedValue(0)

    useEffect(() => {
        if (enLecture) {
            artScale.value = withSpring(1, { damping: 14, stiffness: 90 })

            pulseScale.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 0 }),
                    withTiming(1.45, { duration: 2400, easing: Easing.out(Easing.quad) })
                ),
                -1, false
            )
            pulseOpacity.value = withRepeat(
                withSequence(
                    withTiming(0.28, { duration: 0 }),
                    withTiming(0, { duration: 2400 })
                ),
                -1, false
            )

            // Second ring slightly offset (longer cycle creates natural drift)
            pulse2Scale.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 800 }),
                    withTiming(1.45, { duration: 2400, easing: Easing.out(Easing.quad) })
                ),
                -1, false
            )
            pulse2Opacity.value = withRepeat(
                withSequence(
                    withTiming(0, { duration: 800 }),
                    withTiming(0.18, { duration: 0 }),
                    withTiming(0, { duration: 2400 })
                ),
                -1, false
            )
        } else {
            artScale.value = withSpring(0.93, { damping: 14, stiffness: 90 })
            cancelAnimation(pulseScale)
            cancelAnimation(pulseOpacity)
            cancelAnimation(pulse2Scale)
            cancelAnimation(pulse2Opacity)
            pulseOpacity.value = withTiming(0, { duration: 400 })
            pulse2Opacity.value = withTiming(0, { duration: 400 })
        }
    }, [enLecture])

    const artStyle = useAnimatedStyle(() => ({
        transform: [{ scale: artScale.value }],
    }))

    const pulse1Style = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
        opacity: pulseOpacity.value,
    }))

    const pulse2Style = useAnimatedStyle(() => ({
        transform: [{ scale: pulse2Scale.value }],
        opacity: pulse2Opacity.value,
    }))

    return (
        <View style={{ width: ARTWORK_SIZE + 60, height: ARTWORK_SIZE + 60, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={[{
                position: 'absolute',
                width: ARTWORK_SIZE,
                height: ARTWORK_SIZE,
                borderRadius: 28,
                borderWidth: 1.5,
                borderColor: colors.bleu,
            }, pulse2Style]} />
            <Animated.View style={[{
                position: 'absolute',
                width: ARTWORK_SIZE,
                height: ARTWORK_SIZE,
                borderRadius: 28,
                borderWidth: 1.5,
                borderColor: colors.bleu,
            }, pulse1Style]} />
            <Animated.View style={[{
                width: ARTWORK_SIZE,
                height: ARTWORK_SIZE,
                borderRadius: 28,
                backgroundColor: colors.blanc,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.10,
                shadowRadius: 40,
                elevation: 14,
                borderWidth: 1,
                borderColor: '#EAECEF',
                overflow: 'hidden',
            }, artStyle]}>
                <Image
                    source={require('../assets/images/logo.png')}
                    style={{ width: ARTWORK_SIZE * 0.68, height: ARTWORK_SIZE * 0.68 }}
                    resizeMode="contain"
                />
            </Animated.View>
        </View>
    )
}

type Props = {
    visible: boolean
    onClose: () => void
}

export default function LecteurPleinEcran({ visible, onClose }: Props) {
    const {
        piste, enLecture, tempsActuel, dureeTotal,
        vitesse, pause, reprendre, seeker, avancer, reculer,
        changerVitesse, pisterSuivante, pistePrecedente, file,
    } = useAudio()

    const [onglet, setOnglet] = useState<'player' | 'file'>('player')
    const [showVitesse, setShowVitesse] = useState(false)
    const [showSleep, setShowSleep] = useState(false)
    const [sleepMinutes, setSleepMinutes] = useState(0)
    const [sleepRestant, setSleepRestant] = useState(0)
    const sleepRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const [showDescription, setShowDescription] = useState(false)
    const [showMarkers, setShowMarkers] = useState(false)
    const [markers, setMarkers] = useState<{ id: string; titre: string; temps_secondes: number }[]>([])
    const [description, setDescription] = useState<string | null>(null)

    const slideAnim = useRef(new RNAnimated.Value(height)).current

    useEffect(() => {
        if (visible) {
            RNAnimated.spring(slideAnim, {
                toValue: 0, useNativeDriver: true, tension: 65, friction: 11,
            }).start()
        } else {
            RNAnimated.timing(slideAnim, {
                toValue: height, duration: 300, useNativeDriver: true,
            }).start()
        }
    }, [visible])

    useEffect(() => {
        if (sleepRef.current) clearInterval(sleepRef.current)
        if (sleepMinutes > 0) {
            let restant = sleepMinutes * 60
            setSleepRestant(restant)
            sleepRef.current = setInterval(() => {
                restant -= 1
                setSleepRestant(restant)
                if (restant <= 0) {
                    pause()
                    setSleepMinutes(0)
                    if (sleepRef.current) clearInterval(sleepRef.current)
                }
            }, 1000)
        } else {
            setSleepRestant(0)
        }
        return () => { if (sleepRef.current) clearInterval(sleepRef.current) }
    }, [sleepMinutes])

    useEffect(() => {
        if (!piste) return
        setMarkers([])
        setDescription(null)
        setShowDescription(false)
        setShowMarkers(false)

        supabase.from('markers').select('id, titre, temps_secondes')
            .eq('episode_id', piste.id).order('temps_secondes')
            .then(({ data }) => { if (data) setMarkers(data) })

        supabase.from('episodes').select('description')
            .eq('id', piste.id).single()
            .then(({ data }) => { if (data?.description) setDescription(data.description) })
    }, [piste?.id])

    const panResponder = useRef(PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => g.dy > 5 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_, g) => { if (g.dy > 0) slideAnim.setValue(g.dy) },
        onPanResponderRelease: (_, g) => {
            if (g.dy > 60 || g.vy > 0.3) {
                RNAnimated.timing(slideAnim, { toValue: height, duration: 250, useNativeDriver: true }).start(onClose)
            } else {
                RNAnimated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start()
            }
        },
    })).current

    if (!piste) return null

    const progressPct = dureeTotal > 0 ? (tempsActuel / dureeTotal) * 100 : 0
    const sleepActif = sleepMinutes > 0

    return (
        <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
            <RNAnimated.View style={{ flex: 1, transform: [{ translateY: slideAnim }] }}>
                <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} edges={['top', 'bottom']}>
                    <StatusBar barStyle="dark-content" />

                    {/* Drag handle */}
                    <View
                        {...panResponder.panHandlers}
                        style={{ alignItems: 'center', paddingTop: spacing.md, paddingBottom: spacing.sm }}
                    >
                        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#D8DDE6' }} />
                    </View>

                    {/* Header */}
                    <View style={{
                        flexDirection: 'row', alignItems: 'center',
                        paddingHorizontal: spacing.xl, paddingBottom: spacing.sm,
                    }}>
                        <Pressable
                            onPress={onClose}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            style={{ padding: spacing.xs, marginLeft: -spacing.xs }}
                        >
                            <ChevronDown size={26} color={colors.texte} strokeWidth={2} />
                        </Pressable>

                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <Text style={{
                                fontFamily: typography.fontFamily.bold,
                                fontSize: typography.size.xs,
                                letterSpacing: 1.5,
                                color: colors.or,
                                textTransform: 'uppercase',
                            }}>
                                {onglet === 'player' ? 'En cours d\'écoute' : 'File d\'attente'}
                            </Text>
                        </View>

                        <Pressable
                            onPress={() => setOnglet(o => o === 'player' ? 'file' : 'player')}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            style={{ padding: spacing.xs, marginRight: -spacing.xs }}
                        >
                            <ListMusic
                                size={22}
                                color={onglet === 'file' ? colors.bleu : colors.texteMuted}
                                strokeWidth={1.8}
                            />
                        </Pressable>
                    </View>

                    {onglet === 'player' ? (
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg }}
                            scrollEnabled={showDescription || showMarkers}
                        >
                            {/* Artwork */}
                            <View style={{ alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.lg }}>
                                <ArtworkAnime enLecture={enLecture} />
                            </View>

                            {/* Title + Sheikh */}
                            <View style={{ marginBottom: spacing.lg }}>
                                <TextTicker
                                    style={{
                                        fontFamily: typography.fontFamily.bold,
                                        fontSize: typography.size['2xl'],
                                        color: colors.texte,
                                        lineHeight: 32,
                                    }}
                                    loop bounce={false} repeatSpacer={50} marqueeDelay={2000} scrollSpeed={20}
                                >
                                    {piste.titre}
                                </TextTicker>
                                <Text style={{
                                    fontFamily: typography.fontFamily.regular,
                                    fontSize: typography.size.md,
                                    color: colors.texteMuted,
                                    marginTop: spacing.xs,
                                }}>
                                    {piste.sheikh}
                                </Text>
                            </View>

                            {/* Progress bar */}
                            <View style={{ marginBottom: spacing.lg }}>
                                <Pressable
                                    onPress={e => {
                                        const pct = (e.nativeEvent.locationX / (width - spacing.xl * 2)) * 100
                                        seeker(Math.max(0, Math.min(100, pct)))
                                    }}
                                    style={{ height: 44, justifyContent: 'center' }}
                                >
                                    <View style={{ height: 5, backgroundColor: '#EEF0F5', borderRadius: 5 }}>
                                        {/* Chapter marker ticks */}
                                        {dureeTotal > 0 && markers.map(m => (
                                            <View
                                                key={m.id}
                                                style={{
                                                    position: 'absolute',
                                                    left: `${(m.temps_secondes / dureeTotal) * 100}%` as any,
                                                    top: -3,
                                                    width: 2,
                                                    height: 11,
                                                    backgroundColor: colors.or,
                                                    borderRadius: 1,
                                                    opacity: 0.75,
                                                }}
                                            />
                                        ))}
                                        {/* Fill */}
                                        <View style={{
                                            width: `${progressPct}%` as any,
                                            height: '100%',
                                            backgroundColor: colors.bleu,
                                            borderRadius: 5,
                                        }} />
                                        {/* Thumb */}
                                        <View style={{
                                            position: 'absolute',
                                            left: `${progressPct}%` as any,
                                            top: -7,
                                            width: 19,
                                            height: 19,
                                            borderRadius: 10,
                                            backgroundColor: colors.blanc,
                                            borderWidth: 2.5,
                                            borderColor: colors.bleu,
                                            marginLeft: -9,
                                            shadowColor: colors.bleu,
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.3,
                                            shadowRadius: 6,
                                            elevation: 5,
                                        }} />
                                    </View>
                                </Pressable>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -spacing.xs }}>
                                    <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.xs, color: '#AAB0BD' }}>
                                        {formaterTemps(tempsActuel)}
                                    </Text>
                                    <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.xs, color: '#AAB0BD' }}>
                                        {formaterTemps(dureeTotal)}
                                    </Text>
                                </View>
                            </View>

                            {/* Main controls */}
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: spacing.xl,
                                paddingHorizontal: spacing.sm,
                            }}>
                                <Pressable
                                    onPress={pistePrecedente}
                                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                                >
                                    <SkipBack size={26} color={colors.texte} strokeWidth={1.8} fill={colors.texte} />
                                </Pressable>

                                <Pressable
                                    onPress={() => reculer(10)}
                                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                                >
                                    <IconReplay10 size={32} color={colors.texte} />
                                </Pressable>

                                <Pressable
                                    onPress={() => enLecture ? pause() : reprendre()}
                                    style={{
                                        width: 72,
                                        height: 72,
                                        borderRadius: 36,
                                        backgroundColor: colors.bleu,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        shadowColor: colors.bleu,
                                        shadowOffset: { width: 0, height: 10 },
                                        shadowOpacity: 0.38,
                                        shadowRadius: 22,
                                        elevation: 12,
                                    }}
                                >
                                    {enLecture
                                        ? <IconPause size={34} color="white" />
                                        : <IconPlay size={34} color="white" />
                                    }
                                </Pressable>

                                <Pressable
                                    onPress={() => avancer(10)}
                                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                                >
                                    <IconForward10 size={32} color={colors.texte} />
                                </Pressable>

                                <Pressable
                                    onPress={pisterSuivante}
                                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                                >
                                    <SkipForward size={26} color={colors.texte} strokeWidth={1.8} fill={colors.texte} />
                                </Pressable>
                            </View>

                            {/* Secondary controls */}
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: spacing.sm,
                                marginBottom: spacing.lg,
                            }}>
                                {/* Speed pill */}
                                <Pressable
                                    onPress={() => { setShowVitesse(p => !p); setShowSleep(false) }}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 5,
                                        paddingHorizontal: spacing.md,
                                        paddingVertical: spacing.sm,
                                        borderRadius: radius.full,
                                        backgroundColor: showVitesse ? colors.bleu : '#F2F4F7',
                                        borderWidth: showVitesse ? 0 : 1,
                                        borderColor: '#E2E6EE',
                                    }}
                                >
                                    <IconSpeed size={16} color={showVitesse ? 'white' : colors.texte} />
                                    <Text style={{
                                        fontFamily: typography.fontFamily.bold,
                                        fontSize: typography.size.sm,
                                        color: showVitesse ? 'white' : colors.texte,
                                    }}>
                                        {vitesse}×
                                    </Text>
                                </Pressable>

                                {/* Sleep pill */}
                                <Pressable
                                    onPress={() => { setShowSleep(p => !p); setShowVitesse(false) }}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 5,
                                        paddingHorizontal: spacing.md,
                                        paddingVertical: spacing.sm,
                                        borderRadius: radius.full,
                                        backgroundColor: sleepActif ? '#FDF3DC' : (showSleep ? colors.bleu : '#F2F4F7'),
                                        borderWidth: (sleepActif || showSleep) ? 0 : 1,
                                        borderColor: '#E2E6EE',
                                    }}
                                >
                                    <Moon
                                        size={15}
                                        color={sleepActif ? colors.orFonce : (showSleep ? 'white' : colors.texte)}
                                        strokeWidth={2}
                                        fill={sleepActif ? colors.or : 'none'}
                                    />
                                    <Text style={{
                                        fontFamily: typography.fontFamily.bold,
                                        fontSize: typography.size.sm,
                                        color: sleepActif ? colors.orFonce : (showSleep ? 'white' : colors.texte),
                                    }}>
                                        {sleepActif ? formaterSleep(sleepRestant) : 'Sommeil'}
                                    </Text>
                                </Pressable>
                            </View>

                            {/* Speed panel */}
                            {showVitesse && (
                                <View style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-around',
                                    backgroundColor: '#F8F9FB',
                                    borderRadius: radius.xl,
                                    padding: spacing.sm,
                                    marginBottom: spacing.lg,
                                    borderWidth: 1,
                                    borderColor: '#E8EBF2',
                                }}>
                                    {VITESSES.map(v => (
                                        <Pressable
                                            key={v}
                                            onPress={() => { changerVitesse(v); setShowVitesse(false) }}
                                            style={{
                                                paddingHorizontal: spacing.md,
                                                paddingVertical: spacing.sm,
                                                borderRadius: radius.full,
                                                backgroundColor: vitesse === v ? colors.bleu : 'transparent',
                                            }}
                                        >
                                            <Text style={{
                                                fontFamily: typography.fontFamily.semibold,
                                                fontSize: typography.size.base,
                                                color: vitesse === v ? 'white' : colors.texte,
                                            }}>
                                                {v}×
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            )}

                            {/* Sleep panel */}
                            {showSleep && (
                                <View style={{
                                    backgroundColor: '#F8F9FB',
                                    borderRadius: radius.xl,
                                    padding: spacing.md,
                                    marginBottom: spacing.lg,
                                    borderWidth: 1,
                                    borderColor: '#E8EBF2',
                                }}>
                                    <Text style={{
                                        fontFamily: typography.fontFamily.semibold,
                                        fontSize: typography.size.sm,
                                        color: colors.texteMuted,
                                        textAlign: 'center',
                                        marginBottom: spacing.sm,
                                    }}>
                                        Minuteur de sommeil
                                    </Text>
                                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' }}>
                                        {SLEEP_OPTIONS.map(opt => (
                                            <Pressable
                                                key={opt.minutes}
                                                onPress={() => { setSleepMinutes(opt.minutes); setShowSleep(false) }}
                                                style={{
                                                    paddingHorizontal: spacing.md,
                                                    paddingVertical: spacing.sm,
                                                    borderRadius: radius.full,
                                                    backgroundColor: sleepMinutes === opt.minutes ? colors.or : 'transparent',
                                                    borderWidth: 1,
                                                    borderColor: sleepMinutes === opt.minutes ? colors.or : '#DDE0EA',
                                                }}
                                            >
                                                <Text style={{
                                                    fontFamily: typography.fontFamily.medium,
                                                    fontSize: typography.size.sm,
                                                    color: sleepMinutes === opt.minutes ? 'white' : colors.texte,
                                                }}>
                                                    {opt.label}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Bottom action row */}
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: spacing['2xl'],
                                marginBottom: spacing.md,
                            }}>
                                <Pressable
                                    onPress={() => { setShowDescription(p => !p); setShowMarkers(false) }}
                                    style={{ alignItems: 'center', gap: spacing.xs }}
                                >
                                    <View style={{
                                        width: 46,
                                        height: 46,
                                        borderRadius: radius.full,
                                        backgroundColor: showDescription ? '#E8F0FA' : '#F2F4F7',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <IconInfo size={20} color={showDescription ? colors.bleu : colors.texte} />
                                    </View>
                                    <Text style={{
                                        fontFamily: typography.fontFamily.regular,
                                        fontSize: typography.size.xs,
                                        color: showDescription ? colors.bleu : colors.texteMuted,
                                    }}>
                                        Description
                                    </Text>
                                </Pressable>

                                <Pressable
                                    onPress={() => { setShowMarkers(p => !p); setShowDescription(false) }}
                                    style={{ alignItems: 'center', gap: spacing.xs }}
                                >
                                    <View style={{
                                        width: 46,
                                        height: 46,
                                        borderRadius: radius.full,
                                        backgroundColor: showMarkers ? '#E8F0FA' : '#F2F4F7',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <IconListChapters size={20} color={showMarkers ? colors.bleu : colors.texte} />
                                    </View>
                                    <Text style={{
                                        fontFamily: typography.fontFamily.regular,
                                        fontSize: typography.size.xs,
                                        color: showMarkers ? colors.bleu : colors.texteMuted,
                                    }}>
                                        Chapitres
                                    </Text>
                                </Pressable>
                            </View>

                            {/* Description panel */}
                            {showDescription && (
                                <View style={{
                                    backgroundColor: '#F8F9FB',
                                    borderRadius: radius.xl,
                                    borderWidth: 1,
                                    borderColor: '#E8EBF2',
                                    padding: spacing.lg,
                                    marginBottom: spacing.md,
                                }}>
                                    <Text style={{
                                        fontFamily: typography.fontFamily.regular,
                                        fontSize: typography.size.base,
                                        color: description ? colors.texte : colors.texteMuted,
                                        lineHeight: 22,
                                        textAlign: description ? 'left' : 'center',
                                    }}>
                                        {description ?? 'Aucune description disponible'}
                                    </Text>
                                </View>
                            )}

                            {/* Chapters panel */}
                            {showMarkers && (
                                <View style={{
                                    backgroundColor: '#F8F9FB',
                                    borderRadius: radius.xl,
                                    borderWidth: 1,
                                    borderColor: '#E8EBF2',
                                    overflow: 'hidden',
                                    marginBottom: spacing.md,
                                }}>
                                    {markers.length === 0 ? (
                                        <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                                            <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.base, color: colors.texteMuted }}>
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
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    gap: spacing.md,
                                                    paddingHorizontal: spacing.lg,
                                                    paddingVertical: spacing.sm + 2,
                                                    backgroundColor: actif ? '#EBF2FC' : 'transparent',
                                                    borderBottomWidth: i < markers.length - 1 ? 1 : 0,
                                                    borderBottomColor: '#EAECF2',
                                                }}
                                            >
                                                <Text style={{
                                                    fontFamily: typography.fontFamily.bold,
                                                    fontSize: typography.size.xs,
                                                    color: actif ? colors.or : '#B8BEC9',
                                                    minWidth: 44,
                                                }}>
                                                    {formaterTemps(m.temps_secondes)}
                                                </Text>
                                                <Text style={{
                                                    flex: 1,
                                                    fontFamily: actif ? typography.fontFamily.semibold : typography.fontFamily.regular,
                                                    fontSize: typography.size.base,
                                                    color: actif ? colors.bleu : colors.texte,
                                                }}>
                                                    {m.titre}
                                                </Text>
                                                {actif && (
                                                    <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.bleu }} />
                                                )}
                                            </Pressable>
                                        )
                                    })}
                                </View>
                            )}
                        </ScrollView>
                    ) : (
                        /* Queue */
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 120 }}>
                            <Text style={{
                                fontFamily: typography.fontFamily.bold,
                                fontSize: typography.size.xs,
                                letterSpacing: 1.5,
                                color: colors.or,
                                textTransform: 'uppercase',
                                marginBottom: spacing.sm,
                            }}>
                                En cours
                            </Text>

                            <View style={{
                                backgroundColor: '#EBF2FC',
                                borderRadius: radius.lg,
                                borderWidth: 1.5,
                                borderColor: colors.bleu,
                                padding: spacing.md,
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginBottom: spacing.xl,
                            }}>
                                <View style={{
                                    width: 36, height: 36, borderRadius: radius.full,
                                    backgroundColor: colors.bleu,
                                    alignItems: 'center', justifyContent: 'center',
                                    marginRight: spacing.md,
                                }}>
                                    {enLecture
                                        ? (
                                            <View style={{ flexDirection: 'row', gap: 3, alignItems: 'flex-end', height: 16 }}>
                                                <View style={{ width: 3, height: 10, backgroundColor: 'white', borderRadius: 2 }} />
                                                <View style={{ width: 3, height: 16, backgroundColor: 'white', borderRadius: 2 }} />
                                                <View style={{ width: 3, height: 12, backgroundColor: 'white', borderRadius: 2 }} />
                                            </View>
                                        )
                                        : <IconPlay size={16} color="white" />
                                    }
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text numberOfLines={1} style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base, color: colors.bleu }}>
                                        {piste.titre}
                                    </Text>
                                    <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: colors.texteMuted, marginTop: 2 }}>
                                        {piste.sheikh}
                                    </Text>
                                </View>
                                <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.xs, color: colors.bleu }}>
                                    En cours
                                </Text>
                            </View>

                            {file.length > 0 && (
                                <Text style={{
                                    fontFamily: typography.fontFamily.bold,
                                    fontSize: typography.size.xs,
                                    letterSpacing: 1.5,
                                    color: colors.or,
                                    textTransform: 'uppercase',
                                    marginBottom: spacing.sm,
                                }}>
                                    Suivants ({file.length})
                                </Text>
                            )}

                            {file.length === 0 ? (
                                <View style={{ alignItems: 'center', paddingVertical: spacing['2xl'] }}>
                                    <Text style={{ fontSize: 34, marginBottom: spacing.md }}>🎵</Text>
                                    <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.base, color: colors.texteMuted, textAlign: 'center' }}>
                                        Aucun épisode dans la file
                                    </Text>
                                </View>
                            ) : file.map((p, i) => (
                                <View key={p.id} style={{
                                    backgroundColor: colors.blanc,
                                    borderRadius: radius.lg,
                                    borderWidth: 1,
                                    borderColor: '#E8EBF2',
                                    padding: spacing.md,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginBottom: spacing.sm,
                                }}>
                                    <View style={{
                                        width: 28, height: 28, borderRadius: radius.full,
                                        backgroundColor: '#F2F4F7',
                                        alignItems: 'center', justifyContent: 'center',
                                        marginRight: spacing.md,
                                    }}>
                                        <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.xs, color: colors.texteMuted }}>
                                            {i + 1}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text numberOfLines={1} style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.base, color: colors.texte }}>
                                            {p.titre}
                                        </Text>
                                        <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: colors.texteMuted, marginTop: 2 }}>
                                            {p.sheikh}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    )}
                </SafeAreaView>
            </RNAnimated.View>
        </Modal>
    )
}

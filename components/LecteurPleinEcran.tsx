import { colors, radius, spacing, typography } from '@/constants/theme'
import { useAudio } from '@/contexts/AudioContext'
import { supabase } from '@/lib/supabase'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { ListMusic, Moon, Volume1, Volume2 } from 'lucide-react-native'
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
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import TextTicker from 'react-native-text-ticker'

const BLANC_60 = 'rgba(255,255,255,0.6)'
const BLANC_40 = 'rgba(255,255,255,0.4)'
const BLANC_15 = 'rgba(255,255,255,0.15)'
const BLANC_08 = 'rgba(255,255,255,0.08)'

function IconReplay10({ size = 34, color = '#fff' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M339.5-108.5q-65.5-28.5-114-77t-77-114Q120-365 120-440h80q0 117 81.5 198.5T480-160q117 0 198.5-81.5T760-440q0-117-81.5-198.5T480-720h-6l62 62-56 58-160-160 160-160 56 58-62 62h6q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-440q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-80q-75 0-140.5-28.5ZM360-320v-180h-60v-60h120v240h-60Zm140 0q-17 0-28.5-11.5T460-360v-160q0-17 11.5-28.5T500-560h80q17 0 28.5 11.5T620-520v160q0 17-11.5 28.5T580-320h-80Zm20-60h40v-120h-40v120Z" fill={color} />
        </Svg>
    )
}

function IconForward10({ size = 34, color = '#fff' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M360-320v-180h-60v-60h120v240h-60Zm140 0q-17 0-28.5-11.5T460-360v-160q0-17 11.5-28.5T500-560h80q17 0 28.5 11.5T620-520v160q0 17-11.5 28.5T580-320h-80Zm20-60h40v-120h-40v120ZM339.5-108.5q-65.5-28.5-114-77t-77-114Q120-365 120-440t28.5-140.5q28.5-65.5 77-114t114-77Q405-800 480-800h6l-62-62 56-58 160 160-160 160-56-58 62-62h-6q-117 0-198.5 81.5T200-440q0 117 81.5 198.5T480-160q117 0 198.5-81.5T760-440h80q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-80q-75 0-140.5-28.5Z" fill={color} />
        </Svg>
    )
}

function IconPlayBig({ size = 52, color = '#fff' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M320-203v-560l440 280-440 280Z" fill={color} />
        </Svg>
    )
}

function IconPauseBig({ size = 52, color = '#fff' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M555-200v-560h205v560H555Zm-355 0v-560h205v560H200Z" fill={color} />
        </Svg>
    )
}

function IconInfo({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M423.5-703.5Q400-727 400-760t23.5-56.5Q447-840 480-840t56.5 23.5Q560-793 560-760t-23.5 56.5Q513-680 480-680t-56.5-23.5ZM420-120v-480h120v480H420Z" fill={color} />
        </Svg>
    )
}

function IconListChapters({ size = 20, color = '#fff' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M280-600v-80h560v80H280Zm0 160v-80h560v80H280Zm0 160v-80h560v80H280ZM160-600q-17 0-28.5-11.5T120-640q0-17 11.5-28.5T160-680q17 0 28.5 11.5T200-640q0 17-11.5 28.5T160-600Zm0 160q-17 0-28.5-11.5T120-480q0-17 11.5-28.5T160-520q17 0 28.5 11.5T200-480q0 17-11.5 28.5T160-440Zm0 160q-17 0-28.5-11.5T120-320q0-17 11.5-28.5T160-360q17 0 28.5 11.5T200-320q0 17-11.5 28.5T160-280Z" fill={color} />
        </Svg>
    )
}

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window')
const ARTWORK_SIZE = width - spacing.xl * 2

const VITESSES = [1, 1.25, 1.5, 2, 0.75]
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
    if (!s || isNaN(s) || s < 0) return '0:00'
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = Math.floor(s % 60)
    if (h > 0) return h + ':' + m.toString().padStart(2, '0') + ':' + sec.toString().padStart(2, '0')
    return m + ':' + sec.toString().padStart(2, '0')
}

function formaterVitesse(v: number) {
    return String(v).replace('.', ',')
}

function ArtworkAnime({ enLecture }: { enLecture: boolean }) {
    const scale = useSharedValue(enLecture ? 1 : 0.78)

    useEffect(() => {
        scale.value = withSpring(enLecture ? 1 : 0.78, { damping: 16, stiffness: 160 })
    }, [enLecture])

    const style = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }))

    return (
        <View style={{ width: ARTWORK_SIZE, height: ARTWORK_SIZE, alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View style={[{
                width: ARTWORK_SIZE,
                height: ARTWORK_SIZE,
                borderRadius: 20,
                backgroundColor: colors.blanc,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 18 },
                shadowOpacity: 0.45,
                shadowRadius: 32,
                elevation: 20,
                overflow: 'hidden',
            }, style]}>
                <Image
                    source={require('../assets/images/logo.png')}
                    style={{ width: ARTWORK_SIZE * 0.55, height: ARTWORK_SIZE * 0.55 }}
                    resizeMode="contain"
                />
            </Animated.View>
        </View>
    )
}

// Scrub bar — native Gesture.Pan so it wins over the dismiss gesture.
// No thumb, thickens while scrubbing, gold while active (Apple Podcasts+)
function BarreProgression({
    tempsActuel, dureeTotal, onSeek,
}: { tempsActuel: number; dureeTotal: number; onSeek: (pct: number) => void }) {
    const [scrubPct, setScrubPct] = useState<number | null>(null)
    const scrubbing = scrubPct !== null
    const barWidthRef = useRef(width - spacing.xl * 2)

    const pctFromX = (x: number) => Math.max(0, Math.min(100, (x / barWidthRef.current) * 100))

    const gesture = Gesture.Pan()
        .minDistance(0)
        .runOnJS(true)
        .onBegin(e => setScrubPct(pctFromX(e.x)))
        .onUpdate(e => setScrubPct(pctFromX(e.x)))
        .onEnd(e => {
            onSeek(pctFromX(e.x))
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        })
        .onFinalize(() => setScrubPct(null))

    const livePct = scrubbing ? scrubPct! : (dureeTotal > 0 ? (tempsActuel / dureeTotal) * 100 : 0)
    const tempsAffiche = scrubbing && dureeTotal > 0 ? (scrubPct! / 100) * dureeTotal : tempsActuel
    const restant = dureeTotal > 0 ? dureeTotal - tempsAffiche : 0
    const barH = scrubbing ? 12 : 7

    return (
        <View>
            <GestureDetector gesture={gesture}>
                <View
                    onLayout={e => { barWidthRef.current = e.nativeEvent.layout.width }}
                    style={{ height: 36, justifyContent: 'center' }}
                >
                    <View style={{ height: barH, backgroundColor: BLANC_15, borderRadius: barH / 2, overflow: 'hidden' }}>
                        <View style={{
                            width: `${livePct}%` as any,
                            height: '100%',
                            backgroundColor: scrubbing ? colors.or : 'rgba(255,255,255,0.85)',
                            borderRadius: barH / 2,
                        }} />
                    </View>
                </View>
            </GestureDetector>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 }}>
                <Text style={{
                    fontFamily: typography.fontFamily.medium,
                    fontSize: typography.size.xs,
                    color: scrubbing ? colors.or : BLANC_60,
                    fontVariant: ['tabular-nums'],
                }}>
                    {formaterTemps(tempsAffiche)}
                </Text>
                <Text style={{
                    fontFamily: typography.fontFamily.medium,
                    fontSize: typography.size.xs,
                    color: BLANC_60,
                    fontVariant: ['tabular-nums'],
                }}>
                    -{formaterTemps(restant)}
                </Text>
            </View>
        </View>
    )
}

// Volume bar — same native gesture, thickens while dragging
function BarreVolume({ volume, onChange }: { volume: number; onChange: (v: number) => void }) {
    const [localVol, setLocalVol] = useState(volume)
    const [dragging, setDragging] = useState(false)
    const barWidthRef = useRef(width - spacing.xl * 2 - 64)
    const draggingRef = useRef(false)
    const lastSent = useRef(0)

    useEffect(() => {
        if (!draggingRef.current) setLocalVol(volume)
    }, [volume])

    const volFromX = (x: number) => Math.max(0, Math.min(1, x / barWidthRef.current))

    const applique = (v: number, force = false) => {
        setLocalVol(v)
        const now = Date.now()
        if (force || now - lastSent.current > 80) {
            lastSent.current = now
            onChange(v)
        }
    }

    const gesture = Gesture.Pan()
        .minDistance(0)
        .runOnJS(true)
        .onBegin(e => {
            draggingRef.current = true
            setDragging(true)
            applique(volFromX(e.x))
        })
        .onUpdate(e => applique(volFromX(e.x)))
        .onEnd(e => applique(volFromX(e.x), true))
        .onFinalize(() => {
            draggingRef.current = false
            setDragging(false)
        })

    const barH = dragging ? 9 : 4

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <Volume1 size={20} color={BLANC_60} strokeWidth={2} />
            <GestureDetector gesture={gesture}>
                <View
                    onLayout={e => { barWidthRef.current = e.nativeEvent.layout.width }}
                    style={{ flex: 1, height: 36, justifyContent: 'center' }}
                >
                    <View style={{ height: barH, backgroundColor: BLANC_15, borderRadius: barH / 2, overflow: 'hidden' }}>
                        <View style={{
                            width: `${localVol * 100}%` as any,
                            height: '100%',
                            backgroundColor: dragging ? '#fff' : 'rgba(255,255,255,0.75)',
                            borderRadius: barH / 2,
                        }} />
                    </View>
                </View>
            </GestureDetector>
            <Volume2 size={20} color={BLANC_60} strokeWidth={2} />
        </View>
    )
}

export default function LecteurPleinEcran() {
    const {
        piste, enLecture, tempsActuel, dureeTotal,
        vitesse, volume, pause, reprendre, seeker, avancer, reculer,
        changerVitesse, changerVolume, file, lecteurOuvert, setLecteurOuvert,
    } = useAudio()

    const [onglet, setOnglet] = useState<'player' | 'file'>('player')
    const [showSleep, setShowSleep] = useState(false)
    const [sleepMinutes, setSleepMinutes] = useState(0)
    const [sleepRestant, setSleepRestant] = useState(0)
    const sleepRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const [showDescription, setShowDescription] = useState(false)
    const [showMarkers, setShowMarkers] = useState(false)
    const [markers, setMarkers] = useState<{ id: string; titre: string; temps_secondes: number }[]>([])
    const [description, setDescription] = useState<string | null>(null)

    const translateY = useSharedValue(SCREEN_HEIGHT)

    useEffect(() => {
        if (lecteurOuvert) {
            translateY.value = withSpring(0, { damping: 20, stiffness: 180, mass: 0.8 })
        } else {
            translateY.value = SCREEN_HEIGHT
        }
    }, [lecteurOuvert])

    const panGesture = Gesture.Pan()
        .activeOffsetY([0, 8])
        .failOffsetX([-20, 20])
        .onUpdate(e => {
            if (e.translationY > 0) translateY.value = e.translationY
        })
        .onEnd(e => {
            if (e.translationY > SCREEN_HEIGHT * 0.18 || e.velocityY > 600) {
                translateY.value = withTiming(SCREEN_HEIGHT, { duration: 260 }, () => {
                    runOnJS(setLecteurOuvert)(false)
                })
            } else {
                translateY.value = withSpring(0, { damping: 20, stiffness: 180 })
            }
        })

    const animStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }))

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

    if (!piste) return null

    const sleepActif = sleepMinutes > 0
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

    const panelOuvert = showDescription || showMarkers

    return (
        <Animated.View style={[{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 999,
        }, animStyle]}>
            <GestureDetector gesture={panGesture}>
                <View style={{ flex: 1 }}>
                    <LinearGradient
                        colors={['#27405F', '#16223A', '#0E1626']}
                        locations={[0, 0.45, 1]}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                    />
                    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
                        <StatusBar barStyle="light-content" />

                        {/* Drag handle */}
                        <View style={{ alignItems: 'center', paddingTop: spacing.sm, paddingBottom: spacing.md }}>
                            <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                        </View>

                        {onglet === 'player' ? (
                            <View style={{ flex: 1, paddingHorizontal: spacing.xl }}>

                                {/* Artwork or panel */}
                                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
                                    {panelOuvert ? (
                                        <ScrollView
                                            style={{ alignSelf: 'stretch' }}
                                            showsVerticalScrollIndicator={false}
                                            contentContainerStyle={{ paddingVertical: spacing.sm }}
                                        >
                                            <View style={{
                                                backgroundColor: BLANC_08,
                                                borderRadius: radius.xl,
                                                borderWidth: 1,
                                                borderColor: 'rgba(255,255,255,0.12)',
                                                overflow: 'hidden',
                                            }}>
                                                {showDescription && (
                                                    <View style={{ padding: spacing.lg }}>
                                                        <Text style={{
                                                            fontFamily: typography.fontFamily.semibold,
                                                            fontSize: typography.size.sm,
                                                            color: colors.or,
                                                            marginBottom: spacing.sm,
                                                        }}>
                                                            Description
                                                        </Text>
                                                        <Text style={{
                                                            fontFamily: typography.fontFamily.regular,
                                                            fontSize: typography.size.md,
                                                            color: description ? 'rgba(255,255,255,0.85)' : BLANC_60,
                                                            lineHeight: 23,
                                                        }}>
                                                            {description ?? 'Aucune description disponible'}
                                                        </Text>
                                                    </View>
                                                )}
                                                {showMarkers && (
                                                    markers.length === 0 ? (
                                                        <View style={{ padding: spacing.xl, alignItems: 'center' }}>
                                                            <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.base, color: BLANC_60 }}>
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
                                                                    paddingVertical: spacing.md,
                                                                    backgroundColor: actif ? 'rgba(217,172,42,0.15)' : 'transparent',
                                                                    borderBottomWidth: i < markers.length - 1 ? 1 : 0,
                                                                    borderBottomColor: 'rgba(255,255,255,0.08)',
                                                                }}
                                                            >
                                                                <Text style={{
                                                                    fontFamily: typography.fontFamily.semibold,
                                                                    fontSize: typography.size.xs,
                                                                    color: actif ? colors.or : BLANC_40,
                                                                    minWidth: 44,
                                                                    fontVariant: ['tabular-nums'],
                                                                }}>
                                                                    {formaterTemps(m.temps_secondes)}
                                                                </Text>
                                                                <Text style={{
                                                                    flex: 1,
                                                                    fontFamily: actif ? typography.fontFamily.semibold : typography.fontFamily.regular,
                                                                    fontSize: typography.size.md,
                                                                    color: actif ? colors.or : 'rgba(255,255,255,0.85)',
                                                                }}>
                                                                    {m.titre}
                                                                </Text>
                                                            </Pressable>
                                                        )
                                                    })
                                                )}
                                            </View>
                                        </ScrollView>
                                    ) : (
                                        <ArtworkAnime enLecture={enLecture} />
                                    )}
                                </View>

                                {/* Title + Sheikh */}
                                <View style={{ marginTop: spacing.lg, marginBottom: spacing.md }}>
                                    <TextTicker
                                        style={{
                                            fontFamily: typography.fontFamily.bold,
                                            fontSize: typography.size.xl,
                                            color: '#fff',
                                            lineHeight: 26,
                                        }}
                                        loop bounce={false} repeatSpacer={60} marqueeDelay={2500} scrollSpeed={18}
                                    >
                                        {piste.titre}
                                    </TextTicker>
                                    <Text numberOfLines={1} style={{
                                        fontFamily: typography.fontFamily.regular,
                                        fontSize: typography.size.md,
                                        color: BLANC_60,
                                        marginTop: 3,
                                    }}>
                                        {piste.sheikh}
                                    </Text>
                                </View>

                                {/* Progress */}
                                <BarreProgression
                                    tempsActuel={tempsActuel}
                                    dureeTotal={dureeTotal}
                                    onSeek={seeker}
                                />

                                {/* Main controls */}
                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginTop: spacing.lg,
                                    marginBottom: spacing.md,
                                }}>
                                    <Pressable
                                        onPress={cyclerVitesse}
                                        hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                                        style={{ width: 52, alignItems: 'center' }}
                                    >
                                        <Text style={{
                                            fontFamily: typography.fontFamily.bold,
                                            fontSize: typography.size.lg,
                                            color: vitesse !== 1 ? colors.or : '#fff',
                                        }}>
                                            ×{formaterVitesse(vitesse)}
                                        </Text>
                                    </Pressable>

                                    <Pressable
                                        onPress={() => skip(reculer)}
                                        hitSlop={{ top: 14, bottom: 14, left: 10, right: 10 }}
                                        style={({ pressed }) => ({
                                            transform: [{ scale: pressed ? 0.85 : 1 }],
                                            opacity: pressed ? 0.7 : 1,
                                        })}
                                    >
                                        <IconReplay10 size={38} color="#fff" />
                                    </Pressable>

                                    <Pressable
                                        onPress={togglePlay}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                        style={({ pressed }) => ({
                                            width: 76,
                                            height: 76,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transform: [{ scale: pressed ? 0.88 : 1 }],
                                        })}
                                    >
                                        {enLecture
                                            ? <IconPauseBig size={58} color="#fff" />
                                            : <IconPlayBig size={58} color="#fff" />
                                        }
                                    </Pressable>

                                    <Pressable
                                        onPress={() => skip(avancer)}
                                        hitSlop={{ top: 14, bottom: 14, left: 10, right: 10 }}
                                        style={({ pressed }) => ({
                                            transform: [{ scale: pressed ? 0.85 : 1 }],
                                            opacity: pressed ? 0.7 : 1,
                                        })}
                                    >
                                        <IconForward10 size={38} color="#fff" />
                                    </Pressable>

                                    <Pressable
                                        onPress={() => { Haptics.selectionAsync(); setShowSleep(p => !p) }}
                                        hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
                                        style={{ width: 52, alignItems: 'center' }}
                                    >
                                        {sleepActif ? (
                                            <View style={{ alignItems: 'center' }}>
                                                <Moon size={22} color={colors.or} strokeWidth={2} fill={colors.or} />
                                                <Text style={{
                                                    fontFamily: typography.fontFamily.semibold,
                                                    fontSize: 10,
                                                    color: colors.or,
                                                    marginTop: 1,
                                                    fontVariant: ['tabular-nums'],
                                                }}>
                                                    {formaterTemps(sleepRestant)}
                                                </Text>
                                            </View>
                                        ) : (
                                            <Moon size={24} color="#fff" strokeWidth={2} />
                                        )}
                                    </Pressable>
                                </View>

                                {/* Volume */}
                                <BarreVolume volume={volume} onChange={changerVolume} />

                                {/* Sleep panel */}
                                {showSleep && (
                                    <View style={{
                                        backgroundColor: BLANC_08,
                                        borderRadius: radius.xl,
                                        padding: spacing.md,
                                        marginTop: spacing.md,
                                        borderWidth: 1,
                                        borderColor: 'rgba(255,255,255,0.12)',
                                    }}>
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' }}>
                                            {SLEEP_OPTIONS.map(opt => (
                                                <Pressable
                                                    key={opt.minutes}
                                                    onPress={() => { Haptics.selectionAsync(); setSleepMinutes(opt.minutes); setShowSleep(false) }}
                                                    style={{
                                                        paddingHorizontal: spacing.md,
                                                        paddingVertical: spacing.sm,
                                                        borderRadius: radius.full,
                                                        backgroundColor: sleepMinutes === opt.minutes ? colors.or : 'transparent',
                                                        borderWidth: 1,
                                                        borderColor: sleepMinutes === opt.minutes ? colors.or : 'rgba(255,255,255,0.25)',
                                                    }}
                                                >
                                                    <Text style={{
                                                        fontFamily: typography.fontFamily.medium,
                                                        fontSize: typography.size.sm,
                                                        color: sleepMinutes === opt.minutes ? '#16223A' : 'rgba(255,255,255,0.85)',
                                                    }}>
                                                        {opt.label}
                                                    </Text>
                                                </Pressable>
                                            ))}
                                        </View>
                                    </View>
                                )}

                            </View>
                        ) : (
                            /* Queue */
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, paddingTop: spacing.xs }} style={{ flex: 1 }}>
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
                                    backgroundColor: BLANC_08,
                                    borderRadius: radius.lg,
                                    padding: spacing.md,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginBottom: spacing.xl,
                                    borderWidth: 1,
                                    borderColor: 'rgba(255,255,255,0.1)',
                                }}>
                                    <View style={{
                                        width: 36, height: 36, borderRadius: radius.full,
                                        backgroundColor: colors.or,
                                        alignItems: 'center', justifyContent: 'center',
                                        marginRight: spacing.md,
                                    }}>
                                        {enLecture
                                            ? (
                                                <View style={{ flexDirection: 'row', gap: 3, alignItems: 'flex-end', height: 16 }}>
                                                    <View style={{ width: 3, height: 10, backgroundColor: '#16223A', borderRadius: 2 }} />
                                                    <View style={{ width: 3, height: 16, backgroundColor: '#16223A', borderRadius: 2 }} />
                                                    <View style={{ width: 3, height: 12, backgroundColor: '#16223A', borderRadius: 2 }} />
                                                </View>
                                            )
                                            : <IconPlayBig size={16} color="#16223A" />
                                        }
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text numberOfLines={1} style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base, color: '#fff' }}>
                                            {piste.titre}
                                        </Text>
                                        <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: BLANC_60, marginTop: 2 }}>
                                            {piste.sheikh}
                                        </Text>
                                    </View>
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
                                        <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.base, color: BLANC_60, textAlign: 'center' }}>
                                            Aucun épisode dans la file
                                        </Text>
                                    </View>
                                ) : file.map((p, i) => (
                                    <View key={p.id} style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        paddingVertical: spacing.md,
                                        borderBottomWidth: i < file.length - 1 ? 1 : 0,
                                        borderBottomColor: 'rgba(255,255,255,0.08)',
                                    }}>
                                        <Text style={{
                                            fontFamily: typography.fontFamily.medium,
                                            fontSize: typography.size.sm,
                                            color: BLANC_40,
                                            width: 28,
                                            fontVariant: ['tabular-nums'],
                                        }}>
                                            {i + 1}
                                        </Text>
                                        <View style={{ flex: 1 }}>
                                            <Text numberOfLines={1} style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.base, color: 'rgba(255,255,255,0.9)' }}>
                                                {p.titre}
                                            </Text>
                                            <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: BLANC_60, marginTop: 2 }}>
                                                {p.sheikh}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </ScrollView>
                        )}

                        {/* Bottom row — Description / Chapitres / File */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-evenly',
                            paddingTop: spacing.md,
                            paddingBottom: spacing.sm,
                            paddingHorizontal: spacing.xl,
                        }}>
                            <Pressable
                                onPress={() => {
                                    Haptics.selectionAsync()
                                    setOnglet('player')
                                    setShowDescription(p => !p)
                                    setShowMarkers(false)
                                }}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                style={{ alignItems: 'center', width: 80 }}
                            >
                                <IconInfo size={22} color={showDescription ? colors.or : BLANC_40} />
                                <Text style={{
                                    fontFamily: typography.fontFamily.medium,
                                    fontSize: typography.size.xs,
                                    color: showDescription ? colors.or : BLANC_40,
                                    marginTop: 4,
                                }}>
                                    Description
                                </Text>
                            </Pressable>

                            <Pressable
                                onPress={() => {
                                    Haptics.selectionAsync()
                                    setOnglet('player')
                                    setShowMarkers(p => !p)
                                    setShowDescription(false)
                                }}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                style={{ alignItems: 'center', width: 80 }}
                            >
                                <IconListChapters size={22} color={showMarkers ? colors.or : BLANC_40} />
                                <Text style={{
                                    fontFamily: typography.fontFamily.medium,
                                    fontSize: typography.size.xs,
                                    color: showMarkers ? colors.or : BLANC_40,
                                    marginTop: 4,
                                }}>
                                    Chapitres
                                </Text>
                            </Pressable>

                            <Pressable
                                onPress={() => {
                                    Haptics.selectionAsync()
                                    setShowDescription(false)
                                    setShowMarkers(false)
                                    setOnglet(o => o === 'player' ? 'file' : 'player')
                                }}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                style={{ alignItems: 'center', width: 80 }}
                            >
                                <ListMusic size={22} color={onglet === 'file' ? colors.or : BLANC_40} strokeWidth={2} />
                                <Text style={{
                                    fontFamily: typography.fontFamily.medium,
                                    fontSize: typography.size.xs,
                                    color: onglet === 'file' ? colors.or : BLANC_40,
                                    marginTop: 4,
                                }}>
                                    File
                                </Text>
                            </Pressable>
                        </View>
                    </SafeAreaView>
                </View>
            </GestureDetector>
        </Animated.View>
    )
}

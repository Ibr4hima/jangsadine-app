import { colors, radius, spacing, typography } from '@/constants/theme'
import { useAudio } from '@/contexts/AudioContext'
import { supabase } from '@/lib/supabase'
import {
    ChevronDown,
    Play
} from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { Animated, Dimensions, Modal, PanResponder, Pressable, ScrollView, StatusBar, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import TextTicker from 'react-native-text-ticker'

import Svg, { Path } from 'react-native-svg'

function IconReplay10({ size = 36, color = colors.texte }: { size?: number, color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M339.5-108.5q-65.5-28.5-114-77t-77-114Q120-365 120-440h80q0 117 81.5 198.5T480-160q117 0 198.5-81.5T760-440q0-117-81.5-198.5T480-720h-6l62 62-56 58-160-160 160-160 56 58-62 62h6q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-440q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-80q-75 0-140.5-28.5ZM360-320v-180h-60v-60h120v240h-60Zm140 0q-17 0-28.5-11.5T460-360v-160q0-17 11.5-28.5T500-560h80q17 0 28.5 11.5T620-520v160q0 17-11.5 28.5T580-320h-80Zm20-60h40v-120h-40v120Z" fill={color} />
        </Svg>
    )
}

function IconForward10({ size = 36, color = colors.texte }: { size?: number, color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M360-320v-180h-60v-60h120v240h-60Zm140 0q-17 0-28.5-11.5T460-360v-160q0-17 11.5-28.5T500-560h80q17 0 28.5 11.5T620-520v160q0 17-11.5 28.5T580-320h-80Zm20-60h40v-120h-40v120ZM339.5-108.5q-65.5-28.5-114-77t-77-114Q120-365 120-440t28.5-140.5q28.5-65.5 77-114t114-77Q405-800 480-800h6l-62-62 56-58 160 160-160 160-56-58 62-62h-6q-117 0-198.5 81.5T200-440q0 117 81.5 198.5T480-160q117 0 198.5-81.5T760-440h80q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-80q-75 0-140.5-28.5Z" fill={color} />
        </Svg>
    )
}

function IconSpeed({ size = 32, color = colors.texte }: { size?: number, color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M480-316.5q38-.5 56-27.5l224-336-336 224q-27 18-28.5 55t22.5 61q24 24 62 23.5Zm0-483.5q59 0 113.5 16.5T696-734l-76 48q-33-17-68.5-25.5T480-720q-133 0-226.5 93.5T160-400q0 42 11.5 83t32.5 77h552q23-38 33.5-79t10.5-85q0-36-8.5-70T766-540l48-76q30 47 47.5 100T880-406q1 57-13 109t-41 99q-11 18-30 28t-40 10H204q-21 0-40-10t-30-28q-26-45-40-95.5T80-400q0-83 31.5-155.5t86-127Q252-737 325-768.5T480-800Zm7 313Z" fill={color} />
        </Svg>
    )
}

function IconPlay({ size = 36, color = 'white' }: { size?: number, color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z" fill={color} />
        </Svg>
    )
}

function IconPause({ size = 36, color = 'white' }: { size?: number, color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M520-200v-560h240v560H520Zm-320 0v-560h240v560H200Zm400-80h80v-400h-80v400Zm-320 0h80v-400h-80v400Zm0-400v400-400Zm320 0v400-400Z" fill={color} />
        </Svg>
    )
}

function IconAddNote({ size = 28, color = colors.texte }: { size?: number, color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v268q-19-9-39-15.5t-41-9.5v-243H200v560h242q3 22 9.5 42t15.5 38H200Zm0-120v40-560 243-3 280Zm80-40h163q3-21 9.5-41t14.5-39H280v80Zm0-160h244q32-30 71.5-50t84.5-27v-3H280v80Zm0-160h400v-80H280v80ZM720-40q-83 0-141.5-58.5T520-240q0-83 58.5-141.5T720-440q83 0 141.5 58.5T920-240q0 83-58.5 141.5T720-40Zm-20-80h40v-100h100v-40H740v-100h-40v100H600v40h100v100Z" fill={color} />
        </Svg>
    )
}

function IconList({ size = 24, color = colors.texte }: { size?: number, color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M280-600v-80h560v80H280Zm0 160v-80h560v80H280Zm0 160v-80h560v80H280ZM160-600q-17 0-28.5-11.5T120-640q0-17 11.5-28.5T160-680q17 0 28.5 11.5T200-640q0 17-11.5 28.5T160-600Zm0 160q-17 0-28.5-11.5T120-480q0-17 11.5-28.5T160-520q17 0 28.5 11.5T200-480q0 17-11.5 28.5T160-440Zm0 160q-17 0-28.5-11.5T120-320q0-17 11.5-28.5T160-360q17 0 28.5 11.5T200-320q0 17-11.5 28.5T160-280Z" fill={color} />
        </Svg>
    )
}

function IconMore({ size = 24, color = colors.texte }: { size?: number, color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M240-400q-33 0-56.5-23.5T160-480q0-33 23.5-56.5T240-560q33 0 56.5 23.5T320-480q0 33-23.5 56.5T240-400Zm240 0q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm240 0q-33 0-56.5-23.5T640-480q0-33 23.5-56.5T720-560q33 0 56.5 23.5T800-480q0 33-23.5 56.5T720-400Z" fill={color} />
        </Svg>
    )
}

function IconInfo({ size = 24, color = colors.texte }: { size?: number, color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M423.5-703.5Q400-727 400-760t23.5-56.5Q447-840 480-840t56.5 23.5Q560-793 560-760t-23.5 56.5Q513-680 480-680t-56.5-23.5ZM420-120v-480h120v480H420Z" fill={color} />
        </Svg>
    )
}

const { width, height } = Dimensions.get('window')

const VITESSES = [0.75, 1, 1.25, 1.5, 2]
const SLEEP_OPTIONS = [
    { label: 'Désactivé', minutes: 0 },
    { label: '5 min', minutes: 5 },
    { label: '10 min', minutes: 10 },
    { label: '15 min', minutes: 15 },
    { label: '30 min', minutes: 30 },
    { label: '45 min', minutes: 45 },
    { label: '1 heure', minutes: 60 },
]

function formaterTemps(s: number) {
    if (!s || isNaN(s)) return '0:00'
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = Math.floor(s % 60)
    if (h > 0) return h + ':' + m.toString().padStart(2, '0') + ':' + sec.toString().padStart(2, '0')
    return m + ':' + sec.toString().padStart(2, '0')
}

function ArtworkVisuel() {
    return (
        <View style={{
            width: width * 0.72,
            height: width * 0.72,
            borderRadius: 24,
            backgroundColor: colors.blanc,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.bleu,
            shadowOffset: { width: 0, height: 16 },
            shadowOpacity: 0.15,
            shadowRadius: 32,
            elevation: 12,
            borderWidth: 1,
            borderColor: colors.bordure,
        }}>
            <Animated.Image
                source={require('../assets/images/logo.png')}
                style={{ width: width * 0.52, height: width * 0.52 }}
                resizeMode="contain"
            />
        </View>
    )
}

type Props = {
    visible: boolean
    onClose: () => void
}

export default function LecteurPleinEcran({ visible, onClose }: Props) {
    const {
        piste, enLecture, progression, tempsActuel, dureeTotal,
        vitesse, pause, reprendre, seeker, avancer, reculer,
        changerVitesse, pisterSuivante, pistePrecedente, file,
    } = useAudio()

    const [onglet, setOnglet] = useState<'player' | 'file'>('player')
    const [showVitesse, setShowVitesse] = useState(false)
    const [showSleep, setShowSleep] = useState(false)
    const [sleepMinutes, setSleepMinutes] = useState(0)
    const [sleepRestant, setSleepRestant] = useState(0)
    const sleepRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const [showMarkers, setShowMarkers] = useState(false)
    const [showDescription, setShowDescription] = useState(false)
    const [markers, setMarkers] = useState<{ id: string, titre: string, temps_secondes: number }[]>([])
    const [description, setDescription] = useState<string | null>(null)
    const [showMore, setShowMore] = useState(false)

    const slideAnim = useRef(new Animated.Value(height)).current
    const progressWidth = useRef(new Animated.Value(0)).current

    // Entrée / sortie
    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0, useNativeDriver: true,
                tension: 65, friction: 11,
            }).start()
        } else {
            Animated.timing(slideAnim, {
                toValue: height, duration: 300, useNativeDriver: true,
            }).start()
        }
    }, [visible])

    // Sleep timer
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
        setShowMarkers(false)
        setShowDescription(false)

        // Charger markers
        supabase
            .from('markers')
            .select('id, titre, temps_secondes')
            .eq('episode_id', piste.id)
            .order('temps_secondes')
            .then(({ data }) => { if (data) setMarkers(data) })

        // Charger description
        supabase
            .from('episodes')
            .select('description')
            .eq('id', piste.id)
            .single()
            .then(({ data }) => { if (data?.description) setDescription(data.description) })
    }, [piste?.id])

    // Swipe bas pour fermer
    const panResponder = useRef(PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => g.dy > 5 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_, g) => {
            if (g.dy > 0) slideAnim.setValue(g.dy)
        },
        onPanResponderRelease: (_, g) => {
            if (g.dy > 60 || g.vy > 0.3) {
                Animated.timing(slideAnim, {
                    toValue: height, duration: 250, useNativeDriver: true,
                }).start(onClose)
            } else {
                Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start()
            }
        },
    })).current

    if (!piste) return null

    const progressPct = dureeTotal > 0 ? (tempsActuel / dureeTotal) * 100 : 0

    return (
        <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
            <Animated.View style={{
                flex: 1,
                transform: [{ translateY: slideAnim }],
            }}>
                <SafeAreaView style={{ flex: 1, backgroundColor: colors.fondCreme }} edges={['top', 'bottom']}>
                    <StatusBar barStyle="dark-content" />

                    {/* Poignée de glissement */}
                    <View
                        {...panResponder.panHandlers}
                        style={{ alignItems: 'center', paddingVertical: spacing.lg, paddingHorizontal: spacing.xl }}
                    >
                        <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#ddd' }} />
                    </View>

                    {/* Header */}
                    <View style={{
                        flexDirection: 'row', alignItems: 'center',
                        paddingHorizontal: spacing.xl, paddingBottom: spacing.md,
                    }}>
                        <Pressable onPress={onClose} style={{ padding: spacing.sm }}>
                            <ChevronDown size={28} color={colors.texte} strokeWidth={1.5} />
                        </Pressable>
                        <View style={{ flex: 1, alignItems: 'center' }}>
                            <Text style={{
                                fontFamily: typography.fontFamily.bold,
                                fontSize: typography.size.xs,
                                letterSpacing: 2, color: colors.or,
                                textTransform: 'uppercase',
                            }}>
                                En cours d'écoute
                            </Text>
                        </View>
                        <View style={{ width: 60 }} />
                    </View>

                    {onglet === 'player' ? (
                        <View style={{ flex: 1, paddingHorizontal: spacing.xl, justifyContent: 'space-between' }}>

                            {/* Artwork */}
                            <View style={{ alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.xl }}>
                                <ArtworkVisuel />
                            </View>

                            {/* Titre + Sheikh + More */}
                            <View style={{ marginBottom: spacing.xl }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={{ flex: 1, overflow: 'hidden', marginRight: spacing.md }}>
                                        <TextTicker
                                            style={{
                                                fontFamily: typography.fontFamily.bold,
                                                fontSize: typography.size['2xl'],
                                                color: colors.texte,
                                                lineHeight: 32,
                                            }}
                                            loop
                                            bounce={false}
                                            repeatSpacer={50}
                                            marqueeDelay={2000}
                                            scrollSpeed={20}
                                        >
                                            {piste.titre}
                                        </TextTicker>
                                    </View>
                                    <Pressable
                                        onPress={() => setShowMore(p => !p)}
                                        style={{
                                            width: 40, height: 40, borderRadius: radius.full,
                                            backgroundColor: showMore ? '#f0f0f0' : colors.blanc,
                                            borderWidth: 1, borderColor: colors.bordure,
                                            alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <IconMore size={20} color={colors.texte} />
                                    </Pressable>
                                </View>

                                <Text style={{
                                    fontFamily: typography.fontFamily.regular,
                                    fontSize: typography.size.md,
                                    color: '#999',
                                    marginTop: spacing.xs,
                                }}>
                                    {piste.sheikh}
                                </Text>

                                {/* Panel More */}
                                {showMore && (
                                    <View style={{
                                        marginTop: spacing.md,
                                        backgroundColor: colors.blanc,
                                        borderRadius: radius.xl,
                                        borderWidth: 1, borderColor: colors.bordure,
                                        overflow: 'hidden',
                                    }}>
                                        <Pressable
                                            onPress={() => { setOnglet('file'); setShowMore(false) }}
                                            style={{
                                                flexDirection: 'row', alignItems: 'center', gap: spacing.md,
                                                padding: spacing.md,
                                                borderBottomWidth: 1, borderBottomColor: colors.bordure,
                                            }}
                                        >
                                            <IconList size={20} color={colors.texte} />
                                            <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.base, color: colors.texte }}>
                                                Voir tous les épisodes
                                            </Text>
                                        </Pressable>
                                        <Pressable
                                            onPress={() => { setShowMore(false); onClose() }}
                                            style={{
                                                flexDirection: 'row', alignItems: 'center', gap: spacing.md,
                                                padding: spacing.md,
                                            }}
                                        >
                                            <IconAddNote size={20} color={colors.texte} />
                                            <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.base, color: colors.texte }}>
                                                Télécharger cet épisode
                                            </Text>
                                        </Pressable>
                                    </View>
                                )}
                            </View>

                            {/* Barre de progression */}
                            <View style={{ marginBottom: spacing.lg }}>
                                <Pressable
                                    onPress={e => {
                                        const pct = (e.nativeEvent.locationX / (width - spacing.xl * 2)) * 100
                                        seeker(Math.max(0, Math.min(100, pct)))
                                    }}
                                    style={{ height: 36, justifyContent: 'center', marginBottom: spacing.xs }}
                                >
                                    <View style={{ height: 4, backgroundColor: '#e8e4da', borderRadius: 2 }}>
                                        <View style={{
                                            width: `${progressPct}%`, height: '100%',
                                            backgroundColor: colors.bleu, borderRadius: 2,
                                        }} />
                                        <View style={{
                                            position: 'absolute', left: `${progressPct}%`,
                                            top: -6, width: 16, height: 16, borderRadius: 8,
                                            backgroundColor: colors.bleu, marginLeft: -8,
                                            shadowColor: colors.bleu, shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.4, shadowRadius: 4,
                                        }} />
                                    </View>
                                </Pressable>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.xs, color: '#aaa' }}>
                                        {formaterTemps(tempsActuel)}
                                    </Text>
                                    <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.xs, color: '#aaa' }}>
                                        {formaterTemps(dureeTotal)}
                                    </Text>
                                </View>
                            </View>

                            {/* Contrôles principaux */}
                            <View style={{
                                flexDirection: 'row', alignItems: 'center',
                                justifyContent: 'center', gap: spacing['2xl'],
                                marginBottom: spacing.xl,
                            }}>
                                <Pressable
                                    onPress={() => { setShowVitesse(p => !p) }}
                                    style={{ alignItems: 'center', gap: 4 }}
                                >
                                    <IconSpeed size={32} color={colors.texte} />
                                    <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: 9, color: colors.texte }}>
                                        {vitesse}x
                                    </Text>
                                </Pressable>

                                <Pressable onPress={() => reculer(10)}>
                                    <IconReplay10 size={35} />
                                </Pressable>

                                <Pressable
                                    onPress={() => enLecture ? pause() : reprendre()}
                                    style={{
                                        width: 68, height: 68, borderRadius: 36,
                                        backgroundColor: colors.bleu, alignItems: 'center', justifyContent: 'center',
                                        shadowColor: colors.bleu, shadowOffset: { width: 0, height: 8 },
                                        shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
                                    }}
                                >
                                    {enLecture ? <IconPause size={32} color="white" /> : <IconPlay size={32} color="white" />}
                                </Pressable>

                                <Pressable onPress={() => avancer(10)}>
                                    <IconForward10 size={35} />
                                </Pressable>

                                {/* Placeholder pour équilibre */}
                                <View style={{ width: 32 }} />
                            </View>

                            {/* Panel vitesse */}
                            {showVitesse && (
                                <View style={{
                                    backgroundColor: colors.blanc, borderRadius: radius.xl,
                                    borderWidth: 1, borderColor: colors.bordure,
                                    padding: spacing.md, marginBottom: spacing.lg,
                                    flexDirection: 'row', justifyContent: 'space-around',
                                }}>
                                    {VITESSES.map(v => (
                                        <Pressable
                                            key={v}
                                            onPress={() => { changerVitesse(v); setShowVitesse(false) }}
                                            style={{
                                                paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
                                                borderRadius: radius.full,
                                                backgroundColor: vitesse === v ? colors.bleu : 'transparent',
                                            }}
                                        >
                                            <Text style={{
                                                fontFamily: typography.fontFamily.semibold,
                                                fontSize: typography.size.base,
                                                color: vitesse === v ? 'white' : colors.texte,
                                            }}>
                                                {v}x
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            )}

                            {/* Panel description */}
                            {showDescription && (
                                <View style={{
                                    backgroundColor: colors.blanc, borderRadius: radius.xl,
                                    borderWidth: 1, borderColor: colors.bordure,
                                    padding: spacing.lg, marginBottom: spacing.lg,
                                }}>
                                    {description ? (
                                        <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.base, color: colors.texte, lineHeight: 22 }}>
                                            {description}
                                        </Text>
                                    ) : (
                                        <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.base, color: colors.texteMuted, textAlign: 'center' }}>
                                            Aucune description
                                        </Text>
                                    )}
                                </View>
                            )}

                            {/* Panel markers */}
                            {showMarkers && (
                                <View style={{
                                    backgroundColor: colors.blanc, borderRadius: radius.xl,
                                    borderWidth: 1, borderColor: colors.bordure,
                                    padding: spacing.lg, marginBottom: spacing.lg,
                                }}>
                                    {markers.length === 0 ? (
                                        <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.base, color: colors.texteMuted, textAlign: 'center' }}>
                                            Aucun chapitre
                                        </Text>
                                    ) : (
                                        <View style={{ gap: spacing.sm }}>
                                            {markers.map((m, i) => {
                                                const h = Math.floor(m.temps_secondes / 3600)
                                                const min = Math.floor((m.temps_secondes % 3600) / 60)
                                                const sec = m.temps_secondes % 60
                                                const label = h > 0
                                                    ? h + ':' + min.toString().padStart(2, '0') + ':' + sec.toString().padStart(2, '0')
                                                    : min + ':' + sec.toString().padStart(2, '0')
                                                const actif = tempsActuel >= m.temps_secondes &&
                                                    (i === markers.length - 1 || tempsActuel < markers[i + 1].temps_secondes)
                                                return (
                                                    <Pressable
                                                        key={m.id}
                                                        onPress={() => seeker((m.temps_secondes / dureeTotal) * 100)}
                                                        style={{
                                                            flexDirection: 'row', alignItems: 'center', gap: spacing.md,
                                                            padding: spacing.md, borderRadius: radius.lg,
                                                            backgroundColor: actif ? '#e8f0f8' : 'transparent',
                                                        }}
                                                    >
                                                        <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, color: actif ? colors.or : '#bbb', minWidth: 40 }}>
                                                            {label}
                                                        </Text>
                                                        <Text style={{ flex: 1, fontFamily: actif ? typography.fontFamily.semibold : typography.fontFamily.regular, fontSize: typography.size.base, color: actif ? colors.bleu : colors.texte }}>
                                                            {m.titre}
                                                        </Text>
                                                        {actif && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.bleu }} />}
                                                    </Pressable>
                                                )
                                            })}
                                        </View>
                                    )}
                                </View>
                            )}

                            {/* Spacer pour pousser les boutons vers le bas */}

                            {/* 3 boutons bas */}
                            <View style={{
                                flexDirection: 'row', alignItems: 'center',
                                justifyContent: 'center', gap: spacing['3xl'],
                                paddingBottom: 15,
                            }}>
                                <Pressable
                                    onPress={() => { setShowDescription(p => !p); setShowMarkers(false) }}
                                    style={{
                                        width: 45, height: 45, borderRadius: radius.full,
                                        backgroundColor: showDescription ? '#f0f0f0' : colors.blanc,
                                        borderWidth: 1, borderColor: showDescription ? '#ccc' : colors.bordure,
                                        alignItems: 'center', justifyContent: 'center',
                                    }}
                                >
                                    <IconInfo size={20} color={colors.texte} />
                                </Pressable>

                                <Pressable
                                    onPress={onClose}
                                    style={{
                                        width: 45, height: 45, borderRadius: radius.full,
                                        backgroundColor: colors.blanc,
                                        borderWidth: 1, borderColor: colors.bordure,
                                        alignItems: 'center', justifyContent: 'center',
                                    }}
                                >
                                    <IconAddNote size={20} color={colors.texte} />
                                </Pressable>

                                <Pressable
                                    onPress={() => { setShowMarkers(p => !p); setShowDescription(false) }}
                                    style={{
                                        width: 45, height: 45, borderRadius: radius.full,
                                        backgroundColor: showMarkers ? '#f0f0f0' : colors.blanc,
                                        borderWidth: 1, borderColor: showMarkers ? '#ccc' : colors.bordure,
                                        alignItems: 'center', justifyContent: 'center',
                                    }}
                                >
                                    <IconList size={20} color={colors.texte} />
                                </Pressable>
                            </View>

                        </View>
                    ) : (
                        /* File d'attente */
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 120 }}>
                            <Text style={{
                                fontFamily: typography.fontFamily.bold,
                                fontSize: typography.size.xs, letterSpacing: 2,
                                color: colors.or, textTransform: 'uppercase',
                                marginBottom: spacing.md,
                            }}>
                                File d'attente ({file.length})
                            </Text>

                            {/* Piste actuelle */}
                            <View style={{
                                backgroundColor: '#e8f0f8',
                                borderRadius: radius.lg,
                                borderWidth: 1, borderColor: colors.bleu,
                                padding: spacing.md,
                                flexDirection: 'row', alignItems: 'center',
                                marginBottom: spacing.sm,
                            }}>
                                <View style={{
                                    width: 36, height: 36, borderRadius: radius.full,
                                    backgroundColor: colors.bleu,
                                    alignItems: 'center', justifyContent: 'center',
                                    marginRight: spacing.md,
                                }}>
                                    {enLecture
                                        ? <View style={{ flexDirection: 'row', gap: 2 }}>
                                            <View style={{ width: 2, height: 12, backgroundColor: 'white', borderRadius: 1 }} />
                                            <View style={{ width: 2, height: 12, backgroundColor: 'white', borderRadius: 1 }} />
                                        </View>
                                        : <Play size={12} color="white" fill="white" strokeWidth={0} style={{ marginLeft: 2 }} />
                                    }
                                </View>
                                <View style={{ flex: 1, minWidth: 0 }}>
                                    <Text numberOfLines={1} style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base, color: colors.bleu }}>
                                        {piste.titre}
                                    </Text>
                                    <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: colors.texteMuted, marginTop: 2 }}>
                                        {piste.sheikh}
                                    </Text>
                                </View>
                                <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.xs, color: colors.bleu }}>
                                    En cours
                                </Text>
                            </View>

                            {file.length === 0 ? (
                                <View style={{ alignItems: 'center', paddingVertical: spacing['2xl'] }}>
                                    <Text style={{ fontSize: 36, marginBottom: spacing.md }}>🎵</Text>
                                    <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.base, color: colors.texteMuted, textAlign: 'center' }}>
                                        Aucun épisode dans la file
                                    </Text>
                                </View>
                            ) : (
                                file.map((p, i) => (
                                    <View key={p.id} style={{
                                        backgroundColor: colors.blanc,
                                        borderRadius: radius.lg,
                                        borderWidth: 1, borderColor: colors.bordure,
                                        padding: spacing.md,
                                        flexDirection: 'row', alignItems: 'center',
                                        marginBottom: spacing.sm,
                                        opacity: 0.7,
                                    }}>
                                        <View style={{
                                            width: 28, height: 28, borderRadius: radius.full,
                                            backgroundColor: colors.fondCreme,
                                            alignItems: 'center', justifyContent: 'center',
                                            marginRight: spacing.md,
                                        }}>
                                            <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.xs, color: '#999' }}>
                                                {i + 1}
                                            </Text>
                                        </View>
                                        <View style={{ flex: 1, minWidth: 0 }}>
                                            <Text numberOfLines={1} style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.base, color: colors.texte }}>
                                                {p.titre}
                                            </Text>
                                            <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: colors.texteMuted, marginTop: 2 }}>
                                                {p.sheikh}
                                            </Text>
                                        </View>
                                    </View>
                                ))
                            )}


                        </ScrollView>
                    )}
                </SafeAreaView>
            </Animated.View>
        </Modal>
    )
}
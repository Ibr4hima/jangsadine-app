import { colors, radius, spacing, typography } from '@/constants/theme'
import { useAudio } from '@/contexts/AudioContext'
import { supabase } from '@/lib/supabase'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { Play } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { Animated, Pressable, ScrollView, StatusBar, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import TextTicker from 'react-native-text-ticker'

const couleurBg: Record<string, string> = {
    Aqeedah: '#e8f0f8', Fiqh: '#faf3dc', Hadith: '#eaf4ee',
    'Tafsir & Sciences du Coran': '#fde8f0', Seerah: '#fdf0eb',
    Invocations: '#DEE8CE', 'Éthique & Bons comportements': '#f2eefa',
    'Séries de cours': '#EDE8D0',
}
const couleurTxt: Record<string, string> = {
    Aqeedah: '#28558b', Fiqh: '#b8911f', Hadith: '#2d7a4f',
    'Tafsir & Sciences du Coran': '#a02060', Seerah: '#c05c2e',
    Invocations: '#06402B', 'Éthique & Bons comportements': '#6b3db5',
    'Séries de cours': '#654321',
}

function BarresAnimees() {
    const anims = [useRef(new Animated.Value(0.4)).current, useRef(new Animated.Value(0.4)).current, useRef(new Animated.Value(0.4)).current, useRef(new Animated.Value(0.4)).current]
    useEffect(() => {
        anims.forEach((anim, i) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, { toValue: 1, duration: 400, delay: i * 100, useNativeDriver: true }),
                    Animated.timing(anim, { toValue: 0.4, duration: 400, useNativeDriver: true }),
                ])
            ).start()
        })
    }, [])
    return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 14, gap: 2 }}>
            {anims.map((anim, i) => (
                <Animated.View key={i} style={{ width: 2, borderRadius: 2, backgroundColor: colors.or, height: i % 2 === 0 ? 14 : 8, opacity: anim }} />
            ))}
        </View>
    )
}

export default function PageLivre() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const router = useRouter()
    const { jouer, piste, enLecture, pause, reprendre, progression } = useAudio()
    const [livre, setLivre] = useState<any>(null)
    const [versions, setVersions] = useState<any[]>([])
    const [chapitres, setChapitres] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const livreAudioId = `livre_${id}`
    const enLectureLivre = piste?.id === livreAudioId && enLecture
    const livreActif = piste?.id === livreAudioId

    useEffect(() => {
        async function charger() {
            const { data: livreData } = await supabase
                .from('livres')
                .select('*, categories(nom)')
                .eq('id', id)
                .single()
            if (livreData) {
                setLivre(livreData)
                if (livreData.type === 'chapitres') {
                    const { data: chapsData } = await supabase
                        .from('chapitres_livre')
                        .select('id, titre, numero, url_pdf')
                        .eq('livre_id', id)
                        .order('numero')
                    if (chapsData) setChapitres(chapsData)
                } else {
                    const { data: coursData } = await supabase
                        .from('cours')
                        .select('id, titre, sheikh, nb_episodes, description')
                        .eq('livre_id', id)
                        .order('created_at')
                    if (coursData) setVersions(coursData)
                }
            }
            setLoading(false)
        }
        charger()
    }, [id])

    const categorie = livre?.categories?.nom ?? ''
    const bg = couleurBg[categorie] ?? '#f0f0f0'
    const txt = couleurTxt[categorie] ?? '#666'

    const jouerLivre = () => {
        if (!livre?.url_audio) return
        if (livreActif) {
            enLecture ? pause() : reprendre()
        } else {
            jouer({ id: livreAudioId, titre: livre.titre, sheikh: livre.sheikh ?? '', url: livre.url_audio })
        }
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.fondCreme }} edges={[]}>
            <StatusBar barStyle="light-content" />

            {/* Header bleu */}
            <View style={{ backgroundColor: colors.bleu, padding: spacing.xl, paddingTop: 60, alignItems: 'center' }}>
                <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, letterSpacing: 2, color: colors.or, textTransform: 'uppercase', marginBottom: spacing.sm, textAlign: 'center' }}>
                    {categorie}
                </Text>
                <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size['2xl'], color: 'white', lineHeight: 32, marginBottom: spacing.sm, textAlign: 'center' }}>
                    {livre?.titre}
                </Text>
                <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.base, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: livre?.description ? spacing.sm : 0 }}>
                    {livre?.type === 'chapitres'
                        ? `${livre?.sheikh ? livre.sheikh + ' · ' : ''}${chapitres.length} chapitre${chapitres.length > 1 ? 's' : ''}`
                        : livre?.sheikh || ''
                    }
                </Text>
                {livre?.description ? (
                    <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: 'rgba(255,255,255,0.75)', lineHeight: 22, fontStyle: 'italic', marginBottom: spacing.md, textAlign: 'center', maxWidth: 300 }}>
                        {livre.description}
                    </Text>
                ) : null}

                {/* Boutons PDF + Audio */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs, justifyContent: 'center' }}>
                    {livre?.url_pdf ? (
                        <Pressable
                            onPress={() => WebBrowser.openBrowserAsync(livre.url_pdf)}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}
                        >
                            <Text>📖</Text>
                            <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.sm, color: 'white' }}>Consulter le livre</Text>
                        </Pressable>
                    ) : null}
                    {livre?.url_audio ? (
                        <Pressable
                            onPress={jouerLivre}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: livreActif ? 'rgba(217,172,42,0.3)' : 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: livreActif ? 'rgba(217,172,42,0.6)' : 'rgba(255,255,255,0.25)', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}
                        >
                            {enLectureLivre ? (
                                <>
                                    <BarresAnimees />
                                    <View style={{ width: 60, height: 3, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' }}>
                                        <View style={{ width: `${progression}%`, height: '100%', backgroundColor: colors.or, borderRadius: 2 }} />
                                    </View>
                                </>
                            ) : (
                                <>
                                    <Text>🎧</Text>
                                    <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.sm, color: 'white' }}>Écouter le livre</Text>
                                </>
                            )}
                        </Pressable>
                    ) : null}
                </View>
            </View>

            {/* Barre or */}
            <View style={{ height: 3, backgroundColor: colors.or, opacity: 0.6 }} />

            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontFamily: typography.fontFamily.regular, color: colors.texteMuted }}>Chargement...</Text>
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120 }}>

                    {/* MODE CHAPITRES */}
                    {livre?.type === 'chapitres' && (
                        <>
                            <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, letterSpacing: 2, color: colors.or, textTransform: 'uppercase', marginBottom: spacing.sm }}>
                                Table des matières
                            </Text>
                            <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xl, color: colors.texte, marginBottom: spacing.xl }}>
                                {chapitres.length} chapitre{chapitres.length > 1 ? 's' : ''}
                            </Text>
                            <View style={{ gap: spacing.sm }}>
                                {chapitres.map(chap => (
                                    <Pressable
                                        key={chap.id}
                                        onPress={() => router.push(`/audio/livre/${id}/chapitre/${chap.id}` as any)}
                                        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm })}
                                    >
                                        <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.sm, color: '#bbb', width: 24, textAlign: 'right', flexShrink: 0 }}>
                                            {chap.numero}
                                        </Text>
                                        <View style={{ flex: 1, backgroundColor: colors.blanc, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.bordure, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                                            <View style={{ width: 38, height: 38, borderRadius: radius.full, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Play size={14} color={txt} fill={txt} strokeWidth={0} style={{ marginLeft: 2 }} />
                                            </View>
                                            <TextTicker
                                                style={{ flex: 1, fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base, color: colors.texte }}
                                                loop bounce={false} repeatSpacer={50} marqueeDelay={2000} scrollSpeed={10}
                                            >
                                                {chap.titre}
                                            </TextTicker>
                                        </View>
                                    </Pressable>
                                ))}
                            </View>
                        </>
                    )}

                    {/* MODE STANDARD */}
                    {livre?.type !== 'chapitres' && (
                        <>
                            <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, letterSpacing: 2, color: colors.or, textTransform: 'uppercase', marginBottom: spacing.sm }}>
                                Versions disponibles
                            </Text>
                            <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xl, color: colors.texte, marginBottom: spacing.xl }}>
                                {versions.length} version{versions.length > 1 ? 's' : ''} de ce cours
                            </Text>
                            <View style={{ gap: spacing.md }}>
                                {versions.map(v => (
                                    <Pressable
                                        key={v.id}
                                        onPress={() => router.push(`/audio/${v.id}` as any)}
                                        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                                    >
                                        <View style={{ backgroundColor: colors.blanc, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.bordure, padding: spacing.lg, flexDirection: 'row', alignItems: 'center' }}>
                                            <View style={{ width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.bleu, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, flexShrink: 0 }}>
                                                <Play size={16} color="white" fill="white" strokeWidth={0} style={{ marginLeft: 2 }} />
                                            </View>
                                            <View style={{ flex: 1, minWidth: 0 }}>
                                                <TextTicker
                                                    style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.md, color: colors.texte, marginBottom: spacing.sm }}
                                                    loop bounce={false} repeatSpacer={50} marqueeDelay={2000} scrollSpeed={10}
                                                >
                                                    {v.titre || livre?.titre}
                                                </TextTicker>
                                                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                                                    <View style={{ backgroundColor: bg, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 }}>
                                                        <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.xs, color: txt }}>{v.sheikh}</Text>
                                                    </View>
                                                    <View style={{ backgroundColor: '#f0f0f0', borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 }}>
                                                        <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.xs, color: '#999' }}>{v.nb_episodes} épisodes</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    </Pressable>
                                ))}
                            </View>
                        </>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    )
}
import {
    BoutonHeros,
    EnTeteSection,
    EtatVideDetail,
    HerosDetail,
    IconLivre,
    IconPlay,
    MiniEgaliseur,
    PressableScale,
    Squelettes,
    W70,
} from '@/components/AudioUI'
import { colors, radius, spacing, typography } from '@/constants/theme'
import { useAudio } from '@/contexts/AudioContext'
import { supabase } from '@/lib/supabase'
import * as Haptics from 'expo-haptics'
import { useLocalSearchParams } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, StatusBar, Text, View } from 'react-native'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type Chapitre = {
    id: string
    titre: string
    numero: number
    url_pdf: string | null
    livre: { id: string; titre: string; categories: { nom: string } }
}

type Episode = {
    id: string
    titre: string
    numero: number
    duree: string
    url_audio: string
    description?: string | null
}

export default function PageChapitre() {
    const { chapitreId } = useLocalSearchParams<{ id: string, chapitreId: string }>()
    const insets = useSafeAreaInsets()
    const { jouer, piste, enLecture, pause, reprendre } = useAudio()
    const [chapitre, setChapitre] = useState<Chapitre | null>(null)
    const [episodes, setEpisodes] = useState<Episode[]>([])
    const [loading, setLoading] = useState(true)
    const [descOuverte, setDescOuverte] = useState<string | null>(null)

    const episodeActif = episodes.some(e => e.id === piste?.id)

    useEffect(() => {
        async function charger() {
            const [{ data: chapData }, { data: epsData }] = await Promise.all([
                supabase.from('chapitres_livre').select('*, livre:livre_id(id, titre, categories(nom))').eq('id', chapitreId).single(),
                supabase.from('episodes_chapitre').select('id, titre, numero, duree, url_audio, description').eq('chapitre_id', chapitreId).order('numero'),
            ])
            if (chapData) setChapitre(chapData as any)
            if (epsData) setEpisodes(epsData)
            setLoading(false)
        }
        charger()
    }, [chapitreId])

    function jouerEpisode(ep: Episode, index: number) {
        const suivantes = episodes.slice(index + 1).map(e => ({
            id: e.id, titre: e.titre, sheikh: '',
            url: e.url_audio, duree: e.duree,
        }))
        jouer({ id: ep.id, titre: ep.titre, sheikh: '', url: ep.url_audio, duree: ep.duree }, suivantes)
    }

    function toutEcouter() {
        if (episodes.length === 0) return
        if (episodeActif) {
            enLecture ? pause() : reprendre()
            return
        }
        jouerEpisode(episodes[0], 0)
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.fondCreme }}>
            <StatusBar barStyle="light-content" />

            {/* ── Héros ── */}
            <HerosDetail paddingTop={insets.top + spacing.sm}>
                <View style={{ alignItems: 'center' }}>
                    <View style={{ backgroundColor: 'rgba(214,173,58,0.16)', borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 4, marginBottom: spacing.sm }}>
                        <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, letterSpacing: 1.8, color: colors.or, textTransform: 'uppercase' }}>
                            Chapitre {chapitre?.numero}
                        </Text>
                    </View>

                    <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size['2xl'], color: 'white', lineHeight: 32, textAlign: 'center' }}>
                        {chapitre?.titre}
                    </Text>

                    {chapitre?.livre?.titre ? (
                        <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: W70, marginTop: 6, textAlign: 'center' }}>
                            {chapitre.livre.titre}
                        </Text>
                    ) : null}

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg, justifyContent: 'center' }}>
                        <BoutonHeros
                            icone={episodeActif && enLecture
                                ? <MiniEgaliseur color={colors.or} hauteur={12} />
                                : <IconPlay size={16} color="white" />}
                            label={episodeActif ? (enLecture ? 'En lecture' : 'Reprendre') : 'Tout écouter'}
                            onPress={toutEcouter}
                            actif={episodeActif}
                        />
                        {chapitre?.url_pdf ? (
                            <BoutonHeros
                                icone={<IconLivre size={16} color="white" />}
                                label="Consulter ce chapitre"
                                onPress={() => WebBrowser.openBrowserAsync(chapitre.url_pdf!)}
                            />
                        ) : null}
                    </View>
                </View>
            </HerosDetail>

            {/* ── Épisodes ── */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.xl, paddingBottom: 170 }}>
                {loading ? (
                    <Squelettes n={6} h={66} />
                ) : (
                    <Animated.View entering={FadeIn.duration(220)}>
                        <EnTeteSection eyebrow={`${episodes.length} épisode${episodes.length > 1 ? 's' : ''}`} />
                        {episodes.length === 0 ? (
                            <EtatVideDetail message="Les épisodes arrivent bientôt" />
                        ) : (
                            <View style={{ gap: spacing.sm }}>
                                {episodes.map((ep, index) => {
                                    const actif = piste?.id === ep.id
                                    const descVisible = descOuverte === ep.id
                                    return (
                                        <Animated.View key={ep.id} entering={FadeInDown.duration(350).delay(Math.min(index, 8) * 45)}>
                                            <PressableScale
                                                onPress={() => {
                                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                                                    if (actif) { enLecture ? pause() : reprendre() }
                                                    else jouerEpisode(ep, index)
                                                }}
                                                style={{
                                                    backgroundColor: colors.blanc,
                                                    borderRadius: 18,
                                                    padding: spacing.md,
                                                    borderWidth: actif ? 1.5 : 0,
                                                    borderColor: colors.bleu,
                                                    shadowColor: '#3a4a5c',
                                                    shadowOffset: { width: 0, height: 4 },
                                                    shadowOpacity: 0.06,
                                                    shadowRadius: 10,
                                                    elevation: 2,
                                                }}
                                            >
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                                                    <View style={{
                                                        width: 38, height: 38, borderRadius: 19,
                                                        backgroundColor: actif ? colors.bleu : '#edf2f8',
                                                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                        ...(actif ? {
                                                            shadowColor: colors.bleu, shadowOffset: { width: 0, height: 3 },
                                                            shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
                                                        } : {}),
                                                    }}>
                                                        {actif && enLecture
                                                            ? <MiniEgaliseur color="white" />
                                                            : actif
                                                                ? <IconPlay size={15} color="white" />
                                                                : <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.sm, color: colors.bleu }}>{index + 1}</Text>}
                                                    </View>

                                                    <View style={{ flex: 1, minWidth: 0 }}>
                                                        <Text numberOfLines={1} style={{
                                                            fontFamily: typography.fontFamily.semibold,
                                                            fontSize: typography.size.base,
                                                            color: actif ? colors.bleu : colors.texte,
                                                        }}>
                                                            {ep.titre}
                                                        </Text>
                                                        {ep.duree ? (
                                                            <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.xs, color: '#aab4c0', marginTop: 2, fontVariant: ['tabular-nums'] }}>
                                                                {ep.duree}
                                                            </Text>
                                                        ) : null}
                                                    </View>

                                                    {ep.description ? (
                                                        <Pressable
                                                            onPress={() => {
                                                                Haptics.selectionAsync()
                                                                setDescOuverte(descVisible ? null : ep.id)
                                                            }}
                                                            hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                                                            style={{
                                                                width: 30, height: 30, borderRadius: 15,
                                                                backgroundColor: descVisible ? colors.bleu : '#edf2f8',
                                                                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                            }}
                                                        >
                                                            <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: 13, color: descVisible ? 'white' : colors.bleu, fontStyle: 'italic' }}>i</Text>
                                                        </Pressable>
                                                    ) : null}
                                                </View>

                                                {descVisible && ep.description ? (
                                                    <Animated.View entering={FadeIn.duration(200)} style={{
                                                        marginTop: spacing.md,
                                                        paddingTop: spacing.md,
                                                        borderTopWidth: 1,
                                                        borderTopColor: '#eef1f6',
                                                    }}>
                                                        <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: '#5b6675', lineHeight: 21 }}>
                                                            {ep.description}
                                                        </Text>
                                                    </Animated.View>
                                                ) : null}
                                            </PressableScale>
                                        </Animated.View>
                                    )
                                })}
                            </View>
                        )}
                    </Animated.View>
                )}
            </ScrollView>
        </View>
    )
}

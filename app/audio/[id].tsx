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
import BoutonTelecharger from '@/components/BoutonTelecharger'
import { colors, radius, spacing, typography } from '@/constants/theme'
import { useAudio } from '@/contexts/AudioContext'
import { useTelechargement } from '@/contexts/TelechargementContext'
import { supabase } from '@/lib/supabase'
import * as Haptics from 'expo-haptics'
import { useLocalSearchParams } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, StatusBar, Text, View } from 'react-native'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type Episode = {
    id: string
    titre: string
    numero: number
    duree: string
    url_audio: string
    description?: string | null
}

type Cours = {
    id: string
    titre: string
    sheikh: string
    nb_episodes: number
    description: string | null
    categories: { nom: string }
    livres: { url_pdf: string | null } | null
}

export default function DetailCours() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const insets = useSafeAreaInsets()
    const { jouer, piste, enLecture, pause, reprendre } = useAudio()
    const { getCheminLocal } = useTelechargement()

    const [cours, setCours] = useState<Cours | null>(null)
    const [episodes, setEpisodes] = useState<Episode[]>([])
    const [loading, setLoading] = useState(true)
    const [descOuverte, setDescOuverte] = useState<string | null>(null)

    const nomCat = cours?.categories?.nom ?? ''
    const episodeActif = episodes.some(e => e.id === piste?.id)

    useEffect(() => {
        async function charger() {
            const [{ data: c }, { data: e }] = await Promise.all([
                supabase.from('cours').select('id, titre, sheikh, nb_episodes, description, serie_unique, livre_id, categories(nom), livres(url_pdf)').eq('id', id).single(),
                supabase.from('episodes').select('id, titre, numero, duree, url_audio, description').eq('cours_id', id).order('numero'),
            ])
            if (c) setCours(c as any)
            if (e) setEpisodes(e)
            setLoading(false)
        }
        charger()
    }, [id])

    function jouerEpisode(ep: Episode, index: number) {
        const urlLocale = getCheminLocal(ep.id)
        const suivantes = episodes.slice(index + 1).map(e => {
            const locale = getCheminLocal(e.id)
            return {
                id: e.id, titre: e.titre, sheikh: cours?.sheikh ?? '',
                url: locale ?? e.url_audio, duree: e.duree, href: `/audio/${id}`,
            }
        })
        jouer({
            id: ep.id, titre: ep.titre, sheikh: cours?.sheikh ?? '',
            url: urlLocale ?? ep.url_audio, duree: ep.duree, href: `/audio/${id}`,
        }, suivantes)
    }

    function toutEcouter() {
        if (episodes.length === 0) return
        if (episodeActif) {
            enLecture ? pause() : reprendre()
            return
        }
        jouerEpisode(episodes[0], 0)
    }

    const urlPdf = (cours as any)?.livres?.url_pdf
    const nbEpisodes = cours?.nb_episodes ?? episodes.length

    return (
        <View style={{ flex: 1, backgroundColor: colors.fondCreme }}>
            <StatusBar barStyle="light-content" />

            {/* ── Héros ── */}
            <HerosDetail paddingTop={insets.top + spacing.sm}>
                <View style={{ alignItems: 'center' }}>
                    {nomCat ? (
                        <View style={{ backgroundColor: 'rgba(214,173,58,0.16)', borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 4, marginBottom: spacing.sm }}>
                            <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, letterSpacing: 1.8, color: colors.or, textTransform: 'uppercase' }}>
                                {nomCat}
                            </Text>
                        </View>
                    ) : null}

                    <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size['2xl'], color: 'white', lineHeight: 32, textAlign: 'center' }}>
                        {cours?.titre}
                    </Text>

                    <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: W70, marginTop: 6, textAlign: 'center' }}>
                        {cours?.sheikh}{nbEpisodes ? ` · ${nbEpisodes} épisode${nbEpisodes > 1 ? 's' : ''}` : ''}
                    </Text>

                    {cours?.description ? (
                        <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: W70, lineHeight: 21, marginTop: spacing.sm, textAlign: 'center', maxWidth: 300 }}>
                            {cours.description}
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
                        {urlPdf ? (
                            <BoutonHeros
                                icone={<IconLivre size={16} color="white" />}
                                label="Consulter le livre"
                                onPress={() => WebBrowser.openBrowserAsync(urlPdf)}
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
                        <EnTeteSection eyebrow="Épisodes" />
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
                                                                : <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.sm, color: colors.bleu }}>{ep.numero}</Text>}
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

                                                    <BoutonTelecharger
                                                        episode={{
                                                            id: ep.id,
                                                            titre: ep.titre,
                                                            sheikh: cours?.sheikh ?? '',
                                                            coursId: id as string,
                                                            coursTitre: cours?.titre ?? '',
                                                            url: ep.url_audio,
                                                        }}
                                                    />

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

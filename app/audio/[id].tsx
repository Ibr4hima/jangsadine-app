import BoutonTelecharger from '@/components/BoutonTelecharger'
import { colors, radius, spacing, typography } from '@/constants/theme'
import { useAudio } from '@/contexts/AudioContext'
import { useTelechargement } from '@/contexts/TelechargementContext'
import { supabase } from '@/lib/supabase'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { Pause, Play } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, StatusBar, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

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
    const router = useRouter()
    const { jouer, piste, enLecture, pause, reprendre } = useAudio()
    const { getCheminLocal } = useTelechargement()

    const [cours, setCours] = useState<Cours | null>(null)
    const [episodes, setEpisodes] = useState<Episode[]>([])
    const [loading, setLoading] = useState(true)
    const [descOuverte, setDescOuverte] = useState<string | null>(null)
    const [serieUnique, setSerieUnique] = useState(false)
    const [livreId, setLivreId] = useState<string | null>(null)

    const nomCat = cours?.categories?.nom ?? ''

    useEffect(() => {
        async function charger() {
            const [{ data: c }, { data: e }] = await Promise.all([
                supabase.from('cours').select('id, titre, sheikh, nb_episodes, description, serie_unique, livre_id, categories(nom), livres(url_pdf)').eq('id', id).single(),
                supabase.from('episodes').select('id, titre, numero, duree, url_audio, description').eq('cours_id', id).order('numero'),
            ])
            if (c) {
                setCours(c as any)
                setSerieUnique((c as any).serie_unique ?? false)
                setLivreId((c as any).livre_id ?? null)
            }
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
            url: urlLocale ?? ep.url_audio, duree: ep.duree, href: `/audio/${id}`
        }, suivantes)
    }

    const urlPdf = (cours as any)?.livres?.url_pdf

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.fondCreme }} edges={[]}>
            <StatusBar barStyle="light-content" />

            {/* Header bleu */}
            <View style={{ backgroundColor: colors.bleu, padding: spacing.xl, paddingTop: 60, alignItems: 'center' }}>
                <Text style={{
                    fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs,
                    letterSpacing: 2, color: colors.or, textTransform: 'uppercase',
                    marginBottom: spacing.sm, textAlign: 'center',
                }}>
                    {nomCat}
                </Text>
                <Text style={{
                    fontFamily: typography.fontFamily.bold, fontSize: typography.size['2xl'],
                    color: 'white', lineHeight: 32, marginBottom: spacing.sm,
                    textAlign: 'center',
                }}>
                    {cours?.titre}
                </Text>
                <Text style={{
                    fontFamily: typography.fontFamily.regular, fontSize: typography.size.base,
                    color: 'rgba(255,255,255,0.7)', textAlign: 'center',
                }}>
                    {cours?.sheikh} · {cours?.nb_episodes} épisode{(cours?.nb_episodes ?? 0) > 1 ? 's' : ''}
                </Text>

                {cours?.description ? (
                    <Text style={{
                        fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm,
                        color: 'rgba(255,255,255,0.7)', textAlign: 'center',
                        marginTop: spacing.sm, fontStyle: 'italic', maxWidth: 300,
                    }}>
                        {cours.description}
                    </Text>
                ) : null}

                {urlPdf ? (
                    <Pressable
                        onPress={() => WebBrowser.openBrowserAsync(urlPdf)}
                        style={{
                            marginTop: spacing.md,
                            flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
                            borderRadius: radius.md,
                            paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
                        }}
                    >
                        <Text style={{ fontSize: 16 }}>📖</Text>
                        <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.sm, color: 'white' }}>
                            Consulter le livre
                        </Text>
                    </Pressable>
                ) : null}
            </View>

            {/* Barre or */}
            <View style={{ height: 3, backgroundColor: colors.or, opacity: 0.6 }} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
                <View style={{ padding: spacing.lg }}>
                    <Text style={{
                        fontFamily: typography.fontFamily.bold,
                        fontSize: typography.size.xs, letterSpacing: 2,
                        color: colors.or, textTransform: 'uppercase',
                        marginBottom: spacing.md,
                    }}>
                        Épisodes
                    </Text>

                    {loading
                        ? [1, 2, 3, 4, 5].map(i => (
                            <View key={i} style={{ height: 64, borderRadius: radius.lg, backgroundColor: colors.bordure, opacity: 0.4, marginBottom: spacing.sm }} />
                        ))
                        : episodes.map((ep, index) => {
                            const actif = piste?.id === ep.id
                            const descVisible = descOuverte === ep.id

                            return (
                                <View key={ep.id} style={{ marginBottom: spacing.sm }}>
                                    <Pressable onPress={() => {
                                        if (actif) {
                                            enLecture ? pause() : reprendre()
                                        } else {
                                            jouerEpisode(ep, index)
                                        }
                                    }}>
                                        <View style={{
                                            backgroundColor: actif ? '#e8f0f8' : colors.blanc,
                                            borderTopLeftRadius: radius.lg,
                                            borderTopRightRadius: radius.lg,
                                            borderBottomLeftRadius: descVisible ? 0 : radius.lg,
                                            borderBottomRightRadius: descVisible ? 0 : radius.lg,
                                            borderWidth: 1,
                                            borderColor: actif ? colors.bleu : colors.bordure,
                                            borderBottomWidth: descVisible ? 0 : 1,
                                            padding: spacing.md,
                                            flexDirection: 'row', alignItems: 'center',
                                        }}>
                                            <View style={{
                                                width: 36, height: 36, borderRadius: radius.full,
                                                backgroundColor: actif ? colors.bleu : '#f5f5f5',
                                                alignItems: 'center', justifyContent: 'center',
                                                marginRight: spacing.md, flexShrink: 0,
                                            }}>
                                                {actif && enLecture
                                                    ? <Pause size={13} color="white" fill="white" strokeWidth={0} />
                                                    : actif
                                                        ? <Play size={13} color="white" fill="white" strokeWidth={0} style={{ marginLeft: 2 }} />
                                                        : <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.xs, color: '#999' }}>{ep.numero}</Text>
                                                }
                                            </View>

                                            <View style={{ flex: 1, minWidth: 0, marginRight: spacing.sm }}>
                                                <Text numberOfLines={1} style={{
                                                    fontFamily: typography.fontFamily.semibold,
                                                    fontSize: typography.size.base,
                                                    color: actif ? colors.bleu : colors.texte,
                                                }}>
                                                    {ep.titre}
                                                </Text>
                                                {ep.duree ? (
                                                    <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.xs, color: '#bbb', marginTop: 2 }}>
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
                                                    onPress={() => setDescOuverte(descVisible ? null : ep.id)}
                                                    style={{
                                                        width: 28, height: 28, borderRadius: radius.full,
                                                        backgroundColor: descVisible ? colors.bleu : '#f0f0f0',
                                                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                        marginLeft: spacing.xs,
                                                    }}
                                                >
                                                    <Text style={{ fontSize: 12, color: descVisible ? 'white' : '#888' }}>i</Text>
                                                </Pressable>
                                            ) : null}
                                        </View>
                                    </Pressable>

                                    {descVisible && ep.description ? (
                                        <View style={{
                                            backgroundColor: '#f8f6f1',
                                            borderWidth: 1, borderTopWidth: 0,
                                            borderColor: colors.bleu,
                                            borderBottomLeftRadius: radius.lg,
                                            borderBottomRightRadius: radius.lg,
                                            padding: spacing.md,
                                        }}>
                                            <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: '#555', lineHeight: 22 }}>
                                                {ep.description}
                                            </Text>
                                        </View>
                                    ) : null}
                                </View>
                            )
                        })
                    }
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}
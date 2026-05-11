import { colors, radius, spacing, typography } from '@/constants/theme'
import { useAudio } from '@/contexts/AudioContext'
import { supabase } from '@/lib/supabase'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { Pause, Play } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, StatusBar, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import TextTicker from 'react-native-text-ticker'

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
    const { id, chapitreId } = useLocalSearchParams<{ id: string, chapitreId: string }>()
    const { jouer, piste, enLecture, pause, reprendre } = useAudio()
    const [chapitre, setChapitre] = useState<Chapitre | null>(null)
    const [episodes, setEpisodes] = useState<Episode[]>([])
    const [loading, setLoading] = useState(true)
    const [descOuverte, setDescOuverte] = useState<string | null>(null)

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

    const categorie = (chapitre?.livre?.categories as any)?.nom || ''

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.fondCreme }} edges={[]}>
            <StatusBar barStyle="light-content" />

            {/* Header bleu */}
            <View style={{ backgroundColor: colors.bleu, padding: spacing.xl, paddingTop: 60, alignItems: 'center' }}>
                <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, letterSpacing: 2, color: colors.or, textTransform: 'uppercase', marginBottom: spacing.sm, textAlign: 'center' }}>
                    Chapitre {chapitre?.numero}
                </Text>
                <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size['2xl'], color: 'white', lineHeight: 32, marginBottom: spacing.sm, textAlign: 'center' }}>
                    {chapitre?.titre}
                </Text>
                {chapitre?.url_pdf ? (
                    <Pressable
                        onPress={() => WebBrowser.openBrowserAsync(chapitre.url_pdf!)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginTop: spacing.sm }}
                    >
                        <Text>📖</Text>
                        <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.sm, color: 'white' }}>Consulter ce chapitre</Text>
                    </Pressable>
                ) : null}
            </View>

            {/* Barre or */}
            <LinearGradient
                colors={['transparent', '#d9ac2a', '#d9ac2a', 'transparent']}
                locations={[0, 0.3, 0.7, 1]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ height: 3 }}
            />

            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontFamily: typography.fontFamily.regular, color: colors.texteMuted }}>Chargement...</Text>
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 160 }}>
                    <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, letterSpacing: 2, color: colors.or, textTransform: 'uppercase', marginBottom: spacing.md }}>
                        {episodes.length} épisode{episodes.length > 1 ? 's' : ''}
                    </Text>

                    <View style={{ gap: spacing.sm }}>
                        {episodes.map((ep, index) => {
                            const actif = piste?.id === ep.id
                            const descVisible = descOuverte === ep.id
                            return (
                                <View key={ep.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
                                    {/* Numéro */}
                                    <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.sm, color: '#bbb', width: 24, textAlign: 'right', flexShrink: 0, paddingTop: 14 }}>
                                        {index + 1}
                                    </Text>
                                    <View style={{ flex: 1 }}>
                                        <Pressable onPress={() => {
                                            if (actif) { enLecture ? pause() : reprendre() }
                                            else jouerEpisode(ep, index)
                                        }}>
                                            <View style={{
                                                backgroundColor: actif ? '#e8f0f8' : colors.blanc,
                                                borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
                                                borderBottomLeftRadius: descVisible ? 0 : radius.lg,
                                                borderBottomRightRadius: descVisible ? 0 : radius.lg,
                                                borderWidth: 1, borderColor: actif ? colors.bleu : colors.bordure,
                                                borderBottomWidth: descVisible ? 0 : 1,
                                                padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md,
                                            }}>
                                                <View style={{ width: 36, height: 36, borderRadius: radius.full, backgroundColor: actif ? colors.bleu : '#f0f0f0', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    {actif && enLecture
                                                        ? <Pause size={13} color="white" fill="white" strokeWidth={0} />
                                                        : <Play size={13} color={actif ? 'white' : '#aaa'} fill={actif ? 'white' : '#aaa'} strokeWidth={0} style={{ marginLeft: 2 }} />
                                                    }
                                                </View>
                                                <View style={{ flex: 1, minWidth: 0 }}>
                                                    <TextTicker
                                                        style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base, color: actif ? colors.bleu : colors.texte }}
                                                        loop bounce={false} repeatSpacer={50} marqueeDelay={2000} scrollSpeed={10}
                                                    >
                                                        {ep.titre}
                                                    </TextTicker>
                                                    {ep.duree ? (
                                                        <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.xs, color: '#bbb', marginTop: 2 }}>{ep.duree}</Text>
                                                    ) : null}
                                                </View>
                                                {ep.description ? (
                                                    <Pressable
                                                        onPress={() => setDescOuverte(descVisible ? null : ep.id)}
                                                        style={{ width: 28, height: 28, borderRadius: radius.full, backgroundColor: descVisible ? colors.bleu : '#f0f0f0', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                                                    >
                                                        <Text style={{ fontSize: 12, color: descVisible ? 'white' : '#888' }}>i</Text>
                                                    </Pressable>
                                                ) : null}
                                            </View>
                                        </Pressable>
                                        {descVisible && ep.description ? (
                                            <View style={{ backgroundColor: '#f8f6f1', borderWidth: 1, borderTopWidth: 0, borderColor: colors.bleu, borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg, padding: spacing.md }}>
                                                <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: '#555', lineHeight: 22 }}>
                                                    {ep.description}
                                                </Text>
                                            </View>
                                        ) : null}
                                    </View>
                                </View>
                            )
                        })}
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    )
}
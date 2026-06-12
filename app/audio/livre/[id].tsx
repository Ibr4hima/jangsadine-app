import {
    BoutonHeros,
    couleurBg, couleurTxt,
    EnTeteSection,
    EtatVideDetail,
    HerosDetail,
    IconCasque,
    IconLivre,
    IconMusicNote,
    MiniEgaliseur,
    PressableScale,
    Squelettes,
    W70,
} from '@/components/AudioUI'
import { colors, radius, spacing, typography } from '@/constants/theme'
import { useAudio } from '@/contexts/AudioContext'
import { supabase } from '@/lib/supabase'
import * as Haptics from 'expo-haptics'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useEffect, useState } from 'react'
import { ScrollView, StatusBar, Text, View } from 'react-native'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import TextTicker from 'react-native-text-ticker'

export default function PageLivre() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const { jouer, piste, enLecture, pause, reprendre } = useAudio()
    const [livre, setLivre] = useState<any>(null)
    const [versions, setVersions] = useState<any[]>([])
    const [chapitres, setChapitres] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const livreAudioId = `livre_${id}`
    const livreActif = piste?.id === livreAudioId
    const enLectureLivre = livreActif && enLecture

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
    const bg = couleurBg[categorie] ?? '#edf2f8'
    const txt = couleurTxt[categorie] ?? colors.bleu

    const jouerLivre = () => {
        if (!livre?.url_audio) return
        if (livreActif) {
            enLecture ? pause() : reprendre()
        } else {
            jouer({ id: livreAudioId, titre: livre.titre, sheikh: livre.titre_arabe ?? livre.sheikh ?? '', url: livre.url_audio })
        }
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.fondCreme }}>
            <StatusBar barStyle="light-content" />

            {/* ── Héros ── */}
            <HerosDetail paddingTop={insets.top + spacing.sm}>
                <View style={{ alignItems: 'center' }}>
                    {categorie ? (
                        <View style={{ backgroundColor: 'rgba(214,173,58,0.16)', borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 4, marginBottom: spacing.sm }}>
                            <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, letterSpacing: 1.8, color: colors.or, textTransform: 'uppercase' }}>
                                {categorie}
                            </Text>
                        </View>
                    ) : null}

                    <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size['2xl'], color: 'white', lineHeight: 32, textAlign: 'center' }}>
                        {livre?.titre}
                    </Text>

                    {livre?.titre_arabe ? (
                        <Text style={{ fontFamily: typography.fontFamily.arabic, fontSize: typography.size.md, color: W70, marginTop: 6, textAlign: 'center' }}>
                            {livre.titre_arabe}
                        </Text>
                    ) : null}

                    {livre?.type === 'chapitres' || livre?.sheikh ? (
                        <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: W70, marginTop: 6, textAlign: 'center' }}>
                            {livre?.type === 'chapitres'
                                ? `${livre?.sheikh ? livre.sheikh + ' · ' : ''}${chapitres.length} chapitre${chapitres.length > 1 ? 's' : ''}`
                                : livre?.sheikh}
                        </Text>
                    ) : null}

                    {livre?.description ? (
                        <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: W70, lineHeight: 21, marginTop: spacing.sm, textAlign: 'center', maxWidth: 300 }}>
                            {livre.description}
                        </Text>
                    ) : null}

                    {(livre?.url_pdf || livre?.url_audio) ? (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg, justifyContent: 'center' }}>
                            {livre?.url_pdf ? (
                                <BoutonHeros
                                    icone={<IconLivre size={16} color="white" />}
                                    label="Consulter le livre"
                                    onPress={() => WebBrowser.openBrowserAsync(livre.url_pdf)}
                                />
                            ) : null}
                            {livre?.url_audio ? (
                                <BoutonHeros
                                    icone={enLectureLivre
                                        ? <MiniEgaliseur color={colors.or} hauteur={12} />
                                        : <IconCasque size={16} color="white" />}
                                    label={livreActif ? (enLecture ? 'En lecture' : 'Reprendre') : 'Écouter le livre'}
                                    onPress={jouerLivre}
                                    actif={livreActif}
                                />
                            ) : null}
                        </View>
                    ) : null}
                </View>
            </HerosDetail>

            {/* ── Contenu ── */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.xl, paddingBottom: 170 }}>
                {loading ? (
                    <Squelettes n={4} h={80} />
                ) : livre?.type === 'chapitres' ? (
                    /* ── MODE CHAPITRES ── */
                    <Animated.View entering={FadeIn.duration(220)}>
                        <EnTeteSection
                            eyebrow="Table des matières"
                            titre={`${chapitres.length} chapitre${chapitres.length > 1 ? 's' : ''}`}
                        />
                        {chapitres.length === 0 ? (
                            <EtatVideDetail message="Les chapitres arrivent bientôt" />
                        ) : (
                            <View style={{ gap: spacing.sm }}>
                                {chapitres.map((chap, i) => (
                                    <Animated.View key={chap.id} entering={FadeInDown.duration(350).delay(Math.min(i, 8) * 45)}>
                                        <PressableScale
                                            onPress={() => {
                                                Haptics.selectionAsync()
                                                router.push(`/audio/livre/${id}/chapitre/${chap.id}` as any)
                                            }}
                                            style={{
                                                backgroundColor: colors.blanc,
                                                borderRadius: 18,
                                                paddingVertical: spacing.md,
                                                paddingHorizontal: spacing.md,
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                gap: spacing.md,
                                                shadowColor: '#3a4a5c',
                                                shadowOffset: { width: 0, height: 4 },
                                                shadowOpacity: 0.06,
                                                shadowRadius: 10,
                                                elevation: 2,
                                            }}
                                        >
                                            <View style={{
                                                width: 38, height: 38, borderRadius: 19,
                                                backgroundColor: bg,
                                                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                            }}>
                                                <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.sm, color: txt }}>
                                                    {chap.numero}
                                                </Text>
                                            </View>
                                            <TextTicker
                                                style={{ flex: 1, fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base, color: colors.texte }}
                                                loop bounce={false} repeatSpacer={50} marqueeDelay={2000} scrollSpeed={10}
                                            >
                                                {chap.titre}
                                            </TextTicker>
                                        </PressableScale>
                                    </Animated.View>
                                ))}
                            </View>
                        )}
                    </Animated.View>
                ) : (
                    /* ── MODE VERSIONS ── */
                    <Animated.View entering={FadeIn.duration(220)}>
                        <EnTeteSection
                            eyebrow="Versions disponibles"
                            titre={`${versions.length} version${versions.length > 1 ? 's' : ''} de ce cours`}
                        />
                        {versions.length === 0 ? (
                            <EtatVideDetail message="Les audios de ce cours arrivent bientôt" />
                        ) : (
                            <View style={{ gap: spacing.sm }}>
                                {versions.map((v, i) => {
                                    const versionActive = piste?.href === `/audio/${v.id}`
                                    return (
                                        <Animated.View key={v.id} entering={FadeInDown.duration(350).delay(Math.min(i, 8) * 45)}>
                                            <PressableScale
                                                onPress={() => {
                                                    Haptics.selectionAsync()
                                                    router.push(`/audio/${v.id}` as any)
                                                }}
                                                style={{
                                                    backgroundColor: colors.blanc,
                                                    borderRadius: 18,
                                                    padding: spacing.md,
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    gap: spacing.md,
                                                    borderWidth: versionActive ? 1.5 : 0,
                                                    borderColor: colors.bleu,
                                                    shadowColor: '#3a4a5c',
                                                    shadowOffset: { width: 0, height: 4 },
                                                    shadowOpacity: 0.06,
                                                    shadowRadius: 10,
                                                    elevation: 2,
                                                }}
                                            >
                                                <View style={{
                                                    width: 44, height: 44, borderRadius: 22,
                                                    backgroundColor: versionActive ? colors.bleu : '#e8f0f8',
                                                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                    ...(versionActive ? {
                                                        shadowColor: colors.bleu, shadowOffset: { width: 0, height: 3 },
                                                        shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
                                                    } : {}),
                                                }}>
                                                    {versionActive && enLecture
                                                        ? <MiniEgaliseur color="white" hauteur={16} />
                                                        : <IconMusicNote size={20} color={versionActive ? 'white' : colors.bleu} />}
                                                </View>
                                                <View style={{ flex: 1, minWidth: 0 }}>
                                                    <Text numberOfLines={1} style={{
                                                        fontFamily: typography.fontFamily.semibold,
                                                        fontSize: typography.size.base,
                                                        color: versionActive ? colors.bleu : colors.texte,
                                                    }}>
                                                        {v.sheikh}
                                                    </Text>
                                                    <Text style={{
                                                        fontFamily: typography.fontFamily.regular,
                                                        fontSize: typography.size.sm,
                                                        color: colors.texteMuted,
                                                        marginTop: 3,
                                                    }}>
                                                        {v.nb_episodes} épisode{v.nb_episodes > 1 ? 's' : ''}
                                                    </Text>
                                                </View>
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

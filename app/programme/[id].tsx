import {
  BoutonHeros,
  EnTeteSection,
  EtatVideDetail,
  HerosDetail,
  IconPlay,
  MiniEgaliseur,
  PressableScale,
  W70,
} from '@/components/AudioUI'
import { colors, radius, spacing, typography } from '@/constants/theme'
import { useAudio } from '@/contexts/AudioContext'
import { chargerProgrammes, CoursProgramme, Programme, sauvegarderProgrammes } from '@/lib/programmes'
import { supabase } from '@/lib/supabase'
import * as Haptics from 'expo-haptics'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  FlatList, Modal, Pressable,
  ScrollView, StatusBar, Text, TextInput, View,
} from 'react-native'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import TextTicker from 'react-native-text-ticker'

const VERT = '#2d7a4f'
const VERT_BG = '#eaf4ee'

function IconAjouter({ size = 16, color = 'white' }: { size?: number, color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" fill={color} />
    </Svg>
  )
}
function IconCheck({ size = 16, color = 'white' }: { size?: number, color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" fill={color} />
    </Svg>
  )
}
function IconFermer({ size = 20, color = colors.texte }: { size?: number, color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" fill={color} />
    </Svg>
  )
}
function IconRecherche({ size = 18, color = '#aab4c0' }: { size?: number, color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" fill={color} />
    </Svg>
  )
}
function IconCasqueBleu({ size = 18, color = colors.bleu }: { size?: number, color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path d="M360-120H200q-33 0-56.5-23.5T120-200v-280q0-75 28.5-140.5t77-114q48.5-48.5 114-77T480-840q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-480v280q0 33-23.5 56.5T760-120H600v-320h160v-40q0-117-81.5-198.5T480-760q-117 0-198.5 81.5T200-480v40h160v320Zm-80-240h-80v160h80v-160Zm400 0v160h80v-160h-80Zm-400 0h-80 80Zm400 0h80-80Z" fill={color} />
    </Svg>
  )
}

export default function DetailProgramme() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { jouer, piste, enLecture, pause, reprendre } = useAudio()

  const [programmes, setProgrammes] = useState<Programme[]>([])
  const [modalAjouter, setModalAjouter] = useState(false)
  const [coursDispo, setCoursDispo] = useState<CoursProgramme[]>([])
  const [recherche, setRecherche] = useState('')

  const prog = programmes.find(p => p.id === id) ?? null
  const nbCours = prog?.cours.length ?? 0
  const termines = prog?.coursTermines ?? []
  const nbTermines = termines.filter(t => prog?.cours.some(c => c.id === t)).length
  const pct = nbCours > 0 ? (nbTermines / nbCours) * 100 : 0
  const programmeActif = piste?.programmeId === id

  useFocusEffect(useCallback(() => {
    chargerProgrammes().then(setProgrammes)
  }, []))

  // Catalogue de cours pour le modal d'ajout
  useEffect(() => {
    if (!modalAjouter || coursDispo.length > 0) return
    supabase
      .from('cours')
      .select('id, titre, sheikh, nb_episodes, categories(nom)')
      .order('titre')
      .then(({ data }) => { if (data) setCoursDispo(data as any) })
  }, [modalAjouter])

  const majProgramme = async (modif: (p: Programme) => Programme) => {
    const mis = programmes.map(p => (p.id === id ? modif(p) : p))
    setProgrammes(mis)
    await sauvegarderProgrammes(mis)
  }

  const basculerTermine = (coursId: string) => {
    const dejaFait = termines.includes(coursId)
    Haptics.notificationAsync(dejaFait
      ? Haptics.NotificationFeedbackType.Warning
      : Haptics.NotificationFeedbackType.Success)
    majProgramme(p => ({
      ...p,
      coursTermines: dejaFait
        ? p.coursTermines.filter(t => t !== coursId)
        : [...p.coursTermines, coursId],
    }))
  }

  const ajouterCours = (cours: CoursProgramme) => {
    Haptics.selectionAsync()
    majProgramme(p => p.cours.some(c => c.id === cours.id)
      ? p
      : { ...p, cours: [...p.cours, cours] })
  }

  const retirerCours = (coursId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    majProgramme(p => ({
      ...p,
      cours: p.cours.filter(c => c.id !== coursId),
      coursTermines: p.coursTermines.filter(t => t !== coursId),
    }))
  }

  // File de lecture : tous les épisodes de tous les cours, dans l'ordre du programme
  const toutEcouter = async () => {
    if (!prog || prog.cours.length === 0) return
    if (programmeActif) { enLecture ? pause() : reprendre(); return }
    const ids = prog.cours.map(c => c.id)
    const { data: eps } = await supabase
      .from('episodes')
      .select('id, titre, numero, duree, url_audio, cours_id')
      .in('cours_id', ids)
      .order('numero')
    if (!eps || eps.length === 0) return
    const parCours = new Map<string, any[]>()
    for (const e of eps) {
      const liste = parCours.get(e.cours_id) ?? []
      liste.push(e)
      parCours.set(e.cours_id, liste)
    }
    const pistes = prog.cours.flatMap(c =>
      (parCours.get(c.id) ?? []).map((e: any) => ({
        id: e.id, titre: e.titre, sheikh: c.sheikh,
        url: e.url_audio, duree: e.duree,
        href: `/audio/${c.id}`, programmeId: prog.id,
      }))
    )
    if (pistes.length === 0) return
    jouer(pistes[0], pistes.slice(1))
  }

  const coursFiltres = coursDispo.filter(c =>
    c.titre.toLowerCase().includes(recherche.toLowerCase()) ||
    c.sheikh.toLowerCase().includes(recherche.toLowerCase())
  )

  return (
    <View style={{ flex: 1, backgroundColor: colors.fondCreme }}>
      <StatusBar barStyle="light-content" />

      {/* ── Héros ── */}
      <HerosDetail paddingTop={insets.top + spacing.sm}>
        <View style={{ alignItems: 'center' }}>
          <View style={{ backgroundColor: 'rgba(214,173,58,0.16)', borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 4, marginBottom: spacing.sm }}>
            <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, letterSpacing: 1.8, color: colors.or, textTransform: 'uppercase' }}>
              Programme
            </Text>
          </View>

          <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size['2xl'], color: 'white', lineHeight: 32, textAlign: 'center' }}>
            {prog?.nom}
          </Text>

          {prog?.intention ? (
            <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: W70, marginTop: 6, textAlign: 'center', maxWidth: 300 }}>
              {prog.intention}
            </Text>
          ) : null}

          {nbCours > 0 ? (
            <View style={{ width: '100%', maxWidth: 300, marginTop: spacing.lg }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.xs, color: W70 }}>
                  {nbTermines} / {nbCours} cours terminé{nbTermines > 1 ? 's' : ''}
                </Text>
                <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, color: colors.or, fontVariant: ['tabular-nums'] }}>
                  {Math.round(pct)}%
                </Text>
              </View>
              <View style={{ height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' }}>
                <View style={{ width: `${pct}%`, height: '100%', borderRadius: 2.5, backgroundColor: colors.or }} />
              </View>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg, justifyContent: 'center' }}>
            {nbCours > 0 ? (
              <BoutonHeros
                icone={programmeActif && enLecture
                  ? <MiniEgaliseur color={colors.or} hauteur={12} />
                  : <IconPlay size={16} color="white" />}
                label={programmeActif ? (enLecture ? 'En lecture' : 'Reprendre') : 'Tout écouter'}
                onPress={toutEcouter}
                actif={programmeActif}
              />
            ) : null}
            <BoutonHeros
              icone={<IconAjouter size={16} color="white" />}
              label="Ajouter des cours"
              onPress={() => setModalAjouter(true)}
            />
          </View>
        </View>
      </HerosDetail>

      {/* ── Cours du programme ── */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.xl, paddingBottom: 170 }}>
        <Animated.View entering={FadeIn.duration(220)}>
          <EnTeteSection
            eyebrow="Parcours"
            titre={nbCours > 0 ? `${nbCours} cours` : undefined}
          />
          {nbCours === 0 ? (
            <EtatVideDetail message="Ajoute des cours audio pour composer ton programme" />
          ) : (
            <View style={{ gap: spacing.sm }}>
              {prog!.cours.map((c, i) => {
                const fait = termines.includes(c.id)
                return (
                  <Animated.View key={c.id} entering={FadeInDown.duration(350).delay(Math.min(i, 8) * 45)}>
                    <PressableScale
                      onPress={() => {
                        Haptics.selectionAsync()
                        router.push(`/audio/${c.id}` as any)
                      }}
                      style={{
                        backgroundColor: colors.blanc,
                        borderRadius: 18,
                        padding: spacing.md,
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
                      {/* Coche « terminé » */}
                      <Pressable
                        onPress={() => basculerTermine(c.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 6 }}
                        style={{
                          width: 28, height: 28, borderRadius: 14,
                          backgroundColor: fait ? VERT : 'transparent',
                          borderWidth: fait ? 0 : 2,
                          borderColor: '#cdd6e0',
                          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          ...(fait ? {
                            shadowColor: VERT, shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3, shadowRadius: 4, elevation: 3,
                          } : {}),
                        }}
                      >
                        {fait ? <IconCheck size={15} color="white" /> : null}
                      </Pressable>

                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text numberOfLines={1} style={{
                          fontFamily: typography.fontFamily.semibold,
                          fontSize: typography.size.base,
                          color: fait ? '#9aa6b4' : colors.texte,
                          textDecorationLine: fait ? 'line-through' : 'none',
                        }}>
                          {c.titre}
                        </Text>
                        <Text numberOfLines={1} style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: fait ? '#b3bdc9' : colors.texteMuted, marginTop: 2 }}>
                          {c.sheikh}{c.nb_episodes ? ` · ${c.nb_episodes} épisode${c.nb_episodes > 1 ? 's' : ''}` : ''}
                        </Text>
                      </View>

                      {fait ? (
                        <View style={{ backgroundColor: VERT_BG, borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 4, flexShrink: 0 }}>
                          <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, color: VERT }}>
                            Terminé
                          </Text>
                        </View>
                      ) : null}

                      <Pressable
                        onPress={() => retirerCours(c.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 6, right: 10 }}
                        style={{ padding: 2 }}
                      >
                        <IconFermer size={15} color="#c2ccd6" />
                      </Pressable>
                    </PressableScale>
                  </Animated.View>
                )
              })}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* ── Modal ajouter des cours ── */}
      <Modal visible={modalAjouter} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalAjouter(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.fondCreme }} edges={['top', 'bottom']}>
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: spacing.xl, paddingVertical: spacing.lg,
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xl, color: colors.texte }}>
                Ajouter des cours
              </Text>
              <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: colors.texteMuted, marginTop: 2 }}>
                Touche un cours pour l'ajouter ou le retirer
              </Text>
            </View>
            <Pressable
              onPress={() => { setModalAjouter(false); setRecherche('') }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{
                width: 34, height: 34, borderRadius: 17,
                backgroundColor: '#e9ecf1',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <IconFermer size={17} color="#5b6675" />
            </Pressable>
          </View>

          {/* Recherche */}
          <View style={{
            marginHorizontal: spacing.xl, marginBottom: spacing.md,
            flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
            backgroundColor: colors.blanc, borderRadius: 16,
            paddingHorizontal: spacing.md,
            shadowColor: '#3a4a5c', shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.05, shadowRadius: 8, elevation: 1,
          }}>
            <IconRecherche size={18} />
            <TextInput
              value={recherche}
              onChangeText={setRecherche}
              placeholder="Rechercher…"
              placeholderTextColor="#aab4c0"
              style={{
                flex: 1, fontFamily: typography.fontFamily.medium,
                fontSize: typography.size.base, color: colors.texte,
                paddingVertical: 13,
              }}
            />
            {recherche.length > 0 ? (
              <Pressable onPress={() => setRecherche('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <IconFermer size={15} color="#aab4c0" />
              </Pressable>
            ) : null}
          </View>

          <FlatList
            data={coursFiltres}
            keyExtractor={item => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 40, gap: spacing.sm }}
            ListEmptyComponent={
              <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.base, color: colors.texteMuted, textAlign: 'center', paddingVertical: spacing['2xl'] }}>
                Aucun cours trouvé
              </Text>
            }
            renderItem={({ item }) => {
              const ajoute = prog?.cours.some(c => c.id === item.id) ?? false
              return (
                <Pressable
                  onPress={() => (ajoute ? retirerCours(item.id) : ajouterCours(item))}
                  style={({ pressed }) => ({
                    backgroundColor: colors.blanc,
                    borderRadius: 18,
                    padding: spacing.md,
                    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
                    borderWidth: ajoute ? 1.5 : 0,
                    borderColor: VERT,
                    opacity: pressed ? 0.75 : 1,
                    shadowColor: '#3a4a5c', shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.05, shadowRadius: 8, elevation: 1,
                  })}
                >
                  <View style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: ajoute ? VERT_BG : '#e8f0f8',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <IconCasqueBleu size={19} color={ajoute ? VERT : colors.bleu} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <TextTicker
                      style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base, color: colors.texte }}
                      loop bounce={false} repeatSpacer={60} marqueeDelay={2500} scrollSpeed={18}
                    >
                      {item.titre}
                    </TextTicker>
                    <Text numberOfLines={1} style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: colors.texteMuted, marginTop: 2 }}>
                      {item.sheikh}{item.nb_episodes ? ` · ${item.nb_episodes} épisode${item.nb_episodes > 1 ? 's' : ''}` : ''}
                    </Text>
                  </View>
                  <View style={{
                    width: 28, height: 28, borderRadius: 14,
                    backgroundColor: ajoute ? VERT : '#e8f0f8',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {ajoute
                      ? <IconCheck size={14} color="white" />
                      : <IconAjouter size={14} color={colors.bleu} />}
                  </View>
                </Pressable>
              )
            }}
          />
        </SafeAreaView>
      </Modal>
    </View>
  )
}

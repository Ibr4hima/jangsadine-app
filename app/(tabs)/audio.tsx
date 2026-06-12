import { colors, radius, spacing, typography } from '@/constants/theme'
import { useAudio } from '@/contexts/AudioContext'
import { useScroll } from '@/contexts/ScrollContext'
import { supabase } from '@/lib/supabase'
import * as Haptics from 'expo-haptics'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { ReactNode, useEffect, useRef, useState } from 'react'
import {
  Modal, Platform, Pressable, ScrollView,
  StatusBar, Text, TextInput, View, ViewStyle,
} from 'react-native'
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import TextTicker from 'react-native-text-ticker'

// ─── palette héros (cohérente accueil / prières) ──────────────
const BG_TOP = '#3d6ba3'
const BG_MID = '#2d578c'
const BG_BOT = '#234a7a'
const W90 = 'rgba(255,255,255,0.90)'
const W70 = 'rgba(255,255,255,0.70)'
const W55 = 'rgba(255,255,255,0.55)'
const W14 = 'rgba(255,255,255,0.14)'
const W10 = 'rgba(255,255,255,0.10)'

// ─── icônes ───────────────────────────────────────────────────
function IconSearch({ size = 22, color = '#1f1f1f' }: { size?: number, color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" fill={color} />
    </Svg>
  )
}
function IconX({ size = 16, color = '#888' }: { size?: number, color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" fill={color} />
    </Svg>
  )
}
function IconPlay({ size = 16, color = 'white' }: { size?: number, color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path d="M320-200v-560l440 280-440 280Z" fill={color} />
    </Svg>
  )
}
function IconPause({ size = 16, color = 'white' }: { size?: number, color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path d="M560-200v-560h160v560H560Zm-320 0v-560h160v560H240Z" fill={color} />
    </Svg>
  )
}
function IconChevron({ size = 18, color = '#bbb' }: { size?: number, color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" fill={color} />
    </Svg>
  )
}
function IconFiltre({ size = 16, color = '#666' }: { size?: number, color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path d="M440-120v-240h80v80h320v80H520v80h-80Zm-320-80v-80h240v80H120Zm160-160v-80H120v-80h160v-80h80v240h-80Zm160-80v-80h440v80H440Zm160-160v-240h80v80h160v80H680v80h-80Zm-480-80v-80h440v80H120Z" fill={color} />
    </Svg>
  )
}

const SECTIONS = [
  { key: 'cours', label: 'Cours' },
  { key: 'conferences', label: 'Conférences' },
  { key: 'khoutbah', label: 'Khoutbah' },
  { key: 'fatwas', label: 'Fatwas' },
]

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

function normaliser(texte: string): string {
  return texte.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

// ─── pressable avec scale ressort ─────────────────────────────
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

function PressableScale({ onPress, style, children }: {
  onPress: () => void
  style?: ViewStyle | ViewStyle[]
  children: ReactNode
}) {
  const s = useSharedValue(1)
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }))
  return (
    <AnimatedPressable
      onPressIn={() => { s.value = withSpring(0.975, { damping: 18, stiffness: 420 }) }}
      onPressOut={() => { s.value = withSpring(1, { damping: 15, stiffness: 320 }) }}
      onPress={onPress}
      style={[style as any, a]}
    >
      {children}
    </AnimatedPressable>
  )
}

// ─── mini égaliseur (piste en cours de lecture) ───────────────
function MiniEgaliseur({ color = 'white' }: { color?: string }) {
  const b1 = useSharedValue(0.4)
  const b2 = useSharedValue(0.8)
  const b3 = useSharedValue(0.55)

  useEffect(() => {
    b1.value = withRepeat(withSequence(
      withTiming(1, { duration: 340, easing: Easing.inOut(Easing.ease) }),
      withTiming(0.25, { duration: 400, easing: Easing.inOut(Easing.ease) }),
    ), -1, true)
    b2.value = withRepeat(withSequence(
      withTiming(0.3, { duration: 300, easing: Easing.inOut(Easing.ease) }),
      withTiming(1, { duration: 380, easing: Easing.inOut(Easing.ease) }),
    ), -1, true)
    b3.value = withRepeat(withSequence(
      withTiming(0.9, { duration: 360, easing: Easing.inOut(Easing.ease) }),
      withTiming(0.35, { duration: 320, easing: Easing.inOut(Easing.ease) }),
    ), -1, true)
    return () => { cancelAnimation(b1); cancelAnimation(b2); cancelAnimation(b3) }
  }, [])

  const H = 14
  const s1 = useAnimatedStyle(() => ({ height: b1.value * H + 3 }))
  const s2 = useAnimatedStyle(() => ({ height: b2.value * H + 3 }))
  const s3 = useAnimatedStyle(() => ({ height: b3.value * H + 3 }))
  const bar = { width: 2.5, borderRadius: 2, backgroundColor: color } as const

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2.5, height: H + 3 }}>
      <Animated.View style={[bar, s1]} />
      <Animated.View style={[bar, s2]} />
      <Animated.View style={[bar, s3]} />
    </View>
  )
}

// ─── pastille play / pause / égaliseur ────────────────────────
function PastillePlay({ actif, enLecture, taille = 42 }: { actif: boolean, enLecture: boolean, taille?: number }) {
  return (
    <View style={{
      width: taille, height: taille, borderRadius: taille / 2,
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
          ? <IconPlay size={16} color="white" />
          : <IconPlay size={16} color={colors.bleu} />}
    </View>
  )
}

// ─── squelette de chargement (pulse) ──────────────────────────
function Squelette({ h, style }: { h: number, style?: ViewStyle }) {
  const op = useSharedValue(0.35)
  useEffect(() => {
    op.value = withRepeat(withSequence(
      withTiming(0.65, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      withTiming(0.35, { duration: 700, easing: Easing.inOut(Easing.ease) }),
    ), -1, true)
    return () => cancelAnimation(op)
  }, [])
  const a = useAnimatedStyle(() => ({ opacity: op.value }))
  return <Animated.View style={[{ height: h, borderRadius: 18, backgroundColor: '#dde3ea' }, style, a]} />
}

function Squelettes({ n = 4, h = 76 }: { n?: number, h?: number }) {
  return (
    <View style={{ gap: spacing.sm }}>
      {Array.from({ length: n }).map((_, i) => <Squelette key={i} h={h} />)}
    </View>
  )
}

// ─── état vide ────────────────────────────────────────────────
function EtatVide({ message }: { message: string }) {
  return (
    <Animated.View entering={FadeIn.duration(300)} style={{ alignItems: 'center', paddingVertical: spacing['3xl'] }}>
      <View style={{
        width: 64, height: 64, borderRadius: 32, backgroundColor: '#e4ebf3',
        alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md,
      }}>
        <IconSearch size={26} color="#9aa8b8" />
      </View>
      <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.base, color: colors.texteMuted, textAlign: 'center' }}>
        {message}
      </Text>
    </Animated.View>
  )
}

// ─── rangée de piste (conférences, khoutbahs) ─────────────────
function RangéePiste({ index, titre, sousTitre, badge, badgeCouleur, duree, actif, enLecture, onPress }: {
  index?: number
  titre: string
  sousTitre: string
  badge?: string
  badgeCouleur?: string
  duree?: string
  actif: boolean
  enLecture: boolean
  onPress: () => void
}) {
  return (
    <PressableScale onPress={onPress} style={{
      backgroundColor: colors.blanc,
      borderRadius: 18,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      borderWidth: actif ? 1.5 : 0,
      borderColor: colors.bleu,
      shadowColor: '#3a4a5c',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 2,
    }}>
      <PastillePlay actif={actif} enLecture={enLecture} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{
          fontFamily: typography.fontFamily.semibold,
          fontSize: typography.size.base,
          color: actif ? colors.bleu : colors.texte,
        }}>
          {titre}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <Text numberOfLines={1} style={{
            fontFamily: typography.fontFamily.regular,
            fontSize: typography.size.sm,
            color: colors.texteMuted,
            flexShrink: 1,
          }}>
            {sousTitre}
          </Text>
          {badge ? (
            <View style={{ backgroundColor: '#faf3dc', borderRadius: 7, paddingHorizontal: 6, paddingVertical: 1.5 }}>
              <Text numberOfLines={1} style={{ fontFamily: typography.fontFamily.semibold, fontSize: 10.5, color: badgeCouleur ?? '#b8911f' }}>
                {badge}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
      {duree ? (
        <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.xs, color: '#aab4c0', flexShrink: 0, fontVariant: ['tabular-nums'] }}>
          {duree}
        </Text>
      ) : null}
    </PressableScale>
  )
}

// ─── chips de filtre horizontaux ──────────────────────────────
function ChipsFiltres({ chips, actif, onSelect, prefixe }: {
  chips: { key: string, label: string, bg?: string, txt?: string }[]
  actif: string
  onSelect: (key: string) => void
  prefixe?: ReactNode
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.sm, paddingVertical: spacing.sm }}
    >
      {prefixe}
      {chips.map(c => {
        const estActif = actif === c.key
        return (
          <Pressable
            key={c.key}
            onPress={() => { Haptics.selectionAsync(); onSelect(c.key) }}
            style={{
              paddingHorizontal: 14, paddingVertical: 8,
              borderRadius: radius.full,
              backgroundColor: estActif ? (c.bg ?? colors.bleu) : colors.blanc,
              borderWidth: 1,
              borderColor: estActif ? (c.txt ?? colors.bleu) : '#e2e7ee',
            }}
          >
            <Text style={{
              fontFamily: estActif ? typography.fontFamily.semibold : typography.fontFamily.medium,
              fontSize: typography.size.sm,
              color: estActif ? (c.txt ?? '#fff') : '#6b7686',
            }}>
              {c.label}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

// ─── section Cours ────────────────────────────────────────────
function SectionCours({ recherche }: { recherche: string }) {
  const [categories, setCategories] = useState<any[]>([])
  const [livres, setLivres] = useState<any[]>([])
  const [coursSerieUniqueMap, setCoursSerieUniqueMap] = useState<Record<string, string>>({})
  const [catActive, setCatActive] = useState('toutes')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function charger() {
      const [{ data: cats }, { data: livresList }, { data: coursAvecId }] = await Promise.all([
        supabase.from('categories').select('*').order('ordre'),
        supabase.from('livres').select('*').order('created_at'),
        supabase.from('cours').select('id, livre_id, serie_unique').eq('serie_unique', true),
      ])
      if (cats) setCategories(cats)
      if (livresList) setLivres(livresList)
      if (coursAvecId) {
        const map: Record<string, string> = {}
        coursAvecId.forEach((c: any) => { if (c.livre_id) map[c.livre_id] = c.id })
        setCoursSerieUniqueMap(map)
      }
      setLoading(false)
    }
    charger()
  }, [])

  const livresFiltres = livres.filter(l => {
    const cat = categories.find(c => c.id === l.categorie_id)
    const matchCat = catActive === 'toutes' || cat?.slug === catActive
    const matchRecherche = recherche === '' || normaliser(l.titre).includes(normaliser(recherche)) || (l.titre_arabe ? l.titre_arabe.includes(recherche) : false)
    return matchCat && matchRecherche
  })

  const naviguerVers = (livre: any) => {
    if (coursSerieUniqueMap[livre.id]) router.push(`/audio/${coursSerieUniqueMap[livre.id]}` as any)
    else router.push(`/audio/livre/${livre.id}` as any)
  }

  return (
    <View>
      <ChipsFiltres
        chips={[
          { key: 'toutes', label: 'Tous' },
          ...categories.map(c => ({ key: c.slug, label: c.nom, bg: couleurBg[c.nom], txt: couleurTxt[c.nom] })),
        ]}
        actif={catActive}
        onSelect={setCatActive}
      />
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xs }}>
        {loading
          ? <Squelettes n={4} h={96} />
          : livresFiltres.length === 0
            ? <EtatVide message="Aucun résultat trouvé" />
            : (
              <View style={{ gap: spacing.sm }}>
                {livresFiltres.map((l, i) => {
                  const cat = categories.find(c => c.id === l.categorie_id)
                  const nomCat = cat?.nom ?? ''
                  const accent = couleurTxt[nomCat] ?? colors.bleu
                  return (
                    <Animated.View key={l.id} entering={FadeInDown.duration(350).delay(Math.min(i, 8) * 45)}>
                      <PressableScale onPress={() => naviguerVers(l)} style={{
                        backgroundColor: colors.blanc,
                        borderRadius: 18,
                        paddingVertical: spacing.md,
                        paddingLeft: spacing.lg + 4,
                        paddingRight: spacing.lg,
                        shadowColor: '#3a4a5c',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.06,
                        shadowRadius: 10,
                        elevation: 2,
                        overflow: 'hidden',
                        gap: 6,
                      }}>
                        {/* accent latéral couleur catégorie */}
                        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: accent, opacity: 0.85 }} />

                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          {nomCat ? (
                            <View style={{ backgroundColor: couleurBg[nomCat] ?? '#f0f0f0', borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 3 }}>
                              <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.xs, color: accent }}>{nomCat}</Text>
                            </View>
                          ) : <View />}
                          {l.titre_arabe ? (
                            <Text numberOfLines={1} style={{ fontFamily: typography.fontFamily.arabic, fontSize: typography.size.sm, color: '#9aa4b2', maxWidth: '50%' }}>
                              {l.titre_arabe}
                            </Text>
                          ) : null}
                        </View>

                        <TextTicker
                          style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.md, color: colors.texte, lineHeight: 22 }}
                          loop bounce={false} repeatSpacer={50} marqueeDelay={2500} scrollSpeed={10}
                        >
                          {l.titre}
                        </TextTicker>

                        {l.sheikh ? (
                          <Text numberOfLines={1} style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: colors.texteMuted }}>
                            {l.sheikh}
                          </Text>
                        ) : null}
                      </PressableScale>
                    </Animated.View>
                  )
                })}
              </View>
            )}
      </View>
    </View>
  )
}

// ─── section Conférences ──────────────────────────────────────
function SectionConferences({ recherche }: { recherche: string }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { jouer, piste, enLecture, pause, reprendre } = useAudio()

  useEffect(() => {
    setLoading(true)
    supabase
      .from('conferences')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setItems(data); setLoading(false) })
  }, [])

  const filtres = items.filter(c =>
    normaliser(c.titre).includes(normaliser(recherche)) ||
    normaliser(c.sheikh).includes(normaliser(recherche))
  )

  const onPiste = (c: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (piste?.id === c.id) { enLecture ? pause() : reprendre(); return }
    jouer({ id: c.id, titre: c.titre, sheikh: c.sheikh, url: c.url_audio, duree: c.duree })
  }

  return (
    <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm }}>
      {loading
        ? <Squelettes n={5} h={72} />
        : filtres.length === 0
          ? <EtatVide message={recherche ? `Aucune conférence pour « ${recherche} »` : 'Les conférences arrivent bientôt'} />
          : (
            <View style={{ gap: spacing.sm }}>
              {filtres.map((c, i) => (
                <Animated.View key={c.id} entering={FadeInDown.duration(350).delay(Math.min(i, 8) * 45)}>
                  <RangéePiste
                    titre={c.titre}
                    sousTitre={c.sheikh}
                    duree={c.duree}
                    actif={piste?.id === c.id}
                    enLecture={enLecture}
                    onPress={() => onPiste(c)}
                  />
                </Animated.View>
              ))}
            </View>
          )}
    </View>
  )
}

// ─── section Khoutbah ─────────────────────────────────────────
function SectionKhoutbah({ recherche }: { recherche: string }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { jouer, piste, enLecture, pause, reprendre } = useAudio()

  useEffect(() => {
    setLoading(true)
    supabase
      .from('khoutbahs')
      .select('*')
      .order('serie')
      .order('numero_serie')
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setItems(data); setLoading(false) })
  }, [])

  const filtres = items.filter(k =>
    normaliser(k.titre).includes(normaliser(recherche)) ||
    normaliser(k.sheikh).includes(normaliser(recherche)) ||
    (k.serie && normaliser(k.serie).includes(normaliser(recherche)))
  )

  const onPiste = (k: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (piste?.id === k.id) { enLecture ? pause() : reprendre(); return }
    jouer({ id: k.id, titre: k.titre, sheikh: k.sheikh, url: k.url_audio, duree: k.duree })
  }

  return (
    <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm }}>
      {loading
        ? <Squelettes n={5} h={72} />
        : filtres.length === 0
          ? <EtatVide message={recherche ? `Aucune khoutbah pour « ${recherche} »` : 'Les khoutbahs arrivent bientôt'} />
          : (
            <View style={{ gap: spacing.sm }}>
              {filtres.map((k, i) => (
                <Animated.View key={k.id} entering={FadeInDown.duration(350).delay(Math.min(i, 8) * 45)}>
                  <RangéePiste
                    titre={k.titre}
                    sousTitre={k.sheikh}
                    badge={k.serie ? `${k.serie}${k.numero_serie ? ` · ${k.numero_serie}` : ''}` : undefined}
                    duree={k.duree}
                    actif={piste?.id === k.id}
                    enLecture={enLecture}
                    onPress={() => onPiste(k)}
                  />
                </Animated.View>
              ))}
            </View>
          )}
    </View>
  )
}

// ─── section Fatwas ───────────────────────────────────────────
function SectionFatwas({ recherche }: { recherche: string }) {
  const [items, setItems] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [sheikhs, setSheikhs] = useState<string[]>([])
  const [catActive, setCatActive] = useState('toutes')
  const [sheikhsActifs, setSheikhsActifs] = useState<string[]>([])
  const [showSheikhPicker, setShowSheikhPicker] = useState(false)
  const [loading, setLoading] = useState(true)
  const { jouer, piste, enLecture, pause, reprendre } = useAudio()

  useEffect(() => {
    async function charger() {
      const [{ data: fatwasData }, { data: catsData }, { data: sheikhsData }] = await Promise.all([
        supabase.from('fatwas').select('*').order('categorie').order('created_at'),
        supabase.from('fatwas_categories').select('nom, couleur, epingle').order('nom'),
        supabase.from('fatwas_sheikhs').select('nom').order('nom'),
      ])
      if (fatwasData) setItems(fatwasData)
      if (catsData) {
        const triees = [...catsData].sort((a, b) => {
          if (a.epingle && !b.epingle) return -1
          if (!a.epingle && b.epingle) return 1
          return 0
        })
        setCategories(triees)
      }
      if (sheikhsData) setSheikhs(sheikhsData.map((s: any) => s.nom))
      setLoading(false)
    }
    charger()
  }, [])

  const filtres = items.filter(f => {
    const matchCat = catActive === 'toutes' || f.categorie === catActive
    const matchSheikh = sheikhsActifs.length === 0 || sheikhsActifs.includes(f.sheikh)
    const matchRecherche = recherche === '' ||
      normaliser(f.question).includes(normaliser(recherche)) ||
      normaliser(f.sheikh).includes(normaliser(recherche))
    return matchCat && matchSheikh && matchRecherche
  })

  const groupes: Record<string, any[]> = {}
  filtres.forEach(f => {
    if (!groupes[f.categorie]) groupes[f.categorie] = []
    groupes[f.categorie].push(f)
  })

  const groupesTries = Object.entries(groupes).sort(([a], [b]) => {
    const catA = categories.find(c => c.nom === a)
    const catB = categories.find(c => c.nom === b)
    if (catA?.epingle && !catB?.epingle) return -1
    if (!catA?.epingle && catB?.epingle) return 1
    return 0
  })

  const onPiste = (f: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (piste?.id === f.id) { enLecture ? pause() : reprendre(); return }
    jouer({ id: f.id, titre: f.question, sheikh: f.sheikh, url: f.url_audio, duree: f.duree })
  }

  return (
    <View>
      <ChipsFiltres
        chips={[
          { key: 'toutes', label: 'Toutes' },
          ...categories.map(c => ({ key: c.nom, label: c.nom, bg: c.couleur + '22', txt: c.couleur })),
        ]}
        actif={catActive}
        onSelect={setCatActive}
        prefixe={
          <Pressable
            onPress={() => { Haptics.selectionAsync(); setShowSheikhPicker(true) }}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingHorizontal: 12, paddingVertical: 8,
              borderRadius: radius.full,
              backgroundColor: sheikhsActifs.length > 0 ? colors.or : colors.blanc,
              borderWidth: 1, borderColor: sheikhsActifs.length > 0 ? colors.or : '#e2e7ee',
            }}
          >
            <IconFiltre size={15} color={sheikhsActifs.length > 0 ? 'white' : '#6b7686'} />
            <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.sm, color: sheikhsActifs.length > 0 ? 'white' : '#6b7686' }}>
              Sheikh{sheikhsActifs.length > 0 ? ` · ${sheikhsActifs.length}` : ''}
            </Text>
          </Pressable>
        }
      />

      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xs }}>
        {loading ? (
          <Squelettes n={4} h={92} />
        ) : filtres.length === 0 ? (
          <EtatVide message="Aucune fatwa trouvée" />
        ) : (
          <View style={{ gap: spacing.lg }}>
            {groupesTries.map(([categorie, fatwas]) => {
              const cat = categories.find(c => c.nom === categorie)
              const accent = cat?.couleur ?? '#6b7686'
              return (
                <View key={categorie}>
                  {/* en-tête de groupe */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm, paddingLeft: 2 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: accent }} />
                    <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, letterSpacing: 1.2, textTransform: 'uppercase', color: accent }}>
                      {categorie}
                    </Text>
                    <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.xs, color: '#aab4c0' }}>
                      {fatwas.length}
                    </Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: '#e6eaf0' }} />
                  </View>

                  <View style={{ gap: spacing.sm }}>
                    {fatwas.map((f: any) => {
                      const actif = piste?.id === f.id
                      return (
                        <PressableScale key={f.id} onPress={() => onPiste(f)} style={{
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
                        }}>
                          <Text style={{
                            fontFamily: typography.fontFamily.semibold,
                            fontSize: typography.size.base,
                            color: actif ? colors.bleu : colors.texte,
                            lineHeight: 22,
                            marginBottom: spacing.sm,
                          }}>
                            {f.question}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                            <PastillePlay actif={actif} enLecture={enLecture} taille={34} />
                            <Text style={{ flex: 1, fontFamily: typography.fontFamily.medium, fontSize: typography.size.sm, color: actif ? colors.bleu : '#8a94a2' }}>
                              {f.sheikh}
                            </Text>
                            {f.duree ? (
                              <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.xs, color: '#aab4c0', fontVariant: ['tabular-nums'] }}>
                                {f.duree}
                              </Text>
                            ) : null}
                          </View>
                        </PressableScale>
                      )
                    })}
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </View>

      {/* modal filtre sheikh */}
      <Modal visible={showSheikhPicker} transparent animationType="slide">
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(13,27,46,0.45)', justifyContent: 'flex-end' }} onPress={() => setShowSheikhPicker(false)}>
          <Pressable style={{ backgroundColor: colors.blanc, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: spacing.xl, paddingBottom: 48 }}>
            <View style={{ width: 40, height: 4.5, borderRadius: 3, backgroundColor: '#dde3ea', alignSelf: 'center', marginBottom: spacing.xl }} />
            <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.lg, color: colors.texte, marginBottom: 2 }}>
              Filtrer par sheikh
            </Text>
            <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: colors.texteMuted, marginBottom: spacing.lg }}>
              Sélectionnez un ou plusieurs intervenants
            </Text>
            <View style={{ gap: spacing.sm }}>
              {sheikhs.map(s => {
                const actif = sheikhsActifs.includes(s)
                return (
                  <Pressable
                    key={s}
                    onPress={() => {
                      Haptics.selectionAsync()
                      setSheikhsActifs(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
                    }}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: spacing.md,
                      padding: spacing.md, borderRadius: 16,
                      backgroundColor: actif ? '#faf3dc' : '#f5f6f8',
                      borderWidth: 1, borderColor: actif ? colors.or : 'transparent',
                    }}
                  >
                    <View style={{
                      width: 22, height: 22, borderRadius: 7,
                      borderWidth: 2, borderColor: actif ? colors.or : '#c4ccd6',
                      backgroundColor: actif ? colors.or : 'white',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      {actif && <Text style={{ color: 'white', fontSize: 12, fontFamily: typography.fontFamily.bold }}>✓</Text>}
                    </View>
                    <Text style={{ flex: 1, fontFamily: actif ? typography.fontFamily.semibold : typography.fontFamily.regular, fontSize: typography.size.base, color: colors.texte }}>
                      {s}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
            {sheikhsActifs.length > 0 && (
              <Pressable
                onPress={() => setSheikhsActifs([])}
                style={{ marginTop: spacing.md, padding: spacing.sm + 2, borderRadius: 14, backgroundColor: '#f0f2f5', alignItems: 'center' }}
              >
                <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.sm, color: '#6b7686' }}>
                  Effacer la sélection
                </Text>
              </Pressable>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

// ─── sélecteur de section (pastille glissante) ────────────────
function SegmentsSections({ actif, onSelect }: { actif: string, onSelect: (key: string) => void }) {
  const [w, setW] = useState(0)
  const segW = w > 0 ? (w - 8) / SECTIONS.length : 0
  const index = SECTIONS.findIndex(s => s.key === actif)

  const x = useSharedValue(0)
  const init = useRef(false)
  useEffect(() => {
    if (segW <= 0) return
    if (!init.current) { x.value = index * segW; init.current = true; return }
    x.value = withSpring(index * segW, { damping: 19, stiffness: 220, mass: 0.7 })
  }, [index, segW])

  const pillStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }))

  return (
    <View
      onLayout={e => setW(e.nativeEvent.layout.width)}
      style={{
        flexDirection: 'row',
        backgroundColor: W10,
        borderRadius: radius.full,
        padding: 4,
        borderWidth: 1,
        borderColor: W14,
      }}
    >
      {segW > 0 && (
        <Animated.View style={[{
          position: 'absolute',
          left: 4, top: 4, bottom: 4,
          width: segW,
          borderRadius: radius.full,
          backgroundColor: '#fff',
        }, pillStyle]} />
      )}
      {SECTIONS.map(s => {
        const estActif = actif === s.key
        return (
          <Pressable
            key={s.key}
            onPress={() => {
              if (estActif) return
              Haptics.selectionAsync()
              onSelect(s.key)
            }}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 9, zIndex: 1 }}
          >
            <Text
              numberOfLines={1}
              style={{
                fontFamily: estActif ? typography.fontFamily.bold : typography.fontFamily.medium,
                fontSize: 12.5,
                color: estActif ? colors.bleu : W70,
              }}
            >
              {s.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

// ─── page ─────────────────────────────────────────────────────
export default function Audio() {
  const insets = useSafeAreaInsets()
  const [sectionActive, setSectionActive] = useState('cours')
  const [recherche, setRecherche] = useState('')
  const { onScroll, cachéTabBar } = useScroll()

  const changerSection = (key: string) => {
    setSectionActive(key)
    setRecherche('')
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.fondCreme }}>
      <StatusBar barStyle="light-content" />

      {/* ── Héros ── */}
      <View style={{ borderBottomLeftRadius: 28, borderBottomRightRadius: 28, overflow: 'hidden' }}>
        <LinearGradient
          colors={[BG_TOP, BG_MID, BG_BOT]}
          locations={[0, 0.6, 1]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View style={{ position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(140,180,230,0.12)', top: -140, right: -100 }} />
        <View style={{ position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(214,173,58,0.06)', bottom: -80, left: -70 }} />

        <View style={{ paddingTop: insets.top + spacing.sm, paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.md }}>
          <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size['2xl'], color: '#fff' }}>
            Bibliothèque audio
          </Text>

          {/* recherche */}
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: W10,
            borderWidth: 1, borderColor: W14,
            borderRadius: radius.full,
            paddingHorizontal: spacing.lg,
            paddingVertical: Platform.OS === 'ios' ? 11 : 7,
            gap: spacing.sm,
          }}>
            <IconSearch size={17} color={W55} />
            <TextInput
              value={recherche}
              onChangeText={setRecherche}
              placeholder="Rechercher..."
              placeholderTextColor={W55}
              returnKeyType="search"
              style={{ flex: 1, fontFamily: typography.fontFamily.regular, fontSize: typography.size.base, color: '#fff', padding: 0 }}
            />
            {recherche.length > 0 && (
              <Pressable onPress={() => setRecherche('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <IconX size={15} color={W70} />
              </Pressable>
            )}
          </View>

          {/* segments */}
          <SegmentsSections actif={sectionActive} onSelect={changerSection} />
        </View>
      </View>

      {/* ── Contenu ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: spacing.sm, paddingBottom: cachéTabBar ? 80 : 170 }}
        onScroll={e => onScroll(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View key={sectionActive} entering={FadeIn.duration(220)}>
          {sectionActive === 'cours' && <SectionCours recherche={recherche} />}
          {sectionActive === 'conferences' && <SectionConferences recherche={recherche} />}
          {sectionActive === 'khoutbah' && <SectionKhoutbah recherche={recherche} />}
          {sectionActive === 'fatwas' && <SectionFatwas recherche={recherche} />}
        </Animated.View>
      </ScrollView>
    </View>
  )
}

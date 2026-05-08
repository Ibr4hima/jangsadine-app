import { colors, radius, spacing, typography } from '@/constants/theme'
import { useAudio } from '@/contexts/AudioContext'
import { useScroll } from '@/contexts/ScrollContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'expo-router'
import {
  BookMarked, ChevronDown, Headphones,
  MessageCircle, Mic, Pause, Play, X
} from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import {
  Animated, Modal, Pressable, ScrollView,
  StatusBar, Text, TextInput, View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'

function IconSearch({ size = 22, color = '#1f1f1f' }: { size?: number, color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" fill={color} />
    </Svg>
  )
}

const SECTIONS = [
  { key: 'cours', label: 'Cours', icon: Headphones },
  { key: 'conferences', label: 'Conférences', icon: Mic },
  { key: 'khoutbah', label: 'Khoutbah', icon: BookMarked },
  { key: 'fatwas', label: 'Fatwas', icon: MessageCircle },
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

function LivreCard({ livre, categorie, onPress }: { livre: any, categorie: any, onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current
  const nomCat = categorie?.nom ?? ''
  const bg = couleurBg[nomCat] ?? '#f0f0f0'
  const txt = couleurTxt[nomCat] ?? '#666'
  return (
    <Pressable
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
      onPress={onPress}
    >
      <Animated.View style={{ transform: [{ scale }], backgroundColor: colors.blanc, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.bordure, padding: spacing.lg, marginBottom: spacing.sm }}>
        {nomCat ? (
          <View style={{ alignSelf: 'flex-start', backgroundColor: bg, borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3, marginBottom: spacing.sm }}>
            <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.xs, color: txt }}>{nomCat}</Text>
          </View>
        ) : null}
        <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.md, color: colors.texte, lineHeight: 22, marginBottom: spacing.sm }}>{livre.titre}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {livre.titre_arabe ? (
            <View style={{ backgroundColor: '#f0f0f0', borderRadius: radius.full, paddingHorizontal: spacing.sm, paddingVertical: 3 }}>
              <Text style={{ fontFamily: typography.fontFamily.arabic, fontSize: typography.size.xs, color: '#888' }}>{livre.titre_arabe}</Text>
            </View>
          ) : <View />}
          <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.sm, color: colors.bleu }}>Voir →</Text>
        </View>
      </Animated.View>
    </Pressable>
  )
}

function PisteCard({ item, onPlay, actif, enLecture }: { item: any, onPlay: () => void, actif: boolean, enLecture: boolean }) {
  const scale = useRef(new Animated.Value(1)).current
  return (
    <Pressable
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
      onPress={onPlay}
    >
      <Animated.View style={{ transform: [{ scale }], backgroundColor: actif ? '#e8f0f8' : colors.blanc, borderRadius: radius.lg, borderWidth: 1, borderColor: actif ? colors.bleu : colors.bordure, padding: spacing.md, flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
        <View style={{ width: 40, height: 40, borderRadius: radius.full, backgroundColor: actif ? colors.bleu : '#f0f0f0', alignItems: 'center', justifyContent: 'center', marginRight: spacing.md, flexShrink: 0 }}>
          {actif && enLecture
            ? <Pause size={14} color="white" fill="white" strokeWidth={0} />
            : <Play size={14} color={actif ? 'white' : '#aaa'} fill={actif ? 'white' : '#aaa'} strokeWidth={0} style={{ marginLeft: 2 }} />
          }
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base, color: actif ? colors.bleu : colors.texte }}>{item.titre || item.question}</Text>
          <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: colors.texteMuted, marginTop: 2 }}>{item.sheikh}</Text>
        </View>
        {item.duree ? <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.xs, color: '#bbb', flexShrink: 0 }}>{item.duree}</Text> : null}
      </Animated.View>
    </Pressable>
  )
}

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
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.xl, gap: spacing.sm, paddingVertical: spacing.sm, justifyContent: 'center' }}>
        <Pressable onPress={() => setCatActive('toutes')}>
          <View style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full, backgroundColor: catActive === 'toutes' ? colors.bleu : colors.blanc, borderWidth: 1, borderColor: catActive === 'toutes' ? colors.bleu : colors.bordure }}>
            <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.sm, color: catActive === 'toutes' ? colors.blanc : '#666' }}>Tous</Text>
          </View>
        </Pressable>
        {categories.map(cat => (
          <Pressable key={cat.id} onPress={() => setCatActive(cat.slug)}>
            <View style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full, backgroundColor: catActive === cat.slug ? (couleurBg[cat.nom] ?? '#eee') : colors.blanc, borderWidth: 1, borderColor: catActive === cat.slug ? (couleurTxt[cat.nom] ?? '#999') : colors.bordure }}>
              <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.sm, color: catActive === cat.slug ? (couleurTxt[cat.nom] ?? '#333') : '#666' }}>{cat.nom}</Text>
            </View>
          </Pressable>
        ))}
      </View>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm }}>
        {loading
          ? [1, 2, 3].map(i => <View key={i} style={{ height: 100, borderRadius: radius.lg, backgroundColor: colors.bordure, opacity: 0.4, marginBottom: spacing.sm }} />)
          : livresFiltres.length === 0
            ? <View style={{ alignItems: 'center', paddingVertical: spacing['3xl'] }}><Text style={{ fontSize: 36, marginBottom: spacing.md }}>🔍</Text><Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.base, color: colors.texteMuted }}>Aucun résultat trouvé</Text></View>
            : livresFiltres.map(l => <LivreCard key={l.id} livre={l} categorie={categories.find(c => c.id === l.categorie_id)} onPress={() => naviguerVers(l)} />)
        }
      </View>
    </View>
  )
}

function SectionConferences({ recherche }: { recherche: string }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { jouer, piste, enLecture } = useAudio()
  useEffect(() => {
    setLoading(true)
    let q = supabase.from('conferences').select('id, titre, sheikh, duree, url_audio').order('created_at', { ascending: false })
    if (recherche) q = q.ilike('titre', `%${recherche}%`)
    q.then(({ data }) => { if (data) setItems(data); setLoading(false) })
  }, [recherche])
  return (
    <View style={{ paddingHorizontal: spacing.xl }}>
      {loading ? [1, 2, 3].map(i => <View key={i} style={{ height: 68, borderRadius: radius.lg, backgroundColor: colors.bordure, opacity: 0.4, marginBottom: spacing.sm }} />) :
        items.map(item => <PisteCard key={item.id} item={item} actif={piste?.id === item.id} enLecture={enLecture} onPlay={() => jouer({ id: item.id, titre: item.titre, sheikh: item.sheikh, url: item.url_audio, duree: item.duree })} />)
      }
    </View>
  )
}

function SectionKhoutbah({ recherche }: { recherche: string }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { jouer, piste, enLecture } = useAudio()
  useEffect(() => {
    setLoading(true)
    let q = supabase.from('khoutbah').select('id, titre, sheikh, duree, url_audio').order('created_at', { ascending: false })
    if (recherche) q = q.ilike('titre', `%${recherche}%`)
    q.then(({ data }) => { if (data) setItems(data); setLoading(false) })
  }, [recherche])
  return (
    <View style={{ paddingHorizontal: spacing.xl }}>
      {loading ? [1, 2, 3].map(i => <View key={i} style={{ height: 68, borderRadius: radius.lg, backgroundColor: colors.bordure, opacity: 0.4, marginBottom: spacing.sm }} />) :
        items.map(item => <PisteCard key={item.id} item={item} actif={piste?.id === item.id} enLecture={enLecture} onPlay={() => jouer({ id: item.id, titre: item.titre, sheikh: item.sheikh, url: item.url_audio, duree: item.duree })} />)
      }
    </View>
  )
}

function SectionFatwas({ recherche }: { recherche: string }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { jouer, piste, enLecture } = useAudio()
  useEffect(() => {
    setLoading(true)
    let q = supabase.from('fatwas').select('id, question, sheikh, duree, url_audio').order('created_at', { ascending: false })
    if (recherche) q = q.ilike('question', `%${recherche}%`)
    q.then(({ data }) => { if (data) setItems(data); setLoading(false) })
  }, [recherche])
  return (
    <View style={{ paddingHorizontal: spacing.xl }}>
      {loading ? [1, 2, 3].map(i => <View key={i} style={{ height: 68, borderRadius: radius.lg, backgroundColor: colors.bordure, opacity: 0.4, marginBottom: spacing.sm }} />) :
        items.map(item => <PisteCard key={item.id} item={item} actif={piste?.id === item.id} enLecture={enLecture} onPlay={() => jouer({ id: item.id, titre: item.question, sheikh: item.sheikh, url: item.url_audio, duree: item.duree })} />)
      }
    </View>
  )
}

export default function Audio() {
  const [sectionActive, setSectionActive] = useState('cours')
  const [recherche, setRecherche] = useState('')
  const [rechercheVisible, setRechercheVisible] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const rechercheAnim = useRef(new Animated.Value(0)).current
  const sectionCourante = SECTIONS.find(s => s.key === sectionActive)!
  const { onScroll, montrerTabBar, cachéTabBar } = useScroll()

  const toggleRecherche = () => {
    if (rechercheVisible) {
      setRecherche('')
      Animated.timing(rechercheAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start(() => setRechercheVisible(false))
    } else {
      setRechercheVisible(true)
      Animated.timing(rechercheAnim, { toValue: 1, duration: 200, useNativeDriver: false }).start()
    }
  }

  const rechercheHeight = rechercheAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 52] })

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.fondCreme }} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.sm }}>
        <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, letterSpacing: 2, color: colors.or, textTransform: 'uppercase', marginBottom: spacing.sm }}>
          Bibliothèque
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>

          {/* Titre gauche */}
          <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size['2xl'], color: colors.texte }}>
            Audio
          </Text>

          {/* Centre absolu */}
          <View style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center' }}>
            <Pressable
              onPress={() => setShowPicker(true)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: colors.bleu,
                borderRadius: radius.full,
                paddingVertical: 8,
                paddingHorizontal: spacing.lg,
              }}
            >
              <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.lg, color: 'white' }}>
                {sectionCourante.label}
              </Text>
              <ChevronDown size={14} color="rgba(255,255,255,0.7)" strokeWidth={2} />
            </Pressable>
          </View>

          {/* Search droite */}
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Pressable
              onPress={toggleRecherche}
              style={{
                width: 44, height: 44, borderRadius: radius.full,
                backgroundColor: rechercheVisible ? colors.bleu : colors.blanc,
                borderWidth: 1, borderColor: rechercheVisible ? colors.bleu : colors.bordure,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              {rechercheVisible
                ? <X size={20} color="white" />
                : <IconSearch size={20} color={colors.texteMuted} />
              }
            </Pressable>
          </View>

        </View>
      </View>

      {/* Barre recherche animée */}
      <Animated.View style={{ height: rechercheHeight, overflow: 'hidden', paddingHorizontal: spacing.xl }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.blanc, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.bordure, paddingHorizontal: spacing.md, gap: spacing.sm, marginBottom: spacing.sm }}>
          <IconSearch size={16} color="#bbb" />
          <TextInput
            value={recherche} onChangeText={setRecherche}
            placeholder="Rechercher..." placeholderTextColor="#bbb"
            style={{ flex: 1, fontFamily: typography.fontFamily.regular, fontSize: typography.size.base, color: colors.texte, paddingVertical: spacing.sm }}
          />
        </View>
      </Animated.View>

      {/* Contenu */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: cachéTabBar ? 80 : 160 }}
        onScroll={e => onScroll(e.nativeEvent.contentOffset.y)}
        onScrollEndDrag={() => { }}
        scrollEventThrottle={16}
        onMomentumScrollEnd={() => { }}
      >
        {sectionActive === 'cours' && <SectionCours recherche={recherche} />}
        {sectionActive === 'conferences' && <SectionConferences recherche={recherche} />}
        {sectionActive === 'khoutbah' && <SectionKhoutbah recherche={recherche} />}
        {sectionActive === 'fatwas' && <SectionFatwas recherche={recherche} />}
      </ScrollView>

      {/* Modal picker section */}
      <Modal visible={showPicker} transparent animationType="fade">
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }} onPress={() => setShowPicker(false)}>
          <Pressable style={{ backgroundColor: colors.blanc, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, paddingBottom: 48 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#ddd', alignSelf: 'center', marginBottom: spacing.xl }} />
            <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, letterSpacing: 2, color: colors.or, textTransform: 'uppercase', marginBottom: spacing.lg }}>
              Bibliothèque audio
            </Text>
            <View style={{ gap: spacing.sm }}>
              {SECTIONS.map(s => {
                const actif = sectionActive === s.key
                const Icon = s.icon
                return (
                  <Pressable
                    key={s.key}
                    onPress={() => { setSectionActive(s.key); setShowPicker(false) }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: actif ? '#e8f0f8' : colors.fondCreme, borderWidth: 1, borderColor: actif ? colors.bleu : 'transparent' }}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: actif ? colors.bleu : colors.blanc, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={20} color={actif ? 'white' : '#888'} strokeWidth={1.5} />
                    </View>
                    <Text style={{ flex: 1, fontFamily: actif ? typography.fontFamily.bold : typography.fontFamily.medium, fontSize: typography.size.md, color: actif ? colors.bleu : colors.texte }}>
                      {s.label}
                    </Text>
                    {actif && <Text style={{ color: colors.bleu, fontSize: 18 }}>✓</Text>}
                  </Pressable>
                )
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </SafeAreaView>
  )
}
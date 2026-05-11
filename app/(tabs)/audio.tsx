import { colors, radius, spacing, typography } from '@/constants/theme'
import { useAudio } from '@/contexts/AudioContext'
import { useScroll } from '@/contexts/ScrollContext'
import { supabase } from '@/lib/supabase'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import {
  ChevronDown,
  Pause, Play, X
} from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import {
  Animated, Modal, Pressable, ScrollView,
  StatusBar, Text, TextInput, View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'
import TextTicker from 'react-native-text-ticker'


function IconSearch({ size = 22, color = '#1f1f1f' }: { size?: number, color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" fill={color} />
    </Svg>
  )
}

function IconBooks({ size = 20, color = '#1f1f1f' }: { size?: number, color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M160-80q-17 0-28.5-11.5T120-120v-558q0-15 6-25.5t20-16.5l400-160q20-8 37 5.5t17 34.5v120h40q17 0 28.5 11.5T680-680v120h-80v-80H200v480h207l80 80H160Zm200-640h160v-62l-160 62Zm178.5 581.5Q480-197 480-280t58.5-141.5Q597-480 680-480t141.5 58.5Q880-363 880-280t-58.5 141.5Q763-80 680-80t-141.5-58.5ZM630-180l160-100-160-100v200Zm-430 20v-480 480Z" fill={color} /></Svg>
}
function IconMic({ size = 20, color = '#1f1f1f' }: { size?: number, color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M192-680q-15-17-23.5-37t-8.5-43q0-50 35-85t85-35q50 0 85 35t35 85q0 23-8.5 43T368-680H192ZM400-80q-66 0-113-47t-47-113h-40l-40-400h240l-40 400h-40q0 33 23.5 56.5T400-160q33 0 56.5-23.5T480-240v-480q0-66 47-113t113-47q66 0 113 47t47 113v640h-80v-640q0-33-23.5-56.5T640-800q-33 0-56.5 23.5T560-720v480q0 66-47 113T400-80ZM272-320h16l24-240h-64l24 240Zm16-240h-40 64-24Z" fill={color} /></Svg>
}
function IconMosque({ size = 20, color = '#1f1f1f' }: { size?: number, color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M40-120v-491q-18-11-29-28.5T0-680q0-23 24-56t56-64q32 31 56 64t24 56q0 23-11 40.5T120-611v171h80v-80q0-25 16-48t46-30q-11-17-16.5-37t-5.5-41q0-40 19-74t51-56l170-114 170 114q32 22 51 56t19 74q0 21-5.5 41T698-598q30 7 46 30t16 48v80h80v-171q-18-11-29-28.5T800-680q0-23 24-56t56-64q32 31 56 64t24 56q0 23-11 40.5T920-611v491H520v-160q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280v160H40Zm356-480h168q32 0 54-22t22-54q0-20-9-36.5T606-740l-126-84-126 84q-16 11-25 27.5t-9 36.5q0 32 22 54t54 22ZM120-200h240v-80q0-50 35-85t85-35q50 0 85 35t35 85v80h240v-160H680v-160H280v160H120v160Zm360-320Zm0-80Zm0 2Z" fill={color} /></Svg>
}
function IconFatwas({ size = 20, color = '#1f1f1f' }: { size?: number, color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="m480-80-10-120h-10q-142 0-241-99t-99-241q0-142 99-241t241-99q71 0 132.5 26.5t108 73q46.5 46.5 73 108T800-540q0 75-24.5 144t-67 128q-42.5 59-101 107T480-80Zm80-146q71-60 115.5-140.5T720-540q0-109-75.5-184.5T460-800q-109 0-184.5 75.5T200-540q0 109 75.5 184.5T460-280h100v54Zm-72-107q12-12 12-29t-12-29q-12-12-29-12t-29 12q-12 12-12 29t12 29q12 12 29 12t29-12Zm-58-115h60q0-30 6-42t38-44q18-18 30-39t12-45q0-51-34.5-76.5T460-720q-44 0-74 24.5T344-636l56 22q5-17 19-33.5t41-16.5q27 0 40.5 15t13.5 33q0 17-10 30.5T480-558q-35 30-42.5 47.5T430-448Zm30-65Z" fill={color} /></Svg>
}

const SECTIONS = [
  { key: 'cours', label: 'Cours', icon: IconBooks },
  { key: 'conferences', label: 'Conférences', icon: IconMic },
  { key: 'khoutbah', label: 'Khoutbah', icon: IconMosque },
  { key: 'fatwas', label: 'Fatwas', icon: IconFatwas },
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
        <TextTicker
          style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.md, color: colors.texte, lineHeight: 22, marginBottom: spacing.sm }}
          loop bounce={false} repeatSpacer={50} marqueeDelay={2000} scrollSpeed={10}
        >
          {livre.titre}
        </TextTicker>
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
    supabase
      .from('conferences')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setItems(data); setLoading(false) })
  }, [])

  const filtres = items.filter(c =>
    c.titre.toLowerCase().includes(recherche.toLowerCase()) ||
    c.sheikh.toLowerCase().includes(recherche.toLowerCase())
  )

  return (
    <View style={{ paddingHorizontal: spacing.xl }}>
      {loading
        ? [1, 2, 3].map(i => <View key={i} style={{ height: 68, borderRadius: radius.lg, backgroundColor: colors.bordure, opacity: 0.4, marginBottom: spacing.sm }} />)
        : filtres.length === 0
          ? (
            <View style={{ alignItems: 'center', paddingVertical: spacing['3xl'] }}>
              <Text style={{ fontSize: 36, marginBottom: spacing.md }}>🔍</Text>
              <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.base, color: colors.texteMuted }}>
                {recherche ? `Aucune conférence pour "${recherche}"` : 'Les conférences arrivent bientôt'}
              </Text>
            </View>
          )
          : (
            <View style={{ gap: spacing.sm }}>
              {filtres.map((c, index) => {
                const actif = piste?.id === c.id
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => jouer({ id: c.id, titre: c.titre, sheikh: c.sheikh, url: c.url_audio, duree: c.duree })}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
                  >
                    {/* Numéro */}
                    <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.sm, color: '#bbb', width: 24, textAlign: 'right', flexShrink: 0 }}>
                      {index + 1}
                    </Text>

                    {/* Carte */}
                    <View style={{ flex: 1, backgroundColor: actif ? '#e8f0f8' : colors.blanc, borderRadius: radius.lg, borderWidth: 1, borderColor: actif ? colors.bleu : colors.bordure, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                      {/* Bouton play */}
                      <View style={{ width: 40, height: 40, borderRadius: radius.full, backgroundColor: actif ? colors.bleu : '#f0f0f0', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {actif && enLecture
                          ? <Pause size={14} color="white" fill="white" strokeWidth={0} />
                          : <Play size={14} color={actif ? 'white' : '#aaa'} fill={actif ? 'white' : '#aaa'} strokeWidth={0} style={{ marginLeft: 2 }} />
                        }
                      </View>

                      {/* Infos */}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <TextTicker
                          style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base, color: actif ? colors.bleu : colors.texte, marginBottom: 4 }}
                          loop bounce={false} repeatSpacer={50} marqueeDelay={2000} scrollSpeed={10}
                        >
                          {c.titre}
                        </TextTicker>
                        <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: '#999' }}>
                          {c.sheikh}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                )
              })}
            </View>
          )
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
    supabase
      .from('khoutbahs')
      .select('*')
      .order('serie')
      .order('numero_serie')
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setItems(data); setLoading(false) })
  }, [])

  const filtres = items.filter(k =>
    k.titre.toLowerCase().includes(recherche.toLowerCase()) ||
    k.sheikh.toLowerCase().includes(recherche.toLowerCase()) ||
    (k.serie && k.serie.toLowerCase().includes(recherche.toLowerCase()))
  )

  return (
    <View style={{ paddingHorizontal: spacing.xl }}>
      {loading
        ? [1, 2, 3].map(i => <View key={i} style={{ height: 68, borderRadius: radius.lg, backgroundColor: colors.bordure, opacity: 0.4, marginBottom: spacing.sm }} />)
        : filtres.length === 0
          ? (
            <View style={{ alignItems: 'center', paddingVertical: spacing['3xl'] }}>
              <Text style={{ fontSize: 36, marginBottom: spacing.md }}>🔍</Text>
              <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.base, color: colors.texteMuted }}>
                {recherche ? `Aucune khoutbah pour "${recherche}"` : 'Les khoutbahs arrivent bientôt'}
              </Text>
            </View>
          )
          : (
            <View style={{ gap: spacing.sm }}>
              {filtres.map((k, index) => {
                const actif = piste?.id === k.id
                return (
                  <Pressable
                    key={k.id}
                    onPress={() => jouer({ id: k.id, titre: k.titre, sheikh: k.sheikh, url: k.url_audio, duree: k.duree })}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
                  >
                    {/* Numéro */}
                    <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.sm, color: '#bbb', width: 24, textAlign: 'right', flexShrink: 0 }}>
                      {index + 1}
                    </Text>

                    {/* Carte */}
                    <View style={{ flex: 1, backgroundColor: actif ? '#e8f0f8' : colors.blanc, borderRadius: radius.lg, borderWidth: 1, borderColor: actif ? colors.bleu : colors.bordure, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                      {/* Bouton play */}
                      <View style={{ width: 40, height: 40, borderRadius: radius.full, backgroundColor: actif ? colors.bleu : '#f0f0f0', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {actif && enLecture
                          ? <Pause size={14} color="white" fill="white" strokeWidth={0} />
                          : <Play size={14} color={actif ? 'white' : '#aaa'} fill={actif ? 'white' : '#aaa'} strokeWidth={0} style={{ marginLeft: 2 }} />
                        }
                      </View>

                      {/* Infos */}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <TextTicker
                          style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base, color: actif ? colors.bleu : colors.texte, marginBottom: 4 }}
                          loop bounce={false} repeatSpacer={50} marqueeDelay={2000} scrollSpeed={10}
                        >
                          {k.titre}
                        </TextTicker>
                        {k.serie ? (
                          <TextTicker
                            style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: '#999' }}
                            loop bounce={false} repeatSpacer={50} marqueeDelay={2000} scrollSpeed={10}
                          >
                            {k.sheikh}{'  '}<Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.xs, color: '#b8911f', backgroundColor: '#faf3dc', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>{k.serie}{k.numero_serie ? ` · ${k.numero_serie}` : ''}</Text>
                          </TextTicker>
                        ) : (
                          <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: '#999' }}>{k.sheikh}</Text>
                        )}
                      </View>
                    </View>
                  </Pressable>
                )
              })}
            </View>
          )
      }
    </View>
  )
}

function SectionFatwas({ recherche }: { recherche: string }) {
  const [items, setItems] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [sheikhs, setSheikhs] = useState<string[]>([])
  const [catActive, setCatActive] = useState('toutes')
  const [sheikhsActifs, setSheikhsActifs] = useState<string[]>([])
  const [showSheikhPicker, setShowSheikhPicker] = useState(false)
  const [loading, setLoading] = useState(true)
  const { jouer, piste, enLecture } = useAudio()

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
      f.question.toLowerCase().includes(recherche.toLowerCase()) ||
      f.sheikh.toLowerCase().includes(recherche.toLowerCase())
    return matchCat && matchSheikh && matchRecherche
  })

  // Grouper par catégorie
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

  return (
    <View style={{ paddingHorizontal: spacing.xl }}>

      {/* Filtres */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingVertical: spacing.sm, justifyContent: 'center' }}>

        {/* Bouton Sheikh picker */}
        <Pressable
          onPress={() => setShowSheikhPicker(true)}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingHorizontal: 14, paddingVertical: 7,
            borderRadius: radius.full,
            backgroundColor: sheikhsActifs.length > 0 ? colors.or : colors.blanc,
            borderWidth: 1, borderColor: sheikhsActifs.length > 0 ? colors.or : colors.bordure,
          }}
        >
          <Svg width={16} height={16} viewBox="0 -960 960 960">
            <Path d="M280-600v-80h560v80H280Zm0 160v-80h560v80H280Zm0 160v-80h560v80H280ZM160-600q-17 0-28.5-11.5T120-640q0-17 11.5-28.5T160-680q17 0 28.5 11.5T200-640q0 17-11.5 28.5T160-600Zm0 160q-17 0-28.5-11.5T120-480q0-17 11.5-28.5T160-520q17 0 28.5 11.5T200-480q0 17-11.5 28.5T160-440Zm0 160q-17 0-28.5-11.5T120-320q0-17 11.5-28.5T160-360q17 0 28.5 11.5T200-320q0 17-11.5 28.5T160-280Z" fill={sheikhsActifs.length > 0 ? 'white' : '#666'} />
          </Svg>
          {sheikhsActifs.length > 0 && (
            <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 10, fontFamily: typography.fontFamily.bold, color: colors.or }}>{sheikhsActifs.length}</Text>
            </View>
          )}
        </Pressable>

        {/* Toutes */}
        <Pressable onPress={() => setCatActive('toutes')}>
          <View style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full, backgroundColor: catActive === 'toutes' ? colors.bleu : colors.blanc, borderWidth: 1, borderColor: catActive === 'toutes' ? colors.bleu : colors.bordure }}>
            <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.sm, color: catActive === 'toutes' ? 'white' : '#666' }}>Toutes</Text>
          </View>
        </Pressable>

        {/* Catégories */}
        {categories.map(cat => (
          <Pressable key={cat.nom} onPress={() => setCatActive(cat.nom)}>
            <View style={{
              paddingHorizontal: 14, paddingVertical: 7, borderRadius: radius.full,
              backgroundColor: catActive === cat.nom ? cat.couleur + '22' : colors.blanc,
              borderWidth: 1, borderColor: catActive === cat.nom ? cat.couleur : colors.bordure,
            }}>
              <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.sm, color: catActive === cat.nom ? cat.couleur : '#666' }}>{cat.nom}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Contenu */}
      {loading ? (
        [1, 2, 3].map(i => <View key={i} style={{ height: 68, borderRadius: radius.lg, backgroundColor: colors.bordure, opacity: 0.4, marginBottom: spacing.sm }} />)
      ) : filtres.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: spacing['3xl'] }}>
          <Text style={{ fontSize: 36, marginBottom: spacing.md }}>🔍</Text>
          <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.base, color: colors.texteMuted }}>Aucune fatwa trouvée</Text>
        </View>
      ) : (
        <View style={{ gap: spacing.xl }}>
          {groupesTries.map(([categorie, fatwas]) => {
            const cat = categories.find(c => c.nom === categorie)
            return (
              <View key={categorie}>
                {/* En-tête catégorie */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
                  <View style={{ flex: 1, height: 1, backgroundColor: colors.bordure }} />
                  <View style={{
                    paddingHorizontal: spacing.md, paddingVertical: 4,
                    borderRadius: radius.full,
                    backgroundColor: (cat?.couleur ?? '#f0f0f0') + '22',
                    borderWidth: 1, borderColor: (cat?.couleur ?? '#ccc') + '44',
                  }}>
                    <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, letterSpacing: 1, textTransform: 'uppercase', color: cat?.couleur ?? '#666' }}>
                      {categorie}
                    </Text>
                  </View>
                  <View style={{ flex: 1, height: 1, backgroundColor: colors.bordure }} />
                </View>

                {/* Fatwas */}
                <View style={{ gap: spacing.sm }}>
                  {fatwas.map((f: any) => {
                    const actif = piste?.id === f.id
                    return (
                      <Pressable
                        key={f.id}
                        onPress={() => jouer({ id: f.id, titre: f.question, sheikh: f.sheikh, url: f.url_audio, duree: f.duree })}
                      >
                        <View style={{
                          backgroundColor: actif ? '#e8f0f8' : colors.blanc,
                          borderRadius: radius.lg,
                          borderWidth: 1,
                          borderColor: actif ? colors.bleu : colors.bordure,
                          padding: spacing.md,
                        }}>
                          <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base, color: actif ? colors.bleu : colors.texte, lineHeight: 22, marginBottom: spacing.sm }}>
                            {f.question}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                            <View style={{ width: 32, height: 32, borderRadius: radius.full, backgroundColor: actif ? colors.bleu : '#f0f0f0', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {actif && enLecture
                                ? <Pause size={12} color="white" fill="white" strokeWidth={0} />
                                : <Play size={12} color={actif ? 'white' : '#aaa'} fill={actif ? 'white' : '#aaa'} strokeWidth={0} style={{ marginLeft: 2 }} />
                              }
                            </View>
                            <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.sm, color: actif ? colors.bleu : '#888' }}>{f.sheikh}</Text>
                            {null}
                          </View>
                        </View>
                      </Pressable>
                    )
                  })}
                </View>
              </View>
            )
          })}
        </View>
      )}

      {/* Modal Sheikh picker */}
      <Modal visible={showSheikhPicker} transparent animationType="fade">
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }} onPress={() => setShowSheikhPicker(false)}>
          <Pressable style={{ backgroundColor: colors.blanc, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.xl, paddingBottom: 48 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#ddd', alignSelf: 'center', marginBottom: spacing.xl }} />
            <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, letterSpacing: 2, color: colors.or, textTransform: 'uppercase', marginBottom: spacing.lg }}>
              Filtrer par sheikh
            </Text>
            <View style={{ gap: spacing.sm }}>
              {sheikhs.map(s => {
                const actif = sheikhsActifs.includes(s)
                return (
                  <Pressable
                    key={s}
                    onPress={() => setSheikhsActifs(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: actif ? '#faf3dc' : colors.fondCreme }}
                  >
                    <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: actif ? colors.or : '#ccc', backgroundColor: actif ? colors.or : 'white', alignItems: 'center', justifyContent: 'center' }}>
                      {actif && <Text style={{ color: 'white', fontSize: 12, fontFamily: typography.fontFamily.bold }}>✓</Text>}
                    </View>
                    <Text style={{ flex: 1, fontFamily: actif ? typography.fontFamily.semibold : typography.fontFamily.regular, fontSize: typography.size.base, color: colors.texte }}>{s}</Text>
                  </Pressable>
                )
              })}
            </View>
            {sheikhsActifs.length > 0 && (
              <Pressable
                onPress={() => setSheikhsActifs([])}
                style={{ marginTop: spacing.md, padding: spacing.sm, borderRadius: radius.md, backgroundColor: '#f0f0f0', alignItems: 'center' }}
              >
                <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.sm, color: '#888' }}>Effacer la sélection</Text>
              </Pressable>
            )}
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  )
}

export default function Audio() {
  const [sectionActive, setSectionActive] = useState('cours')
  const [recherche, setRecherche] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const sectionCourante = SECTIONS.find(s => s.key === sectionActive)!
  const { onScroll, cachéTabBar } = useScroll()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.fondCreme }} edges={[]}>
      <StatusBar barStyle="light-content" />

      {/* Header bleu */}
      <View style={{ backgroundColor: colors.bleu, paddingTop: 60, paddingBottom: spacing.xl, paddingHorizontal: spacing.xl, alignItems: 'center' }}>
        <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, letterSpacing: 2, color: colors.or, textTransform: 'uppercase', marginBottom: spacing.sm }}>
          Bibliothèque audio
        </Text>

        {/* Titre cliquable = picker */}
        <Pressable
          onPress={() => setShowPicker(true)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.lg }}
        >
          <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size['3xl'], color: 'white' }}>
            {sectionCourante.label}
          </Text>
          <ChevronDown size={20} color="rgba(255,255,255,0.7)" strokeWidth={2} />
        </Pressable>

        {/* Barre recherche */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.15)',
          borderRadius: radius.full,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          width: '100%',
          gap: spacing.sm,
        }}>
          <IconSearch size={16} color="rgba(255,255,255,0.6)" />
          <TextInput
            value={recherche}
            onChangeText={setRecherche}
            placeholder={`Rechercher...`}
            placeholderTextColor="rgba(255,255,255,0.5)"
            style={{ flex: 1, fontFamily: typography.fontFamily.regular, fontSize: typography.size.base, color: 'white' }}
          />
          {recherche.length > 0 && (
            <Pressable onPress={() => setRecherche('')}>
              <X size={16} color="rgba(255,255,255,0.6)" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Barre or dégradé */}
      <LinearGradient
        colors={['transparent', '#d9ac2a', '#d9ac2a', 'transparent']}
        locations={[0, 0.3, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ height: 3 }}
      />

      {/* Contenu */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: cachéTabBar ? 80 : 160 }}
        onScroll={e => onScroll(e.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
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
                    onPress={() => { setSectionActive(s.key); setShowPicker(false); setRecherche('') }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.lg, backgroundColor: actif ? '#e8f0f8' : colors.fondCreme, borderWidth: 1, borderColor: actif ? colors.bleu : 'transparent' }}
                  >
                    <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: actif ? colors.bleu : colors.blanc, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={20} color={actif ? 'white' : '#888'} />
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
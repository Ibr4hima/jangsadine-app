import { colors, radius, spacing, typography } from '@/constants/theme'
import { useAudio } from '@/contexts/AudioContext'
import { supabase } from '@/lib/supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { ArrowLeft, BookOpen, ChevronRight, Play, Plus, Trash2, X } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import {
  Alert,
  FlatList, Modal, Pressable,
  ScrollView, StatusBar, Text, TextInput, View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type Cours = {
  id: string
  titre: string
  sheikh: string
  nb_episodes: number
  categories: { nom: string }
}

type Programme = {
  id: string
  nom: string
  intention: string
  cours: Cours[]
  dateCreation: string
  episodesEcoutes: string[]
}

const STORAGE_KEY = 'jsd_programmes'

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

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function Programme() {
  const router = useRouter()
  const { jouer } = useAudio()
  const [programmes, setProgrammes] = useState<Programme[]>([])
  const [modalCreer, setModalCreer] = useState(false)
  const [modalAjouter, setModalAjouter] = useState<Programme | null>(null)
  const [nomNouv, setNomNouv] = useState('')
  const [intentionNouv, setIntentionNouv] = useState('')
  const [coursDispo, setCoursDispo] = useState<Cours[]>([])
  const [rechercheCours, setRechercheCours] = useState('')
  const [vue, setVue] = useState<Programme | null>(null)

  // Charger programmes
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) setProgrammes(JSON.parse(raw))
    })
  }, [])

  const sauvegarder = async (p: Programme[]) => {
    setProgrammes(p)
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(p))
  }

  // Charger cours dispo
  useEffect(() => {
    if (!modalAjouter) return
    supabase
      .from('cours')
      .select('id, titre, sheikh, nb_episodes, categories(nom)')
      .order('titre')
      .then(({ data }) => { if (data) setCoursDispo(data as any) })
  }, [modalAjouter])

  const creerProgramme = async () => {
    if (!nomNouv.trim()) return
    const nouveau: Programme = {
      id: genId(),
      nom: nomNouv.trim(),
      intention: intentionNouv.trim(),
      cours: [],
      dateCreation: new Date().toISOString(),
      episodesEcoutes: [],
    }
    await sauvegarder([...programmes, nouveau])
    setNomNouv('')
    setIntentionNouv('')
    setModalCreer(false)
  }

  const supprimerProgramme = (id: string) => {
    Alert.alert('Supprimer', 'Supprimer ce programme ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive', onPress: async () => {
          await sauvegarder(programmes.filter(p => p.id !== id))
          if (vue?.id === id) setVue(null)
        }
      },
    ])
  }

  const ajouterCours = async (prog: Programme, cours: Cours) => {
    if (prog.cours.find(c => c.id === cours.id)) return
    const mis = programmes.map(p =>
      p.id === prog.id ? { ...p, cours: [...p.cours, cours] } : p
    )
    await sauvegarder(mis)
    setModalAjouter(mis.find(p => p.id === prog.id) ?? null)
    if (vue?.id === prog.id) setVue(mis.find(p => p.id === prog.id) ?? null)
  }

  const retirerCours = async (prog: Programme, coursId: string) => {
    const mis = programmes.map(p =>
      p.id === prog.id ? { ...p, cours: p.cours.filter(c => c.id !== coursId) } : p
    )
    await sauvegarder(mis)
    if (vue?.id === prog.id) setVue(mis.find(p => p.id === prog.id) ?? null)
  }

  const jouerProgramme = async (prog: Programme) => {
    if (prog.cours.length === 0) return
    // Charger tous les épisodes du premier cours
    const { data: eps } = await supabase
      .from('episodes')
      .select('id, titre, numero, url_audio, duree')
      .eq('cours_id', prog.cours[0].id)
      .order('numero')
    if (!eps || eps.length === 0) return
    const piste = {
      id: eps[0].id,
      titre: eps[0].titre,
      sheikh: prog.cours[0].sheikh,
      url: eps[0].url_audio,
      duree: eps[0].duree,
      programmeId: prog.id,
    }
    const suivantes = eps.slice(1).map((e: any) => ({
      id: e.id, titre: e.titre,
      sheikh: prog.cours[0].sheikh,
      url: e.url_audio, duree: e.duree,
      programmeId: prog.id,
    }))
    jouer(piste, suivantes)
  }

  const coursFiltres = coursDispo.filter(c =>
    c.titre.toLowerCase().includes(rechercheCours.toLowerCase()) ||
    c.sheikh.toLowerCase().includes(rechercheCours.toLowerCase())
  )

  const nbEpisodesTotal = (prog: Programme) =>
    prog.cours.reduce((acc, c) => acc + (c.nb_episodes ?? 0), 0)

  // ── Vue détail programme ──
  if (vue) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.fondCreme }} edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
          borderBottomWidth: 1, borderBottomColor: colors.bordure,
          backgroundColor: colors.blanc,
        }}>
          <Pressable onPress={() => setVue(null)} style={{ marginRight: spacing.md, padding: 4 }}>
            <ArrowLeft size={22} color={colors.texte} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.lg, color: colors.texte }}>
              {vue.nom}
            </Text>
            {vue.intention ? (
              <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: colors.texteMuted }}>
                {vue.intention}
              </Text>
            ) : null}
          </View>
          <Pressable
            onPress={() => setModalAjouter(vue)}
            style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: colors.bleu, borderRadius: radius.full,
              paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
            }}
          >
            <Plus size={14} color="white" />
            <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.sm, color: 'white', marginLeft: 4 }}>
              Ajouter
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120 }}>
          {/* Stats */}
          <View style={{
            backgroundColor: colors.blanc, borderRadius: radius.lg,
            borderWidth: 1, borderColor: colors.bordure,
            padding: spacing.md, flexDirection: 'row',
            marginBottom: spacing.xl,
          }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xl, color: colors.bleu }}>
                {vue.cours.length}
              </Text>
              <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.xs, color: colors.texteMuted }}>
                cours
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.bordure }} />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xl, color: colors.bleu }}>
                {nbEpisodesTotal(vue)}
              </Text>
              <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.xs, color: colors.texteMuted }}>
                épisodes
              </Text>
            </View>
          </View>

          {/* Bouton lire */}
          {vue.cours.length > 0 && (
            <Pressable
              onPress={() => jouerProgramme(vue)}
              style={{
                backgroundColor: colors.bleu, borderRadius: radius.md,
                paddingVertical: 13, flexDirection: 'row',
                alignItems: 'center', justifyContent: 'center',
                marginBottom: spacing.xl,
              }}
            >
              <Play size={16} color="white" fill="white" strokeWidth={0} style={{ marginRight: spacing.sm }} />
              <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.md, color: 'white' }}>
                Lire le programme
              </Text>
            </Pressable>
          )}

          {/* Liste cours */}
          <Text style={{
            fontFamily: typography.fontFamily.bold,
            fontSize: typography.size.xs, letterSpacing: 2,
            color: colors.or, textTransform: 'uppercase',
            marginBottom: spacing.md,
          }}>
            Cours ({vue.cours.length})
          </Text>

          {vue.cours.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: spacing['2xl'] }}>
              <Text style={{ fontSize: 40, marginBottom: spacing.md }}>📚</Text>
              <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.base, color: colors.texteMuted, textAlign: 'center' }}>
                Ajoute des cours à ce programme
              </Text>
            </View>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {vue.cours.map((c, i) => {
                const nomCat = c.categories?.nom
                const bg = couleurBg[nomCat] ?? '#f0f0f0'
                const txt = couleurTxt[nomCat] ?? '#666'
                return (
                  <View key={c.id} style={{
                    backgroundColor: colors.blanc, borderRadius: radius.lg,
                    borderWidth: 1, borderColor: colors.bordure,
                    padding: spacing.md, flexDirection: 'row', alignItems: 'center',
                  }}>
                    <View style={{
                      width: 32, height: 32, borderRadius: radius.md,
                      backgroundColor: bg, alignItems: 'center', justifyContent: 'center',
                      marginRight: spacing.md, flexShrink: 0,
                    }}>
                      <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, color: txt }}>
                        {i + 1}
                      </Text>
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text numberOfLines={1} style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base, color: colors.texte }}>
                        {c.titre}
                      </Text>
                      <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: colors.texteMuted, marginTop: 2 }}>
                        {c.sheikh} · {c.nb_episodes ?? 0} épisodes
                      </Text>
                    </View>
                    <Pressable onPress={() => retirerCours(vue, c.id)} style={{ padding: 4 }}>
                      <X size={16} color="#ccc" />
                    </Pressable>
                  </View>
                )
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    )
  }

  // ── Vue liste programmes ──
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.fondCreme }} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
        borderBottomWidth: 1, borderBottomColor: colors.bordure,
        backgroundColor: colors.blanc,
      }}>
        <Pressable onPress={() => router.back()} style={{ marginRight: spacing.md, padding: 4 }}>
          <ArrowLeft size={22} color={colors.texte} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, letterSpacing: 2, color: colors.or, textTransform: 'uppercase' }}>
            Apprentissage
          </Text>
          <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.lg, color: colors.texte }}>
            Mon Programme
          </Text>
        </View>
        <Pressable
          onPress={() => setModalCreer(true)}
          style={{
            width: 36, height: 36, borderRadius: radius.full,
            backgroundColor: colors.bleu,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Plus size={18} color="white" />
        </Pressable>
      </View>

      {programmes.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
          <Text style={{ fontSize: 48, marginBottom: spacing.lg }}>📋</Text>
          <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xl, color: colors.texte, marginBottom: spacing.sm, textAlign: 'center' }}>
            Aucun programme
          </Text>
          <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.base, color: colors.texteMuted, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl }}>
            Crée un programme personnalisé en ajoutant des cours audio dans l'ordre que tu veux.
          </Text>
          <Pressable
            onPress={() => setModalCreer(true)}
            style={{
              backgroundColor: colors.bleu, borderRadius: radius.md,
              paddingHorizontal: spacing.xl, paddingVertical: 13,
              flexDirection: 'row', alignItems: 'center',
            }}
          >
            <Plus size={16} color="white" style={{ marginRight: spacing.sm }} />
            <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.md, color: 'white' }}>
              Créer un programme
            </Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120 }}>
          <View style={{ gap: spacing.sm }}>
            {programmes.map(prog => (
              <Pressable key={prog.id} onPress={() => setVue(prog)}>
                <View style={{
                  backgroundColor: colors.blanc, borderRadius: radius.lg,
                  borderWidth: 1, borderColor: colors.bordure,
                  padding: spacing.md, flexDirection: 'row', alignItems: 'center',
                }}>
                  <View style={{
                    width: 46, height: 46, borderRadius: radius.md,
                    backgroundColor: '#EDE8D0',
                    alignItems: 'center', justifyContent: 'center',
                    marginRight: spacing.md, flexShrink: 0,
                  }}>
                    <BookOpen size={20} color="#654321" strokeWidth={1.5} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base, color: colors.texte }}>
                      {prog.nom}
                    </Text>
                    <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: colors.texteMuted, marginTop: 2 }}>
                      {prog.cours.length} cours · {nbEpisodesTotal(prog)} épisodes
                    </Text>
                  </View>
                  <Pressable onPress={() => supprimerProgramme(prog.id)} style={{ padding: 4, marginRight: spacing.sm }}>
                    <Trash2 size={16} color="#ccc" />
                  </Pressable>
                  <ChevronRight size={18} color="#ccc" />
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Modal créer programme */}
      <Modal visible={modalCreer} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.fondCreme }} edges={['top']}>
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
            borderBottomWidth: 1, borderBottomColor: colors.bordure,
            backgroundColor: colors.blanc,
          }}>
            <Pressable onPress={() => setModalCreer(false)} style={{ marginRight: spacing.md, padding: 4 }}>
              <X size={22} color={colors.texte} />
            </Pressable>
            <Text style={{ flex: 1, fontFamily: typography.fontFamily.bold, fontSize: typography.size.lg, color: colors.texte }}>
              Nouveau programme
            </Text>
            <Pressable
              onPress={creerProgramme}
              style={{
                backgroundColor: nomNouv.trim() ? colors.bleu : '#ccc',
                borderRadius: radius.md,
                paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
              }}
            >
              <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.sm, color: 'white' }}>
                Créer
              </Text>
            </Pressable>
          </View>

          <View style={{ padding: spacing.xl }}>
            <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.sm, color: colors.texte, marginBottom: spacing.sm }}>
              Nom du programme *
            </Text>
            <TextInput
              value={nomNouv}
              onChangeText={setNomNouv}
              placeholder="Ex: Aqeedah - Débutant"
              placeholderTextColor="#bbb"
              style={{
                backgroundColor: colors.blanc, borderRadius: radius.lg,
                borderWidth: 1, borderColor: colors.bordure,
                padding: spacing.md, fontFamily: typography.fontFamily.regular,
                fontSize: typography.size.base, color: colors.texte,
                marginBottom: spacing.lg,
              }}
            />
            <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.sm, color: colors.texte, marginBottom: spacing.sm }}>
              Intention (optionnel)
            </Text>
            <TextInput
              value={intentionNouv}
              onChangeText={setIntentionNouv}
              placeholder="Ex: Apprendre les fondements de l'Islam"
              placeholderTextColor="#bbb"
              multiline
              style={{
                backgroundColor: colors.blanc, borderRadius: radius.lg,
                borderWidth: 1, borderColor: colors.bordure,
                padding: spacing.md, fontFamily: typography.fontFamily.regular,
                fontSize: typography.size.base, color: colors.texte,
                minHeight: 80, textAlignVertical: 'top',
              }}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Modal ajouter cours */}
      <Modal visible={!!modalAjouter} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.fondCreme }} edges={['top']}>
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
            borderBottomWidth: 1, borderBottomColor: colors.bordure,
            backgroundColor: colors.blanc,
          }}>
            <Pressable onPress={() => { setModalAjouter(null); setRechercheCours('') }} style={{ marginRight: spacing.md, padding: 4 }}>
              <X size={22} color={colors.texte} />
            </Pressable>
            <Text style={{ flex: 1, fontFamily: typography.fontFamily.bold, fontSize: typography.size.lg, color: colors.texte }}>
              Ajouter des cours
            </Text>
          </View>

          {/* Recherche */}
          <View style={{
            margin: spacing.lg,
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: colors.blanc, borderRadius: radius.lg,
            borderWidth: 1, borderColor: colors.bordure,
            paddingHorizontal: spacing.md,
          }}>
            <TextInput
              value={rechercheCours}
              onChangeText={setRechercheCours}
              placeholder="Rechercher un cours..."
              placeholderTextColor="#bbb"
              style={{
                flex: 1, fontFamily: typography.fontFamily.regular,
                fontSize: typography.size.base, color: colors.texte,
                paddingVertical: spacing.md,
              }}
            />
          </View>

          <FlatList
            data={coursFiltres}
            keyExtractor={item => item.id}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 80, gap: spacing.sm }}
            renderItem={({ item }) => {
              const dejaAjoute = modalAjouter?.cours.find(c => c.id === item.id)
              const nomCat = item.categories?.nom
              const bg = couleurBg[nomCat] ?? '#f0f0f0'
              const txt = couleurTxt[nomCat] ?? '#666'
              return (
                <Pressable
                  onPress={() => modalAjouter && !dejaAjoute && ajouterCours(modalAjouter, item)}
                  style={{
                    backgroundColor: dejaAjoute ? '#f0f7f0' : colors.blanc,
                    borderRadius: radius.lg,
                    borderWidth: 1,
                    borderColor: dejaAjoute ? '#2d7a4f' : colors.bordure,
                    padding: spacing.md,
                    flexDirection: 'row', alignItems: 'center',
                    opacity: dejaAjoute ? 0.7 : 1,
                  }}
                >
                  <View style={{
                    width: 40, height: 40, borderRadius: radius.md,
                    backgroundColor: bg, alignItems: 'center', justifyContent: 'center',
                    marginRight: spacing.md, flexShrink: 0,
                  }}>
                    <BookOpen size={18} color={txt} strokeWidth={1.5} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text numberOfLines={1} style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base, color: colors.texte }}>
                      {item.titre}
                    </Text>
                    <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: colors.texteMuted, marginTop: 2 }}>
                      {item.sheikh} · {item.nb_episodes ?? 0} épisodes
                    </Text>
                  </View>
                  {dejaAjoute ? (
                    <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.xs, color: '#2d7a4f' }}>✓ Ajouté</Text>
                  ) : (
                    <Plus size={18} color={colors.bleu} />
                  )}
                </Pressable>
              )
            }}
          />
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  )
}
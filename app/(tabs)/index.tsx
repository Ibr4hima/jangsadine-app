import { colors, radius, spacing, typography } from '@/constants/theme'
import { useAudio } from '@/contexts/AudioContext'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'expo-router'
import {
  BookMarked,
  BookOpen,
  Clock, Headphones, Mic
} from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import {
  Animated, Dimensions,
  Pressable,
  Image as RNImage,
  StatusBar, Text, View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width } = Dimensions.get('window')

const modules = [
  { nom: 'Cours audio', href: '/audio', couleur: '#e8f0f8', iconColor: colors.bleu, icon: Headphones },
  { nom: 'Conférences', href: '/conferences', couleur: '#faf3dc', iconColor: colors.orFonce, icon: Mic },
  { nom: 'Khoutbah', href: '/khoutbah', couleur: '#e8f0f8', iconColor: colors.bleu, icon: BookMarked },
  { nom: 'Prières', href: '/prieres', couleur: '#faf3dc', iconColor: colors.orFonce, icon: Clock },
  { nom: 'Coran', href: '/coran', couleur: '#eaf4ee', iconColor: '#2d7a4f', icon: BookOpen },
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

function ModuleCard({ mod, index }: { mod: typeof modules[0], index: number }) {
  const scale = useRef(new Animated.Value(1)).current
  const router = useRouter()
  const Icon = mod.icon

  return (
    <Pressable
      onPressIn={() => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
      onPress={() => router.push(mod.href as any)}
      style={{ width: (width - spacing.xl * 2 - spacing.md) / 2 }}
    >
      <Animated.View style={{
        transform: [{ scale }],
        backgroundColor: colors.blanc,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.bordure,
        padding: spacing.lg,
        alignItems: 'center',
        gap: spacing.sm,
      }}>
        <View style={{
          width: 52, height: 52, borderRadius: 14,
          backgroundColor: mod.couleur,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={22} color={mod.iconColor} strokeWidth={1.5} />
        </View>
        <Text style={{
          fontFamily: typography.fontFamily.semibold,
          fontSize: typography.size.sm,
          color: colors.texte,
          textAlign: 'center',
          lineHeight: 18,
        }}>
          {mod.nom}
        </Text>
      </Animated.View>
    </Pressable>
  )
}

function CoursCard({ cours }: { cours: any }) {
  const scale = useRef(new Animated.Value(1)).current
  const router = useRouter()
  const nomCat = cours.categories?.nom
  const bg = couleurBg[nomCat] ?? '#f0f0f0'
  const txt = couleurTxt[nomCat] ?? '#666'

  return (
    <Pressable
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
      onPress={() => router.push(`/audio/${cours.id}` as any)}
    >
      <Animated.View style={{
        transform: [{ scale }],
        backgroundColor: colors.blanc,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.bordure,
        padding: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
      }}>
        <View style={{
          width: 44, height: 44, borderRadius: radius.md,
          backgroundColor: bg,
          alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Headphones size={18} color={txt} strokeWidth={1.5} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{
            fontFamily: typography.fontFamily.semibold,
            fontSize: typography.size.base,
            color: colors.texte,
          }}>
            {cours.titre}
          </Text>
          <Text style={{
            fontFamily: typography.fontFamily.regular,
            fontSize: typography.size.sm,
            color: colors.texteMuted,
            marginTop: 2,
          }}>
            {cours.sheikh}
          </Text>
        </View>
        {nomCat && (
          <View style={{
            backgroundColor: bg, borderRadius: radius.full,
            paddingHorizontal: 8, paddingVertical: 3, flexShrink: 0,
          }}>
            <Text style={{
              fontFamily: typography.fontFamily.medium,
              fontSize: typography.size.xs,
              color: txt,
            }}>
              {nomCat}
            </Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  )
}

export default function Accueil() {
  const [derniersCours, setDerniersCours] = useState<any[]>([])
  const scrollY = useRef(new Animated.Value(0)).current
  const router = useRouter()
  const { jouer } = useAudio()

  const heroOpacity = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  })
  const heroTranslate = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, -40],
    extrapolate: 'clamp',
  })

  useEffect(() => {
    supabase
      .from('cours')
      .select('id, titre, sheikh, nb_episodes, categories(nom)')
      .order('created_at', { ascending: false })
      .limit(4)
      .then(({ data, error }) => {
        console.log('cours:', data, 'erreur:', error)
        if (data) setDerniersCours(data)
      })
  }, [])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.fondCreme }} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >

        {/* ── HERO ── */}
        <Animated.View style={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing['2xl'],
          paddingBottom: spacing['2xl'],
          alignItems: 'center',
          opacity: heroOpacity,
          transform: [{ translateY: heroTranslate }],
        }}>
          {/* Basmallah */}
          <RNImage
            source={require('../../assets/images/basmallah.png')}
            style={{ width: 280, height: 70, marginBottom: spacing.lg, opacity: 0.85 }}
            resizeMode="contain"
          />

          <Text style={{
            fontFamily: typography.fontFamily.bold,
            fontSize: 38,
            color: colors.texte,
            textAlign: 'center',
            lineHeight: 46,
            marginBottom: spacing.md,
          }}>
            Apprends ta{' '}
            <Text style={{ color: colors.or }}>religion</Text>
          </Text>

          <Text style={{
            fontFamily: typography.fontFamily.regular,
            fontSize: typography.size.md,
            color: colors.texteMuted,
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: spacing.xl,
            maxWidth: 300,
          }}>
            Cours audio, khoutbah, conférences, fatwas et heures de prières — accessibles gratuitement.
          </Text>

          {/* Boutons CTA */}
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Pressable
              onPress={() => router.push('/audio' as any)}
              style={{
                backgroundColor: colors.bleu,
                paddingHorizontal: spacing.xl,
                paddingVertical: 13,
                borderRadius: radius.md,
              }}
            >
              <Text style={{
                fontFamily: typography.fontFamily.medium,
                fontSize: typography.size.md,
                color: colors.blanc,
              }}>
                Découvrir les cours
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/coran' as any)}
              style={{
                borderWidth: 1.5,
                borderColor: colors.or,
                paddingHorizontal: spacing.xl,
                paddingVertical: 13,
                borderRadius: radius.md,
              }}
            >
              <Text style={{
                fontFamily: typography.fontFamily.medium,
                fontSize: typography.size.md,
                color: colors.orFonce,
              }}>
                Lire le Coran
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* ── BARRE OR ── */}
        <View style={{
          height: 3,
          marginHorizontal: spacing.xl,
          borderRadius: 2,
          backgroundColor: colors.or,
          marginBottom: spacing['2xl'],
          opacity: 0.5,
        }} />

        {/* ── MODULES ── */}
        <View style={{ paddingHorizontal: spacing.xl, marginBottom: spacing['2xl'] }}>
          <Text style={{
            fontFamily: typography.fontFamily.bold,
            fontSize: typography.size.xs,
            letterSpacing: 2,
            color: colors.or,
            textTransform: 'uppercase',
            marginBottom: spacing.xs,
          }}>
            La plateforme
          </Text>
          <Text style={{
            fontFamily: typography.fontFamily.bold,
            fontSize: typography.size['3xl'],
            color: colors.texte,
            marginBottom: spacing.lg,
          }}>
            Tout ce dont{'\n'}tu as besoin
          </Text>

          {/* Grille 2 colonnes */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'center' }}>
            {modules.map((mod, i) => (
              <ModuleCard key={mod.nom} mod={mod} index={i} />
            ))}
          </View>
        </View>

        {/* ── BARRE OR ── */}
        <View style={{
          height: 3,
          marginHorizontal: spacing.xl,
          borderRadius: 2,
          backgroundColor: colors.or,
          marginBottom: spacing['2xl'],
          opacity: 0.5,
        }} />

        {/* ── DERNIERS COURS ── */}
        <View style={{ paddingHorizontal: spacing.xl }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            justifyContent: 'space-between', marginBottom: spacing.lg,
          }}>
            <View>
              <Text style={{
                fontFamily: typography.fontFamily.bold,
                fontSize: typography.size.xs,
                letterSpacing: 2,
                color: colors.or,
                textTransform: 'uppercase',
                marginBottom: spacing.xs,
              }}>
                Bibliothèque
              </Text>
              <Text style={{
                fontFamily: typography.fontFamily.bold,
                fontSize: typography.size['2xl'],
                color: colors.texte,
              }}>
                Derniers cours
              </Text>
            </View>
            <Pressable onPress={() => router.push('/audio' as any)}>
              <Text style={{
                fontFamily: typography.fontFamily.medium,
                fontSize: typography.size.base,
                color: colors.bleu,
              }}>
                Voir tout →
              </Text>
            </Pressable>
          </View>

          <View style={{ gap: spacing.sm }}>
            {derniersCours.length === 0
              ? [1, 2, 3].map(i => (
                <View key={i} style={{
                  height: 72, borderRadius: radius.lg,
                  backgroundColor: colors.bordure, opacity: 0.5,
                }} />
              ))
              : derniersCours.map(cours => (
                <CoursCard key={cours.id} cours={cours} />
              ))
            }
          </View>
        </View>

      </Animated.ScrollView>
    </SafeAreaView>
  )
}
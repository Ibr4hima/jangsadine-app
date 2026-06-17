import { colors, radius, spacing, typography } from '@/constants/theme'
import { useRouter } from 'expo-router'
import { ChevronRight, Search } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import {
  Animated, FlatList, Pressable, StatusBar,
  Text, TextInput, View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const sourates = require('../../assets/quran/sourates.json')

type Sourate = {
  index: number
  nom: string
  nomAr: string
  versets: number
  page: number
}


function SourateCard({ sourate }: { sourate: Sourate }) {
  const scale = useRef(new Animated.Value(1)).current
  const router = useRouter()

  return (
    <Pressable
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
      onPress={() => router.push(`/coran/${sourate.index}?riwaya=hafs` as any)}
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
        marginHorizontal: spacing.xl,
        marginBottom: spacing.sm,
      }}>
        {/* Numéro — pastille ronde simple */}
        <View style={{
          width: 44, height: 44, borderRadius: 22,
          marginRight: spacing.md, flexShrink: 0,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(45,87,140,0.08)',
        }}>
          <Text style={{
            fontFamily: typography.fontFamily.bold,
            fontSize: typography.size.base,
            color: colors.bleu,
          }}>
            {sourate.index}
          </Text>
        </View>

        {/* Nom latin */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{
            fontFamily: typography.fontFamily.semibold,
            fontSize: typography.size.base,
            color: colors.texte,
          }}>
            {sourate.nom}
          </Text>
        </View>

        {/* Nom SuraNames calligraphique */}
        <Text style={{
          fontFamily: 'SuraNames',
          fontSize: 25,
          color: colors.bleu,
          marginRight: spacing.sm,
          writingDirection: 'ltr',
        }}>
          {String(sourate.index).padStart(3, '0') + 'surah'}
        </Text>

        <ChevronRight size={16} color="#ccc" />
      </Animated.View>
    </Pressable>
  )
}

export default function Coran() {
  const [recherche, setRecherche] = useState('')
  const [filtrees, setFiltrees] = useState<Sourate[]>(sourates)

  useEffect(() => {
    if (!recherche.trim()) {
      setFiltrees(sourates)
    } else {
      const q = recherche.toLowerCase()
      setFiltrees(sourates.filter((s: Sourate) =>
        s.nom.toLowerCase().includes(q) ||
        s.nomAr.includes(recherche) ||
        String(s.index).includes(q)
      ))
    }
  }, [recherche])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.fondCreme }} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md }}>
        <Text style={{
          fontFamily: typography.fontFamily.bold,
          fontSize: typography.size.xs,
          letterSpacing: 2, color: colors.or,
          textTransform: 'uppercase', marginBottom: 4,
        }}>
          Lecture
        </Text>
        <Text style={{
          fontFamily: typography.fontFamily.bold,
          fontSize: typography.size['2xl'],
          color: colors.texte, marginBottom: spacing.lg,
        }}>
          Coran
        </Text>

        {/* Recherche */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: colors.blanc, borderRadius: radius.lg,
          borderWidth: 1, borderColor: colors.bordure,
          paddingHorizontal: spacing.md, gap: spacing.sm,
        }}>
          <Search size={16} color="#bbb" />
          <TextInput
            value={recherche}
            onChangeText={setRecherche}
            placeholder="Rechercher une sourate..."
            placeholderTextColor="#bbb"
            style={{
              flex: 1, fontFamily: typography.fontFamily.regular,
              fontSize: typography.size.base, color: colors.texte,
              paddingVertical: spacing.sm,
            }}
          />
        </View>
      </View>

      {/* Liste */}
      <FlatList
        data={filtrees}
        keyExtractor={item => String(item.index)}
        renderItem={({ item }) => <SourateCard sourate={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: spacing.sm, paddingBottom: 120 }}
      />

    </SafeAreaView>
  )
}
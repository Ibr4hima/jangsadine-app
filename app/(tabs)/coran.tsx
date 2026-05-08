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

const JUZS = [
  { juz: 1, debut: 1 }, { juz: 2, debut: 2 }, { juz: 3, debut: 2 },
  { juz: 4, debut: 3 }, { juz: 5, debut: 4 }, { juz: 6, debut: 4 },
  { juz: 7, debut: 5 }, { juz: 8, debut: 6 }, { juz: 9, debut: 7 },
  { juz: 10, debut: 8 }, { juz: 11, debut: 9 }, { juz: 12, debut: 11 },
  { juz: 13, debut: 12 }, { juz: 14, debut: 15 }, { juz: 15, debut: 17 },
  { juz: 16, debut: 18 }, { juz: 17, debut: 21 }, { juz: 18, debut: 23 },
  { juz: 19, debut: 25 }, { juz: 20, debut: 27 }, { juz: 21, debut: 29 },
  { juz: 22, debut: 33 }, { juz: 23, debut: 36 }, { juz: 24, debut: 39 },
  { juz: 25, debut: 41 }, { juz: 26, debut: 46 }, { juz: 27, debut: 51 },
  { juz: 28, debut: 58 }, { juz: 29, debut: 67 }, { juz: 30, debut: 78 },
]

function getJuz(index: number): number {
  let juz = 1
  for (const j of JUZS) {
    if (index >= j.debut) juz = j.juz
    else break
  }
  return juz
}

function SourateCard({ sourate, riwaya }: { sourate: Sourate, riwaya: 'hafs' | 'warsh' }) {
  const scale = useRef(new Animated.Value(1)).current
  const router = useRouter()

  return (
    <Pressable
      onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
      onPress={() => router.push(`/coran/${sourate.index}?riwaya=${riwaya}` as any)}
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
        {/* Numéro */}
        <View style={{
          width: 40, height: 40, borderRadius: radius.md,
          backgroundColor: colors.fondCreme,
          borderWidth: 1, borderColor: colors.bordure,
          alignItems: 'center', justifyContent: 'center',
          marginRight: spacing.md, flexShrink: 0,
        }}>
          <Text style={{
            fontFamily: typography.fontFamily.bold,
            fontSize: typography.size.sm,
            color: colors.bleu,
          }}>
            {sourate.index}
          </Text>
        </View>

        {/* Nom latin + infos */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={{
            fontFamily: typography.fontFamily.semibold,
            fontSize: typography.size.base,
            color: colors.texte,
          }}>
            {sourate.nom}
          </Text>
          <Text style={{
            fontFamily: typography.fontFamily.regular,
            fontSize: typography.size.xs,
            color: colors.texteMuted,
            marginTop: 2,
          }}>
            {sourate.versets} versets · Juz {getJuz(sourate.index)}
          </Text>
        </View>

        {/* Nom arabe */}
        <Text style={{
          fontFamily: typography.fontFamily.arabic,
          fontSize: 18,
          color: colors.bleu,
          marginRight: spacing.sm,
        }}>
          {sourate.nomAr}
        </Text>

        <ChevronRight size={16} color="#ccc" />
      </Animated.View>
    </Pressable>
  )
}

export default function Coran() {
  const [riwaya, setRiwaya] = useState<'hafs' | 'warsh'>('hafs')
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

        {/* Choix riwaya */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: colors.blanc,
          borderRadius: radius.lg,
          borderWidth: 1, borderColor: colors.bordure,
          padding: 4, marginBottom: spacing.md,
        }}>
          {(['hafs', 'warsh'] as const).map(r => (
            <Pressable
              key={r}
              onPress={() => setRiwaya(r)}
              style={{
                flex: 1, paddingVertical: 9, borderRadius: radius.md,
                backgroundColor: riwaya === r ? colors.bleu : 'transparent',
                alignItems: 'center',
              }}
            >
              <Text style={{
                fontFamily: typography.fontFamily.semibold,
                fontSize: typography.size.base,
                color: riwaya === r ? colors.blanc : colors.texteMuted,
              }}>
                {r === 'hafs' ? 'Hafs' : 'Warsh'}
              </Text>
            </Pressable>
          ))}
        </View>

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
        renderItem={({ item }) => <SourateCard sourate={item} riwaya={riwaya} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: spacing.sm, paddingBottom: 120 }}
      />

    </SafeAreaView>
  )
}
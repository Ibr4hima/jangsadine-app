import { QURAN_ICON_URI } from '@/constants/quranIcon'
import { colors, radius, spacing, typography } from '@/constants/theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LinearGradient } from 'expo-linear-gradient'
import { useFocusEffect, useRouter } from 'expo-router'
import { Search } from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated, FlatList, Image, Pressable, StatusBar,
  Text, TextInput, View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Rect } from 'react-native-svg'

const sourates = require('../../assets/quran/sourates.json')

type Sourate = {
  index: number
  nom: string
  nomAr: string
  versets: number
  page: number
}

// ─── palette héros (identique à l'accueil) ────────────────────
const BG_TOP = '#3d6ba3'
const BG_MID = '#2d578c'
const BG_BOT = '#234a7a'
const W55 = 'rgba(255,255,255,0.55)'

// ─── badge octogramme ۞ (deux carrés superposés à 45°) ───────
// Clin d'œil au rub-el-hizb du Mushaf : discret, fin, élégant.
function BadgeNumero({ n }: { n: number }) {
  return (
    <View style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={48} height={48} viewBox="0 0 48 48" style={{ position: 'absolute' }}>
        <Rect
          x={9.5} y={9.5} width={29} height={29} rx={8}
          fill="rgba(45,87,140,0.05)" stroke="rgba(45,87,140,0.30)" strokeWidth={1.1}
        />
        <Rect
          x={9.5} y={9.5} width={29} height={29} rx={8}
          fill="rgba(45,87,140,0.03)" stroke="rgba(45,87,140,0.30)" strokeWidth={1.1}
          transform="rotate(45 24 24)"
        />
      </Svg>
      <Text style={{
        fontFamily: typography.fontFamily.bold,
        fontSize: typography.size.sm,
        color: colors.bleu,
      }}>
        {n}
      </Text>
    </View>
  )
}

// ─── carte sourate ────────────────────────────────────────────
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
        borderRadius: 22,
        paddingVertical: 12,
        paddingRight: spacing.lg,
        paddingLeft: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: spacing.xl,
        marginBottom: 10,
        shadowColor: '#2a3b52',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 14,
        elevation: 3,
      }}>
        <BadgeNumero n={sourate.index} />

        {/* Nom latin + méta */}
        <View style={{ flex: 1, minWidth: 0, marginLeft: spacing.xs, gap: 2 }}>
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
          }}>
            {sourate.versets} versets · page {sourate.page}
          </Text>
        </View>

        {/* Nom SuraNames calligraphique */}
        <Text style={{
          fontFamily: 'SuraNames',
          fontSize: 26,
          color: BG_MID,
          marginLeft: spacing.sm,
          writingDirection: 'ltr',
        }}>
          {String(sourate.index).padStart(3, '0') + 'surah'}
        </Text>
      </Animated.View>
    </Pressable>
  )
}

export default function Coran() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [recherche, setRecherche] = useState('')
  const [filtrees, setFiltrees] = useState<Sourate[]>(sourates)
  const [reprise, setReprise] = useState<Sourate | null>(null)

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

  // Recharge la dernière sourate lue à chaque retour sur la page
  useFocusEffect(useCallback(() => {
    AsyncStorage.getItem('jsd_derniere_sourate')
      .then(raw => {
        const idx = raw ? parseInt(raw) : NaN
        const s = sourates.find((x: Sourate) => x.index === idx)
        setReprise(s ?? null)
      })
      .catch(() => { })
  }, []))

  return (
    <View style={{ flex: 1, backgroundColor: colors.fondCreme }}>
      <StatusBar barStyle="light-content" />

      {/* ─── héros bleu (fixe) ─────────────────────────────── */}
      <View style={{ borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden' }}>
        <LinearGradient
          colors={[BG_TOP, BG_MID, BG_BOT]}
          locations={[0, 0.55, 1]}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        {/* brume décorative */}
        <View style={{ position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(140,180,230,0.13)', top: -140, right: -100 }} />
        <View style={{ position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(214,173,58,0.08)', bottom: -110, left: -70 }} />

        <View style={{
          paddingTop: insets.top + spacing.sm,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.xl + 26,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <View style={{ flex: 1, minWidth: 0 }}>
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
              color: '#fff',
            }}>
              Coran
            </Text>
            <Text style={{
              fontFamily: typography.fontFamily.regular,
              fontSize: typography.size.sm,
              color: W55, marginTop: 3,
            }}>
              114 sourates · riwaya Hafs
            </Text>

            {/* puce « Reprendre » — dernière sourate lue */}
            {reprise && (
              <Pressable
                onPress={() => router.push(`/coran/${reprise.index}?riwaya=hafs` as any)}
                style={({ pressed }) => ({
                  alignSelf: 'flex-start',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: colors.or,
                  borderRadius: radius.full,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  marginTop: spacing.md,
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                })}
              >
                <Text style={{
                  fontFamily: typography.fontFamily.semibold,
                  fontSize: typography.size.xs,
                  color: '#1c3d66',
                }}>
                  Reprendre · {reprise.nom}  ›
                </Text>
              </Pressable>
            )}
          </View>

          {/* calligraphie القرآن الكريم (blanche, inline base64) */}
          <Image
            source={{ uri: QURAN_ICON_URI }}
            style={{ width: 92, height: 92, marginLeft: spacing.md, opacity: 0.95 }}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* ─── recherche flottante (fixe, chevauche le héros) ── */}
      <View style={{ marginTop: -26, paddingHorizontal: spacing.xl, zIndex: 2 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: colors.blanc, borderRadius: radius.full,
          paddingHorizontal: spacing.lg, gap: spacing.sm,
          shadowColor: '#1c3d66',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.14,
          shadowRadius: 22,
          elevation: 8,
        }}>
          <Search size={17} color={colors.bleu} />
          <TextInput
            value={recherche}
            onChangeText={setRecherche}
            placeholder="Rechercher une sourate..."
            placeholderTextColor="#9aa3ad"
            style={{
              flex: 1, fontFamily: typography.fontFamily.regular,
              fontSize: typography.size.base, color: colors.texte,
              paddingVertical: 15,
            }}
          />
        </View>
      </View>

      {/* ─── liste ───────────────────────────────────────────── */}
      <FlatList
        data={filtrees}
        keyExtractor={item => String(item.index)}
        renderItem={({ item }) => <SourateCard sourate={item} />}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingTop: spacing.lg, paddingBottom: 130 }}
        ListEmptyComponent={
          <Text style={{
            textAlign: 'center', marginTop: spacing['2xl'],
            fontFamily: typography.fontFamily.regular,
            fontSize: typography.size.base, color: colors.texteMuted,
          }}>
            Aucune sourate trouvée
          </Text>
        }
      />
    </View>
  )
}

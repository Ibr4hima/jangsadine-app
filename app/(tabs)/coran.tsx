import { QURAN_ICON_URI } from '@/constants/quranIcon'
import { colors, radius, spacing, typography } from '@/constants/theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LinearGradient } from 'expo-linear-gradient'
import { useFocusEffect, useRouter } from 'expo-router'
import { Search } from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated, FlatList, Pressable, ScrollView, StatusBar,
  Text, TextInput, View
} from 'react-native'
import RAnimated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Rect } from 'react-native-svg'

const sourates = require('../../assets/quran/sourates.json')
const divisions: { juz: Record<string, number> } = require('../../assets/quran/divisions.json')

// Débuts des 30 juz : « sora:aya » → n°, triés. Chaque chip ouvre le lecteur
// pile au premier verset du juz (param `verset`).
const JUZS = Object.entries(divisions.juz)
  .map(([cle, n]) => {
    const [sora, aya] = cle.split(':').map(Number)
    return { n, sora, aya }
  })
  .sort((a, b) => a.n - b.n)

// Recherche tolérante : accents, apostrophes, tirets et espaces ignorés
// (« maidah » trouve Al-Ma'idah).
function normaliser(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/['’\-\s]/g, '')
}

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
const W12 = 'rgba(255,255,255,0.12)'

// ─── riwayas ──────────────────────────────────────────────────
// Hafs disponible ; Warsh et Qaloon arrivent — le sélecteur prépare la
// navigation entre les trois.
const RIWAYAS = [
  { id: 'hafs', nom: 'Hafs', dispo: true },
  { id: 'warsh', nom: 'Warsh', dispo: false },
  { id: 'qaloon', nom: 'Qaloon', dispo: false },
] as const

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
function SourateCard({ sourate, riwaya }: { sourate: Sourate; riwaya: string }) {
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
            {sourate.versets} versets · Page {sourate.page}
          </Text>
        </View>

        {/* Nom calligraphique seul (sans le mot سورة) */}
        <Text style={{
          fontFamily: 'SuraNames',
          fontSize: 27,
          color: BG_MID,
          marginLeft: spacing.sm,
          writingDirection: 'ltr',
        }}>
          {String(sourate.index).padStart(3, '0')}
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
  const [reprise, setReprise] = useState<{ sourate: Sourate; cle: string | null } | null>(null)
  const [riwaya, setRiwaya] = useState<string>('hafs')

  // Riwaya choisie, persistée
  useEffect(() => {
    AsyncStorage.getItem('jsd_riwaya')
      .then(r => { if (r && RIWAYAS.some(x => x.id === r && x.dispo)) setRiwaya(r) })
      .catch(() => { })
  }, [])
  const choisirRiwaya = (id: string) => {
    setRiwaya(id)
    AsyncStorage.setItem('jsd_riwaya', id).catch(() => { })
  }

  useEffect(() => {
    if (!recherche.trim()) {
      setFiltrees(sourates)
    } else {
      const q = normaliser(recherche)
      setFiltrees(sourates.filter((s: Sourate) =>
        normaliser(s.nom).includes(q) ||
        s.nomAr.includes(recherche.trim()) ||
        String(s.index).includes(recherche.trim())
      ))
    }
  }, [recherche])

  // Recharge la position exacte de lecture à chaque retour sur la page
  useFocusEffect(useCallback(() => {
    AsyncStorage.getItem('jsd_reprise_coran')
      .then(raw => {
        if (!raw) return setReprise(null)
        const r = JSON.parse(raw) as { sourate: number; cle?: string }
        const s = sourates.find((x: Sourate) => x.index === r.sourate)
        setReprise(s ? { sourate: s, cle: r.cle ?? null } : null)
      })
      .catch(() => setReprise(null))
  }, []))

  const ouvrirReprise = () => {
    if (!reprise) return
    const suffixe = reprise.cle ? `&cle=${reprise.cle}` : ''
    router.push(`/coran/${reprise.sourate.index}?riwaya=${riwaya}${suffixe}` as any)
  }

  // ── Héros compactable ──
  // Au défilement de la liste, l'eyebrow disparaît, les extras (riwaya +
  // reprendre) se replient et la calligraphie rétrécit : le héros devient
  // une barre compacte. Tout est piloté par la position de scroll.
  const scrollY = useSharedValue(0)
  const extrasH = useSharedValue(0)

  const eyebrowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 50], [1, 0], Extrapolation.CLAMP),
    height: interpolate(scrollY.value, [0, 90], [18, 0], Extrapolation.CLAMP),
    overflow: 'hidden',
  }))
  const extrasStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 60], [1, 0], Extrapolation.CLAMP),
    height: extrasH.value
      ? interpolate(scrollY.value, [0, 110], [extrasH.value, 0], Extrapolation.CLAMP)
      : undefined,
    overflow: 'hidden',
  }))
  const calliStyle = useAnimatedStyle(() => {
    const s = interpolate(scrollY.value, [0, 110], [92, 40], Extrapolation.CLAMP)
    return { width: s, height: s }
  })
  const heroPadStyle = useAnimatedStyle(() => ({
    paddingBottom: interpolate(scrollY.value, [0, 110], [spacing.xl + 26, 12 + 26], Extrapolation.CLAMP),
  }))

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

        <RAnimated.View style={[{
          paddingTop: insets.top + spacing.sm,
          paddingHorizontal: spacing.xl,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }, heroPadStyle]}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <RAnimated.View style={eyebrowStyle}>
              <Text style={{
                fontFamily: typography.fontFamily.bold,
                fontSize: typography.size.xs,
                letterSpacing: 2, color: colors.or,
                textTransform: 'uppercase',
              }}>
                Lecture
              </Text>
            </RAnimated.View>
            <Text style={{
              fontFamily: typography.fontFamily.bold,
              fontSize: typography.size['2xl'],
              color: '#fff',
            }}>
              Coran
            </Text>

            {/* extras repliables au scroll : riwaya + reprendre */}
            <RAnimated.View style={extrasStyle}>
              <View onLayout={e => { extrasH.value = e.nativeEvent.layout.height }}>
                {/* sélecteur de riwaya */}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.sm }}>
                  {RIWAYAS.map(r => {
                    const active = r.id === riwaya
                    return (
                      <Pressable
                        key={r.id}
                        disabled={!r.dispo}
                        onPress={() => choisirRiwaya(r.id)}
                        style={({ pressed }) => ({
                          flexDirection: 'row', alignItems: 'baseline', gap: 4,
                          backgroundColor: active ? '#fff' : W12,
                          borderRadius: radius.full,
                          paddingHorizontal: 13,
                          paddingVertical: 5,
                          opacity: r.dispo ? 1 : 0.45,
                          transform: [{ scale: pressed ? 0.94 : 1 }],
                        })}
                      >
                        <Text style={{
                          fontFamily: typography.fontFamily.semibold,
                          fontSize: typography.size.xs,
                          color: active ? BG_BOT : '#fff',
                        }}>
                          {r.nom}
                        </Text>
                        {!r.dispo && (
                          <Text style={{
                            fontFamily: typography.fontFamily.regular,
                            fontSize: 9,
                            color: W55,
                          }}>
                            bientôt
                          </Text>
                        )}
                      </Pressable>
                    )
                  })}
                </View>

                {/* puce « Reprendre » — rouvre pile où on s'était arrêté */}
                {reprise && (
                  <Pressable
                    onPress={ouvrirReprise}
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
                      Reprendre · {reprise.sourate.nom}  ›
                    </Text>
                  </Pressable>
                )}
              </View>
            </RAnimated.View>
          </View>

          {/* calligraphie القرآن الكريم — rétrécit au scroll */}
          <RAnimated.Image
            source={{ uri: QURAN_ICON_URI }}
            style={[{ marginLeft: spacing.md, opacity: 0.95 }, calliStyle]}
            resizeMode="contain"
          />
        </RAnimated.View>
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
          {recherche.length > 0 && (
            <Pressable onPress={() => setRecherche('')} hitSlop={10} style={{
              width: 20, height: 20, borderRadius: 10,
              backgroundColor: 'rgba(45,87,140,0.10)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 11, color: colors.bleu, fontFamily: typography.fontFamily.bold, lineHeight: 13 }}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* ─── saut rapide par juz ─────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, marginTop: spacing.md }}
        contentContainerStyle={{ paddingHorizontal: spacing.xl }}
      >
        {JUZS.map(j => (
          <Pressable
            key={j.n}
            onPress={() => router.push(`/coran/${j.sora}?riwaya=${riwaya}&verset=${j.aya}` as any)}
            style={({ pressed }) => ({
              backgroundColor: colors.blanc,
              borderRadius: radius.full,
              height: 32,
              paddingHorizontal: 14,
              marginRight: 8,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.bordure,
              transform: [{ scale: pressed ? 0.93 : 1 }],
            })}
          >
            <Text
              numberOfLines={1}
              style={{
                fontFamily: typography.fontFamily.semibold,
                fontSize: typography.size.xs,
                color: colors.bleu,
                flexShrink: 0,
              }}
            >
              {`Juz ${j.n}`}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* ─── liste ───────────────────────────────────────────── */}
      <FlatList
        data={filtrees}
        keyExtractor={item => String(item.index)}
        renderItem={({ item }) => <SourateCard sourate={item} riwaya={riwaya} />}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={e => { scrollY.value = e.nativeEvent.contentOffset.y }}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: 130 }}
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

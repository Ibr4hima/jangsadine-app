import FondAurore from '@/components/FondAurore'
import { colors, radius, spacing, typography } from '@/constants/theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LinearGradient } from 'expo-linear-gradient'
import { useFocusEffect, useRouter } from 'expo-router'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { QURAN_ICON_URI } from '@/constants/quranIcon'
import {
  Animated, FlatList, Image, Pressable, ScrollView, StatusBar,
  Text, View
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path, Rect } from 'react-native-svg'
import * as Haptics from 'expo-haptics'
import { useTabBar } from '@/contexts/TabBarContext'

// Listes de sourates et divisions par riwaya (versets, pages et débuts de
// juz diffèrent entre Hafs et Warsh)
const souratesParRiwaya: Record<string, any[]> = {
  hafs: require('../../assets/quran/sourates.json'),
  warsh: require('../../assets/quran/warsh_sourates.json'),
  qaloon: require('../../assets/quran/qaloon_sourates.json'),
  doori: require('../../assets/quran/doori_sourates.json'),
  shuba: require('../../assets/quran/shuba_sourates.json'),
  soosi: require('../../assets/quran/soosi_sourates.json'),
  bazzi: require('../../assets/quran/bazzi_sourates.json'),
  qumbul: require('../../assets/quran/qumbul_sourates.json'),
}
const divisionsParRiwaya: Record<string, { juz: Record<string, number> }> = {
  hafs: require('../../assets/quran/divisions.json'),
  warsh: require('../../assets/quran/warsh_divisions.json'),
  qaloon: require('../../assets/quran/qaloon_divisions.json'),
  doori: require('../../assets/quran/doori_divisions.json'),
  shuba: require('../../assets/quran/shuba_divisions.json'),
  soosi: require('../../assets/quran/soosi_divisions.json'),
  bazzi: require('../../assets/quran/bazzi_divisions.json'),
  qumbul: require('../../assets/quran/qumbul_divisions.json'),
}

// Débuts des 30 juz : « sora:aya » → n°, triés. Chaque chip ouvre le lecteur
// pile au premier verset du juz (param `verset`).
function construireJuzs(divisions: { juz: Record<string, number> }) {
  return Object.entries(divisions.juz)
    .map(([cle, n]) => {
      const [sora, aya] = cle.split(':').map(Number)
      return { n, sora, aya }
    })
    .sort((a, b) => a.n - b.n)
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
const RIWAYAS = [
  { id: 'hafs', nom: 'Hafs', dispo: true },
  { id: 'warsh', nom: 'Warsh', dispo: true },
  { id: 'qaloon', nom: 'Qaloon', dispo: true },
  // Prêtes dans l'app (données + polices embarquées), à réactiver quand on
  // voudra les proposer :
  // { id: 'doori', nom: 'Doori', dispo: true },
  // { id: 'shuba', nom: "Shu'bah", dispo: true },
  // { id: 'soosi', nom: 'Soosi', dispo: true },
  // { id: 'bazzi', nom: 'Bazzi', dispo: true },
  // { id: 'qumbul', nom: 'Qumbul', dispo: true },
] as const

// ─── bouton retour accueil (verre dépoli, dans le héros) ─────
// La barre d'onglets est masquée sur cette page : ce bouton est le seul
// chemin de retour — pastille de verre, halo pressé, ressort et haptique.
function BoutonAccueil({ onPress }: { onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current
  return (
    <Pressable
      onPressIn={() => Animated.spring(scale, { toValue: 0.88, useNativeDriver: true }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, friction: 4, tension: 160, useNativeDriver: true }).start()}
      onPress={() => { Haptics.selectionAsync(); onPress() }}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      {({ pressed }) => (
        <Animated.View style={{
          transform: [{ scale }],
          width: 46, height: 46, borderRadius: 23,
          backgroundColor: pressed ? 'rgba(255,255,255,0.24)' : W12,
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Svg width={22} height={22} viewBox="0 -960 960 960">
            <Path
              d="M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z"
              fill="#fff"
            />
          </Svg>
        </Animated.View>
      )}
    </Pressable>
  )
}

// ─── badge octogramme ۞ (deux carrés superposés à 45°) ───────
// Clin d'œil au rub-el-hizb du Mushaf : discret, fin, élégant.
function BadgeNumero({ n }: { n: number }) {
  return (
    <View style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={48} height={48} viewBox="0 0 48 48" style={{ position: 'absolute' }}>
        <Rect
          x={9.5} y={9.5} width={29} height={29} rx={8}
          fill="rgba(39,76,122,0.05)" stroke="rgba(39,76,122,0.30)" strokeWidth={1.1}
        />
        <Rect
          x={9.5} y={9.5} width={29} height={29} rx={8}
          fill="rgba(39,76,122,0.03)" stroke="rgba(39,76,122,0.30)" strokeWidth={1.1}
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
// Mémoïsée : les états de la page (reprise, focus…) ne re-rendent plus
// les 114 cartes — seules les props (sourate, riwaya) comptent.
const SourateCard = memo(function SourateCard({ sourate, riwaya }: { sourate: Sourate; riwaya: string }) {
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
        paddingVertical: 14,
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
          fontSize: 28,
          color: BG_MID,
          marginLeft: spacing.sm,
          writingDirection: 'ltr',
        }}>
          {String(sourate.index).padStart(3, '0')}
        </Text>
      </Animated.View>
    </Pressable>
  )
})

export default function Coran() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  // Coupe les animations du fond aurore quand l'onglet n'est pas visible.
  // La barre d'onglets disparaît ici (immersion : le retour se fait par le
  // bouton accueil du héros).
  const [focus, setFocus] = useState(true)
  const { hideTabBar, showTabBar } = useTabBar()
  useFocusEffect(useCallback(() => {
    setFocus(true)
    hideTabBar()
    return () => { showTabBar(); setFocus(false) }
  }, []))
  const [reprise, setReprise] = useState<{ sourate: Sourate; cle: string | null; riwaya: string } | null>(null)
  const [riwaya, setRiwaya] = useState<string>('hafs')

  const sourates = souratesParRiwaya[riwaya] ?? souratesParRiwaya.hafs
  const juzs = construireJuzs(divisionsParRiwaya[riwaya] ?? divisionsParRiwaya.hafs)

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

  // Recharge la position exacte de lecture à chaque retour sur la page
  useFocusEffect(useCallback(() => {
    AsyncStorage.getItem('jsd_reprise_coran')
      .then(raw => {
        if (!raw) return setReprise(null)
        const r = JSON.parse(raw) as { sourate: number; cle?: string; riwaya?: string }
        const riw = r.riwaya === 'warsh' || r.riwaya === 'qaloon' || r.riwaya === 'doori' || r.riwaya === 'shuba' || r.riwaya === 'soosi' || r.riwaya === 'bazzi' || r.riwaya === 'qumbul' ? r.riwaya : 'hafs'
        const s = (souratesParRiwaya[riw]).find((x: Sourate) => x.index === r.sourate)
        setReprise(s ? { sourate: s, cle: r.cle ?? null, riwaya: riw } : null)
      })
      .catch(() => setReprise(null))
  }, []))

  const ouvrirReprise = () => {
    if (!reprise) return
    const suffixe = reprise.cle ? `&cle=${reprise.cle}` : ''
    // rouvre dans la riwaya où la lecture avait eu lieu (clé de bloc liée)
    router.push(`/coran/${reprise.sourate.index}?riwaya=${reprise.riwaya}${suffixe}` as any)
  }

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
        {/* fond « aurore » : nappes bleues en dérive lente */}
        <FondAurore compact actif={focus} />

        <View style={{
          paddingTop: insets.top + spacing.sm,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.lg,
        }}>
          {/* calligraphie القرآن الكريم — posée en absolu sur le flanc
              droit, du haut du titre jusqu'à la rangée des riwayas */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: insets.top + spacing.sm - 2,
              right: spacing.xl,
            }}
          >
            <Image
              source={{ uri: QURAN_ICON_URI }}
              style={{ width: 96, height: 96, opacity: 0.95 }}
              resizeMode="contain"
            />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* retour à l'accueil — seul chemin, la barre d'onglets est masquée */}
            <View style={{ marginRight: spacing.md }}>
              <BoutonAccueil onPress={() => router.navigate('/' as any)} />
            </View>
            <View style={{ flex: 1 }}>
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
            </View>

            {/* l'espace droit est occupé par la calligraphie posée en
                absolu (voir plus bas) */}
          </View>

          {/* sélecteur de riwaya — rangée défilante bord à bord */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, marginTop: spacing.md, marginHorizontal: -spacing.xl }}
            contentContainerStyle={{ paddingHorizontal: spacing.xl, alignItems: 'center' }}
          >
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
                    paddingVertical: 6,
                    marginRight: 8,
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
          </ScrollView>

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
      </View>

      {/* ─── saut rapide par juz ─────────────────────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, height: 44, marginTop: spacing.md, marginBottom: spacing.sm }}
        contentContainerStyle={{ paddingHorizontal: spacing.xl, alignItems: 'center' }}
      >
        {juzs.map(j => (
          <Pressable
            key={j.n}
            onPress={() => router.push(`/coran/${j.sora}?riwaya=${riwaya}&verset=${j.aya}` as any)}
            style={({ pressed }) => ({
              backgroundColor: colors.blanc,
              borderRadius: radius.full,
              height: 34,
              paddingHorizontal: 15,
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
                fontSize: typography.size.sm,
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
        data={sourates as Sourate[]}
        keyExtractor={item => String(item.index)}
        renderItem={({ item }) => <SourateCard sourate={item} riwaya={riwaya} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: 130 }}
      />
    </View>
  )
}

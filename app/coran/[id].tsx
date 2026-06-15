import { colors, typography } from '@/constants/theme'
import { getSourate } from '@/lib/quran'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FlatList, Pressable, StatusBar, Text, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const sourates = require('../../assets/quran/sourates.json')

// Bornes de la taille de lecture (px). Le pinch fait varier en continu entre les deux.
const TAILLE_MIN = 20
const TAILLE_MAX = 64
const TAILLE_DEFAUT = 30
// On regroupe les versets en blocs d'environ ce nombre de caractères : le texte
// reste un flux justifié continu DANS un bloc, et la FlatList ne rend que les
// blocs visibles → fluide même sur al-Baqarah (286 versets).
const BLOC_CARACTERES = 480

const CLE_TAILLE = 'jsd_coran_taille'
const CLE_NUIT = 'jsd_coran_nuit'

type Verset = { numero: number; texte: string }
type Bloc = { cle: string; versets: Verset[] }

function clamp(v: number, min: number, max: number) {
    'worklet'
    return Math.min(max, Math.max(min, v))
}

// Chiffres arabes (٠١٢…) pour les marqueurs de fin de verset, comme dans le Mushaf
function chiffresArabes(n: number) {
    return String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
}

// Découpe les versets en blocs ~homogènes (par longueur) pour la virtualisation
function construireBlocs(versets: Verset[]): Bloc[] {
    const blocs: Bloc[] = []
    let courant: Verset[] = []
    let taille = 0
    for (const v of versets) {
        courant.push(v)
        taille += v.texte.length
        if (taille >= BLOC_CARACTERES) {
            blocs.push({ cle: `b${blocs.length}`, versets: courant })
            courant = []
            taille = 0
        }
    }
    if (courant.length) blocs.push({ cle: `b${blocs.length}`, versets: courant })
    return blocs
}

export default function LectureSourate() {
    const { id, riwaya } = useLocalSearchParams<{ id: string; riwaya: string }>()
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const index = parseInt(id)

    const [blocs, setBlocs] = useState<Bloc[]>([])
    const [basmala, setBasmala] = useState<string | null>(null)
    const [nomSourate, setNomSourate] = useState('')
    const [nomAr, setNomAr] = useState('')
    const [nombreVersets, setNombreVersets] = useState(0)
    const [loading, setLoading] = useState(true)

    const [taille, setTaille] = useState(TAILLE_DEFAUT)
    const [nuit, setNuit] = useState(true)
    const [chromeVisible, setChromeVisible] = useState(true)

    // Valeurs partagées pour le geste (lues/écrites sur le thread UI)
    const tailleSV = useSharedValue(TAILLE_DEFAUT)
    const tailleDebutSV = useSharedValue(TAILLE_DEFAUT)
    const dernierePousseeRef = useRef(TAILLE_DEFAUT)
    useEffect(() => { tailleSV.value = taille }, [taille])

    // ── Thème (immersif : juste le fond + le texte) ──
    const t = nuit
        ? { bg: '#13140F', texte: '#ECE7D8', muted: 'rgba(236,231,216,0.45)', or: '#d8b84a', barre: 'light-content' as const }
        : { bg: '#F6F3EC', texte: '#23201A', muted: 'rgba(35,32,26,0.45)', or: colors.orFonce, barre: 'dark-content' as const }

    // ── Chargement des données ──
    useEffect(() => {
        try {
            const data = getSourate(index)
            if (!data) { setLoading(false); return }
            setNomSourate(data.name)
            const info = sourates.find((s: any) => s.index === index)
            if (info) { setNomAr(info.nomAr); setNombreVersets(info.versets) }

            const versets: Verset[] = []
            let basm: string | null = null
            for (const [cle, texte] of Object.entries(data.verse)) {
                const num = parseInt(cle.replace('verse_', ''))
                // verse_0 = basmala séparée (sourates ≠ 1 et ≠ 9) → affichée en en-tête,
                // pas dans le flux numéroté.
                if (num === 0) { basm = texte as string; continue }
                versets.push({ numero: num, texte: texte as string })
            }
            setBasmala(basm)
            setBlocs(construireBlocs(versets))
        } catch (e) {
            console.warn('lecture sourate:', e)
        }
        setLoading(false)
    }, [index])

    // ── Préférences persistées ──
    useEffect(() => {
        AsyncStorage.multiGet([CLE_TAILLE, CLE_NUIT]).then(entries => {
            for (const [cle, val] of entries) {
                if (val == null) continue
                if (cle === CLE_TAILLE) {
                    const n = parseFloat(val)
                    if (!isNaN(n)) { setTaille(n); tailleSV.value = n }
                } else if (cle === CLE_NUIT) {
                    setNuit(val === '1')
                }
            }
        }).catch(() => {})
    }, [])

    // ── Pinch : reflow en direct (la mise en page s'adapte pendant le geste) ──
    const appliquerTaille = useCallback((n: number) => {
        if (n === dernierePousseeRef.current) return
        dernierePousseeRef.current = n
        setTaille(n)
    }, [])

    const persisterTaille = useCallback((n: number) => {
        AsyncStorage.setItem(CLE_TAILLE, String(n)).catch(() => {})
    }, [])

    const pinch = Gesture.Pinch()
        .onStart(() => { tailleDebutSV.value = tailleSV.value })
        .onUpdate(e => {
            // Arrondi à l'entier → ~quelques dizaines de paliers sur toute la plage :
            // reflow fluide sans spammer des rendus identiques.
            const n = Math.round(clamp(tailleDebutSV.value * e.scale, TAILLE_MIN, TAILLE_MAX))
            runOnJS(appliquerTaille)(n)
        })
        .onEnd(() => {
            runOnJS(persisterTaille)(Math.round(tailleSV.value))
        })

    // Tap simple (1 doigt, sans déplacement) → bascule le chrome. N'interfère ni
    // avec le scroll (qui a du mouvement) ni avec le pinch (2 doigts).
    const basculerChrome = useCallback(() => setChromeVisible(v => !v), [])
    const tap = Gesture.Tap().onEnd(() => { runOnJS(basculerChrome)() })
    const gestes = Gesture.Simultaneous(pinch, tap)

    // ── Animation du chrome (header) ──
    const chromeSV = useSharedValue(1)
    useEffect(() => { chromeSV.value = withTiming(chromeVisible ? 1 : 0, { duration: 220 }) }, [chromeVisible])
    const headerStyle = useAnimatedStyle(() => ({
        opacity: chromeSV.value,
        transform: [{ translateY: (1 - chromeSV.value) * -18 }],
    }))

    const souratePrecedente = index > 1 ? index - 1 : null
    const sourateSuivante = index < 114 ? index + 1 : null

    const lineHeight = taille * 2.0

    const renderBloc = useCallback(({ item }: { item: Bloc }) => (
        <Text
            style={{
                fontFamily: typography.fontFamily.coran,
                fontSize: taille,
                lineHeight,
                color: t.texte,
                textAlign: 'justify',
                writingDirection: 'rtl',
            }}
        >
            {item.versets.map(v => (
                <Text key={v.numero}>
                    {v.texte}{' '}
                    <Text style={{ fontSize: taille * 0.62, color: t.or }}>
                        {'﴿'}{chiffresArabes(v.numero)}{'﴾'}
                    </Text>
                    {'  '}
                </Text>
            ))}
        </Text>
    ), [taille, lineHeight, t.texte, t.or])

    // ── En-tête de liste : nom de sourate + basmala ──
    const entete = (
        <View style={{ paddingTop: insets.top + 64, paddingBottom: 28, alignItems: 'center' }}>
            <Text style={{ fontFamily: typography.fontFamily.coran, fontSize: 34, color: t.or, lineHeight: 52 }}>
                {nomAr}
            </Text>
            <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.xs, color: t.muted, marginTop: 4 }}>
                {nomSourate} · {nombreVersets} versets · {riwaya === 'warsh' ? 'Warsh' : 'Hafs'}
            </Text>
            {basmala && (
                <Text style={{
                    fontFamily: typography.fontFamily.coran,
                    fontSize: Math.min(taille, 30),
                    lineHeight: Math.min(taille, 30) * 1.9,
                    color: t.texte,
                    marginTop: 26,
                    textAlign: 'center',
                    writingDirection: 'rtl',
                }}>
                    {basmala}
                </Text>
            )}
            {/* fine séparation dorée */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 24, width: 120 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: t.or, opacity: 0.4 }} />
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: t.or, marginHorizontal: 6 }} />
                <View style={{ flex: 1, height: 1, backgroundColor: t.or, opacity: 0.4 }} />
            </View>
        </View>
    )

    // ── Pied de liste : navigation sourate précédente / suivante ──
    const pied = (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 36, marginBottom: insets.bottom + 48 }}>
            {souratePrecedente ? (
                <Pressable
                    onPress={() => router.replace(`/coran/${souratePrecedente}?riwaya=${riwaya}` as any)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                    <ChevronLeft size={18} color={t.or} />
                    <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.sm, color: t.muted }}>
                        {sourates[souratePrecedente - 1]?.nom}
                    </Text>
                </Pressable>
            ) : <View />}
            {sourateSuivante ? (
                <Pressable
                    onPress={() => router.replace(`/coran/${sourateSuivante}?riwaya=${riwaya}` as any)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                >
                    <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.sm, color: t.muted }}>
                        {sourates[sourateSuivante - 1]?.nom}
                    </Text>
                    <ChevronRight size={18} color={t.or} />
                </Pressable>
            ) : <View />}
        </View>
    )

    return (
        <View style={{ flex: 1, backgroundColor: t.bg }}>
            <StatusBar barStyle={t.barre} />

            {/* Texte : flux justifié continu, virtualisé, pinch + tap */}
            {!loading && (
                <GestureDetector gesture={gestes}>
                    <FlatList
                        data={blocs}
                        keyExtractor={b => b.cle}
                        renderItem={renderBloc}
                        ListHeaderComponent={entete}
                        ListFooterComponent={pied}
                        extraData={taille}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 22 }}
                        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
                        initialNumToRender={6}
                        maxToRenderPerBatch={6}
                        windowSize={9}
                    />
                </GestureDetector>
            )}

            {/* Chrome flottant (se masque au tap) */}
            <Animated.View
                pointerEvents={chromeVisible ? 'auto' : 'none'}
                style={[{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    paddingTop: insets.top + 6, paddingBottom: 10, paddingHorizontal: 12,
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: t.bg,
                }, headerStyle]}
            >
                <Pressable onPress={() => router.back()} hitSlop={10} style={{ padding: 6 }}>
                    <ArrowLeft size={22} color={t.texte} />
                </Pressable>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text numberOfLines={1} style={{ fontFamily: typography.fontFamily.coran, fontSize: 20, color: t.or, lineHeight: 30 }}>
                        {nomAr}
                    </Text>
                </View>
                <Pressable onPress={() => { const v = !nuit; setNuit(v); AsyncStorage.setItem(CLE_NUIT, v ? '1' : '0').catch(() => {}) }} hitSlop={10} style={{ padding: 6 }}>
                    {nuit ? <Sun size={20} color={t.or} /> : <Moon size={20} color={t.muted} />}
                </Pressable>
            </Animated.View>
        </View>
    )
}

import Bismillah from '@/components/Bismillah'
import { typography } from '@/constants/theme'
import { useTabBar } from '@/contexts/TabBarContext'
import { getSourate } from '@/lib/quran'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Dimensions, FlatList, Pressable, StatusBar, Text, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// Couleurs fixes — pas de mode nuit/jour
const BG = '#F2F0EF'
const TEXTE = '#23201A'
const OR = '#b8932a'

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

type Verset = { numero: number; texte: string }
type Bloc = { cle: string; versets: Verset[] }

// Lecture « au fil » : la liste contient, à la suite, l'en-tête (basmala) de
// chaque sourate puis ses blocs de versets. On enchaîne les sourates au scroll.
type Item =
    | { type: 'entete'; cle: string; sourate: number; basmala: string | null; nbVersets: number; premier: boolean }
    | { type: 'bloc'; cle: string; sourate: number; versets: Verset[] }

function clamp(v: number, min: number, max: number) {
    'worklet'
    return Math.min(max, Math.max(min, v))
}

// Basmala : SVG vectoriel officiel de quran.com (calligraphie naskh « بسم الله
// الرحمن الرحيم »). Vectoriel → net à toute taille. La largeur suit le zoom mais
// est plafonnée pour occuper ~92% de la largeur d'écran.
const LARGEUR_ECRAN = Dimensions.get('window').width
const BISMILLAH_LARGEUR_MAX = (LARGEUR_ECRAN - 44) * 0.68

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

// Bloc de texte continu (un flux de versets). Le marqueur de fin de verset
// (chiffre arabe, même couleur que le texte) est dimensionné à 110% de la taille.
function BlocTexte({ item, taille, lineHeight }: { item: Bloc; taille: number; lineHeight: number }) {
    return (
        <Text
            style={{
                fontFamily: typography.fontFamily.coran,
                fontSize: taille,
                lineHeight,
                color: TEXTE,
                textAlign: 'center',
                writingDirection: 'rtl',
            }}
        >
            {item.versets.map(v => (
                <Text key={v.numero}>
                    {v.texte}{' '}
                    <Text style={{ fontFamily: typography.fontFamily.coran, fontSize: taille * 1.1, color: TEXTE }}>
                        {chiffresArabes(v.numero)}
                    </Text>
                    {'  '}
                </Text>
            ))}
        </Text>
    )
}

export default function LectureSourate() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const index = parseInt(id)

    const [items, setItems] = useState<Item[]>([])
    const [sourateActive, setSourateActive] = useState(index)
    const [loading, setLoading] = useState(true)

    const [taille, setTaille] = useState(TAILLE_DEFAUT)
    const [chromeVisible, setChromeVisible] = useState(true)

    // Sourates déjà chargées (dans l'ordre) + cache des items construits par sourate
    const chargeesRef = useRef<number[]>([])
    const itemsCacheRef = useRef<Record<number, Item[]>>({})

    // Masque la barre d'onglets du bas pendant la lecture (immersif), la restaure en sortant
    const { hideTabBar, showTabBar } = useTabBar()
    useFocusEffect(useCallback(() => {
        hideTabBar()
        return () => showTabBar()
    }, []))

    // Valeurs partagées pour le geste (lues/écrites sur le thread UI)
    const tailleSV = useSharedValue(TAILLE_DEFAUT)
    const tailleDebutSV = useSharedValue(TAILLE_DEFAUT)
    const dernierePousseeRef = useRef(TAILLE_DEFAUT)
    useEffect(() => { tailleSV.value = taille }, [taille])

    // Construit (et met en cache) les items d'une sourate : en-tête (basmala) + blocs
    const construireSourate = useCallback((idx: number): Item[] => {
        if (itemsCacheRef.current[idx]) return itemsCacheRef.current[idx]
        const data = getSourate(idx)
        if (!data) return []
        const info = sourates.find((s: any) => s.index === idx)
        const versets: Verset[] = []
        let basm: string | null = null
        for (const [cle, texte] of Object.entries(data.verse)) {
            const num = parseInt(cle.replace('verse_', ''))
            // verse_0 = basmala séparée → affichée en en-tête, hors flux numéroté.
            if (num === 0) { basm = texte as string; continue }
            // al-Fatiha : la basmala EST le verset 1 → en en-tête, versets 2→7 restent.
            if (idx === 1 && num === 1) { basm = texte as string; continue }
            versets.push({ numero: num, texte: texte as string })
        }
        const out: Item[] = [
            { type: 'entete', cle: `s${idx}_e`, sourate: idx, basmala: basm, nbVersets: info?.versets ?? versets.length, premier: idx === index },
            ...construireBlocs(versets).map((b, i) => ({ type: 'bloc' as const, cle: `s${idx}_b${i}`, sourate: idx, versets: b.versets })),
        ]
        itemsCacheRef.current[idx] = out
        return out
    }, [index])

    const recomposer = useCallback((indices: number[]) => {
        setItems(indices.flatMap(idx => construireSourate(idx)))
    }, [construireSourate])

    // ── Chargement initial : on démarre sur la sourate demandée ──
    useEffect(() => {
        itemsCacheRef.current = {}
        chargeesRef.current = [index]
        setSourateActive(index)
        recomposer([index])
        setLoading(false)
    }, [index, recomposer])

    // ── Au fil : à l'approche de la fin, on enchaîne la sourate suivante ──
    const chargerSuivante = useCallback(() => {
        const ch = chargeesRef.current
        const dernier = ch[ch.length - 1]
        if (dernier >= 114) return
        chargeesRef.current = [...ch, dernier + 1]
        recomposer(chargeesRef.current)
    }, [recomposer])

    // ── En-tête flottant : suit la sourate dont le contenu occupe le haut.
    // Bascule quand la basmala de la suivante atteint ~le 1er quart de l'écran. ──
    const onViewable = useRef(({ viewableItems }: { viewableItems: Array<{ index: number | null; item: Item }> }) => {
        if (!viewableItems.length) return
        let haut = viewableItems[0]
        for (const v of viewableItems) {
            if (v.index != null && (haut.index == null || v.index < haut.index)) haut = v
        }
        if (haut.item?.sourate) setSourateActive(haut.item.sourate)
    }).current
    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 0 }).current

    // ── Préférences persistées ──
    useEffect(() => {
        AsyncStorage.getItem(CLE_TAILLE).then(val => {
            if (val == null) return
            const n = parseFloat(val)
            if (!isNaN(n)) { setTaille(n); tailleSV.value = n }
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

    const lineHeight = taille * 2.0

    const renderItem = useCallback(({ item }: { item: Item }) => {
        if (item.type === 'entete') {
            const id3 = String(item.sourate).padStart(3, '0')
            return (
                <View style={{
                    paddingTop: item.premier ? insets.top + 64 : taille * 2,
                    paddingBottom: Math.round(taille * 0.5),
                    alignItems: 'center',
                }}>
                    {/* Étiquette "Sourate N" style hero */}
                    <Text style={{
                        fontFamily: typography.fontFamily.bold,
                        fontSize: 11,
                        letterSpacing: 2,
                        color: OR,
                        textTransform: 'uppercase',
                        marginBottom: taille * 0.25,
                    }}>
                        Sourate {item.sourate}
                    </Text>
                    {/* Nom calligraphié (police SuraNames — ligature par identifiant) */}
                    <Text style={{
                        fontFamily: 'SuraNames',
                        fontSize: taille * 2.3,
                        lineHeight: taille * 2.3 * 1.35,
                        color: OR,
                        writingDirection: 'rtl',
                    }}>
                        {`surah${id3}`}
                    </Text>
                    {/* Basmala SVG (quran.com) */}
                    {item.basmala && (
                        <View style={{ marginTop: taille * 0.9 }}>
                            <Bismillah width={Math.min(taille * 8.1, BISMILLAH_LARGEUR_MAX)} color={TEXTE} />
                        </View>
                    )}
                </View>
            )
        }
        return <BlocTexte item={item} taille={taille} lineHeight={lineHeight} />
    }, [taille, lineHeight, insets.top])

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <StatusBar barStyle="dark-content" />

            {/* Lecture « au fil » : toutes les sourates s'enchaînent, virtualisé */}
            {!loading && (
                <GestureDetector gesture={gestes}>
                    <FlatList
                        data={items}
                        keyExtractor={it => it.cle}
                        renderItem={renderItem}
                        ListFooterComponent={<View style={{ height: insets.bottom + 80 }} />}
                        extraData={taille}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 22 }}
                        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
                        onEndReached={chargerSuivante}
                        onEndReachedThreshold={1.5}
                        onViewableItemsChanged={onViewable}
                        viewabilityConfig={viewabilityConfig}
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
                    backgroundColor: BG,
                }, headerStyle]}
            >
                <Pressable onPress={() => router.back()} hitSlop={10} style={{ padding: 6 }}>
                    <ArrowLeft size={22} color={TEXTE} />
                </Pressable>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text numberOfLines={1} style={{ fontFamily: 'SuraNames', fontSize: 22, color: OR, lineHeight: 33 }}>
                        {`surah${String(sourateActive).padStart(3, '0')}`}
                    </Text>
                </View>
                {/* espace vide pour garder le titre centré */}
                <View style={{ width: 34 }} />
            </Animated.View>
        </View>
    )
}

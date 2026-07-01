import Bismillah from '@/components/Bismillah'
import { typography } from '@/constants/theme'
import { useTabBar } from '@/contexts/TabBarContext'
import { getSourate } from '@/lib/quran'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { Dimensions, FlatList, Pressable, StatusBar, Text, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// Couleurs fixes — pas de mode nuit/jour
const BG = '#F2F0EF'
const TEXTE = '#353839'
const OR = '#b8932a'

// Police SuraNames (quran.com) : deux ligatures distinctes — les 3 chiffres
// « 026 » → le nom calligraphié de la sourate, et « surah » → le mot « سورة ».
// En flux LTR, on place d'abord le nom puis « surah » : le mot سورة se retrouve
// à droite du nom → lecture RTL « سورة + nom », l'ordre correct.
function nomSourate(idx: number) {
    return `${String(idx).padStart(3, '0')}surah`
}
// Dégradé bleu du héros (cohérent avec les autres pages : Plus, Qibla…)
const HERO_TOP = '#3d6ba3'
const HERO_MID = '#2d578c'
const HERO_BOT = '#234a7a'

const sourates = require('../../assets/quran/sourates.json')
// Délimitations des pages du Mushaf Madani (KFGQPC v18) : « sora:aya » → numéro
// de la page qui se TERMINE à cet ayah. Sert à insérer un bandeau de numéro de
// page au fil de la lecture, comme dans un vrai Mushaf.
const pageEnds: Record<string, number> = require('../../assets/quran/pages.json')
// Délimitations Juz (30) et Hizb (les 30 mi-juz). « sora:aya » → numéro. Le début
// d'un juz est aussi le début d'un hizb impair : on n'affiche donc en plus que les
// hizb pairs (milieu de juz) pour éviter les doublons.
const divisions: { juz: Record<string, number>; hizb: Record<string, number> } =
    require('../../assets/quran/divisions.json')

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
    | { type: 'page'; cle: string; sourate: number; page: number }

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

// Étiquette inline d'un début de Juz / Hizb (sans voyelles). Renvoie le libellé
// arabe ou null.
function libelleDivision(sourate: number, numero: number): string | null {
    const cle = `${sourate}:${numero}`
    const j = divisions.juz[cle]
    if (j) return `الجزء ${j}`
    const h = divisions.hizb[cle]
    if (h) return `الحزب ${h}`
    return null
}

// Bloc de texte continu (un flux de versets). Le marqueur de fin de verset
// (chiffre arabe, même couleur que le texte) est dimensionné à 110% de la taille.
// Au début d'un Juz/Hizb, on remplace l'ornement ۞ du texte par un badge bleu
// en ligne (même police, même taille que le Coran).
function BlocTexte({ item, sourate, taille, lineHeight }: { item: Bloc; sourate: number; taille: number; lineHeight: number }) {
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
            {item.versets.map(v => {
                const badge = libelleDivision(sourate, v.numero)
                // ۞ (U+06DE) en tête de verset = marque rub-el-hizb : on l'enlève
                // uniquement aux débuts de Juz/Hizb (remplacée par le badge).
                const texte = badge && v.texte.charCodeAt(0) === 0x06DE ? v.texte.slice(1) : v.texte
                return (
                    <Text key={v.numero}>
                        {badge && (
                            <Text>
                                {' '}
                                <View style={{ flexDirection: 'row', alignItems: 'flex-end', transform: [{ translateY: taille * 0.18 }] }}>
                                    {/* Ast\u00e9risque ancr\u00e9 en bas de la ligne */}
                                    <Text style={{ fontFamily: 'MaterialSymbols', fontSize: taille * 0.88, color: '#000000', lineHeight: taille * 0.95 }}>{'\ue3ac'}</Text>
                                    {/* Libell\u00e9 exposant : en haut + d\u00e9cal\u00e9 \u00e0 droite */}
                                    <Text style={{ fontFamily: typography.fontFamily.coran, fontSize: taille * 0.44, color: '#80838A', alignSelf: 'flex-start', paddingLeft: taille * 0.14, lineHeight: taille * 0.5, writingDirection: 'rtl' } as any}>{badge}</Text>
                                </View>
                                {'  '}
                            </Text>
                        )}
                        {texte}{' '}
                        <Text style={{ fontFamily: typography.fontFamily.coran, fontSize: taille * 1.1, color: TEXTE }}>
                            {chiffresArabes(v.numero)}
                        </Text>
                        {'  '}
                    </Text>
                )
            })}
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

    // Mémorise la dernière sourate lue → puce « Reprendre » sur la liste Coran
    useEffect(() => {
        AsyncStorage.setItem('jsd_derniere_sourate', String(sourateActive)).catch(() => { })
    }, [sourateActive])

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
        ]
        // On découpe en blocs (pour la virtualisation) ET on coupe à chaque fin de
        // page pour intercaler un bandeau « numéro de page », comme dans un Mushaf
        // imprimé — y compris quand la page se termine à la fin d'une sourate
        // (ex. la page 1 juste après al-Fatiha).
        let courant: Verset[] = []
        let nbCar = 0
        let blocIdx = 0
        const fermerBloc = () => {
            if (courant.length) {
                out.push({ type: 'bloc', cle: `s${idx}_b${blocIdx++}`, sourate: idx, versets: courant })
                courant = []
                nbCar = 0
            }
        }
        for (let i = 0; i < versets.length; i++) {
            const v = versets[i]
            courant.push(v)
            nbCar += v.texte.length
            // Fin de page : le bandeau s'affiche APRÈS le dernier verset de la page.
            // (Juz/Hizb sont gérés en ligne dans BlocTexte, au début du verset.)
            const page = pageEnds[`${idx}:${v.numero}`]
            if (page) {
                fermerBloc()
                out.push({ type: 'page', cle: `s${idx}_p${v.numero}`, sourate: idx, page })
            } else if (nbCar >= BLOC_CARACTERES) {
                fermerBloc()
            }
        }
        fermerBloc()
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
            return (
                <View style={{
                    paddingTop: item.premier ? insets.top + 64 : taille * 1.2,
                    paddingBottom: Math.round(taille * 0.5),
                    alignItems: 'center',
                }}>
                    {/* Nom calligraphié (police SuraNames — ligature par identifiant). */}
                    <Text style={{
                        fontFamily: 'SuraNames',
                        fontSize: taille * 1.6,
                        lineHeight: taille * 1.6 * 1.35,
                        color: '#000000',
                        writingDirection: 'ltr',
                    }}>
                        {nomSourate(item.sourate)}
                    </Text>
                    {/* Basmala SVG (quran.com). Pour la Fatiha (Hafs) la basmala EST le
                        verset 1 : on l'affiche sur une seule ligne centrée avec son
                        marqueur ١ à gauche (fin du verset en lecture RTL). */}
                    {item.basmala && (
                        <View style={{
                            marginTop: taille * 0.6,
                            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                            gap: taille * 0.4,
                        }}>
                            {item.sourate === 1 && (
                                <Text style={{
                                    fontFamily: typography.fontFamily.coran,
                                    fontSize: taille * 1.1,
                                    color: TEXTE,
                                    lineHeight: taille * 1.5,
                                    transform: [{ translateY: taille * 0.28 }],
                                }}>
                                    {chiffresArabes(1)}
                                </Text>
                            )}
                            <Bismillah width={Math.min(taille * 8.1, BISMILLAH_LARGEUR_MAX)} color={TEXTE} />
                        </View>
                    )}
                </View>
            )
        }
        if (item.type === 'page') {
            // Bandeau de fin de page : numéro centré dans un cartouche, encadré de
            // deux filets dorés, comme dans un Mushaf imprimé.
            return (
                <View style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    gap: 12, paddingVertical: Math.round(taille * 0.7),
                }}>
                    <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(184,147,42,0.35)' }} />
                    <View style={{
                        borderWidth: 1, borderColor: 'rgba(184,147,42,0.55)', borderRadius: 999,
                        paddingHorizontal: 14, paddingVertical: 3,
                        backgroundColor: 'rgba(184,147,42,0.06)',
                    }}>
                        <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: 13, color: OR, letterSpacing: 1 }}>
                            {item.page}
                        </Text>
                    </View>
                    <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(184,147,42,0.35)' }} />
                </View>
            )
        }
        return <BlocTexte item={item} sourate={item.sourate} taille={taille} lineHeight={lineHeight} />
    }, [taille, lineHeight, insets.top])

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <StatusBar barStyle={chromeVisible ? 'light-content' : 'dark-content'} />

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
                        style={{ backgroundColor: BG }}
                        contentContainerStyle={{ paddingHorizontal: 22, backgroundColor: BG }}
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

            {/* Chrome flottant — héros bleu en dégradé, comme les autres pages */}
            <Animated.View
                pointerEvents={chromeVisible ? 'auto' : 'none'}
                style={[{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
                    overflow: 'hidden',
                }, headerStyle]}
            >
                <LinearGradient
                    colors={[HERO_TOP, HERO_MID, HERO_BOT]}
                    locations={[0, 0.6, 1]}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
                {/* halos décoratifs du héros */}
                <View style={{ position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(140,180,230,0.12)', top: -180, right: -100 }} />
                <View style={{ position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(214,173,58,0.06)', bottom: -120, left: -70 }} />

                <View style={{
                    paddingTop: insets.top + 6, paddingBottom: 14, paddingHorizontal: 12,
                    flexDirection: 'row', alignItems: 'center',
                }}>
                    <Pressable onPress={() => router.back()} hitSlop={10} style={{ padding: 6 }}>
                        <ArrowLeft size={22} color="#fff" />
                    </Pressable>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        {/* Chip doré (nom FR) */}
                        <View style={{
                            backgroundColor: 'rgba(214,173,58,0.16)', borderRadius: 999,
                            paddingHorizontal: 12, paddingVertical: 4, marginBottom: 3,
                        }}>
                            <Text numberOfLines={1} style={{
                                fontFamily: typography.fontFamily.bold, fontSize: 10,
                                letterSpacing: 1.8, color: OR, textTransform: 'uppercase',
                            }}>
                                {sourates[sourateActive - 1]?.nom}
                            </Text>
                        </View>
                        {/* Nom calligraphié (blanc, sur le héros bleu) */}
                        <Text numberOfLines={1} style={{ fontFamily: 'SuraNames', fontSize: 22, color: '#fff', lineHeight: 32, writingDirection: 'ltr' }}>
                            {nomSourate(sourateActive)}
                        </Text>
                    </View>
                    {/* espace vide pour garder le titre centré */}
                    <View style={{ width: 34 }} />
                </View>
            </Animated.View>
        </View>
    )
}

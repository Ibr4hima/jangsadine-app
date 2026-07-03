import FondAurore from '@/components/FondAurore'
import Bismillah from '@/components/Bismillah'
import { typography } from '@/constants/theme'
import { useTabBar } from '@/contexts/TabBarContext'
import { getSourate } from '@/lib/quran'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { ActivityIndicator, Dimensions, FlatList, Pressable, StatusBar, Text, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Line, Path } from 'react-native-svg'

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

// Taille de lecture fixe : confortable et régulière, comme un Mushaf
// imprimé (le zoom est volontairement désactivé pour préserver la mise
// en page).
const TAILLE_LECTURE = 32


type Verset = { numero: number; texte: string }
type Bloc = { cle: string; versets: Verset[] }

// Lecture « au fil » : la liste contient, à la suite, l'en-tête (basmala) de
// chaque sourate puis ses blocs de versets. On enchaîne les sourates au scroll.
type Item =
    | { type: 'entete'; cle: string; sourate: number; basmala: string | null; nbVersets: number; premier: boolean }
    | { type: 'bloc'; cle: string; sourate: number; versets: Verset[] }
    | { type: 'page'; cle: string; sourate: number; page: number }

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
                // Justifié : chaque ligne remplit la largeur comme dans un
                // Mushaf imprimé (fini les petits mots seuls centrés en fin
                // de bloc — la dernière ligne s'aligne à droite, naturel).
                textAlign: 'justify',
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

// ─── Bordure de mushaf ────────────────────────────────────────
// Cadre d'enluminure des côtés gauche/droit, comme un Mushaf imprimé :
// une chaîne de marquises (ovales pointus, motif classique du tazhib)
// ponctuée de petits losanges, entre deux rails dorés continus. Les
// extrémités se fondent dans la page (dégradé couleur du fond).
const HAUTEUR_ECRAN = Dimensions.get('window').height

function BordureMushaf({ cote }: { cote: 'gauche' | 'droite' }) {
    const H = HAUTEUR_ECRAN
    const cx = 8
    const PAS = 64          // distance verticale entre deux marquises
    const DEMI = 12         // demi-hauteur d'une marquise
    const VENTRE = 4.6      // largeur du ventre de la marquise

    const motifs: React.ReactElement[] = []
    for (let y = 54; y < H - 54; y += PAS) {
        // marquise : ovale pointu, contour fin + cœur très léger
        motifs.push(
            <Path
                key={`m${y}`}
                d={`M ${cx} ${y - DEMI} Q ${cx + VENTRE} ${y} ${cx} ${y + DEMI} Q ${cx - VENTRE} ${y} ${cx} ${y - DEMI} Z`}
                stroke={OR} strokeWidth={0.9} strokeOpacity={0.6}
                fill={OR} fillOpacity={0.10}
            />
        )
        // petit losange plein entre deux marquises
        const yd = y + PAS / 2
        if (yd < H - 54) {
            motifs.push(
                <Path
                    key={`d${y}`}
                    d={`M ${cx} ${yd - 2.8} L ${cx + 2.8} ${yd} L ${cx} ${yd + 2.8} L ${cx - 2.8} ${yd} Z`}
                    fill={OR} fillOpacity={0.55}
                />
            )
        }
    }

    return (
        <View
            pointerEvents="none"
            style={{
                position: 'absolute', top: 0, bottom: 0,
                ...(cote === 'gauche' ? { left: 2 } : { right: 2 }),
                width: 16,
            }}
        >
            <Svg width={16} height={H}>
                {/* rails continus de part et d'autre de la chaîne */}
                <Line x1={2.2} y1={0} x2={2.2} y2={H} stroke={OR} strokeWidth={1.1} strokeOpacity={0.40} />
                <Line x1={13.8} y1={0} x2={13.8} y2={H} stroke={OR} strokeWidth={1.1} strokeOpacity={0.40} />
                {motifs}
            </Svg>
            {/* fondu des extrémités dans la couleur de page */}
            <LinearGradient
                colors={[BG, 'rgba(242,240,239,0)']}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120 }}
            />
            <LinearGradient
                colors={['rgba(242,240,239,0)', BG]}
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120 }}
            />
        </View>
    )
}

export default function LectureSourate() {
    // `cle` (optionnel) : clé du bloc où reprendre la lecture exactement.
    // `verset` (optionnel) : numéro de verset où s'ouvrir (ex. début d'un juz).
    const { id, cle, verset } = useLocalSearchParams<{ id: string; cle?: string; verset?: string }>()
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const index = parseInt(id)

    const [items, setItems] = useState<Item[]>([])
    const [sourateActive, setSourateActive] = useState(index)
    const [loading, setLoading] = useState(true)

    // ── Reprise exacte ──
    // Le bloc visible en haut d'écran est mémorisé ({sourate, cle}) : la liste
    // Coran rouvre alors le lecteur pile à cet endroit via le param `cle`.
    // Les clés de blocs sont déterministes (indépendantes de la taille de police).
    const listeRef = useRef<FlatList<Item>>(null)
    const repriseRef = useRef<{ sourate: number; cle: string } | null>(null)
    const derniereSauvegardeRef = useRef(0)
    const cibleRef = useRef<string | null>(cle ? String(cle) : null)

    // Sauvegarde finale en quittant le lecteur (la sauvegarde throttlée au fil
    // du scroll couvre le cas d'une fermeture brutale de l'app).
    useEffect(() => () => {
        if (repriseRef.current) {
            AsyncStorage.setItem('jsd_reprise_coran', JSON.stringify(repriseRef.current)).catch(() => { })
        }
    }, [])

    // ── Voile d'ouverture ──
    // La virtualisation remplit l'écran par lots : sans voile, le bas de page
    // reste vide ~1 s. On couvre le temps que le contenu dépasse l'écran (ou
    // 1,5 s max), puis fondu → la page apparaît entière, d'un coup.
    const [voile, setVoile] = useState(true)
    const voileOp = useSharedValue(1)
    const reveleRef = useRef(false)
    const revele = useCallback(() => {
        if (reveleRef.current) return
        reveleRef.current = true
        voileOp.value = withTiming(0, { duration: 200 }, fini => {
            if (fini) runOnJS(setVoile)(false)
        })
    }, [])
    useEffect(() => {
        const t = setTimeout(revele, 1500)
        return () => clearTimeout(t)
    }, [revele])
    const voileStyle = useAnimatedStyle(() => ({ opacity: voileOp.value }))

    const taille = TAILLE_LECTURE
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
        // Un bloc = le contenu d'UNE page du Mushaf : on ne coupe qu'aux fins
        // de pages (bandeau « numéro de page » intercalé). Chaque page est donc
        // un seul paragraphe justifié — toutes les lignes remplissent la
        // largeur, seule la dernière ligne de la page peut être courte, comme
        // dans un Mushaf imprimé. La virtualisation opère par page.
        let courant: Verset[] = []
        let blocIdx = 0
        const fermerBloc = () => {
            if (courant.length) {
                out.push({ type: 'bloc', cle: `s${idx}_b${blocIdx++}`, sourate: idx, versets: courant })
                courant = []
            }
        }
        for (let i = 0; i < versets.length; i++) {
            const v = versets[i]
            courant.push(v)
            // Fin de page : le bandeau s'affiche APRÈS le dernier verset de la page.
            // (Juz/Hizb sont gérés en ligne dans BlocTexte, au début du verset.)
            const page = pageEnds[`${idx}:${v.numero}`]
            if (page) {
                fermerBloc()
                out.push({ type: 'page', cle: `s${idx}_p${v.numero}`, sourate: idx, page })
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

    // ── Restauration de la position (param `cle` ou `verset`) une fois les items posés ──
    const versetCibleRef = useRef<number | null>(verset ? parseInt(String(verset)) : null)
    useEffect(() => {
        if (!items.length) return
        let idx = -1
        if (cibleRef.current) {
            idx = items.findIndex(it => it.cle === cibleRef.current)
            cibleRef.current = null
        } else if (versetCibleRef.current != null) {
            const num = versetCibleRef.current
            idx = items.findIndex(it =>
                it.type === 'bloc' && it.sourate === index && it.versets.some(v => v.numero === num))
            versetCibleRef.current = null
        }
        if (idx <= 0) return
        requestAnimationFrame(() => {
            listeRef.current?.scrollToIndex({ index: idx, animated: false })
        })
    }, [items, index])

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
        // Position exacte de lecture (throttlée à ~1,5 s pour ménager le stockage)
        if (haut.item?.cle) {
            repriseRef.current = { sourate: haut.item.sourate, cle: haut.item.cle }
            const maintenant = Date.now()
            if (maintenant - derniereSauvegardeRef.current > 1500) {
                derniereSauvegardeRef.current = maintenant
                AsyncStorage.setItem('jsd_reprise_coran', JSON.stringify(repriseRef.current)).catch(() => { })
            }
        }
    }).current
    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 0 }).current

    // Tap simple (1 doigt, sans déplacement) → bascule le chrome.
    // N'interfère pas avec le scroll (qui a du mouvement).
    const basculerChrome = useCallback(() => setChromeVisible(v => !v), [])
    const gestes = Gesture.Tap().onEnd(() => { runOnJS(basculerChrome)() })

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
            {/* Immersion totale : quand le chrome est masqué (tap), la barre
                d'état système (heure, batterie…) disparaît aussi — page pleine,
                uniquement le Coran. */}
            <StatusBar
                barStyle={chromeVisible ? 'light-content' : 'dark-content'}
                hidden={!chromeVisible}
                animated
                showHideTransition="fade"
            />

            {/* Lecture « au fil » : toutes les sourates s'enchaînent, virtualisé */}
            {!loading && (
                <GestureDetector gesture={gestes}>
                    <FlatList
                        ref={listeRef}
                        data={items}
                        keyExtractor={it => it.cle}
                        renderItem={renderItem}
                        ListFooterComponent={<View style={{ height: insets.bottom + 80 }} />}
                        // scrollToIndex sans getItemLayout : on approche à l'estime,
                        // puis on retente une fois la zone rendue.
                        onScrollToIndexFailed={info => {
                            listeRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: false })
                            setTimeout(() => {
                                listeRef.current?.scrollToIndex({ index: info.index, animated: false })
                            }, 150)
                        }}
                        // Lève le voile dès que le contenu rendu couvre l'écran
                        onContentSizeChange={(_l, h) => {
                            if (h >= Dimensions.get('window').height) revele()
                        }}
                        showsVerticalScrollIndicator={false}
                        style={{ backgroundColor: BG }}
                        contentContainerStyle={{ paddingHorizontal: 22, backgroundColor: BG }}
                        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
                        onEndReached={chargerSuivante}
                        onEndReachedThreshold={1.5}
                        onViewableItemsChanged={onViewable}
                        viewabilityConfig={viewabilityConfig}
                        // Les items sont désormais à l'échelle d'une page de Mushaf :
                        // peu d'items suffisent à couvrir l'écran, le voile d'ouverture
                        // masque le remplissage initial.
                        initialNumToRender={6}
                        maxToRenderPerBatch={4}
                        updateCellsBatchingPeriod={30}
                        windowSize={7}
                    />
                </GestureDetector>
            )}

            {/* Cadre doré du Mushaf, par-dessus le texte */}
            <BordureMushaf cote="gauche" />
            <BordureMushaf cote="droite" />

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
                {/* fond « aurore » : nappes bleues en dérive lente */}
                <FondAurore compact />

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

            {/* Voile d'ouverture : masque le remplissage progressif de la liste */}
            {voile && (
                <Animated.View
                    pointerEvents="none"
                    style={[{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: BG,
                        alignItems: 'center', justifyContent: 'center',
                    }, voileStyle]}
                >
                    <ActivityIndicator color={OR} />
                </Animated.View>
            )}
        </View>
    )
}

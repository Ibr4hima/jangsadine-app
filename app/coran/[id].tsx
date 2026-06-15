import { colors, radius, spacing, typography } from '@/constants/theme'
import { getSourate } from '@/lib/quran'
import { useTabBar } from '@/contexts/TabBarContext'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, ChevronLeft, ChevronRight, Moon, Sun, Type } from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import {
    Dimensions,
    Pressable,
    ScrollView,
    StatusBar, Text, View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width } = Dimensions.get('window')

type Verset = {
    numero: number
    texte: string
}

const BISMILLAH = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ'
const TAILLES = [24, 28, 32, 38]
const sourates = require('../../assets/quran/sourates.json')

function chiffresArabes(n: number) {
    return String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
}

export default function LectureSourate() {
    const { id, riwaya } = useLocalSearchParams<{ id: string, riwaya: string }>()
    const router = useRouter()
    const index = parseInt(id)

    const [versets, setVersets] = useState<Verset[]>([])
    const [nomSourate, setNomSourate] = useState('')
    const [nomAr, setNomAr] = useState('')
    const [nombreVersets, setNombreVersets] = useState(0)
    const [modeNuit, setModeNuit] = useState(true)
    const [tailleIdx, setTailleIdx] = useState(1)
    const [loading, setLoading] = useState(true)

    const taille = TAILLES[tailleIdx]

    // Hide bottom tab bar while reader is open
    const { hideTabBar, showTabBar } = useTabBar()
    useFocusEffect(useCallback(() => {
        hideTabBar()
        return () => showTabBar()
    }, []))

    // Thème
    const bg = modeNuit ? '#1a2a1a' : colors.fondCreme
    const bgCard = modeNuit ? '#1e301e' : colors.blanc
    const bgHeader = modeNuit ? '#162216' : colors.blanc
    const txtColor = modeNuit ? '#f0ede4' : colors.texte
    const txtMuted = modeNuit ? 'rgba(240,237,228,0.5)' : colors.texteMuted
    const borderCol = modeNuit ? 'rgba(212,175,55,0.25)' : colors.bordure
    const orColor = modeNuit ? '#d4af37' : colors.or
    const barreStyle = modeNuit ? 'light-content' as const : 'dark-content' as const

    useEffect(() => {
        try {
            const data = getSourate(index)
            if (!data) return
            setNomSourate(data.name)
            const info = sourates.find((s: any) => s.index === index)
            if (info) { setNomAr(info.nomAr); setNombreVersets(info.versets) }

            // verse_0 = Basmala header for surahs 2-114 (except 9)
            // verse_1 = Basmala for surah 1 (it IS the first numbered verse)
            // Either way, the Basmala box is rendered separately — filter it from the flow.
            const basmalaKey = index === 1 ? 'verse_1' : 'verse_0'
            const vs: Verset[] = Object.entries(data.verse)
                .filter(([key]) => index === 9 ? true : key !== basmalaKey)
                .map(([key, texte]) => ({
                    numero: parseInt(key.replace('verse_', '')),
                    texte: texte as string,
                }))
                .sort((a, b) => a.numero - b.numero)
            setVersets(vs)
        } catch (e) {
            console.error(e)
        }
        setLoading(false)
    }, [index])

    const souratePrecedente = index > 1 ? index - 1 : null
    const sourateSuivante = index < 114 ? index + 1 : null

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
            <StatusBar barStyle={barreStyle} />

            {/* ── Header ── */}
            <View style={{
                flexDirection: 'row', alignItems: 'center',
                paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
                backgroundColor: bgHeader,
                borderBottomWidth: 1, borderBottomColor: borderCol,
            }}>
                <Pressable onPress={() => router.back()} style={{ padding: 6, marginRight: spacing.sm }}>
                    <ArrowLeft size={22} color={txtColor} />
                </Pressable>

                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{
                        fontFamily: typography.fontFamily.coran,
                        fontSize: 22, color: orColor, lineHeight: 32,
                    }}>
                        {nomAr}
                    </Text>
                    <Text style={{
                        fontFamily: typography.fontFamily.medium,
                        fontSize: typography.size.xs, color: txtMuted, marginTop: 2,
                    }}>
                        {nomSourate} · {nombreVersets} versets · {riwaya === 'warsh' ? 'Warsh' : 'Hafs'}
                    </Text>
                </View>

                {/* Taille */}
                <Pressable
                    onPress={() => setTailleIdx(p => (p + 1) % TAILLES.length)}
                    style={{
                        width: 36, height: 36, borderRadius: radius.full,
                        backgroundColor: modeNuit ? 'rgba(255,255,255,0.08)' : colors.fondCreme,
                        alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm,
                    }}
                >
                    <Type size={15} color={txtMuted} />
                </Pressable>

                {/* Mode nuit */}
                <Pressable
                    onPress={() => setModeNuit(p => !p)}
                    style={{
                        width: 36, height: 36, borderRadius: radius.full,
                        backgroundColor: modeNuit ? 'rgba(255,255,255,0.08)' : colors.fondCreme,
                        alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    {modeNuit
                        ? <Sun size={15} color="#ffd700" />
                        : <Moon size={15} color={colors.texteMuted} />
                    }
                </Pressable>
            </View>

            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontFamily: typography.fontFamily.coran, fontSize: 24, color: orColor }}>
                        ...
                    </Text>
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 120 }}
                >
                    {/* Bismillah — shown for all surahs except At-Tawbah (9) */}
                    {index !== 9 && (
                        <View style={{
                            marginHorizontal: spacing.xl,
                            marginTop: spacing.xl,
                            marginBottom: spacing.lg,
                            paddingVertical: spacing.lg,
                            paddingHorizontal: spacing.xl,
                            backgroundColor: bgCard,
                            borderRadius: radius.xl,
                            borderWidth: 1,
                            borderColor: borderCol,
                            alignItems: 'center',
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, width: '100%' }}>
                                <View style={{ flex: 1, height: 1, backgroundColor: borderCol }} />
                                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: orColor, marginHorizontal: spacing.sm }} />
                                <View style={{ flex: 1, height: 1, backgroundColor: borderCol }} />
                            </View>

                            <Text style={{
                                fontFamily: typography.fontFamily.coran,
                                fontSize: index === 1 ? taille : taille - 2,
                                color: index === 1 ? orColor : txtColor,
                                textAlign: 'center',
                                lineHeight: (index === 1 ? taille : taille - 2) * 1.9,
                                writingDirection: 'rtl',
                            }}>
                                {BISMILLAH}
                            </Text>

                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, width: '100%' }}>
                                <View style={{ flex: 1, height: 1, backgroundColor: borderCol }} />
                                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: orColor, marginHorizontal: spacing.sm }} />
                                <View style={{ flex: 1, height: 1, backgroundColor: borderCol }} />
                            </View>
                        </View>
                    )}

                    {/* Versets — texte continu centré */}
                    <View style={{
                        marginHorizontal: spacing.xl,
                        backgroundColor: bgCard,
                        borderRadius: radius.xl,
                        borderWidth: 1,
                        borderColor: borderCol,
                        padding: spacing.xl,
                        marginBottom: spacing.xl,
                    }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl }}>
                            <View style={{ flex: 1, height: 1, backgroundColor: borderCol }} />
                            <Text style={{ fontFamily: typography.fontFamily.coran, fontSize: 16, color: orColor, marginHorizontal: spacing.md }}>
                                ﷽
                            </Text>
                            <View style={{ flex: 1, height: 1, backgroundColor: borderCol }} />
                        </View>

                        <Text style={{
                            fontFamily: typography.fontFamily.coran,
                            fontSize: taille,
                            color: txtColor,
                            textAlign: 'center',
                            lineHeight: taille * 2.2,
                            writingDirection: 'rtl',
                        }}>
                            {versets.map((v) => (
                                <Text key={v.numero}>
                                    {v.texte}
                                    {'  '}
                                    <Text style={{
                                        fontSize: taille * 0.65,
                                        color: orColor,
                                    }}>
                                        {'﴿'}{chiffresArabes(v.numero)}{'﴾'}
                                    </Text>
                                    {'  '}
                                </Text>
                            ))}
                        </Text>

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xl }}>
                            <View style={{ flex: 1, height: 1, backgroundColor: borderCol }} />
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: orColor, marginHorizontal: spacing.sm }} />
                            <View style={{ flex: 1, height: 1, backgroundColor: borderCol }} />
                        </View>
                    </View>

                    {/* Navigation sourate précédente / suivante */}
                    <View style={{
                        flexDirection: 'row',
                        marginHorizontal: spacing.xl,
                        marginBottom: spacing.xl,
                    }}>
                        {souratePrecedente ? (
                            <Pressable
                                onPress={() => router.replace(`/coran/${souratePrecedente}?riwaya=${riwaya}` as any)}
                                style={{
                                    flex: 1, flexDirection: 'row', alignItems: 'center',
                                    backgroundColor: bgCard, borderRadius: radius.lg,
                                    borderWidth: 1, borderColor: borderCol,
                                    padding: spacing.md, marginRight: sourateSuivante ? spacing.sm : 0,
                                }}
                            >
                                <ChevronLeft size={18} color={orColor} />
                                <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                                    <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.xs, color: txtMuted }}>
                                        Précédente
                                    </Text>
                                    <Text numberOfLines={1} style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.sm, color: txtColor }}>
                                        {sourates[souratePrecedente - 1]?.nom}
                                    </Text>
                                </View>
                            </Pressable>
                        ) : <View style={{ flex: 1 }} />}

                        {sourateSuivante ? (
                            <Pressable
                                onPress={() => router.replace(`/coran/${sourateSuivante}?riwaya=${riwaya}` as any)}
                                style={{
                                    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
                                    backgroundColor: bgCard, borderRadius: radius.lg,
                                    borderWidth: 1, borderColor: borderCol,
                                    padding: spacing.md, marginLeft: souratePrecedente ? spacing.sm : 0,
                                }}
                            >
                                <View style={{ marginRight: spacing.sm, flex: 1, alignItems: 'flex-end' }}>
                                    <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.xs, color: txtMuted }}>
                                        Suivante
                                    </Text>
                                    <Text numberOfLines={1} style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.sm, color: txtColor }}>
                                        {sourates[sourateSuivante - 1]?.nom}
                                    </Text>
                                </View>
                                <ChevronRight size={18} color={orColor} />
                            </Pressable>
                        ) : <View style={{ flex: 1 }} />}
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    )
}

import { EnTeteSection, PressableScale, Squelettes } from '@/components/AudioUI'
import { colors, radius, spacing, typography } from '@/constants/theme'
import { useAudio } from '@/contexts/AudioContext'
import { supabase } from '@/lib/supabase'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import React, { useEffect, useRef, useState } from 'react'
import { Pressable, ScrollView, StatusBar, Text, TextInput, View } from 'react-native'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'

// ─── icônes ───────────────────────────────────────────────────
function IcoBack({ size = 18, color = '#5b6675' }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="m313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z" fill={color} /></Svg>
}
function IcoSearch({ size = 18, color = colors.bleu }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" fill={color} /></Svg>
}
function IcoClose({ size = 14, color = '#8a94a3' }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" fill={color} /></Svg>
}
function IcoHeadphones({ size = 18, color = colors.bleu }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M360-120H200q-33 0-56.5-23.5T120-200v-280q0-75 28.5-140.5t77-114q48.5-48.5 114-77T480-840q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-480v280q0 33-23.5 56.5T760-120H600v-320h160v-40q0-117-81.5-198.5T480-760q-117 0-198.5 81.5T200-480v40h160v320Z" fill={color} /></Svg>
}
function IcoBook({ size = 18, color = colors.bleu }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M440-278v-394q-41-24-87-36t-93-12q-36 0-71.5 7T120-692v396q35-12 69.5-18t70.5-6q47 0 91.5 10.5T440-278Zm40 118q-48-38-104-59t-116-21q-42 0-82.5 11T100-198q-21 11-40.5-1T40-234v-482q0-11 5.5-21T62-752q46-24 96-36t102-12q74 0 126 17t112 52q11 6 16.5 14t5.5 21v418q44-21 88.5-31.5T700-320q36 0 70.5 6t69.5 18v-481q15 5 29.5 11t28.5 14q11 5 16.5 15t5.5 21v482q0 23-19.5 35t-40.5 1q-37-20-77.5-31T700-240q-60 0-116 21t-104 59Zm140-240v-440l120-40v440l-120 40Z" fill={color} /></Svg>
}
function IcoMic({ size = 18, color = colors.bleu }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M395-435q-35-35-35-85v-240q0-50 35-85t85-35q50 0 85 35t35 85v240q0 50-35 85t-85 35q-50 0-85-35Zm45 315v-123q-104-14-172-93t-68-184h80q0 83 58.5 141.5T480-320q83 0 141.5-58.5T680-520h80q0 105-68 184t-172 93v123h-80Z" fill={color} /></Svg>
}
function IcoQuestion({ size = 18, color = colors.bleu }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="m480-80-10-120h-10q-142 0-241-99t-99-241q0-142 99-241t241-99q71 0 132.5 26.5t108 73q46.5 46.5 73 108T800-540q0 75-24.5 144t-67 128q-42.5 59-101 107T480-80Zm8-253q12-12 12-29t-12-29q-12-12-29-12t-29 12q-12 12-12 29t12 29q12 12 29 12t29-12Zm-58-115h60q0-30 6-42t38-44q18-18 30-39t12-45q0-51-34.5-76.5T460-720q-44 0-74 24.5T344-636l56 22q5-17 19-33.5t41-16.5q27 0 40.5 15t13.5 33q0 17-10 30.5T480-558q-35 30-42.5 47.5T430-448Z" fill={color} /></Svg>
}
function IcoChevron({ size = 16, color = '#c2ccd6' }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" fill={color} /></Svg>
}
function IcoPlay({ size = 13, color = colors.bleu }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M320-200v-560l440 280-440 280Z" fill={color} /></Svg>
}

// ─── types ────────────────────────────────────────────────────
type Resultat = {
  id: string
  titre: string
  sheikh: string
  type: 'cours' | 'livre' | 'conference' | 'khoutbah' | 'fatwa'
  url_audio?: string
  duree?: string
}

const SECTIONS: { type: Resultat['type']; label: string; icone: React.ComponentType<{ size?: number; color?: string }> }[] = [
  { type: 'cours',      label: 'Cours audio', icone: IcoHeadphones },
  { type: 'livre',      label: 'Livres',      icone: IcoBook },
  { type: 'conference', label: 'Conférences', icone: IcoMic },
  { type: 'khoutbah',   label: 'Khoutbah',    icone: IcoMic },
  { type: 'fatwa',      label: 'Fatwas',      icone: IcoQuestion },
]

// ─── page ─────────────────────────────────────────────────────
export default function Recherche() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { jouer } = useAudio()

  const [q, setQ] = useState('')
  const [resultats, setResultats] = useState<Resultat[]>([])
  const [loading, setLoading] = useState(false)
  const [aCherche, setACherche] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requeteRef = useRef(0)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const terme = q.trim()
    if (terme.length < 2) {
      setResultats([]); setLoading(false); setACherche(false)
      return
    }
    setLoading(true)
    timerRef.current = setTimeout(() => chercher(terme), 300)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [q])

  const chercher = async (terme: string) => {
    const id = ++requeteRef.current
    // ilike : on neutralise les caractères spéciaux de la syntaxe .or()
    const motif = `%${terme.replace(/[%,()]/g, '')}%`
    const filtre = `titre.ilike.${motif},sheikh.ilike.${motif}`

    const [cours, livres, conferences, khoutbahs, fatwas] = await Promise.all([
      supabase.from('cours').select('id, titre, sheikh').or(filtre).limit(8),
      supabase.from('livres').select('id, titre, sheikh').or(filtre).limit(8),
      supabase.from('conferences').select('id, titre, sheikh, url_audio, duree').or(filtre).limit(8),
      supabase.from('khoutbahs').select('id, titre, sheikh, url_audio, duree').or(filtre).limit(8),
      supabase.from('fatwas').select('id, question, sheikh, url_audio, duree').or(`question.ilike.${motif},sheikh.ilike.${motif}`).limit(8),
    ])
    if (id !== requeteRef.current) return

    const tous: Resultat[] = [
      ...(cours.data ?? []).map((c: any) => ({ ...c, type: 'cours' as const })),
      ...(livres.data ?? []).map((l: any) => ({ ...l, type: 'livre' as const })),
      ...(conferences.data ?? []).map((c: any) => ({ ...c, type: 'conference' as const })),
      ...(khoutbahs.data ?? []).map((k: any) => ({ ...k, type: 'khoutbah' as const })),
      ...(fatwas.data ?? []).map((f: any) => ({ id: f.id, titre: f.question, sheikh: f.sheikh, url_audio: f.url_audio, duree: f.duree, type: 'fatwa' as const })),
    ]
    setResultats(tous)
    setLoading(false)
    setACherche(true)
  }

  const ouvrir = (r: Resultat) => {
    Haptics.selectionAsync()
    if (r.type === 'cours') { router.push(`/audio/${r.id}` as any); return }
    if (r.type === 'livre') { router.push(`/audio/livre/${r.id}` as any); return }
    if (r.url_audio) jouer({ id: r.id, titre: r.titre, sheikh: r.sheikh, url: r.url_audio, duree: r.duree })
  }

  const parType = (t: Resultat['type']) => resultats.filter(r => r.type === t)
  const sectionsAvecResultats = SECTIONS.filter(s => parType(s.type).length > 0)

  return (
    <View style={{ flex: 1, backgroundColor: colors.fondCreme, paddingTop: insets.top }}>
      <StatusBar barStyle="dark-content" />

      {/* ── Barre de recherche ── */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
        paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
      }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{
            width: 38, height: 38, borderRadius: 19,
            backgroundColor: '#e9ecf2',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <IcoBack size={18} />
        </Pressable>

        <View style={{
          flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
          backgroundColor: colors.blanc,
          borderRadius: radius.full,
          paddingHorizontal: spacing.lg, paddingVertical: 11,
          shadowColor: '#1c3d66', shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.08, shadowRadius: 14, elevation: 4,
        }}>
          <IcoSearch size={18} color={colors.bleu} />
          <TextInput
            autoFocus
            value={q}
            onChangeText={setQ}
            placeholder="Cours, conférence, sheikh…"
            placeholderTextColor="#9aa3ad"
            returnKeyType="search"
            style={{
              flex: 1,
              fontFamily: typography.fontFamily.regular,
              fontSize: typography.size.base,
              color: colors.texte,
              padding: 0,
            }}
          />
          {q.length > 0 ? (
            <Pressable
              onPress={() => { Haptics.selectionAsync(); setQ('') }}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              style={{
                width: 22, height: 22, borderRadius: 11,
                backgroundColor: '#edf0f4',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <IcoClose size={11} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* ── Résultats ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: spacing.xl, paddingTop: spacing.md, paddingBottom: 160 }}
      >
        {loading ? (
          <Squelettes n={6} h={64} />
        ) : q.trim().length < 2 ? (
          <Animated.View entering={FadeIn.duration(300)} style={{ alignItems: 'center', paddingTop: spacing['3xl'] }}>
            <View style={{
              width: 72, height: 72, borderRadius: 36,
              backgroundColor: '#e8f0f8',
              alignItems: 'center', justifyContent: 'center',
              marginBottom: spacing.lg,
            }}>
              <IcoSearch size={32} color={colors.bleu} />
            </View>
            <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.base, color: colors.texteMuted, textAlign: 'center', lineHeight: 22, maxWidth: 280 }}>
              Cherche un cours, un livre, une conférence, un khoutbah, une fatwa ou un sheikh
            </Text>
          </Animated.View>
        ) : aCherche && resultats.length === 0 ? (
          <Animated.View entering={FadeIn.duration(300)} style={{ alignItems: 'center', paddingTop: spacing['3xl'] }}>
            <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.lg, color: colors.texte, marginBottom: spacing.xs }}>
              Aucun résultat
            </Text>
            <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.base, color: colors.texteMuted, textAlign: 'center' }}>
              Essaie avec un autre mot-clé
            </Text>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(220)}>
            {sectionsAvecResultats.map((section, sIdx) => {
              const items = parType(section.type)
              const Icone = section.icone
              return (
                <View key={section.type} style={{ marginBottom: sIdx < sectionsAvecResultats.length - 1 ? spacing.xl : 0 }}>
                  <EnTeteSection eyebrow={section.label} />
                  <View style={{
                    backgroundColor: colors.blanc,
                    borderRadius: 18,
                    overflow: 'hidden',
                    shadowColor: '#3a4a5c', shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
                  }}>
                    {items.map((r, i) => (
                      <Animated.View key={`${r.type}-${r.id}`} entering={FadeInDown.duration(300).delay(Math.min(i, 6) * 40)}>
                        <PressableScale
                          onPress={() => ouvrir(r)}
                          style={{
                            flexDirection: 'row', alignItems: 'center', gap: spacing.md,
                            paddingHorizontal: spacing.md, paddingVertical: 12,
                            borderTopWidth: i > 0 ? 1 : 0,
                            borderTopColor: '#f5f6f9',
                          }}
                        >
                          <View style={{
                            width: 38, height: 38, borderRadius: 19,
                            backgroundColor: '#e8f0f8',
                            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <Icone size={18} color={colors.bleu} />
                          </View>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text numberOfLines={1} style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base, color: colors.texte }}>
                              {r.titre}
                            </Text>
                            {r.sheikh ? (
                              <Text numberOfLines={1} style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.xs, color: colors.texteMuted, marginTop: 2 }}>
                                {r.sheikh}
                              </Text>
                            ) : null}
                          </View>
                          {r.type === 'cours' || r.type === 'livre'
                            ? <IcoChevron size={16} />
                            : (
                              <View style={{
                                width: 28, height: 28, borderRadius: 14,
                                backgroundColor: '#edf2f8',
                                alignItems: 'center', justifyContent: 'center',
                              }}>
                                <IcoPlay size={12} color={colors.bleu} />
                              </View>
                            )}
                        </PressableScale>
                      </Animated.View>
                    ))}
                  </View>
                </View>
              )
            })}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  )
}

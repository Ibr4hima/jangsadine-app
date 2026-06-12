import {
  EnTeteSection,
  HerosDetail,
  IconPlay,
  MiniEgaliseur,
  PressableScale,
  W70,
} from '@/components/AudioUI'
import { colors, radius, spacing, typography } from '@/constants/theme'
import { useAudio } from '@/contexts/AudioContext'
import { Telechargement, useTelechargement } from '@/contexts/TelechargementContext'
import * as Haptics from 'expo-haptics'
import { useEffect, useState } from 'react'
import React from 'react'
import { Alert, Pressable, ScrollView, StatusBar, Text, View } from 'react-native'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'

// ─── icônes ───────────────────────────────────────────────────
function IconDownloadDone({ size = 20, color = 'white' }: { size?: number, color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path d="M382-320 155-547l57-57 170 170 366-366 57 57-423 423ZM200-160v-80h560v80H200Z" fill={color} />
    </Svg>
  )
}
function IconDisque({ size = 22, color = colors.bleu }: { size?: number, color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-120q-75 0-127.5-52.5T300-460q0-75 52.5-127.5T480-640q75 0 127.5 52.5T660-460q0 75-52.5 127.5T480-280Zm0-80q42 0 71-29t29-71q0-42-29-71t-71-29q-42 0-71 29t-29 71q0 42 29 71t71 29Zm0-80Z" fill={color} />
    </Svg>
  )
}
function IconCorbeille({ size = 17, color = '#b6c0cc' }: { size?: number, color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" fill={color} />
    </Svg>
  )
}
function IconChevron({ size = 18, color = '#b6c0cc', bas = false }: { size?: number, color?: string, bas?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" style={bas ? { transform: [{ rotate: '90deg' }] } : undefined}>
      <Path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" fill={color} />
    </Svg>
  )
}

// ─── helpers ─────────────────────────────────────────────────
function formaterTaille(bytes: number): string {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko'
  return (bytes / (1024 * 1024)).toFixed(1) + ' Mo'
}

// ─── config sections ──────────────────────────────────────────
type TypeSection = 'cours' | 'conference' | 'khoutbah' | 'fatwa'
const SECTIONS: { type: TypeSection, label: string }[] = [
  { type: 'cours', label: 'Cours audio' },
  { type: 'conference', label: 'Conférences' },
  { type: 'khoutbah', label: 'Khoutbah' },
  { type: 'fatwa', label: 'Fatwas' },
]

// ─── groupe d'un même contenu (cours, conférence…) ───────────
function GroupeContenu({
  groupId, titre, episodes, index: groupIndex, avecSheikh,
}: {
  groupId: string, titre: string, episodes: Telechargement[], index: number, avecSheikh: boolean,
}) {
  const [ouvert, setOuvert] = useState(true)
  const { supprimer } = useTelechargement()
  const { jouer, piste, enLecture, pause, reprendre } = useAudio()

  const groupeActif = episodes.some(e => e.id === piste?.id)

  const episodesOrdres = [...episodes].sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0))

  const jouerGroupe = () => {
    if (groupeActif) { enLecture ? pause() : reprendre(); return }
    const [premier, ...suite] = episodesOrdres
    jouer(
      { id: premier.id, titre: premier.titre, sheikh: premier.sheikh, url: premier.cheminLocal },
      suite.map(e => ({ id: e.id, titre: e.titre, sheikh: e.sheikh, url: e.cheminLocal }))
    )
  }

  const supprimerGroupe = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    Alert.alert(
      'Supprimer le groupe ?',
      `Supprimer les ${episodes.length} épisode${episodes.length > 1 ? 's' : ''} de « ${titre} » ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => episodes.forEach(e => supprimer(e.id)) },
      ]
    )
  }

  return (
    <Animated.View entering={FadeInDown.duration(350).delay(Math.min(groupIndex, 8) * 50)}>
      {/* En-tête du groupe */}
      <Pressable
        onPress={() => { Haptics.selectionAsync(); setOuvert(v => !v) }}
        style={{
          backgroundColor: colors.blanc,
          borderRadius: ouvert ? 18 : 18,
          borderBottomLeftRadius: ouvert ? 0 : 18,
          borderBottomRightRadius: ouvert ? 0 : 18,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.md,
          flexDirection: 'row', alignItems: 'center', gap: spacing.md,
          shadowColor: '#3a4a5c',
          shadowOffset: { width: 0, height: ouvert ? 0 : 4 },
          shadowOpacity: ouvert ? 0 : 0.06,
          shadowRadius: ouvert ? 0 : 10,
          elevation: ouvert ? 0 : 2,
        }}
      >
        {/* Icône du cours — toujours download_done */}
        <Pressable
          onPress={jouerGroupe}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: colors.bleu,
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            shadowColor: colors.bleu, shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
          }}
        >
          <IconDownloadDone size={20} color="white" />
        </Pressable>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base, color: colors.texte }}>
            {titre}
          </Text>
          <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: colors.texteMuted, marginTop: 2 }}>
            {(() => {
              const sheikhs = [...new Set(episodes.map(e => e.sheikh).filter(Boolean))]
              const prefixe = avecSheikh && sheikhs.length === 1 ? `${sheikhs[0]} · ` : ''
              return `${prefixe}${episodes.length} épisode${episodes.length > 1 ? 's' : ''}`
            })()}
          </Text>
        </View>

        <Pressable
          onPress={supprimerGroupe}
          hitSlop={{ top: 10, bottom: 10, left: 6, right: 4 }}
          style={{ padding: 3 }}
        >
          <IconCorbeille size={17} />
        </Pressable>

        <View style={{ marginLeft: -4 }}>
          <IconChevron size={18} color="#c2ccd6" bas={ouvert} />
        </View>
      </Pressable>

      {/* Épisodes */}
      {ouvert ? (
        <View style={{
          backgroundColor: colors.blanc,
          borderBottomLeftRadius: 18,
          borderBottomRightRadius: 18,
          borderTopWidth: 1,
          borderTopColor: '#f0f2f6',
          overflow: 'hidden',
          shadowColor: '#3a4a5c',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
          elevation: 2,
        }}>
          {episodesOrdres.map((ep, epIdx) => {
            const epActif = piste?.id === ep.id
            return (
              <PressableScale
                key={ep.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                  if (epActif) { enLecture ? pause() : reprendre() }
                  else jouer({ id: ep.id, titre: ep.titre, sheikh: ep.sheikh, url: ep.cheminLocal })
                }}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  paddingHorizontal: spacing.md, paddingVertical: 12,
                  gap: spacing.md,
                  borderTopWidth: epIdx > 0 ? 1 : 0,
                  borderTopColor: '#f5f6f9',
                  backgroundColor: epActif ? '#f4f8ff' : 'transparent',
                }}
              >
                {/* Numéro / état lecture */}
                <View style={{
                  width: 30, height: 30, borderRadius: 15,
                  backgroundColor: epActif ? colors.bleu : '#edf2f8',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  ...(epActif ? {
                    shadowColor: colors.bleu, shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25, shadowRadius: 4, elevation: 3,
                  } : {}),
                }}>
                  {epActif && enLecture
                    ? <MiniEgaliseur color="white" hauteur={14} />
                    : epActif
                      ? <IconPlay size={13} color="white" />
                      : <IconPlay size={13} color={colors.bleu} />}
                </View>

                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{
                    fontFamily: typography.fontFamily.semibold,
                    fontSize: typography.size.base,
                    color: epActif ? colors.bleu : colors.texte,
                  }}>
                    {ep.titre}
                  </Text>
                  {ep.sheikh ? (
                    <Text numberOfLines={1} style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.xs, color: '#aab4c0', marginTop: 2 }}>
                      {ep.sheikh}
                    </Text>
                  ) : null}
                </View>

                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    Alert.alert('Supprimer', `Supprimer « ${ep.titre} » ?`, [
                      { text: 'Annuler', style: 'cancel' },
                      { text: 'Supprimer', style: 'destructive', onPress: () => supprimer(ep.id) },
                    ])
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 6, right: 10 }}
                  style={{ padding: 3 }}
                >
                  <IconCorbeille size={16} color="#cdd6e0" />
                </Pressable>
              </PressableScale>
            )
          })}
        </View>
      ) : null}
    </Animated.View>
  )
}

// ─── page principale ─────────────────────────────────────────
export default function Telechargements() {
  const insets = useSafeAreaInsets()
  const { telechargements, supprimer, tailleTotal } = useTelechargement()

  const toutSupprimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    Alert.alert(
      'Supprimer tous les téléchargements ?',
      `${telechargements.length} épisode${telechargements.length > 1 ? 's' : ''} · ${formaterTaille(tailleTotal)}`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Tout supprimer', style: 'destructive', onPress: () => telechargements.forEach(t => supprimer(t.id)) },
      ]
    )
  }

  // Groupes : section → (groupId → épisodes)
  const parSection = new Map<TypeSection, Map<string, Telechargement[]>>()
  for (const s of SECTIONS) parSection.set(s.type, new Map())
  for (const t of telechargements) {
    const type: TypeSection = (t.type as TypeSection) ?? 'cours'
    const groupes = parSection.get(type)!
    const liste = groupes.get(t.coursId) ?? []
    liste.push(t)
    groupes.set(t.coursId, liste)
  }

  const sectionsAvecContenu = SECTIONS.filter(s => (parSection.get(s.type)?.size ?? 0) > 0)

  return (
    <View style={{ flex: 1, backgroundColor: colors.fondCreme }}>
      <StatusBar barStyle="light-content" />

      {/* ── Héros ── */}
      <HerosDetail paddingTop={insets.top + spacing.sm}>
        <View style={{ alignItems: 'center' }}>
          <View style={{ backgroundColor: 'rgba(214,173,58,0.16)', borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 4, marginBottom: spacing.sm }}>
            <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, letterSpacing: 1.8, color: colors.or, textTransform: 'uppercase' }}>
              Hors connexion
            </Text>
          </View>
          <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size['2xl'], color: 'white' }}>
            Téléchargements
          </Text>
          {telechargements.length > 0 ? (
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 8,
              backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.full,
              paddingHorizontal: 14, paddingVertical: 7, marginTop: spacing.sm,
              borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
            }}>
              <IconDisque size={15} color={W70} />
              <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.sm, color: W70 }}>
                {formaterTaille(tailleTotal)} · {telechargements.length} épisode{telechargements.length > 1 ? 's' : ''}
              </Text>
            </View>
          ) : null}
        </View>
      </HerosDetail>

      {telechargements.length === 0 ? (
        <Animated.View entering={FadeIn.duration(300)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, paddingBottom: 80 }}>
          <View style={{
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: '#e8f0f8',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: spacing.lg,
          }}>
            <IconDisque size={34} color={colors.bleu} />
          </View>
          <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xl, color: colors.texte, marginBottom: spacing.sm }}>
            Aucun téléchargement
          </Text>
          <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.base, color: colors.texteMuted, textAlign: 'center', lineHeight: 22, maxWidth: 280 }}>
            Télécharge des épisodes depuis les pages des cours audio pour les écouter sans connexion.
          </Text>
        </Animated.View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.xl, paddingBottom: 140 }}>
          <Animated.View entering={FadeIn.duration(220)}>
            {sectionsAvecContenu.map((section, sIdx) => {
              const groupes = parSection.get(section.type)!
              let groupIndex = 0
              return (
                <View key={section.type} style={{ marginBottom: sIdx < sectionsAvecContenu.length - 1 ? spacing['2xl'] : 0 }}>
                  <EnTeteSection eyebrow={section.label} />
                  <View style={{ gap: spacing.sm }}>
                    {Array.from(groupes.entries()).map(([groupId, episodes]) => (
                      <GroupeContenu
                        key={groupId}
                        groupId={groupId}
                        titre={episodes[0].coursTitre}
                        episodes={episodes}
                        index={groupIndex++}
                        avecSheikh={section.type === 'cours'}
                      />
                    ))}
                  </View>
                </View>
              )
            })}

            {/* Tout supprimer */}
            <Pressable
              onPress={toutSupprimer}
              style={({ pressed }) => ({
                marginTop: spacing['2xl'],
                alignItems: 'center',
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.sm, color: '#e05252' }}>
                Tout supprimer
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      )}
    </View>
  )
}

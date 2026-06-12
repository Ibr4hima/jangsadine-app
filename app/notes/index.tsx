import { EnTeteSection, HerosDetail, PressableScale, W70 } from '@/components/AudioUI'
import EditeurNote from '@/components/EditeurNote'
import NoteRiche from '@/components/NoteRiche'
import { colors, radius, spacing, typography } from '@/constants/theme'
import { Note, useNotes } from '@/contexts/NotesContext'
import * as Haptics from 'expo-haptics'
import React, { useState } from 'react'
import { Alert, ScrollView, StatusBar, Text, View, Pressable } from 'react-native'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'

// ─── icônes ───────────────────────────────────────────────────
function IconNote({ size = 20, color = 'white' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v400L600-120H200Zm360-80 200-200H560v200ZM280-400h200v-80H280v80Zm0-160h400v-80H280v80Z" fill={color} />
        </Svg>
    )
}
function IconCorbeille({ size = 16, color = '#cdd6e0' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" fill={color} />
        </Svg>
    )
}

// ─── helpers ──────────────────────────────────────────────────
function fmtTemps(s: number) {
    if (!s || isNaN(s)) return '0:00'
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = Math.floor(s % 60)
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    return `${m}:${String(sec).padStart(2, '0')}`
}

function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ─── page ─────────────────────────────────────────────────────
export default function Notes() {
    const insets = useSafeAreaInsets()
    const { notes, supprimerNote } = useNotes()
    const [noteEnEdition, setNoteEnEdition] = useState<Note | null>(null)

    const confirmerSuppression = (note: Note) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        Alert.alert('Supprimer la note ?', 'Cette action est définitive.', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Supprimer', style: 'destructive', onPress: () => supprimerNote(note.id) },
        ])
    }

    // Groupes par épisode (ordre : note la plus récente d'abord)
    const groupes: { episodeId: string; notes: Note[] }[] = []
    for (const note of notes) {
        const groupe = groupes.find(g => g.episodeId === note.episode_id)
        if (groupe) groupe.notes.push(note)
        else groupes.push({ episodeId: note.episode_id, notes: [note] })
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.fondCreme }}>
            <StatusBar barStyle="light-content" />

            {/* ── Héros ── */}
            <HerosDetail paddingTop={insets.top + spacing.sm}>
                <View style={{ alignItems: 'center' }}>
                    <View style={{ backgroundColor: 'rgba(214,173,58,0.16)', borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 4, marginBottom: spacing.sm }}>
                        <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, letterSpacing: 1.8, color: colors.or, textTransform: 'uppercase' }}>
                            Bibliothèque
                        </Text>
                    </View>
                    <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size['2xl'], color: 'white' }}>
                        Mes notes
                    </Text>
                    {notes.length > 0 ? (
                        <View style={{
                            flexDirection: 'row', alignItems: 'center', gap: 8,
                            backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.full,
                            paddingHorizontal: 14, paddingVertical: 7, marginTop: spacing.sm,
                            borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
                        }}>
                            <IconNote size={14} color={W70} />
                            <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.sm, color: W70 }}>
                                {notes.length} note{notes.length > 1 ? 's' : ''}
                            </Text>
                        </View>
                    ) : null}
                </View>
            </HerosDetail>

            {notes.length === 0 ? (
                <Animated.View entering={FadeIn.duration(300)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, paddingBottom: 80 }}>
                    <View style={{
                        width: 72, height: 72, borderRadius: 36,
                        backgroundColor: '#e8f0f8',
                        alignItems: 'center', justifyContent: 'center',
                        marginBottom: spacing.lg,
                    }}>
                        <IconNote size={34} color={colors.bleu} />
                    </View>
                    <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xl, color: colors.texte }}>
                        Aucune note
                    </Text>
                </Animated.View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.xl, paddingBottom: 140 }}>
                    <Animated.View entering={FadeIn.duration(220)}>
                        <EnTeteSection eyebrow="Par écoute" />
                        <View style={{ gap: spacing.md }}>
                            {groupes.map((groupe, gIdx) => {
                                const premiere = groupe.notes[0]
                                return (
                                    <Animated.View key={groupe.episodeId} entering={FadeInDown.duration(350).delay(Math.min(gIdx, 8) * 50)}>
                                        <View style={{
                                            backgroundColor: colors.blanc,
                                            borderRadius: 18,
                                            overflow: 'hidden',
                                            shadowColor: '#3a4a5c',
                                            shadowOffset: { width: 0, height: 4 },
                                            shadowOpacity: 0.06,
                                            shadowRadius: 10,
                                            elevation: 2,
                                        }}>
                                            {/* En-tête de l'épisode */}
                                            <View style={{
                                                flexDirection: 'row', alignItems: 'center', gap: spacing.md,
                                                paddingHorizontal: spacing.md, paddingVertical: spacing.md,
                                            }}>
                                                <View style={{
                                                    width: 40, height: 40, borderRadius: 20,
                                                    backgroundColor: colors.bleu,
                                                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                    shadowColor: colors.bleu, shadowOffset: { width: 0, height: 3 },
                                                    shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
                                                }}>
                                                    <IconNote size={19} color="white" />
                                                </View>
                                                <View style={{ flex: 1, minWidth: 0 }}>
                                                    <Text numberOfLines={1} style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base, color: colors.texte }}>
                                                        {premiere.episode_titre}
                                                    </Text>
                                                    <Text numberOfLines={1} style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: colors.texteMuted, marginTop: 2 }}>
                                                        {premiere.sheikh ? `${premiere.sheikh} · ` : ''}{groupe.notes.length} note{groupe.notes.length > 1 ? 's' : ''}
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Notes de l'épisode */}
                                            {groupe.notes.map(note => (
                                                <PressableScale
                                                    key={note.id}
                                                    onPress={() => {
                                                        Haptics.selectionAsync()
                                                        setNoteEnEdition(note)
                                                    }}
                                                    style={{
                                                        paddingHorizontal: spacing.md,
                                                        paddingVertical: spacing.md,
                                                        borderTopWidth: 1,
                                                        borderTopColor: '#f5f6f9',
                                                    }}
                                                >
                                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                                                        <View style={{
                                                            backgroundColor: 'rgba(214,173,58,0.16)',
                                                            borderRadius: radius.full,
                                                            paddingHorizontal: 10, paddingVertical: 4,
                                                        }}>
                                                            <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, color: '#a8842a', fontVariant: ['tabular-nums'] }}>
                                                                {fmtTemps(note.timestamp)}
                                                            </Text>
                                                        </View>
                                                        <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.xs, color: '#aab4c0', marginLeft: spacing.sm }}>
                                                            {fmtDate(note.created_at)}
                                                        </Text>
                                                        <Pressable
                                                            onPress={() => confirmerSuppression(note)}
                                                            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                                                            style={{ marginLeft: 'auto', padding: 3 }}
                                                        >
                                                            <IconCorbeille size={16} />
                                                        </Pressable>
                                                    </View>
                                                    <NoteRiche texte={note.texte} />
                                                </PressableScale>
                                            ))}
                                        </View>
                                    </Animated.View>
                                )
                            })}
                        </View>
                    </Animated.View>
                </ScrollView>
            )}

            {/* ── Édition d'une note existante ── */}
            <EditeurNote
                visible={noteEnEdition !== null}
                note={noteEnEdition}
                onClose={() => setNoteEnEdition(null)}
            />
        </View>
    )
}

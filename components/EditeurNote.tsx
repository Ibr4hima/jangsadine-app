import { segmenterInline, SURLIGNAGE_BG } from '@/components/NoteRiche'
import { colors, radius, spacing, typography } from '@/constants/theme'
import { Note, useNotes } from '@/contexts/NotesContext'
import * as Haptics from 'expo-haptics'
import React, { useEffect, useRef, useState } from 'react'
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'

// ─── icônes (Material Symbols) ────────────────────────────────
function IconFermer({ size = 18, color = colors.texte }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" fill={color} />
        </Svg>
    )
}
function IconPuces({ size = 20, color = colors.bleu }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M360-200v-80h480v80H360Zm0-240v-80h480v80H360Zm0-240v-80h480v80H360ZM200-160q-33 0-56.5-23.5T120-240q0-33 23.5-56.5T200-320q33 0 56.5 23.5T280-240q0 33-23.5 56.5T200-160Zm0-240q-33 0-56.5-23.5T120-480q0-33 23.5-56.5T200-560q33 0 56.5 23.5T280-480q0 33-23.5 56.5T200-400Zm-56.5-263.5Q120-687 120-720t23.5-56.5Q167-800 200-800t56.5 23.5Q280-753 280-720t-23.5 56.5Q233-640 200-640t-56.5-23.5Z" fill={color} />
        </Svg>
    )
}
function IconNumeros({ size = 20, color = colors.bleu }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M120-80v-60h100v-30h-60v-60h60v-30H120v-60h120q17 0 28.5 11.5T280-280v40q0 17-11.5 28.5T240-200q17 0 28.5 11.5T280-160v40q0 17-11.5 28.5T240-80H120Zm0-280v-110q0-17 11.5-28.5T160-510h60v-30H120v-60h120q17 0 28.5 11.5T280-560v70q0 17-11.5 28.5T240-450h-60v30h100v60H120Zm60-280v-180h-60v-60h120v240h-60Zm180 440v-80h480v80H360Zm0-240v-80h480v80H360Zm0-240v-80h480v80H360Z" fill={color} />
        </Svg>
    )
}
function IconSurligneur({ size = 20, color = colors.bleu }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="m384-560 216 216-200 200q-24 24-56 24t-56-24l-2-2-26 26H60l126-126-2-2q-24-24-24-56t24-56l200-200Zm57-57 199-199q24-24 56-24t56 24l104 104q24 24 24 56t-24 56L657-401 441-617Z" fill={color} />
        </Svg>
    )
}
function IconGras({ size = 20, color = colors.bleu }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M272-200v-560h221q65 0 120 40t55 111q0 51-23 78.5T602-491q25 11 55.5 41t30.5 90q0 89-65 124.5T501-200H272Zm121-112h104q48 0 58.5-24.5T566-372q0-11-10.5-35.5T494-432H393v120Zm0-228h93q33 0 48-17t15-38q0-24-17-39t-44-15h-95v109Z" fill={color} />
        </Svg>
    )
}
function IconAddNotes({ size = 20, color = 'white' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M700-120h40v-100h100v-40H740v-100h-40v100H600v40h100v100Zm20 80q-83 0-141.5-58.5T520-240q0-83 58.5-141.5T720-440q83 0 141.5 58.5T920-240q0 83-58.5 141.5T720-40ZM280-600h400v-80H280v80Zm187 480H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v268q-29-14-58.5-21t-61.5-7q-11 0-20.5.5T680-517v-3H280v80h245q-18 17-32.5 37T467-360H280v80h163q-2 10-2.5 19.5T440-240q0 33 6 61.5t21 58.5Z" fill={color} />
        </Svg>
    )
}

function fmtTemps(s: number) {
    if (!s || isNaN(s) || s < 0) return '0:00'
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sc = Math.floor(s % 60)
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sc).padStart(2, '0')}`
    return `${m}:${String(sc).padStart(2, '0')}`
}

// ─── Rendu stylé en direct dans le TextInput ──────────────────
// Les marqueurs (==, **) restent visibles mais discrets, le texte
// entre eux est stylé en temps réel.
function RenduEditeur({ texte }: { texte: string }) {
    return (
        <>
            {texte.split('\n').map((ligne, li) => (
                <React.Fragment key={li}>
                    {li > 0 ? '\n' : null}
                    {(() => {
                        const segments: React.ReactNode[] = []
                        let reste = ligne
                        const puce = ligne.match(/^(• |\d+\. )/)
                        if (puce) {
                            segments.push(
                                <Text key="prefixe" style={{ fontFamily: typography.fontFamily.bold, color: colors.bleu }}>
                                    {puce[1]}
                                </Text>
                            )
                            reste = ligne.slice(puce[1].length)
                        }
                        segmenterInline(reste).forEach((s, i) => {
                            if (s.surligne) {
                                segments.push(
                                    <Text key={i}>
                                        <Text style={{ color: '#c9cfd8' }}>==</Text>
                                        <Text style={{ backgroundColor: SURLIGNAGE_BG }}>{s.texte}</Text>
                                        <Text style={{ color: '#c9cfd8' }}>==</Text>
                                    </Text>
                                )
                            } else if (s.gras) {
                                segments.push(
                                    <Text key={i}>
                                        <Text style={{ color: '#c9cfd8' }}>**</Text>
                                        <Text style={{ fontFamily: typography.fontFamily.bold }}>{s.texte}</Text>
                                        <Text style={{ color: '#c9cfd8' }}>**</Text>
                                    </Text>
                                )
                            } else {
                                segments.push(<Text key={i}>{s.texte}</Text>)
                            }
                        })
                        return segments
                    })()}
                </React.Fragment>
            ))}
        </>
    )
}

// ─── Éditeur ──────────────────────────────────────────────────
type Props = {
    visible: boolean
    onClose: () => void
    // Mode édition : une note existante
    note?: Note | null
    // Mode création : contexte d'écoute
    episode?: { id: string; titre: string; sheikh: string } | null
    timestamp?: number
}

export default function EditeurNote({ visible, onClose, note, episode, timestamp = 0 }: Props) {
    const insets = useSafeAreaInsets()
    const { ajouterNote, modifierNote } = useNotes()

    const [texte, setTexte] = useState('')
    const selRef = useRef({ start: 0, end: 0 })
    const [selCtrl, setSelCtrl] = useState<{ start: number; end: number } | null>(null)
    const inputRef = useRef<TextInput>(null)

    useEffect(() => {
        if (visible) {
            const initial = note?.texte ?? ''
            setTexte(initial)
            selRef.current = { start: initial.length, end: initial.length }
            setSelCtrl(null)
        }
    }, [visible, note?.id])

    const titreEpisode = note?.episode_titre ?? episode?.titre ?? ''
    const nomSheikh = note?.sheikh ?? episode?.sheikh ?? ''
    const ts = note?.timestamp ?? timestamp

    const appliquer = (nouveau: string, curseur: number) => {
        setTexte(nouveau)
        const pos = Math.max(0, Math.min(curseur, nouveau.length))
        selRef.current = { start: pos, end: pos }
        setSelCtrl({ start: pos, end: pos })
    }

    // Continuation automatique des listes à l'appui sur Entrée
    const onChange = (nouveau: string) => {
        if (nouveau.length === texte.length + 1) {
            const pos = selRef.current.start
            if (nouveau[pos] === '\n' && nouveau.slice(0, pos) + nouveau.slice(pos + 1) === texte) {
                const avant = nouveau.slice(0, pos)
                const ligne = avant.slice(avant.lastIndexOf('\n') + 1)
                const puce = ligne.match(/^• (.*)$/)
                const num = ligne.match(/^(\d+)\. (.*)$/)
                if (puce) {
                    if (puce[1].trim() === '') {
                        const debut = pos - ligne.length
                        appliquer(nouveau.slice(0, debut) + nouveau.slice(pos), debut)
                        return
                    }
                    appliquer(nouveau.slice(0, pos + 1) + '• ' + nouveau.slice(pos + 1), pos + 3)
                    return
                }
                if (num) {
                    if (num[2].trim() === '') {
                        const debut = pos - ligne.length
                        appliquer(nouveau.slice(0, debut) + nouveau.slice(pos), debut)
                        return
                    }
                    const suivant = `${parseInt(num[1], 10) + 1}. `
                    appliquer(nouveau.slice(0, pos + 1) + suivant + nouveau.slice(pos + 1), pos + 1 + suivant.length)
                    return
                }
            }
        }
        setTexte(nouveau)
    }

    // ─ lignes couvertes par la sélection ─
    const lignesSelection = () => {
        const { start, end } = selRef.current
        const debutLigne = texte.lastIndexOf('\n', Math.max(0, start - 1)) + 1
        let finLigne = texte.indexOf('\n', end)
        if (finLigne === -1) finLigne = texte.length
        return { debutLigne, finLigne }
    }

    const basculerListe = (type: 'puce' | 'numero') => {
        Haptics.selectionAsync()
        const { debutLigne, finLigne } = lignesSelection()
        const bloc = texte.slice(debutLigne, finLigne)
        const lignes = bloc.split('\n')
        const regexActuel = type === 'puce' ? /^• / : /^\d+\. /
        const dejaActif = lignes.every(l => regexActuel.test(l))

        let resultat: string[]
        if (dejaActif) {
            resultat = lignes.map(l => l.replace(regexActuel, ''))
        } else {
            resultat = lignes.map((l, i) => {
                const nettoye = l.replace(/^• /, '').replace(/^\d+\. /, '')
                return type === 'puce' ? `• ${nettoye}` : `${i + 1}. ${nettoye}`
            })
        }
        const nouveauBloc = resultat.join('\n')
        const nouveau = texte.slice(0, debutLigne) + nouveauBloc + texte.slice(finLigne)
        appliquer(nouveau, debutLigne + nouveauBloc.length)
    }

    const envelopper = (marqueur: string) => {
        Haptics.selectionAsync()
        let { start, end } = selRef.current
        if (start === end) {
            // pas de sélection → étendre au mot courant
            while (start > 0 && !/[\s\n]/.test(texte[start - 1])) start--
            while (end < texte.length && !/[\s\n]/.test(texte[end])) end++
        }
        if (start === end) {
            // toujours rien : insérer une paire et placer le curseur au milieu
            const nouveau = texte.slice(0, start) + marqueur + marqueur + texte.slice(end)
            appliquer(nouveau, start + marqueur.length)
            return
        }
        const contenu = texte.slice(start, end)
        // déjà enveloppé → retirer
        if (contenu.startsWith(marqueur) && contenu.endsWith(marqueur) && contenu.length >= marqueur.length * 2) {
            const nouveau = texte.slice(0, start) + contenu.slice(marqueur.length, -marqueur.length) + texte.slice(end)
            appliquer(nouveau, end - marqueur.length * 2)
            return
        }
        const nouveau = texte.slice(0, start) + marqueur + contenu + marqueur + texte.slice(end)
        appliquer(nouveau, end + marqueur.length * 2)
    }

    const enregistrer = async () => {
        const contenu = texte.trim()
        if (!contenu) return
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        if (note) {
            await modifierNote(note.id, contenu)
        } else if (episode) {
            await ajouterNote({
                episode_id: episode.id,
                episode_titre: episode.titre,
                sheikh: episode.sheikh,
                timestamp: ts,
                texte: contenu,
            })
        }
        onClose()
    }

    const peutEnregistrer = texte.trim().length > 0

    const OutilBtn = ({ onPress, children }: { onPress: () => void; children: React.ReactNode }) => (
        <Pressable
            onPress={onPress}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            style={({ pressed }) => ({
                width: 42, height: 42, borderRadius: 13,
                backgroundColor: pressed ? '#dde7f2' : '#edf2f8',
                alignItems: 'center', justifyContent: 'center',
            })}
        >
            {children}
        </Pressable>
    )

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
            <View style={{ flex: 1, backgroundColor: colors.fondCreme, paddingTop: insets.top }}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    {/* ── Barre supérieure ── */}
                    <View style={{
                        flexDirection: 'row', alignItems: 'center',
                        paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
                    }}>
                        <Pressable
                            onPress={onClose}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            style={{
                                width: 36, height: 36, borderRadius: 18,
                                backgroundColor: '#e9ecf2',
                                alignItems: 'center', justifyContent: 'center',
                            }}
                        >
                            <IconFermer size={16} color="#5b6675" />
                        </Pressable>

                        <Text style={{
                            flex: 1, textAlign: 'center',
                            fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs,
                            letterSpacing: 1.8, color: colors.or, textTransform: 'uppercase',
                        }}>
                            {note ? 'Modifier la note' : 'Nouvelle note'}
                        </Text>

                        <Pressable
                            onPress={enregistrer}
                            disabled={!peutEnregistrer}
                            style={({ pressed }) => ({
                                paddingHorizontal: 16, paddingVertical: 8,
                                borderRadius: radius.full,
                                backgroundColor: peutEnregistrer ? colors.bleu : '#cdd6e0',
                                opacity: pressed ? 0.85 : 1,
                            })}
                        >
                            <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.sm, color: 'white' }}>
                                Enregistrer
                            </Text>
                        </Pressable>
                    </View>

                    {/* ── Contexte d'écoute ── */}
                    <Animated.View entering={FadeIn.duration(250)} style={{
                        marginHorizontal: spacing.lg,
                        backgroundColor: colors.blanc,
                        borderRadius: 18,
                        padding: spacing.md,
                        flexDirection: 'row', alignItems: 'center', gap: spacing.md,
                        shadowColor: '#3a4a5c', shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
                    }}>
                        <View style={{
                            width: 40, height: 40, borderRadius: 20,
                            backgroundColor: colors.bleu,
                            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            <IconAddNotes size={20} color="white" />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                            <Text numberOfLines={1} style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base, color: colors.texte }}>
                                {titreEpisode}
                            </Text>
                            {nomSheikh ? (
                                <Text numberOfLines={1} style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.xs, color: colors.texteMuted, marginTop: 2 }}>
                                    {nomSheikh}
                                </Text>
                            ) : null}
                        </View>
                        <View style={{
                            backgroundColor: 'rgba(214,173,58,0.16)',
                            borderRadius: radius.full,
                            paddingHorizontal: 10, paddingVertical: 5,
                        }}>
                            <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, color: '#a8842a', fontVariant: ['tabular-nums'] }}>
                                {fmtTemps(ts)}
                            </Text>
                        </View>
                    </Animated.View>

                    {/* ── Zone d'écriture ── */}
                    <ScrollView
                        style={{ flex: 1 }}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ flexGrow: 1, padding: spacing.lg }}
                    >
                        <View style={{
                            flex: 1,
                            backgroundColor: colors.blanc,
                            borderRadius: 18,
                            padding: spacing.lg,
                            shadowColor: '#3a4a5c', shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
                        }}>
                            <TextInput
                                ref={inputRef}
                                multiline
                                autoFocus
                                onChangeText={onChange}
                                selection={selCtrl ?? undefined}
                                onSelectionChange={e => {
                                    selRef.current = e.nativeEvent.selection
                                    if (selCtrl) setSelCtrl(null)
                                }}
                                placeholder="Écris ce que tu retiens de cette écoute…"
                                placeholderTextColor="#aab4c0"
                                textAlignVertical="top"
                                style={{
                                    flex: 1,
                                    fontFamily: typography.fontFamily.regular,
                                    fontSize: typography.size.base,
                                    lineHeight: 24,
                                    color: colors.texte,
                                    minHeight: 200,
                                }}
                            >
                                <Text>
                                    <RenduEditeur texte={texte} />
                                </Text>
                            </TextInput>
                        </View>
                    </ScrollView>

                    {/* ── Barre d'outils ── */}
                    <View style={{
                        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                        gap: spacing.sm,
                        paddingHorizontal: spacing.lg,
                        paddingTop: spacing.sm,
                        paddingBottom: Math.max(insets.bottom, spacing.sm),
                        backgroundColor: colors.blanc,
                        borderTopWidth: 1, borderTopColor: '#eef1f6',
                    }}>
                        <OutilBtn onPress={() => basculerListe('puce')}><IconPuces size={20} /></OutilBtn>
                        <OutilBtn onPress={() => basculerListe('numero')}><IconNumeros size={20} /></OutilBtn>
                        <OutilBtn onPress={() => envelopper('==')}><IconSurligneur size={20} /></OutilBtn>
                        <OutilBtn onPress={() => envelopper('**')}><IconGras size={20} /></OutilBtn>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    )
}

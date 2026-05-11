import { colors, radius, spacing, typography } from '@/constants/theme'
import { useAudio } from '@/contexts/AudioContext'
import { useNotes } from '@/contexts/NotesContext'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import TextTicker from 'react-native-text-ticker'

function IconPlay({ size = 20, color = colors.texte }: { size?: number, color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M320-200v-560l440 280-440 280Zm80-280Zm0 134 210-134-210-134v268Z" fill={color} /></Svg>
}

function IconPause({ size = 20, color = colors.texte }: { size?: number, color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M520-200v-560h240v560H520Zm-320 0v-560h240v560H200Zm400-80h80v-400h-80v400Zm-320 0h80v-400h-80v400Zm0-400v400-400Zm320 0v400-400Z" fill={color} /></Svg>
}

function IconFastForward({ size = 20, color = colors.texte }: { size?: number, color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M100-240v-480l360 240-360 240Zm400 0v-480l360 240-360 240ZM180-480Zm400 0Zm-400 90 136-90-136-90v180Zm400 0 136-90-136-90v180Z" fill={color} /></Svg>
}

function formaterTemps(s: number) {
  if (!s || isNaN(s)) return '0:00'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  if (h > 0) return h + ':' + m.toString().padStart(2, '0') + ':' + sec.toString().padStart(2, '0')
  return m + ':' + sec.toString().padStart(2, '0')
}

export default function LecteurPersistant() {
  const { piste, enLecture, progression, tempsActuel, dureeTotal, pause, reprendre, pisterSuivante } = useAudio()
  const { ajouterNote } = useNotes()
  const [noteVisible, setNoteVisible] = useState(false)
  const [texteNote, setTexteNote] = useState('')
  const [pleinEcran, setPleinEcran] = useState(false)

  if (!piste) return null

  const onPressPlay = () => enLecture ? pause() : reprendre()

  const sauvegarderNote = async () => {
    if (!texteNote.trim() || !piste) return
    await ajouterNote({
      episode_id: piste.id,
      episode_titre: piste.titre,
      sheikh: piste.sheikh,
      timestamp: tempsActuel,
      texte: texteNote.trim(),
    })
    setTexteNote('')
    setNoteVisible(false)
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'position' : undefined}>

      {/* Panel note */}
      {noteVisible && (
        <View style={{
          backgroundColor: colors.blanc,
          borderRadius: radius.xl,
          borderWidth: 1, borderColor: colors.bordure,
          padding: spacing.md,
          marginBottom: spacing.sm,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <Text style={{ flex: 1, fontFamily: typography.fontFamily.medium, fontSize: typography.size.sm, color: colors.bleu }}>
              📝 Note à {formaterTemps(tempsActuel)}
            </Text>
            <Pressable onPress={() => { setNoteVisible(false); setTexteNote('') }}>
              <Text style={{ color: '#aaa', fontSize: 18 }}>✕</Text>
            </Pressable>
          </View>
          <TextInput
            value={texteNote} onChangeText={setTexteNote}
            placeholder="Écris ta note ici..." placeholderTextColor="#bbb"
            multiline autoFocus
            style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.base, color: colors.texte, minHeight: 60, maxHeight: 120, textAlignVertical: 'top' }}
          />
          <Pressable onPress={sauvegarderNote} style={{ marginTop: spacing.sm, backgroundColor: colors.bleu, borderRadius: radius.md, paddingVertical: spacing.sm, alignItems: 'center' }}>
            <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.sm, color: colors.blanc }}>Sauvegarder</Text>
          </Pressable>
        </View>
      )}

      {/* Lecteur pill */}
      <Pressable onPress={() => setPleinEcran(true)}>
        <View style={{
          backgroundColor: '#d0e4f7',
          borderRadius: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 8,
          overflow: 'hidden',
        }}>
          {/* Barre progression */}
          <View style={{ height: 3, backgroundColor: 'rgba(0,0,0,0.08)' }}>
            <View style={{ width: `${progression}%`, height: '100%', backgroundColor: colors.bleu, borderRadius: 2 }} />
          </View>

          {/* Contenu */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>

            {/* Infos */}
            <View style={{ flex: 1, minWidth: 0, marginRight: spacing.sm }}>
              <TextTicker
                style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.sm, color: colors.texte }}
                loop bounce={false} repeatSpacer={50} marqueeDelay={2000} scrollSpeed={10}
              >
                {piste.titre}
              </TextTicker>
              <Text numberOfLines={1} style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.xs, color: colors.texteMuted, marginTop: 2 }}>
                {piste.sheikh} · {formaterTemps(tempsActuel)} / {formaterTemps(dureeTotal)}
              </Text>
            </View>

            {/* Fast forward */}
            <Pressable onPress={pisterSuivante} style={{ padding: spacing.xs, marginRight: spacing.md }}>
              <IconFastForward size={22} color={colors.texte} />
            </Pressable>

            {/* Play/Pause */}
            <Pressable
              onPress={onPressPlay}
              style={{
                width: 40, height: 40, borderRadius: radius.full,
                backgroundColor: colors.bleu,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              {enLecture
                ? <IconPause size={18} color="white" />
                : <IconPlay size={18} color="white" />
              }
            </Pressable>

          </View>
        </View>
      </Pressable>

      {/* Lecteur plein écran */}
      {pleinEcran && (
        (() => {
          const LecteurPleinEcran = require('./LecteurPleinEcran').default
          return <LecteurPleinEcran visible={pleinEcran} onClose={() => setPleinEcran(false)} />
        })()
      )}

    </KeyboardAvoidingView>
  )
}
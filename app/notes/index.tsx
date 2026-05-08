import { colors, radius, spacing, typography } from '@/constants/theme'
import { Note, useNotes } from '@/contexts/NotesContext'
import { useRouter } from 'expo-router'
import { ArrowLeft, Trash2 } from 'lucide-react-native'
import { Alert, Pressable, ScrollView, StatusBar, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

function formaterTemps(s: number) {
  if (!s || isNaN(s)) return '0:00'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  if (h > 0) return h + ':' + m.toString().padStart(2, '0') + ':' + sec.toString().padStart(2, '0')
  return m + ':' + sec.toString().padStart(2, '0')
}

function formaterDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function Notes() {
  const router = useRouter()
  const { notes, supprimerNote } = useNotes()

  const confirmerSuppression = (id: number) => {
    Alert.alert('Supprimer', 'Supprimer cette note ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => supprimerNote(id) },
    ])
  }

  // Grouper par épisode
  const groupes: Record<string, Note[]> = {}
  for (const note of notes) {
    if (!groupes[note.episode_id]) groupes[note.episode_id] = []
    groupes[note.episode_id].push(note)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.fondCreme }} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
        borderBottomWidth: 1, borderBottomColor: colors.bordure,
        backgroundColor: colors.blanc,
      }}>
        <Pressable onPress={() => router.back()} style={{ marginRight: spacing.md, padding: 4 }}>
          <ArrowLeft size={22} color={colors.texte} />
        </Pressable>
        <View>
          <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, letterSpacing: 2, color: colors.or, textTransform: 'uppercase' }}>
            Bibliothèque
          </Text>
          <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.lg, color: colors.texte }}>
            Mes notes ({notes.length})
          </Text>
        </View>
      </View>

      {notes.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
          <Text style={{ fontSize: 48, marginBottom: spacing.lg }}>📝</Text>
          <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xl, color: colors.texte, marginBottom: spacing.sm, textAlign: 'center' }}>
            Aucune note
          </Text>
          <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.base, color: colors.texteMuted, textAlign: 'center', lineHeight: 22 }}>
            Appuie sur ✏️ dans le lecteur pendant l'écoute pour prendre des notes horodatées.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120 }}>
          {Object.entries(groupes).map(([episodeId, episodeNotes]) => (
            <View key={episodeId} style={{ marginBottom: spacing.xl }}>
              {/* Titre épisode */}
              <View style={{ marginBottom: spacing.sm }}>
                <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.base, color: colors.texte }}>
                  {episodeNotes[0].episode_titre}
                </Text>
                <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: colors.texteMuted }}>
                  {episodeNotes[0].sheikh} · {formaterDate(episodeNotes[0].created_at)}
                </Text>
              </View>

              {/* Notes */}
              <View style={{ gap: spacing.sm }}>
                {episodeNotes.map(note => (
                  <View key={note.id} style={{
                    backgroundColor: colors.blanc,
                    borderRadius: radius.lg,
                    borderWidth: 1,
                    borderColor: colors.bordure,
                    borderLeftWidth: 3,
                    borderLeftColor: colors.bleu,
                    padding: spacing.md,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                      <View style={{
                        backgroundColor: '#e8f0f8',
                        borderRadius: radius.full,
                        paddingHorizontal: spacing.sm,
                        paddingVertical: 3,
                        marginRight: spacing.sm,
                      }}>
                        <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.xs, color: colors.bleu }}>
                          ⏱ {formaterTemps(note.timestamp)}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => confirmerSuppression(note.id)}
                        style={{ marginLeft: 'auto' }}
                      >
                        <Trash2 size={14} color="#ccc" />
                      </Pressable>
                    </View>
                    <Text style={{
                      fontFamily: typography.fontFamily.regular,
                      fontSize: typography.size.base,
                      color: colors.texte,
                      lineHeight: 22,
                    }}>
                      {note.texte}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
import { colors, radius, spacing, typography } from '@/constants/theme'
import { useAudio } from '@/contexts/AudioContext'
import { useTelechargement } from '@/contexts/TelechargementContext'
import { useRouter } from 'expo-router'
import { ArrowLeft, HardDrive, Play, Trash2 } from 'lucide-react-native'
import { Alert, Pressable, ScrollView, StatusBar, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

function formaterTaille(bytes: number): string {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko'
  return (bytes / (1024 * 1024)).toFixed(1) + ' Mo'
}

function formaterDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

export default function Telechargements() {
  const router = useRouter()
  const { telechargements, supprimer, tailleTotal } = useTelechargement()
  const { jouer, getCheminLocal } = useAudio() as any

  // Grouper par cours
  const groupes: Record<string, typeof telechargements> = {}
  for (const t of telechargements) {
    if (!groupes[t.coursId]) groupes[t.coursId] = []
    groupes[t.coursId].push(t)
  }

  const confirmerSuppression = (id: string, titre: string) => {
    Alert.alert('Supprimer', `Supprimer "${titre}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => supprimer(id) },
    ])
  }

  const toutSupprimer = () => {
    Alert.alert('Tout supprimer', 'Supprimer tous les téléchargements ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer tout', style: 'destructive', onPress: () => {
          telechargements.forEach(t => supprimer(t.id))
        }
      },
    ])
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
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, letterSpacing: 2, color: colors.or, textTransform: 'uppercase' }}>
            Hors connexion
          </Text>
          <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.lg, color: colors.texte }}>
            Téléchargements
          </Text>
        </View>
        {telechargements.length > 0 && (
          <Pressable onPress={toutSupprimer} style={{ padding: 4 }}>
            <Trash2 size={18} color="#ccc" />
          </Pressable>
        )}
      </View>

      {telechargements.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
          <Text style={{ fontSize: 48, marginBottom: spacing.lg }}>📥</Text>
          <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xl, color: colors.texte, marginBottom: spacing.sm, textAlign: 'center' }}>
            Aucun téléchargement
          </Text>
          <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.base, color: colors.texteMuted, textAlign: 'center', lineHeight: 22 }}>
            Appuie sur ↓ sur un épisode pour le télécharger et l'écouter hors connexion.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120 }}>

          {/* Espace utilisé */}
          <View style={{
            backgroundColor: colors.blanc,
            borderRadius: radius.lg,
            borderWidth: 1, borderColor: colors.bordure,
            padding: spacing.md,
            flexDirection: 'row', alignItems: 'center',
            marginBottom: spacing.xl,
          }}>
            <View style={{
              width: 40, height: 40, borderRadius: radius.md,
              backgroundColor: '#e8f0f8',
              alignItems: 'center', justifyContent: 'center',
              marginRight: spacing.md,
            }}>
              <HardDrive size={20} color={colors.bleu} strokeWidth={1.5} />
            </View>
            <View>
              <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base, color: colors.texte }}>
                Espace utilisé
              </Text>
              <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: colors.texteMuted }}>
                {formaterTaille(tailleTotal)} · {telechargements.length} épisode{telechargements.length > 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* Groupes par cours */}
          {Object.entries(groupes).map(([coursId, episodes]) => (
            <View key={coursId} style={{ marginBottom: spacing.xl }}>
              <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.base, color: colors.texte, marginBottom: spacing.sm }}>
                {episodes[0].coursTitre}
              </Text>
              <View style={{ gap: spacing.sm }}>
                {episodes.map(ep => (
                  <View key={ep.id} style={{
                    backgroundColor: colors.blanc,
                    borderRadius: radius.lg,
                    borderWidth: 1, borderColor: colors.bordure,
                    padding: spacing.md,
                    flexDirection: 'row', alignItems: 'center',
                  }}>
                    <Pressable
                      onPress={() => jouer({ id: ep.id, titre: ep.titre, sheikh: ep.sheikh, url: ep.cheminLocal })}
                      style={{
                        width: 36, height: 36, borderRadius: radius.full,
                        backgroundColor: colors.bleu,
                        alignItems: 'center', justifyContent: 'center',
                        marginRight: spacing.md, flexShrink: 0,
                      }}
                    >
                      <Play size={14} color="white" fill="white" strokeWidth={0} style={{ marginLeft: 2 }} />
                    </Pressable>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text numberOfLines={1} style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base, color: colors.texte }}>
                        {ep.titre}
                      </Text>
                      <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.xs, color: colors.texteMuted, marginTop: 2 }}>
                        {ep.sheikh} · {formaterTaille(ep.taille)} · {formaterDate(ep.dateTelechargement)}
                      </Text>
                    </View>
                    <Pressable onPress={() => confirmerSuppression(ep.id, ep.titre)} style={{ padding: 4 }}>
                      <Trash2 size={16} color="#ccc" />
                    </Pressable>
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
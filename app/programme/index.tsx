import {
  BoutonHeros,
  EnTeteSection,
  HerosDetail,
  PressableScale,
  W70,
} from '@/components/AudioUI'
import { colors, radius, spacing, typography } from '@/constants/theme'
import { chargerProgrammes, genId, Programme, sauvegarderProgrammes } from '@/lib/programmes'
import * as Haptics from 'expo-haptics'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import {
  Alert, KeyboardAvoidingView, Modal, Platform, Pressable,
  ScrollView, StatusBar, Text, TextInput, View,
} from 'react-native'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'

function IconAjouter({ size = 16, color = 'white' }: { size?: number, color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" fill={color} />
    </Svg>
  )
}
function IconCorbeille({ size = 18, color = '#b6c0cc' }: { size?: number, color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" fill={color} />
    </Svg>
  )
}
function IconFermer({ size = 20, color = colors.texte }: { size?: number, color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" fill={color} />
    </Svg>
  )
}
function IconListe({ size = 20, color = colors.bleu }: { size?: number, color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path d="m222-200-96-96 56-56 40 40 80-80 56 56-136 136Zm0-320-96-96 56-56 40 40 80-80 56 56-136 136Zm298 240v-80h360v80H520Zm0-320v-80h360v80H520Z" fill={color} />
    </Svg>
  )
}

function BarreProgression({ pct, hauteur = 5, fond = '#e8eef6', remplissage = colors.bleu }: {
  pct: number, hauteur?: number, fond?: string, remplissage?: string
}) {
  return (
    <View style={{ height: hauteur, borderRadius: hauteur / 2, backgroundColor: fond, overflow: 'hidden' }}>
      <View style={{ width: `${Math.min(100, Math.max(0, pct))}%`, height: '100%', borderRadius: hauteur / 2, backgroundColor: remplissage }} />
    </View>
  )
}

export default function MesProgrammes() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [programmes, setProgrammes] = useState<Programme[]>([])
  const [charge, setCharge] = useState(false)
  const [modalCreer, setModalCreer] = useState(false)
  const [nomNouv, setNomNouv] = useState('')
  const [intentionNouv, setIntentionNouv] = useState('')

  // Recharge à chaque retour sur la page (le détail peut modifier les données)
  useFocusEffect(useCallback(() => {
    chargerProgrammes().then(p => { setProgrammes(p); setCharge(true) })
  }, []))

  const creerProgramme = async () => {
    if (!nomNouv.trim()) return
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    const nouveau: Programme = {
      id: genId(),
      nom: nomNouv.trim(),
      intention: intentionNouv.trim(),
      cours: [],
      dateCreation: new Date().toISOString(),
      episodesEcoutes: [],
      coursTermines: [],
    }
    const mis = [...programmes, nouveau]
    setProgrammes(mis)
    await sauvegarderProgrammes(mis)
    setNomNouv('')
    setIntentionNouv('')
    setModalCreer(false)
    router.push(`/programme/${nouveau.id}` as any)
  }

  const supprimerProgramme = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    const prog = programmes.find(p => p.id === id)
    Alert.alert('Supprimer ce programme ?', `« ${prog?.nom} » sera définitivement supprimé.`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive', onPress: async () => {
          const mis = programmes.filter(p => p.id !== id)
          setProgrammes(mis)
          await sauvegarderProgrammes(mis)
        },
      },
    ])
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.fondCreme }}>
      <StatusBar barStyle="light-content" />

      {/* ── Héros ── */}
      <HerosDetail paddingTop={insets.top + spacing.sm}>
        <View style={{ alignItems: 'center' }}>
          <View style={{ backgroundColor: 'rgba(214,173,58,0.16)', borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 4, marginBottom: spacing.sm }}>
            <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, letterSpacing: 1.8, color: colors.or, textTransform: 'uppercase' }}>
              Apprentissage
            </Text>
          </View>
          <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size['2xl'], color: 'white' }}>
            Mon Programme
          </Text>
          <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: W70, marginTop: 6, textAlign: 'center', maxWidth: 300 }}>
            Compose tes parcours de cours audio et suis ta progression
          </Text>
          <View style={{ marginTop: spacing.lg }}>
            <BoutonHeros
              icone={<IconAjouter size={16} color="white" />}
              label="Nouveau programme"
              onPress={() => setModalCreer(true)}
            />
          </View>
        </View>
      </HerosDetail>

      {/* ── Liste ── */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.xl, paddingBottom: 140, flexGrow: 1 }}>
        {!charge ? null : programmes.length === 0 ? (
          <Animated.View entering={FadeIn.duration(300)} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: spacing['3xl'] }}>
            <View style={{
              width: 72, height: 72, borderRadius: 36,
              backgroundColor: '#e8f0f8',
              alignItems: 'center', justifyContent: 'center',
              marginBottom: spacing.lg,
            }}>
              <IconListe size={32} color={colors.bleu} />
            </View>
            <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xl, color: colors.texte, marginBottom: spacing.sm }}>
              Aucun programme
            </Text>
            <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.base, color: colors.texteMuted, textAlign: 'center', lineHeight: 22, maxWidth: 280 }}>
              Crée ton premier programme et ajoute les cours audio que tu veux suivre, dans l'ordre que tu veux.
            </Text>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(220)}>
            <EnTeteSection
              eyebrow="Mes programmes"
              titre={`${programmes.length} programme${programmes.length > 1 ? 's' : ''}`}
            />
            <View style={{ gap: spacing.sm }}>
              {programmes.map((prog, i) => {
                const nbCours = prog.cours.length
                const nbTermines = prog.coursTermines.filter(id => prog.cours.some(c => c.id === id)).length
                const pct = nbCours > 0 ? (nbTermines / nbCours) * 100 : 0
                const complet = nbCours > 0 && nbTermines === nbCours
                return (
                  <Animated.View key={prog.id} entering={FadeInDown.duration(350).delay(Math.min(i, 8) * 45)}>
                    <PressableScale
                      onPress={() => {
                        Haptics.selectionAsync()
                        router.push(`/programme/${prog.id}` as any)
                      }}
                      style={{
                        backgroundColor: colors.blanc,
                        borderRadius: 18,
                        padding: spacing.md,
                        shadowColor: '#3a4a5c',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.06,
                        shadowRadius: 10,
                        elevation: 2,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                        <View style={{
                          width: 44, height: 44, borderRadius: 22,
                          backgroundColor: complet ? colors.bleu : '#e8f0f8',
                          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <IconListe size={21} color={complet ? 'white' : colors.bleu} />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text numberOfLines={1} style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base, color: colors.texte }}>
                            {prog.nom}
                          </Text>
                          <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: colors.texteMuted, marginTop: 2 }}>
                            {nbCours === 0
                              ? 'Aucun cours pour le moment'
                              : `${nbCours} cours · ${nbTermines} terminé${nbTermines > 1 ? 's' : ''}`}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => supprimerProgramme(prog.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 6, right: 10 }}
                          style={{ padding: 4 }}
                        >
                          <IconCorbeille size={18} />
                        </Pressable>
                      </View>
                      {nbCours > 0 ? (
                        <View style={{ marginTop: spacing.md }}>
                          <BarreProgression pct={pct} remplissage={complet ? colors.or : colors.bleu} />
                        </View>
                      ) : null}
                    </PressableScale>
                  </Animated.View>
                )
              })}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* ── Modal nouveau programme ── */}
      <Modal visible={modalCreer} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalCreer(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.fondCreme }} edges={['top', 'bottom']}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: spacing.xl, paddingVertical: spacing.lg,
            }}>
              <Text style={{ flex: 1, fontFamily: typography.fontFamily.bold, fontSize: typography.size.xl, color: colors.texte }}>
                Nouveau programme
              </Text>
              <Pressable
                onPress={() => setModalCreer(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{
                  width: 34, height: 34, borderRadius: 17,
                  backgroundColor: '#e9ecf1',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <IconFermer size={17} color="#5b6675" />
              </Pressable>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.xl }}>
              <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, letterSpacing: 1.6, color: colors.or, textTransform: 'uppercase', marginBottom: spacing.sm }}>
                Nom du programme
              </Text>
              <TextInput
                value={nomNouv}
                onChangeText={setNomNouv}
                placeholder="Ex : Aqeedah — Débutant"
                placeholderTextColor="#aab4c0"
                returnKeyType="next"
                style={{
                  backgroundColor: colors.blanc, borderRadius: 16,
                  paddingHorizontal: spacing.md, paddingVertical: 14,
                  fontFamily: typography.fontFamily.medium,
                  fontSize: typography.size.md, color: colors.texte,
                  marginBottom: spacing.xl,
                  shadowColor: '#3a4a5c', shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.05, shadowRadius: 8, elevation: 1,
                }}
              />

              <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, letterSpacing: 1.6, color: colors.or, textTransform: 'uppercase', marginBottom: spacing.sm }}>
                Intention (optionnel)
              </Text>
              <TextInput
                value={intentionNouv}
                onChangeText={setIntentionNouv}
                placeholder="Ex : Apprendre les fondements de l'Islam"
                placeholderTextColor="#aab4c0"
                multiline
                style={{
                  backgroundColor: colors.blanc, borderRadius: 16,
                  paddingHorizontal: spacing.md, paddingVertical: 14,
                  fontFamily: typography.fontFamily.medium,
                  fontSize: typography.size.md, color: colors.texte,
                  minHeight: 90, textAlignVertical: 'top',
                  shadowColor: '#3a4a5c', shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.05, shadowRadius: 8, elevation: 1,
                }}
              />

              <Pressable
                onPress={creerProgramme}
                disabled={!nomNouv.trim()}
                style={({ pressed }) => ({
                  marginTop: spacing.xl,
                  backgroundColor: nomNouv.trim() ? colors.bleu : '#c6cfd9',
                  borderRadius: radius.full,
                  paddingVertical: 15,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: pressed ? 0.85 : 1,
                  ...(nomNouv.trim() ? {
                    shadowColor: colors.bleu, shadowOffset: { width: 0, height: 5 },
                    shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
                  } : {}),
                })}
              >
                <IconAjouter size={16} color="white" />
                <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.md, color: 'white' }}>
                  Créer le programme
                </Text>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </View>
  )
}

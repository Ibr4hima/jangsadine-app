import { colors, radius, spacing, typography } from '@/constants/theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { ArrowLeft, Calculator, ChevronRight, Globe, Info, Mail } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, StatusBar, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const STORAGE_KEY = 'jsd_parametres'

type Parametres = {
  methodeCalcPrieres: string
  madhab: string
}

const METHODES = [
  { key: 'MoonsightingCommittee', label: 'Moonsighting Committee', region: 'Europe / Amérique du Nord' },
  { key: 'NorthAmerica', label: 'ISNA', region: 'Amérique du Nord' },
  { key: 'MuslimWorldLeague', label: 'Muslim World League', region: 'Europe / Moyen-Orient' },
  { key: 'Egyptian', label: 'Égyptienne', region: 'Afrique / Moyen-Orient' },
  { key: 'Karachi', label: 'Karachi', region: 'Asie du Sud' },
  { key: 'UmmAlQura', label: 'Umm Al-Qura', region: 'Arabie Saoudite' },
  { key: 'Dubai', label: 'Dubaï', region: 'Émirats Arabes Unis' },
  { key: 'Kuwait', label: 'Koweït', region: 'Koweït' },
  { key: 'Qatar', label: 'Qatar', region: 'Qatar' },
  { key: 'Singapore', label: 'Singapour', region: 'Singapour' },
  { key: 'Tehran', label: 'Téhéran', region: 'Iran' },
]

const MADHABS = [
  { key: 'Shafi', label: 'Shafi\'i / Maliki / Hanbali' },
  { key: 'Hanafi', label: 'Hanafi' },
]

export default function Parametres() {
  const router = useRouter()
  const [params, setParams] = useState<Parametres>({
    methodeCalcPrieres: 'MoonsightingCommittee',
    madhab: 'Shafi',
  })
  const [sectionOuverte, setSectionOuverte] = useState<string | null>(null)

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) setParams(JSON.parse(raw))
    })
  }, [])

  const sauvegarder = async (p: Parametres) => {
    setParams(p)
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(p))
  }

  const methodeActuelle = METHODES.find(m => m.key === params.methodeCalcPrieres)
  const madhabActuel = MADHABS.find(m => m.key === params.madhab)

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
            Préférences
          </Text>
          <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.lg, color: colors.texte }}>
            Paramètres
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120 }}>

        {/* ── Prières ── */}
        <Text style={{
          fontFamily: typography.fontFamily.bold,
          fontSize: typography.size.xs, letterSpacing: 2,
          color: colors.or, textTransform: 'uppercase',
          marginBottom: spacing.md,
        }}>
          Prières
        </Text>

        {/* Méthode de calcul */}
        <View style={{
          backgroundColor: colors.blanc, borderRadius: radius.lg,
          borderWidth: 1, borderColor: colors.bordure,
          marginBottom: spacing.sm, overflow: 'hidden',
        }}>
          <Pressable
            onPress={() => setSectionOuverte(s => s === 'methode' ? null : 'methode')}
            style={{ padding: spacing.md, flexDirection: 'row', alignItems: 'center' }}
          >
            <View style={{
              width: 36, height: 36, borderRadius: radius.md,
              backgroundColor: '#faf3dc', alignItems: 'center', justifyContent: 'center',
              marginRight: spacing.md,
            }}>
              <Calculator size={18} color={colors.orFonce} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base, color: colors.texte }}>
                Méthode de calcul
              </Text>
              <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: colors.texteMuted, marginTop: 2 }}>
                {methodeActuelle?.label}
              </Text>
            </View>
            <ChevronRight size={18} color="#ccc" style={{ transform: [{ rotate: sectionOuverte === 'methode' ? '90deg' : '0deg' }] }} />
          </Pressable>

          {sectionOuverte === 'methode' && (
            <View style={{ borderTopWidth: 1, borderTopColor: colors.bordure }}>
              {METHODES.map(m => (
                <Pressable
                  key={m.key}
                  onPress={() => {
                    sauvegarder({ ...params, methodeCalcPrieres: m.key })
                    setSectionOuverte(null)
                  }}
                  style={{
                    padding: spacing.md,
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: params.methodeCalcPrieres === m.key ? '#f0f7ff' : 'transparent',
                    borderBottomWidth: 1, borderBottomColor: colors.bordure,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontFamily: typography.fontFamily.medium,
                      fontSize: typography.size.base,
                      color: params.methodeCalcPrieres === m.key ? colors.bleu : colors.texte,
                    }}>
                      {m.label}
                    </Text>
                    <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.xs, color: colors.texteMuted, marginTop: 2 }}>
                      {m.region}
                    </Text>
                  </View>
                  {params.methodeCalcPrieres === m.key && (
                    <Text style={{ color: colors.bleu, fontSize: 16 }}>✓</Text>
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Madhab */}
        <View style={{
          backgroundColor: colors.blanc, borderRadius: radius.lg,
          borderWidth: 1, borderColor: colors.bordure,
          marginBottom: spacing.xl, overflow: 'hidden',
        }}>
          <Pressable
            onPress={() => setSectionOuverte(s => s === 'madhab' ? null : 'madhab')}
            style={{ padding: spacing.md, flexDirection: 'row', alignItems: 'center' }}
          >
            <View style={{
              width: 36, height: 36, borderRadius: radius.md,
              backgroundColor: '#e8f0f8', alignItems: 'center', justifyContent: 'center',
              marginRight: spacing.md,
            }}>
              <Globe size={18} color={colors.bleu} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base, color: colors.texte }}>
                Madhab (calcul Asr)
              </Text>
              <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: colors.texteMuted, marginTop: 2 }}>
                {madhabActuel?.label}
              </Text>
            </View>
            <ChevronRight size={18} color="#ccc" style={{ transform: [{ rotate: sectionOuverte === 'madhab' ? '90deg' : '0deg' }] }} />
          </Pressable>

          {sectionOuverte === 'madhab' && (
            <View style={{ borderTopWidth: 1, borderTopColor: colors.bordure }}>
              {MADHABS.map(m => (
                <Pressable
                  key={m.key}
                  onPress={() => {
                    sauvegarder({ ...params, madhab: m.key })
                    setSectionOuverte(null)
                  }}
                  style={{
                    padding: spacing.md,
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: params.madhab === m.key ? '#f0f7ff' : 'transparent',
                  }}
                >
                  <Text style={{
                    flex: 1,
                    fontFamily: typography.fontFamily.medium,
                    fontSize: typography.size.base,
                    color: params.madhab === m.key ? colors.bleu : colors.texte,
                  }}>
                    {m.label}
                  </Text>
                  {params.madhab === m.key && (
                    <Text style={{ color: colors.bleu, fontSize: 16 }}>✓</Text>
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* ── À propos ── */}
        <Text style={{
          fontFamily: typography.fontFamily.bold,
          fontSize: typography.size.xs, letterSpacing: 2,
          color: colors.or, textTransform: 'uppercase',
          marginBottom: spacing.md,
        }}>
          À propos
        </Text>

        <View style={{ gap: spacing.sm }}>
          <View style={{
            backgroundColor: colors.blanc, borderRadius: radius.lg,
            borderWidth: 1, borderColor: colors.bordure,
            padding: spacing.md, flexDirection: 'row', alignItems: 'center',
          }}>
            <View style={{
              width: 36, height: 36, borderRadius: radius.md,
              backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center',
              marginRight: spacing.md,
            }}>
              <Info size={18} color="#666" strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base, color: colors.texte }}>
                Version
              </Text>
              <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: colors.texteMuted }}>
                1.0.0
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => Alert.alert('Contact', 'contact@jangsadine.com')}
            style={{
              backgroundColor: colors.blanc, borderRadius: radius.lg,
              borderWidth: 1, borderColor: colors.bordure,
              padding: spacing.md, flexDirection: 'row', alignItems: 'center',
            }}
          >
            <View style={{
              width: 36, height: 36, borderRadius: radius.md,
              backgroundColor: '#e8f0f8', alignItems: 'center', justifyContent: 'center',
              marginRight: spacing.md,
            }}>
              <Mail size={18} color={colors.bleu} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base, color: colors.texte }}>
                Contact
              </Text>
              <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: colors.texteMuted }}>
                contact@jangsadine.com
              </Text>
            </View>
            <ChevronRight size={18} color="#ccc" />
          </Pressable>
        </View>

        {/* Footer */}
        <View style={{ alignItems: 'center', marginTop: spacing['2xl'] }}>
          <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.base, color: colors.texte }}>
            Jàng sa <Text style={{ color: colors.or }}>Diné</Text>
          </Text>
          <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.xs, color: colors.texteMuted, marginTop: 4 }}>
            Que Allah facilite ton apprentissage
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}
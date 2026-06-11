import { colors, radius, spacing, typography } from '@/constants/theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { geocoderInverse } from '@/lib/geo'
import * as adhan from 'adhan'
import * as Location from 'expo-location'
import * as Notifications from 'expo-notifications'
import { useRouter } from 'expo-router'
import { ArrowLeft, Bell, BellOff } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Alert, Pressable, ScrollView, StatusBar, Switch, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type PriereConfig = {
  nom: string
  icone: string
  active: boolean
  minutesAvant: number
}

const STORAGE_KEY = 'jsd_notifications'
const PRIERES_DEFAULT: PriereConfig[] = [
  { nom: 'Fajr', icone: '🌙', active: true, minutesAvant: 5 },
  { nom: 'Dhuhr', icone: '☀️', active: true, minutesAvant: 5 },
  { nom: 'Asr', icone: '🌤️', active: true, minutesAvant: 5 },
  { nom: 'Maghrib', icone: '🌇', active: true, minutesAvant: 5 },
  { nom: 'Isha', icone: '🌑', active: true, minutesAvant: 5 },
]

function fmt(date: Date) {
  return date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0')
}

function getMethode(countryCode: string): adhan.CalculationParameters {
  const amerique = ['US', 'CA', 'MX']
  const moyen_orient = ['SA', 'AE', 'KW', 'QA']
  if (amerique.includes(countryCode)) return adhan.CalculationMethod.NorthAmerica()
  if (moyen_orient.includes(countryCode)) return adhan.CalculationMethod.MuslimWorldLeague()
  return adhan.CalculationMethod.MoonsightingCommittee()
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export default function NotificationsScreen() {
  const router = useRouter()
  const [prieres, setPrieres] = useState<PriereConfig[]>(PRIERES_DEFAULT)
  const [permissionOk, setPermissionOk] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      // Charger config sauvegardée
      const raw = await AsyncStorage.getItem(STORAGE_KEY)
      if (raw) setPrieres(JSON.parse(raw))

      // Vérifier permission
      const { status } = await Notifications.getPermissionsAsync()
      setPermissionOk(status === 'granted')
      setLoading(false)
    }
    init().catch(e => console.warn('init:', e))
  }, [])

  const demanderPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync()
    setPermissionOk(status === 'granted')
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Active les notifications dans les réglages de ton iPhone.')
    }
    return status === 'granted'
  }

  const sauvegarder = async (config: PriereConfig[]) => {
    setPrieres(config)
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  }

  const togglePriere = async (index: number) => {
    if (!permissionOk) {
      const ok = await demanderPermission()
      if (!ok) return
    }
    const nouv = prieres.map((p, i) => i === index ? { ...p, active: !p.active } : p)
    await sauvegarder(nouv)
    await planifierNotifications(nouv)
  }

  const planifierNotifications = async (config: PriereConfig[]) => {
    // Annuler toutes les notifications existantes
    await Notifications.cancelAllScheduledNotificationsAsync()

    // Obtenir position
    const { status } = await Location.getForegroundPermissionsAsync()
    if (status !== 'granted') return

    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
    const { latitude, longitude } = loc.coords
    const geo = await geocoderInverse(latitude, longitude)
    const countryCode = geo.isoCountryCode ?? 'FR'

    const coords = new adhan.Coordinates(latitude, longitude)
    const params = getMethode(countryCode)

    // Planifier pour les 7 prochains jours
    for (let jour = 0; jour < 7; jour++) {
      const date = new Date()
      date.setDate(date.getDate() + jour)
      const times = new adhan.PrayerTimes(coords, date, params)

      const heures: Record<string, Date> = {
        Fajr: times.fajr,
        Dhuhr: times.dhuhr,
        Asr: times.asr,
        Maghrib: times.maghrib,
        Isha: times.isha,
      }

      for (const priere of config) {
        if (!priere.active) continue
        const heure = heures[priere.nom]
        if (!heure) continue

        const triggerDate = new Date(heure.getTime() - priere.minutesAvant * 60 * 1000)
        if (triggerDate <= new Date()) continue

        await Notifications.scheduleNotificationAsync({
          content: {
            title: `${priere.icone} ${priere.nom}`,
            body: priere.minutesAvant > 0
              ? `La prière de ${priere.nom} commence dans ${priere.minutesAvant} minutes (${fmt(heure)})`
              : `L'heure de ${priere.nom} est arrivée (${fmt(heure)})`,
            sound: true,
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
        })
      }
    }
  }

  const toutActiver = async () => {
    if (!permissionOk) {
      const ok = await demanderPermission()
      if (!ok) return
    }
    const nouv = prieres.map(p => ({ ...p, active: true }))
    await sauvegarder(nouv)
    await planifierNotifications(nouv)
    Alert.alert('✓ Notifications activées', 'Tu recevras des rappels pour toutes les prières.')
  }

  const toutDesactiver = async () => {
    const nouv = prieres.map(p => ({ ...p, active: false }))
    await sauvegarder(nouv)
    await Notifications.cancelAllScheduledNotificationsAsync()
    Alert.alert('Notifications désactivées', 'Tu ne recevras plus de rappels.')
  }

  const nbActives = prieres.filter(p => p.active).length

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
            Rappels
          </Text>
          <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.lg, color: colors.texte }}>
            Notifications
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.xl, paddingBottom: 120 }}>

        {/* Statut permission */}
        <View style={{
          backgroundColor: permissionOk ? '#eaf4ee' : '#fff3e0',
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: permissionOk ? '#2d7a4f' : '#e65100',
          padding: spacing.md,
          flexDirection: 'row', alignItems: 'center',
          marginBottom: spacing.xl,
        }}>
          {permissionOk
            ? <Bell size={20} color="#2d7a4f" style={{ marginRight: spacing.md }} />
            : <BellOff size={20} color="#e65100" style={{ marginRight: spacing.md }} />
          }
          <View style={{ flex: 1 }}>
            <Text style={{
              fontFamily: typography.fontFamily.semibold,
              fontSize: typography.size.base,
              color: permissionOk ? '#2d7a4f' : '#e65100',
            }}>
              {permissionOk ? 'Notifications autorisées' : 'Notifications non autorisées'}
            </Text>
            {!permissionOk && (
              <Pressable onPress={demanderPermission}>
                <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.sm, color: '#e65100', marginTop: 2, textDecorationLine: 'underline' }}>
                  Autoriser les notifications →
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Boutons tout activer/désactiver */}
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl }}>
          <Pressable
            onPress={toutActiver}
            style={{
              flex: 1, backgroundColor: colors.bleu,
              borderRadius: radius.md, paddingVertical: spacing.sm,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.sm, color: 'white' }}>
              Tout activer
            </Text>
          </Pressable>
          <Pressable
            onPress={toutDesactiver}
            style={{
              flex: 1, backgroundColor: colors.blanc,
              borderRadius: radius.md, paddingVertical: spacing.sm,
              alignItems: 'center', borderWidth: 1, borderColor: colors.bordure,
            }}
          >
            <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.sm, color: colors.texteMuted }}>
              Tout désactiver
            </Text>
          </Pressable>
        </View>

        {/* Liste prières */}
        <Text style={{
          fontFamily: typography.fontFamily.bold,
          fontSize: typography.size.xs, letterSpacing: 2,
          color: colors.or, textTransform: 'uppercase',
          marginBottom: spacing.md,
        }}>
          Prières ({nbActives}/{prieres.length} actives)
        </Text>

        <View style={{ gap: spacing.sm }}>
          {prieres.map((p, i) => (
            <View key={p.nom} style={{
              backgroundColor: colors.blanc,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: p.active ? colors.bleu : colors.bordure,
              padding: spacing.md,
              flexDirection: 'row', alignItems: 'center',
            }}>
              <Text style={{ fontSize: 24, marginRight: spacing.md }}>{p.icone}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontFamily: typography.fontFamily.semibold,
                  fontSize: typography.size.base,
                  color: p.active ? colors.texte : colors.texteMuted,
                }}>
                  {p.nom}
                </Text>
                <Text style={{
                  fontFamily: typography.fontFamily.regular,
                  fontSize: typography.size.xs,
                  color: colors.texteMuted, marginTop: 2,
                }}>
                  {p.active ? `Rappel ${p.minutesAvant} min avant` : 'Désactivé'}
                </Text>
              </View>
              <Switch
                value={p.active}
                onValueChange={() => togglePriere(i)}
                trackColor={{ false: '#ddd', true: colors.bleu }}
                thumbColor="white"
              />
            </View>
          ))}
        </View>

        {/* Info */}
        <View style={{
          marginTop: spacing.xl,
          backgroundColor: '#f8f6f1',
          borderRadius: radius.lg,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: colors.bordure,
        }}>
          <Text style={{
            fontFamily: typography.fontFamily.regular,
            fontSize: typography.size.sm,
            color: colors.texteMuted,
            lineHeight: 20,
          }}>
            ℹ️ Les notifications sont planifiées pour les 7 prochains jours selon ta position GPS. Elles se renouvellent automatiquement.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}
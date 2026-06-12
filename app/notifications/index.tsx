import { BoutonHeros, EnTeteSection, HerosDetail, PressableScale, W70 } from '@/components/AudioUI'
import { colors, radius, spacing, typography } from '@/constants/theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { geocoderInverse } from '@/lib/geo'
import * as adhan from 'adhan'
import * as Haptics from 'expo-haptics'
import * as Location from 'expo-location'
import * as Notifications from 'expo-notifications'
import { useFocusEffect } from 'expo-router'
import { CloudMoon, CloudSun, Moon, Sun, Sunset } from 'lucide-react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, AppState, ScrollView, StatusBar, Switch, Text, View } from 'react-native'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'

// ─── icône warning ────────────────────────────────────────────
function IconWarning({ size = 18, color = '#d97706' }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M40-120 480-880l440 760H40Zm138-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z" fill={color} /></Svg>
}

// ─── config ───────────────────────────────────────────────────
const STORAGE_KEY = 'jsd_notifications'
const JOURS_PLAN = 30

type PriereConfig = { nom: string; cle: string; active: boolean }

const PRIERES_DEFAULT: PriereConfig[] = [
  { nom: 'Fajr',    cle: 'fajr',    active: true },
  { nom: 'Dhuhr',   cle: 'dhuhr',   active: true },
  { nom: 'Asr',     cle: 'asr',     active: true },
  { nom: 'Maghrib', cle: 'maghrib', active: true },
  { nom: 'Isha',    cle: 'isha',    active: true },
]

type LuciIcon = { size?: number; color?: string; strokeWidth?: number }
const ICONES_PRIERE: Record<string, React.ComponentType<LuciIcon>> = {
  fajr:    CloudMoon,
  dhuhr:   Sun,
  asr:     CloudSun,
  maghrib: Sunset,
  isha:    Moon,
}

function getMethode(countryCode: string): adhan.CalculationParameters {
  if (['US','CA','MX'].includes(countryCode)) return adhan.CalculationMethod.NorthAmerica()
  if (['SA','AE','KW','QA'].includes(countryCode)) return adhan.CalculationMethod.MuslimWorldLeague()
  return adhan.CalculationMethod.MoonsightingCommittee()
}

function fmt(date: Date) {
  return date.getHours().toString().padStart(2,'0') + ':' + date.getMinutes().toString().padStart(2,'0')
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false,
    shouldShowBanner: true, shouldShowList: true,
  }),
})

// ─── page ─────────────────────────────────────────────────────
export default function NotificationsScreen() {
  const insets = useSafeAreaInsets()
  const [prieres, setPrieres] = useState<PriereConfig[]>(PRIERES_DEFAULT)
  const [permissionOk, setPermissionOk] = useState(false)
  const [loading, setLoading] = useState(true)
  const appStateRef = useRef(AppState.currentState)

  useEffect(() => {
    async function init() {
      const raw = await AsyncStorage.getItem(STORAGE_KEY)
      if (raw) setPrieres(JSON.parse(raw))
      const { status } = await Notifications.getPermissionsAsync()
      setPermissionOk(status === 'granted')
      setLoading(false)
    }
    init().catch(console.warn)
  }, [])

  // Replanifier à chaque retour au premier plan
  useEffect(() => {
    const sub = AppState.addEventListener('change', async next => {
      if (appStateRef.current.match(/inactive|background/) && next === 'active') {
        const raw = await AsyncStorage.getItem(STORAGE_KEY)
        const config: PriereConfig[] = raw ? JSON.parse(raw) : PRIERES_DEFAULT
        if (config.some(p => p.active)) await planifierNotifications(config, false)
      }
      appStateRef.current = next
    })
    return () => sub.remove()
  }, [])

  const demanderPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync()
    setPermissionOk(status === 'granted')
    if (status !== 'granted') Alert.alert('Permission refusée', 'Active les notifications dans les Réglages de ton iPhone.')
    return status === 'granted'
  }

  const sauvegarder = async (config: PriereConfig[]) => {
    setPrieres(config)
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  }

  const planifierNotifications = async (config: PriereConfig[], avecFeedback = true) => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync()
      const { status } = await Location.getForegroundPermissionsAsync()
      if (status !== 'granted') return
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const { latitude, longitude } = loc.coords
      const geo = await geocoderInverse(latitude, longitude)
      const coords = new adhan.Coordinates(latitude, longitude)
      const params = getMethode(geo.isoCountryCode ?? 'FR')
      const CLÉ: Record<string, keyof adhan.PrayerTimes> = {
        fajr:'fajr', dhuhr:'dhuhr', asr:'asr', maghrib:'maghrib', isha:'isha',
      }
      for (let j = 0; j < JOURS_PLAN; j++) {
        const date = new Date(); date.setDate(date.getDate() + j)
        const times = new adhan.PrayerTimes(coords, date, params)
        for (const p of config) {
          if (!p.active) continue
          const heure = times[CLÉ[p.cle]] as Date
          if (!heure || heure <= new Date()) continue
          await Notifications.scheduleNotificationAsync({
            content: { title: p.nom, body: `L'heure de ${p.nom} est arrivée — ${fmt(heure)}`, sound: true },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: heure },
          })
        }
      }
      if (avecFeedback) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (e) { console.warn('planifier:', e) }
  }

  const togglePriere = async (cle: string) => {
    if (!permissionOk) { const ok = await demanderPermission(); if (!ok) return }
    Haptics.selectionAsync()
    const nouv = prieres.map(p => p.cle === cle ? { ...p, active: !p.active } : p)
    await sauvegarder(nouv)
    await planifierNotifications(nouv)
  }

  const toutActiver = async () => {
    if (!permissionOk) { const ok = await demanderPermission(); if (!ok) return }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    const nouv = prieres.map(p => ({ ...p, active: true }))
    await sauvegarder(nouv); await planifierNotifications(nouv)
  }

  const toutDesactiver = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    const nouv = prieres.map(p => ({ ...p, active: false }))
    await sauvegarder(nouv); await Notifications.cancelAllScheduledNotificationsAsync()
  }

  const nbActives = prieres.filter(p => p.active).length

  return (
    <View style={{ flex: 1, backgroundColor: colors.fondCreme }}>
      <StatusBar barStyle="light-content" />

      <HerosDetail paddingTop={insets.top + spacing.sm}>
        <View style={{ alignItems: 'center' }}>
          <View style={{ backgroundColor: 'rgba(214,173,58,0.16)', borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 4, marginBottom: spacing.sm }}>
            <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, letterSpacing: 1.8, color: colors.or, textTransform: 'uppercase' }}>
              Rappels
            </Text>
          </View>
          <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size['2xl'], color: 'white' }}>
            Notifications
          </Text>
        </View>
      </HerosDetail>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.xl, paddingBottom: 140 }}>
        <Animated.View entering={FadeIn.duration(220)}>

          {/* Bannière permission */}
          {!permissionOk && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <PressableScale
                onPress={demanderPermission}
                style={{
                  backgroundColor: '#fffbeb', borderRadius: 18,
                  padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md,
                  marginBottom: spacing.lg, borderWidth: 1.5, borderColor: '#f59e0b',
                  shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.15, shadowRadius: 8, elevation: 3,
                }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <IconWarning size={20} color="#d97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base, color: '#92400e' }}>
                    Autoriser les notifications
                  </Text>
                  <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.xs, color: '#a16207', marginTop: 2 }}>
                    Appuie pour donner l'autorisation →
                  </Text>
                </View>
              </PressableScale>
            </Animated.View>
          )}

          <EnTeteSection eyebrow="Prières" />

          <View style={{ gap: spacing.sm }}>
            {prieres.map((p, i) => {
              const Icone = ICONES_PRIERE[p.cle]
              return (
                <Animated.View key={p.cle} entering={FadeInDown.duration(350).delay(i * 55)}>
                  <View style={{
                    backgroundColor: colors.blanc, borderRadius: 18,
                    padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md,
                    shadowColor: '#3a4a5c', shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
                    borderWidth: p.active ? 1.5 : 0, borderColor: colors.bleu,
                  }}>
                    <View style={{
                      width: 40, height: 40, borderRadius: 20,
                      backgroundColor: p.active ? '#e8f0f8' : '#f4f5f7',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Icone size={20} color={p.active ? colors.bleu : '#aab4c0'} strokeWidth={1.8} />
                    </View>
                    <Text style={{
                      flex: 1,
                      fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base,
                      color: p.active ? colors.texte : colors.texteMuted,
                    }}>
                      {p.nom}
                    </Text>
                    <Switch
                      value={p.active}
                      onValueChange={() => togglePriere(p.cle)}
                      trackColor={{ false: '#e2e8f0', true: colors.bleu }}
                      thumbColor="white"
                      ios_backgroundColor="#e2e8f0"
                    />
                  </View>
                </Animated.View>
              )
            })}
          </View>

          {/* Tout activer / désactiver */}
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl }}>
            <PressableScale
              onPress={toutActiver}
              style={{
                flex: 1, backgroundColor: colors.bleu, borderRadius: 14,
                paddingVertical: 14, alignItems: 'center',
                shadowColor: colors.bleu, shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25, shadowRadius: 8, elevation: 3,
              }}
            >
              <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base, color: 'white' }}>
                Tout activer
              </Text>
            </PressableScale>
            <PressableScale
              onPress={toutDesactiver}
              style={{
                flex: 1, backgroundColor: colors.blanc, borderRadius: 14,
                paddingVertical: 14, alignItems: 'center',
                borderWidth: 1.5, borderColor: '#dde4ec',
                shadowColor: '#3a4a5c', shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
              }}
            >
              <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base, color: colors.texteMuted }}>
                Tout désactiver
              </Text>
            </PressableScale>
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  )
}

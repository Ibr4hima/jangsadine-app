import { BoutonHeros, EnTeteSection, HerosDetail, MiniEgaliseur, PressableScale, W70 } from '@/components/AudioUI'
import { colors, radius, spacing, typography } from '@/constants/theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { geocoderInverse } from '@/lib/geo'
import * as adhan from 'adhan'
import * as Haptics from 'expo-haptics'
import * as Location from 'expo-location'
import * as Notifications from 'expo-notifications'
import { useFocusEffect } from 'expo-router'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, AppState, ScrollView, StatusBar, Switch, Text, View } from 'react-native'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'

// ─── icônes ───────────────────────────────────────────────────
function IconBell({ size = 20, color = 'white' }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M160-200v-80h80v-280q0-83 50-147.5T420-792v-28q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820v28q80 20 130 84.5T720-560v280h80v80H160ZM480-80q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80Z" fill={color} /></Svg>
}
function IconBellOff({ size = 20, color = 'white' }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M160-200v-80h80v-280q0-33 8.5-65t25.5-61l126 126H288L56-792l56-56 736 736-56 56-146-144H160Zm560-154L328-746q20-16 43-28t49-18v-28q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820v28q80 20 130 84.5T720-560v206ZM480-80q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80Z" fill={color} /></Svg>
}
function IconFajr({ size = 20, color = colors.bleu }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M480-120q-150 0-255-105T120-480q0-150 105-255t255-105q14 0 27.5 1t26.5 3q-41 29-65.5 75.5T444-660q0 90 63 153t153 63q55 0 101-24.5t75-65.5q2 13 3 26.5t1 27.5q0 150-105 255T480-120Z" fill={color} /></Svg>
}
function IconDhuhr({ size = 20, color = colors.bleu }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M338.5-338.5Q280-397 280-480t58.5-141.5Q397-680 480-680t141.5 58.5Q680-563 680-480t-58.5 141.5Q563-280 480-280t-141.5-58.5ZM200-440H40v-80h160v80Zm720 0H760v-80h160v80ZM440-760v-160h80v160h-80Zm0 720v-160h80v160h-80ZM256-650l-101-97 57-59 96 100-52 56Zm492 496-97-101 53-55 101 97-57 59Zm-98-550 97-101 59 57-100 96-56-52ZM154-212l101-97 55 53-97 101-59-57Z" fill={color} /></Svg>
}
function IconAsr({ size = 20, color = colors.bleu }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="m734-556-56-58 86-84 56 56-86 86ZM80-160v-80h800v80H80Zm360-520v-120h80v120h-80ZM226-558l-84-86 56-56 86 86-58 56Zm-26 238q0-117 81.5-198.5T480-600q117 0 198.5 81.5T760-320H200Z" fill={color} /></Svg>
}
function IconMaghrib({ size = 20, color = colors.bleu }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M484-80q-84 0-157.5-32t-128-86.5Q144-253 112-326.5T80-484q0-146 93-257.5T410-880q-18 99 11 193.5T521-521q71 71 165.5 100T880-410q-26 144-138 237T484-80Z" fill={color} /></Svg>
}
function IconIsha({ size = 20, color = colors.bleu }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M160-200v-80h80v-280q0-83 50-147.5T420-792v-28q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820v28q80 20 130 84.5T720-560v280h80v80H160ZM480-80q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80ZM80-560q0-100 44.5-183.5T244-882l47 64q-60 44-95.5 111T160-560H80Zm720 0q0-80-35.5-147T669-818l47-64q75 55 119.5 138.5T880-560h-80Z" fill={color} /></Svg>
}
function IconCheck({ size = 16, color = '#2d7a4f' }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" fill={color} /></Svg>
}
function IconWarning({ size = 18, color = '#d97706' }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M40-120 480-880l440 760H40Zm138-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z" fill={color} /></Svg>
}

// ─── config ───────────────────────────────────────────────────
const STORAGE_KEY = 'jsd_notifications'
const JOURS_PLAN = 30

type PriereConfig = {
  nom: string
  cle: string
  active: boolean
  minutesAvant: number
}

const PRIERES_DEFAULT: PriereConfig[] = [
  { nom: 'Fajr',    cle: 'fajr',    active: true, minutesAvant: 5 },
  { nom: 'Dhuhr',   cle: 'dhuhr',   active: true, minutesAvant: 5 },
  { nom: 'Asr',     cle: 'asr',     active: true, minutesAvant: 5 },
  { nom: 'Maghrib', cle: 'maghrib', active: true, minutesAvant: 5 },
  { nom: 'Isha',    cle: 'isha',    active: true, minutesAvant: 5 },
]

const DELAIS = [0, 5, 10, 15, 20]

const ICONES_PRIERE: Record<string, (p: { size?: number; color?: string }) => React.ReactElement> = {
  fajr:    IconFajr,
  dhuhr:   IconDhuhr,
  asr:     IconAsr,
  maghrib: IconMaghrib,
  isha:    IconIsha,
}

function fmt(date: Date) {
  return date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0')
}

function getMethode(countryCode: string): adhan.CalculationParameters {
  const amerique = ['US', 'CA', 'MX']
  const moyenOrient = ['SA', 'AE', 'KW', 'QA']
  if (amerique.includes(countryCode)) return adhan.CalculationMethod.NorthAmerica()
  if (moyenOrient.includes(countryCode)) return adhan.CalculationMethod.MuslimWorldLeague()
  return adhan.CalculationMethod.MoonsightingCommittee()
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
  const [planification, setPlanification] = useState(false)
  const [heuresAujourdhui, setHeuresAujourdhui] = useState<Record<string, string>>({})
  const [delaiOuvert, setDelaiOuvert] = useState<string | null>(null)
  const appStateRef = useRef(AppState.currentState)

  // Charger au montage
  useEffect(() => {
    async function init() {
      const raw = await AsyncStorage.getItem(STORAGE_KEY)
      if (raw) setPrieres(JSON.parse(raw))
      const { status } = await Notifications.getPermissionsAsync()
      setPermissionOk(status === 'granted')
      setLoading(false)
      await chargerHeures()
    }
    init().catch(console.warn)
  }, [])

  // Replanifier quand l'app revient au premier plan
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (next) => {
      if (appStateRef.current.match(/inactive|background/) && next === 'active') {
        const raw = await AsyncStorage.getItem(STORAGE_KEY)
        const config: PriereConfig[] = raw ? JSON.parse(raw) : PRIERES_DEFAULT
        if (config.some(p => p.active)) {
          await planifierNotifications(config, false)
          await chargerHeures()
        }
      }
      appStateRef.current = next
    })
    return () => sub.remove()
  }, [])

  // Recharger les horaires au focus
  useFocusEffect(useCallback(() => { chargerHeures() }, []))

  const chargerHeures = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync()
      if (status !== 'granted') return
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const { latitude, longitude } = loc.coords
      const geo = await geocoderInverse(latitude, longitude)
      const coords = new adhan.Coordinates(latitude, longitude)
      const params = getMethode(geo.isoCountryCode ?? 'FR')
      const times = new adhan.PrayerTimes(coords, new Date(), params)
      setHeuresAujourdhui({
        fajr: fmt(times.fajr), dhuhr: fmt(times.dhuhr),
        asr: fmt(times.asr), maghrib: fmt(times.maghrib), isha: fmt(times.isha),
      })
    } catch { /* pas de GPS → pas d'horaires affichés */ }
  }

  const demanderPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync()
    setPermissionOk(status === 'granted')
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Active les notifications dans les Réglages de ton iPhone.')
    }
    return status === 'granted'
  }

  const sauvegarder = async (config: PriereConfig[]) => {
    setPrieres(config)
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  }

  const planifierNotifications = async (config: PriereConfig[], avecFeedback = true) => {
    setPlanification(true)
    try {
      await Notifications.cancelAllScheduledNotificationsAsync()

      const { status } = await Location.getForegroundPermissionsAsync()
      if (status !== 'granted') { setPlanification(false); return }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const { latitude, longitude } = loc.coords
      const geo = await geocoderInverse(latitude, longitude)
      const coords = new adhan.Coordinates(latitude, longitude)
      const params = getMethode(geo.isoCountryCode ?? 'FR')

      const CLÉ_ADHAN: Record<string, keyof adhan.PrayerTimes> = {
        fajr: 'fajr', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'maghrib', isha: 'isha',
      }

      for (let j = 0; j < JOURS_PLAN; j++) {
        const date = new Date()
        date.setDate(date.getDate() + j)
        const times = new adhan.PrayerTimes(coords, date, params)

        for (const p of config) {
          if (!p.active) continue
          const heure = times[CLÉ_ADHAN[p.cle]] as Date
          if (!heure) continue
          const trigger = new Date(heure.getTime() - p.minutesAvant * 60_000)
          if (trigger <= new Date()) continue

          await Notifications.scheduleNotificationAsync({
            content: {
              title: p.nom,
              body: p.minutesAvant > 0
                ? `La prière de ${p.nom} commence dans ${p.minutesAvant} min (${fmt(heure)})`
                : `L'heure de ${p.nom} est arrivée — ${fmt(heure)}`,
              sound: true,
            },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger },
          })
        }
      }
      if (avecFeedback) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch (e) {
      console.warn('planifier:', e)
    }
    setPlanification(false)
  }

  const togglePriere = async (cle: string) => {
    if (!permissionOk) {
      const ok = await demanderPermission()
      if (!ok) return
    }
    Haptics.selectionAsync()
    const nouv = prieres.map(p => p.cle === cle ? { ...p, active: !p.active } : p)
    await sauvegarder(nouv)
    await planifierNotifications(nouv)
  }

  const changerDelai = async (cle: string, minutes: number) => {
    Haptics.selectionAsync()
    const nouv = prieres.map(p => p.cle === cle ? { ...p, minutesAvant: minutes } : p)
    await sauvegarder(nouv)
    if (nouv.some(p => p.active)) await planifierNotifications(nouv)
    setDelaiOuvert(null)
  }

  const toutActiver = async () => {
    if (!permissionOk) {
      const ok = await demanderPermission()
      if (!ok) return
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    const nouv = prieres.map(p => ({ ...p, active: true }))
    await sauvegarder(nouv)
    await planifierNotifications(nouv)
  }

  const toutDesactiver = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    const nouv = prieres.map(p => ({ ...p, active: false }))
    await sauvegarder(nouv)
    await Notifications.cancelAllScheduledNotificationsAsync()
  }

  const nbActives = prieres.filter(p => p.active).length
  const toutesActives = nbActives === prieres.length

  return (
    <View style={{ flex: 1, backgroundColor: colors.fondCreme }}>
      <StatusBar barStyle="light-content" />

      {/* ── Héros ── */}
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
          {!loading && (
            <View style={{ marginTop: spacing.lg }}>
              <BoutonHeros
                icone={toutesActives
                  ? <MiniEgaliseur color={colors.or} hauteur={12} />
                  : <IconBell size={15} color="white" />}
                label={toutesActives ? `${nbActives} prières actives` : nbActives > 0 ? `${nbActives} / ${prieres.length} actives` : 'Tout activer'}
                onPress={toutesActives ? toutDesactiver : toutActiver}
                actif={nbActives > 0}
              />
            </View>
          )}
        </View>
      </HerosDetail>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.xl, paddingBottom: 140 }}>
        <Animated.View entering={FadeIn.duration(220)}>

          {/* ── Bannière permission ── */}
          {!permissionOk && (
            <Animated.View entering={FadeInDown.duration(300)}>
              <PressableScale
                onPress={demanderPermission}
                style={{
                  backgroundColor: '#fffbeb',
                  borderRadius: 18,
                  padding: spacing.md,
                  flexDirection: 'row', alignItems: 'center', gap: spacing.md,
                  marginBottom: spacing.lg,
                  borderWidth: 1.5, borderColor: '#f59e0b',
                  shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.15, shadowRadius: 8, elevation: 3,
                }}
              >
                <View style={{
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: '#fef3c7',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
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

          {/* ── Prières ── */}
          <EnTeteSection eyebrow="Prières du jour" />
          <View style={{ gap: spacing.sm }}>
            {prieres.map((p, i) => {
              const IcoPriere = ICONES_PRIERE[p.cle]
              const heure = heuresAujourdhui[p.cle]
              const delaisOuvert = delaiOuvert === p.cle

              return (
                <Animated.View key={p.cle} entering={FadeInDown.duration(350).delay(i * 55)}>
                  <View style={{
                    backgroundColor: colors.blanc,
                    borderRadius: 18,
                    overflow: 'hidden',
                    shadowColor: '#3a4a5c', shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
                    borderWidth: p.active ? 1.5 : 0,
                    borderColor: p.active ? colors.bleu : 'transparent',
                  }}>
                    {/* Ligne principale */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md }}>
                      <View style={{
                        width: 40, height: 40, borderRadius: 20,
                        backgroundColor: p.active ? '#e8f0f8' : '#f4f5f7',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        ...(p.active ? {
                          shadowColor: colors.bleu, shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.15, shadowRadius: 4, elevation: 2,
                        } : {}),
                      }}>
                        <IcoPriere size={20} color={p.active ? colors.bleu : '#aab4c0'} />
                      </View>

                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{
                          fontFamily: typography.fontFamily.semibold,
                          fontSize: typography.size.base,
                          color: p.active ? colors.texte : colors.texteMuted,
                        }}>
                          {p.nom}
                        </Text>
                        {heure ? (
                          <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.xs, color: p.active ? colors.bleu : '#aab4c0', marginTop: 2, fontVariant: ['tabular-nums'] }}>
                            {heure}{p.active && p.minutesAvant > 0 ? ` · −${p.minutesAvant} min` : ''}
                          </Text>
                        ) : null}
                      </View>

                      <Switch
                        value={p.active}
                        onValueChange={() => togglePriere(p.cle)}
                        trackColor={{ false: '#e2e8f0', true: colors.bleu }}
                        thumbColor="white"
                        ios_backgroundColor="#e2e8f0"
                      />
                    </View>

                    {/* Sélecteur de délai */}
                    {p.active ? (
                      <PressableScale
                        onPress={() => {
                          Haptics.selectionAsync()
                          setDelaiOuvert(delaisOuvert ? null : p.cle)
                        }}
                        style={{
                          marginHorizontal: spacing.md,
                          marginBottom: spacing.md,
                          paddingHorizontal: spacing.md, paddingVertical: 10,
                          backgroundColor: delaisOuvert ? '#e8f0f8' : '#f4f7fc',
                          borderRadius: 12,
                          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                        }}
                      >
                        <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.xs, color: colors.bleu }}>
                          Rappel avant la prière
                        </Text>
                        <View style={{
                          backgroundColor: colors.bleu, borderRadius: radius.full,
                          paddingHorizontal: 10, paddingVertical: 4,
                        }}>
                          <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, color: 'white' }}>
                            {p.minutesAvant === 0 ? 'À l\'heure' : `${p.minutesAvant} min`}
                          </Text>
                        </View>
                      </PressableScale>
                    ) : null}

                    {/* Chips délai */}
                    {delaisOuvert ? (
                      <Animated.View entering={FadeIn.duration(180)} style={{
                        flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
                        paddingHorizontal: spacing.md, paddingBottom: spacing.md,
                      }}>
                        {DELAIS.map(d => (
                          <PressableScale
                            key={d}
                            onPress={() => changerDelai(p.cle, d)}
                            style={{
                              paddingHorizontal: 14, paddingVertical: 7,
                              borderRadius: radius.full,
                              backgroundColor: p.minutesAvant === d ? colors.bleu : '#edf2f8',
                              flexDirection: 'row', alignItems: 'center', gap: 4,
                            }}
                          >
                            {p.minutesAvant === d ? <IconCheck size={12} color="white" /> : null}
                            <Text style={{
                              fontFamily: typography.fontFamily.semibold,
                              fontSize: typography.size.sm,
                              color: p.minutesAvant === d ? 'white' : colors.bleu,
                            }}>
                              {d === 0 ? 'À l\'heure' : `${d} min`}
                            </Text>
                          </PressableScale>
                        ))}
                      </Animated.View>
                    ) : null}
                  </View>
                </Animated.View>
              )
            })}
          </View>

          {/* ── Indicateur planification ── */}
          {planification ? (
            <Animated.View entering={FadeIn.duration(200)} style={{ alignItems: 'center', marginTop: spacing.lg }}>
              <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: colors.texteMuted }}>
                Mise à jour des rappels…
              </Text>
            </Animated.View>
          ) : permissionOk && nbActives > 0 ? (
            <Animated.View entering={FadeIn.duration(300)} style={{
              flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
              marginTop: spacing.xl, justifyContent: 'center',
            }}>
              <View style={{
                width: 24, height: 24, borderRadius: 12,
                backgroundColor: '#eaf4ee', alignItems: 'center', justifyContent: 'center',
              }}>
                <IconCheck size={14} color="#2d7a4f" />
              </View>
              <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.sm, color: '#4a9b6a' }}>
                Rappels actifs · se renouvellent automatiquement
              </Text>
            </Animated.View>
          ) : null}

        </Animated.View>
      </ScrollView>
    </View>
  )
}

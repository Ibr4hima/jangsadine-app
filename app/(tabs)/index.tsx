import { colors, radius, spacing, typography } from '@/constants/theme'
import { useTabBar } from '@/contexts/TabBarContext'
import * as adhan from 'adhan'
import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
  Animated, Dimensions,
  Image as RNImage,
  Pressable, StatusBar, Text, View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'

const { width } = Dimensions.get('window')

function IconApps({ size = 28, color = colors.texte }: { size?: number, color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M183.5-183.5Q160-207 160-240t23.5-56.5Q207-320 240-320t56.5 23.5Q320-273 320-240t-23.5 56.5Q273-160 240-160t-56.5-23.5Zm240 0Q400-207 400-240t23.5-56.5Q447-320 480-320t56.5 23.5Q560-273 560-240t-23.5 56.5Q513-160 480-160t-56.5-23.5Zm240 0Q640-207 640-240t23.5-56.5Q687-320 720-320t56.5 23.5Q800-273 800-240t-23.5 56.5Q753-160 720-160t-56.5-23.5Zm-480-240Q160-447 160-480t23.5-56.5Q207-560 240-560t56.5 23.5Q320-513 320-480t-23.5 56.5Q273-400 240-400t-56.5-23.5Zm240 0Q400-447 400-480t23.5-56.5Q447-560 480-560t56.5 23.5Q560-513 560-480t-23.5 56.5Q513-400 480-400t-56.5-23.5Zm240 0Q640-447 640-480t23.5-56.5Q687-560 720-560t56.5 23.5Q800-513 800-480t-23.5 56.5Q753-400 720-400t-56.5-23.5Zm-480-240Q160-687 160-720t23.5-56.5Q207-800 240-800t56.5 23.5Q320-753 320-720t-23.5 56.5Q273-640 240-640t-56.5-23.5Zm240 0Q400-687 400-720t23.5-56.5Q447-800 480-800t56.5 23.5Q560-753 560-720t-23.5 56.5Q513-640 480-640t-56.5-23.5Zm240 0Q640-687 640-720t23.5-56.5Q687-800 720-800t56.5 23.5Q800-753 800-720t-23.5 56.5Q753-640 720-640t-56.5-23.5Z" fill={color} /></Svg>
}
function IconHeadphones({ size = 28, color = '#1f1f1f' }: { size?: number, color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M360-120H200q-33 0-56.5-23.5T120-200v-280q0-75 28.5-140.5t77-114q48.5-48.5 114-77T480-840q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-480v280q0 33-23.5 56.5T760-120H600v-320h160v-40q0-117-81.5-198.5T480-760q-117 0-198.5 81.5T200-480v40h160v320Zm-80-240h-80v160h80v-160Zm400 0v160h80v-160h-80Zm-400 0h-80 80Zm400 0h80-80Z" fill={color} /></Svg>
}
function IconPrayer({ size = 28, color = '#1f1f1f' }: { size?: number, color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="m521-500 59-43 58 43-23-68 59-43h-72l-22-69-22 69h-73l59 43-23 68Zm-41 220q83 0 141.5-58T680-480q0-8-.5-16t-2.5-16q-11 47-49 77.5T539-404q-60 0-101-41t-41-101q0-46 26-82.5t68-51.5h-11q-84 0-142 58.5T280-480q0 84 58 142t142 58Zm0 252L346-160H160v-186L28-480l132-134v-186h186l134-132 134 132h186v186l132 134-132 134v186H614L480-28Zm0-112 100-100h140v-140l100-100-100-100v-140H580L480-820 380-720H240v140L140-480l100 100v140h140l100 100Zm0-340Z" fill={color} /></Svg>
}
function IconBookRibbon({ size = 28, color = '#1f1f1f' }: { size?: number, color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M440-278v-394q-41-24-87-36t-93-12q-36 0-71.5 7T120-692v396q35-12 69.5-18t70.5-6q47 0 91.5 10.5T440-278Zm40 118q-48-38-104-59t-116-21q-42 0-82.5 11T100-198q-21 11-40.5-1T40-234v-482q0-11 5.5-21T62-752q46-24 96-36t102-12q74 0 126 17t112 52q11 6 16.5 14t5.5 21v418q44-21 88.5-31.5T700-320q36 0 70.5 6t69.5 18v-481q15 5 29.5 11t28.5 14q11 5 16.5 15t5.5 21v482q0 23-19.5 35t-40.5 1q-37-20-77.5-31T700-240q-60 0-116 21t-104 59Zm140-240v-440l120-40v440l-120 40Zm-340-99Z" fill={color} /></Svg>
}
function IconExplore({ size = 28, color = '#1f1f1f' }: { size?: number, color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="m300-300 280-80 80-280-280 80-80 280Zm180-120q-25 0-42.5-17.5T420-480q0-25 17.5-42.5T480-540q25 0 42.5 17.5T540-480q0 25-17.5 42.5T480-420Zm0 340q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q133 0 226.5-93.5T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160Zm0-320Z" fill={color} /></Svg>
}

function enMinutes(h: string) {
  const [hh, mm] = h.split(':').map(Number)
  return hh * 60 + mm
}
function nowMin() {
  const n = new Date()
  return n.getHours() * 60 + n.getMinutes()
}
function fmt(date: Date) {
  return date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0')
}
function tempsRestant(heure: string): string {
  const now = new Date()
  const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
  let cibleSec = enMinutes(heure) * 60
  if (cibleSec <= nowSec) cibleSec += 86400
  const diff = cibleSec - nowSec
  const hh = Math.floor(diff / 3600)
  const mm = Math.floor((diff % 3600) / 60)
  const ss = diff % 60
  return hh.toString().padStart(2, '0') + ':' + mm.toString().padStart(2, '0') + ':' + ss.toString().padStart(2, '0')
}

const CARD_W = (width - spacing.xl * 2 - spacing.md) / 2

const SECTIONS = [
  { label: 'Cours audio',        icon: IconHeadphones, href: '/audio',          },
  { label: 'Heures de prières',  icon: IconPrayer,     href: '/(tabs)/prieres', },
  { label: 'Mon Programme',      icon: IconBookRibbon, href: '/programme',      },
  { label: 'Qibla',              icon: IconExplore,    href: '/qibla',          },
]

export default function Accueil() {
  const router = useRouter()
  const { showTabBar, hideTabBar } = useTabBar()
  const [prochaine, setProchaine] = useState<{ nom: string, heure: string } | null>(null)
  const [tick, setTick] = useState(0)
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => { hideTabBar() }, [])

  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  useEffect(() => {
    async function init() {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') return
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const { latitude, longitude } = loc.coords
      const geo = await Location.reverseGeocodeAsync({ latitude, longitude })
      const countryCode = geo[0]?.isoCountryCode ?? 'FR'
      const coords = new adhan.Coordinates(latitude, longitude)
      let params = adhan.CalculationMethod.MoonsightingCommittee()
      if (['US','CA','MX'].includes(countryCode)) params = adhan.CalculationMethod.NorthAmerica()
      if (['SA','AE','KW'].includes(countryCode)) params = adhan.CalculationMethod.UmmAlQura()
      const times = new adhan.PrayerTimes(coords, new Date(), params)
      const prieres = [
        { nom: 'Fajr',    heure: fmt(times.fajr)    },
        { nom: 'Dhuhr',   heure: fmt(times.dhuhr)   },
        { nom: 'Asr',     heure: fmt(times.asr)     },
        { nom: 'Maghrib', heure: fmt(times.maghrib) },
        { nom: 'Isha',    heure: fmt(times.isha)    },
      ]
      const now = nowMin()
      const p = prieres.find(p => enMinutes(p.heure) > now) ?? prieres[0]
      setProchaine(p)
    }
    init()
  }, [])

  const naviguer = (href: string) => {
    showTabBar()
    router.push(href as any)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.fondCreme }} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      <View style={{ flex: 1, paddingHorizontal: spacing.xl, justifyContent: 'space-between', paddingBottom: spacing.lg }}>

        {/* Dynamic Island prière */}
        <View style={{ alignItems: 'center', paddingTop: spacing.sm }}>
          {prochaine ? (
            <Animated.View style={{
              transform: [{ scale: pulseAnim }],
              backgroundColor: '#EBEBEB',
              borderRadius: 30,
              borderWidth: 1,
              borderColor: colors.bleu,
              paddingHorizontal: spacing.xl,
              paddingVertical: 10,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
            }}>
              <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.lg, color: colors.bleu }}>
                {prochaine.nom}  {prochaine.heure}
              </Text>
              <Text style={{ fontFamily: typography.fontFamily.medium, fontSize: typography.size.sm, color: colors.bleu, opacity: 0.6 }}>
                dans {tempsRestant(prochaine.heure)}
              </Text>
            </Animated.View>
          ) : <View style={{ height: 44 }} />}
        </View>

        {/* Centre + Explorer groupés */}
        <View style={{ alignItems: 'center', gap: spacing.lg }}>

          {/* 4 sections */}
          <View style={{ width: '100%', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
            {SECTIONS.map(s => {
              const Icon = s.icon
              return (
                <Pressable
                  key={s.label}
                  onPress={() => naviguer(s.href)}
                  style={({ pressed }) => ({
                    width: CARD_W,
                    height: CARD_W * 1.2,
                    backgroundColor: colors.blanc,
                    borderRadius: radius.xl,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: spacing.lg,
                    paddingBottom: spacing.sm,
                    paddingHorizontal: spacing.sm,
                    opacity: pressed ? 0.85 : 1,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.07,
                    shadowRadius: 16,
                    elevation: 4,
                  })}
                >
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={48} color={colors.bleu} />
                  </View>
                  <View style={{
                    backgroundColor: '#EBEBEB',
                    borderRadius: radius.full,
                    borderWidth: 1,
                    borderColor: colors.bleu,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: 4,
                  }}>
                  <Text style={{
                    fontFamily: typography.fontFamily.semibold,
                    fontSize: typography.size.sm,
                    color: colors.bleu,
                    textAlign: 'center',
                    lineHeight: 18,
                  }}>
                    {s.label}
                  </Text>
                  </View>
                </Pressable>
              )
            })}
          </View>

          {/* Bouton Explorer — suit les sections */}
          <Pressable
            onPress={() => naviguer('/audio')}
            style={({ pressed }) => ({
              width: 52, height: 52, borderRadius: 26,
              backgroundColor: '#EBEBEB',
              borderWidth: 1, borderColor: colors.bleu,
              alignItems: 'center', justifyContent: 'center',
              opacity: pressed ? 0.7 : 1,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 3,
              marginTop: spacing.sm,
            })}
          >
            <IconApps size={24} color={colors.bleu} />
          </Pressable>

        </View>



      </View>
    </SafeAreaView>
  )
}

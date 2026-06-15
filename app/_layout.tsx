import LecteurPersistant from '@/components/LecteurPersistant'
import LecteurPleinEcran from '@/components/LecteurPleinEcran'
import { colors, spacing, typography } from '@/constants/theme'
import { AudioProvider, useAudio } from '@/contexts/AudioContext'
import { NotesProvider } from '@/contexts/NotesContext'
import { ScrollProvider } from '@/contexts/ScrollContext'
import { TabBarProvider, useTabBar } from '@/contexts/TabBarContext'
import { TelechargementProvider } from '@/contexts/TelechargementContext'
import { LinearGradient } from 'expo-linear-gradient'
import { useFonts } from 'expo-font'
import * as Haptics from 'expo-haptics'
import { Stack, usePathname, useRouter } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { ComponentType, useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'

const BG_L = '#3d6ba3'
const BG_R = '#1c3d66'

SplashScreen.preventAutoHideAsync()

type IconProps = { size?: number; color?: string }

function IconHome({ size = 24, color = '#1f1f1f' }: IconProps) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z" fill={color} /></Svg>
}
function IconHomeFill({ size = 24, color = '#1f1f1f' }: IconProps) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M160-120v-480l320-240 320 240v480H560v-280H400v280H160Z" fill={color} /></Svg>
}
function IconHeadphones({ size = 24, color = '#1f1f1f' }: IconProps) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M360-120H200q-33 0-56.5-23.5T120-200v-280q0-75 28.5-140.5t77-114q48.5-48.5 114-77T480-840q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-480v280q0 33-23.5 56.5T760-120H600v-320h160v-40q0-117-81.5-198.5T480-760q-117 0-198.5 81.5T200-480v40h160v320Zm-80-240h-80v160h80v-160Zm400 0v160h80v-160h-80Zm-400 0h-80 80Zm400 0h80-80Z" fill={color} /></Svg>
}
function IconHeadphonesFill({ size = 24, color = '#1f1f1f' }: IconProps) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M360-120H200q-33 0-56.5-23.5T120-200v-280q0-75 28.5-140.5t77-114q48.5-48.5 114-77T480-840q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-480v280q0 33-23.5 56.5T760-120H600v-320h160v-40q0-117-81.5-198.5T480-760q-117 0-198.5 81.5T200-480v40h160v320Z" fill={color} /></Svg>
}
function IconPrayer({ size = 24, color = '#1f1f1f' }: IconProps) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="m521-500 59-43 58 43-23-68 59-43h-72l-22-69-22 69h-73l59 43-23 68Zm-41 220q83 0 141.5-58T680-480q0-8-.5-16t-2.5-16q-11 47-49 77.5T539-404q-60 0-101-41t-41-101q0-46 26-82.5t68-51.5h-11q-84 0-142 58.5T280-480q0 84 58 142t142 58Zm0 252L346-160H160v-186L28-480l132-134v-186h186l134-132 134 132h186v186l132 134-132 134v186H614L480-28Zm0-112 100-100h140v-140l100-100-100-100v-140H580L480-820 380-720H240v140L140-480l100 100v140h140l100 100Zm0-340Z" fill={color} /></Svg>
}
function IconPrayerFill({ size = 24, color = '#1f1f1f' }: IconProps) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M480-28 346-160H160v-186L28-480l132-134v-186h186l134-132 134 132h186v186l132 134-132 134v186H614L480-28Zm0-252q83 0 141.5-58T680-480q0-8-.5-16t-2.5-16q-11 47-49 77.5T539-404q-60 0-101-41t-41-101q0-46 26-82.5t68-51.5h-11q-84 0-142 58.5T280-480q0 84 58 142t142 58Zm41-220 59-43 58 43-23-68 59-43h-72l-22-69-22 69h-73l59 43-23 68Z" fill={color} /></Svg>
}
function IconMore({ size = 24, color = '#1f1f1f' }: IconProps) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M240-400q-33 0-56.5-23.5T160-480q0-33 23.5-56.5T240-560q33 0 56.5 23.5T320-480q0 33-23.5 56.5T240-400Zm240 0q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm240 0q-33 0-56.5-23.5T640-480q0-33 23.5-56.5T720-560q33 0 56.5 23.5T800-480q0 33-23.5 56.5T720-400Z" fill={color} /></Svg>
}

const TABS: {
  key: string
  label: string
  icon: ComponentType<IconProps>
  iconFill: ComponentType<IconProps>
  href: string
}[] = [
  { key: 'index', label: 'Accueil', icon: IconHome, iconFill: IconHomeFill, href: '/' },
  { key: 'audio', label: 'Audio', icon: IconHeadphones, iconFill: IconHeadphonesFill, href: '/audio' },
  { key: 'prieres', label: 'Prières', icon: IconPrayer, iconFill: IconPrayerFill, href: '/(tabs)/prieres' },
]

const INACTIF = '#8e98a4'

// ─── onglet avec pop d'icône à l'activation ───────────────────
function TabItem({ tab, actif, onPress }: {
  tab: typeof TABS[number]
  actif: boolean
  onPress: () => void
}) {
  const scale = useSharedValue(1)

  useEffect(() => {
    if (actif) {
      scale.value = withSequence(
        withSpring(1.18, { damping: 13, stiffness: 320 }),
        withSpring(1, { damping: 15, stiffness: 240 }),
      )
    }
  }, [actif])

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const Icon = actif ? tab.iconFill : tab.icon
  return (
    <Pressable
      onPress={onPress}
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, gap: 2, zIndex: 1 }}
    >
      <Animated.View style={iconStyle}>
        <Icon size={23} color={actif ? colors.bleu : INACTIF} />
      </Animated.View>
      <Text style={{
        fontFamily: actif ? typography.fontFamily.bold : typography.fontFamily.medium,
        fontSize: 10,
        color: actif ? colors.bleu : INACTIF,
        letterSpacing: actif ? 0.1 : 0,
      }}>
        {tab.label}
      </Text>
      {/* Point doré sous le label quand actif */}
      <View style={{ height: 4, alignItems: 'center', justifyContent: 'center' }}>
        {actif && (
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.or }} />
        )}
      </View>
    </Pressable>
  )
}

function AppShell() {
  const pathname = usePathname()
  const router = useRouter()
  const { tabBarVisible } = useTabBar()
  const { piste } = useAudio()

  const [barW, setBarW] = useState(0)

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/' || pathname === '/index'
    if (href === '/(tabs)/prieres') return pathname.includes('prieres')
    return pathname.startsWith(href.replace('/(tabs)', ''))
  }

  const activeIndex = TABS.findIndex(t => isActive(t.href))
  const tabW = barW > 0 ? (barW - 12) / TABS.length : 0

  // pastille glissante derrière l'onglet actif
  const pillX = useSharedValue(0)
  const pillOp = useSharedValue(0)

  useEffect(() => {
    if (activeIndex >= 0 && tabW > 0) {
      if (pillOp.value === 0) {
        // première apparition : positionner sans glisser
        pillX.value = activeIndex * tabW
      } else {
        pillX.value = withSpring(activeIndex * tabW, { damping: 19, stiffness: 200, mass: 0.7 })
      }
      pillOp.value = withTiming(1, { duration: 160 })
    } else {
      pillOp.value = withTiming(0, { duration: 160 })
    }
  }, [activeIndex, tabW])

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillX.value }],
    opacity: pillOp.value,
  }))

  const naviguerTab = (href: string) => {
    if (isActive(href)) return
    Haptics.selectionAsync()
    router.push(href as any)
  }

  const plusActif = isActive('/plus')

  return (
    <View style={{ flex: 1, backgroundColor: colors.fondCreme }}>
      <Stack screenOptions={{ headerShown: false }} />
      {piste && <LecteurPleinEcran />}

      {tabBarVisible && (
        <SafeAreaView edges={['bottom']} style={{ backgroundColor: 'transparent' }}>
          <View style={{ marginHorizontal: spacing.lg, marginBottom: 6, gap: spacing.sm }}>
            <LecteurPersistant />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              {/* Barre principale */}
              <View
                onLayout={e => setBarW(e.nativeEvent.layout.width)}
                style={{
                  flex: 1, flexDirection: 'row',
                  backgroundColor: colors.blanc,
                  borderRadius: 28, padding: 6,
                  shadowColor: '#0d1c30',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.14,
                  shadowRadius: 20,
                  elevation: 8,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.9)',
                }}
              >
                {/* Pastille glissante derrière l'onglet actif */}
                {tabW > 0 && (
                  <Animated.View style={[{
                    position: 'absolute',
                    left: 6, top: 6, bottom: 6,
                    width: tabW,
                    borderRadius: 22,
                    backgroundColor: 'rgba(45,87,140,0.10)',
                    borderWidth: 1,
                    borderColor: 'rgba(45,87,140,0.14)',
                  }, pillStyle]} />
                )}
                {TABS.map(tab => (
                  <TabItem
                    key={tab.key}
                    tab={tab}
                    actif={isActive(tab.href)}
                    onPress={() => naviguerTab(tab.href)}
                  />
                ))}
              </View>

              {/* Bouton Plus */}
              <Pressable
                onPress={() => {
                  if (!plusActif) {
                    Haptics.selectionAsync()
                    router.push('/plus' as any)
                  }
                }}
                style={({ pressed }) => ({
                  width: 60,
                  alignSelf: 'stretch',
                  borderRadius: 28,
                  overflow: 'hidden',
                  shadowColor: plusActif ? colors.bleu : '#0d1c30',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: plusActif ? 0.30 : 0.12,
                  shadowRadius: 18,
                  elevation: 8,
                  transform: [{ scale: pressed ? 0.94 : 1 }],
                })}
              >
                {plusActif ? (
                  <LinearGradient
                    colors={[BG_L, BG_R]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <IconMore size={22} color="white" />
                  </LinearGradient>
                ) : (
                  <View style={{
                    flex: 1, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: colors.blanc,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.9)',
                    borderRadius: 28,
                  }}>
                    <IconMore size={22} color={INACTIF} />
                  </View>
                )}
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      )}
    </View>
  )
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    GoogleSans_Regular: require('../assets/fonts/GoogleSans_17pt-Regular.ttf'),
    GoogleSans_Medium: require('../assets/fonts/GoogleSans_17pt-Medium.ttf'),
    GoogleSans_SemiBold: require('../assets/fonts/GoogleSans_17pt-SemiBold.ttf'),
    GoogleSans_Bold: require('../assets/fonts/GoogleSans_17pt-Bold.ttf'),
    IBMPlexSansArabic: require('../assets/fonts/IBMPlexSansArabic-Regular.ttf'),
    UthmanicHafs: require('../assets/fonts/UthmanicHafs1Ver18.ttf'),
  })

  useEffect(() => {
    if (fontsLoaded || fontError) {
      if (fontError) console.error('Erreur fonts:', fontError)
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  if (!fontsLoaded && !fontError) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AudioProvider>
        <NotesProvider>
          <TelechargementProvider>
            <ScrollProvider>
              <TabBarProvider>
                <AppShell />
              </TabBarProvider>
            </ScrollProvider>
          </TelechargementProvider>
        </NotesProvider>
      </AudioProvider>
    </GestureHandlerRootView>
  )
}

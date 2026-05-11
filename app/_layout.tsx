import LecteurPersistant from '@/components/LecteurPersistant'
import { colors, spacing, typography } from '@/constants/theme'
import { AudioProvider } from '@/contexts/AudioContext'
import { NotesProvider } from '@/contexts/NotesContext'
import { ScrollProvider } from '@/contexts/ScrollContext'
import { TabBarProvider, useTabBar } from '@/contexts/TabBarContext'
import { TelechargementProvider } from '@/contexts/TelechargementContext'
import { useFonts } from 'expo-font'
import { Stack, usePathname, useRouter } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'

SplashScreen.preventAutoHideAsync()

function IconHome({ size = 24, color = '#1f1f1f' }: { size?: number, color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z" fill={color} /></Svg>
}
function IconHeadphones({ size = 24, color = '#1f1f1f' }: { size?: number, color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M360-120H200q-33 0-56.5-23.5T120-200v-280q0-75 28.5-140.5t77-114q48.5-48.5 114-77T480-840q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-480v280q0 33-23.5 56.5T760-120H600v-320h160v-40q0-117-81.5-198.5T480-760q-117 0-198.5 81.5T200-480v40h160v320Zm-80-240h-80v160h80v-160Zm400 0v160h80v-160h-80Zm-400 0h-80 80Zm400 0h80-80Z" fill={color} /></Svg>
}
function IconPrayer({ size = 24, color = '#1f1f1f' }: { size?: number, color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="m521-500 59-43 58 43-23-68 59-43h-72l-22-69-22 69h-73l59 43-23 68Zm-41 220q83 0 141.5-58T680-480q0-8-.5-16t-2.5-16q-11 47-49 77.5T539-404q-60 0-101-41t-41-101q0-46 26-82.5t68-51.5h-11q-84 0-142 58.5T280-480q0 84 58 142t142 58Zm0 252L346-160H160v-186L28-480l132-134v-186h186l134-132 134 132h186v186l132 134-132 134v186H614L480-28Zm0-112 100-100h140v-140l100-100-100-100v-140H580L480-820 380-720H240v140L140-480l100 100v140h140l100 100Zm0-340Z" fill={color} /></Svg>
}
function IconMore({ size = 24, color = '#1f1f1f' }: { size?: number, color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M240-400q-33 0-56.5-23.5T160-480q0-33 23.5-56.5T240-560q33 0 56.5 23.5T320-480q0 33-23.5 56.5T240-400Zm240 0q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm240 0q-33 0-56.5-23.5T640-480q0-33 23.5-56.5T720-560q33 0 56.5 23.5T800-480q0 33-23.5 56.5T720-400Z" fill={color} /></Svg>
}

const TABS = [
  { key: 'index', label: 'Accueil', icon: IconHome, href: '/' },
  { key: 'audio', label: 'Audio', icon: IconHeadphones, href: '/audio' },
  { key: 'prieres', label: 'Prières', icon: IconPrayer, href: '/(tabs)/prieres' },
]

function AppShell() {
  const pathname = usePathname()
  const router = useRouter()
  const { tabBarVisible, hideTabBar } = useTabBar()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/' || pathname === '/index'
    if (href === '/(tabs)/prieres') return pathname.includes('prieres')
    return pathname.startsWith(href.replace('/(tabs)', ''))
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.fondCreme }}>
      <Stack screenOptions={{ headerShown: false }} />

      {tabBarVisible && (
        <SafeAreaView edges={['bottom']} style={{ backgroundColor: 'transparent' }}>
          <View style={{ marginHorizontal: spacing.lg, marginBottom: spacing.md, gap: spacing.sm }}>
            <LecteurPersistant />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <View style={{
                flex: 1, flexDirection: 'row',
                backgroundColor: colors.blanc,
                borderRadius: 24, padding: 6,
                shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
              }}>
                {TABS.map(tab => {
                  const actif = isActive(tab.href)
                  const Icon = tab.icon
                  return (
                    <Pressable
                      key={tab.key}
                      onPress={() => {
                        if (tab.href === '/') hideTabBar()
                        router.push(tab.href as any)
                      }}
                      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 18, backgroundColor: actif ? colors.fondCreme : 'transparent', gap: 3 }}
                    >
                      <Icon size={22} color={actif ? colors.bleu : '#888'} />
                      <Text style={{ fontFamily: actif ? typography.fontFamily.semibold : typography.fontFamily.regular, fontSize: 10, color: actif ? colors.bleu : '#888' }}>
                        {tab.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
              <Pressable
                onPress={() => router.push('/plus' as any)}
                style={{ width: 60, borderRadius: 24, backgroundColor: isActive('/plus') ? colors.bleu : colors.blanc, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 }}
              >
                <IconMore size={22} color={isActive('/plus') ? 'white' : '#888'} />
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
    UthmanicHafs: require('../assets/fonts/UthmanicHafs.otf'),
  })

  useEffect(() => {
    if (fontsLoaded || fontError) {
      if (fontError) console.error('Erreur fonts:', fontError)
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  if (!fontsLoaded && !fontError) return null

  return (
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
  )
}
import { AudioProvider } from '@/contexts/AudioContext'
import { NotesProvider } from '@/contexts/NotesContext'
import { ScrollProvider } from '@/contexts/ScrollContext'
import { TabBarProvider } from '@/contexts/TabBarContext'
import { TelechargementProvider } from '@/contexts/TelechargementContext'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    GoogleSans_Regular:  require('../assets/fonts/GoogleSans_17pt-Regular.ttf'),
    GoogleSans_Medium:   require('../assets/fonts/GoogleSans_17pt-Medium.ttf'),
    GoogleSans_SemiBold: require('../assets/fonts/GoogleSans_17pt-SemiBold.ttf'),
    GoogleSans_Bold:     require('../assets/fonts/GoogleSans_17pt-Bold.ttf'),
    IBMPlexSansArabic:   require('../assets/fonts/IBMPlexSansArabic-Regular.ttf'),
    UthmanicHafs:        require('../assets/fonts/UthmanicHafs.otf'),
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
              <Stack screenOptions={{ headerShown: false }} />
            </TabBarProvider>
          </ScrollProvider>
        </TelechargementProvider>
      </NotesProvider>
    </AudioProvider>
  )
}

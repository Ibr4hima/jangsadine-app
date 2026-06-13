import { HerosDetail, PressableScale } from '@/components/AudioUI'
import { colors, radius, spacing, typography } from '@/constants/theme'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { ScrollView, StatusBar, Text, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'

// ─── icônes (Material Symbols) ────────────────────────────────
function IconChecklist({ size = 19, color = colors.bleu }: { size?: number, color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M222-200 80-342l56-56 85 85 170-170 56 57-225 226Zm0-320L80-662l56-56 85 85 170-170 56 57-225 226Zm298 240v-80h360v80H520Zm0-320v-80h360v80H520Z" fill={color} /></Svg>
}

function IconAddNotes({ size = 19, color = colors.bleu }: { size?: number, color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M700-120h40v-100h100v-40H740v-100h-40v100H600v40h100v100Zm20 80q-83 0-141.5-58.5T520-240q0-83 58.5-141.5T720-440q83 0 141.5 58.5T920-240q0 83-58.5 141.5T720-40ZM280-600h400v-80H280v80Zm187 480H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v268q-29-14-58.5-21t-61.5-7q-11 0-20.5.5T680-517v-3H280v80h245q-18 17-32.5 37T467-360H280v80h163q-2 10-2.5 19.5T440-240q0 33 6 61.5t21 58.5Z" fill={color} /></Svg>
}

function IconDownloadDone({ size = 19, color = colors.bleu }: { size?: number, color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M382-320 155-547l57-57 170 170 366-366 57 57-423 423ZM200-160v-80h560v80H200Z" fill={color} /></Svg>
}

function IconExplore({ size = 19, color = colors.bleu }: { size?: number, color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="m300-300 280-80 80-280-280 80-80 280Zm180-120q-25 0-42.5-17.5T420-480q0-25 17.5-42.5T480-540q25 0 42.5 17.5T540-480q0 25-17.5 42.5T480-420Zm0 340q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q133 0 226.5-93.5T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160Zm0-320Z" fill={color} /></Svg>
}

function IconNotifications({ size = 19, color = colors.bleu }: { size?: number, color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M160-200v-80h80v-280q0-83 50-147.5T420-792v-28q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820v28q80 20 130 84.5T720-560v280h80v80H160Zm320-300Zm0 420q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80ZM320-280h320v-280q0-66-47-113t-113-47q-66 0-113 47t-47 113v280Z" fill={color} /></Svg>
}

function IconChevron({ size = 18, color = '#b6c0cc' }: { size?: number, color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" fill={color} /></Svg>
}

const MENU = [
  { label: 'Mon Programme',   icon: IconChecklist,    href: '/programme' },
  { label: 'Mes notes',       icon: IconAddNotes,     href: '/notes' },
  { label: 'Téléchargements', icon: IconDownloadDone, href: '/telechargements' },
  { label: 'Qibla',           icon: IconExplore,      href: '/qibla' },
  { label: 'Notifications',   icon: IconNotifications, href: '/notifications' },
]

export default function Plus() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  return (
    <View style={{ flex: 1, backgroundColor: colors.fondCreme }}>
      <StatusBar barStyle="light-content" />

      {/* ── Héros ── */}
      <HerosDetail paddingTop={insets.top + spacing.sm}>
        <View style={{ alignItems: 'center' }}>
          <View style={{ backgroundColor: 'rgba(214,173,58,0.16)', borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 4, marginBottom: spacing.sm }}>
            <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.xs, letterSpacing: 1.8, color: colors.or, textTransform: 'uppercase' }}>
              Navigation
            </Text>
          </View>
          <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size['2xl'], color: 'white' }}>
            Plus
          </Text>
        </View>
      </HerosDetail>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: 160 }}
      >
        <View style={{ gap: spacing.sm }}>
          {MENU.map((item, index) => {
            const Icon = item.icon
            return (
              <Animated.View key={item.href} entering={FadeInDown.duration(350).delay(index * 50)}>
                <PressableScale
                  onPress={() => {
                    Haptics.selectionAsync()
                    router.push(item.href as any)
                  }}
                  style={{
                    backgroundColor: colors.blanc,
                    borderRadius: 18,
                    padding: spacing.md,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.md,
                    shadowColor: '#3a4a5c',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.06,
                    shadowRadius: 10,
                    elevation: 2,
                  }}
                >
                  <View style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: '#e8f0f8',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon size={19} color={colors.bleu} />
                  </View>
                  <Text style={{
                    flex: 1,
                    fontFamily: typography.fontFamily.semibold,
                    fontSize: typography.size.base,
                    color: colors.texte,
                  }}>
                    {item.label}
                  </Text>
                  <IconChevron size={18} />
                </PressableScale>
              </Animated.View>
            )
          })}
        </View>
      </ScrollView>
    </View>
  )
}

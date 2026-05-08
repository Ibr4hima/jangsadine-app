import { colors, radius, spacing, typography } from '@/constants/theme'
import { useRouter } from 'expo-router'
import { ChevronRight } from 'lucide-react-native'
import { Pressable, ScrollView, StatusBar, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'

function IconBookRibbon({ size = 22, color = '#1f1f1f' }: { size?: number, color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M440-278v-394q-41-24-87-36t-93-12q-36 0-71.5 7T120-692v396q35-12 69.5-18t70.5-6q47 0 91.5 10.5T440-278Zm40 118q-48-38-104-59t-116-21q-42 0-82.5 11T100-198q-21 11-40.5-1T40-234v-482q0-11 5.5-21T62-752q46-24 96-36t102-12q74 0 126 17t112 52q11 6 16.5 14t5.5 21v418q44-21 88.5-31.5T700-320q36 0 70.5 6t69.5 18v-481q15 5 29.5 11t28.5 14q11 5 16.5 15t5.5 21v482q0 23-19.5 35t-40.5 1q-37-20-77.5-31T700-240q-60 0-116 21t-104 59Zm140-240v-440l120-40v440l-120 40Zm-340-99Z" fill={color} /></Svg>
}

function IconBookmarkStacks({ size = 22, color = '#1f1f1f' }: { size?: number, color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M480-240 63-467l84-46 333 182 333-182 84 46-417 227Zm0 160L63-307l84-46 333 182 333-182 84 46L480-80Zm0-320L40-640l440-240 40 22v178h327l73 40-440 240Zm0-91 200-109H440v-167L207-640l273 149Zm-40-109Z" fill={color} /></Svg>
}

function IconDownload({ size = 22, color = '#1f1f1f' }: { size?: number, color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z" fill={color} /></Svg>
}

function IconExplore({ size = 22, color = '#1f1f1f' }: { size?: number, color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="m300-300 280-80 80-280-280 80-80 280Zm180-120q-25 0-42.5-17.5T420-480q0-25 17.5-42.5T480-540q25 0 42.5 17.5T540-480q0 25-17.5 42.5T480-420Zm0 340q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q133 0 226.5-93.5T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160Zm0-320Z" fill={color} /></Svg>
}

function IconNotifications({ size = 22, color = '#1f1f1f' }: { size?: number, color?: string }) {
  return <Svg width={size} height={size} viewBox="0 -960 960 960"><Path d="M160-200v-80h80v-280q0-83 50-147.5T420-792v-28q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820v28q80 20 130 84.5T720-560v280h80v80H160Zm320-300Zm0 420q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80ZM320-280h320v-280q0-66-47-113t-113-47q-66 0-113 47t-47 113v280Z" fill={color} /></Svg>
}

const MENU = [
  {
    label: 'Mon Programme',
    description: 'Personnaliser mon programme d\'apprentissage',
    icon: IconBookRibbon,
    href: '/programme',
  },
  {
    label: 'Mes notes',
    description: 'Notes prises pendant l\'écoute',
    icon: IconBookmarkStacks,
    href: '/notes',
  },
  {
    label: 'Téléchargements',
    description: 'Écouter hors connexion',
    icon: IconDownload,
    href: '/telechargements',
  },
  {
    label: 'Qibla',
    description: 'Direction de la prière',
    icon: IconExplore,
    href: '/qibla',
  },
  {
    label: 'Notifications',
    description: 'Rappels pour les heures prières',
    icon: IconNotifications,
    href: '/notifications',
  },
]

export default function Plus() {
  const router = useRouter()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.fondCreme }} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: 160 }}
      >
        {/* Header */}
        <Text style={{
          fontFamily: typography.fontFamily.bold,
          fontSize: typography.size.xs,
          letterSpacing: 2, color: colors.or,
          textTransform: 'uppercase', marginBottom: 4,
        }}>
          Navigation
        </Text>
        <Text style={{
          fontFamily: typography.fontFamily.bold,
          fontSize: typography.size['2xl'],
          color: colors.texte,
          marginBottom: spacing.xl,
        }}>
          Plus
        </Text>

        {/* Menu */}
        <View style={{ gap: spacing.sm }}>
          {MENU.map(item => {
            const Icon = item.icon
            return (
              <Pressable
                key={item.href}
                onPress={() => router.push(item.href as any)}
                style={({ pressed }) => ({
                  backgroundColor: colors.blanc,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: colors.bordure,
                  padding: spacing.md,
                  flexDirection: 'row',
                  alignItems: 'center',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <View style={{
                  width: 44, height: 44, borderRadius: radius.md,
                  backgroundColor: colors.fondCreme,
                  alignItems: 'center', justifyContent: 'center',
                  marginRight: spacing.md, flexShrink: 0,
                }}>
                  <Icon size={22} color={colors.texte} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{
                    fontFamily: typography.fontFamily.semibold,
                    fontSize: typography.size.base,
                    color: colors.texte,
                  }}>
                    {item.label}
                  </Text>
                  <Text style={{
                    fontFamily: typography.fontFamily.regular,
                    fontSize: typography.size.sm,
                    color: colors.texteMuted,
                    marginTop: 2,
                  }}>
                    {item.description}
                  </Text>
                </View>
                <ChevronRight size={18} color="#ccc" />
              </Pressable>
            )
          })}
        </View>

        {/* Footer */}
        <View style={{ alignItems: 'center', marginTop: spacing['2xl'] }}>
          <Text style={{
            fontFamily: typography.fontFamily.bold,
            fontSize: typography.size.base,
            color: colors.texte,
          }}>
          </Text>
          <Text style={{
            fontFamily: typography.fontFamily.regular,
            fontSize: typography.size.xs,
            color: colors.texteMuted,
            marginTop: 4,
          }}>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
import { EnTeteSection, HerosDetail, PressableScale, W70 } from '@/components/AudioUI'
import { colors, radius, spacing, typography } from '@/constants/theme'
import Constants from 'expo-constants'
import * as Haptics from 'expo-haptics'
import { Image, Linking, ScrollView, StatusBar, Text, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Path } from 'react-native-svg'

const EMAIL = 'contact@jangsadine.com'

function IconInfo({ size = 18, color = colors.bleu }: { size?: number, color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" fill={color} />
    </Svg>
  )
}
function IconMail({ size = 18, color = colors.bleu }: { size?: number, color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm320-280L160-640v400h640v-400L480-440Zm0-80 320-200H160l320 200ZM160-640v-80 480-400Z" fill={color} />
    </Svg>
  )
}
function IconChevron({ size = 18, color = '#b6c0cc' }: { size?: number, color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960">
      <Path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" fill={color} />
    </Svg>
  )
}

export default function Parametres() {
  const insets = useSafeAreaInsets()
  const version = Constants.expoConfig?.version ?? '1.0.0'

  const contacter = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    Linking.openURL(`mailto:${EMAIL}`).catch(() => {})
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.fondCreme }}>
      <StatusBar barStyle="light-content" />

      {/* ── Héros ── */}
      <HerosDetail paddingTop={insets.top + spacing.sm}>
        <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size['2xl'], color: '#fff' }}>
          Paramètres
        </Text>
        <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: W70, marginTop: 2 }}>
          Informations sur l'application
        </Text>
      </HerosDetail>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.xl, paddingBottom: 140 }}>
        {/* ── À propos ── */}
        <Animated.View entering={FadeInDown.duration(350)}>
          <EnTeteSection eyebrow="À propos" />

          <View style={{ gap: spacing.sm }}>
            <View style={{
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
            }}>
              <View style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: '#e8f0f8',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <IconInfo size={19} color={colors.bleu} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base, color: colors.texte }}>
                  Version
                </Text>
                <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: colors.texteMuted, marginTop: 2 }}>
                  {version}
                </Text>
              </View>
            </View>

            <PressableScale onPress={contacter} style={{
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
            }}>
              <View style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: '#faf3dc',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <IconMail size={19} color={colors.orFonce ?? colors.or} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: typography.fontFamily.semibold, fontSize: typography.size.base, color: colors.texte }}>
                  Contact
                </Text>
                <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: typography.size.sm, color: colors.texteMuted, marginTop: 2 }}>
                  {EMAIL}
                </Text>
              </View>
              <IconChevron size={18} />
            </PressableScale>
          </View>
        </Animated.View>

        {/* ── Marque ── */}
        <Animated.View entering={FadeInDown.duration(350).delay(90)} style={{ alignItems: 'center', marginTop: spacing['3xl'] }}>
          <View style={{
            width: 64, height: 64, borderRadius: 20,
            overflow: 'hidden', marginBottom: spacing.md,
            backgroundColor: '#dce8f5',
          }}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={{ width: 64, height: 64 }}
              resizeMode="cover"
            />
          </View>
          <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: typography.size.md, color: colors.texte }}>
            Jàng sa <Text style={{ color: colors.or }}>Diné</Text>
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  )
}

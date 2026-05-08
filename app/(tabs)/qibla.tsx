import { colors, radius, spacing, typography } from '@/constants/theme'
import * as Location from 'expo-location'
import { Magnetometer } from 'expo-sensors'
import { useEffect, useRef, useState } from 'react'
import {
  Animated, Dimensions, Easing, StyleSheet,
  Text, View
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width } = Dimensions.get('window')
const COMPASS_SIZE = width * 0.82

// Coordonnées de la Kaaba
const KAABA_LAT = 21.4225
const KAABA_LNG = 39.8262

function calculerQibla(lat: number, lng: number): number {
  const dLng = (KAABA_LNG - lng) * (Math.PI / 180)
  const lat1 = lat * (Math.PI / 180)
  const lat2 = KAABA_LAT * (Math.PI / 180)
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  const bearing = Math.atan2(y, x) * (180 / Math.PI)
  return (bearing + 360) % 360
}

function normaliserAngle(angle: number): number {
  return ((angle % 360) + 360) % 360
}

export default function Qibla() {
  const [permission, setPermission] = useState<'idle' | 'granted' | 'denied'>('idle')
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [qiblaAngle, setQiblaAngle] = useState<number | null>(null)
  const [boussole, setBoussole] = useState(0)
  const [aligne, setAligne] = useState(false)

  const rotationAnim = useRef(new Animated.Value(0)).current
  const aiguilleAnim = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current
  const prevBoussole = useRef(0)
  const prevAiguille = useRef(0)

  // Pulse quand aligné
  useEffect(() => {
    if (aligne) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start()
    } else {
      pulseAnim.stopAnimation()
      pulseAnim.setValue(1)
    }
  }, [aligne])

  // Permission + position GPS
  useEffect(() => {
    async function init() {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') { setPermission('denied'); return }
      setPermission('granted')
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      const lat = loc.coords.latitude
      const lng = loc.coords.longitude
      setPosition({ lat, lng })
      setQiblaAngle(calculerQibla(lat, lng))
    }
    init()
  }, [])

  // Magnétomètre
  useEffect(() => {
    Magnetometer.setUpdateInterval(100)
    const sub = Magnetometer.addListener(({ x, y }) => {
      let angle = Math.atan2(y, x) * (180 / Math.PI)
      angle = normaliserAngle(-angle)
      setBoussole(angle)
    })
    return () => sub.remove()
  }, [])

  // Animation boussole (rose)
  useEffect(() => {
    let delta = boussole - prevBoussole.current
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    const next = prevBoussole.current + delta
    prevBoussole.current = next
    Animated.timing(rotationAnim, {
      toValue: -next,
      duration: 150,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()
  }, [boussole])

  // Animation aiguille Qibla
  useEffect(() => {
    if (qiblaAngle === null) return
    const aiguille = normaliserAngle(qiblaAngle - boussole)
    let delta = aiguille - prevAiguille.current
    if (delta > 180) delta -= 360
    if (delta < -180) delta += 360
    const next = prevAiguille.current + delta
    prevAiguille.current = next
    Animated.timing(aiguilleAnim, {
      toValue: next,
      duration: 150,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start()

    // Détecter alignement (±3°)
    const diff = Math.abs(((aiguille + 180) % 360) - 180)
    setAligne(diff < 3)
  }, [boussole, qiblaAngle])

  const rotationCompass = rotationAnim.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  })
  const rotationAiguille = aiguilleAnim.interpolate({
    inputRange: [-360, 360],
    outputRange: ['-360deg', '360deg'],
  })

  // ── Écran permission refusée ──
  if (permission === 'denied') {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centré}>
          <Text style={styles.emoji}>📍</Text>
          <Text style={styles.titre}>Accès refusé</Text>
          <Text style={styles.sousTitre}>
            Active la localisation dans les réglages pour utiliser la Qibla.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  // ── Chargement ──
  if (!position || qiblaAngle === null) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centré}>
          <Text style={styles.emoji}>🧭</Text>
          <Text style={styles.titre}>Calcul en cours…</Text>
          <Text style={styles.sousTitre}>Détection de ta position GPS</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.labelOr}>Direction de prière</Text>
        <Text style={styles.titreHeader}>Qibla</Text>
      </View>

      {/* Boussole */}
      <View style={styles.boussoleContainer}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>

          {/* Cercle extérieur */}
          <View style={[styles.cercleBord, aligne && styles.cercleBordAligne]}>

            {/* Rose des vents animée */}
            <Animated.View style={[styles.roseContainer, { transform: [{ rotate: rotationCompass }] }]}>
              {/* Points cardinaux */}
              {[
                { label: 'N', angle: 0 },
                { label: 'E', angle: 90 },
                { label: 'S', angle: 180 },
                { label: 'O', angle: 270 },
              ].map(({ label, angle }) => (
                <View
                  key={label}
                  style={[styles.cardinal, { transform: [{ rotate: `${angle}deg` }, { translateY: -(COMPASS_SIZE / 2 - 24) }] }]}
                >
                  <Text style={[styles.cardinalTxt, label === 'N' && styles.cardinalN]}>
                    {label}
                  </Text>
                </View>
              ))}

              {/* Graduations */}
              {Array.from({ length: 72 }).map((_, i) => {
                const isMajor = i % 9 === 0
                return (
                  <View
                    key={i}
                    style={[
                      styles.graduation,
                      {
                        height: isMajor ? 12 : 6,
                        opacity: isMajor ? 0.5 : 0.2,
                        transform: [
                          { rotate: `${i * 5}deg` },
                          { translateY: -(COMPASS_SIZE / 2 - 8) },
                        ],
                      },
                    ]}
                  />
                )
              })}
            </Animated.View>

            {/* Aiguille Qibla */}
            <Animated.View style={[styles.aiguilleContainer, { transform: [{ rotate: rotationAiguille }] }]}>
              <View style={styles.aiguille}>
                {/* Pointe vers Qibla */}
                <View style={[styles.aiguilleHaut, aligne && styles.aiguillеAligne]} />
                <View style={styles.aiguilleBas} />
              </View>
            </Animated.View>

            {/* Centre */}
            <View style={[styles.centre, aligne && styles.centreAligne]}>
              <Text style={styles.kaaba}>🕋</Text>
            </View>

          </View>
        </Animated.View>
      </View>

      {/* Infos bas */}
      <View style={styles.infos}>
        {aligne ? (
          <View style={styles.alignéBadge}>
            <Text style={styles.alignéTxt}>✓ Direction correcte</Text>
          </View>
        ) : (
          <View style={styles.angleBadge}>
            <Text style={styles.angleTxt}>
              {Math.round(qiblaAngle)}° depuis le Nord
            </Text>
          </View>
        )}

        <Text style={styles.coords}>
          {position.lat.toFixed(4)}°N · {position.lng.toFixed(4)}°E
        </Text>
      </View>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.fondCreme,
  },
  centré: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  titre: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.size['2xl'],
    color: colors.texte,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  sousTitre: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.base,
    color: colors.texteMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  labelOr: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.size.xs,
    letterSpacing: 2,
    color: colors.or,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  titreHeader: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.size['2xl'],
    color: colors.texte,
  },
  boussoleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cercleBord: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    borderRadius: COMPASS_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.bordure,
    backgroundColor: colors.blanc,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cercleBordAligne: {
    borderColor: '#2d7a4f',
    borderWidth: 3,
    shadowColor: '#2d7a4f',
    shadowOpacity: 0.2,
  },
  roseContainer: {
    position: 'absolute',
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardinal: {
    position: 'absolute',
  },
  cardinalTxt: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 13,
    color: colors.texteMuted,
  },
  cardinalN: {
    color: colors.bleu,
    fontSize: 15,
  },
  graduation: {
    position: 'absolute',
    width: 1.5,
    backgroundColor: colors.texte,
    borderRadius: 1,
  },
  aiguilleContainer: {
    position: 'absolute',
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiguille: {
    position: 'absolute',
    alignItems: 'center',
    height: COMPASS_SIZE * 0.6,
    justifyContent: 'center',
  },
  aiguilleHaut: {
    width: 4,
    height: COMPASS_SIZE * 0.27,
    backgroundColor: colors.or,
    borderRadius: 2,
    marginBottom: 2,
  },
  aiguillеAligne: {
    backgroundColor: '#2d7a4f',
  },
  aiguilleBas: {
    width: 4,
    height: COMPASS_SIZE * 0.27,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 2,
    marginTop: 2,
  },
  centre: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.fondCreme,
    borderWidth: 2,
    borderColor: colors.bordure,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centreAligne: {
    borderColor: '#2d7a4f',
    backgroundColor: '#eaf4ee',
  },
  kaaba: {
    fontSize: 22,
  },
  infos: {
    alignItems: 'center',
    paddingBottom: spacing['3xl'],
    gap: spacing.sm,
  },
  alignéBadge: {
    backgroundColor: '#eaf4ee',
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: '#2d7a4f',
  },
  alignéTxt: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.size.base,
    color: '#2d7a4f',
  },
  angleBadge: {
    backgroundColor: colors.blanc,
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.bordure,
  },
  angleTxt: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.size.base,
    color: colors.texte,
  },
  coords: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.xs,
    color: colors.texteMuted,
  },
})
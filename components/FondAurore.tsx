import { useEffect } from 'react'
import { View } from 'react-native'
import Animated, {
    cancelAnimation,
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated'

// ─── Fond « aurore » ──────────────────────────────────────────
// Trois nappes bleues qui dérivent très lentement (17 s / 23 s / 29 s,
// aller-retour) : le fond vit sans distraire. Transforms + opacité
// uniquement, sur le thread UI — coût quasi nul.
// `compact` : tailles/positions adaptées aux héros de page (zone ~300-450px
// de haut, coins arrondis, overflow hidden) ; sinon plein écran (lecteur,
// Qibla). `actif` permet de couper les animations quand la page n'est pas
// visible (onglet quitté, lecteur fermé).
export default function FondAurore({ actif = true, compact = false }: {
    actif?: boolean
    compact?: boolean
}) {
    const t1 = useSharedValue(0)
    const t2 = useSharedValue(0)
    const t3 = useSharedValue(0)

    useEffect(() => {
        if (actif) {
            t1.value = withRepeat(withTiming(1, { duration: 17000, easing: Easing.inOut(Easing.ease) }), -1, true)
            t2.value = withRepeat(withTiming(1, { duration: 23000, easing: Easing.inOut(Easing.ease) }), -1, true)
            t3.value = withRepeat(withTiming(1, { duration: 29000, easing: Easing.inOut(Easing.ease) }), -1, true)
        } else {
            cancelAnimation(t1); cancelAnimation(t2); cancelAnimation(t3)
        }
    }, [actif])

    const s1 = useAnimatedStyle(() => ({
        opacity: 0.09 + t1.value * 0.07,
        transform: [
            { translateX: t1.value * (compact ? 55 : 80) },
            { translateY: t1.value * (compact ? 38 : 55) },
            { scale: 1 + t1.value * 0.12 },
        ],
    }))
    const s2 = useAnimatedStyle(() => ({
        opacity: 0.07 + t2.value * 0.07,
        transform: [
            { translateX: -t2.value * (compact ? 48 : 70) },
            { translateY: -t2.value * (compact ? 30 : 45) },
            { scale: 1 + t2.value * 0.10 },
        ],
    }))
    const s3 = useAnimatedStyle(() => ({
        opacity: (compact ? 0.22 : 0.32) + t3.value * 0.14,
        transform: [
            { translateX: t3.value * (compact ? 34 : 50) },
            { scale: 1 + t3.value * 0.08 },
        ],
    }))

    if (compact) {
        return (
            <>
                <Animated.View style={[{
                    position: 'absolute', width: 380, height: 380, borderRadius: 190,
                    backgroundColor: 'rgb(120,165,220)', top: -160, right: -120,
                }, s1]} />
                <Animated.View style={[{
                    position: 'absolute', width: 300, height: 300, borderRadius: 150,
                    backgroundColor: 'rgb(90,140,200)', bottom: -120, left: -90,
                }, s2]} />
                <Animated.View style={[{
                    position: 'absolute', width: 340, height: 340, borderRadius: 170,
                    backgroundColor: 'rgb(30,64,106)', bottom: -170, right: -80,
                }, s3]} />
            </>
        )
    }

    return (
        <>
            <Animated.View style={[{
                position: 'absolute', width: 700, height: 700, borderRadius: 350,
                backgroundColor: 'rgb(120,165,220)', top: -300, left: -220,
            }, s1]} />
            <Animated.View style={[{
                position: 'absolute', width: 560, height: 560, borderRadius: 280,
                backgroundColor: 'rgb(90,140,200)', top: 280, right: -240,
            }, s2]} />
            <Animated.View style={[{
                position: 'absolute', width: 520, height: 520, borderRadius: 260,
                backgroundColor: 'rgb(30,64,106)', bottom: -200, left: -160,
            }, s3]} />
            <View style={{
                position: 'absolute', width: 300, height: 300, borderRadius: 150,
                backgroundColor: 'rgba(150,190,235,0.07)', bottom: 240, right: -100,
            }} />
        </>
    )
}

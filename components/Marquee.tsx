import { ReactNode, useEffect, useState } from 'react'
import { ScrollView, Text, TextStyle, StyleProp } from 'react-native'
import Animated, {
    cancelAnimation,
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withTiming,
} from 'react-native-reanimated'

// ─── Marquee maison (Reanimated) ──────────────────────────────
// Remplace react-native-text-ticker avec la même API (drop-in) :
// - ne défile QUE si le texte déborde réellement de son conteneur
// - boucle sans couture (le texte est doublé, espacé de repeatSpacer)
// - `disabled` stoppe net l'animation (texte statique tronqué)
// - `scrollSpeed` = ms par pixel, comme la lib d'origine (18 ≈ 55 px/s)
// Tout tourne sur le thread UI (withTiming/withRepeat), zéro re-render.
export default function Marquee({
    children,
    style,
    repeatSpacer = 60,
    marqueeDelay = 2500,
    scrollSpeed = 18,
    disabled = false,
}: {
    children: ReactNode
    style?: StyleProp<TextStyle>
    // acceptés pour compatibilité avec l'API de react-native-text-ticker
    loop?: boolean
    bounce?: boolean
    repeatSpacer?: number
    marqueeDelay?: number
    scrollSpeed?: number
    disabled?: boolean
    numberOfLines?: number
}) {
    const [texteW, setTexteW] = useState(0)
    const [boiteW, setBoiteW] = useState(0)
    const x = useSharedValue(0)

    const defile = boiteW > 0 && texteW > boiteW + 1 && !disabled

    useEffect(() => {
        cancelAnimation(x)
        x.value = 0
        if (defile) {
            const dist = texteW + repeatSpacer
            x.value = withDelay(
                marqueeDelay,
                withRepeat(
                    withTiming(-dist, { duration: dist * scrollSpeed, easing: Easing.linear }),
                    -1,
                    false,
                ),
            )
        }
        return () => cancelAnimation(x)
    }, [defile, texteW, repeatSpacer, marqueeDelay, scrollSpeed])

    const aStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }))

    // Le ScrollView (désactivé) donne une largeur non contrainte à son contenu :
    // le premier Text mesure ainsi sa vraie largeur intrinsèque.
    return (
        <ScrollView
            horizontal
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            onLayout={e => setBoiteW(Math.round(e.nativeEvent.layout.width))}
        >
            <Animated.View style={[{ flexDirection: 'row' }, aStyle]}>
                <Text
                    numberOfLines={1}
                    style={style}
                    onLayout={e => setTexteW(Math.round(e.nativeEvent.layout.width))}
                >
                    {children}
                </Text>
                {defile && (
                    <Text numberOfLines={1} style={[style, { paddingLeft: repeatSpacer }]}>
                        {children}
                    </Text>
                )}
            </Animated.View>
        </ScrollView>
    )
}

import { colors, radius } from '@/constants/theme'
import { useTelechargement } from '@/contexts/TelechargementContext'
import * as Haptics from 'expo-haptics'
import { Pressable, Text, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

function IconTelecharger({ size = 16, color = '#999' }: { size?: number, color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z" fill={color} />
        </Svg>
    )
}
function IconCheck({ size = 14, color = '#2d7a4f' }: { size?: number, color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 -960 960 960">
            <Path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" fill={color} />
        </Svg>
    )
}

type Props = {
    episode: {
        id: string
        titre: string
        sheikh: string
        coursId: string
        coursTitre: string
        url: string
        type?: 'cours' | 'conference' | 'khoutbah' | 'fatwa'
        numero?: number
    }
    size?: number
}

export default function BoutonTelecharger({ episode, size = 18 }: Props) {
    const { telecharger, supprimer, estTelecharge, estEnCours, progressions } = useTelechargement()

    const telecharge = estTelecharge(episode.id)
    const enCours = estEnCours(episode.id)
    const progression = progressions[episode.id]?.progression ?? 0

    if (telecharge) {
        return (
            <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); supprimer(episode.id) }}
                style={{
                    width: 30, height: 30, borderRadius: radius.full,
                    backgroundColor: '#eaf4ee',
                    alignItems: 'center', justifyContent: 'center',
                }}
            >
                <IconCheck size={size - 2} color="#2d7a4f" />
            </Pressable>
        )
    }

    if (enCours) {
        return (
            <View style={{
                width: 30, height: 30, borderRadius: radius.full,
                backgroundColor: '#e8f0f8',
                alignItems: 'center', justifyContent: 'center',
            }}>
                <Text style={{ fontSize: 9, color: colors.bleu, fontWeight: '700', includeFontPadding: false }}>
                    {progression}%
                </Text>
            </View>
        )
    }

    return (
        <Pressable
            onPress={() => { Haptics.selectionAsync(); telecharger(episode) }}
            style={{
                width: 30, height: 30, borderRadius: radius.full,
                backgroundColor: '#f0f0f0',
                alignItems: 'center', justifyContent: 'center',
            }}
        >
            <IconTelecharger size={size - 2} color="#999" />
        </Pressable>
    )
}

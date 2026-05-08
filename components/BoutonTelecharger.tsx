import { colors, radius } from '@/constants/theme'
import { useTelechargement } from '@/contexts/TelechargementContext'
import { Check, Download } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'

type Props = {
    episode: {
        id: string
        titre: string
        sheikh: string
        coursId: string
        coursTitre: string
        url: string
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
                onPress={() => supprimer(episode.id)}
                style={{
                    width: 30, height: 30, borderRadius: radius.full,
                    backgroundColor: '#eaf4ee',
                    alignItems: 'center', justifyContent: 'center',
                }}
            >
                <Check size={size - 2} color="#2d7a4f" />
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
                <Text style={{ fontSize: 9, color: colors.bleu, fontWeight: '700' }}>
                    {progression}%
                </Text>
            </View>
        )
    }

    return (
        <Pressable
            onPress={() => telecharger(episode)}
            style={{
                width: 30, height: 30, borderRadius: radius.full,
                backgroundColor: '#f0f0f0',
                alignItems: 'center', justifyContent: 'center',
            }}
        >
            <Download size={size - 2} color="#999" />
        </Pressable>
    )
}
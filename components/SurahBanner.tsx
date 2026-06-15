// Bandeau ornemental de début de sourate, façon Mushaf : un cadre doré à double
// filet, le nom calligraphié de la sourate au centre (police « SuraNames » de
// quran.com, où « surah026 » → سورة الشعراء), et deux médaillons ronds :
// à gauche le nombre de versets, à droite le numéro/ordre de la sourate.
import { typography } from '@/constants/theme'
import { Text, View } from 'react-native'

const OR = '#b8932a'
const OR_DOUX = 'rgba(184,147,42,0.5)'
const TEXTE = '#23201A'

function chiffresArabes(n: number) {
    return String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
}

function Medaillon({ valeur }: { valeur: number }) {
    return (
        <View style={{
            width: 36, height: 36, borderRadius: 18,
            borderWidth: 1, borderColor: OR,
            backgroundColor: 'rgba(184,147,42,0.06)',
            alignItems: 'center', justifyContent: 'center',
        }}>
            <Text style={{ fontFamily: typography.fontFamily.coran, fontSize: 13, color: OR, lineHeight: 19 }}>
                {chiffresArabes(valeur)}
            </Text>
        </View>
    )
}

// Petit losange d'angle (ornement)
function Losange({ style }: { style: object }) {
    return <View style={[{ position: 'absolute', width: 6, height: 6, backgroundColor: OR, transform: [{ rotate: '45deg' }] }, style]} />
}

export default function SurahBanner({ sourate, nbVersets, largeur, taille }: {
    sourate: number
    nbVersets: number
    largeur: number
    taille: number
}) {
    const id3 = String(sourate).padStart(3, '0')
    const nameSize = Math.min(taille * 1.05, 30)

    return (
        <View style={{ width: largeur, alignSelf: 'center' }}>
            {/* Cadre extérieur */}
            <View style={{ borderWidth: 1.5, borderColor: OR, borderRadius: 8, padding: 4 }}>
                {/* Cadre intérieur (double filet) */}
                <View style={{
                    borderWidth: 1, borderColor: OR_DOUX, borderRadius: 5,
                    flexDirection: 'row', alignItems: 'center',
                    paddingVertical: 8, paddingHorizontal: 10, gap: 8,
                }}>
                    <Medaillon valeur={nbVersets} />
                    <Text
                        numberOfLines={1}
                        style={{
                            flex: 1, textAlign: 'center',
                            fontFamily: 'SuraNames', fontSize: nameSize,
                            lineHeight: nameSize * 1.7, color: TEXTE,
                            writingDirection: 'rtl',
                        }}
                    >
                        {`surah${id3}`}
                    </Text>
                    <Medaillon valeur={sourate} />
                </View>
                {/* Losanges d'angle */}
                <Losange style={{ top: -3, left: -3 }} />
                <Losange style={{ top: -3, right: -3 }} />
                <Losange style={{ bottom: -3, left: -3 }} />
                <Losange style={{ bottom: -3, right: -3 }} />
            </View>
        </View>
    )
}

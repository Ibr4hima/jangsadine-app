import { colors, typography } from '@/constants/theme'
import React from 'react'
import { Text, View } from 'react-native'

// ─── Format léger des notes ───────────────────────────────────
//   • ligne « • xxx »      → puce
//   • ligne « 1. xxx »     → numérotation
//   • inline « ==xxx== »   → surlignage (or)
//   • inline « **xxx** »   → gras
// ──────────────────────────────────────────────────────────────

export const SURLIGNAGE_BG = 'rgba(214,173,58,0.30)'

type Segment = { texte: string; surligne: boolean; gras: boolean }

export function segmenterInline(texte: string): Segment[] {
    const segments: Segment[] = []
    const regex = /(==[^=\n]+==|\*\*[^*\n]+\*\*)/g
    let dernier = 0
    let m: RegExpExecArray | null
    while ((m = regex.exec(texte)) !== null) {
        if (m.index > dernier) segments.push({ texte: texte.slice(dernier, m.index), surligne: false, gras: false })
        const brut = m[0]
        if (brut.startsWith('==')) segments.push({ texte: brut.slice(2, -2), surligne: true, gras: false })
        else segments.push({ texte: brut.slice(2, -2), surligne: false, gras: true })
        dernier = m.index + brut.length
    }
    if (dernier < texte.length) segments.push({ texte: texte.slice(dernier), surligne: false, gras: false })
    return segments
}

function TexteInline({ texte, couleur, taille, hauteurLigne }: {
    texte: string; couleur: string; taille: number; hauteurLigne: number
}) {
    return (
        <Text style={{ fontFamily: typography.fontFamily.regular, fontSize: taille, color: couleur, lineHeight: hauteurLigne, flex: 1, flexWrap: 'wrap' }}>
            {segmenterInline(texte).map((s, i) => (
                <Text
                    key={i}
                    style={{
                        fontFamily: s.gras ? typography.fontFamily.bold : typography.fontFamily.regular,
                        backgroundColor: s.surligne ? SURLIGNAGE_BG : 'transparent',
                        color: couleur,
                    }}
                >
                    {s.texte}
                </Text>
            ))}
        </Text>
    )
}

export default function NoteRiche({ texte, couleur = colors.texte, taille = typography.size.base, hauteurLigne = 23 }: {
    texte: string; couleur?: string; taille?: number; hauteurLigne?: number
}) {
    const lignes = texte.replace(/\r/g, '').split('\n')
    return (
        <View>
            {lignes.map((ligne, i) => {
                const puce = ligne.match(/^• (.*)$/)
                const num = ligne.match(/^(\d+)\. (.*)$/)
                if (puce) {
                    return (
                        <View key={i} style={{ flexDirection: 'row', paddingLeft: 2, gap: 8 }}>
                            <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: taille, color: colors.bleu, lineHeight: hauteurLigne }}>•</Text>
                            <TexteInline texte={puce[1]} couleur={couleur} taille={taille} hauteurLigne={hauteurLigne} />
                        </View>
                    )
                }
                if (num) {
                    return (
                        <View key={i} style={{ flexDirection: 'row', paddingLeft: 2, gap: 8 }}>
                            <Text style={{ fontFamily: typography.fontFamily.bold, fontSize: taille, color: colors.bleu, lineHeight: hauteurLigne, fontVariant: ['tabular-nums'] }}>
                                {num[1]}.
                            </Text>
                            <TexteInline texte={num[2]} couleur={couleur} taille={taille} hauteurLigne={hauteurLigne} />
                        </View>
                    )
                }
                if (ligne.trim() === '') return <View key={i} style={{ height: hauteurLigne * 0.45 }} />
                return <TexteInline key={i} texte={ligne} couleur={couleur} taille={taille} hauteurLigne={hauteurLigne} />
            })}
        </View>
    )
}

import { Platform } from 'react-native'

// Module natif iOS uniquement — absent d'Expo Go et des anciens dev
// clients : on charge paresseusement et on échoue en silence.
let natif: { ecrire: (json: string) => void } | null = null
if (Platform.OS === 'ios') {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        natif = require('expo-modules-core').requireNativeModule('WidgetPrieres')
    } catch {
        natif = null
    }
}

/** Écrit les horaires pour le widget (no-op hors iOS / sans module natif). */
export function ecrirePrieresWidget(json: string) {
    try { natif?.ecrire(json) } catch { }
}

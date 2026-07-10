import * as adhan from 'adhan'
import { ecrirePrieresWidget } from '../modules/widget-prieres'
import { getMethode } from './prieres'

// Alimente le widget iOS « Heures de prière » : calcule 7 jours d'horaires
// (mêmes paramètres que l'app — source unique getMethode) et les écrit dans
// l'App Group. Le widget construit ensuite sa timeline tout seul.

function hhmm(d: Date) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
function ymd(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function majWidgetPrieres(latitude: number, longitude: number, countryCode: string, ville: string) {
    try {
        const coords = new adhan.Coordinates(latitude, longitude)
        const params = getMethode(countryCode)
        const jours = []
        for (let j = 0; j < 7; j++) {
            const date = new Date()
            date.setDate(date.getDate() + j)
            const t = new adhan.PrayerTimes(coords, date, params)
            jours.push({
                date: ymd(date),
                heures: [
                    ['Fajr', hhmm(t.fajr)],
                    ['Dhuhr', hhmm(t.dhuhr)],
                    ['Asr', hhmm(t.asr)],
                    ['Maghrib', hhmm(t.maghrib)],
                    ['Isha', hhmm(t.isha)],
                ],
            })
        }
        ecrirePrieresWidget(JSON.stringify({ ville, jours }))
    } catch {
        // le widget n'est jamais bloquant pour l'app
    }
}

import * as adhan from 'adhan'

// Méthode de calcul des horaires de prière selon le pays.
// Source unique partagée entre l'accueil et la page « Heures de prières »
// pour que les horaires affichés soient toujours identiques.
const AMERIQUE = ['US', 'CA', 'MX', 'BR', 'AR', 'CO', 'CL', 'PE', 'VE']
const MOYEN_ORIENT = ['SA', 'AE', 'KW', 'QA', 'BH', 'OM', 'YE', 'IQ', 'SY', 'JO', 'LB', 'PS']
const ASIE_SUD = ['PK', 'IN', 'BD', 'AF', 'LK', 'NP']
const EGYPTE = ['EG', 'LY', 'SD']

export function getMethode(countryCode: string): adhan.CalculationParameters {
  if (AMERIQUE.includes(countryCode)) return adhan.CalculationMethod.NorthAmerica()
  if (MOYEN_ORIENT.includes(countryCode)) return adhan.CalculationMethod.UmmAlQura()
  if (ASIE_SUD.includes(countryCode)) return adhan.CalculationMethod.Karachi()
  if (EGYPTE.includes(countryCode)) return adhan.CalculationMethod.Egyptian()
  return adhan.CalculationMethod.MuslimWorldLeague()
}

export function getNomMethode(countryCode: string): string {
  if (['US', 'CA', 'MX'].includes(countryCode)) return 'ISNA'
  if (MOYEN_ORIENT.includes(countryCode)) return 'Umm al-Qura'
  if (ASIE_SUD.includes(countryCode)) return 'Karachi'
  if (EGYPTE.includes(countryCode)) return 'Egyptian'
  return 'Muslim World League'
}

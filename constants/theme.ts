export const colors = {
  bleu: '#264a77',
  or: '#d6ad3a',
  orFonce: '#b8911f',
  fondCreme: '#F5F2EB',
  bordure: '#e8e4da',
  texte: '#1a1a2e',
  texteMuted: '#666666',
  blanc: '#ffffff',
  footerBg: '#1a1a2e',

  // Palette « manuscrit » : encres profondes sur lavis doux, accordées au
  // bleu #264a77, à l'or #d6ad3a et au fond crème — teintes distinctes,
  // saturation et luminosité harmonisées.
  categories: {
    'Aqeedah': { bg: '#e9eff6', txt: '#2c5382' },              // bleu ardoise (le bleu de l'app)
    'Fiqh': { bg: '#f6eed6', txt: '#96751c' },                 // or doux (l'or de l'app)
    'Hadith': { bg: '#e6efe8', txt: '#2f6b4f' },               // vert émeraude profond
    'Tafsir & Sciences du Coran': { bg: '#f6e7eb', txt: '#93374f' }, // bordeaux des reliures
    'Seerah': { bg: '#f7eae2', txt: '#a2552d' },               // terre cuite
    'Invocations': { bg: '#e3efee', txt: '#2b6b6b' },          // bleu-vert serein
    'Éthique & Bons comportements': { bg: '#eeeaf5', txt: '#6d5296' }, // violet feutré
    'Séries de cours': { bg: '#f0e9dd', txt: '#7a5b3a' },      // brun bronze
  },
} as const

export const typography = {
  fontFamily: {
    regular: 'GoogleSans_Regular',
    medium: 'GoogleSans_Medium',
    semibold: 'GoogleSans_SemiBold',
    bold: 'GoogleSans_Bold',
    arabic: 'IBMPlexSansArabic',
    coran: 'UthmanicHafs',
  },
  size: {
    xs: 11,
    sm: 12,
    base: 14,
    md: 15,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
  },
} as const

export const radius = {
  sm: 6,
  md: 10,
  lg: 12,
  xl: 16,
  full: 999,
} as const

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 56,
} as const

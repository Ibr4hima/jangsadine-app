export const colors = {
  bleu: '#28558b',
  or: '#d9ac2a',
  orFonce: '#b8911f',
  fondCreme: '#f8f6f1',
  bordure: '#e8e4da',
  texte: '#1a1a2e',
  texteMuted: '#666666',
  blanc: '#ffffff',
  footerBg: '#1a1a2e',

  categories: {
    'Aqeedah': { bg: '#e8f0f8', txt: '#28558b' },
    'Fiqh': { bg: '#faf3dc', txt: '#b8911f' },
    'Hadith': { bg: '#eaf4ee', txt: '#2d7a4f' },
    'Tafsir & Sciences du Coran': { bg: '#fde8f0', txt: '#a02060' },
    'Seerah': { bg: '#fdf0eb', txt: '#c05c2e' },
    'Invocations': { bg: '#DEE8CE', txt: '#06402B' },
    'Éthique & Bons comportements': { bg: '#f2eefa', txt: '#6b3db5' },
    'Séries de cours': { bg: '#EDE8D0', txt: '#654321' },
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

// L'alphabet arabe : 28 lettres, dans l'ordre traditionnel (hijāʾī).
// Les formes attachées sont rendues avec le tatweel (ـ) pour forcer la ligature.

export interface Lettre {
  id: string
  /** Forme isolée */
  isole: string
  /** Nom de la lettre en arabe vocalisé */
  nomAr: string
  /** Nom de la lettre en français */
  nomFr: string
  /** Translittération du son */
  translit: string
  /** Description du son pour un francophone */
  son: string
  /** La lettre ne s'attache pas à la lettre suivante */
  nonConnectrice?: boolean
  formes: { debut: string; milieu: string; fin: string }
  exemple: { ar: string; translit: string; fr: string }
}

export const LETTRES: Lettre[] = [
  {
    id: 'alif', isole: 'ا', nomAr: 'أَلِف', nomFr: 'alif', translit: 'ā',
    son: "support de la voyelle « a » et son long « â »",
    nonConnectrice: true,
    formes: { debut: 'ا', milieu: 'ـا', fin: 'ـا' },
    exemple: { ar: 'بَاب', translit: 'bāb', fr: 'une porte' },
  },
  {
    id: 'ba', isole: 'ب', nomAr: 'بَاء', nomFr: 'bâ', translit: 'b',
    son: 'comme le « b » de bateau',
    formes: { debut: 'بـ', milieu: 'ـبـ', fin: 'ـب' },
    exemple: { ar: 'بَيْت', translit: 'bayt', fr: 'une maison' },
  },
  {
    id: 'ta', isole: 'ت', nomAr: 'تَاء', nomFr: 'tâ', translit: 't',
    son: 'comme le « t » de tapis',
    formes: { debut: 'تـ', milieu: 'ـتـ', fin: 'ـت' },
    exemple: { ar: 'تَمْر', translit: 'tamr', fr: 'des dattes' },
  },
  {
    id: 'tha', isole: 'ث', nomAr: 'ثَاء', nomFr: 'thâ', translit: 'th',
    son: 'comme le « th » anglais de think, langue entre les dents',
    formes: { debut: 'ثـ', milieu: 'ـثـ', fin: 'ـث' },
    exemple: { ar: 'ثَوْب', translit: 'thawb', fr: 'un vêtement' },
  },
  {
    id: 'jim', isole: 'ج', nomAr: 'جِيم', nomFr: 'jîm', translit: 'j',
    son: 'comme le « dj » de Djibouti',
    formes: { debut: 'جـ', milieu: 'ـجـ', fin: 'ـج' },
    exemple: { ar: 'جَنَّة', translit: 'janna', fr: 'un jardin, le Paradis' },
  },
  {
    id: 'ha', isole: 'ح', nomAr: 'حَاء', nomFr: 'hâ', translit: 'ḥ',
    son: 'un « h » fort et soufflé, du milieu de la gorge',
    formes: { debut: 'حـ', milieu: 'ـحـ', fin: 'ـح' },
    exemple: { ar: 'حَجّ', translit: 'ḥajj', fr: 'le pèlerinage' },
  },
  {
    id: 'kha', isole: 'خ', nomAr: 'خَاء', nomFr: 'khâ', translit: 'kh',
    son: 'comme la jota espagnole ou le « ch » allemand de Bach',
    formes: { debut: 'خـ', milieu: 'ـخـ', fin: 'ـخ' },
    exemple: { ar: 'خُبْز', translit: 'khubz', fr: 'du pain' },
  },
  {
    id: 'dal', isole: 'د', nomAr: 'دَال', nomFr: 'dâl', translit: 'd',
    son: 'comme le « d » de dune',
    nonConnectrice: true,
    formes: { debut: 'د', milieu: 'ـد', fin: 'ـد' },
    exemple: { ar: 'دِين', translit: 'dīn', fr: 'la religion' },
  },
  {
    id: 'dhal', isole: 'ذ', nomAr: 'ذَال', nomFr: 'dhâl', translit: 'dh',
    son: 'comme le « th » anglais de this, langue entre les dents',
    nonConnectrice: true,
    formes: { debut: 'ذ', milieu: 'ـذ', fin: 'ـذ' },
    exemple: { ar: 'ذَهَب', translit: 'dhahab', fr: "de l'or" },
  },
  {
    id: 'ra', isole: 'ر', nomAr: 'رَاء', nomFr: 'râ', translit: 'r',
    son: 'un « r » roulé, comme en espagnol',
    nonConnectrice: true,
    formes: { debut: 'ر', milieu: 'ـر', fin: 'ـر' },
    exemple: { ar: 'رَأْس', translit: "ra's", fr: 'une tête' },
  },
  {
    id: 'zay', isole: 'ز', nomAr: 'زَاي', nomFr: 'zây', translit: 'z',
    son: 'comme le « z » de zèbre',
    nonConnectrice: true,
    formes: { debut: 'ز', milieu: 'ـز', fin: 'ـز' },
    exemple: { ar: 'زَيْت', translit: 'zayt', fr: "de l'huile" },
  },
  {
    id: 'sin', isole: 'س', nomAr: 'سِين', nomFr: 'sîn', translit: 's',
    son: 'comme le « s » de soleil',
    formes: { debut: 'سـ', milieu: 'ـسـ', fin: 'ـس' },
    exemple: { ar: 'سَلَام', translit: 'salām', fr: 'la paix' },
  },
  {
    id: 'shin', isole: 'ش', nomAr: 'شِين', nomFr: 'chîn', translit: 'sh',
    son: 'comme le « ch » de chameau',
    formes: { debut: 'شـ', milieu: 'ـشـ', fin: 'ـش' },
    exemple: { ar: 'شَمْس', translit: 'shams', fr: 'le soleil' },
  },
  {
    id: 'sad', isole: 'ص', nomAr: 'صَاد', nomFr: 'sâd', translit: 'ṣ',
    son: 'un « s » emphatique, prononcé avec la bouche arrondie',
    formes: { debut: 'صـ', milieu: 'ـصـ', fin: 'ـص' },
    exemple: { ar: 'صَلَاة', translit: 'ṣalāt', fr: 'la prière' },
  },
  {
    id: 'dad', isole: 'ض', nomAr: 'ضَاد', nomFr: 'dâd', translit: 'ḍ',
    son: "un « d » emphatique, un son unique à la langue arabe",
    formes: { debut: 'ضـ', milieu: 'ـضـ', fin: 'ـض' },
    exemple: { ar: 'ضَيْف', translit: 'ḍayf', fr: 'un invité' },
  },
  {
    id: 'taa', isole: 'ط', nomAr: 'طَاء', nomFr: 'tâ emphatique', translit: 'ṭ',
    son: 'un « t » emphatique, prononcé avec force',
    formes: { debut: 'طـ', milieu: 'ـطـ', fin: 'ـط' },
    exemple: { ar: 'طَعَام', translit: 'ṭaʿām', fr: 'de la nourriture' },
  },
  {
    id: 'dhaa', isole: 'ظ', nomAr: 'ظَاء', nomFr: 'dhâ emphatique', translit: 'ẓ',
    son: 'un « dh » emphatique, langue entre les dents',
    formes: { debut: 'ظـ', milieu: 'ـظـ', fin: 'ـظ' },
    exemple: { ar: 'ظِلّ', translit: 'ẓill', fr: "l'ombre" },
  },
  {
    id: 'ayn', isole: 'ع', nomAr: 'عَيْن', nomFr: 'ʿayn', translit: 'ʿ',
    son: 'un son guttural profond, du fond de la gorge',
    formes: { debut: 'عـ', milieu: 'ـعـ', fin: 'ـع' },
    exemple: { ar: 'عَيْن', translit: 'ʿayn', fr: 'un œil, une source' },
  },
  {
    id: 'ghayn', isole: 'غ', nomAr: 'غَيْن', nomFr: 'ghayn', translit: 'gh',
    son: 'proche du « r » français de Paris',
    formes: { debut: 'غـ', milieu: 'ـغـ', fin: 'ـغ' },
    exemple: { ar: 'غَيْم', translit: 'ghaym', fr: 'des nuages' },
  },
  {
    id: 'fa', isole: 'ف', nomAr: 'فَاء', nomFr: 'fâ', translit: 'f',
    son: 'comme le « f » de fleur',
    formes: { debut: 'فـ', milieu: 'ـفـ', fin: 'ـف' },
    exemple: { ar: 'فَجْر', translit: 'fajr', fr: "l'aube" },
  },
  {
    id: 'qaf', isole: 'ق', nomAr: 'قَاف', nomFr: 'qâf', translit: 'q',
    son: 'un « k » profond, prononcé du fond de la gorge',
    formes: { debut: 'قـ', milieu: 'ـقـ', fin: 'ـق' },
    exemple: { ar: 'قَمَر', translit: 'qamar', fr: 'la lune' },
  },
  {
    id: 'kaf', isole: 'ك', nomAr: 'كَاف', nomFr: 'kâf', translit: 'k',
    son: 'comme le « k » de Kaaba',
    formes: { debut: 'كـ', milieu: 'ـكـ', fin: 'ـك' },
    exemple: { ar: 'كِتَاب', translit: 'kitāb', fr: 'un livre' },
  },
  {
    id: 'lam', isole: 'ل', nomAr: 'لَام', nomFr: 'lâm', translit: 'l',
    son: 'comme le « l » de lune',
    formes: { debut: 'لـ', milieu: 'ـلـ', fin: 'ـل' },
    exemple: { ar: 'لَيْل', translit: 'layl', fr: 'la nuit' },
  },
  {
    id: 'mim', isole: 'م', nomAr: 'مِيم', nomFr: 'mîm', translit: 'm',
    son: 'comme le « m » de maison',
    formes: { debut: 'مـ', milieu: 'ـمـ', fin: 'ـم' },
    exemple: { ar: 'مَسْجِد', translit: 'masjid', fr: 'une mosquée' },
  },
  {
    id: 'nun', isole: 'ن', nomAr: 'نُون', nomFr: 'noûn', translit: 'n',
    son: 'comme le « n » de nuage',
    formes: { debut: 'نـ', milieu: 'ـنـ', fin: 'ـن' },
    exemple: { ar: 'نُور', translit: 'nūr', fr: 'la lumière' },
  },
  {
    id: 'haa', isole: 'ه', nomAr: 'هَاء', nomFr: 'hâ doux', translit: 'h',
    son: 'un « h » doux et léger, comme un souffle',
    formes: { debut: 'هـ', milieu: 'ـهـ', fin: 'ـه' },
    exemple: { ar: 'هِلَال', translit: 'hilāl', fr: 'un croissant de lune' },
  },
  {
    id: 'waw', isole: 'و', nomAr: 'وَاو', nomFr: 'wâw', translit: 'w',
    son: 'comme le « w » de oui',
    nonConnectrice: true,
    formes: { debut: 'و', milieu: 'ـو', fin: 'ـو' },
    exemple: { ar: 'وَرْد', translit: 'ward', fr: 'des roses' },
  },
  {
    id: 'ya', isole: 'ي', nomAr: 'يَاء', nomFr: 'yâ', translit: 'y',
    son: 'comme le « y » de yeux',
    formes: { debut: 'يـ', milieu: 'ـيـ', fin: 'ـي' },
    exemple: { ar: 'يَد', translit: 'yad', fr: 'une main' },
  },
]

export const lettreParId = new Map(LETTRES.map((l) => [l.id, l]))

/** Groupes de lettres pour les leçons du niveau 1 et 2 (ordre traditionnel) */
export const GROUPES_LETTRES: string[][] = [
  ['alif', 'ba', 'ta', 'tha'],
  ['jim', 'ha', 'kha'],
  ['dal', 'dhal', 'ra', 'zay'],
  ['sin', 'shin', 'sad', 'dad'],
  ['taa', 'dhaa', 'ayn', 'ghayn'],
  ['fa', 'qaf', 'kaf', 'lam'],
  ['mim', 'nun', 'haa', 'waw', 'ya'],
]

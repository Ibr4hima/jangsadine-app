// Normalisation des termes de recherche.
// - insensible à la casse
// - insensible aux accents  ("poeme" trouve "poème")
// - variantes de titre      ("Dr", "Dr.", "Docteur" → "dr")
export function normaliser(texte: string | null | undefined): string {
  return (texte ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // retire les accents
    .replace(/\bdocteur\b/g, 'dr') // Docteur → dr
    .replace(/\bdr\b\.?/g, 'dr') // Dr. → dr
    .replace(/[.]/g, ' ') // ponctuation résiduelle
    .replace(/\s+/g, ' ')
    .trim()
}

// Vrai si `champ` contient `requete` une fois les deux normalisés.
export function correspond(champ: string | null | undefined, requete: string): boolean {
  return normaliser(champ).includes(normaliser(requete))
}

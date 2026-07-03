// Lecture audio de l'arabe.
// Aujourd'hui : synthèse vocale du navigateur (voix arabe si disponible).
// Demain : des enregistrements mp3 d'un récitateur remplaceront la synthèse —
// il suffira de fournir un fichier `public/audio/<id>.mp3` et de passer son id.

let voixArabe: SpeechSynthesisVoice | null = null

function chercherVoixArabe() {
  const voix = window.speechSynthesis?.getVoices() ?? []
  voixArabe =
    voix.find((v) => v.lang.startsWith('ar') && v.localService) ??
    voix.find((v) => v.lang.startsWith('ar')) ??
    null
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  chercherVoixArabe()
  window.speechSynthesis.addEventListener('voiceschanged', chercherVoixArabe)
}

const lecteur = typeof Audio !== 'undefined' ? new Audio() : null

export function jouerArabe(texte: string, audioId?: string) {
  if (audioId && lecteur) {
    lecteur.src = `./audio/${audioId}.mp3`
    lecteur
      .play()
      .catch(() => direTexte(texte)) // pas encore d'enregistrement → synthèse
    return
  }
  direTexte(texte)
}

function direTexte(texte: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(texte)
  u.lang = voixArabe?.lang ?? 'ar-SA'
  if (voixArabe) u.voice = voixArabe
  u.rate = 0.75
  window.speechSynthesis.speak(u)
}

export function audioDisponible(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

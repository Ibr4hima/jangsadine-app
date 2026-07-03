import { useRoute } from './lib/routeur'
import { Accueil } from './ecrans/Accueil'
import { Lecture } from './ecrans/Lecture'
import { Niveau } from './ecrans/Niveau'
import { Lecon } from './ecrans/Lecon'

export function App() {
  const route = useRoute()

  return (
    <div className="coquille">
      {route.nom === 'accueil' && <Accueil />}
      {route.nom === 'lecture' && <Lecture />}
      {route.nom === 'niveau' && <Niveau id={route.id} />}
      {route.nom === 'lecon' && <Lecon key={route.id} id={route.id} />}
    </div>
  )
}

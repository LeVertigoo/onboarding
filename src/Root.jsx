import { useState, useEffect } from 'react'
import App from './App.jsx'
import Contenu from './Contenu.jsx'
import Home from './Home.jsx'
import Espace from './Espace.jsx'
import { supabase } from './supabase.js'

const IDENTITY_KEY = 'kalanis-espace-identity-v1'
const LEGACY_DRAFT_KEY = 'kalanis-workbook-refonte-1500-draft-v1'

function loadIdentity() {
  try {
    const raw = localStorage.getItem(IDENTITY_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.email ? parsed : null
  } catch {
    return null
  }
}

function hasLegacyDraft() {
  try {
    return !!localStorage.getItem(LEGACY_DRAFT_KEY)
  } catch {
    return false
  }
}

// Point d'entrée public (hors ?admin=1). Décide quoi afficher :
//  - un client déjà en plein milieu du volet 1 SOUS L'ANCIEN système (un
//    brouillon local existe mais aucune identité "espace" n'a jamais été
//    créée) retombe directement sur le volet 1 tel qu'avant, pour ne RIEN
//    changer à son parcours en cours ;
//  - sinon, Home → Espace → Volet 1 / Volet 2, avec retour possible à
//    l'espace depuis n'importe quel volet.
export default function Root() {
  const [identity, setIdentity] = useState(() => loadIdentity())
  const [legacyMode] = useState(() => !loadIdentity() && hasLegacyDraft())
  const [view, setView] = useState('espace') // 'home' | 'espace' | 'v1' | 'v2'

  if (legacyMode) {
    return <App />
  }

  const handleIdentified = (id) => {
    try {
      localStorage.setItem(IDENTITY_KEY, JSON.stringify(id))
    } catch {
      // best-effort
    }
    setIdentity(id)
    setView('espace')
  }

  const handleLogout = () => {
    try {
      localStorage.removeItem(IDENTITY_KEY)
    } catch {
      // best-effort
    }
    setIdentity(null)
    setView('home')
  }

  if (!identity) {
    return <Home onIdentified={handleIdentified} />
  }

  if (view === 'v1') {
    return <Volet1Loader identity={identity} onBack={() => setView('espace')} />
  }

  if (view === 'v2') {
    return <Volet2Loader identity={identity} onBack={() => setView('espace')} />
  }

  return (
    <Espace
      identity={identity}
      onOpenVolet1={() => setView('v1')}
      onOpenVolet2={() => setView('v2')}
      onLogout={handleLogout}
    />
  )
}

// Même principe que Volet2Loader ci-dessous, pour le volet 1 : va chercher
// un éventuel brouillon déjà enregistré en base avant d'ouvrir App.jsx,
// pour permettre la reprise même depuis un autre appareil. Si le volet est
// déjà 'completed', Espace.jsx propose "Revoir mes réponses" (lecture
// seule) à la place de "Continuer" — ce composant ne gère donc en pratique
// que les cas 'draft' et 'aucun brouillon'.
function Volet1Loader({ identity, onBack }) {
  const [state, setState] = useState({ loading: true, answers: null, status: null })

  useEffect(() => {
    let cancelled = false
    supabase
      .rpc('get_espace', { p_email: identity.email })
      .then(({ data, error }) => {
        if (cancelled) return
        const row = !error && data ? data.find((r) => r.workbook_type === 'refonte_1500') : null
        setState({ loading: false, answers: row?.answers || null, status: row?.status || null })
      })
    return () => {
      cancelled = true
    }
  }, [identity.email])

  if (state.loading) {
    return (
      <div className="admin-shell">
        <p>Chargement...</p>
      </div>
    )
  }

  return (
    <App
      onBackToEspace={onBack}
      initialAnswers={state.answers}
      initialStatus={state.status}
      prefillIdentity={identity}
    />
  )
}

// Petit composant intermédiaire : va chercher l'état existant du volet 2
// (brouillon ou terminé) avant d'afficher Contenu.jsx, pour reprendre pile
// où le client s'était arrêté.
function Volet2Loader({ identity, onBack }) {
  const [state, setState] = useState({ loading: true, answers: null, status: null })

  useEffect(() => {
    let cancelled = false
    supabase
      .rpc('get_espace', { p_email: identity.email })
      .then(({ data, error }) => {
        if (cancelled) return
        const row = !error && data ? data.find((r) => r.workbook_type === 'contenu') : null
        setState({ loading: false, answers: row?.answers || null, status: row?.status || null })
      })
    return () => {
      cancelled = true
    }
  }, [identity.email])

  if (state.loading) {
    return (
      <div className="admin-shell">
        <p>Chargement...</p>
      </div>
    )
  }

  return (
    <Contenu
      email={identity.email}
      clientName={identity.clientName}
      initialAnswers={state.answers}
      initialStatus={state.status}
      onBackToEspace={onBack}
    />
  )
}

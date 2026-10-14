import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'
import { sections as volet1Sections, WORKBOOK_TITLE as volet1Title } from './data.js'
import { CONTENU_TITLE, buildContenuSections } from './dataContenu.js'
import { RecapContent } from './recap.jsx'

const LEGACY_DRAFT_KEY = 'kalanis-workbook-refonte-1500-draft-v1'

function statusLabel(status) {
  if (status === 'completed') return 'Terminé'
  if (status === 'draft') return 'En cours'
  return 'Non commencé'
}

function VoletCard({ title, description, status, onOpen, onReview }) {
  return (
    <div className="repeat-card">
      <div className="repeat-card-title">{title}</div>
      <p className="subtitle">{description}</p>
      <div className={'admin-nav-dot'} style={{ display: 'inline-block', marginRight: 8 }}>
        {status === 'completed' ? '●' : status === 'draft' ? '◐' : '○'}
      </div>
      <strong>{statusLabel(status)}</strong>
      <div className="download-actions" style={{ marginTop: 16 }}>
        {status === 'completed' ? (
          <>
            <button className="btn-secondary" onClick={onReview}>
              Revoir mes réponses
            </button>
          </>
        ) : (
          <button className="btn-primary" onClick={onOpen}>
            {status === 'draft' ? 'Continuer' : 'Commencer'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function Espace({ identity, onOpenVolet1, onOpenVolet2, onLogout }) {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState([])
  const [reviewing, setReviewing] = useState(null) // 'v1' | 'v2' | null

  useEffect(() => {
    let cancelled = false
    supabase
      .rpc('get_espace', { p_email: identity.email })
      .then(({ data, error }) => {
        if (cancelled) return
        if (!error) setRows(data || [])
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [identity.email])

  if (loading) {
    return (
      <div className="admin-shell">
        <p>Chargement de ton espace...</p>
      </div>
    )
  }

  const row1 = rows.find((r) => r.workbook_type === 'refonte_1500')
  const row2 = rows.find((r) => r.workbook_type === 'contenu')

  let status1 = row1 ? row1.status : 'none'
  if (status1 === 'none') {
    try {
      if (localStorage.getItem(LEGACY_DRAFT_KEY)) status1 = 'draft'
    } catch {
      // ignore
    }
  }
  const status2 = row2 ? row2.status : 'none'

  if (reviewing === 'v1' && row1) {
    return (
      <div className="app-shell">
        <main className="main-panel">
          <div className="main-content">
            <button className="btn-secondary" onClick={() => setReviewing(null)} style={{ marginBottom: 16 }}>
              ← Mon espace
            </button>
            <RecapContent answers={row1.answers} clientName={row1.client_name} sections={volet1Sections} title={volet1Title} />
          </div>
        </main>
      </div>
    )
  }

  if (reviewing === 'v2' && row2) {
    const route2 = row2.answers?.route?.route
    return (
      <div className="app-shell">
        <main className="main-panel">
          <div className="main-content">
            <button className="btn-secondary" onClick={() => setReviewing(null)} style={{ marginBottom: 16 }}>
              ← Mon espace
            </button>
            <RecapContent
              answers={row2.answers}
              clientName={row2.client_name}
              sections={buildContenuSections(route2)}
              title={CONTENU_TITLE}
            />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="admin-shell">
      <div className="admin-topbar">
        <div className="sidebar-brand">KALANIS — {identity.clientName}</div>
        <button className="btn-secondary" onClick={onLogout}>
          Changer de compte
        </button>
      </div>

      <p className="subtitle">
        Bienvenue {identity.clientName}. Voici tes deux espaces de réponses — tu peux y revenir à
        tout moment.
      </p>

      <div className="admin-list" style={{ display: 'grid', gap: 20 }}>
        <VoletCard
          title="Volet 1 — Cadrage & Refonte de profil"
          description="Le workbook de préparation de ta refonte de profil."
          status={status1}
          onOpen={onOpenVolet1}
          onReview={() => setReviewing('v1')}
        />
        <VoletCard
          title="Volet 2 — Création de contenu"
          description="La matière pour construire tes templates de contenu."
          status={status2}
          onOpen={onOpenVolet2}
          onReview={() => setReviewing('v2')}
        />
      </div>
    </div>
  )
}

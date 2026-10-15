import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'
import { sections as volet1Sections, WORKBOOK_TITLE as volet1Title } from './data.js'
import { CONTENU_TITLE, buildContenuSections } from './dataContenu.js'
import { RecapContent, buildRecapSections } from './recap.jsx'

const LEGACY_DRAFT_KEY = 'kalanis-workbook-refonte-1500-draft-v1'

// Reconstruit les réponses structurées d'un brouillon local du volet 1 créé
// avant l'arrivée de l'espace client (clé fixe, sans email, lue via
// localStorage dans ce même navigateur). Sans cette reconstruction, le statut
// pouvait afficher "En cours" pour ce brouillon tout en restant bloqué à 0 %,
// faute d'accès à son contenu pour calculer une vraie progression.
function legacyDraftAnswers() {
  try {
    const raw = localStorage.getItem(LEGACY_DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const flat = parsed?.answers
    if (!flat || typeof flat !== 'object') return null
    const extraCounts = parsed.extraCounts || {}
    const structured = {}
    volet1Sections.forEach((s) => {
      if (s.kind === 'repeat') {
        const count = extraCounts[s.id] ?? s.repeatCount
        const items = Array.from({ length: count }).map((_, i) => {
          const obj = {}
          s.repeatFields.forEach((f) => {
            obj[f.key] = flat[`${s.id}.${i}.${f.key}`] || ''
          })
          return obj
        })
        const fieldsObj = {}
        ;(s.fields || []).forEach((f) => {
          fieldsObj[f.key] = flat[`${s.id}.${f.key}`] || ''
        })
        structured[s.id] = { fields: fieldsObj, items }
      } else {
        const obj = {}
        s.fields.forEach((f) => {
          obj[f.key] = flat[`${s.id}.${f.key}`] || ''
        })
        structured[s.id] = obj
      }
    })
    return structured
  } catch {
    return null
  }
}

function statusLabel(status) {
  if (status === 'completed') return 'Terminé'
  if (status === 'draft') return 'En cours'
  return 'Non commencé'
}

// Progression approximative : proportion des sections "remplissables" (hors
// intro/final) qui ont au moins une réponse, au sens de buildRecapSections
// (même logique que le récap/export, donc toujours cohérente avec ce que le
// client voit dans "Revoir mes réponses").
function computeProgress(answers, sectionsList) {
  const total = sectionsList.filter((s) => s.kind !== 'intro' && s.kind !== 'final').length
  if (total === 0 || !answers) return 0
  const filled = buildRecapSections(answers, sectionsList).length
  return Math.min(100, Math.round((filled / total) * 100))
}

function VoletCard({ title, description, status, progress, onOpen, onReview }) {
  const dot = status === 'completed' ? '●' : status === 'draft' ? '◐' : '○'
  return (
    <div className="volet-card">
      <div className="volet-card-top">
        <div className="volet-card-text">
          <div className="volet-card-title">{title}</div>
          <p className="volet-card-desc">{description}</p>
        </div>
        <div className="volet-card-status">
          <span className="admin-nav-dot">{dot}</span>
          {statusLabel(status)}
        </div>
      </div>
      <div className="volet-card-progress-track">
        <div className="volet-card-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="volet-card-footer">
        <span className="volet-card-progress-text">{progress}% complété</span>
        {status === 'completed' ? (
          <button className="btn-secondary" onClick={onReview}>
            Revoir mes réponses
          </button>
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
  const legacyAnswers = status1 === 'none' ? legacyDraftAnswers() : null
  if (status1 === 'none' && legacyAnswers) status1 = 'draft'
  const status2 = row2 ? row2.status : 'none'

  const route2 = row2?.answers?.route?.route
  const volet2Sections = buildContenuSections(route2)
  const progress1 =
    status1 === 'completed'
      ? 100
      : row1
      ? computeProgress(row1.answers, volet1Sections)
      : legacyAnswers
      ? computeProgress(legacyAnswers, volet1Sections)
      : 0
  const progress2 = status2 === 'completed' ? 100 : row2 ? computeProgress(row2.answers, volet2Sections) : 0

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
              sections={volet2Sections}
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
        <div className="sidebar-brand">KALANIS : {identity.clientName}</div>
        <button className="btn-secondary" onClick={onLogout}>
          Changer de compte
        </button>
      </div>

      <h1>Le Fond de l'Évidence</h1>
      <p className="subtitle">
        Bienvenue {identity.clientName}. Voici tes deux espaces de réponses, tu peux y revenir à
        tout moment.
      </p>

      <div className="admin-list" style={{ display: 'grid', gap: 14 }}>
        <VoletCard
          title="Volet 1 : Cadrage & Refonte de profil"
          description="Le workbook de préparation de ta refonte de profil."
          status={status1}
          progress={progress1}
          onOpen={onOpenVolet1}
          onReview={() => setReviewing('v1')}
        />
        <VoletCard
          title="Volet 2 : Création de contenu"
          description="La matière pour construire tes templates de contenu."
          status={status2}
          progress={progress2}
          onOpen={onOpenVolet2}
          onReview={() => setReviewing('v2')}
        />
      </div>
    </div>
  )
}

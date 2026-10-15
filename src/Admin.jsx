import { useState, useEffect } from 'react'
import { supabase } from './supabase.js'
import { sections as volet1Sections, WORKBOOK_TITLE as volet1Title } from './data.js'
import { buildContenuSections, CONTENU_TITLE } from './dataContenu.js'
import { buildRecapSections, toMarkdown } from './recap.jsx'

function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

// Toute ligne dont le `workbook_type` n'est pas reconnu (valeur absente ou
// différente de 'contenu', notamment les lignes historiques créées avant
// l'ajout de cette colonne) est traitée comme 'refonte_1500'. C'est ce que
// fait déjà `sectionsAndTitleFor` pour choisir les bonnes sections, mais le
// nom normalisé doit aussi être utilisé partout où ce code lit
// `row.workbook_type` directement, sinon ces lignes se retrouvent groupées
// sous une clé différente et n'apparaissent plus dans l'onglet "Volet 1".
function normWorkbookType(row) {
  return row.workbook_type === 'contenu' ? 'contenu' : 'refonte_1500'
}

function sectionsAndTitleFor(row) {
  if (normWorkbookType(row) === 'contenu') {
    const route = row.answers?.route?.route
    return { sections: buildContenuSections(route), title: CONTENU_TITLE }
  }
  return { sections: volet1Sections, title: volet1Title }
}

function downloadMarkdownFor(row) {
  const { sections, title } = sectionsAndTitleFor(row)
  const md = toMarkdown(row.answers || {}, row.client_name, sections, title)
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `workbook-${(row.client_name || 'kalanis').trim().replace(/\s+/g, '-').toLowerCase()}-${normWorkbookType(row)}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Inchangé dans son fonctionnement (accordéon, impression PDF, export .md).
// Seule différence : les sections/titre viennent du volet de `row` au lieu
// d'être toujours ceux du volet 1.
export function SubmissionDetail({ row }) {
  const { sections, title } = sectionsAndTitleFor(row)
  const navSections = sections.filter((s) => s.kind !== 'intro' && s.kind !== 'final')
  const answers = row.answers || {}
  const recapSections = buildRecapSections(answers, sections)
  const recapById = new Map(recapSections.map((s) => [s.id, s]))
  const hasMotDeLaFin = !!answers.final?.mot_de_la_fin

  const [openId, setOpenIdState] = useState(null)
  const toggleSection = (anchorId) => {
    setOpenIdState((prev) => (prev === anchorId ? null : anchorId))
  }

  const renderRow = (anchorId, sectionTitle, filled, body) => {
    const isOpen = openId === anchorId
    return (
      <div className="admin-section" id={anchorId} key={anchorId}>
        <button
          type="button"
          className={'admin-section-title admin-section-toggle' + (isOpen ? ' admin-section-toggle-open' : '')}
          onClick={() => toggleSection(anchorId)}
        >
          <span className="admin-section-chevron">▸</span>
          <span className="admin-nav-dot">{filled ? '●' : '○'}</span>
          {sectionTitle}
        </button>
        <div className={'admin-section-body' + (isOpen ? ' admin-section-body-open' : '')}>{body}</div>
      </div>
    )
  }

  return (
    <div className="admin-detail">
      <div className="admin-detail-header">
        <div>
          <div className="admin-detail-name">{title}</div>
          <div className="admin-detail-meta">
            {row.status === 'draft' ? 'Brouillon en cours · ' : ''}
            {formatDate(row.updated_at || row.created_at)}
          </div>
        </div>
        <div className="admin-detail-actions">
          <button className="btn-secondary admin-md-btn" onClick={() => downloadMarkdownFor(row)}>
            Télécharger en .md
          </button>
          <button className="btn-secondary admin-print-btn" onClick={() => window.print()}>
            Télécharger en PDF
          </button>
        </div>
      </div>

      <div className="admin-detail-list">
        {navSections.map((s) => {
          const anchorId = `admin-anchor-${row.id}-${s.id}`
          const recap = recapById.get(s.id)
          const body = recap ? (
            <>
              {recap.preamble.map((e) => (
                <div className="admin-field" key={'preamble-' + e.label}>
                  <span className="admin-field-label">{e.label}</span>
                  <span className="admin-field-value">{e.value}</span>
                </div>
              ))}
              {recap.items.map((item) => (
                <div className={recap.isRepeat ? 'admin-repeat-item' : ''} key={item.index}>
                  {recap.isRepeat && <div className="admin-repeat-num">#{item.index + 1}</div>}
                  {item.entries.map((e) => (
                    <div className="admin-field" key={e.label}>
                      <span className="admin-field-label">{e.label}</span>
                      <span className="admin-field-value">{e.value}</span>
                    </div>
                  ))}
                </div>
              ))}
            </>
          ) : (
            <div className="admin-field-empty">Section non remplie.</div>
          )
          return renderRow(anchorId, s.title, !!recap, body)
        })}

        {hasMotDeLaFin &&
          renderRow(
            `admin-anchor-${row.id}-final`,
            'Le mot de la fin',
            true,
            <div className="admin-field-value">{answers.final.mot_de_la_fin}</div>
          )}
      </div>
    </div>
  )
}

function normKey(row) {
  const email = (row.client_email || '').trim().toLowerCase()
  if (email) return `email:${email}`
  return `name:${(row.client_name || 'sans-nom').trim().toLowerCase()}`
}

function voletBadge(row) {
  if (!row) return { label: 'Pas commencé', cls: '' }
  if (row.status === 'draft') return { label: 'Brouillon', cls: 'step-active' }
  return { label: 'Terminé', cls: 'step-done' }
}

// Regroupe les lignes par client (email en priorité, nom en repli pour les
// lignes historiques sans email) : chaque client a au plus une ligne par
// volet (refonte_1500 / contenu), ouvrables séparément. Remplace l'ancienne
// liste plate "une ligne = une soumission".
function groupByClient(rows) {
  const groups = new Map()
  rows.forEach((row) => {
    const key = normKey(row)
    if (!groups.has(key)) {
      groups.set(key, { key, clientName: row.client_name, clientEmail: row.client_email, volets: {}, lastActivity: '' })
    }
    const g = groups.get(key)
    const voletKey = normWorkbookType(row)
    const existing = g.volets[voletKey]
    // S'il y a déjà une ligne pour ce volet (ne devrait plus arriver avec le
    // nouveau système d'upsert, sauf vieilles données), on garde la plus récente.
    if (!existing || new Date(row.updated_at || row.created_at) > new Date(existing.updated_at || existing.created_at)) {
      g.volets[voletKey] = row
    }
    const activity = row.updated_at || row.created_at
    if (!g.lastActivity || new Date(activity) > new Date(g.lastActivity)) g.lastActivity = activity
    if (row.client_name) g.clientName = row.client_name
    if (row.client_email) g.clientEmail = row.client_email
  })
  return Array.from(groups.values()).sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity))
}

export default function Admin() {
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [openClientKey, setOpenClientKey] = useState(null)
  const [openVolet, setOpenVolet] = useState(null) // 'refonte_1500' | 'contenu' | null

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setChecking(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      if (active) setSession(s)
    })
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session) return
    let active = true
    setLoading(true)
    supabase
      .from('client_workbooks')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return
        if (!error) setRows(data || [])
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [session])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setLoginError('Identifiants incorrects.')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (checking) {
    return (
      <div className="admin-shell admin-login-shell">
        <p>Chargement...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="admin-shell admin-login-shell">
        <form className="admin-login-card" onSubmit={handleLogin}>
          <div className="sidebar-brand">KALANIS</div>
          <h2>Connexion admin</h2>
          <div className="field">
            <label>Email</label>
            <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
          </div>
          <div className="field">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {loginError && <div className="admin-error">{loginError}</div>}
          <button className="btn-primary" type="submit">
            Se connecter
          </button>
        </form>
      </div>
    )
  }

  const clientGroups = groupByClient(rows)

  return (
    <div className="admin-shell">
      <div className="admin-topbar">
        <div className="sidebar-brand">KALANIS (réponses reçues)</div>
        <button className="btn-secondary" onClick={handleLogout}>
          Se déconnecter
        </button>
      </div>

      {loading && <p>Chargement...</p>}
      {!loading && clientGroups.length === 0 && <p>Aucune réponse pour l'instant.</p>}

      <div className="admin-list">
        {clientGroups.map((g) => {
          const isOpen = openClientKey === g.key
          const b1 = voletBadge(g.volets.refonte_1500)
          const b2 = voletBadge(g.volets.contenu)
          return (
            <div className="admin-list-item" key={g.key}>
              <button
                className="admin-list-header"
                onClick={() => {
                  setOpenClientKey(isOpen ? null : g.key)
                  setOpenVolet(null)
                }}
              >
                <span>
                  {g.clientName || 'Sans nom'}
                  {g.clientEmail ? ` · ${g.clientEmail}` : ''}
                </span>
                <span className="admin-list-date">{formatDate(g.lastActivity)}</span>
              </button>

              {isOpen && (
                <div style={{ padding: '12px 16px', display: 'flex', gap: 10 }}>
                  <button
                    className={'step' + (openVolet === 'refonte_1500' ? ' step-active' : b1.cls ? ' ' + b1.cls : '')}
                    onClick={() => setOpenVolet(openVolet === 'refonte_1500' ? null : 'refonte_1500')}
                    disabled={!g.volets.refonte_1500}
                  >
                    <span className="step-label">Volet 1 : Cadrage & Refonte ({b1.label})</span>
                  </button>
                  <button
                    className={'step' + (openVolet === 'contenu' ? ' step-active' : b2.cls ? ' ' + b2.cls : '')}
                    onClick={() => setOpenVolet(openVolet === 'contenu' ? null : 'contenu')}
                    disabled={!g.volets.contenu}
                  >
                    <span className="step-label">Volet 2 : Création de contenu ({b2.label})</span>
                  </button>
                </div>
              )}

              {isOpen && openVolet && g.volets[openVolet] && (
                <SubmissionDetail row={g.volets[openVolet]} key={openVolet} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

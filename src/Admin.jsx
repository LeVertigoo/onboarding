import { useState, useEffect } from 'react'
import { supabase } from './supabase.js'
import { sections } from './data.js'
import { buildRecapSections, toMarkdown } from './recap.jsx'

// Same section list the client sidebar uses (minus intro/final), so the
// admin nav mirrors "le workbook de base côté client" 1:1.
const navSections = sections.filter((s) => s.kind !== 'intro' && s.kind !== 'final')

function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

function downloadMarkdownFor(row) {
  const md = toMarkdown(row.answers || {}, row.client_name)
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `workbook-${(row.client_name || 'refonte-1500').trim().replace(/\s+/g, '-').toLowerCase()}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function SubmissionDetail({ row }) {
  const answers = row.answers || {}
  const recapSections = buildRecapSections(answers)
  const filledIds = new Set(recapSections.map((s) => s.id))
  const hasMotDeLaFin = !!answers.final?.mot_de_la_fin

  const scrollToAnchor = (anchorId) => {
    document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="admin-detail">
      <div className="admin-detail-header">
        <div>
          <div className="admin-detail-name">{row.client_name || 'Sans nom'}</div>
          <div className="admin-detail-meta">
            {row.client_email ? `${row.client_email} · ` : ''}
            {formatDate(row.created_at)}
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

      {/* Nav mirrors the client-side sidebar/checklist: click to jump straight
          to a section instead of scrolling through the whole submission. All
          sections stay in the DOM (nothing is hidden/paginated), so this is
          purely additive — Ctrl/Cmd+F still searches everything, and PDF
          print/export is untouched. */}
      <div className="admin-detail-layout">
        <nav className="admin-detail-nav">
          {navSections.map((s) => {
            const filled = filledIds.has(s.id)
            return (
              <button
                key={s.id}
                type="button"
                className={'admin-nav-item' + (filled ? '' : ' admin-nav-item-empty')}
                onClick={() => scrollToAnchor(`admin-anchor-${s.id}`)}
                title={filled ? undefined : 'Section non remplie'}
              >
                <span className="admin-nav-dot">{filled ? '●' : '○'}</span>
                <span>{s.title}</span>
              </button>
            )
          })}
          {hasMotDeLaFin && (
            <button
              type="button"
              className="admin-nav-item"
              onClick={() => scrollToAnchor('admin-anchor-final')}
            >
              <span className="admin-nav-dot">●</span>
              <span>Le mot de la fin</span>
            </button>
          )}
        </nav>

        <div className="admin-detail-main">
          {recapSections.map((s) => (
            <div className="admin-section" id={`admin-anchor-${s.id}`} key={s.id}>
              <div className="admin-section-title">{s.title}</div>
              {s.preamble.map((e) => (
                <div className="admin-field" key={'preamble-' + e.label}>
                  <span className="admin-field-label">{e.label}</span>
                  <span className="admin-field-value">{e.value}</span>
                </div>
              ))}
              {s.items.map((item) => (
                <div className={s.isRepeat ? 'admin-repeat-item' : ''} key={item.index}>
                  {s.isRepeat && <div className="admin-repeat-num">#{item.index + 1}</div>}
                  {item.entries.map((e) => (
                    <div className="admin-field" key={e.label}>
                      <span className="admin-field-label">{e.label}</span>
                      <span className="admin-field-value">{e.value}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}

          {hasMotDeLaFin && (
            <div className="admin-section" id="admin-anchor-final">
              <div className="admin-section-title">Le mot de la fin</div>
              <div className="admin-field-value">{answers.final.mot_de_la_fin}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Admin() {
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [openId, setOpenId] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setChecking(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    setLoading(true)
    supabase
      .from('client_workbooks')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error) setRows(data || [])
        setLoading(false)
      })
  }, [session])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setLoginError("Identifiants incorrects.")
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

  return (
    <div className="admin-shell">
      <div className="admin-topbar">
        <div className="sidebar-brand">KALANIS (réponses reçues)</div>
        <button className="btn-secondary" onClick={handleLogout}>
          Se déconnecter
        </button>
      </div>

      {loading && <p>Chargement...</p>}
      {!loading && rows.length === 0 && <p>Aucune réponse pour l'instant.</p>}

      <div className="admin-list">
        {rows.map((row) => (
          <div className="admin-list-item" key={row.id}>
            <button
              className="admin-list-header"
              onClick={() => setOpenId(openId === row.id ? null : row.id)}
            >
              <span>{row.client_name || 'Sans nom'}</span>
              <span className="admin-list-date">{formatDate(row.created_at)}</span>
            </button>
            {openId === row.id && <SubmissionDetail row={row} />}
          </div>
        ))}
      </div>
    </div>
  )
}

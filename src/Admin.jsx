import { useState, useEffect } from 'react'
import { supabase } from './supabase.js'
import { sections } from './data.js'

function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

function fieldLabelFor(sectionId, key) {
  const s = sections.find((sec) => sec.id === sectionId)
  if (!s) return key
  const fields = s.kind === 'repeat' ? s.repeatFields : s.fields
  const f = fields?.find((fl) => fl.key === key)
  return f ? f.label : key
}

function sectionTitleFor(sectionId) {
  const s = sections.find((sec) => sec.id === sectionId)
  return s ? `Section ${s.num} — ${s.title}` : sectionId
}

function SubmissionDetail({ row }) {
  const answers = row.answers || {}
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
        <button className="btn-secondary admin-print-btn" onClick={() => window.print()}>
          Télécharger en PDF
        </button>
      </div>

      {sections
        .filter((s) => s.kind !== 'intro' && s.kind !== 'final')
        .map((s) => {
          const value = answers[s.id]
          if (!value) return null
          const isRepeat = s.kind === 'repeat'
          const items = isRepeat ? (Array.isArray(value) ? value : []) : [value]
          const nonEmptyItems = items.filter((it) => it && Object.values(it).some((v) => v && String(v).trim()))
          if (nonEmptyItems.length === 0) return null
          return (
            <div className="admin-section" key={s.id}>
              <div className="admin-section-title">{sectionTitleFor(s.id)}</div>
              {nonEmptyItems.map((item, i) => (
                <div className={isRepeat ? 'admin-repeat-item' : ''} key={i}>
                  {isRepeat && <div className="admin-repeat-num">#{i + 1}</div>}
                  {Object.entries(item).map(([k, v]) =>
                    v && String(v).trim() ? (
                      <div className="admin-field" key={k}>
                        <span className="admin-field-label">{fieldLabelFor(s.id, k)}</span>
                        <span className="admin-field-value">{v}</span>
                      </div>
                    ) : null
                  )}
                </div>
              ))}
            </div>
          )
        })}

      {answers.final?.mot_de_la_fin && (
        <div className="admin-section">
          <div className="admin-section-title">Le mot de la fin</div>
          <div className="admin-field-value">{answers.final.mot_de_la_fin}</div>
        </div>
      )}
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
        <div className="sidebar-brand">KALANIS — Réponses reçues</div>
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

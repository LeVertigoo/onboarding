import { useState } from 'react'

// Première page : le client renseigne nom + email une seule fois, ce qui
// crée (virtuellement — rien n'est écrit en base ici) son "espace" avec les
// deux volets. S'il revient plus tard avec les mêmes infos, il retrouve
// l'état de ses deux volets (voir Espace.jsx / Root.jsx).
export default function Home({ onIdentified }) {
  const [clientName, setClientName] = useState('')
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)

  const emailValid = /\S+@\S+\.\S+/.test(email.trim())
  const canSubmit = clientName.trim().length > 1 && emailValid

  const handleSubmit = (e) => {
    e.preventDefault()
    setTouched(true)
    if (!canSubmit) return
    onIdentified({ clientName: clientName.trim(), email: email.trim().toLowerCase() })
  }

  return (
    <div className="admin-shell admin-login-shell">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <div className="sidebar-brand">KALANIS</div>
        <h2>L'Espace de l'Évidence</h2>
        <p className="subtitle">
          Entre ton nom et ton email pour accéder à ton espace. Si tu as déjà commencé, tu
          retrouveras tes réponses en cours.
        </p>
        <div className="field">
          <label>Ton prénom et nom</label>
          <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} />
        </div>
        <div className="field">
          <label>Ton email</label>
          <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        {touched && !canSubmit && (
          <div className="admin-error">Merci de renseigner ton nom et un email valide.</div>
        )}
        <button className="btn-primary" type="submit">
          Accéder à mon espace
        </button>
      </form>
    </div>
  )
}

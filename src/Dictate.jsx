import { useState, useEffect, useRef } from 'react'

// Partagé entre le volet 1 (App.jsx) et le volet 2 (Contenu.jsx).
// Dictée vocale : le client parle, le texte s'écrit dans le champ en direct.
// Utilise la reconnaissance vocale intégrée au navigateur (Chrome, Edge,
// Safari récents), donc aucun fichier audio, aucun stockage, aucun envoi à
// gérer : on récupère directement du texte, modifiable ensuite. Le bouton ne
// s'affiche pas si le navigateur ne le supporte pas (Firefox notamment).
const SpeechRecognitionImpl =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null

export default function DictateButton({ value, onChange }) {
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const recRef = useRef(null)
  const wantRef = useRef(false)
  const baseRef = useRef('')
  const finalRef = useRef('')
  const valueRef = useRef(value)
  const onChangeRef = useRef(onChange)
  valueRef.current = value
  onChangeRef.current = onChange

  useEffect(() => () => {
    wantRef.current = false
    try { recRef.current?.stop() } catch { /* rien */ }
  }, [])

  if (!SpeechRecognitionImpl) return null

  const join = (a, b) => (a && b ? (/\s$/.test(a) ? a + b : a + ' ' + b) : a || b)

  const startSession = () => {
    const rec = new SpeechRecognitionImpl()
    rec.lang = 'fr-FR'
    rec.continuous = true
    rec.interimResults = true
    baseRef.current = valueRef.current || ''
    finalRef.current = ''
    rec.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const txt = e.results[i][0].transcript.trim()
        if (e.results[i].isFinal) finalRef.current = join(finalRef.current, txt)
        else interim = join(interim, txt)
      }
      onChangeRef.current(join(baseRef.current, join(finalRef.current, interim)))
    }
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        wantRef.current = false
        setError("Autorise l'accès au micro dans ton navigateur pour utiliser la dictée.")
      }
    }
    rec.onend = () => {
      // Le navigateur coupe tout seul après un silence : on relance tant que
      // le client n'a pas cliqué sur « Arrêter ».
      onChangeRef.current(join(baseRef.current, finalRef.current))
      if (wantRef.current) {
        try { startSession() } catch { wantRef.current = false; setListening(false) }
      } else {
        setListening(false)
      }
    }
    recRef.current = rec
    rec.start()
  }

  const toggle = () => {
    setError('')
    if (listening) {
      wantRef.current = false
      try { recRef.current?.stop() } catch { setListening(false) }
      return
    }
    try {
      wantRef.current = true
      startSession()
      setListening(true)
    } catch {
      wantRef.current = false
      setError("La dictée n'a pas pu démarrer sur ce navigateur.")
    }
  }

  return (
    <div className="dictate-row">
      <button
        type="button"
        className={'dictate-btn' + (listening ? ' dictate-btn-on' : '')}
        onClick={toggle}
      >
        <span className="dictate-dot" aria-hidden="true" />
        {listening ? 'Arrêter la dictée' : "Répondre à l'oral"}
      </button>
      {listening && <span className="dictate-hint">Parle librement, le texte s'écrit au fur et à mesure.</span>}
      {error && <span className="dictate-error">{error}</span>}
    </div>
  )
}

import { useState, useMemo, useEffect } from 'react'
import { supabase } from './supabase.js'
import { RecapContent, toMarkdown, buildRecapSections } from './recap.jsx'
import { CONTENU_TITLE, routeSection, contenuSectionsFor, contenuFinalSection, buildContenuSections } from './dataContenu.js'

// Volet 2 — "Création de contenu". Même logique de moteur que App.jsx
// (volet 1), VOLONTAIREMENT dupliquée plutôt que partagée : ça évite de
// toucher à App.jsx (zéro risque de régression sur le volet existant) au
// prix d'un peu de code en double. Différence principale : la liste des
// sections dépend de la réponse à la question de branchement (`route`),
// donc elle est recalculée dynamiquement au lieu d'être une liste figée.
//
// Les brouillons et la soumission finale passent par les fonctions SQL
// save_draft / complete_workbook (voir supabase/migration_espace_client.sql)
// au lieu d'un simple .insert() : ça permet la reprise depuis n'importe quel
// appareil (pas seulement le navigateur où le brouillon a été commencé).

const WORKBOOK_TYPE = 'contenu'

function fieldKey(sectionId, key) {
  return `${sectionId}.${key}`
}

// Mêmes règles showIf que App.jsx (voir FieldList là-bas) : `in` pour un
// champ simple, `includes` pour un sibling multichoice (tableau).
function visibleFields(fields, sectionId, answers) {
  return fields.filter((f) => {
    if (!f.showIf) return true
    const controlValue = answers[fieldKey(sectionId, f.showIf.field)]
    if (f.showIf.notEmpty) return !!(controlValue && String(controlValue).trim())
    if (f.showIf.in) return f.showIf.in.includes(controlValue)
    if (f.showIf.includes) {
      const arr = Array.isArray(controlValue) ? controlValue : []
      return arr.includes(f.showIf.includes)
    }
    return true
  })
}

const DRAFT_FALLBACK_KEY = 'kalanis-workbook-contenu-draft-fallback-v1'

// Reconstruit l'état "plat" (utilisé pendant l'édition) à partir de la forme
// structurée stockée en base (celle utilisée par le récap / l'admin).
function structuredToFlat(structured, sectionsList) {
  const flat = {}
  sectionsList.forEach((s) => {
    const obj = structured?.[s.id]
    if (!obj) return
    ;(s.fields || []).forEach((f) => {
      if (obj[f.key] !== undefined) flat[fieldKey(s.id, f.key)] = obj[f.key]
    })
  })
  return flat
}

function Field({ label, type, placeholder, value, onChange, rows, options }) {
  return (
    <div className="field">
      <label>{label}</label>
      {type === 'textarea' ? (
        <textarea
          rows={rows || 3}
          placeholder={placeholder}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : type === 'choice' ? (
        <div className="choice-row">
          {(options || []).map((opt) => {
            const selected = value === opt.value
            return (
              <button
                type="button"
                key={opt.value}
                className={'choice-btn' + (selected ? ' choice-btn-selected' : '')}
                onClick={() => onChange(opt.value)}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      ) : type === 'multichoice' ? (
        <div className="choice-row">
          {(options || []).map((opt) => {
            const current = Array.isArray(value) ? value : []
            const selected = current.includes(opt.value)
            return (
              <button
                type="button"
                key={opt.value}
                className={'choice-btn' + (selected ? ' choice-btn-selected' : '')}
                onClick={() =>
                  onChange(selected ? current.filter((v) => v !== opt.value) : [...current, opt.value])
                }
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      ) : (
        <input
          type="text"
          placeholder={placeholder}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}

export default function Contenu({ email, clientName, initialAnswers, initialStatus, onBackToEspace }) {
  const alreadyDone = initialStatus === 'completed'

  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState(() => structuredToFlat(initialAnswers || {}, [routeSection]))
  const [status, setStatus] = useState(alreadyDone ? 'done' : 'idle')

  const routeAnswer = answers[fieldKey('route', 'route')]

  // Une fois la route connue, on complète l'état plat avec les champs des
  // sections de cette route (au cas où un brouillon existait déjà dessus).
  useEffect(() => {
    if (!routeAnswer || alreadyDone) return
    const routeSections = contenuSectionsFor(routeAnswer)
    setAnswers((prev) => ({
      ...structuredToFlat(initialAnswers || {}, [...routeSections, contenuFinalSection]),
      ...prev,
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeAnswer])

  const fullSections = useMemo(() => buildContenuSections(routeAnswer), [routeAnswer])

  const section = fullSections[Math.min(stepIndex, fullSections.length - 1)]
  const total = fullSections.length
  const isLast = stepIndex === total - 1

  const payload = useMemo(() => {
    const structured = {}
    fullSections.forEach((s) => {
      const obj = {}
      s.fields.forEach((f) => {
        obj[f.key] = answers[fieldKey(s.id, f.key)] || ''
      })
      structured[s.id] = obj
    })
    return structured
  }, [answers, fullSections])

  // Brouillon : sauvegardé en base (reprise multi-appareil), avec un repli
  // localStorage best-effort si l'appel réseau échoue (hors-ligne, etc.).
  useEffect(() => {
    if (status === 'done' || !routeAnswer) return
    const id = setTimeout(() => {
      supabase
        .rpc('save_draft', {
          p_email: email,
          p_client_name: clientName,
          p_workbook_type: WORKBOOK_TYPE,
          p_answers: payload,
        })
        .then(({ error }) => {
          if (error) {
            try {
              localStorage.setItem(DRAFT_FALLBACK_KEY, JSON.stringify({ answers, stepIndex, savedAt: Date.now() }))
            } catch {
              // best-effort uniquement
            }
          }
        })
    }, 600)
    return () => clearTimeout(id)
  }, [payload, status, routeAnswer, email, clientName, answers, stepIndex])

  const setValue = (key, value) => setAnswers((prev) => ({ ...prev, [key]: value }))
  const goNext = () => setStepIndex((i) => Math.min(i + 1, total - 1))
  const goPrev = () => setStepIndex((i) => Math.max(i - 1, 0))

  const handleSubmit = async () => {
    setStatus('sending')
    const { error } = await supabase.rpc('complete_workbook', {
      p_email: email,
      p_client_name: clientName,
      p_workbook_type: WORKBOOK_TYPE,
      p_answers: payload,
    })
    if (error) {
      console.error(error)
      setStatus('error')
    } else {
      setStatus('done')
    }
  }

  const downloadMarkdown = () => {
    const md = toMarkdown(payload, clientName, fullSections, CONTENU_TITLE)
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workbook-contenu-${(clientName || 'kalanis').trim().replace(/\s+/g, '-').toLowerCase()}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (status === 'done') {
    const filled = buildRecapSections(payload, fullSections).length > 0
    return (
      <div className="app-shell">
        <main className="main-panel">
          <div className="main-content">
            <div className="submit-area">
              <div className="submit-success-block">
                <div className="submit-success">
                  {alreadyDone
                    ? `Ce volet est déjà complet, merci${clientName ? `, ${clientName}` : ''}.`
                    : `Réponses enregistrées, merci${clientName ? `, ${clientName}` : ''}.`}
                </div>
                <div className="download-actions">
                  {onBackToEspace && (
                    <button className="btn-secondary" onClick={onBackToEspace}>
                      ← Retour à mon espace
                    </button>
                  )}
                  {filled && (
                    <>
                      <button className="btn-secondary" onClick={() => window.print()}>
                        Télécharger en PDF
                      </button>
                      <button className="btn-secondary" onClick={downloadMarkdown}>
                        Télécharger en Markdown
                      </button>
                    </>
                  )}
                </div>
                {filled && (
                  <div className="client-recap">
                    <RecapContent answers={payload} clientName={clientName} sections={fullSections} title={CONTENU_TITLE} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">KALANIS</div>
        <div className="sidebar-title">{CONTENU_TITLE}</div>
        {onBackToEspace && (
          <button type="button" className="draft-banner" style={{ marginTop: 16 }} onClick={onBackToEspace}>
            ← Mon espace
          </button>
        )}
      </aside>

      <main className="main-panel">
        <div className="main-content">
          <div className="eyebrow">SECTION {section.num}</div>
          <h1>{section.title}</h1>
          {section.subtitle && <p className="subtitle">{section.subtitle}</p>}

          <div className="fields-area">
            {visibleFields(section.fields, section.id, answers).map((f) => (
              <Field
                key={f.key}
                label={f.label}
                type={f.type}
                placeholder={f.placeholder}
                rows={f.rows}
                options={f.options}
                value={answers[fieldKey(section.id, f.key)]}
                onChange={(v) => setValue(fieldKey(section.id, f.key), v)}
              />
            ))}
          </div>

          {isLast && (
            <div className="submit-area">
              <button className="btn-primary" onClick={handleSubmit} disabled={status === 'sending'}>
                {status === 'sending' ? 'Envoi...' : 'Envoyer mes réponses'}
              </button>
              {status === 'error' && (
                <div className="submit-error">L'envoi a échoué, réessaie dans un instant.</div>
              )}
            </div>
          )}
        </div>

        <div className="footer-nav">
          <button className="btn-secondary" onClick={goPrev} disabled={stepIndex === 0}>
            ← Précédent
          </button>
          {!isLast && (
            <button
              className="btn-primary"
              onClick={goNext}
              disabled={stepIndex === 0 && !routeAnswer}
            >
              Suivant →
            </button>
          )}
        </div>
      </main>
    </div>
  )
}

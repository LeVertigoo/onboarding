import { useState, useMemo, useEffect } from 'react'
import { supabase } from './supabase.js'
import { RecapContent, toMarkdown, buildRecapSections } from './recap.jsx'
import { CONTENU_TITLE, routeSection, buildContenuSections } from './dataContenu.js'

// Volet 2 — "Création de contenu". Même logique de moteur que App.jsx
// (volet 1), VOLONTAIREMENT dupliquée plutôt que partagée : ça évite de
// toucher à App.jsx (zéro risque de régression sur le volet existant) au
// prix d'un peu de code en double. Différences principales : la liste des
// sections dépend de la réponse à la question de branchement (`route`), et
// une section 'repeat' (ex. "Visuels, besoins et envies" → inspirations
// multiples) est possible comme côté volet 1.
//
// Les brouillons et la soumission finale passent par les fonctions SQL
// save_draft / complete_workbook (voir supabase/migration_espace_client.sql)
// au lieu d'un simple .insert() : ça permet la reprise depuis n'importe quel
// appareil (pas seulement le navigateur où le brouillon a été commencé).

const WORKBOOK_TYPE = 'contenu'

function fieldKey(sectionId, repIndex, key) {
  return repIndex === undefined ? `${sectionId}.${key}` : `${sectionId}.${repIndex}.${key}`
}

// Mêmes règles showIf que App.jsx (voir FieldList là-bas) : `in` pour un
// champ simple, `includes` pour un sibling multichoice (tableau). Toujours
// évalué contre les champs "non répétés" de la section (intro ou préambule
// d'une section repeat).
function visibleFields(fields, sectionId, answers) {
  return fields.filter((f) => {
    if (!f.showIf) return true
    const controlValue = answers[fieldKey(sectionId, undefined, f.showIf.field)]
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
// structurée stockée en base (celle utilisée par le récap / l'admin / le
// brouillon), y compris les sections 'repeat' (reconstruction de
// extraCounts à partir du nombre d'items déjà enregistrés).
function structuredToFlat(structured, sectionsList) {
  const flat = {}
  const extraCounts = {}
  sectionsList.forEach((s) => {
    const value = structured?.[s.id]
    if (!value) return
    if (s.kind === 'repeat') {
      const fieldsObj = value.fields || {}
      ;(s.fields || []).forEach((f) => {
        if (fieldsObj[f.key] !== undefined) flat[fieldKey(s.id, undefined, f.key)] = fieldsObj[f.key]
      })
      const items = Array.isArray(value.items) ? value.items : []
      items.forEach((item, i) => {
        s.repeatFields.forEach((f) => {
          if (item[f.key] !== undefined) flat[fieldKey(s.id, i, f.key)] = item[f.key]
        })
      })
      if (items.length > 0) extraCounts[s.id] = items.length
    } else {
      ;(s.fields || []).forEach((f) => {
        if (value[f.key] !== undefined) flat[fieldKey(s.id, undefined, f.key)] = value[f.key]
      })
    }
  })
  return { flat, extraCounts }
}

// Même logique que App.jsx (voir OptionRow là-bas) : bulles compactes, ou
// grandes cartes avec description dès qu'une option en a une.
function OptionRow({ options, value, onPick, multi }) {
  const asCards = (options || []).some((o) => o.description)
  return (
    <div className={'choice-row' + (asCards ? ' choice-row-cards' : '')}>
      {(options || []).map((opt) => {
        const selected = multi ? value.includes(opt.value) : value === opt.value
        return (
          <button
            type="button"
            key={opt.value}
            className={(asCards ? 'choice-card' : 'choice-btn') + (selected ? (asCards ? ' choice-card-selected' : ' choice-btn-selected') : '')}
            onClick={() => onPick(opt.value)}
          >
            {asCards ? (
              <>
                <div className="choice-card-label">{opt.label}</div>
                <div className="choice-card-description">{opt.description}</div>
              </>
            ) : (
              opt.label
            )}
          </button>
        )
      })}
    </div>
  )
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
        <OptionRow options={options} value={value} onPick={(v) => onChange(v)} />
      ) : type === 'multichoice' ? (
        <OptionRow
          options={options}
          value={Array.isArray(value) ? value : []}
          multi
          onPick={(v) => {
            const current = Array.isArray(value) ? value : []
            onChange(current.includes(v) ? current.filter((x) => x !== v) : [...current, v])
          }}
        />
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
  const [answers, setAnswers] = useState(() => structuredToFlat(initialAnswers || {}, [routeSection]).flat)
  const [extraCounts, setExtraCounts] = useState({})
  const [status, setStatus] = useState(alreadyDone ? 'done' : 'idle')

  const routeAnswer = answers[fieldKey('route', undefined, 'route')]

  // Une fois la route connue, on complète l'état plat (et les extraCounts)
  // avec les champs des sections de cette route, au cas où un brouillon
  // existait déjà dessus.
  useEffect(() => {
    if (!routeAnswer || alreadyDone) return
    const fullSections = buildContenuSections(routeAnswer)
    const { flat, extraCounts: counts } = structuredToFlat(initialAnswers || {}, fullSections)
    setAnswers((prev) => ({ ...flat, ...prev }))
    setExtraCounts((prev) => ({ ...counts, ...prev }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeAnswer])

  const fullSections = useMemo(() => buildContenuSections(routeAnswer), [routeAnswer])

  const section = fullSections[Math.min(stepIndex, fullSections.length - 1)]
  const total = fullSections.length
  const isLast = stepIndex === total - 1

  const repeatCountFor = (s) => extraCounts[s.id] ?? s.repeatCount

  const addRepeat = (s) => {
    setExtraCounts((prev) => {
      const current = prev[s.id] ?? s.repeatCount
      const max = s.repeatMax ?? current + 1
      return { ...prev, [s.id]: Math.min(current + 1, max) }
    })
  }

  const payload = useMemo(() => {
    const structured = {}
    fullSections.forEach((s) => {
      if (s.kind === 'repeat') {
        const count = extraCounts[s.id] ?? s.repeatCount
        const items = Array.from({ length: count }).map((_, i) => {
          const obj = {}
          s.repeatFields.forEach((f) => {
            obj[f.key] = answers[fieldKey(s.id, i, f.key)] || ''
          })
          return obj
        })
        const fieldsObj = {}
        ;(s.fields || []).forEach((f) => {
          fieldsObj[f.key] = answers[fieldKey(s.id, undefined, f.key)] || ''
        })
        structured[s.id] = { fields: fieldsObj, items }
      } else {
        const obj = {}
        s.fields.forEach((f) => {
          obj[f.key] = answers[fieldKey(s.id, undefined, f.key)] || ''
        })
        structured[s.id] = obj
      }
    })
    return structured
  }, [answers, extraCounts, fullSections])

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
              localStorage.setItem(DRAFT_FALLBACK_KEY, JSON.stringify({ answers, extraCounts, stepIndex, savedAt: Date.now() }))
            } catch {
              // best-effort uniquement
            }
          }
        })
    }, 600)
    return () => clearTimeout(id)
  }, [payload, status, routeAnswer, email, clientName, answers, extraCounts, stepIndex])

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
          <button type="button" className="draft-banner" style={{ marginTop: 16, cursor: 'pointer' }} onClick={onBackToEspace}>
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
            {section.kind === 'repeat' && section.fields && section.fields.length > 0 && (
              visibleFields(section.fields, section.id, answers).map((f) => (
                <Field
                  key={f.key}
                  label={f.label}
                  type={f.type}
                  placeholder={f.placeholder}
                  rows={f.rows}
                  options={f.options}
                  value={answers[fieldKey(section.id, undefined, f.key)]}
                  onChange={(v) => setValue(fieldKey(section.id, undefined, f.key), v)}
                />
              ))
            )}

            {section.kind === 'repeat' &&
              Array.from({ length: repeatCountFor(section) }).map((_, i) => (
                <div className="repeat-card" key={i}>
                  <div className="repeat-card-title">{section.repeatLabel} #{i + 1}</div>
                  {section.repeatFields.map((f) => (
                    <Field
                      key={f.key}
                      label={f.label}
                      type={f.type}
                      placeholder={f.placeholder}
                      rows={f.rows}
                      options={f.options}
                      value={answers[fieldKey(section.id, i, f.key)]}
                      onChange={(v) => setValue(fieldKey(section.id, i, f.key), v)}
                    />
                  ))}
                </div>
              ))}

            {section.kind === 'repeat' &&
              section.expandable &&
              repeatCountFor(section) < (section.repeatMax ?? Infinity) && (
                <button type="button" className="repeat-add-btn" onClick={() => addRepeat(section)}>
                  + Ajouter {section.repeatArticle || 'un'} {section.repeatLabel?.toLowerCase()}
                </button>
              )}

            {section.kind !== 'repeat' &&
              visibleFields(section.fields, section.id, answers).map((f) => (
                <Field
                  key={f.key}
                  label={f.label}
                  type={f.type}
                  placeholder={f.placeholder}
                  rows={f.rows}
                  options={f.options}
                  value={answers[fieldKey(section.id, undefined, f.key)]}
                  onChange={(v) => setValue(fieldKey(section.id, undefined, f.key), v)}
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

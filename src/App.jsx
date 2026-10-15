import { useState, useMemo, useEffect } from 'react'
import { sections, WORKBOOK_TITLE } from './data.js'
import { supabase } from './supabase.js'
import { RecapContent, toMarkdown, buildRecapSections } from './recap.jsx'

function fieldKey(sectionId, repIndex, fieldKey) {
  return repIndex === undefined
    ? `${sectionId}.${fieldKey}`
    : `${sectionId}.${repIndex}.${fieldKey}`
}

// Local-only draft autosave — never touches Supabase. Keeps the client from
// losing 25-30 minutes of answers to a refresh, an accidental tab close, or
// a phone locking mid-session. Best-effort: private browsing / a full quota
// simply falls back to no persistence, same as before this existed.
const DRAFT_KEY = 'kalanis-workbook-refonte-1500-draft-v1'

function loadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function saveDraft(data) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
  } catch {
    // storage full / disabled — the form still works, it just won't persist
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    // nothing to do
  }
}

// Reconstruit l'état "plat" (utilisé pendant l'édition) à partir de la forme
// structurée stockée en base (celle utilisée par le récap / l'admin / le
// brouillon distant), y compris les sections 'repeat' (reconstruction de
// extraCounts à partir du nombre d'items déjà enregistrés). `__meta` est une
// clé technique ajoutée aux réponses sauvegardées à distance (voir
// `save_draft` / `complete_workbook` plus bas) pour retenir l'étape où le
// client s'était arrêté — elle ne correspond à aucune section réelle donc
// elle est ignorée partout ailleurs (récap, export, admin).
function hydrateFromStructured(structured) {
  const flat = {}
  const extraCounts = {}
  if (structured) {
    sections.forEach((s) => {
      const value = structured[s.id]
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
        Object.entries(value).forEach(([k, v]) => {
          flat[fieldKey(s.id, undefined, k)] = v
        })
      }
    })
  }
  const stepIndex = structured?.__meta?.stepIndex ?? 0
  return { flat, extraCounts, stepIndex }
}

// Rendu partagé pour 'choice' (sélection simple) et 'multichoice' (plusieurs) :
// bulles compactes par défaut, ou grandes cartes rectangulaires avec
// description sous le libellé dès qu'au moins une option a une `description`
// — utile pour une question où il faut expliquer concrètement ce que chaque
// réponse signifie (ex. la question de branchement du volet 2).
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

function Field({ label, type, placeholder, value, onChange, min, max, options, rows }) {
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
      ) : type === 'scale' ? (
        <div className="scale-row">
          {Array.from({ length: (max ?? 10) - (min ?? 1) + 1 }).map((_, idx) => {
            const n = (min ?? 1) + idx
            const selected = String(value) === String(n)
            return (
              <button
                type="button"
                key={n}
                className={'scale-btn' + (selected ? ' scale-btn-selected' : '')}
                onClick={() => onChange(String(n))}
              >
                {n}
              </button>
            )
          })}
        </div>
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

function RecapCard({ items, answers }) {
  const resolved = items
    .map((it) => ({ ...it, value: answers[it.path] }))
    .filter((it) => Array.isArray(it.value) ? it.value.length > 0 : it.value && it.value.trim())
  if (resolved.length === 0) return null
  return (
    <div className="recap-card">
      <div className="recap-title">TES RÉPONSES PRÉCÉDENTES</div>
      {resolved.map((it) => (
        <div className="recap-item" key={it.path}>
          <div className="recap-label">{it.label}</div>
          <div className="recap-value">{Array.isArray(it.value) ? it.value.join(', ') : it.value}</div>
        </div>
      ))}
    </div>
  )
}

// Renders a flat list of fields (with showIf / groupLabel support), used both
// for single/intro/final sections and for the optional preamble `fields` on
// a 'repeat' section (e.g. "combien de clients" before the client cards).
function FieldList({ fields, sectionId, answers, setValue }) {
  return fields.map((f, idx) => {
    if (f.showIf) {
      const controlValue = answers[fieldKey(sectionId, undefined, f.showIf.field)]
      if (f.showIf.notEmpty) {
        if (!controlValue || !String(controlValue).trim()) return null
      } else if (f.showIf.in && !f.showIf.in.includes(controlValue)) {
        return null
      } else if (f.showIf.includes) {
        // Sibling is a multichoice (array) — show only if it includes this value.
        const arr = Array.isArray(controlValue) ? controlValue : []
        if (!arr.includes(f.showIf.includes)) return null
      }
    }
    const prevField = idx > 0 ? fields[idx - 1] : null
    const showGroupHeading = f.groupLabel && f.groupLabel !== prevField?.groupLabel
    return (
      <div key={f.key} className="field-wrap">
        {showGroupHeading && <div className="field-group-heading">{f.groupLabel}</div>}
        <Field
          label={f.label}
          type={f.type}
          placeholder={f.placeholder}
          min={f.min}
          max={f.max}
          options={f.options}
          rows={f.rows}
          value={answers[fieldKey(sectionId, undefined, f.key)]}
          onChange={(v) => setValue(fieldKey(sectionId, undefined, f.key), v)}
        />
      </div>
    )
  })
}

function ChecklistCard({ items, filledIds, onJump }) {
  const doneCount = items.filter((it) => filledIds.has(it.id)).length
  const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0
  return (
    <div className="checklist-card">
      <div className="checklist-header">
        <div className="checklist-title">Checklist finale</div>
        <div className="checklist-pct">{pct}%</div>
      </div>
      <div className="checklist-progress-track">
        <div className="checklist-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <ul className="checklist-list">
        {items.map((it) => {
          const done = filledIds.has(it.id)
          return (
            <li
              key={it.id}
              className={'checklist-item' + (done ? ' checklist-item-done' : '')}
              onClick={() => onJump(it.stepIndex)}
            >
              <span className="checklist-box">{done ? '✓' : ''}</span>
              <span>{it.title}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function App({ onBackToEspace, initialAnswers, initialStatus, prefillIdentity } = {}) {
  // Priorité au brouillon local (le navigateur où le client est réellement en
  // train de taper) ; sinon, s'il existe un brouillon côté base (ouvert
  // depuis l'espace client, potentiellement depuis un autre appareil), on
  // reprend depuis là ; sinon, si on arrive depuis l'espace client (nom/email
  // déjà donnés sur la home page), on pré-remplit juste l'intro pour ne pas
  // les lui redemander. Calculé une seule fois au montage.
  const [hydration] = useState(() => {
    const local = loadDraft()
    if (local) return { restored: true, stepIndex: local.stepIndex ?? 0, answers: local.answers ?? {}, extraCounts: local.extraCounts ?? {} }
    if (initialStatus === 'draft' && initialAnswers) {
      const h = hydrateFromStructured(initialAnswers)
      return { restored: true, stepIndex: h.stepIndex, answers: h.flat, extraCounts: h.extraCounts }
    }
    if (prefillIdentity?.email) {
      return {
        restored: false,
        stepIndex: 0,
        answers: { 'intro.client_name': prefillIdentity.clientName || '', 'intro.client_email': prefillIdentity.email },
        extraCounts: {},
      }
    }
    return { restored: false, stepIndex: 0, answers: {}, extraCounts: {} }
  })

  const [draftRestored] = useState(hydration.restored)
  const [draftBannerDismissed, setDraftBannerDismissed] = useState(false)
  const [stepIndex, setStepIndex] = useState(hydration.stepIndex)
  const [answers, setAnswers] = useState(hydration.answers)
  const [status, setStatus] = useState('idle') // idle | sending | done | error
  const [extraCounts, setExtraCounts] = useState(hydration.extraCounts) // sectionId -> current repeat count (for expandable repeat sections)

  // Autosave the draft locally on every change, debounced so it doesn't
  // write on every keystroke. Cleared once the submission actually succeeds.
  useEffect(() => {
    if (status === 'done') return
    const id = setTimeout(() => {
      saveDraft({ stepIndex, answers, extraCounts, savedAt: Date.now() })
    }, 400)
    return () => clearTimeout(id)
  }, [stepIndex, answers, extraCounts, status])

  const section = sections[stepIndex]
  const total = sections.length
  const progressPct = Math.round((stepIndex / (total - 1)) * 100)

  const repeatCountFor = (s) => extraCounts[s.id] ?? s.repeatCount

  const setValue = (key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

  const addRepeat = (s) => {
    setExtraCounts((prev) => {
      const current = prev[s.id] ?? s.repeatCount
      const max = s.repeatMax ?? current + 1
      return { ...prev, [s.id]: Math.min(current + 1, max) }
    })
  }

  const goNext = () => setStepIndex((i) => Math.min(i + 1, total - 1))
  const goPrev = () => setStepIndex((i) => Math.max(i - 1, 0))
  const goTo = (i) => setStepIndex(i)

  const clientName = answers['intro.client_name'] || ''

  const payload = useMemo(() => {
    // Reshape the flat answers map back into a structured object per section,
    // so the JSONB blob in Supabase is easy to read on its own.
    const structured = {}
    sections.forEach((s) => {
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
  }, [answers, extraCounts])

  // Auto-computed checklist : une entrée par section (hors intro/final), cochée
  // dès que la section a au moins un champ rempli. Basé sur `payload`, donc se
  // met à jour en temps réel pendant que le client répond.
  const checklistItems = useMemo(
    () =>
      sections
        .map((s, i) => ({ id: s.id, title: s.title, stepIndex: i, kind: s.kind }))
        .filter((it) => it.kind !== 'intro' && it.kind !== 'final'),
    []
  )
  const filledSectionIds = useMemo(
    () => new Set(buildRecapSections(payload).map((s) => s.id)),
    [payload]
  )

  const clientEmail = (answers['intro.client_email'] || '').trim().toLowerCase()

  // Brouillon sauvegardé en base dès que l'email est connu (première section
  // remplie), en plus du brouillon local ci-dessus — permet de reprendre
  // depuis un autre appareil via l'espace client. Best-effort : si l'appel
  // échoue (hors-ligne...), le brouillon local reste la sauvegarde de secours
  // exactement comme avant.
  useEffect(() => {
    if (status === 'done' || !clientEmail) return
    const id = setTimeout(() => {
      supabase
        .rpc('save_draft', {
          p_email: clientEmail,
          p_client_name: clientName,
          p_workbook_type: 'refonte_1500',
          p_answers: { ...payload, __meta: { stepIndex } },
        })
        .catch(() => {})
    }, 800)
    return () => clearTimeout(id)
  }, [payload, stepIndex, status, clientEmail, clientName])

  const handleSubmit = async () => {
    setStatus('sending')
    const { error } = await supabase.rpc('complete_workbook', {
      p_email: clientEmail,
      p_client_name: clientName,
      p_workbook_type: 'refonte_1500',
      p_answers: payload,
    })
    if (error) {
      console.error(error)
      console.log('Réponses (copie de secours) :', JSON.stringify(payload, null, 2))
      setStatus('error')
    } else {
      setStatus('done')
      clearDraft()
      // Best-effort Slack notification — never blocks or fails the submission
      // if it errors out (e.g. webhook not configured yet).
      fetch('/api/notify-slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          clientEmail: answers['intro.client_email'] || '',
        }),
      }).catch(() => {})
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
  }

  const downloadMarkdown = () => {
    const md = toMarkdown(payload, clientName)
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workbook-${(clientName || 'refonte-1500').trim().replace(/\s+/g, '-').toLowerCase()}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">KALANIS</div>
        {onBackToEspace && (
          <button type="button" className="draft-banner" style={{ marginBottom: 12, cursor: 'pointer' }} onClick={onBackToEspace}>
            ← Mon espace
          </button>
        )}
        <div className="sidebar-title">{WORKBOOK_TITLE.split(' · ').map((line, i) => (
          <span key={i}>{i > 0 && <br />}{line}</span>
        ))}</div>
        <nav className="sidebar-steps">
          {sections.map((s, i) => (
            <button
              key={s.id}
              className={
                'step' +
                (i === stepIndex ? ' step-active' : '') +
                (i < stepIndex ? ' step-done' : '')
              }
              onClick={() => goTo(i)}
            >
              <span className="step-num">{i < stepIndex ? '✓' : s.num}</span>
              <span className="step-label">{s.title}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-progress">
          <div className="sidebar-progress-track">
            <div className="sidebar-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="sidebar-progress-text">{stepIndex + 1} / {total}</div>
        </div>
      </aside>

      <main className="main-panel">
        <div className="main-content">
          {draftRestored && status === 'idle' && !draftBannerDismissed && (
            <div className="draft-banner">
              <span>Reprise de ta session précédente — tes réponses ont été restaurées.</span>
              <button type="button" onClick={() => setDraftBannerDismissed(true)}>
                Fermer
              </button>
            </div>
          )}
          <div className="eyebrow">SECTION {section.num}</div>
          <h1>{section.title}</h1>
          {section.subtitle && <p className="subtitle">{section.subtitle}</p>}

          {section.recap && <RecapCard items={section.recap} answers={answers} />}

          <div className="fields-area">
            {section.kind === 'repeat' && section.fields && section.fields.length > 0 && (
              <FieldList fields={section.fields} sectionId={section.id} answers={answers} setValue={setValue} />
            )}

            {section.kind === 'repeat' &&
              Array.from({ length: repeatCountFor(section) }).map((_, i) => {
                const pairedSection = section.pairedWith
                  ? sections.find((s) => s.id === section.pairedWith)
                  : null
                const pairedLines = pairedSection
                  ? pairedSection.repeatFields
                      .map((f) => ({ label: f.label, value: answers[fieldKey(pairedSection.id, i, f.key)] }))
                      .filter((l) => l.value && l.value.trim())
                  : []
                return (
                  <div className="repeat-card" key={i}>
                    <div className="repeat-card-title">{section.repeatLabel} #{i + 1}</div>
                    {pairedLines.length > 0 && (
                      <div className="paired-recap">
                        <div className="paired-recap-label">
                          Rappel ({pairedSection.repeatLabel} #{i + 1})
                        </div>
                        {pairedLines.map((l) => (
                          <div className="paired-recap-line" key={l.label}>
                            <span className="paired-recap-field">{l.label}</span>
                            <span className="paired-recap-value">{l.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {section.repeatFields.map((f) => (
                      <Field
                        key={f.key}
                        label={f.label}
                        type={f.type}
                        placeholder={f.placeholder}
                        options={f.options}
                        value={answers[fieldKey(section.id, i, f.key)]}
                        onChange={(v) => setValue(fieldKey(section.id, i, f.key), v)}
                      />
                    ))}
                  </div>
                )
              })}

            {section.kind === 'repeat' &&
              section.expandable &&
              repeatCountFor(section) < (section.repeatMax ?? Infinity) && (
                <button type="button" className="repeat-add-btn" onClick={() => addRepeat(section)}>
                  + Ajouter un {section.repeatLabel?.toLowerCase()}
                </button>
              )}

            {(section.kind === 'single' || section.kind === 'intro' || section.kind === 'final') && (
              <FieldList fields={section.fields} sectionId={section.id} answers={answers} setValue={setValue} />
            )}

            {section.kind === 'final' && (
              <ChecklistCard items={checklistItems} filledIds={filledSectionIds} onJump={goTo} />
            )}
          </div>

          {section.kind === 'final' && (
            <div className="submit-area">
              {status === 'done' ? (
                <div className="submit-success-block">
                  <div className="submit-success">
                    Réponses enregistrées, merci{clientName ? `, ${clientName}` : ''}.
                  </div>
                  <div className="download-actions">
                    {onBackToEspace && (
                      <button className="btn-secondary" onClick={onBackToEspace}>
                        ← Retour à mon espace
                      </button>
                    )}
                    <button className="btn-secondary" onClick={() => window.print()}>
                      Télécharger en PDF
                    </button>
                    <button className="btn-secondary" onClick={downloadMarkdown}>
                      Télécharger en Markdown
                    </button>
                  </div>
                  <div className="client-recap">
                    <RecapContent answers={payload} clientName={clientName} />
                  </div>
                </div>
              ) : (
                <>
                  <button className="btn-primary" onClick={handleSubmit} disabled={status === 'sending'}>
                    {status === 'sending' ? 'Envoi...' : 'Envoyer mes réponses'}
                  </button>
                  {status === 'error' && (
                    <div className="submit-error">
                      L'envoi a échoué (la base n'est peut-être pas encore configurée).
                      <button className="btn-secondary" onClick={copyToClipboard}>
                        Copier mes réponses
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className="footer-nav">
          <button className="btn-secondary" onClick={goPrev} disabled={stepIndex === 0}>
            ← Précédent
          </button>
          {section.kind !== 'final' && (
            <button className="btn-primary" onClick={goNext}>
              Suivant →
            </button>
          )}
        </div>
      </main>
    </div>
  )
}

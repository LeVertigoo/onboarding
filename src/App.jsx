
import { useState, useMemo } from 'react'
import { sections, WORKBOOK_TITLE } from './data.js'
import { supabase } from './supabase.js'
import { RecapContent, toMarkdown, buildRecapSections } from './recap.jsx'

function fieldKey(sectionId, repIndex, fieldKey) {
  return repIndex === undefined
    ? `${sectionId}.${fieldKey}`
    : `${sectionId}.${repIndex}.${fieldKey}`
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
    .filter((it) => it.value && it.value.trim())
  if (resolved.length === 0) return null
  return (
    <div className="recap-card">
      <div className="recap-title">TES RÉPONSES PRÉCÉDENTES</div>
      {resolved.map((it) => (
        <div className="recap-item" key={it.path}>
          <div className="recap-label">{it.label}</div>
          <div className="recap-value">{it.value}</div>
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

export default function App() {
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [status, setStatus] = useState('idle') // idle | sending | done | error
  const [extraCounts, setExtraCounts] = useState({}) // sectionId -> current repeat count (for expandable repeat sections)

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

  const handleSubmit = async () => {
    setStatus('sending')
    const { error } = await supabase.from('client_workbooks').insert({
      client_name: clientName,
      workbook_type: 'refonte_1500',
      answers: payload,
    })
    if (error) {
      console.error(error)
      console.log('Réponses (copie de secours) :', JSON.stringify(payload, null, 2))
      setStatus('error')
    } else {
      setStatus('done')
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

import { sections as defaultSections, WORKBOOK_TITLE as defaultTitle } from './data.js'

// Shared recap logic — used by the client-side "download my answers" view
// (App.jsx / Contenu.jsx, fed by each workbook's local `payload` state) and
// the admin viewer, since both work off the same structured-by-section shape:
// { sectionId: { field: value } } for single sections, or
// { sectionId: { fields: { field: value }, items: [{ field: value }, ...] } }
// for repeat sections (`fields` holds any preamble fields shown once above
// the repeated cards, e.g. "combien de clients" before the client list —
// empty object when the section has none).
//
// Every function here defaults to the volet 1 ("Refonte 1500€") sections/title
// when no `sections`/`title` override is passed, so every existing call site
// keeps behaving exactly as before. The new volet "Création de contenu"
// (Contenu.jsx) passes its own sections/title explicitly instead.

// A value is either a string (text/textarea/scale/choice) or an array of
// strings (multichoice). These two helpers centralize "is it filled in" and
// "how should it read as text", so every place that touches an answer value
// behaves correctly for both shapes without checking Array.isArray itself.
function hasValue(v) {
  if (Array.isArray(v)) return v.length > 0
  return !!(v && String(v).trim())
}

// Pour un champ 'choice'/'multichoice', les réponses stockées sont les
// `value` internes des options (ex. 'etablie'), pas leur libellé affiché
// (ex. "J'ai déjà une stratégie bien établie") — contrairement aux champs du
// volet 1 historique, où value === label par convention pour éviter ce
// problème. On résout ici l'un ou l'autre cas sans distinction : si le champ
// a des `options`, on retrouve le libellé ; sinon (text/textarea/scale) on
// affiche la valeur telle quelle.
function displayValue(v, field) {
  const resolveOne = (one) => {
    const opt = field?.options?.find((o) => o.value === one)
    return opt ? opt.label : one
  }
  return Array.isArray(v) ? v.map(resolveOne).join(', ') : resolveOne(v)
}

export function sectionTitleFor(sectionId, sectionsList = defaultSections) {
  const s = sectionsList.find((sec) => sec.id === sectionId)
  // Plain "Section N — Titre" — some section titles already contain their
  // own parentheses (ex. "Toi (la personne)"), so wrapping the whole title
  // in a second pair used to produce an ugly "Section 1 (Toi (la personne))".
  return s ? `Section ${s.num} — ${s.title}` : sectionId
}

function fieldDefFor(sectionId, key, sectionsList) {
  const s = sectionsList.find((sec) => sec.id === sectionId)
  if (!s) return null
  const fields = s.kind === 'repeat' ? s.repeatFields : s.fields
  return fields?.find((fl) => fl.key === key) || null
}

export function fieldLabelFor(sectionId, key, sectionsList = defaultSections) {
  const f = fieldDefFor(sectionId, key, sectionsList)
  return f ? f.label : key
}

function preambleFieldDefFor(sectionId, key, sectionsList) {
  const s = sectionsList.find((sec) => sec.id === sectionId)
  return s?.fields?.find((fl) => fl.key === key) || null
}

// Reshapes the answers into { id, title, isRepeat, preamble: [{label,value}], items: [{ index, entries: [{label,value}] }] },
// skipping intro/final sections and anything left empty.
export function buildRecapSections(answers, sectionsList = defaultSections) {
  return sectionsList
    .filter((s) => s.kind !== 'intro' && s.kind !== 'final')
    .map((s) => {
      const value = answers[s.id]
      if (!value) return null
      const isRepeat = s.kind === 'repeat'

      let preamble = []
      let items = []

      if (isRepeat) {
        const fieldsObj = value.fields || {}
        preamble = Object.entries(fieldsObj)
          .filter(([, v]) => hasValue(v))
          .map(([k, v]) => {
            const f = preambleFieldDefFor(s.id, k, sectionsList)
            return { label: f ? f.label : k, value: displayValue(v, f) }
          })
        const rawItems = Array.isArray(value.items) ? value.items : Array.isArray(value) ? value : []
        items = rawItems
          .map((item, i) => ({
            index: i,
            entries: Object.entries(item || {})
              .filter(([, v]) => hasValue(v))
              .map(([k, v]) => {
                const f = fieldDefFor(s.id, k, sectionsList)
                return { label: f ? f.label : k, value: displayValue(v, f) }
              }),
          }))
          .filter((it) => it.entries.length > 0)
      } else {
        const entries = Object.entries(value || {})
          .filter(([, v]) => hasValue(v))
          .map(([k, v]) => {
            const f = fieldDefFor(s.id, k, sectionsList)
            return { label: f ? f.label : k, value: displayValue(v, f) }
          })
        items = entries.length > 0 ? [{ index: 0, entries }] : []
      }

      if (preamble.length === 0 && items.length === 0) return null
      return { id: s.id, title: sectionTitleFor(s.id, sectionsList), isRepeat, preamble, items }
    })
    .filter(Boolean)
}

export function toMarkdown(answers, clientName, sectionsList = defaultSections, title = defaultTitle) {
  const recapSections = buildRecapSections(answers, sectionsList)
  const lines = []
  lines.push(`# ${title}`)
  if (clientName) lines.push(`**Client :** ${clientName}`)
  lines.push('')
  recapSections.forEach((s) => {
    lines.push(`## ${s.title}`)
    lines.push('')
    s.preamble.forEach((e) => {
      lines.push(`**${e.label}**`)
      lines.push('')
      lines.push(e.value)
      lines.push('')
    })
    s.items.forEach((item) => {
      if (s.isRepeat) {
        lines.push(`### #${item.index + 1}`)
        lines.push('')
      }
      item.entries.forEach((e) => {
        lines.push(`**${e.label}**`)
        lines.push('')
        lines.push(e.value)
        lines.push('')
      })
    })
  })
  if (answers.final?.mot_de_la_fin) {
    lines.push('## Le mot de la fin')
    lines.push('')
    lines.push(answers.final.mot_de_la_fin)
  }
  return lines.join('\n')
}

export function RecapContent({ answers, clientName, sections: sectionsList = defaultSections, title = defaultTitle }) {
  const recapSections = buildRecapSections(answers, sectionsList)
  return (
    <div className="recap-print">
      <div className="recap-print-title">{title}</div>
      {clientName && <div className="recap-print-client">{clientName}</div>}
      {recapSections.map((s) => (
        <div className="admin-section" key={s.id}>
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
      {answers.final?.mot_de_la_fin && (
        <div className="admin-section">
          <div className="admin-section-title">Le mot de la fin</div>
          <div className="admin-field-value">{answers.final.mot_de_la_fin}</div>
        </div>
      )}
    </div>
  )
}

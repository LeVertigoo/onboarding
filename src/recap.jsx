import { sections, WORKBOOK_TITLE } from './data.js'

// Shared recap logic — used by the client-side "download my answers" view in
// App.jsx (fed by the local `payload` state) and the admin viewer, since both
// work off the same structured-by-section shape:
// { sectionId: { field: value } } for single sections, or
// { sectionId: { fields: { field: value }, items: [{ field: value }, ...] } }
// for repeat sections (`fields` holds any preamble fields shown once above
// the repeated cards, e.g. "combien de clients" before the client list —
// empty object when the section has none).

export function sectionTitleFor(sectionId) {
  const s = sections.find((sec) => sec.id === sectionId)
  // Plain "Section N — Titre" — some section titles already contain their
  // own parentheses (ex. "Toi (la personne)"), so wrapping the whole title
  // in a second pair used to produce an ugly "Section 1 (Toi (la personne))".
  return s ? `Section ${s.num} — ${s.title}` : sectionId
}

export function fieldLabelFor(sectionId, key) {
  const s = sections.find((sec) => sec.id === sectionId)
  if (!s) return key
  const fields = s.kind === 'repeat' ? s.repeatFields : s.fields
  const f = fields?.find((fl) => fl.key === key)
  return f ? f.label : key
}

function preambleFieldLabelFor(sectionId, key) {
  const s = sections.find((sec) => sec.id === sectionId)
  const f = s?.fields?.find((fl) => fl.key === key)
  return f ? f.label : key
}

// Reshapes the answers into { id, title, isRepeat, preamble: [{label,value}], items: [{ index, entries: [{label,value}] }] },
// skipping intro/final sections and anything left empty.
export function buildRecapSections(answers) {
  return sections
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
          .filter(([, v]) => v && String(v).trim())
          .map(([k, v]) => ({ label: preambleFieldLabelFor(s.id, k), value: v }))
        const rawItems = Array.isArray(value.items) ? value.items : Array.isArray(value) ? value : []
        items = rawItems
          .map((item, i) => ({
            index: i,
            entries: Object.entries(item || {})
              .filter(([, v]) => v && String(v).trim())
              .map(([k, v]) => ({ label: fieldLabelFor(s.id, k), value: v })),
          }))
          .filter((it) => it.entries.length > 0)
      } else {
        const entries = Object.entries(value || {})
          .filter(([, v]) => v && String(v).trim())
          .map(([k, v]) => ({ label: fieldLabelFor(s.id, k), value: v }))
        items = entries.length > 0 ? [{ index: 0, entries }] : []
      }

      if (preamble.length === 0 && items.length === 0) return null
      return { id: s.id, title: sectionTitleFor(s.id), isRepeat, preamble, items }
    })
    .filter(Boolean)
}

export function toMarkdown(answers, clientName) {
  const recapSections = buildRecapSections(answers)
  const lines = []
  lines.push(`# ${WORKBOOK_TITLE}`)
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

export function RecapContent({ answers, clientName }) {
  const recapSections = buildRecapSections(answers)
  return (
    <div className="recap-print">
      <div className="recap-print-title">{WORKBOOK_TITLE}</div>
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

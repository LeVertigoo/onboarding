// Vercel serverless function. Receives a POST from the client after a
// successful Supabase insert and forwards a formatted message to Slack.
//
// The Slack Incoming Webhook URL is NEVER hardcoded here or committed to
// the repo (this repo is public) — it must be set as an environment
// variable named SLACK_WEBHOOK_URL in the Vercel project settings
// (Settings > Environment Variables), specific to THIS project (env vars
// don't carry over from the workbook-positionnement-voix project). If it's
// not set, this function just no-ops so a submission never fails because
// of a missing webhook.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) {
    // No webhook configured yet — succeed silently so the client doesn't
    // treat this as a failure.
    res.status(200).json({ skipped: true })
    return
  }

  try {
    const { clientName, clientEmail } = req.body || {}

    const adminUrl =
      process.env.WORKBOOK_ADMIN_URL || 'https://workbook-refonte-1500.vercel.app/?admin=1'

    // Fallback plain-text summary (shown in notifications/previews that
    // don't render Block Kit) plus a real clickable Slack button linking
    // straight to the admin page.
    const fallbackText = `Nouvelle réponse au workbook Refonte 1500€ — ${
      clientName || 'Sans nom'
    }`

    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text:
            `📘 *Nouvelle réponse au workbook Refonte 1500€*\n` +
            `*Client :* ${clientName || 'Sans nom'}${clientEmail ? ` (${clientEmail})` : ''}`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'Voir les réponses', emoji: true },
            url: adminUrl,
            style: 'primary',
          },
        ],
      },
    ]

    const slackRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: fallbackText, blocks }),
    })

    if (!slackRes.ok) {
      const body = await slackRes.text()
      console.error('Slack webhook error:', slackRes.status, body)
      res.status(502).json({ error: 'Slack webhook failed' })
      return
    }

    res.status(200).json({ ok: true })
  } catch (err) {
    console.error('notify-slack error:', err)
    res.status(500).json({ error: 'Internal error' })
  }
}

import { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { Card, Button, Pill } from '../../components/ui'
import { tokens } from '../../theme/tokens'

interface Ticket {
  id: string
  ticketMeta: { status: 'OPEN' | 'SOLVED'; assigneeId: string | null } | null
  messages?: { id: string; senderId: string; body: string; createdAt: string }[]
}

interface Game {
  id: string
  name: string
}

export default function SupportPage() {
  const [games, setGames] = useState<Game[]>([])
  const [selectedGame, setSelectedGame] = useState('')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [replyBody, setReplyBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    loadTickets()
    loadGames()
  }, [])

  async function loadGames() {
    try {
      const data = await apiFetch('/player/shop/browse')
      const seen = new Map<string, Game>()
      for (const p of data) {
        if (p.app && !seen.has(p.appId)) seen.set(p.appId, { id: p.appId, name: p.app.name })
      }
      const list = Array.from(seen.values())
      setGames(list)
      if (list.length > 0) setSelectedGame(list[0].id)
    } catch (err) {
      // game list is only needed for ticket creation; ignore failure here
    }
  }

  async function loadTickets() {
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch('/player/tickets')
      setTickets(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    try {
      await apiFetch('/player/tickets', {
        method: 'POST',
        body: JSON.stringify({ appId: selectedGame, subject, body }),
      })
      setSubject('')
      setBody('')
      setMessage('Ticket created.')
      loadTickets()
    } catch (err) {
      setMessage((err as Error).message)
    }
  }

  async function openTicket(ticketId: string) {
    setMessage(null)
    try {
      const detail = await apiFetch(`/player/tickets/${ticketId}`)
      setSelectedTicket(detail)
    } catch (err) {
      setMessage((err as Error).message)
    }
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedTicket) return
    setMessage(null)
    try {
      await apiFetch(`/player/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ body: replyBody }),
      })
      setReplyBody('')
      openTicket(selectedTicket.id)
    } catch (err) {
      setMessage((err as Error).message)
    }
  }

  if (loading) return <p style={{ padding: 24, color: tokens.color.textMuted }}>Loading tickets...</p>
  if (error) return <p style={{ padding: 24, color: tokens.color.danger }}>{error}</p>

  const inputStyle: React.CSSProperties = {
    background: tokens.color.surfaceAlt,
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.sm,
    padding: '8px 12px',
    color: tokens.color.text,
    fontSize: 14,
    fontFamily: tokens.font.body,
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontFamily: tokens.font.display, fontSize: 20, marginBottom: 24 }}>Support</h1>
      {message && <Pill tone="neutral">{message}</Pill>}

      <Card style={{ maxWidth: 420, marginTop: 16, marginBottom: 32 }}>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <select
            value={selectedGame}
            onChange={(e) => setSelectedGame(e.target.value)}
            required
            style={inputStyle}
          >
            <option value="" disabled>Which game is this about?</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
          <input
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            style={inputStyle}
          />
          <textarea
            placeholder="Describe your issue"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={3}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: tokens.font.body }}
          />
          <Button variant="primary" type="submit">Create Ticket</Button>
        </form>
      </Card>

      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ minWidth: 240 }}>
          <h3 style={{ fontSize: 14, color: tokens.color.textMuted, marginBottom: 12 }}>Your Tickets</h3>
          {tickets.length === 0 && <p style={{ color: tokens.color.textMuted }}>No tickets yet.</p>}
          {tickets.map((t) => (
            <Card
              key={t.id}
              onClick={() => openTicket(t.id)}
              style={{
                marginBottom: 8,
                padding: 12,
                border: selectedTicket?.id === t.id ? `1px solid ${tokens.color.accent}` : `1px solid ${tokens.color.border}`,
              }}
            >
              <div style={{ fontFamily: tokens.font.mono, fontSize: 13 }}>#{t.id.slice(0, 8)}</div>
              <Pill tone={t.ticketMeta?.status === 'SOLVED' ? 'success' : 'warning'}>
                {t.ticketMeta?.status ?? 'OPEN'}
              </Pill>
            </Card>
          ))}
        </div>

        {selectedTicket && (
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 14, color: tokens.color.textMuted, marginBottom: 12 }}>
              Ticket #{selectedTicket.id.slice(0, 8)}
            </h3>
            <Card style={{ minHeight: 150, marginBottom: 12 }}>
              {(selectedTicket.messages ?? []).map((m) => (
                <div key={m.id} style={{ marginBottom: 10 }}>
                  <strong style={{ color: tokens.color.accentSoft }}>
                    {m.senderId === selectedTicket.messages?.[0]?.senderId ? 'You' : 'Support'}:
                  </strong>{' '}
                  {m.body}
                </div>
              ))}
            </Card>
            <form onSubmit={handleReply} style={{ display: 'flex', gap: 8 }}>
              <input
                placeholder="Reply..."
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
                required
              />
              <Button variant="primary" type="submit">Send</Button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Table, Button, Tag, Space, Input, message } from 'antd'
import { apiFetch } from '../../lib/api'

interface Ticket {
  id: string
  ticketMeta: { status: 'OPEN' | 'SOLVED'; assigneeId: string | null } | null
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filter, setFilter] = useState<'OPEN' | 'SOLVED' | undefined>(undefined)
  const [replyText, setReplyText] = useState<Record<string, string>>({})

  useEffect(() => {
    load()
  }, [filter])

  async function load() {
    try {
      const query = filter ? `?status=${filter}` : ''
      setTickets(await apiFetch(`/distributor/tickets${query}`))
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleClaim(id: string) {
    try {
      await apiFetch(`/distributor/tickets/${id}/claim`, { method: 'POST' })
      load()
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleReply(id: string) {
    const body = replyText[id]
    if (!body) return
    try {
      await apiFetch(`/distributor/tickets/${id}/reply`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      })
      message.success('Reply sent')
      setReplyText((prev) => ({ ...prev, [id]: '' }))
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleSolve(id: string) {
    try {
      await apiFetch(`/distributor/tickets/${id}/solve`, { method: 'POST' })
      load()
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  return (
    <div>
      <h2>Support</h2>
      <Space style={{ marginBottom: 12 }}>
        <Button onClick={() => setFilter(undefined)}>All</Button>
        <Button onClick={() => setFilter('OPEN')}>Open</Button>
        <Button onClick={() => setFilter('SOLVED')}>Solved</Button>
      </Space>

      <Table
        rowKey="id"
        dataSource={tickets}
        columns={[
          { title: 'Ticket', dataIndex: 'id', render: (id: string) => `#${id.slice(0, 8)}` },
          {
            title: 'Status',
            render: (_, t: Ticket) => (
              <Tag color={t.ticketMeta?.status === 'SOLVED' ? 'green' : 'orange'}>{t.ticketMeta?.status ?? 'OPEN'}</Tag>
            ),
          },
          {
            title: 'Assignee',
            render: (_, t: Ticket) => t.ticketMeta?.assigneeId ? t.ticketMeta.assigneeId.slice(0, 8) : '—',
          },
          {
            title: 'Actions',
            render: (_, t: Ticket) => (
              <Space>
                {!t.ticketMeta?.assigneeId && <Button size="small" onClick={() => handleClaim(t.id)}>Claim</Button>}
                <Input
                  size="small"
                  placeholder="Reply..."
                  style={{ width: 140 }}
                  value={replyText[t.id] ?? ''}
                  onChange={(e) => setReplyText((prev) => ({ ...prev, [t.id]: e.target.value }))}
                  onPressEnter={() => handleReply(t.id)}
                />
                {t.ticketMeta?.status === 'OPEN' && (
                  <Button size="small" onClick={() => handleSolve(t.id)}>Mark Solved</Button>
                )}
              </Space>
            ),
          },
        ]}
      />
    </div>
  )
}

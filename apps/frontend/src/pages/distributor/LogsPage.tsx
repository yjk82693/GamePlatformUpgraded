import { useEffect, useState } from 'react'
import { Table, Button, Space, message } from 'antd'
import { getToken } from '../../lib/api'
import { apiFetch } from '../../lib/api'

interface LogEntry {
  id: string
  actorId: string
  action: string
  targetType: string
  targetId: string
  occurredAt: string
  success: boolean
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [dlq, setDlq] = useState<any[]>([])
  const [showDlq, setShowDlq] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      setLogs(await apiFetch('/distributor/logs'))
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function loadDlq() {
    try {
      setDlq(await apiFetch('/distributor/logs/dlq'))
      setShowDlq(true)
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleExport() {
    try {
      const token = getToken()
      const res = await fetch('http://localhost:4000/distributor/logs/export', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const text = await res.text()
      const blob = new Blob([text], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'audit-log.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  return (
    <div>
      <h2>Logs</h2>
      <Space style={{ marginBottom: 12 }}>
        <Button onClick={handleExport}>Export CSV</Button>
        <Button onClick={loadDlq}>View Dead Letter Queue</Button>
      </Space>

      <Table
        rowKey="id"
        dataSource={logs}
        columns={[
          { title: 'Actor', dataIndex: 'actorId', render: (id: string) => id.slice(0, 8) },
          { title: 'Action', dataIndex: 'action' },
          { title: 'Target', dataIndex: 'targetType' },
          { title: 'When', dataIndex: 'occurredAt', render: (d: string) => new Date(d).toLocaleString() },
          { title: 'Success', dataIndex: 'success', render: (s: boolean) => (s ? '✓' : '✗') },
        ]}
      />

      {showDlq && (
        <div style={{ marginTop: 24 }}>
          <h3>Dead Letter Queue</h3>
          <Table
            rowKey="id"
            dataSource={dlq}
            columns={[
              { title: 'Reason', dataIndex: 'reason' },
              { title: 'Failed At', dataIndex: 'failedAt', render: (d: string) => new Date(d).toLocaleString() },
            ]}
          />
        </div>
      )}
    </div>
  )
}

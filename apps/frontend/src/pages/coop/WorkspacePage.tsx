import { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Space, Tag, message, Card } from 'antd'
import { apiFetch } from '../../lib/api'

interface Doc {
  id: string
  path: string
  currentVersion: number
}

interface Version {
  documentId: string
  version: number
  blobRef: string
  authorId: string
  createdAt: string
}

interface RollbackReq {
  id: string
  targetVersion: number
  byId: string
  status: 'PENDING' | 'APPROVED'
}

const WORKSPACE_ID = 'default'

export default function WorkspacePage() {
  const [myAccountId, setMyAccountId] = useState<string | null>(null)
  const [docs, setDocs] = useState<Doc[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm] = Form.useForm()

  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null)
  const [content, setContent] = useState('')
  const [versions, setVersions] = useState<Version[]>([])
  const [rollbacks, setRollbacks] = useState<RollbackReq[]>([])
  const [shareOpen, setShareOpen] = useState(false)
  const [shareForm] = Form.useForm()

  useEffect(() => {
    apiFetch('/auth/me').then((me) => setMyAccountId(me.accountId)).catch(() => {})
    loadDocs()
  }, [])

  async function loadDocs() {
    try {
      setDocs(await apiFetch(`/coop/workspace/documents?workspaceId=${WORKSPACE_ID}`))
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleCreate() {
    const values = await createForm.validateFields()
    try {
      await apiFetch('/coop/workspace/documents', {
        method: 'POST',
        body: JSON.stringify({ workspaceId: WORKSPACE_ID, path: values.path, blobRef: values.content }),
      })
      message.success('Document created')
      setCreateOpen(false)
      createForm.resetFields()
      loadDocs()
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function openDoc(doc: Doc) {
    setSelectedDoc(doc)
    try {
      const data = await apiFetch(`/coop/workspace/documents/${doc.id}`)
      setContent(data.content ?? '')
      const v = await apiFetch(`/coop/workspace/documents/${doc.id}/versions`)
      setVersions(v)
      const r = await apiFetch(`/coop/workspace/documents/${doc.id}/rollback-requests`)
      setRollbacks(r)
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleSave() {
    if (!selectedDoc) return
    try {
      await apiFetch(`/coop/workspace/documents/${selectedDoc.id}/save`, {
        method: 'POST',
        body: JSON.stringify({ blobRef: content }),
      })
      message.success('Saved')
      openDoc(selectedDoc)
      loadDocs()
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleShare() {
    if (!selectedDoc) return
    const values = await shareForm.validateFields()
    try {
      await apiFetch(`/coop/workspace/documents/${selectedDoc.id}/share`, {
        method: 'POST',
        body: JSON.stringify({ memberId: values.memberId, access: 'EDIT' }),
      })
      message.success('Shared')
      setShareOpen(false)
      shareForm.resetFields()
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleRequestRollback(targetVersion: number) {
    if (!selectedDoc) return
    try {
      await apiFetch(`/coop/workspace/documents/${selectedDoc.id}/rollback`, {
        method: 'POST',
        body: JSON.stringify({ targetVersion }),
      })
      message.success('Rollback requested')
      openDoc(selectedDoc)
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleApproveRollback(requestId: string) {
    try {
      await apiFetch(`/coop/workspace/rollback/${requestId}/approve`, { method: 'POST' })
      message.success('Rollback approved')
      if (selectedDoc) openDoc(selectedDoc)
      loadDocs()
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  return (
    <div>
      <h2>Workspace</h2>
      <Button onClick={() => setCreateOpen(true)} style={{ marginBottom: 16 }}>+ New Document</Button>

      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ minWidth: 260 }}>
          <Table
            rowKey="id"
            dataSource={docs}
            pagination={false}
            columns={[
              { title: 'Path', dataIndex: 'path' },
              { title: 'v', dataIndex: 'currentVersion' },
            ]}
            onRow={(doc) => ({ onClick: () => openDoc(doc), style: { cursor: 'pointer' } })}
          />
        </div>

        {selectedDoc && (
          <div style={{ flex: 1 }}>
            <h3>{selectedDoc.path}</h3>
            <Input.TextArea rows={8} value={content} onChange={(e) => setContent(e.target.value)} style={{ marginBottom: 8 }} />
            <Space style={{ marginBottom: 16 }}>
              <Button type="primary" onClick={handleSave}>Save</Button>
              <Button onClick={() => setShareOpen(true)}>Share</Button>
            </Space>

            <Card title="Version History" size="small" style={{ marginBottom: 16 }}>
              <Table
                rowKey="version"
                size="small"
                dataSource={versions}
                pagination={false}
                columns={[
                  { title: 'Version', dataIndex: 'version' },
                  { title: 'Author', dataIndex: 'authorId', render: (id: string) => id.slice(0, 8) },
                  { title: 'Saved', dataIndex: 'createdAt', render: (d: string) => new Date(d).toLocaleString() },
                  {
                    title: 'Actions',
                    render: (_, v: Version) =>
                      v.version !== selectedDoc.currentVersion && (
                        <Button size="small" onClick={() => handleRequestRollback(v.version)}>
                          Request Rollback
                        </Button>
                      ),
                  },
                ]}
              />
            </Card>

            <Card title="Rollback Requests" size="small">
              <Table
                rowKey="id"
                size="small"
                dataSource={rollbacks}
                pagination={false}
                columns={[
                  { title: 'Target v', dataIndex: 'targetVersion' },
                  { title: 'Requested by', dataIndex: 'byId', render: (id: string) => id.slice(0, 8) },
                  { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={s === 'APPROVED' ? 'green' : 'orange'}>{s}</Tag> },
                  {
                    title: 'Actions',
                    render: (_, r: RollbackReq) =>
                      r.status === 'PENDING' && (
                        <Button
                          size="small"
                          disabled={r.byId === myAccountId}
                          onClick={() => handleApproveRollback(r.id)}
                        >
                          {r.byId === myAccountId ? "Can't approve own request" : 'Approve'}
                        </Button>
                      ),
                  },
                ]}
              />
            </Card>
          </div>
        )}
      </div>

      <Modal title="New Document" open={createOpen} onOk={handleCreate} onCancel={() => setCreateOpen(false)}>
        <Form form={createForm} layout="vertical">
          <Form.Item name="path" label="Path" rules={[{ required: true }]}>
            <Input placeholder="/notes/roadmap.md" />
          </Form.Item>
          <Form.Item name="content" label="Content">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Share Document" open={shareOpen} onOk={handleShare} onCancel={() => setShareOpen(false)}>
        <Form form={shareForm} layout="vertical">
          <Form.Item name="memberId" label="Member Account ID" rules={[{ required: true }]}>
            <Input placeholder="Paste an account ID (see Members & Roles for IDs)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { List, Button, Input, Space, Tag, message, Card, Table, Avatar, Breadcrumb } from 'antd'
import { FileTextOutlined, FolderOutlined, PlusOutlined, ShareAltOutlined, HistoryOutlined, SaveOutlined } from '@ant-design/icons'
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

function segments(path: string): string[] {
  return path.split('/').filter(Boolean)
}

function folderContents(docs: Doc[], currentFolder: string[]) {
  const folderSet = new Set<string>()
  const files: Doc[] = []
  for (const doc of docs) {
    const segs = segments(doc.path)
    const matchesPrefix = currentFolder.every((c, i) => segs[i] === c)
    if (!matchesPrefix) continue
    const rest = segs.slice(currentFolder.length)
    if (rest.length === 1) files.push(doc)
    else if (rest.length > 1) folderSet.add(rest[0])
  }
  return { folders: Array.from(folderSet).sort(), files }
}

export default function WorkspacePage() {
  const [myAccountId, setMyAccountId] = useState<string | null>(null)
  const [docs, setDocs] = useState<Doc[]>([])
  const [currentFolder, setCurrentFolder] = useState<string[]>([])
  const [newName, setNewName] = useState('')

  const [selectedDoc, setSelectedDoc] = useState<Doc | null>(null)
  const [content, setContent] = useState('')
  const [versions, setVersions] = useState<Version[]>([])
  const [rollbacks, setRollbacks] = useState<RollbackReq[]>([])
  const [shareId, setShareId] = useState('')
  const [showHistory, setShowHistory] = useState(false)

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
    if (!newName.trim()) return
    const path = '/' + [...currentFolder, newName].join('/')
    try {
      await apiFetch('/coop/workspace/documents', {
        method: 'POST',
        body: JSON.stringify({ workspaceId: WORKSPACE_ID, path, blobRef: '' }),
      })
      setNewName('')
      loadDocs()
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function openDoc(doc: Doc) {
    setSelectedDoc(doc)
    setShowHistory(false)
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
    if (!selectedDoc || !shareId.trim()) return
    try {
      await apiFetch(`/coop/workspace/documents/${selectedDoc.id}/share`, {
        method: 'POST',
        body: JSON.stringify({ memberId: shareId, access: 'EDIT' }),
      })
      message.success('Shared')
      setShareId('')
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

  const { folders, files } = folderContents(docs, currentFolder)

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 130px)' }}>
      {/* Directory browser */}
      <div style={{ width: 280, borderRight: '1px solid #2a2a2a', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #2a2a2a' }}>
          <h3 style={{ margin: '0 0 8px' }}>Workspace</h3>
          <Breadcrumb
            style={{ marginBottom: 10, fontSize: 12 }}
            items={[
              { title: <a onClick={() => setCurrentFolder([])}>root</a> },
              ...currentFolder.map((seg, i) => ({
                title: <a onClick={() => setCurrentFolder(currentFolder.slice(0, i + 1))}>{seg}</a>,
              })),
            ]}
          />
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="name.md or folder/name.md"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onPressEnter={handleCreate}
              size="small"
            />
            <Button size="small" type="primary" icon={<PlusOutlined />} onClick={handleCreate} />
          </Space.Compact>
        </div>

        <List
          style={{ overflowY: 'auto', flex: 1 }}
          dataSource={[
            ...folders.map((f) => ({ type: 'folder' as const, name: f })),
            ...files.map((f) => ({ type: 'file' as const, doc: f })),
          ]}
          renderItem={(item) =>
            item.type === 'folder' ? (
              <List.Item
                onClick={() => setCurrentFolder([...currentFolder, item.name])}
                style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #222' }}
              >
                <List.Item.Meta
                  avatar={<Avatar size="small" icon={<FolderOutlined />} style={{ background: '#F5B93E' }} />}
                  title={<span style={{ fontSize: 13 }}>{item.name}</span>}
                />
              </List.Item>
            ) : (
              <List.Item
                onClick={() => openDoc(item.doc)}
                style={{
                  padding: '10px 16px',
                  cursor: 'pointer',
                  background: selectedDoc?.id === item.doc.id ? '#1f1a33' : 'transparent',
                  borderBottom: '1px solid #222',
                }}
              >
                <List.Item.Meta
                  avatar={<Avatar size="small" icon={<FileTextOutlined />} style={{ background: '#6C5CE7' }} />}
                  title={<span style={{ fontSize: 13 }}>{segments(item.doc.path).slice(-1)[0]}</span>}
                  description={<span style={{ fontSize: 11, color: '#888' }}>v{item.doc.currentVersion}</span>}
                />
              </List.Item>
            )
          }
        />
      </div>

      {/* Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {!selectedDoc ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
            Select or create a document
          </div>
        ) : (
          <>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #2a2a2a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{selectedDoc.path}</strong> <Tag style={{ marginLeft: 8 }}>v{selectedDoc.currentVersion}</Tag>
              </div>
              <Space>
                <Button size="small" icon={<SaveOutlined />} type="primary" onClick={handleSave}>Save</Button>
                <Button size="small" icon={<HistoryOutlined />} onClick={() => setShowHistory((s) => !s)}>
                  History
                </Button>
              </Space>
            </div>

            <div style={{ flex: 1, display: 'flex' }}>
              <Input.TextArea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={{ flex: 1, border: 'none', resize: 'none', padding: 20, fontSize: 14, borderRadius: 0 }}
                placeholder="Start writing..."
              />

              {showHistory && (
                <div style={{ width: 320, borderLeft: '1px solid #2a2a2a', overflowY: 'auto', padding: 16 }}>
                  <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
                    <Input
                      size="small"
                      placeholder="Account ID to share with"
                      value={shareId}
                      onChange={(e) => setShareId(e.target.value)}
                      onPressEnter={handleShare}
                    />
                    <Button size="small" icon={<ShareAltOutlined />} onClick={handleShare} />
                  </div>

                  <Card title="Version History" size="small" style={{ marginBottom: 16 }}>
                    <Table
                      rowKey="version"
                      size="small"
                      dataSource={versions}
                      pagination={false}
                      columns={[
                        { title: 'v', dataIndex: 'version', width: 40 },
                        { title: 'When', dataIndex: 'createdAt', render: (d: string) => new Date(d).toLocaleDateString() },
                        {
                          title: '',
                          render: (_, v: Version) =>
                            v.version !== selectedDoc.currentVersion && (
                              <Button size="small" onClick={() => handleRequestRollback(v.version)}>Revert</Button>
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
                        { title: 'Target v', dataIndex: 'targetVersion', width: 60 },
                        { title: 'Status', dataIndex: 'status', render: (s: string) => <Tag color={s === 'APPROVED' ? 'green' : 'orange'}>{s}</Tag> },
                        {
                          title: '',
                          render: (_, r: RollbackReq) =>
                            r.status === 'PENDING' && (
                              <Button size="small" disabled={r.byId === myAccountId} onClick={() => handleApproveRollback(r.id)}>
                                {r.byId === myAccountId ? "Own" : 'Approve'}
                              </Button>
                            ),
                        },
                      ]}
                    />
                  </Card>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

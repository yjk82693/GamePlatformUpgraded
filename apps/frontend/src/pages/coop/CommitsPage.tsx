import { useEffect, useState } from 'react'
import { List, Avatar, Tag, Input, Button, message, Empty } from 'antd'
import { FileTextOutlined, UserOutlined } from '@ant-design/icons'
import { apiFetch } from '../../lib/api'

interface VersionEntry {
  documentId: string
  version: number
  authorId: string
  author: { email: string }
  createdAt: string
  document: { path: string }
}

interface Comment {
  id: string
  authorId: string
  author: { email: string }
  body: string
  parentId: string | null
  createdAt: string
}

const WORKSPACE_ID = 'default'

export default function CommitsPage() {
  const [versions, setVersions] = useState<VersionEntry[]>([])
  const [selected, setSelected] = useState<VersionEntry | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  useEffect(() => {
    loadVersions()
  }, [])

  async function loadVersions() {
    try {
      setVersions(await apiFetch(`/coop/commits?workspaceId=${WORKSPACE_ID}`))
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function openVersion(v: VersionEntry) {
    setSelected(v)
    try {
      setComments(await apiFetch(`/coop/commits/${v.documentId}/${v.version}/comments`))
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleComment() {
    if (!selected || !newComment.trim()) return
    try {
      await apiFetch(`/coop/commits/${selected.documentId}/${selected.version}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: newComment }),
      })
      setNewComment('')
      openVersion(selected)
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleReply(parentId: string) {
    if (!selected || !replyText.trim()) return
    try {
      await apiFetch(`/coop/commits/${selected.documentId}/${selected.version}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: replyText, parentId }),
      })
      setReplyText('')
      setReplyTo(null)
      openVersion(selected)
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  const topLevel = comments.filter((c) => !c.parentId)
  const repliesFor = (id: string) => comments.filter((c) => c.parentId === id)

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 130px)' }}>
      <div style={{ width: 340, borderRight: '1px solid #2a2a2a', overflowY: 'auto' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #2a2a2a' }}>
          <h3 style={{ margin: 0 }}>Commits</h3>
        </div>
        {versions.length === 0 ? (
          <div style={{ padding: 40 }}><Empty description="No commits yet" /></div>
        ) : (
          <List
            dataSource={versions}
            renderItem={(v) => (
              <List.Item
                onClick={() => openVersion(v)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  background: selected?.documentId === v.documentId && selected?.version === v.version ? '#1f1a33' : 'transparent',
                  borderBottom: '1px solid #222',
                }}
              >
                <List.Item.Meta
                  avatar={<Avatar size="small" icon={<FileTextOutlined />} style={{ background: '#6C5CE7' }} />}
                  title={<span style={{ fontSize: 13 }}>{v.document.path} <Tag>v{v.version}</Tag></span>}
                  description={<span style={{ fontSize: 11, color: '#888' }}>{v.author.email} · {new Date(v.createdAt).toLocaleString()}</span>}
                />
              </List.Item>
            )}
          />
        )}
      </div>

      <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
        {!selected ? (
          <div style={{ color: '#666' }}>Select a commit to view feedback</div>
        ) : (
          <>
            <h3>{selected.document.path} — v{selected.version}</h3>
            <p style={{ color: '#888', fontSize: 13 }}>
              by {selected.author.email} on {new Date(selected.createdAt).toLocaleString()}
            </p>

            <div style={{ marginTop: 24 }}>
              {topLevel.length === 0 && <p style={{ color: '#666' }}>No feedback yet on this commit.</p>}
              {topLevel.map((c) => (
                <div key={c.id} style={{ marginBottom: 16, borderLeft: '2px solid #2a2a2a', paddingLeft: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar size="small" icon={<UserOutlined />} style={{ background: '#6C5CE7' }} />
                    <strong style={{ fontSize: 13 }}>{c.author.email}</strong>
                    <span style={{ fontSize: 11, color: '#666' }}>{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                  <p style={{ margin: '6px 0 4px', fontSize: 14 }}>{c.body}</p>
                  <Button size="small" type="link" onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}>
                    Reply
                  </Button>

                  {replyTo === c.id && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 6, marginBottom: 6 }}>
                      <Input
                        size="small"
                        placeholder="Write a reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onPressEnter={() => handleReply(c.id)}
                      />
                      <Button size="small" onClick={() => handleReply(c.id)}>Send</Button>
                    </div>
                  )}

                  {repliesFor(c.id).map((r) => (
                    <div key={r.id} style={{ marginLeft: 24, marginTop: 8, borderLeft: '2px solid #1f1a33', paddingLeft: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar size="small" icon={<UserOutlined />} style={{ background: '#8C7BFF' }} />
                        <strong style={{ fontSize: 12 }}>{r.author.email}</strong>
                        <span style={{ fontSize: 11, color: '#666' }}>{new Date(r.createdAt).toLocaleString()}</span>
                      </div>
                      <p style={{ margin: '4px 0', fontSize: 13 }}>{r.body}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
              <Input
                placeholder="Leave feedback on this commit..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onPressEnter={handleComment}
              />
              <Button type="primary" onClick={handleComment}>Comment</Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

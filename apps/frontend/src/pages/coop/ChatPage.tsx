import { useEffect, useRef, useState } from 'react'
import { List, Avatar, Button, Modal, Input, Checkbox, message, Empty, Tooltip } from 'antd'
import { UserOutlined, TeamOutlined, MessageOutlined, SendOutlined, PlusOutlined, SettingOutlined } from '@ant-design/icons'
import { apiFetch } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

interface ThreadParticipant {
  account: { id: string; email: string }
}

interface Thread {
  id: string
  kind: string
  participants: ThreadParticipant[]
}

interface ThreadWithPreview extends Thread {
  lastMessage?: { body: string; createdAt: string; senderId: string }
}

interface Msg {
  id: string
  senderId: string
  body: string
  createdAt: string
}

interface Member {
  accountId: string
  account: { id: string; email: string }
}

function otherParticipants(t: Thread, myId: string | null) {
  return t.participants.filter((p) => p.account.id !== myId).map((p) => p.account.email)
}

export default function ChatPage() {
  const { logout } = useAuth()
  const [myAccountId, setMyAccountId] = useState<string | null>(null)
  const [myEmail, setMyEmail] = useState<string | null>(null)
  const [view, setView] = useState<'members' | 'chats'>('members')

  const [members, setMembers] = useState<Member[]>([])
  const [threads, setThreads] = useState<ThreadWithPreview[]>([])
  const [selected, setSelected] = useState<Thread | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [body, setBody] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const [newModalOpen, setNewModalOpen] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [profileOpen, setProfileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    apiFetch('/auth/me').then((me) => setMyAccountId(me.accountId)).catch(() => {})
    loadMembers()
    loadThreads()
  }, [])

  useEffect(() => {
    if (myAccountId && members.length > 0) {
      const me = members.find((m) => m.accountId === myAccountId)
      if (me) setMyEmail(me.account.email)
    }
  }, [myAccountId, members])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadMembers() {
    try {
      const list = await apiFetch('/distributor/members')
      setMembers(list.map((m: any) => ({ accountId: m.accountId, account: m.account })))
    } catch {
      // members list requires distributor read access; ignore if unavailable
    }
  }

  async function loadThreads() {
    try {
      const list: Thread[] = await apiFetch('/coop/chat/threads')
      const withPreviews = await Promise.all(
        list.map(async (t) => {
          try {
            const msgs = await apiFetch(`/coop/chat/threads/${t.id}/messages`)
            return { ...t, lastMessage: msgs[0] }
          } catch {
            return t
          }
        })
      )
      setThreads(withPreviews)
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function openThread(t: Thread) {
    setSelected(t)
    setView('chats')
    try {
      const data = await apiFetch(`/coop/chat/threads/${t.id}/messages`)
      setMessages([...data].reverse())
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function openDirectChatWith(otherAccountId: string) {
    const existing = threads.find(
      (t) =>
        t.kind === 'STAFF_DIRECT' &&
        t.participants.length === 2 &&
        t.participants.some((p) => p.account.id === otherAccountId)
    )
    if (existing) {
      openThread(existing)
      return
    }
    try {
      const thread = await apiFetch('/coop/chat/threads', {
        method: 'POST',
        body: JSON.stringify({ kind: 'STAFF_DIRECT', participantIds: [myAccountId, otherAccountId] }),
      })
      await loadThreads()
      openThread(thread)
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleSend() {
    if (!selected || !body.trim()) return
    const text = body
    setBody('')
    try {
      await apiFetch(`/coop/chat/threads/${selected.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body: text }),
      })
      await openThread(selected)
      loadThreads()
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleCreateGroup() {
    if (selectedMembers.length < 2) {
      message.warning('Pick at least 2 members for a group chat')
      return
    }
    try {
      const thread = await apiFetch('/coop/chat/threads', {
        method: 'POST',
        body: JSON.stringify({ kind: 'GROUP', participantIds: [myAccountId, ...selectedMembers] }),
      })
      message.success('Group chat created')
      setNewModalOpen(false)
      setSelectedMembers([])
      await loadThreads()
      openThread(thread)
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 130px)' }}>
      {/* Icon rail */}
      <div
        style={{
          width: 56,
          borderRight: '1px solid #2a2a2a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 16,
          paddingBottom: 16,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
          <Tooltip title="My Profile" placement="right">
            <Avatar
              size={36}
              icon={<UserOutlined />}
              style={{ background: '#6C5CE7', cursor: 'pointer' }}
              onClick={() => setProfileOpen(true)}
            />
          </Tooltip>
          <Tooltip title="Members" placement="right">
            <Button
              type={view === 'members' ? 'primary' : 'text'}
              shape="circle"
              icon={<TeamOutlined />}
              onClick={() => setView('members')}
            />
          </Tooltip>
          <Tooltip title="Chats" placement="right">
            <Button
              type={view === 'chats' ? 'primary' : 'text'}
              shape="circle"
              icon={<MessageOutlined />}
              onClick={() => setView('chats')}
            />
          </Tooltip>
        </div>

        <Tooltip title="Settings" placement="right">
          <Button type="text" shape="circle" icon={<SettingOutlined />} onClick={() => setSettingsOpen(true)} />
        </Tooltip>
      </div>

      {/* Middle panel */}
      <div style={{ width: 300, borderRight: '1px solid #2a2a2a', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 16, borderBottom: '1px solid #2a2a2a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>{view === 'members' ? 'Members' : 'Chats'}</h3>
          {view === 'chats' && (
            <Tooltip title="New group chat">
              <Button size="small" shape="circle" icon={<PlusOutlined />} onClick={() => setNewModalOpen(true)} />
            </Tooltip>
          )}
        </div>

        {view === 'members' ? (
          members.length === 0 ? (
            <div style={{ padding: 40 }}><Empty description="No members found" /></div>
          ) : (
            <List
              style={{ overflowY: 'auto', flex: 1 }}
              dataSource={members.filter((m) => m.accountId !== myAccountId)}
              renderItem={(m) => (
                <List.Item
                  onClick={() => openDirectChatWith(m.accountId)}
                  style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #222' }}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} style={{ background: '#6C5CE7' }} />}
                    title={<span style={{ fontSize: 14 }}>{m.account.email}</span>}
                  />
                </List.Item>
              )}
            />
          )
        ) : threads.length === 0 ? (
          <div style={{ padding: 40 }}><Empty description="No conversations yet" /></div>
        ) : (
          <List
            style={{ overflowY: 'auto', flex: 1 }}
            dataSource={threads}
            renderItem={(t) => {
              const others = otherParticipants(t, myAccountId)
              const isGroup = t.kind === 'GROUP'
              return (
                <List.Item
                  onClick={() => openThread(t)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    background: selected?.id === t.id ? '#1f1a33' : 'transparent',
                    borderBottom: '1px solid #222',
                  }}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={isGroup ? <TeamOutlined /> : <UserOutlined />} style={{ background: '#6C5CE7' }} />}
                    title={<span style={{ fontSize: 14 }}>{others.join(', ') || '(empty)'}</span>}
                    description={<span style={{ fontSize: 12, color: '#888' }}>{t.lastMessage ? t.lastMessage.body : 'No messages yet'}</span>}
                  />
                </List.Item>
              )
            }}
          />
        )}
      </div>

      {/* Message panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {!selected ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Empty description="Select a member or conversation" />
          </div>
        ) : (
          <>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #2a2a2a', fontWeight: 600 }}>
              {otherParticipants(selected, myAccountId).join(', ')}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.map((m) => {
                const isMine = m.senderId === myAccountId
                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '65%' }}>
                      {!isMine && (
                        <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>{m.senderId.slice(0, 8)}</div>
                      )}
                      <div
                        style={{
                          background: isMine ? '#6C5CE7' : '#2a2a2a',
                          color: isMine ? '#fff' : '#eee',
                          padding: '8px 12px',
                          borderRadius: 14,
                          borderBottomRightRadius: isMine ? 4 : 14,
                          borderBottomLeftRadius: isMine ? 14 : 4,
                          fontSize: 14,
                          wordBreak: 'break-word',
                        }}
                      >
                        {m.body}
                      </div>
                      <div style={{ fontSize: 10, color: '#666', marginTop: 2, textAlign: isMine ? 'right' : 'left' }}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            <div style={{ padding: 12, borderTop: '1px solid #2a2a2a', display: 'flex', gap: 8 }}>
              <Input
                placeholder="Type a message..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onPressEnter={handleSend}
              />
              <Button type="primary" icon={<SendOutlined />} onClick={handleSend} />
            </div>
          </>
        )}
      </div>

      <Modal title="New Group Chat" open={newModalOpen} onOk={handleCreateGroup} onCancel={() => setNewModalOpen(false)}>
        <Checkbox.Group
          options={members.filter((m) => m.accountId !== myAccountId).map((m) => ({ label: m.account.email, value: m.accountId }))}
          value={selectedMembers}
          onChange={(vals) => setSelectedMembers(vals as string[])}
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        />
      </Modal>

      <Modal title="My Profile" open={profileOpen} onCancel={() => setProfileOpen(false)} footer={null}>
        <p><strong>Email:</strong> {myEmail ?? '—'}</p>
        <p><strong>Account ID:</strong> <code>{myAccountId}</code></p>
      </Modal>

      <Modal title="Settings" open={settingsOpen} onCancel={() => setSettingsOpen(false)} footer={null}>
        <Button danger onClick={logout} block>Log out</Button>
      </Modal>
    </div>
  )
}

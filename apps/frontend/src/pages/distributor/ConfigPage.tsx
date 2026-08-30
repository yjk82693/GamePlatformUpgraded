import { useEffect, useState } from 'react'
import { Tabs, Select, Table, Button, Modal, Form, Input, InputNumber, Tag, Space, message } from 'antd'
import { apiFetch } from '../../lib/api'

interface App { id: string; name: string }
interface Board { id: string; name: string; season: number; closed: boolean }
interface Terms { id: string; version: string; effectiveDate: string; active: boolean }
interface RedeemCode { id: string; code: string; usesLeft: number; expiry: string | null }

export default function ConfigPage() {
  const [apps, setApps] = useState<App[]>([])
  const [selectedApp, setSelectedApp] = useState<string | null>(null)
  const [boards, setBoards] = useState<Board[]>([])
  const [boardModalOpen, setBoardModalOpen] = useState(false)
  const [boardForm] = Form.useForm()

  const [terms, setTerms] = useState<Terms[]>([])
  const [termsModalOpen, setTermsModalOpen] = useState(false)
  const [termsForm] = Form.useForm()

  const [codes, setCodes] = useState<RedeemCode[]>([])
  const [codeModalOpen, setCodeModalOpen] = useState(false)
  const [codeForm] = Form.useForm()

  useEffect(() => {
    loadApps()
    loadTerms()
    loadCodes()
  }, [])

  useEffect(() => {
    if (selectedApp) loadBoards(selectedApp)
  }, [selectedApp])

  async function loadApps() {
    try {
      const list = await apiFetch('/distributor/config/apps/multiplayer')
      setApps(list)
      if (list.length > 0) setSelectedApp(list[0].id)
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function loadBoards(appId: string) {
    try {
      setBoards(await apiFetch(`/distributor/config/boards/app/${appId}`))
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function loadTerms() {
    try {
      setTerms(await apiFetch('/distributor/config/terms'))
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function loadCodes() {
    try {
      setCodes(await apiFetch('/distributor/config/redeem-codes'))
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleCreateBoard() {
    const values = await boardForm.validateFields()
    try {
      await apiFetch('/distributor/config/boards', {
        method: 'POST',
        body: JSON.stringify({ appId: selectedApp, name: values.name }),
      })
      message.success('Board created')
      setBoardModalOpen(false)
      boardForm.resetFields()
      if (selectedApp) loadBoards(selectedApp)
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleSeasonToggle(board: Board) {
    try {
      await apiFetch(`/distributor/config/boards/${board.id}/${board.closed ? 'open-season' : 'close-season'}`, { method: 'POST' })
      if (selectedApp) loadBoards(selectedApp)
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleCreateTerms() {
    const values = await termsForm.validateFields()
    try {
      await apiFetch('/distributor/config/terms', {
        method: 'POST',
        body: JSON.stringify({ version: values.version, content: values.content, effectiveDate: values.effectiveDate }),
      })
      message.success('Terms registered')
      setTermsModalOpen(false)
      termsForm.resetFields()
      loadTerms()
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleActivateTerms(version: string) {
    try {
      await apiFetch(`/distributor/config/terms/${version}/activate`, { method: 'POST' })
      message.success('Terms activated')
      loadTerms()
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleGenerateCode() {
    const values = await codeForm.validateFields()
    try {
      await apiFetch('/distributor/config/redeem-codes', {
        method: 'POST',
        body: JSON.stringify({
          reward: [{ itemId: values.itemId, amount: values.amount }],
          usesLeft: values.usesLeft,
        }),
      })
      message.success('Code generated')
      setCodeModalOpen(false)
      codeForm.resetFields()
      loadCodes()
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleRevokeCode(id: string) {
    try {
      await apiFetch(`/distributor/config/redeem-codes/${id}/revoke`, { method: 'POST' })
      message.success('Code revoked')
      loadCodes()
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  return (
    <div>
      <h2>Leaderboard / Terms / Redeem</h2>
      <Tabs
        items={[
          {
            key: 'leaderboard',
            label: 'Leaderboard',
            children: (
              <div>
                <Space style={{ marginBottom: 12 }}>
                  <Select
                    style={{ width: 240 }}
                    value={selectedApp}
                    onChange={setSelectedApp}
                    options={apps.map((a) => ({ value: a.id, label: a.name }))}
                  />
                  <Button onClick={() => setBoardModalOpen(true)} disabled={!selectedApp}>+ New Board</Button>
                </Space>
                <Table
                  rowKey="id"
                  dataSource={boards}
                  columns={[
                    { title: 'Name', dataIndex: 'name' },
                    { title: 'Season', dataIndex: 'season' },
                    {
                      title: 'Status',
                      dataIndex: 'closed',
                      render: (closed: boolean) => <Tag color={closed ? 'red' : 'green'}>{closed ? 'Closed' : 'Open'}</Tag>,
                    },
                    {
                      title: 'Actions',
                      render: (_, b: Board) => (
                        <Button size="small" onClick={() => handleSeasonToggle(b)}>
                          {b.closed ? 'Open New Season' : 'Close Season'}
                        </Button>
                      ),
                    },
                  ]}
                />
              </div>
            ),
          },
          {
            key: 'terms',
            label: 'Terms',
            children: (
              <div>
                <Button onClick={() => setTermsModalOpen(true)} style={{ marginBottom: 12 }}>+ Register Terms</Button>
                <Table
                  rowKey="id"
                  dataSource={terms}
                  columns={[
                    { title: 'Version', dataIndex: 'version' },
                    { title: 'Effective', dataIndex: 'effectiveDate', render: (d: string) => new Date(d).toLocaleDateString() },
                    { title: 'Active', dataIndex: 'active', render: (a: boolean) => <Tag color={a ? 'green' : 'default'}>{a ? 'Active' : 'Inactive'}</Tag> },
                    {
                      title: 'Actions',
                      render: (_, t: Terms) => !t.active && <Button size="small" onClick={() => handleActivateTerms(t.version)}>Activate</Button>,
                    },
                  ]}
                />
              </div>
            ),
          },
          {
            key: 'redeem',
            label: 'Redeem Codes',
            children: (
              <div>
                <Button onClick={() => setCodeModalOpen(true)} style={{ marginBottom: 12 }}>+ Generate Code</Button>
                <Table
                  rowKey="id"
                  dataSource={codes}
                  columns={[
                    { title: 'Code', dataIndex: 'code' },
                    { title: 'Uses Left', dataIndex: 'usesLeft' },
                    {
                      title: 'Actions',
                      render: (_, c: RedeemCode) => c.usesLeft > 0 && <Button size="small" danger onClick={() => handleRevokeCode(c.id)}>Revoke</Button>,
                    },
                  ]}
                />
              </div>
            ),
          },
        ]}
      />

      <Modal title="New Board" open={boardModalOpen} onOk={handleCreateBoard} onCancel={() => setBoardModalOpen(false)}>
        <Form form={boardForm} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Register Terms" open={termsModalOpen} onOk={handleCreateTerms} onCancel={() => setTermsModalOpen(false)}>
        <Form form={termsForm} layout="vertical">
          <Form.Item name="version" label="Version" rules={[{ required: true }]}>
            <Input placeholder="v1.1" />
          </Form.Item>
          <Form.Item name="content" label="Content" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="effectiveDate" label="Effective Date (ISO)" rules={[{ required: true }]}>
            <Input placeholder="2026-09-01" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Generate Redeem Code" open={codeModalOpen} onOk={handleGenerateCode} onCancel={() => setCodeModalOpen(false)}>
        <Form form={codeForm} layout="vertical">
          <Form.Item name="itemId" label="Item ID" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="amount" label="Amount" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="usesLeft" label="Uses Left" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

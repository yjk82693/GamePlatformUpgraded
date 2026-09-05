import { useEffect, useState } from 'react'
import { Select, Table, Button, Modal, Form, Input, Switch, Space, Tag, message } from 'antd'
import { apiFetch } from '../../lib/api'

interface App { id: string; name: string }
interface Build { id: string; version: string; checksum: string; published: boolean }

export default function AppOpsPage() {
  const [apps, setApps] = useState<App[]>([])
  const [selectedApp, setSelectedApp] = useState<string | null>(null)
  const [builds, setBuilds] = useState<Build[]>([])
  const [buildModalOpen, setBuildModalOpen] = useState(false)
  const [noticeModalOpen, setNoticeModalOpen] = useState(false)
  const [eventModalOpen, setEventModalOpen] = useState(false)
  const [buildForm] = Form.useForm()
  const [noticeForm] = Form.useForm()
  const [eventForm] = Form.useForm()

  useEffect(() => {
    loadApps()
  }, [])

  useEffect(() => {
    if (selectedApp) loadBuilds(selectedApp)
  }, [selectedApp])

  async function loadApps() {
    try {
      const list = await apiFetch('/distributor/catalog/apps')
      setApps(list)
      if (list.length > 0) setSelectedApp(list[0].id)
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function loadBuilds(appId: string) {
    try {
      setBuilds(await apiFetch(`/distributor/appops/builds/app/${appId}`))
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleCreateBuild() {
    const values = await buildForm.validateFields()
    try {
      await apiFetch('/distributor/appops/builds', {
        method: 'POST',
        body: JSON.stringify({ appId: selectedApp, version: values.version, checksum: values.checksum }),
      })
      message.success('Build created')
      setBuildModalOpen(false)
      buildForm.resetFields()
      if (selectedApp) loadBuilds(selectedApp)
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handlePublish(buildId: string) {
    try {
      await apiFetch(`/distributor/appops/builds/${buildId}/publish`, { method: 'POST' })
      message.success('Build published')
      if (selectedApp) loadBuilds(selectedApp)
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleMaintenanceToggle(on: boolean) {
    if (!selectedApp) return
    try {
      await apiFetch(`/distributor/appops/apps/${selectedApp}/maintenance`, {
        method: 'POST',
        body: JSON.stringify({ on }),
      })
      message.success(on ? 'Maintenance mode enabled' : 'Maintenance mode disabled')
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleCreateNotice() {
    const values = await noticeForm.validateFields()
    try {
      await apiFetch(`/distributor/appops/apps/${selectedApp}/notices`, {
        method: 'POST',
        body: JSON.stringify({ content: values.content, audience: values.audience }),
      })
      message.success('Notice created')
      setNoticeModalOpen(false)
      noticeForm.resetFields()
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleCreateEvent() {
    const values = await eventForm.validateFields()
    try {
      await apiFetch(`/distributor/appops/apps/${selectedApp}/live-events`, {
        method: 'POST',
        body: JSON.stringify({
          config: { description: values.description },
          startsAt: values.startsAt,
          endsAt: values.endsAt,
        }),
      })
      message.success('Live event created')
      setEventModalOpen(false)
      eventForm.resetFields()
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  return (
    <div>
      <h2>App Operations</h2>

      <Space style={{ marginBottom: 16 }}>
        <Select
          style={{ width: 260 }}
          value={selectedApp}
          onChange={setSelectedApp}
          options={apps.map((a) => ({ value: a.id, label: a.name }))}
          placeholder="Select a game"
        />
        <span>Maintenance Mode:</span>
        <Switch onChange={handleMaintenanceToggle} />
      </Space>

      <h3>Builds</h3>
      <Button onClick={() => setBuildModalOpen(true)} style={{ marginBottom: 12 }} disabled={!selectedApp}>
        + New Build
      </Button>
      <Table
        rowKey="id"
        dataSource={builds}
        columns={[
          { title: 'Version', dataIndex: 'version' },
          { title: 'Checksum', dataIndex: 'checksum' },
          {
            title: 'Status',
            dataIndex: 'published',
            render: (p: boolean) => <Tag color={p ? 'green' : 'default'}>{p ? 'Published' : 'Unpublished'}</Tag>,
          },
          {
            title: 'Actions',
            render: (_, b: Build) =>
              !b.published && <Button size="small" onClick={() => handlePublish(b.id)}>Publish</Button>,
          },
        ]}
        style={{ marginBottom: 24 }}
      />

      <Space>
        <Button onClick={() => setNoticeModalOpen(true)} disabled={!selectedApp}>+ Author Notice</Button>
        <Button onClick={() => setEventModalOpen(true)} disabled={!selectedApp}>+ Configure Live Event</Button>
      </Space>

      <Modal title="New Build" open={buildModalOpen} onOk={handleCreateBuild} onCancel={() => setBuildModalOpen(false)}>
        <Form form={buildForm} layout="vertical">
          <Form.Item name="version" label="Version" rules={[{ required: true }]}>
            <Input placeholder="1.0.0" />
          </Form.Item>
          <Form.Item name="checksum" label="Checksum" rules={[{ required: true }]}>
            <Input placeholder="sha256..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Author Notice" open={noticeModalOpen} onOk={handleCreateNotice} onCancel={() => setNoticeModalOpen(false)}>
        <Form form={noticeForm} layout="vertical">
          <Form.Item name="content" label="Content" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="audience" label="Audience" rules={[{ required: true }]}>
            <Input placeholder="all-players" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Configure Live Event" open={eventModalOpen} onOk={handleCreateEvent} onCancel={() => setEventModalOpen(false)}>
        <Form form={eventForm} layout="vertical">
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="startsAt" label="Starts At (ISO date)" rules={[{ required: true }]}>
            <Input placeholder="2026-09-01T00:00:00Z" />
          </Form.Item>
          <Form.Item name="endsAt" label="Ends At (ISO date)" rules={[{ required: true }]}>
            <Input placeholder="2026-09-08T00:00:00Z" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

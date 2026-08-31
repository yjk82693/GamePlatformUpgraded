import { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, Tag, message } from 'antd'
import { apiFetch } from '../../lib/api'

const SCOPE = 'default'

interface Task {
  id: string
  title: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  status: 'TODO' | 'DONE'
  assigneeId: string | null
}

interface Member {
  accountId: string
  account: { email: string }
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    load()
    loadMembers()
  }, [])

  async function load() {
    try {
      setTasks(await apiFetch(`/coop/tasks?scope=${SCOPE}`))
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function loadMembers() {
    try {
      const list = await apiFetch('/distributor/members')
      setMembers(list.map((m: any) => ({ accountId: m.accountId, account: m.account })))
    } catch (err) {
      // members list is a nice-to-have for assignment; ignore failure
    }
  }

  async function handleCreate() {
    const values = await form.validateFields()
    try {
      await apiFetch('/coop/tasks', {
        method: 'POST',
        body: JSON.stringify({ scope: SCOPE, title: values.title, priority: values.priority }),
      })
      message.success('Task added')
      setModalOpen(false)
      form.resetFields()
      load()
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleAssign(taskId: string, assigneeId: string) {
    try {
      await apiFetch(`/coop/tasks/${taskId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ assigneeId }),
      })
      load()
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handlePriority(taskId: string, priority: string) {
    try {
      await apiFetch(`/coop/tasks/${taskId}/priority`, {
        method: 'PATCH',
        body: JSON.stringify({ priority }),
      })
      load()
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleComplete(taskId: string) {
    try {
      await apiFetch(`/coop/tasks/${taskId}/complete`, { method: 'POST' })
      load()
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  return (
    <div>
      <h2>Tasks</h2>
      <Button onClick={() => setModalOpen(true)} style={{ marginBottom: 16 }}>+ New Task</Button>

      <Table
        rowKey="id"
        dataSource={tasks}
        columns={[
          { title: 'Title', dataIndex: 'title' },
          {
            title: 'Priority',
            dataIndex: 'priority',
            render: (p: string, t: Task) => (
              <Select
                size="small"
                value={p}
                style={{ width: 100 }}
                onChange={(v: string) => handlePriority(t.id, v)}
                options={[{ value: 'LOW', label: 'Low' }, { value: 'MEDIUM', label: 'Medium' }, { value: 'HIGH', label: 'High' }]}
              />
            ),
          },
          {
            title: 'Status',
            dataIndex: 'status',
            render: (s: string) => <Tag color={s === 'DONE' ? 'green' : 'default'}>{s}</Tag>,
          },
          {
            title: 'Assignee',
            render: (_, t: Task) => (
              <Select
                size="small"
                style={{ width: 160 }}
                placeholder="Unassigned"
                value={t.assigneeId ?? undefined}
                onChange={(v: string) => handleAssign(t.id, v)}
                options={members.map((m) => ({ value: m.accountId, label: m.account.email }))}
              />
            ),
          },
          {
            title: 'Actions',
            render: (_, t: Task) =>
              t.status !== 'DONE' && <Button size="small" onClick={() => handleComplete(t.id)}>Complete</Button>,
          },
        ]}
      />

      <Modal title="New Task" open={modalOpen} onOk={handleCreate} onCancel={() => setModalOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="priority" label="Priority" rules={[{ required: true }]} initialValue="MEDIUM">
            <Select options={[{ value: 'LOW', label: 'Low' }, { value: 'MEDIUM', label: 'Medium' }, { value: 'HIGH', label: 'High' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

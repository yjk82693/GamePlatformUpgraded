import { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, Space, Tag, message, Popconfirm } from 'antd'
import { apiFetch } from '../../lib/api'

interface RoleAssignment {
  role: { id: string; name: string }
}

interface MemberRow {
  id: string
  accountId: string
  orgId: string | null
  account: { email: string; status: 'ACTIVE' | 'SUSPENDED' | 'KICKED' }
  roles: RoleAssignment[]
}

interface Role {
  id: string
  name: string
}

export default function MembersPage() {
  const [members, setMembers] = useState<MemberRow[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const [m, r] = await Promise.all([
        apiFetch('/distributor/members'),
        apiFetch('/distributor/members/roles'),
      ])
      setMembers(m)
      setRoles(r)
    } catch (err) {
      message.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handleInvite() {
    const values = await form.validateFields()
    const orgId = members.find((m) => m.orgId)?.orgId
    try {
      await apiFetch('/distributor/members/invite', {
        method: 'POST',
        body: JSON.stringify({ email: values.email, scope: { level: 'ORG', scopeId: orgId } }),
      })
      message.success('Member invited')
      setInviteOpen(false)
      form.resetFields()
      load()
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleGrantRole(memberId: string, roleId: string) {
    try {
      await apiFetch(`/distributor/members/${memberId}/roles/${roleId}`, { method: 'POST' })
      load()
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleRevokeRole(memberId: string, roleId: string) {
    try {
      await apiFetch(`/distributor/members/${memberId}/roles/${roleId}`, { method: 'DELETE' })
      load()
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleSuspend(accountId: string, suspend: boolean) {
    try {
      await apiFetch(`/distributor/members/${accountId}/${suspend ? 'suspend' : 'unsuspend'}`, { method: 'POST' })
      load()
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  return (
    <div>
      <h2>Members & Roles</h2>
      <Button type="primary" onClick={() => setInviteOpen(true)} style={{ marginBottom: 16 }}>
        + Invite Member
      </Button>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={members}
        columns={[
          { title: 'Email', dataIndex: ['account', 'email'] },
          {
            title: 'Status',
            dataIndex: ['account', 'status'],
            render: (status: string) => (
              <Tag color={status === 'ACTIVE' ? 'green' : status === 'SUSPENDED' ? 'orange' : 'red'}>{status}</Tag>
            ),
          },
          {
            title: 'Roles',
            render: (_, m: MemberRow) => (
              <Space wrap>
                {m.roles.map((r) => (
                  <Tag key={r.role.id} closable onClose={() => handleRevokeRole(m.id, r.role.id)}>
                    {r.role.name}
                  </Tag>
                ))}
                <Select
                  size="small"
                  style={{ width: 140 }}
                  placeholder="+ Grant role"
                  value={undefined}
                  onChange={(roleId: string) => handleGrantRole(m.id, roleId)}
                  options={roles.map((r) => ({ value: r.id, label: r.name }))}
                />
              </Space>
            ),
          },
          {
            title: 'Actions',
            render: (_, m: MemberRow) => (
              <Popconfirm
                title={m.account.status === 'SUSPENDED' ? 'Unsuspend this member?' : 'Suspend this member?'}
                onConfirm={() => handleSuspend(m.accountId, m.account.status !== 'SUSPENDED')}
              >
                <Button size="small" danger={m.account.status !== 'SUSPENDED'}>
                  {m.account.status === 'SUSPENDED' ? 'Unsuspend' : 'Suspend'}
                </Button>
              </Popconfirm>
            ),
          },
        ]}
      />

      <Modal title="Invite Member" open={inviteOpen} onOk={handleInvite} onCancel={() => setInviteOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="colleague@example.com" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

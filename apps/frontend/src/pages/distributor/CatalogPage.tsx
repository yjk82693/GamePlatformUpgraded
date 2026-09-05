import { useEffect, useState } from 'react'
import { Select, Table, Button, Modal, Form, Input, InputNumber, Space, Tag, message } from 'antd'
import { apiFetch } from '../../lib/api'

interface App {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  priceCents: number | null
  priceCoins: number | null
  enabled: boolean
}

export default function CatalogPage() {
  const [apps, setApps] = useState<App[]>([])
  const [selectedApp, setSelectedApp] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadApps()
  }, [])

  useEffect(() => {
    if (selectedApp) loadProducts(selectedApp)
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

  async function loadProducts(appId: string) {
    setLoading(true)
    try {
      const data = await apiFetch(`/distributor/catalog/products/app/${appId}`)
      setProducts(data)
    } catch (err) {
      message.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    form.setFieldsValue({
      name: p.name,
      priceCents: p.priceCents != null ? p.priceCents / 100 : undefined,
      priceCoins: p.priceCoins,
    })
    setModalOpen(true)
  }

  async function handleSubmit() {
    const values = await form.validateFields()
    const payload = {
      name: values.name,
      priceCents: values.priceCents != null ? Math.round(values.priceCents * 100) : undefined,
      priceCoins: values.priceCoins,
    }
    try {
      if (editing) {
        await apiFetch(`/distributor/catalog/products/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
        message.success('Product updated')
      } else {
        await apiFetch('/distributor/catalog/products', {
          method: 'POST',
          body: JSON.stringify({ appId: selectedApp, ...payload }),
        })
        message.success('Product created')
      }
      setModalOpen(false)
      if (selectedApp) loadProducts(selectedApp)
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function toggleEnabled(p: Product) {
    try {
      await apiFetch(`/distributor/catalog/products/${p.id}/${p.enabled ? 'disable' : 'enable'}`, {
        method: 'POST',
      })
      if (selectedApp) loadProducts(selectedApp)
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleDelete(p: Product) {
    try {
      await apiFetch(`/distributor/catalog/products/${p.id}`, { method: 'DELETE' })
      message.success('Product deleted')
      if (selectedApp) loadProducts(selectedApp)
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  return (
    <div>
      <h2>Catalog</h2>

      <Space style={{ marginBottom: 16 }}>
        <Select
          style={{ width: 260 }}
          value={selectedApp}
          onChange={setSelectedApp}
          options={apps.map((a) => ({ value: a.id, label: a.name }))}
          placeholder="Select a game"
        />
        <Button type="primary" onClick={openCreate} disabled={!selectedApp}>
          + New Product
        </Button>
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={products}
        columns={[
          { title: 'Name', dataIndex: 'name' },
          {
            title: 'Cash Price',
            dataIndex: 'priceCents',
            render: (v: number | null) => (v != null ? `$${(v / 100).toFixed(2)}` : '—'),
          },
          {
            title: 'Coin Price',
            dataIndex: 'priceCoins',
            render: (v: number | null) => (v != null ? `${v} coins` : '—'),
          },
          {
            title: 'Status',
            dataIndex: 'enabled',
            render: (enabled: boolean) => <Tag color={enabled ? 'green' : 'default'}>{enabled ? 'Enabled' : 'Disabled'}</Tag>,
          },
          {
            title: 'Actions',
            render: (_, p: Product) => (
              <Space>
                <Button size="small" onClick={() => openEdit(p)}>Edit</Button>
                <Button size="small" onClick={() => toggleEnabled(p)}>
                  {p.enabled ? 'Disable' : 'Enable'}
                </Button>
                <Button size="small" danger onClick={() => handleDelete(p)}>Delete</Button>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editing ? 'Edit Product' : 'New Product'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="priceCents" label="Cash Price ($)">
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="priceCoins" label="Coin Price">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Table, Button, Modal, Form, Input, Space, Tag, message, Tabs } from 'antd'
import { apiFetch } from '../../lib/api'

interface Merchant { id: string; name: string; paymentMethods: { id: string; type: string }[] }
interface Transaction { id: string; accountId: string; productId: string; state: string; occurredAt: string }

export default function PaymentsPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [merchantModalOpen, setMerchantModalOpen] = useState(false)
  const [methodModalOpen, setMethodModalOpen] = useState(false)
  const [methodMerchantId, setMethodMerchantId] = useState<string | null>(null)
  const [merchantForm] = Form.useForm()
  const [methodForm] = Form.useForm()
  const [period, setPeriod] = useState('')
  const [payoutAmount, setPayoutAmount] = useState('')

  useEffect(() => {
    loadMerchants()
    loadTransactions()
  }, [])

  async function loadMerchants() {
    try {
      setMerchants(await apiFetch('/distributor/payments/merchants'))
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function loadTransactions() {
    try {
      setTransactions(await apiFetch('/distributor/payments/transactions'))
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleCreateMerchant() {
    const values = await merchantForm.validateFields()
    try {
      await apiFetch('/distributor/payments/merchants', {
        method: 'POST',
        body: JSON.stringify({ name: values.name }),
      })
      message.success('Merchant created')
      setMerchantModalOpen(false)
      merchantForm.resetFields()
      loadMerchants()
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleAddMethod() {
    const values = await methodForm.validateFields()
    try {
      await apiFetch(`/distributor/payments/merchants/${methodMerchantId}/methods`, {
        method: 'POST',
        body: JSON.stringify({ type: values.type }),
      })
      message.success('Payment method added')
      setMethodModalOpen(false)
      methodForm.resetFields()
      loadMerchants()
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleRefund(id: string) {
    try {
      await apiFetch(`/distributor/payments/transactions/${id}/refund`, { method: 'POST' })
      message.success('Refund requested')
      loadTransactions()
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleApproveRefund(id: string) {
    try {
      await apiFetch(`/distributor/payments/transactions/${id}/approve-refund`, { method: 'POST' })
      message.success('Refund approved')
      loadTransactions()
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleViewSettlement() {
    try {
      const data = await apiFetch(`/distributor/payments/settlements/${period}`)
      message.info(data ? `Settlement found for ${period}` : `No settlement for ${period}`)
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleReconcile() {
    try {
      const data = await apiFetch(`/distributor/payments/reconcile/${period}`)
      message.info(`${data.transactionCount} transactions in this period`)
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handlePayout() {
    try {
      await apiFetch('/distributor/payments/payouts', {
        method: 'POST',
        body: JSON.stringify({ period, amount: payoutAmount }),
      })
      message.success('Payout recorded')
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  return (
    <div>
      <h2>Payments</h2>
      <Tabs
        items={[
          {
            key: 'transactions',
            label: 'Transactions & Refunds',
            children: (
              <Table
                rowKey="id"
                dataSource={transactions}
                columns={[
                  { title: 'Receipt', dataIndex: 'id', render: (id: string) => id.slice(0, 8) },
                  { title: 'Account', dataIndex: 'accountId', render: (id: string) => id.slice(0, 8) },
                  {
                    title: 'State',
                    dataIndex: 'state',
                    render: (s: string) => (
                      <Tag color={s === 'PAID' ? 'green' : s === 'REFUND_PENDING' ? 'orange' : 'red'}>{s}</Tag>
                    ),
                  },
                  {
                    title: 'Actions',
                    render: (_, t: Transaction) => (
                      <Space>
                        {t.state === 'PAID' && (
                          <Button size="small" onClick={() => handleRefund(t.id)}>Request Refund</Button>
                        )}
                        {t.state === 'REFUND_PENDING' && (
                          <Button size="small" onClick={() => handleApproveRefund(t.id)}>Approve Refund</Button>
                        )}
                      </Space>
                    ),
                  },
                ]}
              />
            ),
          },
          {
            key: 'merchants',
            label: 'Merchants',
            children: (
              <div>
                <Button onClick={() => setMerchantModalOpen(true)} style={{ marginBottom: 12 }}>
                  + New Merchant
                </Button>
                <Table
                  rowKey="id"
                  dataSource={merchants}
                  columns={[
                    { title: 'Name', dataIndex: 'name' },
                    {
                      title: 'Payment Methods',
                      render: (_, m: Merchant) => (
                        <Space wrap>
                          {m.paymentMethods.map((pm) => <Tag key={pm.id}>{pm.type}</Tag>)}
                        </Space>
                      ),
                    },
                    {
                      title: 'Actions',
                      render: (_, m: Merchant) => (
                        <Button
                          size="small"
                          onClick={() => {
                            setMethodMerchantId(m.id)
                            setMethodModalOpen(true)
                          }}
                        >
                          + Add Method
                        </Button>
                      ),
                    },
                  ]}
                />
              </div>
            ),
          },
          {
            key: 'settlement',
            label: 'Settlement',
            children: (
              <Space direction="vertical">
                <Input placeholder="Period (e.g. 2026-08)" value={period} onChange={(e) => setPeriod(e.target.value)} style={{ width: 220 }} />
                <Space>
                  <Button onClick={handleViewSettlement}>View Settlement</Button>
                  <Button onClick={handleReconcile}>Reconcile</Button>
                </Space>
                <Input placeholder="Payout amount (cents)" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} style={{ width: 220 }} />
                <Button onClick={handlePayout}>Record Payout</Button>
              </Space>
            ),
          },
        ]}
      />

      <Modal title="New Merchant" open={merchantModalOpen} onOk={handleCreateMerchant} onCancel={() => setMerchantModalOpen(false)}>
        <Form form={merchantForm} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Add Payment Method" open={methodModalOpen} onOk={handleAddMethod} onCancel={() => setMethodModalOpen(false)}>
        <Form form={methodForm} layout="vertical">
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Input placeholder="credit_card / paypal / etc." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

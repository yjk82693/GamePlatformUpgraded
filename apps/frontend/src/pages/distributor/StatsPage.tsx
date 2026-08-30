import { useEffect, useState } from 'react'
import { Button, Modal, Form, Input, Select, Card, Row, Col, message, Empty } from 'antd'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { apiFetch } from '../../lib/api'

interface Widget {
  id: string
  type: string
  mode: 'DEFAULT' | 'EXPLORE'
  xAxis: string
  yAxis: string
  position: number
}

interface ChartPoint {
  period: string
  value: number
}

export default function StatsPage() {
  const [dashboardId, setDashboardId] = useState<string | null>(null)
  const [widgets, setWidgets] = useState<Widget[]>([])
  const [chartData, setChartData] = useState<Record<string, ChartPoint[]>>({})
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    init()
  }, [])

  async function init() {
    try {
      const dashboard = await apiFetch('/distributor/stats/dashboard?ownerScope=default')
      setDashboardId(dashboard.id)
      await loadWidgets(dashboard.id)
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function loadWidgets(id: string) {
    try {
      const list: Widget[] = await apiFetch(`/distributor/stats/dashboards/${id}/widgets`)
      setWidgets(list)
      for (const w of list) loadWidgetData(w)
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function loadWidgetData(widget: Widget) {
    try {
      const result = await apiFetch('/distributor/stats/metric', {
        method: 'POST',
        body: JSON.stringify({ metric: widget.type }),
      })
      const points: ChartPoint[] = (result.values ?? []).map((m: any) => ({
        period: m.value?.period ?? m.key,
        value: m.value?.value ?? 0,
      }))
      setChartData((prev) => ({ ...prev, [widget.id]: points }))
    } catch (err) {
      // leave chart empty on failure, don't block the rest of the page
    }
  }

  async function handleCreate() {
    const values = await form.validateFields()
    try {
      await apiFetch(`/distributor/stats/dashboards/${dashboardId}/widgets`, {
        method: 'POST',
        body: JSON.stringify({
          mode: values.mode,
          type: values.type,
          xAxis: values.xAxis,
          yAxis: values.yAxis,
          query: { metric: values.type },
        }),
      })
      message.success('Widget added')
      setModalOpen(false)
      form.resetFields()
      if (dashboardId) loadWidgets(dashboardId)
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleRemove(id: string) {
    try {
      await apiFetch(`/distributor/stats/widgets/${id}`, { method: 'DELETE' })
      if (dashboardId) loadWidgets(dashboardId)
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleAnalyze() {
    try {
      const result = await apiFetch(`/distributor/stats/dashboards/${dashboardId}/analyze`)
      message.info(`Dashboard has ${result.widgetCount} widget(s). Narrative: ${result.narrative ?? 'not yet available (Phase 2)'}`)
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  return (
    <div>
      <h2>Statistics</h2>
      <div style={{ marginBottom: 16 }}>
        <Button onClick={() => setModalOpen(true)} style={{ marginRight: 8 }}>+ Add Widget</Button>
        <Button onClick={handleAnalyze}>Analyze Dashboard</Button>
      </div>

      {widgets.length === 0 && <Empty description="No widgets yet" />}

      <Row gutter={[16, 16]}>
        {widgets.map((w) => {
          const data = chartData[w.id] ?? []
          return (
            <Col span={12} key={w.id}>
              <Card
                title={w.type}
                extra={<Button size="small" danger onClick={() => handleRemove(w.id)}>Remove</Button>}
              >
                {data.length === 0 ? (
                  <Empty description="No data for this metric yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    {w.mode === 'EXPLORE' ? (
                      <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="period" stroke="#888" />
                        <YAxis stroke="#888" />
                        <Tooltip contentStyle={{ background: '#1f1f1f', border: 'none' }} />
                        <Bar dataKey="value" fill="#6C5CE7" />
                      </BarChart>
                    ) : (
                      <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="period" stroke="#888" />
                        <YAxis stroke="#888" />
                        <Tooltip contentStyle={{ background: '#1f1f1f', border: 'none' }} />
                        <Line type="monotone" dataKey="value" stroke="#6C5CE7" strokeWidth={2} />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                )}
              </Card>
            </Col>
          )
        })}
      </Row>

      <Modal title="Add Widget" open={modalOpen} onOk={handleCreate} onCancel={() => setModalOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="mode" label="Mode" rules={[{ required: true }]} initialValue="DEFAULT">
            <Select options={[{ value: 'DEFAULT', label: 'Default (line, time-trend)' }, { value: 'EXPLORE', label: 'Explore (bar, comparison)' }]} />
          </Form.Item>
          <Form.Item name="type" label="Metric Name" rules={[{ required: true }]}>
            <Select options={[
              { value: 'Revenue', label: 'Revenue' },
              { value: 'Daily Active Users', label: 'Daily Active Users' },
              { value: 'Purchases', label: 'Purchases' },
            ]} placeholder="Pick an existing metric" />
          </Form.Item>
          <Form.Item name="xAxis" label="X Axis Label" rules={[{ required: true }]} initialValue="Period">
            <Input />
          </Form.Item>
          <Form.Item name="yAxis" label="Y Axis Label" rules={[{ required: true }]} initialValue="Value">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

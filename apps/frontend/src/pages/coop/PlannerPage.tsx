import { useEffect, useState } from 'react'
import { Calendar, Badge, Button, Modal, Form, Input, Select, Tag, message, Card, List, Empty, Segmented } from 'antd'
import type { CalendarProps } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import { apiFetch } from '../../lib/api'

interface Event {
  id: string
  scope: 'COMPANY' | 'PERSONAL'
  title: string
  start: string
  end: string
}

export default function PlannerPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [reminders, setReminders] = useState<{ dueTasks: any[]; upcomingEvents: any[] } | null>(null)
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [viewMode, setViewMode] = useState<'Month' | 'Week'>('Month')
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadEvents()
    loadReminders()
  }, [])

  async function loadEvents() {
    try {
      const start = dayjs().subtract(30, 'day').toISOString()
      const end = dayjs().add(60, 'day').toISOString()
      setEvents(await apiFetch(`/coop/planner/events?start=${start}&end=${end}`))
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function loadReminders() {
    try {
      setReminders(await apiFetch('/coop/planner/reminders'))
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  function eventsOnDay(date: Dayjs) {
    return events.filter((e) => !date.isBefore(dayjs(e.start), 'day') && !date.isAfter(dayjs(e.end), 'day'))
  }

  function openCreateForDay(date: Dayjs) {
    form.setFieldsValue({
      start: date.hour(9).minute(0).second(0).toISOString(),
      end: date.hour(10).minute(0).second(0).toISOString(),
    })
    setModalOpen(true)
  }

  async function handleCreate() {
    const values = await form.validateFields()
    try {
      await apiFetch('/coop/planner/events', {
        method: 'POST',
        body: JSON.stringify({
          scope: values.scope,
          title: values.title,
          start: values.start,
          end: values.end,
        }),
      })
      message.success('Event created')
      setModalOpen(false)
      form.resetFields()
      loadEvents()
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiFetch(`/coop/planner/events/${id}`, { method: 'DELETE' })
      loadEvents()
    } catch (err) {
      message.error((err as Error).message)
    }
  }

  // ── Month view ──
  const dateCellRender = (date: Dayjs) => {
    const dayEvents = eventsOnDay(date)
    if (dayEvents.length === 0) return null
    return (
      <div style={{ maxHeight: 52, overflowY: 'auto' }}>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {dayEvents.slice(0, 2).map((e) => (
            <li key={e.id} style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <Badge status={e.scope === 'COMPANY' ? 'processing' : 'success'} text={e.title} />
            </li>
          ))}
          {dayEvents.length > 2 && <li style={{ fontSize: 11, color: '#888' }}>+{dayEvents.length - 2} more</li>}
        </ul>
      </div>
    )
  }

  const cellRender: CalendarProps<Dayjs>['cellRender'] = (current, info) => {
    if (info.type === 'date') return dateCellRender(current)
    return info.originNode
  }

  function handleMonthSelect(date: Dayjs, info: { source: string }) {
    setSelectedDate(date)
    if (info.source === 'date') openCreateForDay(date)
  }

  // ── Week view ──
  const weekStart = selectedDate.startOf('week')
  const weekDays = Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'))

  const selectedDayEvents = eventsOnDay(selectedDate)

  return (
    <div>
      <h2>Planner & Calendar</h2>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
        <Segmented options={['Month', 'Week']} value={viewMode} onChange={(v) => setViewMode(v as 'Month' | 'Week')} />
        {viewMode === 'Week' && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button size="small" icon={<LeftOutlined />} onClick={() => setSelectedDate(selectedDate.subtract(7, 'day'))} />
            <span>{weekStart.format('MMM D')} – {weekStart.add(6, 'day').format('MMM D, YYYY')}</span>
            <Button size="small" icon={<RightOutlined />} onClick={() => setSelectedDate(selectedDate.add(7, 'day'))} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, background: '#141414', borderRadius: 8, padding: 8, height: 'calc(100vh - 300px)', overflow: 'hidden' }}>
          {viewMode === 'Month' ? (
            <Calendar value={selectedDate} onSelect={handleMonthSelect} cellRender={cellRender} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, height: '100%' }}>
              {weekDays.map((d) => {
                const dayEvents = eventsOnDay(d)
                const isToday = d.isSame(dayjs(), 'day')
                return (
                  <div
                    key={d.toString()}
                    onClick={() => openCreateForDay(d)}
                    style={{
                      border: `1px solid ${isToday ? '#6C5CE7' : '#2a2a2a'}`,
                      borderRadius: 6,
                      padding: 8,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, color: isToday ? '#8C7BFF' : undefined }}>
                      {d.format('ddd D')}
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {dayEvents.map((e) => (
                        <div key={e.id} style={{ fontSize: 11, background: '#1f1a33', borderRadius: 4, padding: '3px 6px' }}>
                          {e.title}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card
            title={selectedDate.format('MMM D, YYYY')}
            extra={<Button size="small" onClick={() => openCreateForDay(selectedDate)}>+ Add</Button>}
          >
            {selectedDayEvents.length === 0 ? (
              <Empty description="No events" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              selectedDayEvents.map((e) => (
                <div key={e.id} style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{e.title}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>
                      {dayjs(e.start).format('h:mm A')} – {dayjs(e.end).format('h:mm A')} <Tag style={{ marginLeft: 4 }}>{e.scope}</Tag>
                    </div>
                  </div>
                  <Button size="small" danger onClick={() => handleDelete(e.id)}>×</Button>
                </div>
              ))
            )}
          </Card>

          {reminders && (
            <Card title="Reminders">
              <p style={{ fontWeight: 600, marginBottom: 4 }}>Due Tasks</p>
              <List size="small" dataSource={reminders.dueTasks} renderItem={(t: any) => <List.Item>{t.title}</List.Item>} locale={{ emptyText: 'None' }} />
              <p style={{ fontWeight: 600, marginTop: 12, marginBottom: 4 }}>Upcoming Events</p>
              <List size="small" dataSource={reminders.upcomingEvents} renderItem={(e: any) => <List.Item>{e.title}</List.Item>} locale={{ emptyText: 'None' }} />
            </Card>
          )}
        </div>
      </div>

      <Modal title="New Event" open={modalOpen} onOk={handleCreate} onCancel={() => setModalOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item name="scope" label="Scope" rules={[{ required: true }]} initialValue="COMPANY">
            <Select options={[{ value: 'COMPANY', label: 'Company' }, { value: 'PERSONAL', label: 'Personal' }]} />
          </Form.Item>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="start" label="Start (ISO)" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="end" label="End (ISO)" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

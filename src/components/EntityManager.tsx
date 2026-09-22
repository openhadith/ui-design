'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Alert, Button, Drawer, Empty, Form, Input, InputNumber, Popconfirm, Select, Space,
  Switch, Table, Tag, Tooltip, Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, UndoOutlined,
} from '@ant-design/icons';
import { useStudio } from './StudioContext';
import { useToast } from './useToast';
import { ENTITIES, type EntityType, type FieldDef } from '@/lib/entities';
import { c, toAr } from '@/lib/tokens';

const { Text } = Typography;

interface Row {
  id: string;
  origin: 'corpus' | 'local';
  edited: boolean;
  data: Record<string, unknown>;
  updated_at?: string;
  updated_by_name?: string | null;
}

/**
 * The CRUD screen, shared by every entity type.
 *
 * It is generic on purpose: seven record types with bespoke screens would drift
 * apart, and the field definitions in `entities.ts` already describe everything
 * a table and a form need. Adding a field there adds a column and an input here
 * with no further work.
 *
 * Every write lands in the studio database. Nothing here can alter the
 * published corpus — edits to a corpus record are stored as an override layered
 * on top when the record is read back, which the banner states plainly.
 */
export default function EntityManager({ type }: { type: EntityType }) {
  const def = ENTITIES[type];
  const { can } = useStudio();
  const toast = useToast();
  const [form] = Form.useForm();

  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ created: 0, edited: 0, deleted: 0 });
  const [page, setPage] = useState(1);
  // Seeded from ?q= so other screens can deep-link to a record here.
  const params = useSearchParams();
  const [term, setTerm] = useState(params.get('q') ?? '');
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  /** Shows the bin — tombstoned records — instead of the working set. */
  const [binOpen, setBinOpen] = useState(false);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    const sp = new URLSearchParams({ page: String(page), limit: '25' });
    if (term.trim()) sp.set('q', term.trim());
    if (binOpen) sp.set('deleted', '1');

    fetch(`/api/entities/${type}?${sp}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((j) => {
        if (!alive || !j.success) return;
        setRows(j.data.rows);
        setTotal(j.data.total);
        setSummary(j.data.summary);
        setLoading(false);
      })
      .catch(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
      controller.abort();
    };
  }, [type, page, term, reloadKey, binOpen]);

  const openEdit = (row: Row) => {
    setCreating(false);
    setEditing(row);
    form.setFieldsValue(row.data);
  };

  const openCreate = () => {
    setEditing(null);
    setCreating(true);
    form.resetFields();
  };

  const close = () => {
    setEditing(null);
    setCreating(false);
    form.resetFields();
  };

  const save = async (values: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = creating
        ? await fetch(`/api/entities/${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: values }),
          })
        : await fetch(`/api/entities/${type}/${encodeURIComponent(editing!.id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: { ...editing!.data, ...values } }),
          });

      const j = await res.json();
      if (!j.success) {
        toast(j.error ?? 'پاشەکەوتکردن سەرکەوتوو نەبوو', 'error');
        return;
      }
      toast(creating ? 'زیادکرا' : 'پاشەکەوت کرا');
      close();
      reload();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: Row) => {
    const res = await fetch(`/api/entities/${type}/${encodeURIComponent(row.id)}`, {
      method: 'DELETE',
    });
    const j = await res.json();
    if (!j.success) {
      toast(j.error ?? 'سڕینەوە سەرکەوتوو نەبوو', 'error');
      return;
    }
    toast(row.origin === 'local' ? 'سڕدرایەوە' : 'لە لیستەکە شاردرایەوە');
    reload();
  };

  const restore = async (row: Row) => {
    await fetch(`/api/entities/${type}/${encodeURIComponent(row.id)}`, { method: 'PATCH' });
    toast('گەڕێندرایەوە');
    reload();
  };

  const columns: ColumnsType<Row> = [
    ...def.fields
      .filter((f) => f.column)
      .map((f) => ({
        title: f.label,
        dataIndex: ['data', f.name],
        key: f.name,
        width: f.width,
        ellipsis: true,
        render: (value: unknown) => renderCell(f, value),
      })),
    {
      title: 'دۆخ',
      key: 'origin',
      width: 110,
      render: (_: unknown, row: Row) =>
        row.origin === 'local' ? (
          <Tag color="success">نوێ</Tag>
        ) : row.edited ? (
          <Tooltip title={`دەستکاریکراو${row.updated_by_name ? ` لەلایەن ${row.updated_by_name}` : ''}`}>
            <Tag color="warning">دەستکاریکراو</Tag>
          </Tooltip>
        ) : (
          <Text style={{ fontSize: 10.5, color: c.inkPale }}>ڕەسەن</Text>
        ),
    },
    {
      title: '',
      key: 'actions',
      width: 104,
      render: (_: unknown, row: Row) =>
        binOpen ? (
          <Tooltip title={can('merge') ? 'گەڕاندنەوە' : 'مۆڵەتت نییە'}>
            <Button
              size="small"
              icon={<UndoOutlined />}
              disabled={!can('merge')}
              onClick={() => restore(row)}
            >
              گەڕاندنەوە
            </Button>
          </Tooltip>
        ) : (
        <Space size={4}>
          <Tooltip title={can('edit') ? 'دەستکاری' : 'مۆڵەتی دەستکاریت نییە'}>
            <Button
              size="small"
              type="text"
              icon={<EditOutlined />}
              disabled={!can('edit')}
              onClick={() => openEdit(row)}
            />
          </Tooltip>
          <Popconfirm
            title={row.origin === 'local' ? 'سڕینەوەی ئەم ڕەکۆردە؟' : 'شاردنەوەی ئەم ڕەکۆردە؟'}
            description={
              row.origin === 'local'
                ? 'ئەم ڕەکۆردە لێرە دروستکراوە و بە تەواوی دەسڕدرێتەوە.'
                : 'لە لیستەکاندا دەشاردرێتەوە. داتای سەرەکی نەگۆڕ دەمێنێتەوە و دەکرێت بگەڕێنرێتەوە.'
            }
            okText="بەڵێ"
            cancelText="نەخێر"
            okButtonProps={{ danger: true }}
            disabled={!can('merge')}
            onConfirm={() => remove(row)}
          >
            <Tooltip title={can('merge') ? 'سڕینەوە' : 'مۆڵەتی سڕینەوەت نییە'}>
              <Button size="small" type="text" danger icon={<DeleteOutlined />} disabled={!can('merge')} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];


  const dirty = summary.created + summary.edited + summary.deleted;

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div
        style={{
          flex: 'none', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12,
          borderBottom: `1px solid ${c.lineStrong}`, flexWrap: 'wrap',
        }}
      >
        <Typography.Title level={4} style={{ margin: 0 }}>{def.labelPlural}</Typography.Title>
        <Text style={{ fontSize: 12, color: c.inkDim }}>{toAr(total)}</Text>

        <Space style={{ marginInlineStart: 'auto' }}>
          <Input.Search
            allowClear
            defaultValue={term}
            placeholder="گەڕان…"
            style={{ width: 260 }}
            onSearch={(v) => { setPage(1); setTerm(v); }}
          />
          <Button icon={<ReloadOutlined />} onClick={reload} />
          <Tooltip title={can('edit') ? undefined : 'مۆڵەتی دەستکاریت نییە'}>
            <Button type="primary" icon={<PlusOutlined />} disabled={!can('edit')} onClick={openCreate}>
              {def.label}ی نوێ
            </Button>
          </Tooltip>
        </Space>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px 20px 30px' }}>
        {binOpen && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 12 }}
            title="ڕەکۆردە شاردراوەکان"
            description={
              <span style={{ fontSize: 11.5 }}>
                ئەمانە لە لیستەکاندا نانێردرێن. داتای سەرەکییان نەگۆڕ ماوە و
                دەکرێن بگەڕێنرێنەوە.
              </span>
            }
            action={
              <Button size="small" onClick={() => { setPage(1); setBinOpen(false); }}>
                گەڕانەوە بۆ لیست
              </Button>
            }
          />
        )}

        {!binOpen && dirty > 0 && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 12 }}
            title={`${toAr(dirty)} گۆڕانکاری لە وۆرک‌ستەیشندا هەڵگیراوە`}
            description={
              <span style={{ fontSize: 11.5 }}>
                {toAr(summary.created)} نوێ · {toAr(summary.edited)} دەستکاریکراو ·{' '}
                {toAr(summary.deleted)} شاردراوە — ئەمانە لێرە هەڵدەگیرێن و هیچ
                کاریگەرییەکیان لەسەر ماڵپەڕی گشتی نییە.
              </span>
            }
            action={
              summary.deleted > 0 ? (
                <Button
                  size="small"
                  icon={<UndoOutlined />}
                  onClick={() => { setPage(1); setBinOpen(true); }}
                >
                  شاردراوەکان ({toAr(summary.deleted)})
                </Button>
              ) : undefined
            }
          />
        )}

        <Table<Row>
          rowKey="id"
          size="small"
          columns={columns}
          dataSource={rows}
          loading={loading}
          locale={{ emptyText: <Empty description="هیچ ڕەکۆردێک نییە" /> }}
          pagination={{
            current: page,
            pageSize: 25,
            total,
            showSizeChanger: false,
            onChange: setPage,
            showTotal: (t, [from, to]) => `${toAr(from)}–${toAr(to)} لە ${toAr(t)}`,
          }}
          onRow={(row) => ({
            onDoubleClick: () => can('edit') && openEdit(row),
          })}
        />
      </div>

      <Drawer
        open={creating || editing !== null}
        onClose={close}
        size={560}
        title={creating ? `${def.label}ی نوێ` : `دەستکاری ${def.label}`}
        extra={
          editing?.origin === 'corpus' ? <Tag color="warning">داتای ڕەسەن</Tag> : null
        }
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={close}>پاشگەزبوونەوە</Button>
            <Button type="primary" loading={saving} onClick={() => form.submit()}>
              پاشەکەوتکردن
            </Button>
          </div>
        }
      >
        {editing?.origin === 'corpus' && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 14 }}
            title="دەستکاری داتای ڕەسەن"
            description={
              <span style={{ fontSize: 11.5, lineHeight: 1.8 }}>
                ئەم ڕەکۆردە لە سەرچاوەی ڕەسەنەوە دێت. گۆڕانکارییەکان وەک چینێکی
                جیاواز لە وۆرک‌ستەیشندا هەڵدەگیرێن — سەرچاوەکە نەگۆڕ دەمێنێتەوە.
              </span>
            }
          />
        )}

        <Form form={form} layout="vertical" onFinish={save} requiredMark="optional">
          {def.fields.map((f) => (
            <Form.Item
              key={f.name}
              name={f.name}
              label={f.label}
              extra={f.help}
              valuePropName={f.kind === 'switch' ? 'checked' : 'value'}
              rules={f.required ? [{ required: true, message: `${f.label} پێویستە` }] : undefined}
            >
              {renderInput(f)}
            </Form.Item>
          ))}
        </Form>
      </Drawer>
    </div>
  );
}

/** Table cell rendering, by field kind. */
function renderCell(f: FieldDef, value: unknown) {
  if (value === null || value === undefined || value === '') {
    return <Text style={{ color: c.inkPale, fontSize: 11 }}>—</Text>;
  }
  if (f.kind === 'switch') {
    return value ? <Tag color="warning">بەڵێ</Tag> : <Text style={{ color: c.inkPale }}>نەخێر</Text>;
  }
  if (f.kind === 'number') {
    return <Text style={{ fontSize: 12 }}>{toAr(String(value))}</Text>;
  }
  if (f.kind === 'arabic') {
    return (
      <span
        dir="rtl"
        style={{ fontFamily: 'var(--font-amiri), serif', fontSize: 14, lineHeight: 1.7 }}
      >
        {String(value)}
      </span>
    );
  }
  return <Text style={{ fontSize: 12 }}>{String(value)}</Text>;
}

/** Form control, by field kind. */
function renderInput(f: FieldDef) {
  switch (f.kind) {
    case 'arabic':
      return (
        <Input.TextArea
          autoSize={{ minRows: 1, maxRows: 8 }}
          dir="rtl"
          style={{ fontFamily: 'var(--font-amiri), serif', fontSize: 15, lineHeight: 1.9 }}
        />
      );
    case 'textarea':
      return <Input.TextArea autoSize={{ minRows: 2, maxRows: 8 }} />;
    case 'number':
      return <InputNumber style={{ width: '100%' }} max={f.max} />;
    case 'select':
      return <Select allowClear options={f.options} />;
    case 'switch':
      return <Switch />;
    default:
      return <Input />;
  }
}

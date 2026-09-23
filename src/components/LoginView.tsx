'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  Alert, App, Avatar, Button, Card, Divider, Form, Input, Tag, Typography,
} from 'antd';
import { avatarOf, c, initials, PERMISSION_LABEL, ROLE_LABEL } from '@/lib/tokens';

const { Title, Text } = Typography;

interface Account {
  id: number; name: string; email: string; role: string; avatar_tone: string; status: string;
}

const ROLE_COLOR: Record<string, string> = {
  supervisor: c.emerald, muhaqqiq: c.blue, editor: c.goldFg,
  reviewer: c.plum, viewer: c.inkFaint,
};

/** What each role can do, so the chooser explains the consequence of picking one. */
const ROLE_SUMMARY: Record<string, string[]> = {
  supervisor: ['view', 'edit', 'approve', 'reject', 'merge', 'admin'],
  muhaqqiq: ['view', 'edit', 'approve', 'reject', 'merge'],
  editor: ['view', 'edit'],
  reviewer: ['view', 'approve', 'reject'],
  viewer: ['view'],
};

export default function LoginView({
  accounts, error,
}: {
  accounts: Account[]; error?: string;
}) {
  const params = useSearchParams();
  const { message } = App.useApp();
  const [busy, setBusy] = useState<string | null>(null);
  const autoRan = useRef(false);

  const signIn = async (email: string) => {
    setBusy(email);
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const j = await res.json();
      if (!j.success) {
        message.error(j.error ?? 'چوونەژوورەوە سەرکەوتوو نەبوو');
        setBusy(null);
        return;
      }
      message.success(`بەخێربێیت، ${j.data.user.name}`);

      // `next` lets a demo link open a specific screen as a specific role.
      // Only same-origin absolute paths are honoured (a leading `//` would be
      // protocol-relative), so the parameter cannot bounce someone off-site.
      const next = params.get('next');
      const dest = next && /^\/(?!\/)/.test(next) ? next : '/';

      // Full reload so every server component re-renders under the new identity.
      window.location.href = dest;
    } catch {
      message.error('هەڵەیەک ڕوویدا');
      setBusy(null);
    }
  };

  /**
   * `?as=<email|handle>` signs straight in.
   *
   * Handy for a demo — one link per role, no clicking through the chooser —
   * and harmless precisely because this login checks nothing anyway. It would
   * be a back door against real authentication; against a mock gate it is just
   * a shortcut through the same front door.
   */
  useEffect(() => {
    const as = params.get('as');
    if (as && !autoRan.current) {
      autoRan.current = true;
      void signIn(as);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 24, background: c.page, overflowY: 'auto',
      }}
    >
      <div style={{ width: '100%', maxWidth: 880, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
          <div
            style={{
              width: 40, height: 40, borderRadius: 10, background: c.emerald, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-amiri), serif', fontWeight: 700, fontSize: 26,
            }}
          >
            ح
          </div>
          <div style={{ lineHeight: 1.25 }}>
            <Title level={4} style={{ margin: 0, color: c.inkStrong }}>
              دەزگای پەسەندکردنی حەدیس
            </Title>
            <Text style={{ fontSize: 13.5, color: c.inkDim }}>
              Muhaqqiq · وۆرک‌ستەیشنی بەڕێوەبردن
            </Text>
          </div>
        </div>

        {error && (
          <Alert
            type="warning"
            showIcon
            title="داتابەیسی نموونە ئامادە نییە"
            description={
              <span style={{ fontSize: 14 }}>
                <code>npm run db:setup</code> جێبەجێ بکە، پاشان ئەم پەڕەیە نوێ بکەرەوە.
              </span>
            }
          />
        )}

        <Alert
          type="info"
          showIcon
          title="چوونەژوورەوەی نموونەیی"
          description={
            <span style={{ fontSize: 14, lineHeight: 1.9 }}>
              وشەی نهێنی پێویست نییە. هەژمارێک هەڵبژێرە یان ئیمەیلێک بنووسە — ڕۆڵەکە
              دیاری دەکات چی دەبینیت و چی دەتوانیت بکەیت، چونکە مۆڵەتەکان بەڕاستی
              لە ماتریکسی ڕۆڵەوە جێبەجێ دەکرێن.
            </span>
          }
          style={{ background: c.goldSoft, borderColor: '#ecdcb3' }}
        />

        <Card styles={{ body: { padding: 18 } }}>
          <Text strong style={{ fontSize: 14.5, color: c.inkMuted }}>
            هەژمارە بەردەستەکان
          </Text>
          <div
            style={{
              marginTop: 12, display: 'grid', gap: 10,
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            }}
          >
            {accounts.map((a) => {
              const tone = avatarOf(a.avatar_tone);
              const perms = ROLE_SUMMARY[a.role] ?? ['view'];
              const disabled = a.status === 'off';
              return (
                <button
                  key={a.id}
                  onClick={() => signIn(a.email)}
                  disabled={busy !== null}
                  style={{
                    textAlign: 'start', cursor: busy ? 'wait' : 'pointer', fontFamily: 'inherit',
                    background: c.raised, borderRadius: 11, padding: '12px 14px',
                    border: `1px solid ${c.lineCard}`,
                    borderInlineStart: `3px solid ${ROLE_COLOR[a.role] ?? c.inkFaint}`,
                    opacity: busy && busy !== a.email ? 0.5 : 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar
                      size={32}
                      style={{ background: tone.bg, color: tone.fg, fontSize: 14, fontWeight: 600 }}
                    >
                      {initials(a.name)}
                    </Avatar>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: c.ink }}>{a.name}</div>
                      <div dir="ltr" style={{ fontSize: 13, color: c.inkGhost, textAlign: 'start' }}>
                        {a.email}
                      </div>
                    </div>
                    <Tag
                      color={ROLE_COLOR[a.role]}
                      style={{ marginInlineEnd: 0, fontSize: 13 }}
                    >
                      {ROLE_LABEL[a.role] ?? a.role}
                    </Tag>
                  </div>

                  <div style={{ marginTop: 9, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {perms.map((p) => (
                      <span
                        key={p}
                        style={{
                          fontSize: 12.5, padding: '1px 6px', borderRadius: 5,
                          background: c.sunken, color: c.inkFaint,
                        }}
                      >
                        {PERMISSION_LABEL[p] ?? p}
                      </span>
                    ))}
                    {disabled && (
                      <span style={{ fontSize: 12.5, color: c.rust }}>· ناچالاک</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <Divider style={{ margin: '18px 0 14px' }}>
            <Text style={{ fontSize: 13, color: c.inkGhost }}>یان</Text>
          </Divider>

          <Form
            layout="inline"
            style={{ justifyContent: 'center', gap: 8 }}
            onFinish={(v: { email: string }) => signIn(v.email)}
          >
            <Form.Item
              name="email"
              rules={[{ required: true, message: 'ئیمەیل بنووسە' }]}
              style={{ flex: 1, maxWidth: 320, marginInlineEnd: 0 }}
            >
              <Input placeholder="ئیمەیل — بۆ نموونە zana@muhaqqiq.org" dir="ltr" />
            </Form.Item>
            <Form.Item style={{ marginInlineEnd: 0 }}>
              <Button type="primary" htmlType="submit" loading={busy !== null}>
                چوونەژوورەوە
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <Text style={{ fontSize: 13, color: c.inkGhost, textAlign: 'center' }}>
          داتای حەدیس ڕاستەقینەیە و لە api.openhadith.org دێت. دۆخی کار و ئەم هەژمارانە
          نموونەیین و هیچ کاریگەرییەکیان لەسەر ماڵپەڕی گشتی نییە.
        </Text>
      </div>
    </div>
  );
}

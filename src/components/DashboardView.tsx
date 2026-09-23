'use client';

import Link from 'next/link';
import { Avatar, Button, Card, Col, Progress, Row, Tag, Timeline, Tooltip, Typography } from 'antd';
import {
  ArrowLeftOutlined, CaretDownOutlined, CaretUpOutlined, CheckSquareOutlined,
  FileAddOutlined, SearchOutlined, StarFilled, TrophyOutlined,
} from '@ant-design/icons';
import type { DashboardData } from '@/lib/dashboard';
import { agoKu, avatarOf, c, initials, toAr, todayLabel } from '@/lib/tokens';

const { Text, Title } = Typography;
const AMIRI = { fontFamily: 'var(--font-amiri), serif' } as const;

/** Shared row styling for the short lists in the rail. */
const ROW: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '7px 12px', borderBottom: `1px solid ${c.lineSoft}`,
};

/**
 * A record id, isolated from the surrounding RTL text.
 *
 * Latin-digit ids inside an RTL paragraph get reordered by the bidi algorithm,
 * so a bare "HDT-1" can render with its digits in the wrong place. Ids are
 * identifiers rather than quantities, so they keep Latin digits and get an
 * explicit isolate instead of being converted to Arabic-Indic.
 */
function RecordId({ id }: { id: string }) {
  return <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>HDT-{id}</span>;
}

const ACTION_LABEL: Record<string, string> = {
  approve: 'پەسەندی کرد', reject: 'ڕەتی کردەوە', edit: 'دەستکاری کرد',
  assign: 'دابەشی کرد', merge: 'یەکیخست', role_change: 'ڕۆڵی گۆڕی',
  login: 'چووە ژوورەوە', publish: 'بڵاویکردەوە',
  create: 'دروستی کرد', delete: 'سڕییەوە', restore: 'گەڕاندییەوە',
  rebalance: 'بارکاری هاوسەنگ کرد', issue_resolved: 'کێشەیەکی چارەسەر کرد',
  permission_change: 'مۆڵەتی گۆڕی',
  isnad_edit: 'زنجیرەی سەنەدی دەستکاری کرد', isnad_reset: 'زنجیرەی گەڕاندەوە بۆ ڕەسەن',
  'status:approved': 'پەسەندی کرد', 'status:rejected': 'ڕەتی کردەوە',
  'status:published': 'بڵاویکردەوە', 'status:duplicate': 'نیشانی کرد وەک دووبارە',
  'status:discuss': 'ناردی بۆ گفتوگۆ', 'status:research': 'ناردی بۆ لێکۆڵینەوە',
  'status:conflict': 'نیشانی کرد وەک ناکۆک', 'status:pending': 'گەڕاندییەوە بۆ ڕیز',
};

export default function DashboardView({ data }: { data: DashboardData }) {
  const { kpis, week, health, resume, pinned, activity, leaders, user, today, trend, recentEdits } = data;
  const healthPct = health.total ? Math.round((health.clean / health.total) * 100) : 0;
  const peak = Math.max(1, ...week.map((w) => w.count));
  const todayPct = Math.min(100, Math.round((today.done / today.target) * 100));

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '16px 20px 32px' }}>
        <Row gutter={[14, 14]}>
          {/* ---------------------------------------------------------- hero */}
          <Col xs={24} xl={17}>
            <div
              style={{
                background: `linear-gradient(135deg, ${c.emerald} 0%, #26604d 100%)`,
                borderRadius: 14, padding: '18px 22px', color: '#fff', height: '100%',
              }}
            >
              <Text style={{ color: 'rgba(255,255,255,.72)', fontSize: 13.5 }}>
                {todayLabel()}
              </Text>
              <Title level={3} style={{ color: '#fff', margin: '4px 0 6px' }}>
                بەخێربێیتەوە، {user.name}
              </Title>
              <Text style={{ color: 'rgba(255,255,255,.85)', fontSize: 14.5 }}>
                {today.done > 0
                  ? <>{toAr(today.done)} لە {toAr(today.target)} ڕەکۆردی ئەمڕۆت تەواوکردووە — {toAr(today.remaining)} ماوە بۆ ئامانج.</>
                  : <>ئەمڕۆ هێشتا دەستت پێنەکردووە — ئامانجی ڕۆژانە {toAr(today.target)} ڕەکۆردە.</>}
              </Text>

              <Progress
                percent={todayPct}
                showInfo={false}
                strokeColor="#fff"
                railColor="rgba(255,255,255,.25)"
                style={{ margin: '10px 0 0' }}
              />

              {/* Resume strip — land straight back in the work. */}
              {resume.length > 0 && (
                <Link href={`/hadith/${resume[0].entity_id}`}>
                  <div
                    style={{
                      marginTop: 14, display: 'flex', alignItems: 'center', gap: 12,
                      background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.18)',
                      borderRadius: 11, padding: '10px 12px',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ color: 'rgba(255,255,255,.75)', fontSize: 13, display: 'block' }}>
                        بگەڕەوە بۆ کارە ناتەواوەکەت
                      </Text>
                      <span
                        style={{
                          ...AMIRI, fontSize: 16, color: '#fff',
                          display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        <RecordId id={resume[0].entity_id} /> · {resume[0].label}
                      </span>
                    </div>
                    <Button size="small" style={{ flex: 'none' }} icon={<ArrowLeftOutlined />}>
                      درێژەدان
                    </Button>
                  </div>
                </Link>
              )}
            </div>
          </Col>

          {/* -------------------------------------------------- quick actions */}
          <Col xs={24} xl={7}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
              <QuickAction href="/queue" icon={<CheckSquareOutlined />} label="کردنەوەی ڕیزی پەسەندکردن" />
              <QuickAction href="/hadiths" icon={<SearchOutlined />} label="گەڕانی پێشکەوتوو" />
              <QuickAction href="/glossary" icon={<FileAddOutlined />} label="دروستکردنی تۆماری نوێ" />
            </div>
          </Col>
        </Row>

        {/* ------------------------------------------------------------ KPIs */}
        <Row gutter={[12, 12]} style={{ marginTop: 14 }}>
          <Kpi
            label="چاوەڕوانی پێداچوونەوە" value={kpis.pending} href="/queue?status=pending" dot={c.gold}
            delta={trend.weekPct === null ? undefined : { dir: trend.weekPct >= 0 ? 'up' : 'down', text: `٪${toAr(Math.abs(trend.weekPct))}`, good: trend.weekPct >= 0 }}
            note="بڕیارەکان بەراورد بە هەفتەی ڕابردوو"
          />
          <Kpi
            label="ئەمڕۆ تەواوکراو" value={today.done} href="/admin/audit" dot={c.emerald}
            delta={{ dir: 'flat', text: `لە ${toAr(today.target)}`, good: true }}
            note="ئامانج = ناوەندی ڕۆژانەی ٧ ڕۆژی ڕابردوو"
          />
          <Kpi
            label="ناکۆکییەکان" value={kpis.conflict} href="/queue?status=conflict" dot={c.rust}
            delta={trend.conflicts7 ? { dir: 'up', text: toAr(trend.conflicts7), good: false } : undefined}
            note="نوێ لە ٧ ڕۆژی ڕابردوودا"
          />
          <Kpi
            label="دووبارەی نوێ" value={kpis.duplicate} href="/queue?status=duplicate" dot={c.blue}
            delta={trend.duplicates7 ? { dir: 'up', text: toAr(trend.duplicates7), good: false } : undefined}
            note="نوێ لە ٧ ڕۆژی ڕابردوودا"
          />
        </Row>

        {/* ----------------------------------------------- week + corpus health */}
        <Row gutter={[14, 14]} style={{ marginTop: 14 }}>
          <Col xs={24} lg={15}>
            <Card
              size="small"
              title="چالاکی ئەم هەفتەیە"
              extra={<Text type="secondary" style={{ fontSize: 13 }}>کۆ: {toAr(week.reduce((s, w) => s + w.count, 0))} بڕیار</Text>}
            >
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 124 }}>
                {week.map((w) => {
                  const day = new Date(w.day);
                  const isPeak = w.count === peak && peak > 0;
                  return (
                    <div key={w.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 12.5, color: isPeak ? c.emerald : c.inkGhost, fontWeight: isPeak ? 700 : 400 }}>
                        {toAr(w.count)}
                      </Text>
                      <Tooltip title={`${w.day} — ${toAr(w.count)} بڕیار`}>
                        <div
                          style={{
                            width: '100%', maxWidth: 34,
                            height: Math.max(w.count ? 3 : 0, Math.round((w.count / peak) * 92)),
                            borderRadius: '5px 5px 2px 2px',
                            background: isPeak ? c.emerald : '#9cc4b3',
                          }}
                        />
                      </Tooltip>
                      <Text style={{ fontSize: 12.5, color: c.inkDim }}>
                        {['ی', 'د', 'س', 'چ', 'پ', 'ه', 'ش'][day.getDay()]}
                      </Text>
                    </div>
                  );
                })}
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={9}>
            <Card size="small" title="باری داتابەیس">
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <Progress
                  type="circle"
                  size={104}
                  percent={healthPct}
                  strokeColor={c.emerald}
                  railColor={c.line}
                  format={(p) => (
                    <div style={{ lineHeight: 1.2 }}>
                      <div style={{ fontSize: 21, fontWeight: 700, color: c.emerald }}>{toAr(p ?? 0)}٪</div>
                      <div style={{ fontSize: 12, color: c.inkGhost }}>بێ کێشە</div>
                    </div>
                  )}
                />
                <div style={{ flex: 1, fontSize: 13.5, lineHeight: 2.1, color: c.inkMuted }}>
                  <Legend color={c.emerald} label="ڕەکۆردی بێ کێشە" value={health.clean} />
                  <Legend color={c.rust} label="کێشەی کراوە" value={health.openIssues} />
                  <Legend color={c.line} label="کۆی ڕەکۆرد" value={health.total} />
                  <Link href="/admin/quality" style={{ fontSize: 13 }}>بینینی هەموو کێشەکان →</Link>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* -------------------------------------------- recent edits + pinned */}
        <Row gutter={[14, 14]} style={{ marginTop: 14 }}>
          <Col xs={24} lg={12}>
            <Card
              size="small"
              title="دواین دەستکارییەکان"
              extra={<Link href="/admin/audit" style={{ fontSize: 13 }}>هەموو</Link>}
              styles={{ body: { padding: 0 } }}
            >
              {recentEdits.length === 0 ? (
                <div style={{ padding: 18, textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 13.5 }}>هێشتا دەستکارییەک نەکراوە</Text>
                </div>
              ) : (
                recentEdits.map((e) => (
                  <div key={e.id} style={ROW}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.gold, flex: 'none' }} />
                    <Text style={{ flex: 1, fontSize: 14 }} ellipsis>
                      <b>{e.actor_name ?? 'سیستەم'}</b>{' '}
                      <Text type="secondary" style={{ fontSize: 14 }}>
                        {ACTION_LABEL[e.action] ?? e.action}
                      </Text>
                    </Text>
                    {e.entity_id && (
                      <Text style={{ fontSize: 13, color: c.inkGhost, flex: 'none' }}>
                        <RecordId id={e.entity_id} />
                      </Text>
                    )}
                    <Text style={{ fontSize: 13, color: c.inkGhost, flex: 'none' }}>{agoKu(e.created_at)}</Text>
                  </div>
                ))
              )}
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card size="small" title="پینکراوەکان" styles={{ body: { padding: 0 } }}>
              {pinned.length === 0 ? (
                <div style={{ padding: 18, textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: 13.5 }}>هیچ ڕەکۆردێکی پینکراو نییە</Text>
                </div>
              ) : (
                pinned.map((p) => (
                  <Link key={p.entity_id} href={`/hadith/${p.entity_id}`} style={{ color: 'inherit' }}>
                    <div style={ROW}>
                      <StarFilled style={{ color: c.gold, fontSize: 14 }} />
                      <span
                        style={{
                          flex: 1, minWidth: 0, ...AMIRI, fontSize: 16,
                          display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {p.label}
                      </span>
                      <Text style={{ fontSize: 13, color: c.inkGhost, flex: 'none' }}>{p.detail}</Text>
                    </div>
                  </Link>
                ))
              )}
            </Card>
          </Col>
        </Row>
      </div>

      {/* ------------------------------------------------------------- rail */}
      <aside
        style={{
          width: 320, flex: 'none', background: c.nav, borderInlineEnd: `1px solid ${c.lineNav}`,
          overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 14,
        }}
      >
        <Card size="small" title="چالاکی تیم">
          <Timeline
            style={{ marginTop: 4 }}
            items={activity.map((a) => {
              const tone = avatarOf(a.avatar_tone);
              return {
                icon: (
                  <Avatar size={22} style={{ background: tone.bg, color: tone.fg, fontSize: 11.5, fontWeight: 600 }}>
                    {initials(a.actor_name)}
                  </Avatar>
                ),
                content: (
                  <div style={{ marginTop: -2 }}>
                    <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
                      <b>{a.actor_name ?? 'سیستەم'}</b>{' '}
                      <Text type="secondary" style={{ fontSize: 13.5 }}>
                        {ACTION_LABEL[a.action] ?? a.action}
                      </Text>
                    </div>
                    <Text style={{ fontSize: 13, color: c.inkGhost }}>
                      {a.entity_id ? <><RecordId id={a.entity_id} />{' · '}</> : null}
                      {agoKu(a.created_at)}
                    </Text>
                  </div>
                ),
              };
            })}
          />
        </Card>

        <Card
          title={<span><TrophyOutlined style={{ color: c.gold }} /> پێشەنگانی هەفتە</span>}
          size="small"
          styles={{ body: { padding: 0 } }}
        >
          {leaders.map((l, i) => {
            const tone = avatarOf(l.avatar_tone);
            return (
              <div key={l.name} style={ROW}>
                <Text strong style={{ width: 14, textAlign: 'center', color: i < 2 ? c.gold : c.inkGhost }}>
                  {toAr(i + 1)}
                </Text>
                <Avatar size={24} style={{ background: tone.bg, color: tone.fg, fontSize: 12.5, fontWeight: 600 }}>
                  {initials(l.name)}
                </Avatar>
                <Text style={{ flex: 1, fontSize: 14 }}>{l.name}</Text>
                <Tag style={{ marginInlineEnd: 0 }}>{toAr(l.count)}</Tag>
              </div>
            );
          })}
        </Card>
      </aside>
    </div>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} style={{ flex: 1 }}>
      <Card size="small" hoverable style={{ height: '100%' }}
        styles={{ body: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', height: '100%' } }}>
        <span style={{ color: c.emerald, fontSize: 16.5 }}>{icon}</span>
        <Text strong style={{ fontSize: 14.5 }}>{label}</Text>
        <span style={{ marginInlineStart: 'auto', color: c.inkPale }}>←</span>
      </Card>
    </Link>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <span style={{ width: 9, height: 9, borderRadius: 3, background: color, flex: 'none' }} />
      <span style={{ flex: 1 }}>{label}</span>
      <b style={{ color: c.ink }}>{toAr(value)}</b>
    </div>
  );
}

function Kpi({
  label, value, href, dot, delta, note,
}: {
  label: string;
  value: number;
  href: string;
  dot: string;
  /** `good` colours the delta; an increase is not always good news. */
  delta?: { dir: 'up' | 'down' | 'flat'; text: string; good: boolean };
  note?: string;
}) {
  return (
    <Col xs={12} lg={6}>
      <Link href={href}>
        <Card size="small" hoverable>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flex: 'none' }} />
            <Text type="secondary" style={{ fontSize: 13 }}>{label}</Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: c.inkStrong, lineHeight: 1 }}>
              {toAr(value)}
            </span>
            {delta && (
              <Tooltip title={note}>
                <span style={{ fontSize: 13, fontWeight: 600, color: delta.good ? c.emerald : c.rust }}>
                  {delta.dir === 'up' && <CaretUpOutlined />}
                  {delta.dir === 'down' && <CaretDownOutlined />}
                  {' '}{delta.text}
                </span>
              </Tooltip>
            )}
          </div>
        </Card>
      </Link>
    </Col>
  );
}

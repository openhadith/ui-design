'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { Avatar, Badge, Button, Dropdown, Layout, Menu, Segmented, Spin, Tag, Tooltip } from 'antd';
import {
  AppstoreOutlined, AuditOutlined, BarChartOutlined, BankOutlined, BookOutlined, CheckSquareOutlined,
  DatabaseOutlined, DeploymentUnitOutlined, DiffOutlined, ExportOutlined, LogoutOutlined,
  ReadOutlined, SafetyOutlined, ScheduleOutlined, SwapOutlined, TagsOutlined, TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useStudio } from './StudioContext';
import CommandPalette from './CommandPalette';
import { SITE_URL } from '@/lib/site';
import { avatarOf, c, initials, ISSUE, ROLE_LABEL, toAr } from '@/lib/tokens';

const { Header, Sider, Content } = Layout;

/** Routes that render without the app chrome. */
const BARE_ROUTES = ['/login'];

interface NavItem {
  key: string;
  icon: ReactNode;
  label: string;
  badge?: 'pending';
  /** Permission required to see this section at all. */
  requires?: string;
}

const WORK_NAV: NavItem[] = [
  { key: '/', icon: <AppstoreOutlined />, label: 'داشبۆرد' },
  { key: '/queue', icon: <CheckSquareOutlined />, label: 'ڕیزی پەسەندکردن', badge: 'pending' },
  { key: '/sanad', icon: <DeploymentUnitOutlined />, label: 'پشکنینی سەنەد' },
  { key: '/compare', icon: <DiffOutlined />, label: 'بەراورد' },
  { key: '/stats', icon: <BarChartOutlined />, label: 'ئامار' },
];

const DATA_NAV: NavItem[] = [
  { key: '/hadiths', icon: <ReadOutlined />, label: 'حەدیس' },
  { key: '/narrators', icon: <UserOutlined />, label: 'ڕاویان' },
  { key: '/books', icon: <BookOutlined />, label: 'پەرتووکەکان' },
  { key: '/authors', icon: <BankOutlined />, label: 'نووسەران' },
  { key: '/chapters', icon: <ScheduleOutlined />, label: 'بابەتەکان' },
  { key: '/glossary', icon: <TagsOutlined />, label: 'فەرهەنگ' },
  { key: '/topics', icon: <TagsOutlined />, label: 'بابەتە گشتییەکان' },
];

const ADMIN_NAV: NavItem[] = [
  { key: '/admin/users', icon: <TeamOutlined />, label: 'بەکارهێنەر و تیم', requires: 'admin' },
  { key: '/admin/assignments', icon: <SwapOutlined />, label: 'دابەشکردن', requires: 'admin' },
  { key: '/admin/audit', icon: <AuditOutlined />, label: 'تۆماری کردار', requires: 'admin' },
  { key: '/admin/quality', icon: <DatabaseOutlined />, label: 'جۆری داتا' },
];

export default function StudioChrome({
  children, pendingCount, collections = [], corpus,
}: {
  children: ReactNode;
  pendingCount?: number;
  /** Open issues by type — the comps' "smart collections". */
  collections?: Array<{ type: string; count: number }>;
  corpus?: { hadiths: number | null; books: number | null; narrators: number | null };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, can, logout } = useStudio();

  const bare = BARE_ROUTES.some((r) => pathname.startsWith(r));

  // Gate: no identity means back to the login screen. Done in an effect rather
  // than in the layout so the redirect survives client-side navigation too.
  useEffect(() => {
    if (!loading && !user && !bare) router.replace('/login');
  }, [loading, user, bare, router]);

  if (bare) return <>{children}</>;

  if (loading || !user) {
    return (
      <div
        style={{
          position: 'fixed', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: c.page,
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  const tone = avatarOf(user.avatar_tone);

  const toItems = (items: NavItem[]) =>
    items
      .filter((i) => !i.requires || can(i.requires))
      .map((i) => ({
        key: i.key,
        icon: i.icon,
        label: (
          <Link href={i.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flex: 1 }}>{i.label}</span>
            {i.badge === 'pending' && pendingCount ? (
              <Badge
                count={toAr(pendingCount)}
                overflowCount={9999}
                style={{ background: c.goldSoft, color: c.goldFg, boxShadow: 'none', fontSize: 10 }}
              />
            ) : null}
          </Link>
        ),
      }));

  // Longest matching prefix, so /studio/hadith/123 highlights حەدیس and
  // /studio alone does not swallow every child route.
  const allKeys = [...WORK_NAV, ...DATA_NAV, ...ADMIN_NAV].map((i) => i.key);
  const selected =
    allKeys
      .filter((k) => (k === '/' ? pathname === k : pathname.startsWith(k)))
      .sort((a, b) => b.length - a.length)[0]
    ?? (pathname.startsWith('/hadith/') ? '/hadiths' : '/');

  return (
    <Layout style={{ position: 'fixed', inset: 0, zIndex: 50, overflow: 'hidden' }}>
      <Header
        style={{
          display: 'flex', alignItems: 'center', gap: 16, flex: 'none',
          borderBottom: `1px solid ${c.lineStrong}`, paddingInline: 16,
        }}
      >
        <Link
          href="/"
          style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'inherit' }}
        >
          <div
            style={{
              width: 26, height: 26, borderRadius: 6, background: c.emerald, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-amiri), serif', fontWeight: 700, fontSize: 17,
            }}
          >
            ح
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span style={{ fontSize: 13.5, fontWeight: 600 }}>دەزگای پەسەندکردنی حەدیس</span>
            <span style={{ fontSize: 10.5, color: c.inkDim }}>Muhaqqiq · وۆرک‌ستەیشن</span>
          </div>
        </Link>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: 0 }}>
          <CommandPalette
            commands={[...WORK_NAV, ...DATA_NAV, ...ADMIN_NAV]
              .filter((i) => !i.requires || can(i.requires))
              .map((i) => ({ key: i.key, label: i.label, icon: i.icon }))}
          />
        </div>

        {/* The comps' language switcher. Shown because it is part of the
            design, but disabled: the dashboard has no translations yet, and a
            control that silently does nothing is worse than an honest one. */}
        <Tooltip title="لە ئێستادا تەنها کوردی بەردەستە">
          <Segmented
            size="small"
            value="ku"
            disabled
            options={[
              { value: 'ku', label: 'کوردی' },
              { value: 'ar', label: 'ع' },
              { value: 'en', label: 'EN' },
            ]}
          />
        </Tooltip>

        <Tooltip title="داتای حەدیس ڕاستەقینەیە؛ دۆخی کار نموونەییە و کاریگەری لەسەر ماڵپەڕی گشتی نییە">
          <Tag color="warning" style={{ marginInlineEnd: 0 }}>نموونە</Tag>
        </Tooltip>

        <Button
          size="small"
          icon={<ExportOutlined />}
          href={SITE_URL}
          target="_blank"
        >
          ماڵپەڕی گشتی
        </Button>

        <Dropdown
          menu={{
            items: [
              {
                key: 'who',
                disabled: true,
                label: (
                  <div style={{ paddingBlock: 4 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: c.ink }}>{user.name}</div>
                    <div dir="ltr" style={{ fontSize: 10.5, color: c.inkGhost, textAlign: 'start' }}>
                      {user.email}
                    </div>
                  </div>
                ),
              },
              { type: 'divider' },
              {
                key: 'role',
                disabled: true,
                icon: <SafetyOutlined />,
                label: (
                  <span style={{ fontSize: 11.5 }}>
                    {ROLE_LABEL[user.role] ?? user.role}
                  </span>
                ),
              },
              { type: 'divider' },
              {
                key: 'logout',
                icon: <LogoutOutlined />,
                label: 'دەرچوون',
                onClick: logout,
              },
            ],
          }}
          trigger={['click']}
        >
          <button
            style={{
              display: 'flex', alignItems: 'center', gap: 8, height: 36, padding: '0 6px',
              background: 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <div style={{ textAlign: 'start', lineHeight: 1.2 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: c.ink }}>{user.name}</div>
              <div style={{ fontSize: 10, color: c.inkDim }}>
                {ROLE_LABEL[user.role] ?? user.role}
              </div>
            </div>
            <Avatar
              size={30}
              style={{ background: tone.bg, color: tone.fg, fontSize: 11, fontWeight: 600 }}
            >
              {initials(user.name)}
            </Avatar>
          </button>
        </Dropdown>
      </Header>

      <Layout style={{ minHeight: 0 }}>
        <Sider
          width={248}
          style={{
            borderInlineStart: `1px solid ${c.lineNav}`,
            overflowY: 'auto',
            paddingBlock: 8,
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[selected]}
            style={{ border: 'none', background: 'transparent' }}
            items={[
              { key: 'g-work', type: 'group', label: <GroupLabel>کار</GroupLabel>, children: toItems(WORK_NAV) },
              { key: 'g-data', type: 'group', label: <GroupLabel>داتا</GroupLabel>, children: toItems(DATA_NAV) },
              ...(ADMIN_NAV.some((i) => !i.requires || can(i.requires))
                ? [{
                    key: 'g-admin',
                    type: 'group' as const,
                    label: <GroupLabel>بەڕێوەبردن</GroupLabel>,
                    children: toItems(ADMIN_NAV),
                  }]
                : []),
            ]}
          />

          {/* Smart collections: the open issues, as one-click entries into the
              queue. Counts are live, so an empty category simply disappears. */}
          {collections.length > 0 && (
            <div style={{ padding: '4px 8px 12px' }}>
              <div style={{ padding: '8px 12px 6px' }}>
                <GroupLabel>کۆکراوە زیرەکەکان</GroupLabel>
              </div>
              {collections.map((col) => {
                const token = ISSUE[col.type];
                if (!token) return null;
                return (
                  <Link
                    key={col.type}
                    href={`/queue?issue=${col.type}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9, padding: '6px 12px',
                      borderRadius: 8, color: c.inkMuted, fontSize: 11.5,
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: token.dot, flex: 'none' }} />
                    <span style={{ flex: 1 }}>{token.label}</span>
                    <span style={{ fontSize: 10.5, color: c.inkGhost }}>{toAr(col.count)}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </Sider>

        <Content style={{ display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {children}
          </div>

          {/* Status bar — corpus scale and session facts, as in the comps. */}
          <footer
            style={{
              flex: 'none', height: 26, display: 'flex', alignItems: 'center', gap: 14,
              paddingInline: 16, background: c.emeraldDeep, color: 'rgba(255,255,255,.75)',
              fontSize: 10.5,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6fce9f' }} />
              هەموو شت پاشەکەوتکراوە
            </span>
            {corpus?.hadiths != null && (
              <span>
                {toAr(corpus.hadiths.toLocaleString('en'))} حەدیس ·{' '}
                {toAr((corpus.books ?? 0).toLocaleString('en'))} پەرتووک ·{' '}
                {toAr((corpus.narrators ?? 0).toLocaleString('en'))} ڕاوی
              </span>
            )}
            <span style={{ marginInlineStart: 'auto' }}>کوردی (سۆرانی) · RTL</span>
          </footer>
        </Content>
      </Layout>
    </Layout>
  );
}

function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <span style={{ fontSize: 10.5, fontWeight: 700, color: c.inkGhost, letterSpacing: '.3px' }}>
      {children}
    </span>
  );
}

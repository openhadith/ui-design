import type { Metadata } from 'next';
import { Amiri, IBM_Plex_Sans_Arabic, Outfit } from 'next/font/google';
import './globals.css';
import { StudioProvider } from '@/components/StudioContext';
import AntdProvider from '@/components/AntdProvider';
import StudioChrome from '@/components/StudioChrome';
import { query } from '@/lib/db';

/**
 * Three families, each doing one job:
 *
 * - Outfit carries Latin text and numerals. It has no Arabic script, so it is
 *   first in the stack and the browser falls back per glyph.
 * - IBM Plex Sans Arabic renders the Kurdish chrome, and covers the extended
 *   glyphs Sorani needs.
 * - Amiri sets Arabic matn and narrator names, where a serif reads better at
 *   the sizes the comps use.
 */
const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-outfit',
  display: 'swap',
});

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-plex-arabic',
  display: 'swap',
  fallback: ['Noto Sans Arabic', 'system-ui', 'sans-serif'],
});

const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-amiri',
  display: 'swap',
  fallback: ['Scheherazade New', 'Times New Roman', 'serif'],
});

export const metadata: Metadata = {
  title: 'دەزگای پەسەندکردنی حەدیس',
  description: 'وۆرک‌ستەیشنی پەسەندکردن و بەڕێوەبردنی کۆرپەسی حەدیس',
  robots: { index: false, follow: false },
};

// Workflow state changes on every action; nothing here may be cached.
export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The chrome owns three things: the queue badge, the smart collections in the
  // sidebar, and the corpus totals in the status bar.
  let pendingCount = 0;
  let collections: Array<{ type: string; count: number }> = [];
  try {
    const [pending, issues] = await Promise.all([
      query<{ count: string }>(
        `SELECT count(*)::text AS count FROM studio_review WHERE status = 'pending'`,
      ),
      query<{ type: string; count: string }>(
        `SELECT type, count(*)::text AS count FROM studio_issues
          WHERE resolved_at IS NULL GROUP BY type ORDER BY count(*) DESC`,
      ),
    ]);
    pendingCount = Number(pending[0]?.count ?? 0);
    collections = issues.map((i) => ({ type: i.type, count: Number(i.count) }));
  } catch {
    // A missing database shouldn't blank the app — the setup notice on the
    // dashboard explains what to run.
  }

  const corpus = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stats`, { next: { revalidate: 300 } })
    .then((r) => r.json())
    .then((b) => b?.data as { hadiths?: number; books?: number; narrators?: number } | undefined)
    .catch(() => undefined);

  return (
    <html
      lang="ckb"
      dir="rtl"
      className={`${outfit.variable} ${plexArabic.variable} ${amiri.variable}`}
    >
      <body>
        <AntdProvider>
          <StudioProvider>
            <StudioChrome
              pendingCount={pendingCount}
              collections={collections}
              corpus={{
                hadiths: corpus?.hadiths ?? null,
                books: corpus?.books ?? null,
                narrators: corpus?.narrators ?? null,
              }}
            >
              {children}
            </StudioChrome>
          </StudioProvider>
        </AntdProvider>
      </body>
    </html>
  );
}

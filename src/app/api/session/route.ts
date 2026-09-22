import { cookies } from 'next/headers';
import {
  listUsers, readSessionOrNull, sessionForEmail, sessionForUser, SESSION_COOKIE,
} from '@/lib/session';

/** Current identity (or null), plus the demo accounts the login screen offers. */
export async function GET() {
  const session = await readSessionOrNull();
  const users = await listUsers();
  return Response.json({
    success: true,
    data: {
      user: session?.user ?? null,
      permissions: session?.permissions ?? [],
      users,
    },
  });
}

/**
 * Mock sign-in. Body: { email } or { userId }.
 *
 * No password is checked — this is a demo gate, not authentication. It exists
 * so a reviewer can enter as any role and watch the permission matrix change
 * what the UI offers.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const session = body.email
    ? await sessionForEmail(String(body.email))
    : await sessionForUser(Number(body.userId));

  if (!session) {
    return Response.json(
      { success: false, error: 'ئەم ئیمەیلە لە سیستەمدا نییە' },
      { status: 404 },
    );
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE, String(session.user.id), {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    sameSite: 'lax',
  });

  return Response.json({ success: true, data: session });
}

/** Sign out. */
export async function DELETE() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  return Response.json({ success: true });
}

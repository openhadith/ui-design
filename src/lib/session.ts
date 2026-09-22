import { cookies } from 'next/headers';
import { query, queryOne } from './db';

/**
 * Demo identity.
 *
 * There is no password check here and that is on purpose: this MVP exists to
 * show the workflow, not to defend it. "Who am I" is a cookie holding a
 * studio_users id, switchable from the top bar, so a demo can move between a
 * supervisor and a viewer in one click and watch the affordances change.
 *
 * Permissions ARE resolved properly, from the same editable role x permission
 * matrix the Admin screen writes to — so the matrix demonstrably drives the UI.
 * When this graduates past demo, the only piece that changes is where the
 * identity comes from: swap readSession() for a verified JWT and every
 * `can()` call keeps working.
 */

export const SESSION_COOKIE = 'studio_user';

export interface StudioUser {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar_tone: string;
  status: string;
}

export interface StudioSession {
  user: StudioUser;
  /** Permission keys granted to this user's role: view, edit, approve, ... */
  permissions: string[];
}

/** Everyone available in the role switcher. */
export async function listUsers(): Promise<StudioUser[]> {
  return query<StudioUser>(
    `SELECT id, name, email, role, avatar_tone, status
     FROM studio_users ORDER BY id`,
  );
}

/** Resolves the permission set for a role from the editable matrix. */
async function permissionsFor(role: string): Promise<string[]> {
  const rows = await query<{ permission: string }>(
    `SELECT permission FROM studio_permissions WHERE role = $1 AND allowed`,
    [role],
  );
  return rows.map((r) => r.permission);
}

/** Looks a user up by id. Returns null when there is no such user. */
export async function sessionForUser(id: number | null): Promise<StudioSession | null> {
  if (id === null || !Number.isFinite(id)) return null;
  const user = await queryOne<StudioUser>(
    `SELECT id, name, email, role, avatar_tone, status FROM studio_users WHERE id = $1`,
    [id],
  );
  if (!user) return null;
  return { user, permissions: await permissionsFor(user.role) };
}

/**
 * Looks a user up by email — the mock login's only check.
 *
 * There is no password. Matching is case-insensitive and tolerates a bare
 * local part ("zana" finds zana@muhaqqiq.org) so a demo does not stall on
 * typing an exact address.
 */
export async function sessionForEmail(email: string): Promise<StudioSession | null> {
  const needle = email.trim().toLowerCase();
  if (!needle) return null;

  const user = await queryOne<StudioUser>(
    `SELECT id, name, email, role, avatar_tone, status FROM studio_users
      WHERE lower(email) = $1 OR lower(split_part(email, '@', 1)) = $1
      LIMIT 1`,
    [needle],
  );
  if (!user) return null;
  return { user, permissions: await permissionsFor(user.role) };
}

/** The signed-in session, or null when nobody is signed in. */
export async function readSessionOrNull(): Promise<StudioSession | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  return sessionForUser(raw ? Number(raw) : null);
}

/**
 * The signed-in session, for code paths that cannot proceed without one.
 *
 * Route handlers use this and let the throw surface as a 500 only if the UI
 * has already failed to gate — pages redirect to /studio/login instead.
 */
export async function readSession(): Promise<StudioSession> {
  const session = await readSessionOrNull();
  if (!session) throw new Error('studio: not signed in');
  return session;
}

/** Guard for mutating endpoints. Returns null when allowed, a Response when not. */
export function requirePermission(session: StudioSession, permission: string) {
  if (session.permissions.includes(permission)) return null;
  return Response.json(
    {
      success: false,
      error: `ڕۆڵی «${session.user.role}» مۆڵەتی «${permission}»ی نییە`,
      permission,
      role: session.user.role,
    },
    { status: 403 },
  );
}

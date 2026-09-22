import { audit, query } from '@/lib/db';
import { readSession, requirePermission } from '@/lib/session';

/** The full role x permission matrix. */
export async function GET() {
  const rows = await query<{ role: string; permission: string; allowed: boolean }>(
    `SELECT role, permission, allowed FROM studio_permissions ORDER BY role, permission`,
  );
  return Response.json({ success: true, data: rows });
}

/**
 * Toggles one cell of the matrix.
 *
 * This is the hinge of the whole demo: the matrix is not decoration, it is the
 * table `readSession()` resolves permissions from. Flipping a cell here changes
 * what that role can do on the very next request — buttons enable, endpoints
 * stop returning 403.
 *
 * Body: { role, permission, allowed }
 */
export async function PATCH(request: Request) {
  const session = await readSession();
  const denied = requirePermission(session, 'admin');
  if (denied) return denied;

  const { role, permission, allowed } = await request.json();

  // Guard against locking everyone out: at least one role must retain `admin`.
  if (permission === 'admin' && allowed === false) {
    const remaining = await query<{ count: string }>(
      `SELECT count(*)::text AS count FROM studio_permissions
        WHERE permission = 'admin' AND allowed AND role <> $1`,
      [role],
    );
    if (Number(remaining[0]?.count ?? 0) === 0) {
      return Response.json(
        { success: false, error: 'ناتوانرێت دوایین ڕۆڵی بەڕێوەبەر لاببردرێت' },
        { status: 400 },
      );
    }
  }

  await query(
    `INSERT INTO studio_permissions (role, permission, allowed) VALUES ($1,$2,$3)
     ON CONFLICT (role, permission) DO UPDATE SET allowed = EXCLUDED.allowed`,
    [role, permission, !!allowed],
  );

  await audit({
    actorId: session.user.id,
    action: 'permission_change',
    entityType: 'role',
    entityId: role,
    before: { [permission]: !allowed },
    after: { [permission]: !!allowed },
  });

  return Response.json({ success: true });
}

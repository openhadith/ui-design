import { audit, query } from '@/lib/db';
import { readSession, requirePermission } from '@/lib/session';

/** Users, teams, memberships and team-book scopes — everything Admin Users paints. */
export async function GET() {
  const [users, teams, members, books] = await Promise.all([
    query(
      `SELECT u.id, u.name, u.email, u.role, u.avatar_tone, u.status, u.last_seen,
              (SELECT count(*)::int FROM studio_review r WHERE r.assignee_id = u.id) AS workload
         FROM studio_users u ORDER BY u.id`,
    ),
    query(
      `SELECT t.id, t.name, t.color, t.scope, t.lead_id, u.name AS lead_name,
              (SELECT count(*)::int FROM studio_review r WHERE r.team_id = t.id) AS total,
              (SELECT count(*)::int FROM studio_review r
                WHERE r.team_id = t.id AND r.status IN ('approved','published')) AS done
         FROM studio_teams t LEFT JOIN studio_users u ON u.id = t.lead_id
        ORDER BY t.id`,
    ),
    query(
      `SELECT tm.team_id, tm.user_id, tm.role, u.name, u.avatar_tone
         FROM studio_team_members tm JOIN studio_users u ON u.id = tm.user_id
        ORDER BY tm.team_id, u.id`,
    ),
    query(`SELECT team_id, book_id, book_title FROM studio_team_books ORDER BY team_id`),
  ]);

  return Response.json({ success: true, data: { users, teams, members, books } });
}

/** Changes a user's role. Body: { userId, role } */
export async function PATCH(request: Request) {
  const session = await readSession();
  const denied = requirePermission(session, 'admin');
  if (denied) return denied;

  const { userId, role } = await request.json();

  const before = await query<{ role: string }>(
    `SELECT role FROM studio_users WHERE id = $1`,
    [userId],
  );
  await query(`UPDATE studio_users SET role = $1 WHERE id = $2`, [role, userId]);

  await audit({
    actorId: session.user.id,
    action: 'role_change',
    entityType: 'user',
    entityId: String(userId),
    before: { role: before[0]?.role ?? null },
    after: { role },
  });

  return Response.json({ success: true });
}

import { audit, query, queryOne } from '@/lib/db';
import { readSession, requirePermission } from '@/lib/session';

/** Workflow state and draft history for one corpus record. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const review = await queryOne(
    `SELECT r.*, u.name AS assignee_name FROM studio_review r
       LEFT JOIN studio_users u ON u.id = r.assignee_id
      WHERE r.entity_type = 'hadith' AND r.entity_id = $1`,
    [id],
  );
  const revisions = await query(
    `SELECT rv.id, rv.payload, rv.note, rv.created_at, u.name AS author_name
       FROM studio_revisions rv LEFT JOIN studio_users u ON u.id = rv.author_id
      WHERE rv.entity_type = 'hadith' AND rv.entity_id = $1
      ORDER BY rv.created_at DESC LIMIT 20`,
    [id],
  );
  return Response.json({ success: true, data: { review, revisions } });
}

/**
 * Saves a draft edit.
 *
 * Drafts are recorded as revisions and never written back to the corpus — the
 * studio proposes, the publish step (not in this MVP) would dispose. That keeps
 * the 1.1M-row production data untouchable from here by construction.
 *
 * Body: { payload: object, note?: string, status?: string }
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await readSession();

  const denied = requirePermission(session, 'edit');
  if (denied) return denied;

  const { payload, note, status } = await request.json();

  await query(
    `INSERT INTO studio_revisions (entity_type, entity_id, author_id, payload, note)
     VALUES ('hadith', $1, $2, $3, $4)`,
    [id, session.user.id, JSON.stringify(payload ?? {}), note ?? null],
  );

  if (status) {
    const perm = status === 'approved' || status === 'published' ? 'approve'
      : status === 'rejected' ? 'reject'
      : status === 'duplicate' ? 'merge'
      : 'edit';
    const blocked = requirePermission(session, perm);
    if (blocked) return blocked;

    await query(
      `UPDATE studio_review SET status = $1, updated_at = now()
        WHERE entity_type = 'hadith' AND entity_id = $2`,
      [status, id],
    );
  }

  // Keeps the dashboard's "pick up where you left off" strip honest.
  await query(
    `INSERT INTO studio_activity (user_id, entity_type, entity_id, label, detail)
     VALUES ($1, 'hadith', $2, $3, $4)`,
    [session.user.id, id, String(payload?.matn ?? '').slice(0, 70), payload?.bookTitle ?? null],
  );

  await audit({
    actorId: session.user.id,
    action: status ? `status:${status}` : 'edit',
    entityType: 'hadith',
    entityId: id,
    before: null,
    after: { ...payload, status },
    reason: note ?? null,
  });

  return Response.json({ success: true });
}

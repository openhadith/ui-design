import { query, audit } from '@/lib/db';
import { readSession, requirePermission } from '@/lib/session';

/** Which permission each transition needs. Mirrors the role x permission matrix. */
const PERMISSION_FOR: Record<string, string> = {
  approved: 'approve',
  published: 'approve',
  rejected: 'reject',
  duplicate: 'merge',
  pending: 'edit',
  discuss: 'edit',
  research: 'edit',
  conflict: 'edit',
};

/**
 * Moves one or many records to a new status, or reassigns them.
 *
 * Bulk is the default shape rather than an add-on: the queue's selection bar
 * acts on a set, and issuing N requests for N rows would make the audit trail
 * unorderable and the UI slow.
 *
 * Body: { ids: number[], status?: string, assigneeId?: number, reason?: string }
 */
export async function POST(request: Request) {
  const session = await readSession();
  const body = await request.json();

  // Callers that hold review-row ids (the queue) pass `ids`; callers that only
  // know a corpus id (compare, workstation deep links) pass `entityIds`.
  let ids: number[] = (body.ids ?? []).map(Number).filter(Number.isFinite);

  if (!ids.length && Array.isArray(body.entityIds) && body.entityIds.length) {
    const resolved = await query<{ id: number }>(
      `SELECT id FROM studio_review
        WHERE entity_type = 'hadith' AND entity_id = ANY($1::text[])`,
      [body.entityIds.map(String)],
    );
    ids = resolved.map((r) => r.id);
  }

  if (!ids.length) {
    return Response.json({ success: false, error: 'هیچ ڕەکۆردێک هەڵنەبژێردراوە' }, { status: 400 });
  }

  const { status, assigneeId, reason } = body;

  const needed = status ? (PERMISSION_FOR[status] ?? 'edit') : 'edit';
  const denied = requirePermission(session, needed);
  if (denied) return denied;

  // Read the "before" state first so the audit rows record an actual diff
  // rather than just the new value.
  const before = await query<{
    id: number; entity_id: string; status: string; assignee_id: number | null;
  }>(
    `SELECT id, entity_id, status, assignee_id FROM studio_review WHERE id = ANY($1::int[])`,
    [ids],
  );

  const sets: string[] = ['updated_at = now()'];
  const args: unknown[] = [];
  if (status) {
    args.push(status);
    sets.push(`status = $${args.length}`);
  }
  if (assigneeId !== undefined) {
    args.push(assigneeId === null ? null : Number(assigneeId));
    sets.push(`assignee_id = $${args.length}`);
  }

  args.push(ids);
  const updated = await query(
    `UPDATE studio_review SET ${sets.join(', ')}
      WHERE id = ANY($${args.length}::int[])
      RETURNING id, entity_id, status, assignee_id`,
    args,
  );

  const action = status ? `status:${status}` : 'assign';
  for (const row of before) {
    await audit({
      actorId: session.user.id,
      action,
      entityType: 'hadith',
      entityId: row.entity_id,
      before: { status: row.status, assignee: row.assignee_id },
      after: {
        status: status ?? row.status,
        assignee: assigneeId !== undefined ? assigneeId : row.assignee_id,
      },
      reason: reason ?? null,
    });
  }

  return Response.json({ success: true, data: { updated, count: updated.length } });
}

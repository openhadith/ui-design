import { audit, query, queryOne } from './db';
import { ENTITIES, fromCorpus, type EntityType } from './entities';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.openhadith.org/api';

export interface EntityRow {
  id: string;
  origin: 'corpus' | 'local';
  /** True when a corpus record has studio edits layered on top. */
  edited: boolean;
  data: Record<string, unknown>;
  updated_at?: string;
  updated_by_name?: string | null;
}

interface StoredRow {
  entity_id: string;
  origin: 'corpus' | 'local';
  payload: Record<string, unknown>;
  deleted_at: string | null;
  updated_at: string;
  updated_by_name: string | null;
}

async function storedFor(type: EntityType): Promise<Map<string, StoredRow>> {
  const rows = await query<StoredRow>(
    `SELECT e.entity_id, e.origin, e.payload, e.deleted_at, e.updated_at,
            u.name AS updated_by_name
       FROM studio_entities e
       LEFT JOIN studio_users u ON u.id = e.updated_by
      WHERE e.entity_type = $1`,
    [type],
  );
  return new Map(rows.map((r) => [r.entity_id, r]));
}

/**
 * Lists a type, merging corpus records with studio edits.
 *
 * Order of assembly matters: locally created records come first (they are the
 * newest work and would otherwise be buried on page 40), then the corpus page
 * with overrides applied and tombstoned rows dropped.
 */
export async function listEntities(
  type: EntityType,
  opts: { page?: number; limit?: number; q?: string; deletedOnly?: boolean } = {},
): Promise<{ rows: EntityRow[]; total: number; corpusTotal: number }> {
  const def = ENTITIES[type];
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.min(100, opts.limit ?? 25);
  const q = opts.q?.trim();

  const stored = await storedFor(type);

  // The bin: tombstoned corpus records, so a mistaken delete is recoverable.
  // Listed on its own rather than mixed into the main view, because a hidden
  // record is not part of the working set.
  if (opts.deletedOnly) {
    const gone = [...stored.values()]
      .filter((r) => r.deleted_at)
      .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
      .map((r) => ({
        id: r.entity_id,
        origin: r.origin,
        edited: true,
        data: r.payload,
        updated_at: r.updated_at,
        updated_by_name: r.updated_by_name,
      }));
    return { rows: gone, total: gone.length, corpusTotal: 0 };
  }

  // Locally created, newest first.
  const locals: EntityRow[] = [...stored.values()]
    .filter((r) => r.origin === 'local' && !r.deleted_at)
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
    .map((r) => ({
      id: r.entity_id,
      origin: 'local' as const,
      edited: false,
      data: r.payload,
      updated_at: r.updated_at,
      updated_by_name: r.updated_by_name,
    }))
    .filter((r) =>
      !q || String(r.data[def.titleField] ?? '').toLowerCase().includes(q.toLowerCase()),
    );

  // Types with no corpus counterpart are entirely local.
  if (!def.corpusList) {
    const start = (page - 1) * limit;
    return {
      rows: locals.slice(start, start + limit),
      total: locals.length,
      corpusTotal: 0,
    };
  }

  // Corpus page. Locals occupy the first slots, so the corpus offset shifts
  // by however many locals precede this page.
  const localCount = locals.length;
  const offset = Math.max(0, (page - 1) * limit - localCount);
  const need = limit - Math.max(0, Math.min(limit, localCount - (page - 1) * limit));

  let corpusRows: Array<Record<string, unknown>> = [];
  let corpusTotal = 0;

  if (need > 0) {
    try {
      const url = q
        ? `${API}/search?q=${encodeURIComponent(q)}&limit=${need}&page=${Math.floor(offset / limit) + 1}`
        : `${API}/${def.corpusList}?page=${Math.floor(offset / need) + 1}&limit=${need}`;
      const res = await fetch(url, { next: { revalidate: 30 } });
      const body = await res.json();
      corpusRows = body?.data?.[def.corpusList] ?? [];
      corpusTotal = body?.data?.pagination?.totalCount ?? corpusRows.length;
    } catch {
      // The corpus being unreachable must not hide local work.
      corpusRows = [];
    }
  }

  const merged: EntityRow[] = corpusRows
    .map((row): EntityRow | null => {
      const id = String(row.id);
      const override = stored.get(id);
      if (override?.deleted_at) return null;
      return {
        id,
        origin: 'corpus',
        edited: !!override,
        data: { ...fromCorpus(type, row), ...(override?.payload ?? {}) },
        updated_at: override?.updated_at,
        updated_by_name: override?.updated_by_name ?? null,
      };
    })
    .filter((r): r is EntityRow => r !== null);

  const localSlice = locals.slice((page - 1) * limit, page * limit);

  return {
    rows: [...localSlice, ...merged].slice(0, limit),
    total: corpusTotal + localCount,
    corpusTotal,
  };
}

/** One record, corpus merged with any studio edit. */
export async function getEntity(type: EntityType, id: string): Promise<EntityRow | null> {
  const def = ENTITIES[type];
  const stored = await queryOne<StoredRow>(
    `SELECT e.entity_id, e.origin, e.payload, e.deleted_at, e.updated_at,
            u.name AS updated_by_name
       FROM studio_entities e
       LEFT JOIN studio_users u ON u.id = e.updated_by
      WHERE e.entity_type = $1 AND e.entity_id = $2`,
    [type, id],
  );

  if (stored?.deleted_at) return null;
  if (stored?.origin === 'local') {
    return {
      id, origin: 'local', edited: false, data: stored.payload,
      updated_at: stored.updated_at, updated_by_name: stored.updated_by_name,
    };
  }

  if (!def.corpusList) return null;

  // Only hadiths and narrators have a single-record endpoint; books come from
  // the list, which is enough for the fields we edit.
  const path = type === 'hadith' ? `/hadiths/${id}`
    : type === 'narrator' ? `/narrators/${id}`
    : type === 'book' ? `/books/${id}`
    : null;
  if (!path) return null;

  try {
    const res = await fetch(`${API}${path}`, { next: { revalidate: 30 } });
    if (!res.ok) return null;
    const body = await res.json();
    const raw = (body?.data?.narrator ?? body?.data) as Record<string, unknown>;
    if (!raw) return null;
    return {
      id,
      origin: 'corpus',
      edited: !!stored,
      data: { ...fromCorpus(type, raw), ...(stored?.payload ?? {}) },
      updated_at: stored?.updated_at,
      updated_by_name: stored?.updated_by_name ?? null,
    };
  } catch {
    return stored
      ? { id, origin: 'corpus', edited: true, data: stored.payload, updated_at: stored.updated_at }
      : null;
  }
}

/** Creates a studio-local record and returns its `local:<n>` id. */
export async function createEntity(
  type: EntityType,
  data: Record<string, unknown>,
  actorId: number,
): Promise<string> {
  const seq = await queryOne<{ n: string }>(`SELECT nextval('studio_local_id_seq')::text AS n`);
  const id = `local:${seq?.n ?? Date.now()}`;

  await query(
    `INSERT INTO studio_entities (entity_type, entity_id, origin, payload, created_by, updated_by)
     VALUES ($1, $2, 'local', $3, $4, $4)`,
    [type, id, JSON.stringify(data), actorId],
  );

  await audit({
    actorId, action: 'create', entityType: type, entityId: id,
    before: null, after: data,
  });

  return id;
}

/**
 * Saves an edit.
 *
 * For a corpus record this writes an override row rather than changing
 * anything upstream — the corpus stays read-only by construction.
 */
export async function updateEntity(
  type: EntityType,
  id: string,
  data: Record<string, unknown>,
  actorId: number,
  reason?: string | null,
): Promise<void> {
  const before = await queryOne<{ payload: Record<string, unknown> }>(
    `SELECT payload FROM studio_entities WHERE entity_type = $1 AND entity_id = $2`,
    [type, id],
  );

  const origin = id.startsWith('local:') ? 'local' : 'corpus';

  await query(
    `INSERT INTO studio_entities (entity_type, entity_id, origin, payload, created_by, updated_by)
     VALUES ($1, $2, $3, $4, $5, $5)
     ON CONFLICT (entity_type, entity_id)
     DO UPDATE SET payload = EXCLUDED.payload, updated_by = EXCLUDED.updated_by,
                   updated_at = now(), deleted_at = NULL`,
    [type, id, origin, JSON.stringify(data), actorId],
  );

  await audit({
    actorId, action: 'edit', entityType: type, entityId: id,
    before: before?.payload ?? null, after: data, reason: reason ?? null,
  });
}

/**
 * Removes a record.
 *
 * A locally created record is deleted outright; a corpus record gets a
 * tombstone, because there is nothing to delete upstream and the row must
 * reappear if the tombstone is ever lifted.
 */
export async function deleteEntity(
  type: EntityType,
  id: string,
  actorId: number,
  reason?: string | null,
): Promise<void> {
  const before = await queryOne<{ payload: Record<string, unknown>; origin: string }>(
    `SELECT payload, origin FROM studio_entities WHERE entity_type = $1 AND entity_id = $2`,
    [type, id],
  );

  if (id.startsWith('local:')) {
    await query(`DELETE FROM studio_entities WHERE entity_type = $1 AND entity_id = $2`, [type, id]);
  } else {
    await query(
      `INSERT INTO studio_entities (entity_type, entity_id, origin, payload, deleted_at, created_by, updated_by)
       VALUES ($1, $2, 'corpus', '{}'::jsonb, now(), $3, $3)
       ON CONFLICT (entity_type, entity_id)
       DO UPDATE SET deleted_at = now(), updated_by = EXCLUDED.updated_by, updated_at = now()`,
      [type, id, actorId],
    );
  }

  await audit({
    actorId, action: 'delete', entityType: type, entityId: id,
    before: before?.payload ?? { id }, after: null, reason: reason ?? null,
  });
}

/** Lifts a tombstone, restoring a corpus record to listings. */
export async function restoreEntity(type: EntityType, id: string, actorId: number): Promise<void> {
  await query(
    `UPDATE studio_entities SET deleted_at = NULL, updated_by = $3, updated_at = now()
      WHERE entity_type = $1 AND entity_id = $2`,
    [type, id, actorId],
  );
  await audit({
    actorId, action: 'restore', entityType: type, entityId: id,
    before: { deleted: true }, after: { deleted: false },
  });
}

/** Counts of local additions, edits and tombstones — shown as a banner per type. */
export async function changeSummary(type: EntityType) {
  const rows = await query<{ created: string; edited: string; deleted: string }>(
    `SELECT
       count(*) FILTER (WHERE origin = 'local' AND deleted_at IS NULL)::text AS created,
       count(*) FILTER (WHERE origin = 'corpus' AND deleted_at IS NULL)::text AS edited,
       count(*) FILTER (WHERE deleted_at IS NOT NULL)::text AS deleted
     FROM studio_entities WHERE entity_type = $1`,
    [type],
  );
  return {
    created: Number(rows[0]?.created ?? 0),
    edited: Number(rows[0]?.edited ?? 0),
    deleted: Number(rows[0]?.deleted ?? 0),
  };
}

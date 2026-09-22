import { queryOne } from './db';
import { orderChain, type ChainLink } from './corpus';

/**
 * Isnad overrides.
 *
 * An edited chain is stored whole, in order, as one `studio_entities` row of
 * type 'isnad' keyed by the hadith id. Storing the ordered list rather than a
 * set of per-link patches keeps the rule simple: if an override exists it *is*
 * the chain; otherwise the corpus chain is used. Like every other studio edit,
 * the corpus itself is never touched.
 *
 * Order is collector-first, the same order `orderChain` returns for corpus
 * data, so both sources feed the same rendering code.
 */

export interface EditableLink extends ChainLink {
  /** Marked by a reviewer as a doubtful connection (e.g. a mudallis's ʿanʿana). */
  flagged?: boolean;
  note?: string | null;
}

export interface LoadedChain {
  links: EditableLink[];
  /** True when the studio holds an edited chain for this hadith. */
  edited: boolean;
  editedBy: string | null;
  editedAt: string | null;
}

export async function loadChain(hadithId: string, corpusLinks: ChainLink[]): Promise<LoadedChain> {
  const stored = await queryOne<{
    payload: { links?: EditableLink[] };
    updated_at: string;
    updated_by_name: string | null;
  }>(
    `SELECT e.payload, e.updated_at, u.name AS updated_by_name
       FROM studio_entities e
       LEFT JOIN studio_users u ON u.id = e.updated_by
      WHERE e.entity_type = 'isnad' AND e.entity_id = $1 AND e.deleted_at IS NULL`,
    [hadithId],
  ).catch(() => null);

  if (stored?.payload?.links) {
    return {
      links: stored.payload.links,
      edited: true,
      editedBy: stored.updated_by_name,
      editedAt: stored.updated_at,
    };
  }

  return { links: orderChain(corpusLinks), edited: false, editedBy: null, editedAt: null };
}

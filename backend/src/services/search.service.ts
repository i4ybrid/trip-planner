import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** Search result returned to the frontend */
export interface SearchResult {
  type: 'trip' | 'activity' | 'expense';
  id: string;
  /** For trips: name; activities: title; expenses: title */
  title: string;
  /** Trip description / activity description / expense description */
  description: string | null;
  /** For activities and expenses — the owning trip ID */
  tripId: string;
  /** For activities and expenses — the owning trip name */
  tripTitle: string | null;
  /** ts_rank_cd rank score */
  relevance: number;
  /** Deep-link to the item in the frontend */
  url: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  total: number;
  /** Time spent searching in ms */
  timingMs: number;
}

/**
 * Convert a user's raw search query into a PostgreSQL tsquery string.
 *
 * Strategy:
 * - Strip extra whitespace
 * - Wrap each word in prefix-match mode (word:*) so "tok" matches "tokyo"
 * - Join words with AND (&) semantics
 *
 * Example: "beach tokyo" → "beach:* & tokyo:*"
 */
function toTsQuery(rawQuery: string): string {
  const words = rawQuery.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';
  return words.map((w) => `${w}:*`).join(' & ');
}

/**
 * Perform full-text search across trips, activities, and expenses for one user.
 *
 * PostgreSQL tsvector / tsquery with prefix matching is used so partial words
 * (e.g. "tok") match full words (e.g. "tokyo").
 *
 * All results are ranked by ts_rank_cd and returned sorted by relevance.
 * Results include a deep-link URL for the frontend.
 */
export async function searchAll(
  userId: string,
  rawQuery: string,
  options: { limit?: number; type?: 'trip' | 'activity' | 'expense' } = {}
): Promise<SearchResponse> {
  const { limit = 20, type } = options;
  const tsQuery = toTsQuery(rawQuery);
  if (!tsQuery) {
    return { query: rawQuery, results: [], total: 0, timingMs: 0 };
  }

  const start = Date.now();

  // Use Prisma's `$queryRaw` with tagged template literals for safe interpolation.
  // tsquery is built from the user's raw query but each word is already escaped
  // by PostgreSQL's parser — no SQL injection risk because we only inject
  // plain strings (word:*) that the tsquery grammar treats as tokens, not arbitrary SQL.

  // ---- Trips search ----
  const tripRows =
    !type || type === 'trip'
      ? await prisma.$queryRaw<{ id: string; name: string; description: string | null; rank: number }[]>`
          SELECT
            t.id,
            t.name,
            t.description,
            ts_rank_cd(t.search_vector, query, 32) AS rank
          FROM trips t,
               websearch_to_tsquery('simple', ${tsQuery}) query
          WHERE t."tripMasterId" = ${userId}
            AND t.search_vector @@ query
          ORDER BY rank DESC
          LIMIT ${limit}
        `
      : [];

  // ---- Activities search (via trip membership) ----
  const activityRows =
    !type || type === 'activity'
      ? await prisma.$queryRaw<{
          id: string;
          tripId: string;
          title: string;
          description: string | null;
          rank: number;
        }[]>`
          SELECT
            a.id,
            a."tripId",
            a.title,
            a.description,
            ts_rank_cd(a.search_vector, query, 32) AS rank
          FROM activities a
          JOIN trips t ON a."tripId" = t.id
          JOIN "TripMember" tm ON tm."tripId" = t.id
          CROSS JOIN websearch_to_tsquery('simple', ${tsQuery}) query
          WHERE tm."userId" = ${userId}
            AND a.search_vector @@ query
          ORDER BY rank DESC
          LIMIT ${limit}
        `
      : [];

  // ---- Expenses (BillSplits) search (via trip membership) ----
  const expenseRows =
    !type || type === 'expense'
      ? await prisma.$queryRaw<{
          id: string;
          tripId: string;
          title: string;
          description: string | null;
          rank: number;
        }[]>`
          SELECT
            bs.id,
            bs."tripId",
            bs.title,
            bs.description,
            ts_rank_cd(bs.search_vector, query, 32) AS rank
          FROM "BillSplit" bs
          JOIN trips t ON bs."tripId" = t.id
          JOIN "TripMember" tm ON tm."tripId" = t.id
          CROSS JOIN websearch_to_tsquery('simple', ${tsQuery}) query
          WHERE tm."userId" = ${userId}
            AND bs.search_vector @@ query
          ORDER BY rank DESC
          LIMIT ${limit}
        `
      : [];

  // Fetch trip names for all results
  const allTripIds = [
    ...new Set([
      ...tripRows.map((r) => r.id),
      ...activityRows.map((r) => r.tripId),
      ...expenseRows.map((r) => r.tripId),
    ]),
  ];
  const tripMap = new Map<string, string>();
  if (allTripIds.length > 0) {
    const trips = await prisma.trip.findMany({
      where: { id: { in: allTripIds } },
      select: { id: true, name: true },
    });
    trips.forEach((t) => tripMap.set(t.id, t.name));
  }

  const results: SearchResult[] = [
    ...tripRows.map((r) => ({
      type: 'trip' as const,
      id: r.id,
      title: r.name,
      description: r.description,
      tripId: r.id,
      tripTitle: tripMap.get(r.id) ?? null,
      relevance: Number(r.rank),
      url: `/trip/${r.id}`,
    })),
    ...activityRows.map((r) => ({
      type: 'activity' as const,
      id: r.id,
      title: r.title,
      description: r.description,
      tripId: r.tripId,
      tripTitle: tripMap.get(r.tripId) ?? null,
      relevance: Number(r.rank),
      url: `/trip/${r.tripId}/activities/${r.id}`,
    })),
    ...expenseRows.map((r) => ({
      type: 'expense' as const,
      id: r.id,
      title: r.title,
      description: r.description,
      tripId: r.tripId,
      tripTitle: tripMap.get(r.tripId) ?? null,
      relevance: Number(r.rank),
      url: `/trip/${r.tripId}/payments`,
    })),
  ].sort((a, b) => b.relevance - a.relevance);

  return {
    query: rawQuery,
    results,
    total: results.length,
    timingMs: Date.now() - start,
  };
}

// ---------------------------------------------------------------------------
// Search vector update helpers — call these from service/route after
// create/update/delete so the search index stays current.
// ---------------------------------------------------------------------------

/** Rebuild the search_vector for a Trip from its name, description, destination */
export async function updateTripSearchVector(tripId: string): Promise<void> {
  await prisma.$executeRaw`
    UPDATE trips
    SET search_vector =
      setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
      setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
      setweight(to_tsvector('simple', coalesce(destination, '')), 'B')
    WHERE id = ${tripId}
  `;
}

/** Rebuild the search_vector for an Activity from its title, description, location */
export async function updateActivitySearchVector(activityId: string): Promise<void> {
  await prisma.$executeRaw`
    UPDATE activities
    SET search_vector =
      setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
      setweight(to_tsvector('simple', coalesce(location, '')), 'B')
    WHERE id = ${activityId}
  `;
}

/** Rebuild the search_vector for a BillSplit from its title and description */
export async function updateExpenseSearchVector(expenseId: string): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "BillSplit"
    SET search_vector =
      setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
      setweight(to_tsvector('simple', coalesce(description, '')), 'B')
    WHERE id = ${expenseId}
  `;
}

/**
 * Seed search vectors for all existing rows.
 * Run this once after adding the search_vector column to backfill existing data.
 */
export async function backfillAllSearchVectors(): Promise<void> {
  await prisma.$executeRaw`SELECT 1`; // ensure connected
  await prisma.$executeRaw`UPDATE trips SET search_vector = setweight(to_tsvector('simple', coalesce(name, '')), 'A') || setweight(to_tsvector('simple', coalesce(description, '')), 'B') || setweight(to_tsvector('simple', coalesce(destination, '')), 'B') WHERE search_vector IS NULL`;
  await prisma.$executeRaw`UPDATE activities SET search_vector = setweight(to_tsvector('simple', coalesce(title, '')), 'A') || setweight(to_tsvector('simple', coalesce(description, '')), 'B') || setweight(to_tsvector('simple', coalesce(location, '')), 'B') WHERE search_vector IS NULL`;
  await prisma.$executeRaw`UPDATE "BillSplit" SET search_vector = setweight(to_tsvector('simple', coalesce(title, '')), 'A') || setweight(to_tsvector('simple', coalesce(description, '')), 'B') WHERE search_vector IS NULL`;
}

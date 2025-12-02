import pool from "./db";
import type { AccountLetterWithDetails, Letter, TrackingEvent } from "./types";
import type { FilterValues } from "./search-params";
import { parseSort } from "./search-params";

interface AccountLetterRow {
  id: number;
  account_id: string;
  letter_id: number;
  address: string | null;
  mailed_at: Date | null;
  eta: Date | null;
  status: "not_sent" | "shipped" | "delivered" | "returned";
  created_at: Date;
  letter_name: string;
  letter_description: string | null;
  letter_category: string | null;
}

interface TrackingEventRow {
  id: number;
  account_letter_id: number;
  status: string;
  location: string | null;
  occurred_at: Date;
}

// Get unique letter names for filter dropdown
export async function getLetterNames(): Promise<string[]> {
  const result = await pool.query<{ name: string }>(
    "SELECT DISTINCT name FROM letters ORDER BY name"
  );
  return result.rows.map((row) => row.name);
}

export async function getAccountLettersWithTracking(
  filters?: FilterValues
): Promise<AccountLetterWithDetails[]> {
  // Build dynamic WHERE clauses
  const conditions: string[] = [];
  const params: (string | string[] | Date)[] = [];
  let paramIndex = 1;

  if (filters?.accountId) {
    conditions.push(`al.account_id ILIKE $${paramIndex}`);
    params.push(`%${filters.accountId}%`);
    paramIndex++;
  }

  if (filters?.status && filters.status.length > 0) {
    conditions.push(`al.status = ANY($${paramIndex})`);
    params.push(filters.status);
    paramIndex++;
  }

  if (filters?.letterType && filters.letterType.length > 0) {
    conditions.push(`l.name = ANY($${paramIndex})`);
    params.push(filters.letterType);
    paramIndex++;
  }

  if (filters?.from) {
    conditions.push(`al.mailed_at >= $${paramIndex}`);
    params.push(filters.from);
    paramIndex++;
  }

  if (filters?.to) {
    conditions.push(`al.mailed_at <= $${paramIndex}`);
    params.push(filters.to);
    paramIndex++;
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Parse sort
  const { column, direction } = parseSort(filters?.sort || "mailed_at.desc");

  // Map column names to SQL columns
  const sortColumnMap: Record<string, string> = {
    mailed_at: "al.mailed_at",
    account_id: "al.account_id",
    letter_name: "l.name",
    status: "al.status",
    eta: "al.eta",
    created_at: "al.created_at",
  };

  const sortColumn = sortColumnMap[column] || "al.mailed_at";
  const sortDirection = direction === "asc" ? "ASC" : "DESC";
  const nullsHandling = direction === "asc" ? "NULLS FIRST" : "NULLS LAST";

  // Fetch all account letters with letter details
  const accountLettersResult = await pool.query<AccountLetterRow>(
    `
    SELECT 
      al.id,
      al.account_id,
      al.letter_id,
      al.address,
      al.mailed_at,
      al.eta,
      al.status,
      al.created_at,
      l.name as letter_name,
      l.description as letter_description,
      l.category as letter_category
    FROM account_letters al
    JOIN letters l ON al.letter_id = l.id
    ${whereClause}
    ORDER BY ${sortColumn} ${sortDirection} ${nullsHandling}
  `,
    params
  );

  const accountLetters = accountLettersResult.rows;

  if (accountLetters.length === 0) {
    return [];
  }

  // Fetch all tracking events for these account letters
  const accountLetterIds = accountLetters.map((al) => al.id);
  const trackingEventsResult = await pool.query<TrackingEventRow>(
    `
    SELECT 
      id,
      account_letter_id,
      status,
      location,
      occurred_at
    FROM tracking_events
    WHERE account_letter_id = ANY($1)
    ORDER BY occurred_at ASC
  `,
    [accountLetterIds]
  );

  // Group tracking events by account_letter_id
  const trackingEventsByAccountLetter = new Map<number, TrackingEvent[]>();
  for (const event of trackingEventsResult.rows) {
    const events =
      trackingEventsByAccountLetter.get(event.account_letter_id) || [];
    events.push(event);
    trackingEventsByAccountLetter.set(event.account_letter_id, events);
  }

  // Combine account letters with their tracking events
  return accountLetters.map((al) => ({
    ...al,
    tracking_events: trackingEventsByAccountLetter.get(al.id) || [],
  }));
}

export async function getLetters(): Promise<Letter[]> {
  const result = await pool.query<Letter>(`
    SELECT 
      id,
      name,
      description,
      category,
      business_unit,
      created_by,
      is_active,
      created_at
    FROM letters
    ORDER BY created_at DESC
  `);

  return result.rows;
}

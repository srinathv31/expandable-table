import pool from "./db";
import type { AccountLetterWithDetails, Letter, TrackingEvent } from "./types";

interface AccountLetterRow {
  id: number;
  account_id: string;
  letter_id: number;
  address: string | null;
  mailed_at: Date | null;
  eta: Date | null;
  status: "not_sent" | "shipped" | "delivered";
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

export async function getAccountLettersWithTracking(): Promise<
  AccountLetterWithDetails[]
> {
  // Fetch all account letters with letter details
  const accountLettersResult = await pool.query<AccountLetterRow>(`
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
    ORDER BY al.created_at DESC
  `);

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

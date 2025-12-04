export type LetterStatus =
  | "not_sent"
  | "shipped"
  | "delivered"
  | "returned"
  | "exception";

export interface Letter {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  business_unit: string | null;
  created_by: string | null;
  control_id: string | null;
  control_day_count: number | null;
  is_active: boolean;
  created_at: Date;
}

export interface AccountLetter {
  id: number;
  account_id: string;
  letter_id: number;
  address: string | null;
  mailed_at: Date | null;
  eta: Date | null;
  status: LetterStatus;
  created_at: Date;
}

export interface TrackingEvent {
  id: number;
  account_letter_id: number;
  status: string;
  location: string | null;
  occurred_at: Date;
}

export interface AccountLetterWithDetails extends AccountLetter {
  letter_name: string;
  letter_description: string | null;
  letter_category: string | null;
  control_id: string | null;
  control_day_count: number | null;
  tracking_events: TrackingEvent[];
}

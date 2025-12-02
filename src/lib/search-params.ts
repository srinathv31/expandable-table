import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsIsoDate,
  parseAsString,
} from "nuqs/server";

// Define the parsers for each filter
export const filterParsers = {
  accountId: parseAsString,
  status: parseAsArrayOf(parseAsString),
  letterType: parseAsArrayOf(parseAsString),
  from: parseAsIsoDate,
  to: parseAsIsoDate,
  sort: parseAsString.withDefault("mailed_at.desc"),
};

// Create a cache for server-side parsing
export const searchParamsCache = createSearchParamsCache(filterParsers);

// Type for the filter values
export type FilterValues = {
  accountId: string | null;
  status: string[] | null;
  letterType: string[] | null;
  from: Date | null;
  to: Date | null;
  sort: string;
};

// Helper to parse sort string into column and direction
export function parseSort(sort: string): { column: string; direction: "asc" | "desc" } {
  const [column, direction] = sort.split(".");
  return {
    column: column || "mailed_at",
    direction: (direction as "asc" | "desc") || "desc",
  };
}


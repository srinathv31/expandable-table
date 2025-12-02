"use client";

import { useCallback, useTransition } from "react";
import { useQueryStates } from "nuqs";
import { parseAsArrayOf, parseAsIsoDate, parseAsString } from "nuqs";
import { X, Search, Filter, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { LetterStatus } from "@/lib/types";

interface DataTableToolbarProps {
  letterNames: string[];
}

const statusOptions: { value: LetterStatus; label: string }[] = [
  { value: "not_sent", label: "Not Sent" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
];

// Client-side parsers (without defaults that would cause hydration issues)
const clientFilterParsers = {
  accountId: parseAsString,
  status: parseAsArrayOf(parseAsString),
  letterType: parseAsArrayOf(parseAsString),
  from: parseAsIsoDate,
  to: parseAsIsoDate,
};

export function DataTableToolbar({ letterNames }: DataTableToolbarProps) {
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useQueryStates(clientFilterParsers, {
    shallow: false,
    startTransition,
  });

  const hasFilters =
    filters.accountId ||
    (filters.status && filters.status.length > 0) ||
    (filters.letterType && filters.letterType.length > 0) ||
    filters.from ||
    filters.to;

  const clearFilters = useCallback(() => {
    setFilters({
      accountId: null,
      status: null,
      letterType: null,
      from: null,
      to: null,
    });
  }, [setFilters]);

  const handleStatusChange = useCallback(
    (status: string, checked: boolean) => {
      const currentStatuses = filters.status || [];
      if (checked) {
        setFilters({ status: [...currentStatuses, status] });
      } else {
        const newStatuses = currentStatuses.filter((s) => s !== status);
        setFilters({ status: newStatuses.length > 0 ? newStatuses : null });
      }
    },
    [filters.status, setFilters]
  );

  const handleLetterTypeChange = useCallback(
    (letterType: string, checked: boolean) => {
      const currentTypes = filters.letterType || [];
      if (checked) {
        setFilters({ letterType: [...currentTypes, letterType] });
      } else {
        const newTypes = currentTypes.filter((t) => t !== letterType);
        setFilters({ letterType: newTypes.length > 0 ? newTypes : null });
      }
    },
    [filters.letterType, setFilters]
  );

  return (
    <div className="mb-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {/* Account ID Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search account ID..."
            value={filters.accountId || ""}
            onChange={(e) =>
              setFilters({ accountId: e.target.value || null })
            }
            className="h-9 w-[200px] pl-8"
          />
        </div>

        {/* Status Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 border-dashed",
                filters.status && filters.status.length > 0 && "border-primary"
              )}
            >
              <Filter className="mr-2 h-4 w-4" />
              Status
              {filters.status && filters.status.length > 0 && (
                <>
                  <Separator orientation="vertical" className="mx-2 h-4" />
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {filters.status.length}
                  </Badge>
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-2" align="start">
            <div className="space-y-2">
              {statusOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-muted"
                >
                  <Checkbox
                    checked={filters.status?.includes(option.value) || false}
                    onCheckedChange={(checked) =>
                      handleStatusChange(option.value, checked === true)
                    }
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Letter Type Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 border-dashed",
                filters.letterType &&
                  filters.letterType.length > 0 &&
                  "border-primary"
              )}
            >
              <Filter className="mr-2 h-4 w-4" />
              Letter Type
              {filters.letterType && filters.letterType.length > 0 && (
                <>
                  <Separator orientation="vertical" className="mx-2 h-4" />
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {filters.letterType.length}
                  </Badge>
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-2" align="start">
            <div className="max-h-[300px] space-y-2 overflow-y-auto">
              {letterNames.map((name) => (
                <label
                  key={name}
                  className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-muted"
                >
                  <Checkbox
                    checked={filters.letterType?.includes(name) || false}
                    onCheckedChange={(checked) =>
                      handleLetterTypeChange(name, checked === true)
                    }
                  />
                  <span className="text-sm">{name}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Date Range Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 border-dashed",
                (filters.from || filters.to) && "border-primary"
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Mailed Date
              {(filters.from || filters.to) && (
                <>
                  <Separator orientation="vertical" className="mx-2 h-4" />
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {filters.from && filters.to
                      ? "Range"
                      : filters.from
                        ? "From"
                        : "To"}
                  </Badge>
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="start">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">From</label>
                <Input
                  type="date"
                  value={
                    filters.from
                      ? filters.from.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    setFilters({
                      from: e.target.value ? new Date(e.target.value) : null,
                    })
                  }
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">To</label>
                <Input
                  type="date"
                  value={
                    filters.to ? filters.to.toISOString().split("T")[0] : ""
                  }
                  onChange={(e) =>
                    setFilters({
                      to: e.target.value ? new Date(e.target.value) : null,
                    })
                  }
                  className="h-9"
                />
              </div>
              {(filters.from || filters.to) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => setFilters({ from: null, to: null })}
                >
                  Clear dates
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear Filters */}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9"
            onClick={clearFilters}
          >
            Clear filters
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}

        {/* Loading indicator */}
        {isPending && (
          <div className="text-sm text-muted-foreground">Loading...</div>
        )}
      </div>

      {/* Active Filters Display */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters.accountId && (
            <Badge variant="secondary" className="gap-1">
              Account: {filters.accountId}
              <button
                onClick={() => setFilters({ accountId: null })}
                className="ml-1 rounded-full hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.status?.map((status) => (
            <Badge key={status} variant="secondary" className="gap-1">
              {statusOptions.find((s) => s.value === status)?.label || status}
              <button
                onClick={() => handleStatusChange(status, false)}
                className="ml-1 rounded-full hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.letterType?.map((type) => (
            <Badge key={type} variant="secondary" className="gap-1">
              {type}
              <button
                onClick={() => handleLetterTypeChange(type, false)}
                className="ml-1 rounded-full hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.from && (
            <Badge variant="secondary" className="gap-1">
              From: {filters.from.toLocaleDateString()}
              <button
                onClick={() => setFilters({ from: null })}
                className="ml-1 rounded-full hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.to && (
            <Badge variant="secondary" className="gap-1">
              To: {filters.to.toLocaleDateString()}
              <button
                onClick={() => setFilters({ to: null })}
                className="ml-1 rounded-full hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}


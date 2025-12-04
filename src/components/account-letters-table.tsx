"use client";

import { Fragment, use, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
  type SortingState,
  type Column,
} from "@tanstack/react-table";
import {
  ChevronRight,
  Mail,
  MapPin,
  Calendar,
  Clock,
  AlertTriangle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { AccountLetterWithDetails, LetterStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrackingTimeline } from "@/components/tracking-timeline";
import { DataTableToolbar } from "@/components/data-table-toolbar";
import { cn } from "@/lib/utils";

interface AccountLettersTableProps {
  dataPromise: Promise<AccountLetterWithDetails[]>;
  letterNamesPromise: Promise<string[]>;
}

const statusConfig: Record<
  LetterStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  not_sent: { label: "Not Sent", variant: "secondary" },
  shipped: { label: "Shipped", variant: "default" },
  delivered: { label: "Delivered", variant: "outline" },
  returned: { label: "Returned", variant: "destructive" },
  exception: { label: "Exception", variant: "outline" },
};

// Status priority for sorting (lower number = higher priority)
const statusPriority: Record<LetterStatus, number> = {
  exception: 0,
  shipped: 1,
  delivered: 2,
  returned: 3,
  not_sent: 4,
};

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDaysToViolation(
  status: LetterStatus,
  mailedAt: Date | null,
  controlDayCount: number | null
): { days: number | null; isOverdue: boolean } {
  // Only show for shipped or exception status
  if (
    !["shipped", "exception"].includes(status) ||
    !mailedAt ||
    !controlDayCount
  ) {
    return { days: null, isOverdue: false };
  }

  const mailedDate = new Date(mailedAt);
  const deadlineDate = new Date(mailedDate);
  deadlineDate.setDate(deadlineDate.getDate() + controlDayCount);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0);

  const diffTime = deadlineDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    days: Math.abs(diffDays),
    isOverdue: diffDays < 0,
  };
}

function StatusBadge({ status }: { status: LetterStatus }) {
  const config = statusConfig[status];
  return (
    <Badge
      variant={config.variant}
      className={cn(
        "font-medium",
        status === "delivered" &&
          "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
        status === "shipped" && "bg-blue-600 hover:bg-blue-700",
        status === "not_sent" && "bg-muted text-muted-foreground",
        status === "returned" &&
          "border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
        status === "exception" &&
          "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
      )}
    >
      {config.label}
    </Badge>
  );
}

function SortableHeader<TData>({
  column,
  children,
}: {
  column: Column<TData, unknown>;
  children: React.ReactNode;
}) {
  const sorted = column.getIsSorted();

  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-8 hover:bg-accent"
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {children}
      {sorted === "asc" ? (
        <ArrowUp className="ml-2 h-4 w-4" />
      ) : sorted === "desc" ? (
        <ArrowDown className="ml-2 h-4 w-4" />
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
      )}
    </Button>
  );
}

const columns: ColumnDef<AccountLetterWithDetails>[] = [
  {
    id: "expander",
    header: () => null,
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={(e) => {
          e.stopPropagation();
          row.toggleExpanded();
        }}
        aria-label={row.getIsExpanded() ? "Collapse row" : "Expand row"}
      >
        <ChevronRight
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            row.getIsExpanded() && "rotate-90"
          )}
        />
      </Button>
    ),
  },
  {
    accessorKey: "account_id",
    header: "Account ID",
    cell: ({ row }) => (
      <span className="font-mono text-sm font-medium">
        {row.original.account_id}
      </span>
    ),
  },
  {
    accessorKey: "letter_name",
    header: "Letter Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{row.original.letter_name}</span>
      </div>
    ),
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 max-w-[200px]">
        <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate text-sm">{row.original.address || "—"}</span>
      </div>
    ),
  },
  {
    accessorKey: "mailed_at",
    header: ({ column }) => (
      <SortableHeader column={column}>Mailed</SortableHeader>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{formatDate(row.original.mailed_at)}</span>
      </div>
    ),
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.mailed_at;
      const b = rowB.original.mailed_at;
      if (!a && !b) return 0;
      if (!a) return 1;
      if (!b) return -1;
      return new Date(a).getTime() - new Date(b).getTime();
    },
  },
  {
    accessorKey: "eta",
    header: ({ column }) => (
      <SortableHeader column={column}>ETA</SortableHeader>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{formatDate(row.original.eta)}</span>
      </div>
    ),
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.eta;
      const b = rowB.original.eta;
      if (!a && !b) return 0;
      if (!a) return 1;
      if (!b) return -1;
      return new Date(a).getTime() - new Date(b).getTime();
    },
  },
  {
    id: "days_to_violation",
    header: ({ column }) => (
      <SortableHeader column={column}>Days to Violation</SortableHeader>
    ),
    cell: ({ row }) => {
      const { days, isOverdue } = getDaysToViolation(
        row.original.status,
        row.original.mailed_at,
        row.original.control_day_count
      );

      if (days === null) {
        return <span className="text-sm text-muted-foreground">—</span>;
      }

      if (isOverdue) {
        return (
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
              {days} day{days !== 1 ? "s" : ""} overdue
            </span>
          </div>
        );
      }

      return (
        <span
          className={cn(
            "text-sm font-medium",
            days <= 3 && "text-amber-600 dark:text-amber-400",
            days > 3 && "text-muted-foreground"
          )}
        >
          {days} day{days !== 1 ? "s" : ""}
        </span>
      );
    },
    sortingFn: (rowA, rowB) => {
      const a = getDaysToViolation(
        rowA.original.status,
        rowA.original.mailed_at,
        rowA.original.control_day_count
      );
      const b = getDaysToViolation(
        rowB.original.status,
        rowB.original.mailed_at,
        rowB.original.control_day_count
      );

      // Handle null values (push them to the end)
      if (a.days === null && b.days === null) return 0;
      if (a.days === null) return 1;
      if (b.days === null) return -1;

      // Overdue items (negative effective days) should come first when ascending
      const effectiveA = a.isOverdue ? -a.days : a.days;
      const effectiveB = b.isOverdue ? -b.days : b.days;

      return effectiveA - effectiveB;
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <SortableHeader column={column}>Status</SortableHeader>
    ),
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
    sortingFn: (rowA, rowB) => {
      const priorityA = statusPriority[rowA.original.status];
      const priorityB = statusPriority[rowB.original.status];
      return priorityA - priorityB;
    },
  },
];

function ExpandedRow({ row }: { row: Row<AccountLetterWithDetails> }) {
  const data = row.original;
  const isException = data.status === "exception";

  return (
    <div
      className={cn(
        "bg-muted/30 border-l-4 px-6 py-4",
        isException ? "border-amber-500" : "border-primary/20"
      )}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Letter Details */}
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Letter Details
          </h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Category:</span>{" "}
              <span className="font-medium">{data.letter_category || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Description:</span>{" "}
              <span className="font-medium">
                {data.letter_description || "—"}
              </span>
            </div>
            {isException && data.control_id && (
              <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-950/50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="font-semibold text-amber-700 dark:text-amber-300">
                    Control Violation: {data.control_id}
                  </span>
                </div>
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  This letter has exceeded the {data.control_day_count}-day
                  regulatory deadline for delivery.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tracking Timeline */}
        <div>
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Tracking History
          </h4>
          <TrackingTimeline events={data.tracking_events} />
        </div>
      </div>
    </div>
  );
}

export function AccountLettersTable({
  dataPromise,
  letterNamesPromise,
}: AccountLettersTableProps) {
  const data = use(dataPromise);
  const letterNames = use(letterNamesPromise);
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    getRowCanExpand: () => true,
  });

  return (
    <div>
      <DataTableToolbar letterNames={letterNames} />
      <div className="rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-semibold">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <Fragment key={row.id}>
                  <TableRow
                    className={cn(
                      "cursor-pointer transition-colors",
                      row.getIsExpanded() && "bg-muted/50"
                    )}
                    onClick={() => row.toggleExpanded()}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="p-0">
                        <ExpandedRow row={row} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No letters found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

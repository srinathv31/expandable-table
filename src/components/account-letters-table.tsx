"use client";

import { Fragment, use } from "react";
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
} from "@tanstack/react-table";
import { ChevronRight, Mail, MapPin, Calendar, Clock } from "lucide-react";
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
};

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isStuckInTransit(status: LetterStatus, eta: Date | null): boolean {
  if (status !== "shipped" || !eta) return false;
  const daysPastEta = Math.floor(
    (Date.now() - new Date(eta).getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysPastEta >= 20;
}

function StatusBadge({
  status,
  eta,
}: {
  status: LetterStatus;
  eta: Date | null;
}) {
  const stuck = isStuckInTransit(status, eta);

  if (stuck) {
    return (
      <Badge
        variant="outline"
        className="border-amber-500 bg-amber-50 font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-400"
      >
        Stuck
      </Badge>
    );
  }

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
          "border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400"
      )}
    >
      {config.label}
    </Badge>
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
    header: "Mailed",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{formatDate(row.original.mailed_at)}</span>
      </div>
    ),
  },
  {
    accessorKey: "eta",
    header: "ETA",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{formatDate(row.original.eta)}</span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge status={row.original.status} eta={row.original.eta} />
    ),
  },
];

function ExpandedRow({ row }: { row: Row<AccountLetterWithDetails> }) {
  const data = row.original;

  return (
    <div className="bg-muted/30 border-l-4 border-primary/20 px-6 py-4">
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

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
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

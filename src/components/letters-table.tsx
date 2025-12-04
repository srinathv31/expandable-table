"use client";

import { use } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { FileText, Tag, Building2, User, Calendar } from "lucide-react";
import Link from "next/link";
import type { Letter } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface LettersTableProps {
  dataPromise: Promise<Letter[]>;
}

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      variant={isActive ? "outline" : "secondary"}
      className={cn(
        "font-medium",
        isActive
          ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
          : "bg-muted text-muted-foreground"
      )}
    >
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return <span className="text-muted-foreground">—</span>;

  const categoryColors: Record<string, string> = {
    compliance:
      "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
    billing:
      "border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    welcome:
      "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
    reminder:
      "border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400",
    notification:
      "border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400",
  };

  const colorClass =
    categoryColors[category.toLowerCase()] ||
    "border-slate-500 bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-400";

  return (
    <Badge
      variant="outline"
      className={cn("font-medium capitalize", colorClass)}
    >
      {category}
    </Badge>
  );
}

const columns: ColumnDef<Letter>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <Link
        href={`/?letterType=${row.original.name}`}
        className="flex items-center gap-2 hover:underline focus-visible:ring-2 ring-blue-400 rounded transition"
      >
        <FileText className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{row.original.name}</span>
      </Link>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4 text-muted-foreground" />
        <CategoryBadge category={row.original.category} />
      </div>
    ),
  },
  {
    accessorKey: "business_unit",
    header: "Business Unit",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{row.original.business_unit || "—"}</span>
      </div>
    ),
  },
  {
    accessorKey: "created_by",
    header: "Created By",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{row.original.created_by || "—"}</span>
      </div>
    ),
  },
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => <StatusBadge isActive={row.original.is_active} />,
  },
  {
    accessorKey: "control_id",
    header: "Control ID",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.control_id || "—"}</span>
    ),
  },
  {
    accessorKey: "control_day_count",
    header: "Control Day Count",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.control_day_count || "—"}</span>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{formatDate(row.original.created_at)}</span>
      </div>
    ),
  },
];

export function LettersTable({ dataPromise }: LettersTableProps) {
  const data = use(dataPromise);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
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
              <TableRow
                key={row.id}
                className="transition-colors hover:bg-muted/50"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
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
  );
}

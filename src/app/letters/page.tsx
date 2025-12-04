import { Suspense } from "react";
import { getLetters } from "@/lib/queries";
import { LettersTable } from "@/components/letters-table";
import { LettersStatsCards } from "@/components/letters-stats-cards";
import {
  StatsCardsSkeleton,
  LettersTableSkeleton,
} from "@/components/skeletons";
import { Library, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LettersPage() {
  const dataPromise = getLetters();

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/25">
              <Library className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Letters Library
              </h1>
              <p className="text-sm text-muted-foreground">
                Manage and browse all letter templates
              </p>
            </div>
          </div>
        </header>

        {/* Stats Row */}
        <Suspense fallback={<StatsCardsSkeleton />}>
          <LettersStatsCards dataPromise={dataPromise} />
        </Suspense>

        {/* Table */}
        <Suspense fallback={<LettersTableSkeleton />}>
          <div className="flex flex-col gap-4">
            <Button variant="outline" className="mb-4 self-end">
              <Plus className="h-4 w-4" />
              Add Letter
            </Button>
            <LettersTable dataPromise={dataPromise} />
          </div>
        </Suspense>
      </div>
    </div>
  );
}

import { Suspense } from "react";
import { getAccountLettersWithTracking } from "@/lib/queries";
import { AccountLettersTable } from "@/components/account-letters-table";
import { StatsCards } from "@/components/stats-cards";
import { StatsCardsSkeleton, TableSkeleton } from "@/components/skeletons";
import { Mail } from "lucide-react";

export default function Home() {
  const dataPromise = getAccountLettersWithTracking();

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/25">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Letter Tracking
              </h1>
              <p className="text-sm text-muted-foreground">
                Monitor letters sent to accounts
              </p>
            </div>
          </div>
        </header>

        {/* Stats Row */}
        <Suspense fallback={<StatsCardsSkeleton />}>
          <StatsCards dataPromise={dataPromise} />
        </Suspense>

        {/* Table */}
        <Suspense fallback={<TableSkeleton />}>
          <AccountLettersTable dataPromise={dataPromise} />
        </Suspense>
      </div>
    </div>
  );
}

"use client";

import { use } from "react";
import { FileText, CheckCircle, XCircle, TrendingUp, TrendingDown } from "lucide-react";
import type { Letter } from "@/lib/types";
import type { LucideIcon } from "lucide-react";

interface LettersStatsCardsProps {
  dataPromise: Promise<Letter[]>;
}

export function LettersStatsCards({ dataPromise }: LettersStatsCardsProps) {
  const data = use(dataPromise);

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        label="Total Letters"
        value={data.length}
        color="purple"
        icon={FileText}
        change={5.2}
        changeLabel="vs last month"
      />
      <StatCard
        label="Active"
        value={data.filter((l) => l.is_active).length}
        color="emerald"
        icon={CheckCircle}
        change={12.8}
        changeLabel="vs last month"
      />
      <StatCard
        label="Inactive"
        value={data.filter((l) => !l.is_active).length}
        color="slate"
        icon={XCircle}
        change={-2.1}
        changeLabel="vs last month"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  icon: Icon,
  change,
  changeLabel,
}: {
  label: string;
  value: number;
  color: "purple" | "emerald" | "slate";
  icon: LucideIcon;
  change: number;
  changeLabel: string;
}) {
  const numberColors = {
    purple: "text-purple-500 dark:text-purple-400",
    emerald: "text-emerald-500 dark:text-emerald-400",
    slate: "text-slate-500 dark:text-slate-400",
  };

  const iconBgColors = {
    purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
    emerald: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    slate: "bg-slate-100 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400",
  };

  const isPositive = change >= 0;

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-md shadow-slate-200/50 dark:shadow-slate-950/50 ring-1 ring-slate-100 dark:ring-slate-800">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className={`mt-2 text-4xl font-semibold tabular-nums ${numberColors[color]}`}>
            {value}
          </p>
        </div>
        <div className={`rounded-xl p-2.5 ${iconBgColors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5 text-sm">
        {isPositive ? (
          <TrendingUp className="h-4 w-4 text-emerald-500" />
        ) : (
          <TrendingDown className="h-4 w-4 text-rose-500" />
        )}
        <span className={isPositive ? "font-medium text-emerald-600 dark:text-emerald-400" : "font-medium text-rose-600 dark:text-rose-400"}>
          {isPositive ? "+" : ""}{change}%
        </span>
        <span className="text-slate-500 dark:text-slate-400">{changeLabel}</span>
      </div>
    </div>
  );
}

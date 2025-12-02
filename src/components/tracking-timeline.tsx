import type { TrackingEvent } from "@/lib/types";
import {
  Package,
  Building2,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
} from "lucide-react";

interface TrackingTimelineProps {
  events: TrackingEvent[];
}

const statusIcons: Record<string, typeof Package> = {
  received: Package,
  processing: Building2,
  in_transit: Truck,
  out_for_delivery: Truck,
  delivered: CheckCircle2,
};

const statusColors: Record<string, string> = {
  received: "bg-blue-500",
  processing: "bg-amber-500",
  in_transit: "bg-indigo-500",
  out_for_delivery: "bg-violet-500",
  delivered: "bg-emerald-500",
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatStatus(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function TrackingTimeline({ events }: TrackingTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="flex items-center gap-2 py-4 text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span className="text-sm">No tracking information available yet</span>
      </div>
    );
  }

  // Reverse to show most recent first
  const sortedEvents = [...events].reverse();

  return (
    <div className="py-4 px-2">
      <div className="relative">
        {sortedEvents.map((event, index) => {
          const Icon = statusIcons[event.status] || Package;
          const colorClass = statusColors[event.status] || "bg-gray-500";
          const isLast = index === sortedEvents.length - 1;

          return (
            <div key={event.id} className="flex gap-4 pb-6 last:pb-0">
              {/* Timeline line and dot */}
              <div className="relative flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${colorClass} text-white shadow-md`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                {!isLast && (
                  <div className="absolute top-8 h-full w-0.5 bg-linear-to-b from-border to-transparent" />
                )}
              </div>

              {/* Event content */}
              <div className="flex-1 pt-1">
                <p className="font-medium text-foreground">
                  {formatStatus(event.status)}
                </p>
                {event.location && (
                  <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{event.location}</span>
                  </div>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(event.occurred_at)} at{" "}
                  {formatTime(event.occurred_at)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

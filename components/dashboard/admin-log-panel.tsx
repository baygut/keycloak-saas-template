import { cn } from "@/lib/utils";
import type { AdminLogEvent } from "@/lib/dashboard/get-admin-logs";

type AdminLogPanelProps = {
  events: AdminLogEvent[];
  fullPage?: boolean;
};

export function AdminLogPanel({ events, fullPage = false }: AdminLogPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      {!fullPage ? (
        <span className="text-[10px] text-slate-500 uppercase">system_event_logs</span>
      ) : null}
      <div
        className={cn(
          "flex flex-col gap-2 overflow-y-auto",
          fullPage ? "max-h-[min(70vh,48rem)]" : "max-h-[220px]",
        )}
      >
        {events.length === 0 ? (
          <p className="border border-slate-800 bg-slate-950 p-3 text-xs text-slate-500">
            No persisted events yet. Activity from the logger will appear here.
          </p>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="space-y-1 border border-slate-800 bg-slate-950 p-2 text-xs"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <span
                    className={`font-bold uppercase ${
                      event.level === "error"
                        ? "text-brand-accent"
                        : event.level === "warn"
                          ? "text-amber-400"
                          : event.level === "debug"
                            ? "text-slate-500"
                            : "text-brand-secondary"
                    }`}
                  >
                    [{event.level}]
                  </span>{" "}
                  {event.prefix ? (
                    <span className="text-slate-500">[{event.prefix}] </span>
                  ) : null}
                  <span className="break-words text-slate-300">{event.message}</span>
                </div>
                <span className="shrink-0 text-[10px] text-slate-600">
                  {new Date(event.time).toLocaleString()}
                </span>
              </div>
              {event.meta ? (
                <pre className="overflow-x-auto whitespace-pre-wrap text-[10px] text-slate-500">
                  {JSON.stringify(event.meta, null, 2)}
                </pre>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import type { Trace } from "@/lib/traceSchema";

export default function TraceHistory(props: {
  traces: Trace[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const items = props.traces.slice(0, 5);

  if (items.length <= 1) return null;

  return (
    <div className="rounded-2xl border border-black/10 bg-white shadow-sm">
      <div className="border-b border-black/10 px-5 py-4">
        <p className="text-sm font-medium">Trace history</p>
        <p className="text-xs text-black/60">Last {items.length} versions (demo)</p>
      </div>

      <div className="p-3">
        <div className="space-y-2">
          {items.map((t) => {
            const active = t.id === props.selectedId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => props.onSelect(t.id)}
                className={[
                  "w-full rounded-xl border px-3 py-3 text-left transition",
                  active
                    ? "border-black bg-black text-white"
                    : "border-black/10 bg-[#fffdf9] text-black hover:bg-black/5",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold tracking-wide opacity-80">
                      {t.id}
                    </p>
                    <p className="mt-1 text-xs opacity-70">
                      {t.createdAt} • Confidence: {t.confidence}
                    </p>
                  </div>

                  <span
                    className={[
                      "rounded-full px-2 py-1 text-[11px] font-medium",
                      active ? "bg-white/15 text-white" : "bg-black/5 text-black/70",
                    ].join(" ")}
                  >
                    {t.riskFlags.length ? `${t.riskFlags.length} flags` : "no flags"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <p className="mt-3 text-[11px] text-black/50">
          Click a version to view its Proof Mode trace.
        </p>
      </div>
    </div>
  );
}
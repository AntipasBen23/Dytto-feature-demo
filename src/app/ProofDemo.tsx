"use client";

import { useEffect, useMemo, useState } from "react";
import { makeSeedTrace, type Trace } from "@/lib/traceSchema";
import { buildMemoHtml, openPrintMemo } from "@/lib/memoExport";
import { createTrace, listTraces } from "@/lib/traceApi";
import { uid, relativeNow } from "@/lib/ids";
import TraceHistory from "./TraceHistory";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; trace: Trace }
  | { status: "error"; message: string };

export default function ProofDemo() {
  const [proofMode, setProofMode] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [savedLabel, setSavedLabel] = useState<string>("");
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [history, setHistory] = useState<Trace[]>([]);

  const seed = useMemo(() => makeSeedTrace(), []);
  const draftEmail = useMemo(
    () => `Subject: Quick check-in on VAT + cash runway

Hi ACME team,

Based on recent activity, it looks like VAT payable may increase this quarter due to higher sales volume. I’d also like to flag that cash runway could tighten in the next 6–8 weeks if the current burn continues.

Two quick actions I recommend:
1) Review payment terms and follow-ups for slow-paying customers (especially invoices >45 days).
2) Confirm whether any refunds/credit notes are expected that are not yet reflected.

If you’d like, I can prepare a short advisory memo with the key numbers and references.

Best,
(Accountant)`,
    []
  );

  function pop(msg: string) {
    setToast(msg);
    window.clearTimeout((pop as any)._t);
    (pop as any)._t = window.setTimeout(() => setToast(null), 2200);
  }

  async function refreshHistory(docId: string) {
    const listed = await listTraces({ docId });
    if (!listed.ok) return { ok: false as const, error: listed.error };
    setHistory(listed.traces);
    return { ok: true as const, traces: listed.traces };
  }

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      setState({ status: "loading" });
      setSavedLabel("");

      const h = await refreshHistory(seed.docId);
      if (cancelled) return;
      if (!h.ok) return setState({ status: "error", message: h.error });

      if (h.traces.length > 0) {
        setState({ status: "ready", trace: h.traces[0] });
        setSavedLabel("Loaded from Trace Service");
        return;
      }

      const created = await createTrace(seed);
      if (cancelled) return;
      if (!created.ok) return setState({ status: "error", message: created.error });

      const h2 = await refreshHistory(seed.docId);
      if (cancelled) return;
      if (!h2.ok) return setState({ status: "error", message: h2.error });

      setState({ status: "ready", trace: h2.traces[0] || created.trace });
      setSavedLabel("Saved to Trace Service");
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, [seed]);

  async function copyTraceJson(trace: Trace) {
    const json = JSON.stringify(trace, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      pop("Copied trace JSON");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = json;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      pop("Copied trace JSON");
    }
  }

  function exportMemoHtml(trace: Trace) {
    const html = buildMemoHtml(trace, draftEmail);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `advisory-memo_${trace.clientId}_${trace.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
    pop("Exported memo (HTML)");
  }

  function exportMemoPdf(trace: Trace) {
    try {
      openPrintMemo(trace, draftEmail);
      pop("Opened print dialog (Save as PDF)");
    } catch (e: any) {
      pop(e?.message || "Print failed");
    }
  }

  async function generateNewTrace() {
    if (state.status !== "ready") return;

    const cur = state.trace;
    setSavedLabel("Saving…");

    const next: Trace = {
      ...cur,
      id: uid("trc"),
      createdAt: relativeNow(),
      confidence: cur.confidence === "high" ? "medium" : "high",
      riskFlags: cur.riskFlags.includes("needs_human_review")
        ? ["missing_source"]
        : ["needs_human_review", "missing_source"],
    };

    const created = await createTrace(next);
    if (!created.ok) return pop(created.error);

    const h = await refreshHistory(cur.docId);
    if (!h.ok) return pop(h.error);

    setState({ status: "ready", trace: h.traces[0] || created.trace });
    setSavedLabel("Saved to Trace Service");
    pop("Generated new trace");
  }

  async function deleteAllForDoc() {
    const docId = state.status === "ready" ? state.trace.docId : seed.docId;
    setSavedLabel("Deleting…");

    const res = await fetch(`/api/traces?docId=${encodeURIComponent(docId)}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.ok) {
      setSavedLabel("");
      return pop(data?.error || `Delete failed (${res.status})`);
    }

    pop(`Deleted ${data.deleted} trace(s)`);
    setSavedLabel("");

    // Re-seed immediately so the demo stays alive
    const created = await createTrace(seed);
    if (!created.ok) return pop(created.error);

    const h = await refreshHistory(seed.docId);
    if (!h.ok) return pop(h.error);

    setState({ status: "ready", trace: h.traces[0] || created.trace });
    setSavedLabel("Saved to Trace Service");
  }

  function selectTrace(id: string) {
    const found = history.find((t) => t.id === id);
    if (found) {
      setState({ status: "ready", trace: found });
      setSavedLabel("Loaded from Trace Service");
      pop("Loaded trace version");
    }
  }

  return (
    <main className="min-h-screen bg-[#faf7f2] text-black">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="mb-8">
          <p className="text-xs tracking-wide text-black/60">DYTTO • FEATURE DEMO</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Proof Mode (Advisory Trace)
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-black/70">
            Frontend-only, wired to mocked API routes:{" "}
            <span className="font-medium">/api/traces</span>.
          </p>
        </div>

        {state.status !== "ready" ? (
          <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium">
              {state.status === "loading" ? "Loading Trace Service…" : "Trace Service error"}
            </p>
            {state.status === "error" ? (
              <>
                <p className="mt-2 text-sm text-black/70">{state.message}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  Retry
                </button>
              </>
            ) : (
              <p className="mt-2 text-sm text-black/70">Simulating latency + failures.</p>
            )}
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={deleteAllForDoc}
                className="rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-black/5"
              >
                Delete all traces (doc)
              </button>
              <span className="text-xs text-black/50">
                {savedLabel ? savedLabel : `Doc: ${state.trace.docId}`}
              </span>
            </div>

            <div className="mb-6">
              <TraceHistory traces={history} selectedId={state.trace.id} onSelect={selectTrace} />
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              {/* Draft */}
              <section className="rounded-2xl border border-black/10 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
                  <div>
                    <p className="text-sm font-medium">Generated advisory draft</p>
                    <p className="text-xs text-black/60">
                      Doc: {state.trace.docId} • {state.trace.createdAt}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setProofMode((v) => !v)}
                    className={[
                      "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition",
                      proofMode
                        ? "border-black bg-black text-white"
                        : "border-black/15 bg-white text-black hover:bg-black/5",
                    ].join(" ")}
                    aria-pressed={proofMode}
                  >
                    <span
                      className={[
                        "inline-block h-2.5 w-2.5 rounded-full",
                        proofMode ? "bg-emerald-400" : "bg-black/20",
                      ].join(" ")}
                    />
                    Proof Mode
                  </button>
                </div>

                <div className="px-5 py-5">
                  <textarea
                    readOnly
                    value={draftEmail}
                    className="h-[360px] w-full resize-none rounded-xl border border-black/10 bg-[#fffdf9] p-4 text-sm leading-6 text-black/90 outline-none"
                  />

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => pop("Send draft (demo)")}
                      className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                    >
                      Send draft (demo)
                    </button>
                    <button
                      type="button"
                      onClick={() => pop("Regenerate (demo)")}
                      className="rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-black/5"
                    >
                      Regenerate (demo)
                    </button>
                    <button
                      type="button"
                      onClick={generateNewTrace}
                      className="rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-black/5"
                    >
                      Generate new trace
                    </button>
                  </div>
                </div>
              </section>

              {/* Proof Panel */}
              <aside
                className={[
                  "rounded-2xl border border-black/10 bg-white shadow-sm transition",
                  proofMode ? "opacity-100" : "opacity-60",
                ].join(" ")}
              >
                <div className="border-b border-black/10 px-5 py-4">
                  <p className="text-sm font-medium">Advisory Trace</p>
                  <p className="text-xs text-black/60">
                    Trace ID: {state.trace.id} • Client: {state.trace.clientId}
                  </p>
                </div>

                <div className="space-y-5 px-5 py-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-black/5 px-2 py-1 text-xs text-black/70">
                      Confidence: {state.trace.confidence}
                    </span>
                    {state.trace.riskFlags.map((f) => (
                      <span
                        key={f}
                        className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-900"
                      >
                        {f.replaceAll("_", " ")}
                      </span>
                    ))}
                  </div>

                  <Block title="Claims">
                    <ul className="list-disc space-y-2 pl-5 text-sm text-black/80">
                      {state.trace.claims.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </Block>

                  <Block title="Evidence">
                    <div className="space-y-2">
                      {state.trace.evidence.map((e) => (
                        <div
                          key={e.id}
                          className="rounded-xl border border-black/10 bg-[#fffdf9] p-3"
                        >
                          <p className="text-sm font-medium">{e.title}</p>
                          <p className="text-xs text-black/60">
                            {e.source} • {e.timestamp}
                          </p>
                          <p className="mt-2 break-all text-xs text-black/60">{e.reference}</p>
                        </div>
                      ))}
                    </div>
                  </Block>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => exportMemoHtml(state.trace)}
                      className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                    >
                      Export HTML
                    </button>
                    <button
                      type="button"
                      onClick={() => exportMemoPdf(state.trace)}
                      className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                    >
                      Export PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => copyTraceJson(state.trace)}
                      className="rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-black/5"
                    >
                      Copy JSON
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}

        {toast ? (
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black px-4 py-2 text-sm text-white shadow-lg">
            {toast}
          </div>
        ) : null}
      </div>
    </main>
  );
}

function Block(props: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="mb-2 text-xs font-semibold tracking-wide text-black/60">
        {props.title.toUpperCase()}
      </p>
      {props.children}
    </section>
  );
}
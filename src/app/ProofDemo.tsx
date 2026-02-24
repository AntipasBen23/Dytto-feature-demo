"use client";

import { useEffect, useMemo, useState } from "react";
import { makeSeedTrace, type Trace } from "@/lib/traceSchema";
import { buildMemoHtml } from "@/lib/memoExport";
import { createTrace, listTraces } from "@/lib/traceApi";

type LoadState =
  | { status: "idle" | "loading" }
  | { status: "ready"; trace: Trace }
  | { status: "error"; message: string };

export default function ProofDemo() {
  const [proofMode, setProofMode] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [savedLabel, setSavedLabel] = useState<string>("");

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

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      setState({ status: "loading" });
      setSavedLabel("");

      // Try to fetch by docId (what a real assistant would do)
      const listed = await listTraces({ docId: seed.docId });

      if (cancelled) return;

      if (!listed.ok) {
        setState({ status: "error", message: listed.error });
        return;
      }

      if (listed.traces.length > 0) {
        const t = listed.traces[0];
        setState({ status: "ready", trace: t });
        setSavedLabel("Loaded from Trace Service");
        return;
      }

      // If not found, create a seeded trace
      const created = await createTrace(seed);

      if (cancelled) return;

      if (!created.ok) {
        setState({ status: "error", message: created.error });
        return;
      }

      setState({ status: "ready", trace: created.trace });
      setSavedLabel("Saved to Trace Service");
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, [seed]);

  function pop(msg: string) {
    setToast(msg);
    window.clearTimeout((pop as any)._t);
    (pop as any)._t = window.setTimeout(() => setToast(null), 2000);
  }

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

  const view =
    state.status === "ready" ? (
      <DemoUI
        trace={state.trace}
        draftEmail={draftEmail}
        proofMode={proofMode}
        setProofMode={setProofMode}
        savedLabel={savedLabel}
        onCopy={() => copyTraceJson(state.trace)}
        onExport={() => exportMemoHtml(state.trace)}
        onRetry={() => window.location.reload()}
        onRegenerate={() => pop("Regenerate (demo)")}
        onSend={() => pop("Send draft (demo)")}
      />
    ) : state.status === "error" ? (
      <ErrorUI message={state.message} onRetry={() => window.location.reload()} />
    ) : (
      <LoadingUI />
    );

  return (
    <main className="min-h-screen bg-[#faf7f2] text-black">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="mb-8">
          <p className="text-xs tracking-wide text-black/60">DYTTO • FEATURE DEMO</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Proof Mode (Advisory Trace)
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-black/70">
            Now wired to mocked API routes: <span className="font-medium">/api/traces</span>.
          </p>
        </div>

        {view}

        {toast ? (
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black px-4 py-2 text-sm text-white shadow-lg">
            {toast}
          </div>
        ) : null}
      </div>
    </main>
  );
}

function LoadingUI() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="h-4 w-40 rounded bg-black/10" />
        <div className="mt-2 h-3 w-56 rounded bg-black/10" />
        <div className="mt-5 h-[360px] rounded-xl bg-black/10" />
        <div className="mt-4 flex gap-2">
          <div className="h-9 w-28 rounded-xl bg-black/10" />
          <div className="h-9 w-36 rounded-xl bg-black/10" />
        </div>
      </div>
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="h-4 w-32 rounded bg-black/10" />
        <div className="mt-2 h-3 w-52 rounded bg-black/10" />
        <div className="mt-5 space-y-3">
          <div className="h-20 rounded-xl bg-black/10" />
          <div className="h-20 rounded-xl bg-black/10" />
          <div className="h-20 rounded-xl bg-black/10" />
        </div>
      </div>
    </div>
  );
}

function ErrorUI(props: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium">Trace Service error</p>
      <p className="mt-2 text-sm text-black/70">{props.message}</p>
      <button
        type="button"
        onClick={props.onRetry}
        className="mt-4 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Retry
      </button>
    </div>
  );
}

function DemoUI(props: {
  trace: Trace;
  draftEmail: string;
  proofMode: boolean;
  setProofMode: (v: boolean) => void;
  savedLabel: string;
  onCopy: () => void;
  onExport: () => void;
  onRetry: () => void;
  onRegenerate: () => void;
  onSend: () => void;
}) {
  const t = props.trace;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      {/* Draft */}
      <section className="rounded-2xl border border-black/10 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
          <div>
            <p className="text-sm font-medium">Generated advisory draft</p>
            <p className="text-xs text-black/60">
              Doc: {t.docId} • {t.createdAt}
              {props.savedLabel ? (
                <>
                  {" "}
                  • <span className="text-black/50">{props.savedLabel}</span>
                </>
              ) : null}
            </p>
          </div>

          <button
            type="button"
            onClick={() => props.setProofMode(!props.proofMode)}
            className={[
              "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition",
              props.proofMode
                ? "border-black bg-black text-white"
                : "border-black/15 bg-white text-black hover:bg-black/5",
            ].join(" ")}
            aria-pressed={props.proofMode}
          >
            <span
              className={[
                "inline-block h-2.5 w-2.5 rounded-full",
                props.proofMode ? "bg-emerald-400" : "bg-black/20",
              ].join(" ")}
            />
            Proof Mode
          </button>
        </div>

        <div className="px-5 py-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-black/5 px-2 py-1 text-xs text-black/70">
              Confidence: {t.confidence}
            </span>
            {t.riskFlags.map((f) => (
              <span
                key={f}
                className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-900"
              >
                {f.replaceAll("_", " ")}
              </span>
            ))}
          </div>

          <textarea
            readOnly
            value={props.draftEmail}
            className="h-[360px] w-full resize-none rounded-xl border border-black/10 bg-[#fffdf9] p-4 text-sm leading-6 text-black/90 outline-none"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={props.onSend}
              className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Send draft (demo)
            </button>
            <button
              type="button"
              onClick={props.onRegenerate}
              className="rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-black/5"
            >
              Regenerate (demo)
            </button>
          </div>
        </div>
      </section>

      {/* Proof Panel */}
      <aside
        className={[
          "rounded-2xl border border-black/10 bg-white shadow-sm transition",
          props.proofMode ? "opacity-100" : "opacity-60",
        ].join(" ")}
      >
        <div className="border-b border-black/10 px-5 py-4">
          <p className="text-sm font-medium">Advisory Trace</p>
          <p className="text-xs text-black/60">
            Trace ID: {t.id} • Client: {t.clientId}
          </p>
        </div>

        <div className="space-y-5 px-5 py-5">
          <Block title="Claims">
            <ul className="list-disc space-y-2 pl-5 text-sm text-black/80">
              {t.claims.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </Block>

          <Block title="Evidence">
            <div className="space-y-2">
              {t.evidence.map((e) => (
                <div
                  key={e.id}
                  className="rounded-xl border border-black/10 bg-[#fffdf9] p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{e.title}</p>
                      <p className="text-xs text-black/60">
                        {e.source} • {e.timestamp}
                      </p>
                    </div>
                    <span className="rounded-full bg-black/5 px-2 py-1 text-[11px] text-black/70">
                      source
                    </span>
                  </div>
                  <p className="mt-2 break-all text-xs text-black/60">{e.reference}</p>
                </div>
              ))}
            </div>
          </Block>

          <Block title="Calculations">
            <div className="space-y-2">
              {t.calculations.map((c) => (
                <div key={c.id} className="rounded-xl border border-black/10 p-3">
                  <p className="text-sm font-medium">{c.label}</p>
                  <p className="mt-1 text-xs text-black/60">{c.formula}</p>
                  <p className="mt-2 text-sm text-black/80">{c.result}</p>
                </div>
              ))}
            </div>
          </Block>

          <Block title="Assumptions">
            <ul className="space-y-2 text-sm text-black/80">
              {t.assumptions.map((a, i) => (
                <li key={i} className="rounded-xl bg-black/5 p-3">
                  {a}
                </li>
              ))}
            </ul>
          </Block>

          <Block title="Citations">
            <ul className="list-disc space-y-2 pl-5 text-sm text-black/80">
              {t.citations.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </Block>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={props.onExport}
              className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Export memo (HTML)
            </button>
            <button
              type="button"
              onClick={props.onCopy}
              className="rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-black/5"
            >
              Copy trace JSON
            </button>
          </div>

          <button
            type="button"
            onClick={props.onRetry}
            className="text-xs text-black/50 underline decoration-black/20 underline-offset-4 hover:text-black/70"
          >
            Reset demo (reload)
          </button>
        </div>
      </aside>
    </div>
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
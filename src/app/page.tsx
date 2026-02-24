"use client";

import { useMemo, useState } from "react";

type Confidence = "high" | "medium" | "low";
type RiskFlag = "hallucination_risk" | "missing_source" | "needs_human_review";

type EvidenceItem = {
  id: string;
  title: string;
  source: "Email" | "Ledger" | "Client File" | "Calendar";
  reference: string; // looks like a link / ID
  timestamp: string;
};

type CalculationItem = {
  id: string;
  label: string;
  formula: string;
  result: string;
};

type Trace = {
  id: string;
  orgId: string;
  clientId: string;
  docId: string;
  createdAt: string;

  claims: string[];
  assumptions: string[];
  evidence: EvidenceItem[];
  calculations: CalculationItem[];
  citations: string[];

  confidence: Confidence;
  riskFlags: RiskFlag[];
};

export default function Page() {
  const [proofMode, setProofMode] = useState(false);

  const trace = useMemo<Trace>(() => {
    return {
      id: "trc_001",
      orgId: "org_dytto_demo",
      clientId: "client_acme_042",
      docId: "email_2026_02_24_001",
      createdAt: "2 mins ago",

      claims: [
        "VAT payable likely increased due to higher Q1 sales volume.",
        "Client cash runway may tighten in 6–8 weeks if current burn persists.",
        "Recommend adjusting payment terms for two slow-paying customers.",
      ],
      assumptions: [
        "Assuming no major refunds/credit notes not yet recorded.",
        "Assuming payroll remains within ±5% of last month.",
        "Assuming outstanding invoices older than 45 days are at higher default risk.",
      ],
      evidence: [
        {
          id: "ev_1",
          title: "Q1 sales ledger summary",
          source: "Ledger",
          reference: "exact://ledger/summary?q=2026-Q1",
          timestamp: "Today, 10:12",
        },
        {
          id: "ev_2",
          title: "Client email: delayed payment (Customer B)",
          source: "Email",
          reference: "gmail://thread/18c9…",
          timestamp: "Yesterday, 17:40",
        },
        {
          id: "ev_3",
          title: "Invoice aging report (last 30 days)",
          source: "Client File",
          reference: "files://acme/invoices/aging-30d.pdf",
          timestamp: "Today, 09:03",
        },
      ],
      calculations: [
        {
          id: "cal_1",
          label: "VAT delta (rough)",
          formula: "(Sales_Q1 - Sales_Q4) × VAT_rate",
          result: "≈ €4,200",
        },
        {
          id: "cal_2",
          label: "Runway estimate",
          formula: "Cash_balance ÷ Avg_monthly_burn",
          result: "≈ 1.7 months",
        },
      ],
      citations: [
        "Belgium VAT guidance: periodic return requirements (high-level)",
        "Firm policy: advisory memos must include source references",
      ],

      confidence: "medium",
      riskFlags: ["needs_human_review", "missing_source"],
    };
  }, []);

  const draftEmail = useMemo(() => {
    return `Subject: Quick check-in on VAT + cash runway

Hi ACME team,

Based on recent activity, it looks like VAT payable may increase this quarter due to higher sales volume. I’d also like to flag that cash runway could tighten in the next 6–8 weeks if the current burn continues.

Two quick actions I recommend:
1) Review payment terms and follow-ups for slow-paying customers (especially invoices >45 days).
2) Confirm whether any refunds/credit notes are expected that are not yet reflected.

If you’d like, I can prepare a short advisory memo with the key numbers and references.

Best,
(Accountant)`;
  }, []);

  return (
    <main className="min-h-screen bg-[#faf7f2] text-black">
      <div className="mx-auto max-w-5xl px-5 py-10">
        {/* Feature title area (not a header/nav) */}
        <div className="mb-8">
          <p className="text-xs tracking-wide text-black/60">DYTTO • FEATURE DEMO</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Proof Mode (Advisory Trace)
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-black/70">
            A lightweight, audit-friendly trace panel attached to any AI-generated advisory draft.
            No platform rewrite — just trust, sources, and export.
          </p>
        </div>

        {/* Main demo surface */}
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Left: Draft surface */}
          <section className="rounded-2xl border border-black/10 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
              <div>
                <p className="text-sm font-medium">Generated advisory draft</p>
                <p className="text-xs text-black/60">Doc: {trace.docId} • {trace.createdAt}</p>
              </div>

              {/* Proof Mode toggle */}
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
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-black/5 px-2 py-1 text-xs text-black/70">
                  Confidence: {trace.confidence}
                </span>
                {trace.riskFlags.map((f) => (
                  <span
                    key={f}
                    className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-900"
                    title="Risk flag"
                  >
                    {f.replaceAll("_", " ")}
                  </span>
                ))}
              </div>

              <textarea
                readOnly
                value={draftEmail}
                className="h-[360px] w-full resize-none rounded-xl border border-black/10 bg-[#fffdf9] p-4 text-sm leading-6 text-black/90 outline-none"
              />

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  Send draft (demo)
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-black/5"
                >
                  Regenerate (demo)
                </button>
              </div>
            </div>
          </section>

          {/* Right: Proof panel */}
          <aside
            className={[
              "rounded-2xl border border-black/10 bg-white shadow-sm transition",
              proofMode ? "opacity-100" : "opacity-60",
            ].join(" ")}
          >
            <div className="border-b border-black/10 px-5 py-4">
              <p className="text-sm font-medium">Advisory Trace</p>
              <p className="text-xs text-black/60">
                Trace ID: {trace.id} • Client: {trace.clientId}
              </p>
            </div>

            <div className="space-y-5 px-5 py-5">
              <Block title="Claims">
                <ul className="list-disc space-y-2 pl-5 text-sm text-black/80">
                  {trace.claims.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </Block>

              <Block title="Evidence">
                <div className="space-y-2">
                  {trace.evidence.map((e) => (
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
                  {trace.calculations.map((c) => (
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
                  {trace.assumptions.map((a, i) => (
                    <li key={i} className="rounded-xl bg-black/5 p-3">
                      {a}
                    </li>
                  ))}
                </ul>
              </Block>

              <Block title="Citations">
                <ul className="list-disc space-y-2 pl-5 text-sm text-black/80">
                  {trace.citations.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </Block>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  Export memo (demo)
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-black/15 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-black/5"
                >
                  Copy trace JSON (demo)
                </button>
              </div>

              <p className="text-xs text-black/50">
                Note: This is a frontend-only vertical slice. Next we’ll swap seeded data for mocked
                API routes and Zod validation.
              </p>
            </div>
          </aside>
        </div>
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
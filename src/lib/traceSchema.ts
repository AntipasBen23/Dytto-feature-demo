import { z } from "zod";

/**
 * Advisory Trace (Proof Mode) contract.
 * This is the “backend-shaped” schema we’ll validate against,
 * even though the demo is frontend-only.
 */

export const ConfidenceSchema = z.enum(["high", "medium", "low"]);
export type Confidence = z.infer<typeof ConfidenceSchema>;

export const RiskFlagSchema = z.enum([
  "hallucination_risk",
  "missing_source",
  "needs_human_review",
]);
export type RiskFlag = z.infer<typeof RiskFlagSchema>;

export const EvidenceItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  source: z.enum(["Email", "Ledger", "Client File", "Calendar"]),
  reference: z.string().min(1), // looks like a URL/ID
  timestamp: z.string().min(1),
});
export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;

export const CalculationItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  formula: z.string().min(1),
  result: z.string().min(1),
});
export type CalculationItem = z.infer<typeof CalculationItemSchema>;

export const TraceSchema = z.object({
  id: z.string().min(1),
  orgId: z.string().min(1),
  clientId: z.string().min(1),
  docId: z.string().min(1),
  createdAt: z.string().min(1),

  claims: z.array(z.string().min(1)).min(1),
  assumptions: z.array(z.string().min(1)).min(1),
  evidence: z.array(EvidenceItemSchema).min(1),
  calculations: z.array(CalculationItemSchema).min(1),
  citations: z.array(z.string().min(1)).min(1),

  confidence: ConfidenceSchema,
  riskFlags: z.array(RiskFlagSchema).default([]),
});
export type Trace = z.infer<typeof TraceSchema>;

/**
 * Validate + return a Trace (throws a friendly error if invalid).
 * Use this anywhere before saving/printing/exporting.
 */
export function parseTrace(input: unknown): Trace {
  const result = TraceSchema.safeParse(input);
  if (!result.success) {
    const msg = result.error.issues
      .slice(0, 5)
      .map((i) => `${i.path.join(".") || "root"}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid Trace object: ${msg}`);
  }
  return result.data;
}

/**
 * Seeded demo trace generator.
 * This mimics function-calling output + downstream storage shape.
 */
export function makeSeedTrace(overrides: Partial<Trace> = {}): Trace {
  const base: Trace = {
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

  // Merge and validate so we never create invalid demo data.
  return parseTrace({ ...base, ...overrides });
}
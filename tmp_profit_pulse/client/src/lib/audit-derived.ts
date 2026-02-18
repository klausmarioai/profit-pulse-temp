import { mockFinancials } from "@/lib/mock-data";

export type LeakItem = {
  id: number;
  name: string;
  impact: number;
  confidence?: string;
  description?: string;
  action?: string;
  breakdown?: string;
};

export type HistoryPoint = {
  month: string;
  revenue: number;
  expenses: number;
};

export type AuditData = {
  leaks?: LeakItem[];
  revenue?: number;
  expenses?: number;
  margin?: number;
  runway?: number;
  history?: HistoryPoint[];
  warning?: string;
  dataQuality?: {
    revenueRows?: number;
    expenseRows?: number;
    totalRows?: number;
  };
};

const normalizeLeakName = (raw: string) => raw.replace(/\s*efficiency$/i, "").trim();

export function buildWeeklyActions(auditData?: AuditData | null) {
  if (!auditData?.leaks?.length) return mockFinancials.weeklyActions;

  return [...auditData.leaks]
    .sort((a, b) => (b.impact || 0) - (a.impact || 0))
    .slice(0, 3)
    .map((leak, idx) => {
      const normalized = normalizeLeakName(leak.name || `Category ${idx + 1}`);
      const task = leak.action || `Reduce waste in ${normalized}`;
      const impact = Math.max(50, Math.round((leak.impact || 0) * 0.65));
      return {
        task,
        impact,
        sourceLeak: normalized,
        reason: leak.description || `Top leak category detected in ${normalized}.`,
      };
    });
}

export function getDataCompletenessWarnings(auditData?: AuditData | null): string[] {
  if (!auditData) return [];

  const warnings: string[] = [];
  if (auditData.warning) warnings.push(auditData.warning);

  const revenueRows = auditData.dataQuality?.revenueRows ?? 0;
  const expenseRows = auditData.dataQuality?.expenseRows ?? 0;
  const totalRows = auditData.dataQuality?.totalRows ?? 0;

  if (totalRows > 0 && totalRows < 10) {
    warnings.push("Small sample size detected (<10 transactions). Recommendations are directional, not definitive.");
  }
  if (revenueRows > 0 && expenseRows > 0 && (revenueRows < 3 || expenseRows < 3)) {
    warnings.push("Limited mix of revenue/expense rows detected. Leak ranking confidence may be lower.");
  }
  if (!auditData.leaks?.length) {
    warnings.push("No clear leak categories were detected from mapped columns.");
  }
  if (!auditData.history?.length) {
    warnings.push("No monthly trend history available. Forecast uses current period only.");
  }

  return Array.from(new Set(warnings));
}

export function buildCoachContext(auditData?: AuditData | null) {
  if (!auditData) {
    return {
      usingAudit: false,
      summary: "Demo mode: upload CSV to personalize coaching outputs.",
      topLeak: mockFinancials.leaks[0],
      prompts: [
        "Where am I leaking profit right now?",
        "What should I fix first this week?",
        "Can I afford to hire another staff member?",
        "What expenses should I cut first?",
      ],
    };
  }

  const topLeak = [...(auditData.leaks || [])].sort((a, b) => (b.impact || 0) - (a.impact || 0))[0];
  const monthlyProfit = (auditData.revenue || 0) - (auditData.expenses || 0);

  return {
    usingAudit: true,
    summary: `Audit mode: revenue $${Math.round(auditData.revenue || 0).toLocaleString()}, expenses $${Math.round(auditData.expenses || 0).toLocaleString()}, margin ${Math.round(auditData.margin || 0)}%, runway ${auditData.runway || 0} months.`,
    topLeak,
    prompts: [
      topLeak
        ? `How do I fix ${normalizeLeakName(topLeak.name)} first?`
        : "What should I fix first this week?",
      `How can I lift margin above ${Math.max(10, Math.round((auditData.margin || 0) + 3))}%?`,
      `What can I do this week to add at least $${Math.max(300, Math.round(((topLeak?.impact || 600) * 0.8) / 10) * 10)} monthly profit?`,
      monthlyProfit > 0
        ? "How do I protect cash flow if revenue dips next month?"
        : "How do I stabilize profit this month?",
    ],
  };
}

export function buildReportModel(auditData?: AuditData | null) {
  const usingAudit = Boolean(auditData);
  const leaks = usingAudit && auditData?.leaks?.length ? auditData.leaks : mockFinancials.leaks;
  const history = usingAudit && auditData?.history?.length ? auditData.history : mockFinancials.history;
  const weeklyActions = buildWeeklyActions(auditData);

  const topLeak = [...leaks].sort((a, b) => (b.impact || 0) - (a.impact || 0))[0];
  const currentRevenue = usingAudit ? Math.round(auditData?.revenue || 0) : mockFinancials.summary.revenue;
  const currentExpenses = usingAudit ? Math.round(auditData?.expenses || 0) : mockFinancials.summary.expenses;
  const currentProfit = currentRevenue - currentExpenses;
  const margin = usingAudit ? Math.round(auditData?.margin || 0) : mockFinancials.summary.margin;
  const runway = usingAudit ? (auditData?.runway || 0) : mockFinancials.summary.runway;

  const profits = history.map((h) => (h.revenue || 0) - (h.expenses || 0));
  const trendDelta = profits.length >= 2 ? profits[profits.length - 1] - profits[0] : 0;

  const monthlyImprovement = weeklyActions.reduce((acc, a) => acc + (a.impact || 0), 0);
  const forecastProfit = currentProfit + monthlyImprovement;

  return {
    usingAudit,
    topLeak,
    weeklyActions,
    oneThingText: topLeak
      ? `${topLeak.action || `Attack ${normalizeLeakName(topLeak.name)}`}. Estimated upside: +$${(topLeak.impact || 0).toLocaleString()}/mo before execution risk.`
      : "Upload audit data to generate a specific one-thing priority.",
    mondayActions: weeklyActions,
    metrics: { margin, runway, revenue: currentRevenue, expenses: currentExpenses, currentProfit },
    forecast: {
      trendDelta,
      monthlyImprovement,
      forecastProfit,
      quarterlyGain: monthlyImprovement * 3,
      narrative:
        trendDelta >= 0
          ? `Profit trend is improving by about $${Math.abs(Math.round(trendDelta)).toLocaleString()} across your available history.`
          : `Profit trend has fallen by about $${Math.abs(Math.round(trendDelta)).toLocaleString()} across your available history; execution this week matters.`,
    },
  };
}

export function buildCoachReply(message: string, auditData?: AuditData | null): string {
  if (!auditData) {
    return "**Recommendation:** Upload your latest CSV audit first so I can give a quantified answer using your real margin, runway, and leak categories.";
  }

  const model = buildReportModel(auditData);
  const text = message.toLowerCase();
  const top = model.topLeak;

  if (text.includes("first") || text.includes("fix") || text.includes("week")) {
    return `**First move:** ${model.mondayActions[0]?.task || "Address your largest leak"}.\n\n**Expected impact:** +$${(model.mondayActions[0]?.impact || 0).toLocaleString()}/mo.\n\n**Why now:** Biggest detected leak is **${top?.name || "N/A"}** at about **$${(top?.impact || 0).toLocaleString()}/mo**.`;
  }

  if (text.includes("hire") || text.includes("staff")) {
    const safeHire = model.metrics.margin >= 20 && model.metrics.runway >= 3;
    return safeHire
      ? `**Recommendation:** Hiring is reasonable if role ROI is clear.\n\n**Reason:** Margin ${model.metrics.margin}% and runway ${model.metrics.runway} months provide cushion.\n\n**Guardrail:** Keep net margin above 18% after hire.`
      : `**Recommendation:** Delay hiring until leak recovery starts.\n\n**Reason:** Margin ${model.metrics.margin}% and runway ${model.metrics.runway} months are tight.\n\n**Focus first:** Recover $${model.forecast.monthlyImprovement.toLocaleString()}/mo from Monday actions.`;
  }

  return `**Snapshot:** Revenue $${model.metrics.revenue.toLocaleString()}, expenses $${model.metrics.expenses.toLocaleString()}, margin ${model.metrics.margin}%.\n\n**Best next action:** ${model.mondayActions[0]?.task || "Address top leak"}.\n\n**30-day forecast if executed:** +$${model.forecast.monthlyImprovement.toLocaleString()} monthly profit.`;
}

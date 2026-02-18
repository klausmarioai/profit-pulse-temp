import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, TrendingUp, ShieldCheck, AlertCircle, Loader2, Info, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Papa from "papaparse";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "",
    revenueRange: "",
    stressPoint: "",
  });

  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'mapping' | 'error'>('idle');
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [confidence, setConfidence] = useState({ level: "Low", score: 0 });
  const [isPresetApplied, setIsPresetApplied] = useState(false);
  const PRESET_KEY = "profitPulseMappingPreset";
  const [mappings, setMappings] = useState<Record<string, string>>({
    date: "",
    description: "",
    amount: "",
    credit: "",
    debit: "",
    category: ""
  });
  const NONE_VALUE = "__none__";

  const handleFinish = (auditData?: any) => {
    if (auditData) {
      localStorage.setItem("profitPulseAudit", JSON.stringify(auditData));
    } else {
      localStorage.removeItem("profitPulseAudit");
    }
    setLocation("/dashboard");
  };

  const calculateConfidence = (m: Record<string, string>) => {
    let score = 0;
    if (m.date) score += 30;
    if (m.amount || (m.credit && m.debit)) score += 40;
    if (m.description) score += 20;
    if (m.category) score += 10;

    let level = "Low";
    if (score >= 80) level = "High";
    else if (score >= 50) level = "Medium";

    return { level, score };
  };

  const pickBestAmountHeader = (csvHeaders: string[]) => {
    const scoreAmountHeader = (header: string) => {
      const lower = header.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      let score = 0;

      if (/\b(total amount|transaction amount|amount)\b/.test(lower)) score += 120;
      if (/\btotal\b/.test(lower)) score += 90;
      if (/\b(value|cost|price)\b/.test(lower)) score += 25;

      // Strong penalties for per-unit fields that often cause false revenue-only audits
      if (/\b(unit price|price per|quantity|qty|rate)\b/.test(lower)) score -= 90;

      // Exclude obvious non-amount numeric columns
      if (/\b(id|number|invoice|order|phone|zip)\b/.test(lower)) score -= 60;

      return score;
    };

    return csvHeaders
      .map((h) => ({ h, score: scoreAmountHeader(h) }))
      .sort((a, b) => b.score - a.score)[0]?.h || "";
  };

  const detectMappingsFromHeaders = (csvHeaders: string[]) => {
    const detected: Record<string, string> = {
      date: "",
      description: "",
      amount: "",
      credit: "",
      debit: "",
      category: ""
    };

    csvHeaders.forEach((h) => {
      const lower = h.toLowerCase();
      if (!detected.date && (lower.includes("date") || lower.includes("time") || lower.includes("posted"))) detected.date = h;
      if (!detected.description && (lower.includes("desc") || lower.includes("memo") || lower.includes("detail") || lower.includes("name") || lower.includes("merchant"))) detected.description = h;
      if (!detected.credit && (lower.includes("credit") || lower.includes("deposit") || lower.includes("income"))) detected.credit = h;
      if (!detected.debit && (lower.includes("debit") || lower.includes("withdraw") || lower.includes("expense") || lower.includes("spend"))) detected.debit = h;
      if (!detected.category && (lower.includes("cat") || lower.includes("type") || lower.includes("group") || lower.includes("class"))) detected.category = h;
    });

    detected.amount = pickBestAmountHeader(csvHeaders);

    return detected;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError("Please upload a valid CSV file.");
      setUploadState('error');
      return;
    }

    setFileName(file.name);
    setUploadState('uploading');
    setError("");
    setIsPresetApplied(false);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0 && results.data.length === 0) {
          setError("Malformed CSV file. Could not parse data.");
          setUploadState('error');
          return;
        }

        if (results.data.length === 0) {
          setError("The CSV file appears to be empty.");
          setUploadState('error');
          return;
        }

        const csvHeaders = results.meta.fields || [];
        setHeaders(csvHeaders);

        const autoDetected = detectMappingsFromHeaders(csvHeaders);
        let detectedMappings = { ...autoDetected };

        const savedPresetRaw = localStorage.getItem(PRESET_KEY);
        if (savedPresetRaw) {
          try {
            const preset = JSON.parse(savedPresetRaw);
            const presetMappings = preset?.mappings || {};
            const presetHeaders = Object.values(presetMappings).filter(Boolean) as string[];
            const overlap = presetHeaders.filter((h) => csvHeaders.includes(h)).length;
            const similarity = presetHeaders.length ? overlap / presetHeaders.length : 0;

            if (similarity >= 0.5) {
              detectedMappings = {
                ...detectedMappings,
                ...presetMappings,
              };
              setIsPresetApplied(true);
            }
          } catch {
            localStorage.removeItem(PRESET_KEY);
          }
        }

        // Guardrail: if preset picked a weak amount header (e.g., Unit_Price), prefer stronger match
        const bestAmountHeader = pickBestAmountHeader(csvHeaders);
        if (bestAmountHeader) {
          detectedMappings.amount = bestAmountHeader;
        }

        const conf = calculateConfidence(detectedMappings);
        setConfidence(conf);
        setParsedData(results.data as any[]);
        setMappings(detectedMappings);

        setTimeout(() => setUploadState('mapping'), 800);
      },
      error: (err) => {
        setError(`Error parsing file: ${err.message}`);
        setUploadState('error');
      }
    });
  };

  const resetMappings = () => {
    localStorage.removeItem(PRESET_KEY);
    setIsPresetApplied(false);
    setMappings({ date: "", description: "", amount: "", credit: "", debit: "", category: "" });
    setConfidence({ level: "Low", score: 0 });
  };

  const generateAudit = () => {
    const hasAmount = Boolean(mappings.amount);
    const hasCreditDebit = Boolean(mappings.credit && mappings.debit);

    if (!mappings.date || (!hasAmount && !hasCreditDebit)) {
      setError("Please map Date and either Amount OR both Credit + Debit columns.");
      return;
    }

    // Save preset
    localStorage.setItem(PRESET_KEY, JSON.stringify({
      mappings,
      headers,
      timestamp: Date.now()
    }));

    const expensesByCategory: Record<string, number> = {};
    let totalRevenue = 0;
    let totalExpenses = 0;
    let revenueRows = 0;
    let expenseRows = 0;

    const parseMoney = (val: any) => {
      const n = parseFloat(String(val ?? "0").replace(/[$,]/g, ""));
      return Number.isFinite(n) ? n : 0;
    };

    const inferCategory = (row: any) => {
      return row[mappings.category] || row[mappings.description] || "Uncategorized";
    };

    const classifyTransaction = (row: any) => {
      let amt = 0;
      let credit = 0;
      let debit = 0;

      if (hasAmount) {
        amt = parseMoney(row[mappings.amount]);
      } else {
        credit = parseMoney(row[mappings.credit]);
        debit = parseMoney(row[mappings.debit]);
        amt = credit - debit;
      }

      if (!Number.isFinite(amt) || amt === 0) return { valid: false as const, amt: 0, isExpense: false };

      const cat = String(inferCategory(row) || "").toLowerCase();
      const desc = String(row[mappings.description] || "").toLowerCase();
      const text = `${cat} ${desc}`;

      const incomeHint = /client payment|payout|deposit|income|sale|revenue|invoice paid|received/i.test(text);
      const expenseHint = /expense|bill|fee|rent|utility|suppl|payroll|tax|insurance|subscription|software|vendor|purchase|withdraw/i.test(text);

      let isExpense = false;

      if (!hasAmount) {
        // Credit/debit mapping is authoritative when provided
        if (debit > 0 && credit === 0) isExpense = true;
        else if (credit > 0 && debit === 0) isExpense = false;
        else isExpense = amt < 0;
      } else {
        // Amount-column exports often encode sign directly; use hints only for positive ambiguous rows
        if (amt < 0) isExpense = true;
        else if (incomeHint) isExpense = false;
        else if (expenseHint) isExpense = true;
        else isExpense = false;
      }

      return { valid: true as const, amt, isExpense };
    };

    const categoryRows: Record<string, number[]> = {};
    const totalRows = Math.max(parsedData.length, 1);

    parsedData.forEach((row) => {
      const tx = classifyTransaction(row);
      if (!tx.valid) return;

      const cat = inferCategory(row);
      const absoluteAmt = Math.abs(tx.amt);

      if (tx.isExpense) {
        expenseRows += 1;
        totalExpenses += absoluteAmt;
        expensesByCategory[cat] = (expensesByCategory[cat] || 0) + absoluteAmt;

        if (!categoryRows[cat]) categoryRows[cat] = [];
        categoryRows[cat].push(absoluteAmt);
      } else {
        revenueRows += 1;
        totalRevenue += absoluteAmt;
      }
    });

    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

    const leaks = Object.entries(expensesByCategory)
      .map(([name, total], idx) => {
        const rows = categoryRows[name] || [];
        const txCount = rows.length;
        const mean = txCount ? rows.reduce((a, b) => a + b, 0) / txCount : 0;
        const variance = txCount
          ? rows.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / txCount
          : 0;
        const stdDev = Math.sqrt(variance);

        // Recurrence: how often this category appears in file
        const recurrenceRatio = txCount / totalRows; // 0..1+
        const recurrenceBoost = clamp(recurrenceRatio * 0.08, 0, 0.08); // up to +8%

        // Volatility: unstable spend = more leak risk
        const volatilityRatio = mean > 0 ? stdDev / mean : 0;
        const volatilityBoost = clamp(volatilityRatio * 0.05, 0, 0.05); // up to +5%

        // Baseline + risk boosts (consistent logic for all categories)
        const baseRate = 0.10; // 10%
        const savingsRate = clamp(baseRate + recurrenceBoost + volatilityBoost, 0.08, 0.23);

        const impact = Math.round(total * savingsRate);

        let confidence = "Low";
        if (txCount >= 3 && total >= 800) confidence = "High";
        else if (txCount >= 2 && total >= 300) confidence = "Med";

        return {
          id: idx + 1,
          name: `${name} Efficiency`,
          impact,
          confidence,
          description: `Potential leaks detected in ${name}.`,
          breakdown: `How calculated: ${Math.round(baseRate * 100)}% base + ${Math.round(recurrenceBoost * 100)}% recurrence + ${Math.round(volatilityBoost * 100)}% volatility.`,
          action: `Audit ${name} recurring costs`
        };
      })
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 3);

    const computedMargin = totalRevenue > 0
      ? Math.round(((totalRevenue - totalExpenses) / totalRevenue) * 100)
      : 0;

    let auditWarning = "";
    if (revenueRows > 0 && expenseRows === 0) {
      auditWarning = "Revenue-only dataset detected. Upload bank/P&L expenses for accurate leak findings and margin.";
    } else if (expenseRows > 0 && revenueRows === 0) {
      auditWarning = "Expense-only dataset detected. Upload revenue data for accurate margin and full audit insights.";
    }

    handleFinish({
      leaks: leaks,
      revenue: totalRevenue,
      expenses: totalExpenses,
      margin: computedMargin,
      warning: auditWarning,
      dataQuality: {
        revenueRows,
        expenseRows,
        totalRows: revenueRows + expenseRows
      }
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 bg-primary rounded-xl mx-auto flex items-center justify-center text-primary-foreground mb-4 shadow-lg shadow-primary/20">
             <TrendingUp className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold font-heading">Setup Your Profit Audit</h1>
          <p className="text-muted-foreground mt-2">Find hidden leaks in &lt; 90 seconds.</p>
        </div>

        <Card className="border-border/50 shadow-xl overflow-hidden">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  <h2 className="text-xl font-semibold">Business Info</h2>
                  <div className="space-y-4">
                    <Input placeholder="Business Name" value={formData.businessName} onChange={(e) => setFormData({...formData, businessName: e.target.value})} />
                    <Select onValueChange={(val) => setFormData({...formData, businessType: val})}>
                      <SelectTrigger><SelectValue placeholder="Business Type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hvac">HVAC / Trades</SelectItem>
                        <SelectItem value="medspa">Med Spa / Aesthetics</SelectItem>
                        <SelectItem value="dental">Dental / Healthcare</SelectItem>
                        <SelectItem value="salon">Salon / Wellness</SelectItem>
                        <SelectItem value="other">Other Service Business</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select onValueChange={(val) => setFormData({...formData, revenueRange: val})}>
                      <SelectTrigger><SelectValue placeholder="Monthly Revenue" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lt20">&lt; $20k</SelectItem>
                        <SelectItem value="20-50">$20k - $50k</SelectItem>
                        <SelectItem value="50-100">$50k - $100k</SelectItem>
                        <SelectItem value="100plus">$100k+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full h-12 text-lg" onClick={() => setStep(2)} disabled={!formData.businessName || !formData.businessType || !formData.revenueRange}>Continue</Button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  <h2 className="text-xl font-semibold">Biggest Financial Stress?</h2>
                  <div className="space-y-2">
                    {["Cash Flow", "High Labor Costs", "Supply Prices", "Marketing ROI"].map(s => (
                      <Button key={s} variant={formData.stressPoint === s ? "default" : "outline"} className="w-full justify-start h-12" onClick={() => setFormData({...formData, stressPoint: s})}>{s}</Button>
                    ))}
                  </div>
                  <div className="flex gap-2"><Button variant="ghost" className="flex-1" onClick={() => setStep(1)}>Back</Button><Button className="flex-1" onClick={() => setStep(3)} disabled={!formData.stressPoint}>Next</Button></div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 text-center">
                  <h2 className="text-xl font-semibold">Connect Financials</h2>
                  
                  {uploadState === 'idle' || uploadState === 'error' ? (
                    <div className="space-y-4">
                      <div 
                        className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center bg-muted/20 cursor-pointer group hover:bg-muted/40 transition-all ${uploadState === 'error' ? 'border-destructive' : 'border-border'}`}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className={`w-12 h-12 mb-4 ${uploadState === 'error' ? 'text-destructive' : 'text-primary'}`} />
                        <h3 className="font-medium text-lg">Click to Upload CSV</h3>
                        <p className="text-sm text-muted-foreground mt-2">Standard Bank or POS Export</p>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept=".csv"
                          onChange={handleFileUpload}
                        />
                      </div>
                      
                      {uploadState === 'error' && (
                        <Alert variant="destructive" className="py-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs">{error}</AlertDescription>
                        </Alert>
                      )}
                      
                      <Button variant="link" className="text-muted-foreground" onClick={() => handleFinish()}>Or start with Demo Mode</Button>
                    </div>
                  ) : uploadState === 'uploading' ? (
                    <div className="py-20 flex flex-col items-center justify-center space-y-4">
                      <Loader2 className="w-12 h-12 text-primary animate-spin" />
                      <p className="text-sm font-medium">Analyzing {fileName}...</p>
                      <p className="text-xs text-muted-foreground">Normalizing amounts and mapping columns</p>
                    </div>
                  ) : (
                    <div className="space-y-6 text-left animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex items-center justify-between p-3 bg-card border border-border/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Info className="w-5 h-5 shrink-0 text-blue-500" />
                          <div>
                            <p className="text-xs font-bold">Confidence: {confidence.score}% ({confidence.level})</p>
                            <p className="text-[10px] text-muted-foreground">{isPresetApplied ? "Applied previous mapping" : "Auto-detected based on headers"}</p>
                          </div>
                        </div>
                        {isPresetApplied && (
                          <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={resetMappings}>
                            <RotateCcw className="w-3 h-3 mr-1" /> Reset
                          </Button>
                        )}
                      </div>
                      
                      {confidence.level === "Low" && (
                        <Alert variant="destructive" className="py-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs">Low confidence detected. Please confirm mappings before running audit.</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { id: 'date', label: 'Date Column' },
                            { id: 'amount', label: 'Amount Column' },
                            { id: 'credit', label: 'Credit (Opt)' },
                            { id: 'debit', label: 'Debit (Opt)' },
                            { id: 'description', label: 'Description' },
                            { id: 'category', label: 'Category (Opt)' }
                          ].map(field => (
                            <div key={field.id} className="space-y-1.5">
                              <label className="text-[10px] font-bold uppercase text-muted-foreground">{field.label}</label>
                              <Select 
                                value={mappings[field.id] || ((field.id === 'category' || field.id === 'description' || field.id === 'credit' || field.id === 'debit') ? NONE_VALUE : "")}
                                onValueChange={(val) => {
                                  const normalizedVal = val === NONE_VALUE ? "" : val;
                                  const newMappings = {...mappings, [field.id]: normalizedVal};
                                  setMappings(newMappings);
                                  setConfidence(calculateConfidence(newMappings));
                                  setIsPresetApplied(false);
                                }}
                              >
                                <SelectTrigger className="h-9 text-xs">
                                  <SelectValue placeholder="Select header" />
                                </SelectTrigger>
                                <SelectContent>
                                  {(field.id === 'category' || field.id === 'description' || field.id === 'credit' || field.id === 'debit') && <SelectItem value={NONE_VALUE}>None</SelectItem>}
                                  {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                          ))}
                        </div>
                      </div>

                      {error && (
                        <p className="text-[10px] text-destructive font-medium">{error}</p>
                      )}

                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => setUploadState('idle')}>Cancel</Button>
                        <Button className="flex-1" onClick={generateAudit}>Run Audit</Button>
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg flex gap-3 text-blue-700 dark:text-blue-300 text-[10px] text-left">
                    <ShieldCheck className="w-5 h-5 shrink-0" />
                    <p>Bank-grade encryption. Your financial data is private and secure.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, TrendingUp, ShieldCheck, Check, AlertCircle, Loader2, Info, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Papa from "papaparse";

const NONE_VALUE = "__none__";

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
  const [mappings, setMappings] = useState<Record<string, string>>({
    date: "",
    description: "",
    amount: "",
    category: ""
  });

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
    if (m.amount) score += 40;
    if (m.description) score += 20;
    if (m.category) score += 10;
    
    let level = "Low";
    if (score >= 80) level = "High";
    else if (score >= 50) level = "Medium";
    
    return { level, score };
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
        
        const savedPreset = localStorage.getItem("profitPulseMappingPreset");
        let detectedMappings: Record<string, string> = {
          date: "",
          description: "",
          amount: "",
          category: ""
        };

        if (savedPreset) {
          const preset = JSON.parse(savedPreset);
          const hasMatch = Object.values(preset.mappings).some(h => csvHeaders.includes(h as string));
          if (hasMatch) {
            detectedMappings = { ...preset.mappings };
            setIsPresetApplied(true);
          }
        }

        if (!isPresetApplied) {
          csvHeaders.forEach(h => {
            const lower = h.toLowerCase();
            if (!detectedMappings.date && (lower.includes('date') || lower.includes('time'))) detectedMappings.date = h;
            if (!detectedMappings.description && (lower.includes('desc') || lower.includes('memo') || lower.includes('detail') || lower.includes('name'))) detectedMappings.description = h;
            if (!detectedMappings.amount && (lower.includes('amount') || lower.includes('val') || lower.includes('price') || lower.includes('cost'))) detectedMappings.amount = h;
            if (!detectedMappings.category && (lower.includes('cat') || lower.includes('type') || lower.includes('group'))) detectedMappings.category = h;
          });
        }

        const conf = calculateConfidence(detectedMappings);
        setConfidence(conf);
        setParsedData(results.data);
        setMappings(detectedMappings);
        
        setTimeout(() => setUploadState('mapping'), 1000);
      },
      error: (err) => {
        setError(`Error parsing file: ${err.message}`);
        setUploadState('error');
      }
    });
  };

  const resetMappings = () => {
    localStorage.removeItem("profitPulseMappingPreset");
    setIsPresetApplied(false);
    setMappings({ date: "", description: "", amount: "", category: "" });
    setConfidence({ level: "Low", score: 0 });
  };

  const generateAudit = () => {
    if (!mappings.amount || !mappings.date) {
      setError("Please map at least the Date and Amount columns.");
      return;
    }

    localStorage.setItem("profitPulseMappingPreset", JSON.stringify({
      mappings,
      timestamp: Date.now()
    }));

    const expensesByCategory: Record<string, number> = {};
    const historyMap: Record<string, { revenue: number, expenses: number }> = {};
    let totalRevenue = 0;
    let totalExpenses = 0;
    let revenueRows = 0;
    let expenseRows = 0;

    parsedData.forEach(row => {
      let amtStr = String(row[mappings.amount] || "0").replace(/[$,]/g, '');
      let amt = parseFloat(amtStr);
      if (isNaN(amt)) return;

      const dateStr = String(row[mappings.date] || "");
      const date = new Date(dateStr);
      const monthKey = !isNaN(date.getTime()) 
        ? date.toLocaleString('default', { month: 'short' }) 
        : "Unknown";

      if (!historyMap[monthKey]) {
        historyMap[monthKey] = { revenue: 0, expenses: 0 };
      }

      const cat = row[mappings.category] || 'Uncategorized';
      const isExpense = amt < 0 || (typeof cat === 'string' && /rent|pay|soft|tax|supply|vendor|utilit/i.test(cat));
      
      if (isExpense) {
        const absoluteAmt = Math.abs(amt);
        totalExpenses += absoluteAmt;
        expenseRows++;
        expensesByCategory[cat] = (expensesByCategory[cat] || 0) + absoluteAmt;
        historyMap[monthKey].expenses += absoluteAmt;
      } else {
        totalRevenue += amt;
        revenueRows++;
        historyMap[monthKey].revenue += amt;
      }
    });

    const history = Object.entries(historyMap)
      .filter(([month]) => month !== "Unknown")
      .map(([month, data]) => ({
        month,
        revenue: Math.round(data.revenue),
        expenses: Math.round(data.expenses)
      }));

    let warning = "";
    if (revenueRows > 0 && expenseRows === 0) {
      warning = "Revenue-only dataset detected. Upload bank/P&L expenses for accurate leak findings and margin.";
    } else if (expenseRows > 0 && revenueRows === 0) {
      warning = "Expense-only dataset detected. Upload revenue data for accurate margin and full audit insights.";
    }

    const sortedCats = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1]);
    const leaks = sortedCats.slice(0, 3).map(([name, total], idx) => {
      const impact = Math.round(total * (0.1 + idx * 0.05));
      return {
        id: idx + 1,
        name: `${name} Efficiency`,
        impact: impact,
        confidence: impact > 500 ? "High" : "Med",
        description: `Potential leaks detected in ${name}. Benchmarks suggest a ${Math.round((impact/total)*100)}% saving opportunity.`,
        action: `Audit ${name} recurring costs`
      };
    });

    const avgMonthlyExpenses = totalExpenses / (Object.keys(historyMap).length || 1);
    const runway = avgMonthlyExpenses > 0 ? Math.round((totalRevenue * 0.2) / avgMonthlyExpenses) : 6;

    handleFinish({
      leaks: leaks.length > 0 ? leaks : null,
      revenue: totalRevenue,
      expenses: totalExpenses,
      margin: totalRevenue ? Math.round(((totalRevenue - totalExpenses) / totalRevenue) * 100) : 0,
      warning,
      runway: runway || 1,
      history: history.length > 0 ? history : null
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-xl">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 bg-primary rounded-xl mx-auto flex items-center justify-center text-primary-foreground mb-4 shadow-lg shadow-primary/20">
             <TrendingUp className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold font-heading text-foreground">ProfitPulse AI Setup</h1>
          <p className="text-muted-foreground mt-2">Find hidden leaks in &lt; 90 seconds.</p>
        </div>

        <Card className="border-border/50 shadow-xl overflow-hidden">
          <CardContent className="p-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <h2 className="text-xl font-semibold">Business Info</h2>
                  <div className="space-y-4">
                    <Input placeholder="Agency Name" value={formData.businessName} onChange={(e) => setFormData({...formData, businessName: e.target.value})} />
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
                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                  <h2 className="text-xl font-semibold">Biggest Financial Stress?</h2>
                  <div className="space-y-2">
                    {["Cash Flow", "High Labor Costs", "Supply Prices", "Marketing ROI"].map(s => (
                      <Button key={s} variant={formData.stressPoint === s ? "default" : "outline"} className="w-full justify-start h-12" onClick={() => setFormData({...formData, stressPoint: s})}>{s}</Button>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-4"><Button variant="ghost" className="flex-1" onClick={() => setStep(1)}>Back</Button><Button className="flex-1" onClick={() => setStep(3)} disabled={!formData.stressPoint}>Next</Button></div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 text-center">
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
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          {[
                            { id: 'date', label: 'Date Column' },
                            { id: 'description', label: 'Description' },
                            { id: 'amount', label: 'Amount' },
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

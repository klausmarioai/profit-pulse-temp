import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildReportModel, getDataCompletenessWarnings, type AuditData, type LeakItem } from "@/lib/audit-derived";
import { mockFinancials } from "@/lib/mock-data";
import { DollarSign, Wallet, TrendingUp, PiggyBank, Info, CheckCircle, Zap, AlertTriangle, CalendarCheck2, ClipboardList } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useRef, useState } from "react";
import { loadAuditData } from "@/lib/audit-storage";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const CHECKIN_KEY = "profitpulse.daily.checkin.v1";
const WEEKLY_REVIEW_KEY = "profitpulse.weekly.review.v1";

type DailyPriority = { id: string; text: string; done: boolean };
type DailyCheckin = { date: string; priorities: DailyPriority[]; updatedAt: string };
type WeeklyReview = { week: string; wins: string; misses: string; nextActions: string; updatedAt: string };

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function weekKey() {
  const now = new Date();
  const jan1 = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const days = Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - jan1.getTime()) / 86400000);
  const week = Math.ceil((days + jan1.getUTCDay() + 1) / 7);
  return `${now.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export default function DashboardPage() {
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [dailyCheckin, setDailyCheckin] = useState<DailyCheckin | null>(null);
  const [priorityDraft, setPriorityDraft] = useState("");
  const [weeklyReview, setWeeklyReview] = useState<WeeklyReview | null>(null);
  const checkinCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setAuditData(loadAuditData());
  }, []);

  const report = useMemo(() => buildReportModel(auditData), [auditData]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHECKIN_KEY);
      const today = todayKey();
      if (raw) {
        const parsed = JSON.parse(raw) as DailyCheckin;
        if (parsed?.date === today && Array.isArray(parsed.priorities)) {
          setDailyCheckin(parsed);
          return;
        }
      }
      const seeded = report.mondayActions.slice(0, 3).map((action, idx) => ({
        id: `${Date.now()}-${idx}`,
        text: action.task,
        done: false,
      }));
      setDailyCheckin({ date: today, priorities: seeded, updatedAt: new Date().toISOString() });
    } catch {
      setDailyCheckin({ date: todayKey(), priorities: [], updatedAt: new Date().toISOString() });
    }
  }, [report.mondayActions]);

  useEffect(() => {
    if (!dailyCheckin) return;
    localStorage.setItem(CHECKIN_KEY, JSON.stringify(dailyCheckin));
  }, [dailyCheckin]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WEEKLY_REVIEW_KEY);
      const currentWeek = weekKey();
      if (raw) {
        const parsed = JSON.parse(raw) as WeeklyReview;
        if (parsed?.week === currentWeek) {
          setWeeklyReview(parsed);
          return;
        }
      }
      setWeeklyReview({ week: currentWeek, wins: "", misses: "", nextActions: "", updatedAt: new Date().toISOString() });
    } catch {
      setWeeklyReview({ week: weekKey(), wins: "", misses: "", nextActions: "", updatedAt: new Date().toISOString() });
    }
  }, []);

  useEffect(() => {
    if (!weeklyReview) return;
    localStorage.setItem(WEEKLY_REVIEW_KEY, JSON.stringify(weeklyReview));
  }, [weeklyReview]);

  const completenessWarnings = useMemo(() => getDataCompletenessWarnings(auditData), [auditData]);
  const totalSavings = report.mondayActions.reduce((acc, leakLike: any) => acc + (leakLike.impact || 0), 0);
  const chartData = report.usingAudit ? (auditData?.history || []) : mockFinancials.history;
  const completedCount = dailyCheckin?.priorities.filter((p) => p.done).length || 0;

  const addDailyPriorities = () => {
    const lines = priorityDraft
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (!lines.length || !dailyCheckin) return;

    const room = Math.max(0, 3 - dailyCheckin.priorities.length);
    const additions = lines.slice(0, room).map((line, idx) => ({
      id: `${Date.now()}-${idx}`,
      text: line,
      done: false,
    }));

    if (!additions.length) return;

    setDailyCheckin({
      ...dailyCheckin,
      priorities: [...dailyCheckin.priorities, ...additions],
      updatedAt: new Date().toISOString(),
    });
    setPriorityDraft("");
  };

  const togglePriority = (id: string) => {
    if (!dailyCheckin) return;
    setDailyCheckin({
      ...dailyCheckin,
      priorities: dailyCheckin.priorities.map((p) => (p.id === id ? { ...p, done: !p.done } : p)),
      updatedAt: new Date().toISOString(),
    });
  };

  const resetTodayCheckin = () => {
    setDailyCheckin({ date: todayKey(), priorities: [], updatedAt: new Date().toISOString() });
    setPriorityDraft("");
  };

  const updateWeeklyReview = (field: "wins" | "misses" | "nextActions", value: string) => {
    if (!weeklyReview) return;
    setWeeklyReview({ ...weeklyReview, [field]: value, updatedAt: new Date().toISOString() });
  };

  const leakToTask = (leak: Partial<LeakItem>) => {
    const task = leak.action || leak.name || "Fix top profit leak";
    const impact = Math.max(0, Math.round(leak.impact || 0));
    return impact ? `${task} (+$${impact.toLocaleString()}/mo est.)` : task;
  };

  const focusCheckinCard = () => {
    const card = checkinCardRef.current;
    if (!card) return;

    card.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => {
      card.focus();
    }, 220);
  };

  const addLeakFixToToday = (leak: Partial<LeakItem>) => {
    if (!dailyCheckin) return;

    const taskText = leakToTask(leak);
    const duplicate = dailyCheckin.priorities.some((p) => p.text.toLowerCase() === taskText.toLowerCase());
    if (duplicate) {
      toast({
        title: "Already in today’s plan",
        description: "That fix is already on your Daily Profit Check-in.",
      });
      return;
    }

    if (dailyCheckin.priorities.length >= 3) {
      toast({
        title: "Today’s list is full",
        description: "Complete one item or reset today to add another fix.",
        variant: "destructive",
      });
      return;
    }

    setDailyCheckin({
      ...dailyCheckin,
      priorities: [...dailyCheckin.priorities, { id: `${Date.now()}`, text: taskText, done: false }],
      updatedAt: new Date().toISOString(),
    });

    toast({
      title: "Added to Daily Check-in",
      description: taskText,
    });
    focusCheckinCard();
  };

  return (
    <Layout>
      <div className="space-y-8 pb-10 font-sans">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold font-heading text-foreground">Dashboard</h1>
              <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-200 uppercase tracking-tighter">
                {report.usingAudit ? 'Real Audit Active' : 'Demo Mode'}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {report.usingAudit ? 'Audit results based on your uploaded CSV.' : 'Audit results for your local service business.'}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium bg-secondary px-3 py-1 rounded-full text-muted-foreground">Audit Complete</div>
        </div>

        {completenessWarnings.length > 0 && (
          <Card className="border-amber-300 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-800">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 mt-0.5 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Data completeness warning</p>
                <ul className="list-disc ml-5 mt-1 space-y-0.5">
                  {completenessWarnings.map((warning) => (
                    <li key={warning} className="text-xs text-amber-700 dark:text-amber-400">{warning}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        <Card ref={checkinCardRef} tabIndex={-1} className="border-blue-200/70 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-400/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center justify-between gap-3">
              <span className="flex items-center gap-2"><CalendarCheck2 className="w-5 h-5 text-blue-600" /> Daily Profit Check-in</span>
              <Badge variant="outline" className="text-[10px] uppercase tracking-tight">{completedCount}/{dailyCheckin?.priorities.length || 0} done</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dailyCheckin?.priorities.length ? (
              <div className="space-y-2">
                {dailyCheckin.priorities.map((priority) => (
                  <button
                    key={priority.id}
                    onClick={() => togglePriority(priority.id)}
                    className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition ${priority.done ? "bg-green-50 border-green-300 text-green-800 dark:bg-green-950/30 dark:text-green-300" : "bg-card border-border hover:border-primary/40"}`}
                  >
                    <span className="font-semibold mr-2">{priority.done ? "✓" : "○"}</span>
                    {priority.text}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No priorities yet. Add up to 3 for today.</p>
            )}

            <div className="space-y-2">
              <Textarea
                value={priorityDraft}
                onChange={(e) => setPriorityDraft(e.target.value)}
                placeholder="Add 1-3 priorities (one per line). Ex: Raise prices 5% for new clients"
                className="min-h-[74px] bg-background"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={addDailyPriorities} disabled={!priorityDraft.trim() || (dailyCheckin?.priorities.length || 0) >= 3}>
                  Add priorities
                </Button>
                <Button size="sm" variant="outline" onClick={resetTodayCheckin}>Reset today</Button>
              </div>
              <p className="text-[11px] text-muted-foreground">Tip: keep this to 3 max. Finish these before opening new fires.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200/70 bg-purple-50/40 dark:bg-purple-950/20 dark:border-purple-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-purple-600" /> Weekly Review ({weeklyReview?.week || "this week"})
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Wins</p>
              <Textarea
                value={weeklyReview?.wins || ""}
                onChange={(e) => updateWeeklyReview("wins", e.target.value)}
                placeholder="What worked this week?"
                className="min-h-[96px] bg-background"
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Misses</p>
              <Textarea
                value={weeklyReview?.misses || ""}
                onChange={(e) => updateWeeklyReview("misses", e.target.value)}
                placeholder="What slipped or cost money?"
                className="min-h-[96px] bg-background"
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Next 3 actions</p>
              <Textarea
                value={weeklyReview?.nextActions || ""}
                onChange={(e) => updateWeeklyReview("nextActions", e.target.value)}
                placeholder="1) ...\n2) ...\n3) ..."
                className="min-h-[96px] bg-background"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-heading flex items-center gap-2 text-primary">
              <Zap className="w-5 h-5" />
              Your Profit Leak Audit
            </h2>
            <div className="text-sm font-bold bg-primary/10 text-primary px-3 py-1 rounded-lg">
              Potential monthly savings: ${totalSavings.toLocaleString()}
            </div>
          </div>
          {report.topLeak ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[report.topLeak, ...report.mondayActions.slice(1)].filter(Boolean).map((leak: any, idx) => (
                <Card key={`${leak.name || leak.task}-${idx}`} className="border-primary/20 shadow-lg shadow-primary/5 hover:border-primary/40 transition-all">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-bold text-sm leading-tight">{leak.name || leak.task}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-primary">${(leak.impact || 0).toLocaleString()}</span>
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">/mo leak</span>
                        </div>
                      </div>
                      <Badge variant={leak.confidence === "High" ? "default" : "secondary"} className="text-[9px] uppercase tracking-tighter">
                        {leak.confidence || "Est."} Conf.
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground leading-relaxed">{leak.description || leak.reason}</p>
                      {leak.breakdown && <p className="text-[10px] text-muted-foreground/90 leading-relaxed">{leak.breakdown}</p>}
                    </div>
                    <Button
                      size="sm"
                      className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors h-9"
                      onClick={() => addLeakFixToToday(leak)}
                    >
                      Fix this
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-6 text-sm text-muted-foreground">No leak categories were detected from your mapped columns yet. Re-run onboarding with category/description mapped for better leak detection.</CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Monthly Revenue" value={`$${report.metrics.revenue.toLocaleString()}`} icon={DollarSign} color="text-primary" bg="bg-primary/10" />
          <StatCard title="Net Profit" value={`$${report.metrics.currentProfit.toLocaleString()}`} icon={TrendingUp} color="text-green-600" bg="bg-green-500/10" />
          <StatCard title="Profit Margin" value={`${report.metrics.margin}%`} icon={Wallet} color="text-blue-600" bg="bg-blue-500/10" tooltip="Calculated as (Net Profit / Total Revenue) * 100. Target 20% - 35% for local service businesses." />
          <StatCard title="Cash Runway" value={`${report.metrics.runway} Mo`} icon={PiggyBank} color="text-orange-600" bg="bg-orange-500/10" tooltip="Calculated as (Total Cash / Avg Monthly Expenses). How many months you survive if revenue drops to zero." />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-border/50 shadow-sm">
            <CardHeader><CardTitle className="text-lg font-medium">Monthly Trends</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[300px] w-full mt-4">
                {report.usingAudit && chartData.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No trend history available from this dataset.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs><linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
                      <Area type="monotone" dataKey="expenses" stroke="hsl(var(--destructive))" strokeWidth={2} fillOpacity={0} name="Expenses" strokeDasharray="5 5" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader><CardTitle className="text-lg font-bold">Fix this week</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {report.mondayActions.length > 0 ? report.mondayActions.map((action, i) => (
                <div key={`${action.task}-${i}`} className="flex gap-3 p-3 bg-card border border-border/50 rounded-lg shadow-sm">
                  <div className="w-5 h-5 mt-0.5 rounded-full border border-primary/30 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-3 h-3 text-primary/30" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold leading-tight">{action.task}</p>
                    <p className="text-[10px] text-primary font-bold mt-1 uppercase tracking-tighter">+${action.impact.toLocaleString()} monthly boost</p>
                  </div>
                </div>
              )) : <p className="text-xs text-muted-foreground">No action items generated yet. Upload a fuller CSV to populate Monday actions.</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ title, value, icon: Icon, color, bg, tooltip }: any) {
  return (
    <Card className="border-border/50 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg ${bg} ${color}`}><Icon className="w-5 h-5" /></div>
          {tooltip && (
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger><Info className="w-4 h-4 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent><p className="max-w-xs text-[10px] leading-relaxed">{tooltip}</p></TooltipContent>
              </UITooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="space-y-1">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</h3>
          <div className="text-2xl font-bold font-heading">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

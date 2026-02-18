import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockFinancials } from "@/lib/mock-data";
import { DollarSign, Wallet, TrendingUp, PiggyBank, Info, CheckCircle, Zap, AlertTriangle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [auditData, setAuditData] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("profitPulseAudit");
    if (saved) {
      setAuditData(JSON.parse(saved));
    }
  }, []);

  // Merge audit data with mock for a full dashboard feel
  const currentSummary = auditData ? {
    ...mockFinancials.summary,
    revenue: auditData.revenue || mockFinancials.summary.revenue,
    expenses: auditData.expenses || mockFinancials.summary.expenses,
    profit: (auditData.revenue || mockFinancials.summary.revenue) - (auditData.expenses || mockFinancials.summary.expenses),
    margin: auditData.margin || mockFinancials.summary.margin
  } : mockFinancials.summary;

  const currentLeaks = (auditData && auditData.leaks) ? auditData.leaks : mockFinancials.leaks;
  const totalSavings = currentLeaks.reduce((acc: number, leak: any) => acc + (leak.impact || 0), 0);

  return (
    <Layout>
      <div className="space-y-8 pb-10 font-sans">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold font-heading text-foreground">Dashboard</h1>
              <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-200 uppercase tracking-tighter">
                {auditData ? 'Real Audit Active' : 'Demo Mode'}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {auditData ? 'Audit results based on your uploaded CSV.' : 'Audit results for your local service business.'}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium bg-secondary px-3 py-1 rounded-full text-muted-foreground">Audit Complete</div>
        </div>

        {auditData?.warning && (
          <Card className="border-amber-300 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-800">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 mt-0.5 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Data completeness warning</p>
                <p className="text-xs text-amber-700 dark:text-amber-400">{auditData.warning}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AUDIT RESULTS */}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {currentLeaks.map((leak: any) => (
              <Card key={leak.id} className="border-primary/20 shadow-lg shadow-primary/5 hover:border-primary/40 transition-all">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-bold text-sm leading-tight">{leak.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-primary">${(leak.impact || 0).toLocaleString()}</span>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">/mo leak</span>
                      </div>
                    </div>
                    <Badge variant={leak.confidence === "High" ? "default" : "secondary"} className="text-[9px] uppercase tracking-tighter">
                      {leak.confidence} Conf.
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground leading-relaxed">{leak.description}</p>
                    {leak.breakdown && (
                      <p className="text-[10px] text-muted-foreground/90 leading-relaxed">{leak.breakdown}</p>
                    )}
                  </div>
                  <Button size="sm" className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors h-9">
                    {leak.action || 'Fix this'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Monthly Revenue" value={`$${currentSummary.revenue.toLocaleString()}`} icon={DollarSign} color="text-primary" bg="bg-primary/10" />
          <StatCard title="Net Profit" value={`$${currentSummary.profit.toLocaleString()}`} icon={TrendingUp} color="text-green-600" bg="bg-green-500/10" />
          <StatCard title="Profit Margin" value={`${currentSummary.margin}%`} icon={Wallet} color="text-blue-600" bg="bg-blue-500/10" tooltip="Calculated as (Net Profit / Total Revenue) * 100. Target 20% - 35% for local service businesses." />
          <StatCard title="Cash Runway" value={`${currentSummary.runway} Mo`} icon={PiggyBank} color="text-orange-600" bg="bg-orange-500/10" tooltip="Calculated as (Total Cash / Avg Monthly Expenses). How many months you survive if revenue drops to zero." />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-border/50 shadow-sm">
            <CardHeader><CardTitle className="text-lg font-medium">Monthly Trends</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockFinancials.history}>
                    <defs><linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }} />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
                    <Area type="monotone" dataKey="expenses" stroke="hsl(var(--destructive))" strokeWidth={2} fillOpacity={0} name="Expenses" strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader><CardTitle className="text-lg font-bold">Fix this week</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {mockFinancials.weeklyActions.map((action, i) => (
                <div key={i} className="flex gap-3 p-3 bg-card border border-border/50 rounded-lg shadow-sm">
                  <div className="w-5 h-5 mt-0.5 rounded-full border border-primary/30 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-3 h-3 text-primary/30" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold leading-tight">{action.task}</p>
                    <p className="text-[10px] text-primary font-bold mt-1 uppercase tracking-tighter">+${action.impact.toLocaleString()} monthly boost</p>
                  </div>
                </div>
              ))}
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

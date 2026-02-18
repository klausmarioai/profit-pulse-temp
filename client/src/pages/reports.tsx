import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, CheckCircle2, Zap, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ReportsPage() {
  return (
    <Layout>
      <div className="space-y-8 max-w-5xl mx-auto font-sans">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold font-heading">Weekly Report</h1>
              <Badge variant="outline" className="text-[10px] bg-yellow-500/10 text-yellow-600 border-yellow-200 uppercase tracking-tighter">Demo Mode</Badge>
            </div>
            <p className="text-muted-foreground">Prioritized profit plan for local businesses.</p>
          </div>
          <Button><Download className="w-4 h-4 mr-2" /> Download PDF</Button>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900/30 p-4 rounded-xl flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-white shrink-0"><Zap className="w-4 h-4" /></div>
          <p className="text-sm font-bold text-yellow-800 dark:text-yellow-400">
            If you only do one thing this week: <span className="font-normal italic">Pause all supply orders for 14 days to burn through current overstock.</span>
          </p>
        </div>

        <Card className="border-primary/30 bg-primary/5 shadow-xl">
          <CardHeader><CardTitle className="flex items-center gap-2 text-primary font-bold"><Zap className="w-5 h-5" />Do this Monday</CardTitle></CardHeader>
          <CardContent className="grid md:grid-cols-3 gap-4">
            {[
              { title: "Switch Card Processor", impact: 420 },
              { title: "Optimize Technician Routes", impact: 1200 },
              { title: "Adjust Utility Scheduling", impact: 310 }
            ].map((action, i) => (
              <div key={i} className="p-4 bg-card rounded-xl border border-primary/10 shadow-sm hover:border-primary/30 transition-all">
                <p className="text-xs font-bold text-primary mb-1 uppercase tracking-wider">+${action.impact.toLocaleString()} Projected Profit</p>
                <p className="font-bold leading-tight text-sm">{action.title}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader><CardTitle className="text-lg">Key Metrics</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">Profit Margin <Info className="w-3 h-3" /></span>
                    <span className="font-bold">31.5%</span>
                  </div>
                  <div className="w-full bg-secondary h-1.5 rounded-full"><div className="bg-primary h-full w-[31%]" /></div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">Cash Runway <Info className="w-3 h-3" /></span>
                    <span className="font-bold">4.2 Months</span>
                  </div>
                  <div className="w-full bg-secondary h-1.5 rounded-full"><div className="bg-orange-400 h-full w-[42%]" /></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-primary text-primary-foreground p-6 rounded-2xl shadow-lg">
            <h3 className="font-bold text-lg mb-2">Coach's Weekly Note</h3>
            <p className="text-sm opacity-90 leading-relaxed mb-4 italic">
              "You're doing great with labor efficiency, but inventory is sitting too long. Burn through your current stock before ordering more. That's $1k+ back in your pocket instantly."
            </p>
            <div className="flex items-center gap-2 text-xs font-medium opacity-75"><CheckCircle2 className="w-4 h-4" /> Audit Complete</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

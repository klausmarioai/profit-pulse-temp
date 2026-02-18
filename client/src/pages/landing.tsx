import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import heroImage from "@/assets/hero-abstract.png";
import { CheckCircle2, ArrowRight, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl font-heading tracking-tight">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            ProfitPulse AI
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/onboarding">
              <Button>Start Free Profit Leak Audit <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wide mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              HVAC • Med Spa • Dental • Salon
            </div>
            <h1 className="text-5xl md:text-6xl font-bold font-heading tracking-tight text-foreground mb-6 leading-[1.1]">
              Find hidden profit leaks in your <span className="text-primary">business</span> in 10 minutes.
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-lg">
              Upload your financial data and get clear weekly profit insights + the next best actions to grow cash flow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/onboarding">
                <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                  Start Free Profit Leak Audit
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground mt-4 text-center sm:text-left sm:ml-2">Instant results after upload.</p>
            </div>
            <div className="mt-8 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-primary" /> Instant AI Findings
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-primary" /> No Accountants Needed
              </div>
            </div>
          </div>
          
          <div className="relative lg:h-[600px] flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent blur-[100px] rounded-full opacity-50"></div>
            <img src={heroImage} alt="Financial Clarity" className="relative z-10 w-full max-w-lg mx-auto drop-shadow-2xl rounded-2xl" />
          </div>
        </div>
      </section>

      <section className="py-16 border-y border-border/40 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-3xl font-bold text-primary">$4,470</div>
              <p className="text-sm font-medium text-muted-foreground">Avg. Leaks Found Per Audit</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">12.8%</div>
              <p className="text-sm font-medium text-muted-foreground">Avg. Cash Flow Increase</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">&lt; 90 Sec</div>
              <p className="text-sm font-medium text-muted-foreground">To First Discovery</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

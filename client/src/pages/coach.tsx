import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User, AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import aiAvatar from "@/assets/ai-coach-avatar.png";
import { buildCoachContext, buildCoachReply, getDataCompletenessWarnings, type AuditData } from "@/lib/audit-derived";
import { loadAuditData } from "@/lib/audit-storage";

type ChatMessage = { role: "assistant" | "user"; content: string };
const COACH_INPUT_DRAFT_KEY = "profitPulseCoachInputDraft.v1";

export default function CoachPage() {
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", content: "Upload a CSV audit to unlock quantified coaching answers. I can still give general guidance in demo mode." }]);
  const [input, setInput] = useState("");

  useEffect(() => {
    setAuditData(loadAuditData());
    try {
      const draft = localStorage.getItem(COACH_INPUT_DRAFT_KEY);
      if (draft) setInput(draft);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (input.trim()) localStorage.setItem(COACH_INPUT_DRAFT_KEY, input);
      else localStorage.removeItem(COACH_INPUT_DRAFT_KEY);
    } catch {}
  }, [input]);

  const coachContext = useMemo(() => buildCoachContext(auditData), [auditData]);
  const warnings = useMemo(() => getDataCompletenessWarnings(auditData), [auditData]);

  useEffect(() => {
    if (!auditData) return;
    const topLeak = coachContext.topLeak;
    setMessages([{
      role: "assistant",
      content: `I've loaded your latest CSV audit.\n\n${coachContext.summary}\n\nTop leak right now: **${topLeak?.name || "Not enough data"}**${topLeak?.impact ? ` (~$${topLeak.impact.toLocaleString()}/mo)` : ""}. Ask me what to fix first and I'll prioritize it.`,
    }]);
  }, [auditData, coachContext]);

  const handleSend = (text?: string) => {
    const val = text || input;
    if (!val.trim()) return;

    setMessages(prev => [...prev, { role: "user", content: val }]);
    setInput("");
    localStorage.removeItem(COACH_INPUT_DRAFT_KEY);

    setTimeout(() => {
      setMessages(prev => [...prev, { role: "assistant", content: buildCoachReply(val, auditData) }]);
    }, 250);
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-8rem)] flex flex-col max-w-4xl mx-auto font-sans">
        <div className="mb-6">
          <h1 className="text-3xl font-bold font-heading">AI Business Coach</h1>
          <p className="text-muted-foreground">Get prioritized actions to recover profit now.</p>
        </div>

        {warnings.length > 0 && (
          <div className="mb-4 border border-amber-300 bg-amber-50/70 dark:bg-amber-950/20 rounded-lg p-3 flex gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Limited data quality</p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400">{warnings[0]}</p>
            </div>
          </div>
        )}

        <div className="flex-1 bg-card border border-border/50 rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${msg.role === 'assistant' ? 'bg-white border-primary/20' : 'bg-slate-100'}`}>
                    {msg.role === 'assistant' ? <img src={aiAvatar} className="w-8 h-8" /> : <User className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${msg.role === 'assistant' ? 'bg-white border border-border/50' : 'bg-primary text-primary-foreground'}`}>
                    <div className="whitespace-pre-wrap prose prose-sm dark:prose-invert leading-relaxed">{msg.content}</div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 bg-background border-t">
            <div className="flex gap-2">
              <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask about profit, hiring, or cuts..." className="flex-1" />
              <Button onClick={() => handleSend()} size="icon" className="rounded-full shrink-0"><Send className="w-4 h-4" /></Button>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {coachContext.prompts.map((q) => (
                <button key={q} onClick={() => handleSend(q)} className="text-[10px] px-3 py-1.5 bg-muted/50 hover:bg-muted text-muted-foreground rounded-full border border-border/50 whitespace-nowrap transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

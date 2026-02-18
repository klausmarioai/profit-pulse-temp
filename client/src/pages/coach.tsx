import Layout from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { chatHistory } from "@/lib/mock-data";
import { Send, User } from "lucide-react";
import { useState } from "react";
import aiAvatar from "@/assets/ai-coach-avatar.png";

export default function CoachPage() {
  const [messages, setMessages] = useState(chatHistory);
  const [input, setInput] = useState("");

  const handleSend = (text?: string) => {
    const val = text || input;
    if (!val.trim()) return;
    
    setMessages(prev => [...prev, { role: "user", content: val }]);
    setInput("");

    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "**Recommendation:** Based on your current financials, you should switch your card processor. You're losing $420/mo in excess merchant fees.\n\n**Expected Impact:** +$5,040 Annual Profit.\n\n**Assumptions:** Static revenue volume, 0.8% fee reduction.\n\n**Risk Note:** Low. Most processors offer month-to-month contracts for local businesses."
      }]);
    }, 1000);
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-8rem)] flex flex-col max-w-4xl mx-auto font-sans">
        <div className="mb-6">
          <h1 className="text-3xl font-bold font-heading">AI Business Coach</h1>
          <p className="text-muted-foreground">Get prioritized actions to recover profit now.</p>
        </div>

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
              {["Where am I leaking profit right now?", "What should I fix first this week?", "Can I afford to hire another staff member?", "What expenses should I cut first?"].map((q) => (
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

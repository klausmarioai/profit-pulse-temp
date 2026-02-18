import { Zap, TrendingUp, AlertTriangle, PiggyBank, ArrowUpRight, ArrowDownRight, ShieldCheck, CheckCircle2 } from "lucide-react";

export const mockFinancials = {
  summary: {
    revenue: 124500,
    expenses: 85200,
    profit: 39300,
    margin: 31.5,
    runway: 4.2, // months
    taxSetAside: 11790, // 30% of profit
    cashOnHand: 42000,
  },
  history: [
    { month: "Jan", revenue: 98000, expenses: 82000 },
    { month: "Feb", revenue: 105000, expenses: 81000 },
    { month: "Mar", revenue: 110000, expenses: 84000 },
    { month: "Apr", revenue: 108000, expenses: 86000 },
    { month: "May", revenue: 115000, expenses: 83000 },
    { month: "Jun", revenue: 124500, expenses: 85200 },
  ],
  leaks: [
    {
      id: 1,
      name: "Inventory Overstock (Supplies)",
      impact: 1250,
      confidence: "High",
      description: "Excess supply orders detected. You have 4 months of backstock for high-cost consumables.",
      action: "Pause supply orders for 30 days"
    },
    {
      id: 2,
      name: "Merchant Fee Bloat",
      impact: 420,
      confidence: "Med",
      description: "Found 3.2% effective rate on card processing. Industry benchmark for local service is 2.4%.",
      action: "Switch to integrated processor"
    },
    {
      id: 3,
      name: "Idle Technician Hours",
      impact: 2800,
      confidence: "High",
      description: "Technician utilization is at 62%. Increasing this to 75% adds $2.8k in monthly profit.",
      action: "Optimize scheduling density"
    }
  ],
  weeklyActions: [
    { task: "Cancel 'Premium Appointment Reminders' (Duplicate with CRM)", impact: 85 },
    { task: "Renegotiate linen/towel service contract", impact: 120 },
    { task: "Consolidate Friday morning shifts to reduce utility costs", impact: 310 }
  ],
  spendingCategories: [
    { name: "Payroll", amount: 45000, color: "bg-primary" },
    { name: "Supplies & Inventory", amount: 15000, color: "bg-blue-400" },
    { name: "Marketing (Local)", amount: 5500, color: "bg-orange-400" },
    { name: "Rent / Utilities", amount: 8000, color: "bg-slate-400" },
    { name: "Software / POS", amount: 2200, color: "bg-purple-400" },
    { name: "Other", amount: 9500, color: "bg-gray-300" },
  ],
  insights: [
    {
      id: 1,
      type: "leak",
      title: "Inventory Leak Detected",
      message: "Spending on supplies is 4% higher than industry average for your revenue range.",
      impact: "-$1,250/mo",
      icon: AlertTriangle,
      color: "text-orange-500",
      bg: "bg-orange-500/10"
    },
    {
      id: 2,
      type: "trend",
      title: "Profit Efficiency Increasing",
      message: "Average ticket size is up 12% this month without increasing labor costs.",
      impact: "+12% Efficiency",
      icon: TrendingUp,
      color: "text-green-500",
      bg: "bg-green-500/10"
    },
    {
      id: 3,
      type: "opportunity",
      title: "Staffing Opportunity",
      message: "Current technician/staff utilization is at 88%. You have room to hire 1 more person.",
      impact: "+$4k/mo Revenue",
      icon: PiggyBank,
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    }
  ],
  transactions: [
    { id: 1, date: "Today", description: "Square Payout", amount: 4250.00, type: "income" },
    { id: 2, date: "Yesterday", description: "Henry Schein Supplies", amount: -1450.20, type: "expense" },
    { id: 3, date: "Yesterday", description: "Staff Payroll", amount: -12500.00, type: "expense" },
    { id: 4, date: "Jun 12", description: "Local Google Ads", amount: -850.00, type: "expense" },
    { id: 5, date: "Jun 10", description: "Utility Bill - Electric", amount: -640.00, type: "expense" },
  ]
};

export const chatHistory = [
  { 
    role: "assistant", 
    content: "Hello! I'm your ProfitPulse AI coach. I've analyzed your local business financials. Ready to find some profit leaks?" 
  },
  { 
    role: "user", 
    content: "Can I afford to hire another technician for $4k/mo?" 
  },
  { 
    role: "assistant", 
    content: "**Recommendation:** Yes, your current utilization of 88% means you are turning away work. Hiring another tech for $4k/mo is highly recommended.\n\n**Expected Impact:** +$12k Revenue, +$5k Net Profit (after materials).\n\n**Assumptions:** New tech reaches 60% capacity in Month 1. Static overhead.\n\n**Risk Note:** If lead flow drops by 20%, the new tech's cost will pressure your current 31.5% margin." 
  }
];

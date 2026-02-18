import fs from 'fs';
import Papa from 'papaparse';

function runAudit(csvPath, mappings) {
  const csvText = fs.readFileSync(csvPath, 'utf8');
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  const parsedData = parsed.data;

  const hasAmount = Boolean(mappings.amount);
  const hasCreditDebit = Boolean(mappings.credit && mappings.debit);
  if (!mappings.date || (!hasAmount && !hasCreditDebit)) throw new Error('Missing mappings');

  const expensesByCategory = {};
  let totalRevenue = 0;
  let totalExpenses = 0;
  let revenueRows = 0;
  let expenseRows = 0;
  const monthlyBuckets = {};

  const parseMoney = (val) => {
    const n = parseFloat(String(val ?? '0').replace(/[$,]/g, ''));
    return Number.isFinite(n) ? n : 0;
  };

  const inferCategory = (row) => row[mappings.category] || row[mappings.description] || 'Uncategorized';

  const getMonthLabel = (row) => {
    const rawDate = row[mappings.date];
    const d = rawDate ? new Date(rawDate) : null;
    if (!d || Number.isNaN(d.getTime())) return 'Unknown';
    return d.toLocaleString('en-US', { month: 'short' });
  };

  const getMonthSortKey = (row) => {
    const rawDate = row[mappings.date];
    const d = rawDate ? new Date(rawDate) : null;
    if (!d || Number.isNaN(d.getTime())) return Number.MAX_SAFE_INTEGER;
    return d.getFullYear() * 100 + (d.getMonth() + 1);
  };

  const classifyTransaction = (row) => {
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

    if (!Number.isFinite(amt) || amt === 0) return { valid: false, amt: 0, isExpense: false };

    const cat = String(inferCategory(row) || '').toLowerCase();
    const desc = String(row[mappings.description] || '').toLowerCase();
    const text = `${cat} ${desc}`;

    const incomeHint = /client payment|payout|deposit|income|sale|revenue|invoice paid|received/i.test(text);
    const expenseHint = /expense|bill|fee|rent|utility|suppl|payroll|tax|insurance|subscription|software|vendor|purchase|withdraw/i.test(text);

    let isExpense = false;

    if (!hasAmount) {
      if (debit > 0 && credit === 0) isExpense = true;
      else if (credit > 0 && debit === 0) isExpense = false;
      else isExpense = amt < 0;
    } else {
      if (amt < 0) isExpense = true;
      else if (incomeHint) isExpense = false;
      else if (expenseHint) isExpense = true;
      else isExpense = false;
    }

    return { valid: true, amt, isExpense };
  };

  const categoryRows = {};
  const totalRows = Math.max(parsedData.length, 1);

  for (const row of parsedData) {
    const tx = classifyTransaction(row);
    if (!tx.valid) continue;

    const cat = inferCategory(row);
    const absoluteAmt = Math.abs(tx.amt);
    const month = getMonthLabel(row);
    const sortKey = getMonthSortKey(row);

    if (!monthlyBuckets[month]) monthlyBuckets[month] = { revenue: 0, expenses: 0, sortKey };

    if (tx.isExpense) {
      expenseRows += 1;
      totalExpenses += absoluteAmt;
      expensesByCategory[cat] = (expensesByCategory[cat] || 0) + absoluteAmt;
      monthlyBuckets[month].expenses += absoluteAmt;
      if (!categoryRows[cat]) categoryRows[cat] = [];
      categoryRows[cat].push(absoluteAmt);
    } else {
      revenueRows += 1;
      totalRevenue += absoluteAmt;
      monthlyBuckets[month].revenue += absoluteAmt;
    }
  }

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const leaks = Object.entries(expensesByCategory)
    .map(([name, total], idx) => {
      const rows = categoryRows[name] || [];
      const txCount = rows.length;
      const mean = txCount ? rows.reduce((a, b) => a + b, 0) / txCount : 0;
      const variance = txCount ? rows.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / txCount : 0;
      const stdDev = Math.sqrt(variance);
      const recurrenceRatio = txCount / totalRows;
      const recurrenceBoost = clamp(recurrenceRatio * 0.08, 0, 0.08);
      const volatilityRatio = mean > 0 ? stdDev / mean : 0;
      const volatilityBoost = clamp(volatilityRatio * 0.05, 0, 0.05);
      const baseRate = 0.10;
      const savingsRate = clamp(baseRate + recurrenceBoost + volatilityBoost, 0.08, 0.23);
      const impact = Math.round(total * savingsRate);

      let confidence = 'Low';
      if (txCount >= 3 && total >= 800) confidence = 'High';
      else if (txCount >= 2 && total >= 300) confidence = 'Med';

      return { id: idx + 1, name: `${name} Efficiency`, impact, confidence };
    })
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3);

  const computedMargin = totalRevenue > 0 ? Math.round(((totalRevenue - totalExpenses) / totalRevenue) * 100) : 0;
  const history = Object.entries(monthlyBuckets)
    .map(([month, v]) => ({ month, revenue: Math.round(v.revenue * 100) / 100, expenses: Math.round(v.expenses * 100) / 100, sortKey: v.sortKey }))
    .sort((a, b) => a.sortKey - b.sortKey)
    .slice(-6)
    .map(({ sortKey, ...rest }) => rest);

  let auditWarning = '';
  if (revenueRows > 0 && expenseRows === 0) {
    auditWarning = 'Revenue-only dataset detected. Upload bank/P&L expenses for accurate leak findings and margin.';
  } else if (expenseRows > 0 && revenueRows === 0) {
    auditWarning = 'Expense-only dataset detected. Upload revenue data for accurate margin and full audit insights.';
  }

  return {
    rows: parsedData.length,
    revenueRows,
    expenseRows,
    revenue: Math.round(totalRevenue),
    expenses: Math.round(totalExpenses),
    margin: computedMargin,
    warning: auditWarning,
    leaks,
    history,
  };
}

const files = [
  {
    label: '01-clean-transactions.csv',
    path: 'C:/Users/klaus/Downloads/01-clean-transactions.csv',
    mappings: { date: 'Date', description: 'Description', amount: 'Amount', credit: '', debit: '', category: 'Category' },
  },
  {
    label: 'sample_pos_export.csv',
    path: 'C:/Users/klaus/Downloads/sample_pos_export.csv',
    mappings: { date: 'Date', description: 'Item', amount: 'Total_Amount', credit: '', debit: '', category: 'Category' },
  },
];

for (const f of files) {
  const out = runAudit(f.path, f.mappings);
  console.log(`\n=== ${f.label} ===`);
  console.log(JSON.stringify(out, null, 2));
}

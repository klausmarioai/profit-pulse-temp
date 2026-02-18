# CSV Test Pack (App Validation)

Use this pack to quickly validate onboarding CSV parsing + audit behavior.

## Files

1. `01-clean-transactions.csv`
   - Clean headers: `Date, Description, Category, Amount`
   - Expected: parses cleanly, detects revenue + expense categories, shows top leaks.

2. `02-messy-headers-credit-debit.csv`
   - Messy headers + separate `debit/credit` columns
   - Expected: auto-detection should map date/description/category/amount logic from credit/debit.

3. `03-broken-empty-missing-amount.csv`
   - Missing amount columns entirely
   - Expected: robust validation error (cannot compute audit from missing amount).

## Quick QA Flow

- Upload `01` → confirm successful parse + realistic audit output
- Upload `02` → confirm header mapping resilience + sane totals
- Upload `03` → confirm user-friendly error + fallback guidance

## Pass Criteria

- No crashes on any file
- Clear error messages on invalid data
- Successful files produce understandable “Top 3 profit leaks”
- Demo Mode remains usable when parsing fails

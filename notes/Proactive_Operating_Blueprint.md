# Proactive Operating Blueprint (Mario + Klaus)

## Purpose
Create a low-noise, high-output proactive system that supports core goals without spam or drift.

---

## 1) Heartbeat Policy (always-on, judgment based)

### Heartbeat should only alert when one of these is true:
1. A blocker is preventing progress on active priorities.
2. A scheduled task failed 2+ times in a row.
3. A time-sensitive decision from Mario is needed.

### Heartbeat should stay quiet when:
- No urgent action is required.
- Information is interesting but not actionable now.

### Heartbeat alert format:
- **Issue:**
- **Impact:**
- **Next best action:**
- **Need from Mario:**

---

## 2) Recurring Cadence (Cron)

## Weekdays — Morning Planning Reminder
- Time: 6:05 AM EST (Mon-Fri)
- Outcome: lock today’s top 3 priorities + one high-leverage action.

## Weekdays — Evening Review Reminder
- Time: 7:45 PM EST (Mon-Fri)
- Outcome: done/not-done/carry-forward + blocker notes.

## Friday — Weekly Review Reminder
- Time: 6:30 PM EST
- Outcome: score week, top lessons, next week first 3 actions.

---

## 3) Operating Rules (future-proof)

1. **Separate lanes:**
   - FFWM (core business) and App (side experiment) are independent tracks.
2. **Side-bet discipline:**
   - App gets fixed time-box (60–90 min/day) until validation threshold is met.
3. **No noisy proactivity:**
   - One useful update beats 10 reactive pings.
4. **Evidence > claims:**
   - Prefer measurable outputs (users tested, completion rate, blockers cleared).
5. **Decision hygiene:**
   - Escalate only when Mario’s decision is required.

---

## 4) Suggested Automation Backlog (next)

1. Daily validation scorecard generator (app test metrics).
2. Structured tester-feedback capture template auto-fill.
3. Weekly project snapshot export (Now / Next / Blocked / Done).

---

## 5) Success Conditions

This system is working if:
- Mario gets fewer but higher-value alerts.
- Daily priorities are clear before work starts.
- Weekly review consistently produces next actions.
- Side experiments stay controlled and measurable.

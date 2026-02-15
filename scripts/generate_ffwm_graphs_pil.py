from PIL import Image, ImageDraw, ImageFont
import os

OUT = r"C:/Users/klaus/.openclaw/workspace-main/assets/ffwm_graphs"
os.makedirs(OUT, exist_ok=True)
W, H = 1080, 1920

GREEN = (34, 197, 94, 255)
GREEN2 = (22, 163, 74, 255)
GREEN3 = (74, 222, 128, 255)
WHITE = (248, 250, 252, 255)
GRAY = (148, 163, 184, 255)
SLATE = (51, 65, 85, 255)
SLATE2 = (71, 85, 105, 255)

# V2: larger text for mobile readability
font_title = ImageFont.truetype("arial.ttf", 56)
font_sub = ImageFont.truetype("arial.ttf", 44)
font_body = ImageFont.truetype("arial.ttf", 34)
font_small = ImageFont.truetype("arial.ttf", 30)

def new_canvas():
    return Image.new("RGBA", (W, H), (0, 0, 0, 0))

def centered(draw, y, text, font, fill=WHITE):
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) // 2, y), text, font=font, fill=fill)

def save(img, name):
    img.save(os.path.join(OUT, name), "PNG")

# 1) Debt balances bar chart
img = new_canvas(); d = ImageDraw.Draw(img)
centered(d, 70, "Debt Balances (Smallest → Largest)", font_title)
left, right, top, bottom = 110, 980, 360, 1500

d.line((left, bottom, left, top), fill=GRAY, width=4)
d.line((left, bottom, right, bottom), fill=GRAY, width=4)

vals = [500, 1200, 3000, 8000]
labels = ["$500", "$1,200", "$3,000", "$8,000"]
maxv = 9000
bar_w, gap = 135, 70
x = left + 35

for i, v in enumerate(vals):
    h = (v / maxv) * (bottom - top)
    y = bottom - h
    color = GREEN if i == 0 else SLATE
    d.rectangle((x, y, x + bar_w, bottom), fill=color)

    t = f"${v:,}"
    tw = d.textlength(t, font=font_small)
    d.text((x + (bar_w - tw) / 2, y - 44), t, font=font_small, fill=WHITE)

    tw = d.textlength(labels[i], font=font_small)
    d.text((x + (bar_w - tw) / 2, bottom + 20), labels[i], font=font_small, fill=WHITE)
    x += bar_w + gap

# annotation
d.line((330, 780, 220, 980), fill=GREEN, width=7)
d.polygon([(212, 980), (228, 966), (230, 990)], fill=GREEN)
d.text((350, 720), "Attack this first", font=font_sub, fill=GREEN)
save(img, "01_debt_balances_bar.png")

# 2) Momentum line chart
img = new_canvas(); d = ImageDraw.Draw(img)
centered(d, 70, "Momentum: Wins Over Time", font_title)
left, right, top, bottom = 120, 980, 360, 1490

d.line((left, bottom, left, top), fill=GRAY, width=4)
d.line((left, bottom, right, bottom), fill=GRAY, width=4)

for i in range(0, 7):
    y = bottom - (i / 6) * (bottom - top)
    d.line((left, y, right, y), fill=(51, 65, 85, 90), width=1)
    d.text((68, y - 14), str(i), font=font_small, fill=WHITE)

months = list(range(1, 13))
debts = [0, 1, 2, 2, 3, 3, 4, 4, 4, 5, 5, 6]
pts = []
for m, val in zip(months, debts):
    x = left + (m - 1) / 11 * (right - left)
    y = bottom - (val / 6) * (bottom - top)
    pts.append((x, y))

for i in range(len(pts) - 1):
    d.line((pts[i], pts[i + 1]), fill=GREEN, width=7)
for x, y in pts:
    d.ellipse((x - 9, y - 9, x + 9, y + 9), fill=GREEN)

# early jump callout
d.rounded_rectangle((left + 10, top + 10, left + 325, top + 150), radius=16, fill=(74, 222, 128, 35), outline=GREEN3, width=3)
d.text((left + 25, top + 30), "Early jump\n(1–2 debts gone)", font=font_small, fill=GREEN3)
centered(d, 1535, "Months", font_sub)
d.text((15, 860), "Debts\nPaid", font=font_small, fill=WHITE)
save(img, "02_momentum_line.png")

# 3) Payment roll-up bars
img = new_canvas(); d = ImageDraw.Draw(img)
centered(d, 70, "Payment Roll-up (Snowball Effect)", font_title)
left, right, top, bottom = 120, 980, 390, 1500

d.line((left, bottom, left, top), fill=GRAY, width=4)
d.line((left, bottom, right, bottom), fill=GRAY, width=4)

vals = [200, 260, 380]
labs = ["Month 1\nExtra", "After 1st\nDebt Cleared", "After 2nd\nDebt Cleared"]
cols = [GREEN2, GREEN, GREEN3]
maxv = 450
bar_w, gap = 180, 95
x = left + 70

for v, lab, c in zip(vals, labs, cols):
    h = (v / maxv) * (bottom - top)
    y = bottom - h
    d.rectangle((x, y, x + bar_w, bottom), fill=c)

    t = f"${v}"
    tw = d.textlength(t, font=font_sub)
    d.text((x + (bar_w - tw) / 2, y - 48), t, font=font_sub, fill=WHITE)

    l1, l2 = lab.split("\n")
    tw = d.textlength(l1, font=font_small)
    d.text((x + (bar_w - tw) / 2, bottom + 20), l1, font=font_small, fill=WHITE)
    tw = d.textlength(l2, font=font_small)
    d.text((x + (bar_w - tw) / 2, bottom + 56), l2, font=font_small, fill=WHITE)
    x += bar_w + gap

d.text((130, 280), "Snowball gets bigger every win", font=font_sub, fill=GREEN3)
save(img, "03_payment_rollup_bars.png")

# 4) Behavior vs math split bars
img = new_canvas(); d = ImageDraw.Draw(img)
centered(d, 80, "Behavior vs Math", font_title)
left, right, top, bottom = 170, 930, 380, 1500

d.line((left, bottom, left, top), fill=GRAY, width=4)
d.line((left, bottom, right, bottom), fill=GRAY, width=4)

vals = [78, 92]
labs = ["Best math\n(Avalanche)", "Best follow-through\n(Snowball)"]
cols = [SLATE2, GREEN]
maxv = 100
bar_w = 235
x = 235

for v, lab, c in zip(vals, labs, cols):
    h = (v / maxv) * (bottom - top)
    y = bottom - h
    d.rectangle((x, y, x + bar_w, bottom), fill=c)

    t = f"{v}%"
    tw = d.textlength(t, font=font_sub)
    d.text((x + (bar_w - tw) / 2, y - 50), t, font=font_sub, fill=WHITE)

    a, b = lab.split("\n")
    tw = d.textlength(a, font=font_small)
    d.text((x + (bar_w - tw) / 2, bottom + 20), a, font=font_small, fill=WHITE)
    tw = d.textlength(b, font=font_small)
    d.text((x + (bar_w - tw) / 2, bottom + 56), b, font=font_small, fill=WHITE)
    x += 335

save(img, "04_behavior_vs_math_bars.png")

# 5) Before/after pie chart (fixed overlap)
img = new_canvas(); d = ImageDraw.Draw(img)
centered(d, 70, "Cash Flow Shift", font_title)

def pie(cx, cy, r, vals, cols):
    total = sum(vals)
    start = 110
    for v, c in zip(vals, cols):
        end = start + 360 * v / total
        d.pieslice((cx - r, cy - r, cx + r, cy + r), start, end, fill=c)
        start = end

cols = [SLATE, (100, 116, 139, 255), GREEN, (148, 163, 184, 255)]
before = [55, 20, 15, 10]
after = [25, 30, 25, 20]

# move pies down and labels above each pie to avoid overlap
d.text((245, 320), "Before", font=font_sub, fill=WHITE)
d.text((700, 320), "After", font=font_sub, fill=WHITE)
pie(330, 780, 220, before, cols)
pie(750, 780, 220, after, cols)

centered(d, 1080, "Debt-free creates margin", font_sub, fill=GREEN3)

legend = ["Debt Payments", "Needs", "Savings/Investing", "Wants"]
ly = 1250
for i, (name, c) in enumerate(zip(legend, cols)):
    x = 120 + (i % 2) * 450
    y = ly + (i // 2) * 72
    d.rectangle((x, y, x + 30, y + 30), fill=c)
    d.text((x + 42, y - 1), name, font=font_small, fill=WHITE)

save(img, "05_before_after_cashflow_pie.png")

print("Created:")
for f in sorted(os.listdir(OUT)):
    print(f)

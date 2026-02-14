from PIL import Image, ImageDraw, ImageFont
import os, math

OUT = r"C:/Users/klaus/.openclaw/workspace-main/assets/ffwm_graphs"
os.makedirs(OUT, exist_ok=True)
W,H = 1080,1920

GREEN=(34,197,94,255)
GREEN2=(22,163,74,255)
GREEN3=(74,222,128,255)
WHITE=(248,250,252,255)
GRAY=(148,163,184,255)
SLATE=(51,65,85,255)
SLATE2=(71,85,105,255)

font_title = ImageFont.truetype("arial.ttf", 58)
font_sub = ImageFont.truetype("arial.ttf", 38)
font_body = ImageFont.truetype("arial.ttf", 30)
font_small = ImageFont.truetype("arial.ttf", 24)

def new_canvas():
    return Image.new("RGBA", (W,H), (0,0,0,0))

def centered(draw, y, text, font, fill=WHITE):
    tw, th = draw.textbbox((0,0), text, font=font)[2:]
    draw.text(((W-tw)//2, y), text, font=font, fill=fill)

def save(img, name):
    img.save(os.path.join(OUT, name), "PNG")

# 1 Bar chart
img = new_canvas(); d=ImageDraw.Draw(img)
centered(d, 70, "Debt Balances (Smallest  Largest)", font_title)
left,right,top,bottom = 120,980,320,1480
# axes
d.line((left,bottom,left,top), fill=GRAY, width=4)
d.line((left,bottom,right,bottom), fill=GRAY, width=4)
vals=[500,1200,3000,8000]
labels=["$500","$1,200","$3,000","$8,000"]
maxv=9000
bar_w=130; gap=65
x=left+45
for i,v in enumerate(vals):
    h=(v/maxv)*(bottom-top)
    y=bottom-h
    color=GREEN if i==0 else SLATE
    d.rectangle((x,y,x+bar_w,bottom), fill=color)
    d.text((x+20,bottom+18), labels[i], font=font_small, fill=WHITE)
    t=f"${v:,}"; tw=d.textlength(t,font=font_small)
    d.text((x+(bar_w-tw)/2,y-36), t, font=font_small, fill=WHITE)
    x += bar_w+gap
# arrow-ish annotation
d.line((300,760,210,960), fill=GREEN, width=6)
d.polygon([(205,960),(220,948),(220,972)], fill=GREEN)
d.text((315,700), "Attack this first", font=font_sub, fill=GREEN)
save(img, "01_debt_balances_bar.png")

# 2 Momentum line
img = new_canvas(); d=ImageDraw.Draw(img)
centered(d, 70, "Momentum: Wins Over Time", font_title)
left,right,top,bottom = 120,980,320,1480
d.line((left,bottom,left,top), fill=GRAY, width=4)
d.line((left,bottom,right,bottom), fill=GRAY, width=4)
for i in range(0,7):
    y = bottom - (i/6)*(bottom-top)
    d.line((left,y,right,y), fill=(51,65,85,90), width=1)
    d.text((70,y-12), str(i), font=font_small, fill=WHITE)
months=list(range(1,13)); debts=[0,1,2,2,3,3,4,4,4,5,5,6]
pts=[]
for m,val in zip(months,debts):
    x=left + (m-1)/(11)*(right-left)
    y=bottom - (val/6)*(bottom-top)
    pts.append((x,y))
for i in range(len(pts)-1):
    d.line((pts[i],pts[i+1]), fill=GREEN, width=6)
for x,y in pts:
    d.ellipse((x-8,y-8,x+8,y+8), fill=GREEN)
d.rectangle((left+10,top+10,left+250,top+120), fill=(74,222,128,40), outline=GREEN3, width=2)
d.text((left+20,top+25), "Early jump\n(12 debts gone)", font=font_small, fill=GREEN3)
centered(d, 1530, "Months", font_sub)
d.text((20,860), "Debts\nPaid", font=font_small, fill=WHITE)
save(img, "02_momentum_line.png")

# 3 Roll-up bars
img = new_canvas(); d=ImageDraw.Draw(img)
centered(d, 70, "Payment Roll-up (Snowball Effect)", font_title)
left,right,top,bottom = 120,980,350,1480
d.line((left,bottom,left,top), fill=GRAY, width=4)
d.line((left,bottom,right,bottom), fill=GRAY, width=4)
vals=[200,260,380]
labs=["Month 1\nExtra","After 1st\nCleared","After 2nd\nCleared"]
cols=[GREEN2,GREEN,GREEN3]
maxv=450
bar_w=180; gap=95
x=left+70
for v,lab,c in zip(vals,labs,cols):
    h=(v/maxv)*(bottom-top)
    y=bottom-h
    d.rectangle((x,y,x+bar_w,bottom), fill=c)
    t=f"${v}"; tw=d.textlength(t,font=font_sub)
    d.text((x+(bar_w-tw)/2,y-45), t, font=font_sub, fill=WHITE)
    for li,j in zip(lab.split("\n"), range(2)):
        tw=d.textlength(li,font=font_small)
        d.text((x+(bar_w-tw)/2,bottom+20+j*28), li, font=font_small, fill=WHITE)
    x+=bar_w+gap
d.text((170,240), "Snowball gets bigger every win", font=font_sub, fill=GREEN3)
save(img, "03_payment_rollup_bars.png")

# 4 behavior vs math
img = new_canvas(); d=ImageDraw.Draw(img)
centered(d, 80, "Behavior vs Math", font_title)
left,right,top,bottom = 170,930,360,1480
d.line((left,bottom,left,top), fill=GRAY, width=4)
d.line((left,bottom,right,bottom), fill=GRAY, width=4)
vals=[78,92]
labs=["Best math\n(Avalanche)","Best follow-through\n(Snowball)"]
cols=[SLATE2,GREEN]
maxv=100
bar_w=230
x=240
for v,lab,c in zip(vals,labs,cols):
    h=(v/maxv)*(bottom-top)
    y=bottom-h
    d.rectangle((x,y,x+bar_w,bottom), fill=c)
    t=f"{v}%"; tw=d.textlength(t,font=font_sub)
    d.text((x+(bar_w-tw)/2,y-45), t, font=font_sub, fill=WHITE)
    a,b=lab.split("\n")
    tw=d.textlength(a,font=font_small); d.text((x+(bar_w-tw)/2,bottom+20),a,font=font_small,fill=WHITE)
    tw=d.textlength(b,font=font_small); d.text((x+(bar_w-tw)/2,bottom+50),b,font=font_small,fill=WHITE)
    x += 330
save(img, "04_behavior_vs_math_bars.png")

# 5 before after pie
img = new_canvas(); d=ImageDraw.Draw(img)
centered(d, 80, "Cash Flow Shift", font_title)

def pie(cx,cy,r,vals,cols):
    total=sum(vals); start=110
    for v,c in zip(vals,cols):
        end=start+360*v/total
        d.pieslice((cx-r,cy-r,cx+r,cy+r), start, end, fill=c)
        start=end

cols=[SLATE, (100,116,139,255), GREEN, (148,163,184,255)]
before=[55,20,15,10]; after=[25,30,25,20]
pie(330,760,220,before,cols)
pie(750,760,220,after,cols)
centered(d, 1020, "Debt-free creates margin", font_sub, fill=GREEN3)
d.text((250,1010), "Before", font=font_sub, fill=WHITE)
d.text((690,1010), "After", font=font_sub, fill=WHITE)
legend=["Debt Payments","Needs","Savings/Investing","Wants"]
ly=1240
for i,(name,c) in enumerate(zip(legend,cols)):
    x=150 + (i%2)*420
    y=ly + (i//2)*60
    d.rectangle((x,y,x+26,y+26), fill=c)
    d.text((x+40,y-2), name, font=font_small, fill=WHITE)
save(img, "05_before_after_cashflow_pie.png")

print("Created:")
for f in sorted(os.listdir(OUT)):
    print(f)

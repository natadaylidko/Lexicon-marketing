"""Carousel «Английский в аэропорту» — style «предмет темы»: boarding pass.
usage: python carousel_boarding.py <BASE with logo/> <OUT dir>"""
import sys, subprocess, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
BASE, OUT = sys.argv[1], sys.argv[2]
W, H = 1080, 1350
def inter(w, s): return ImageFont.truetype(f"/usr/share/fonts/opentype/inter/Inter-{w}.otf", s)
def ttf(name, s): return ImageFont.truetype(subprocess.run(["fc-match", "-f", "%{file}", name], capture_output=True, text=True).stdout, s)
MONO_B = lambda s: ttf("DejaVu Sans Mono:bold", s); MONO = lambda s: ttf("DejaVu Sans Mono", s)
SYM = lambda s: ttf("DejaVu Sans:bold", s)
INK, GREY, RED, GOLD = (36, 36, 40), (118, 118, 124), (205, 60, 60), (255, 210, 120)
ORNG, NAVY, PAPER = (255, 150, 60), (24, 46, 78), (252, 250, 244)
yy, xx = np.mgrid[0:H, 0:W]
def bg():
    t = yy[..., None] / H
    a = np.array((24, 128, 120)) * (1 - t) + np.array((14, 84, 92)) * t
    a = a + np.exp(-(((xx - 180) / 420) ** 2 + ((yy - 160) / 420) ** 2))[..., None] * np.array((120, 255, 220)) * 0.22
    a = a + np.exp(-(((xx - 980) / 380) ** 2 + ((yy - 1250) / 380) ** 2))[..., None] * np.array((255, 190, 90)) * 0.18
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).convert("RGBA")
def logo(size):
    im = Image.open(f"{BASE}/logo/mindbyte-logo.jpeg").convert("RGB"); s = min(im.size)
    im = im.crop(((im.width - s) // 2, (im.height - s) // 2, (im.width + s) // 2, (im.height + s) // 2)); z = int(s / 1.25); o = (s - z) // 2
    im = im.crop((o, o, o + z, o + z)).resize((size, size), Image.LANCZOS).convert("RGBA")
    m = Image.new("L", (size * 4, size * 4), 0); ImageDraw.Draw(m).ellipse([0, 0, size * 4 - 1, size * 4 - 1], fill=255); im.putalpha(m.resize((size, size), Image.LANCZOS)); return im
def brand(im, d, n=None, total=None):
    im.alpha_composite(logo(56), (80, H - 110)); d.text((150, H - 82), "Lexicon", font=inter("Bold", 30), fill="white", anchor="lm")
    if n: d.text((W - 80, H - 82), f"{n}/{total}", font=inter("Medium", 28), fill=(200, 235, 228), anchor="rm")
def card(w, h, head_h):
    """boarding pass: rounded card, navy header band. returns image + draw"""
    P = Image.new("RGBA", (w, h), (0, 0, 0, 0)); pd = ImageDraw.Draw(P)
    pd.rounded_rectangle([0, 0, w - 1, h - 1], radius=34, fill=PAPER)
    pd.rounded_rectangle([0, 0, w - 1, head_h], radius=34, fill=NAVY); pd.rectangle([0, head_h - 40, w - 1, head_h], fill=NAVY)
    return P, pd
def perforation(P, pd, y):
    w = P.width; r = 26
    for x in range(56, w - 56, 26): pd.rectangle([x, y - 2, x + 12, y + 2], fill=(190, 190, 190))
    pd.ellipse([-r, y - r, r, y + r], fill=(0, 0, 0, 0)); pd.ellipse([w - r, y - r, w + r, y + r], fill=(0, 0, 0, 0))
def place(im, P, x, y, ang):
    pad = 60; L = Image.new("RGBA", (P.width + pad * 2, P.height + pad * 2), (0, 0, 0, 0)); L.alpha_composite(P, (pad, pad))
    sh = Image.new("RGBA", L.size, (0, 0, 0, 0)); sh.putalpha(L.split()[3].point(lambda v: int(v * 0.45)))
    sh = sh.filter(ImageFilter.GaussianBlur(18))
    out = Image.new("RGBA", L.size, (0, 0, 0, 0)); out.alpha_composite(sh, (10, 22)); out.alpha_composite(L)
    out = out.rotate(ang, resample=Image.BICUBIC, expand=True); im.alpha_composite(out, (x - pad, y - pad))
def barcode(d, x, y, n=36, h=56):
    for i in range(n):
        w0 = [3, 6, 2, 4, 2][i % 5]; d.rectangle([x + i * 13, y, x + i * 13 + w0, y + h], fill=INK)
def pill(d, x, y, text, f, fill, tc):
    w = d.textlength(text, font=f) + 56; d.rounded_rectangle([x, y, x + w, y + 70], radius=35, fill=fill); d.text((x + w / 2, y + 35), text, font=f, fill=tc, anchor="mm"); return w
def field(pd, x, y, label, value, vs=34, vc=INK):
    pd.text((x, y), label, font=MONO(20), fill=GREY); pd.text((x, y + 28), value, font=MONO_B(vs), fill=vc)

TOPIC_TITLE = ("Английский", "в аэропорту")
SECTIONS = [
    ("01", "РЕГИСТРАЦИЯ", [("I'd like to check in, please.", "Я бы хотел(а) зарегистрироваться."), ("Can I have a window seat?", "Можно место у окна?"), ("How many bags can I check in?", "Сколько сумок можно сдать в багаж?"), ("Can I take this as carry-on?", "Можно взять это в ручную кладь?")]),
    ("02", "ДОСМОТР И ПАСПОРТНЫЙ КОНТРОЛЬ", [("Do I need to take off my shoes?", "Нужно снимать обувь?"), ("I'm here on vacation.", "Я здесь в отпуске."), ("I'm staying for a week.", "Я пробуду здесь неделю."), ("I'm staying at a hotel in the city center.", "Я живу в отеле в центре.")]),
    ("03", "У ГЕЙТА И НА БОРТУ", [("Which gate is it?", "Какой номер гейта?"), ("Is the flight delayed?", "Рейс задерживается?"), ("Sorry, I think that's my seat.", "Извините, кажется, это моё место."), ("Could I get some water?", "Можно воды, пожалуйста?")]),
    ("04", "ПРИЛЁТ", [("Where is the baggage claim?", "Где выдача багажа?"), ("My suitcase didn't arrive.", "Мой чемодан не прилетел."), ("Nothing to declare.", "Нечего декларировать."), ("Where can I get a taxi?", "Где можно взять такси?")]),
]
N = sum(len(s[2]) for s in SECTIONS); total = len(SECTIONS) + 2

def header(pd, w, sub="BOARDING PASS"):
    pd.text((44, 46), "LEXICON AIR", font=MONO_B(34), fill="white", anchor="lm")
    pd.text((w - 44, 46), sub, font=MONO(22), fill=(190, 205, 225), anchor="rm")

# ---- cover ----
im = bg(); d = ImageDraw.Draw(im)
pill(d, 80, 80, "ГОВОРИ КАК МЕСТНЫЙ", inter("ExtraBold", 32), ORNG, (20, 40, 40))
d.text((80, 175), TOPIC_TITLE[0], font=inter("ExtraBold", 92), fill="white")
d.text((80, 285), TOPIC_TITLE[1], font=inter("ExtraBold", 92), fill=GOLD)
rw, rh = 680, 880; P, pd = card(rw, rh, 230); X = 44
header(pd, rw)
pd.text((X, 100), "FROM", font=MONO(20), fill=(190, 205, 225)); pd.text((rw - X, 100), "TO", font=MONO(20), fill=(190, 205, 225), anchor="ra")
pd.text((X, 128), "RUS", font=MONO_B(64), fill="white"); pd.text((rw - X, 128), "ENG", font=MONO_B(64), fill=GOLD, anchor="ra")
pd.text((rw // 2, 162), "✈", font=SYM(54), fill=ORNG, anchor="mm")
y = 252
field(pd, X, y, "PASSENGER", "YOU"); field(pd, 250, y, "GATE", "B2", vc=RED); field(pd, 400, y, "SEAT", "1A"); field(pd, 530, y, "FLIGHT", "LX16")
y += 96; perforation(P, pd, y); y += 36
for en, ru in [SECTIONS[0][2][1], SECTIONS[2][2][1], SECTIONS[3][2][0], SECTIONS[3][2][3]]:
    pd.text((X, y), en.rstrip(".?!"), font=MONO_B(25), fill=INK); y += 32
    pd.text((X, y), ru.rstrip(".?!").lower(), font=MONO(21), fill=GREY); y += 44
y += 4; pd.text((X, y), "ИТОГО", font=MONO_B(40), fill=INK); pd.text((rw - X, y), f"{N} фраз", font=MONO_B(40), fill=RED, anchor="ra"); y += 66
pd.text((rw // 2, y), "СОХРАНИ ТАЛОН ↓", font=MONO_B(30), fill=INK, anchor="mm"); y += 34
barcode(pd, (rw - 36 * 13) // 2, y, h=48)
P = P.resize((int(rw * 0.86), int(rh * 0.86)), Image.LANCZOS)
place(im, P, 380, 410, 4)
d = ImageDraw.Draw(im); brand(im, d)
im.convert("RGB").save(f"{OUT}/01.jpg", quality=94)

# ---- sections ----
def wrap(d, t, f, mw):
    out, cur = [], ""
    for w in t.split():
        c = (cur + " " + w).strip()
        if d.textlength(c, font=f) <= mw: cur = c
        else: out.append(cur); cur = w
    return out + [cur]
for k, (num, title, rows) in enumerate(SECTIONS):
    im = bg(); d = ImageDraw.Draw(im)
    d.text((80, 80), f"{TOPIC_TITLE[0]} {TOPIC_TITLE[1]}", font=inter("SemiBold", 34), fill=(200, 235, 228))
    rw = 920; fe, fr = inter("Bold", 50), inter("Regular", 37); X = 60
    tmp = ImageDraw.Draw(Image.new("L", (1, 1)))
    tl = wrap(tmp, title, MONO_B(38), rw - X - 170)
    head_h = 96 + 48 * len(tl) + 20
    body = sum(len(wrap(tmp, e, fe, rw - 120)) * 62 + len(wrap(tmp, r, fr, rw - 120)) * 50 + 76 for e, r in rows)
    rh = head_h + 50 + body + 30
    P, pd = card(rw, rh, head_h); header(pd, rw, f"STEP {num}")
    y = 100; pd.text((X, y - 6), num, font=MONO_B(62), fill=ORNG)
    for l in tl: pd.text((X + 110, y + 4), l, font=MONO_B(38), fill="white"); y += 48
    y = head_h + 50
    for i, (en, ru) in enumerate(rows):
        for l in wrap(pd, en, fe, rw - 120): pd.text((X, y), l, font=fe, fill=INK); y += 62
        for l in wrap(pd, ru, fr, rw - 120): pd.text((X, y), l, font=fr, fill=GREY); y += 50
        y += 18
        if i < len(rows) - 1:
            for x in range(X, rw - X, 16): pd.ellipse([x, y, x + 4, y + 4], fill=(200, 200, 200))
        y += 58
    place(im, P, 80, 160, 0)
    d = ImageDraw.Draw(im); brand(im, d, k + 2, total)
    im.convert("RGB").save(f"{OUT}/{k + 2:02d}.jpg", quality=94)

# ---- CTA ----
im = bg(); d = ImageDraw.Draw(im)
rw, rh = 760, 920; P, pd = card(rw, rh, 100); header(pd, rw)
y = 140; lg = logo(170); P.alpha_composite(lg, ((rw - 170) // 2, y)); y += 210
for t, f, c in [("ПРИЯТНОГО ПОЛЁТА!", MONO_B(40), INK), ("", None, None), ("Фразы — половина дела.", inter("Bold", 40), INK),
                ("Учи английский через ассоциации", inter("Regular", 32), GREY), ("и сразу говори с ИИ-собеседником", inter("Regular", 32), GREY)]:
    if t: pd.text((rw // 2, y), t, font=f, fill=c, anchor="mm")
    y += 30 if not t else (56 if f.size >= 40 else 46)
y += 30; perforation(P, pd, y); y += 70
pd.text((rw // 2, y), "mylexicon.online", font=MONO_B(40), fill=RED, anchor="mm"); y += 56
barcode(pd, (rw - 36 * 13) // 2, y)
place(im, P, (W - rw) // 2, 120, -2)
d = ImageDraw.Draw(im)
d.text((W // 2, H - 170), "Подпишись — каждую неделю новые фразы", font=inter("SemiBold", 34), fill="white", anchor="mm")
brand(im, d, total, total)
im.convert("RGB").save(f"{OUT}/{total:02d}.jpg", quality=94)
print(total)

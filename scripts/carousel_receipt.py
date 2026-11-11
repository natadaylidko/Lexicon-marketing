import sys, subprocess, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
BASE, OUT = sys.argv[1], sys.argv[2]
W, H = 1080, 1350
def inter(w, s): return ImageFont.truetype(f"/usr/share/fonts/opentype/inter/Inter-{w}.otf", s)
def ttf(name, s): return ImageFont.truetype(subprocess.run(["fc-match", "-f", "%{file}", name], capture_output=True, text=True).stdout, s)
MONO_B = lambda s: ttf("DejaVu Sans Mono:bold", s); MONO = lambda s: ttf("DejaVu Sans Mono", s)
INK, GREY, RED, GOLD = (36, 36, 40), (118, 118, 124), (205, 60, 60), (255, 210, 120)
ORNG = (255, 150, 60)
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
def paper(w, h, top_zig=True):
    P = Image.new("RGBA", (w, h), (0, 0, 0, 0)); pd = ImageDraw.Draw(P)
    z = 14; pts = []
    if top_zig: pts += [(i, z if (i // z) % 2 else 0) for i in range(0, w + 1, z)]
    else: pts += [(0, 0), (w, 0)]
    pts += [(w, h - z)] + [(w - i, h - (0 if (i // z) % 2 else z)) for i in range(0, w + 1, z)]
    pd.polygon(pts, fill=(252, 250, 244)); return P
def place(im, P, x, y, ang):
    pad = 60; L = Image.new("RGBA", (P.width + pad * 2, P.height + pad * 2), (0, 0, 0, 0)); L.alpha_composite(P, (pad, pad))
    sh = Image.new("RGBA", L.size, (0, 0, 0, 0)); sh.putalpha(L.split()[3].point(lambda v: int(v * 0.45)))
    sh = sh.filter(ImageFilter.GaussianBlur(18))
    out = Image.new("RGBA", L.size, (0, 0, 0, 0)); out.alpha_composite(sh, (10, 22)); out.alpha_composite(L)
    out = out.rotate(ang, resample=Image.BICUBIC, expand=True); im.alpha_composite(out, (x - pad, y - pad))
def dashes(d, x, y, w): d.text((x, y), "-" * int(w / 17), font=MONO(28), fill=(160, 160, 160))
def barcode(d, x, y, n=36, h=56):
    for i in range(n):
        w0 = [3, 6, 2, 4, 2][i % 5]; d.rectangle([x + i * 13, y, x + i * 13 + w0, y + h], fill=INK)
def pill(d, x, y, text, f, fill, tc):
    w = d.textlength(text, font=f) + 56; d.rounded_rectangle([x, y, x + w, y + 70], radius=35, fill=fill); d.text((x + w / 2, y + 35), text, font=f, fill=tc, anchor="mm"); return w

TOPIC_TITLE = ("Английский", "в ресторане")
VENUE = "LEXICON CAFÉ"
SECTIONS = [
    ("01", "САДИМСЯ ЗА СТОЛИК", [("A table for two, please.", "Столик на двоих, пожалуйста."), ("We have a reservation under Anna.", "У нас бронь на имя Анна."), ("Can we sit by the window?", "Можно сесть у окна?")]),
    ("02", "ДЕЛАЕМ ЗАКАЗ", [("Can I see the menu, please?", "Можно меню, пожалуйста?"), ("What do you recommend?", "Что вы посоветуете?"), ("I'll have the pasta.", "Я буду пасту."), ("Could I get it without onions?", "Можно без лука?")]),
    ("03", "ВО ВРЕМЯ УЖИНА", [("Could we get some more water?", "Можно ещё воды?"), ("Excuse me, this isn't what I ordered.", "Извините, я заказывал(а) другое."), ("Everything was delicious!", "Всё было очень вкусно!")]),
    ("04", "ПЛАТИМ", [("Can I get the check, please?", "Можно счёт, пожалуйста?"), ("Can we pay separately?", "Можно оплатить раздельно?"), ("Can I pay by card?", "Можно оплатить картой?"), ("Keep the change.", "Сдачи не надо.")]),
]
N = sum(len(s[2]) for s in SECTIONS); total = len(SECTIONS) + 2

# ---- cover ----
im = bg(); d = ImageDraw.Draw(im)
pill(d, 80, 80, "ГОВОРИ КАК МЕСТНЫЙ", inter("ExtraBold", 32), ORNG, (20, 40, 40))
d.text((80, 175), TOPIC_TITLE[0], font=inter("ExtraBold", 92), fill="white")
d.text((80, 285), TOPIC_TITLE[1], font=inter("ExtraBold", 92), fill=GOLD)
rw, rh = 660, 860; P = paper(rw, rh); pd = ImageDraw.Draw(P); X = 50; y = 50
pd.text((rw // 2, y), VENUE, font=MONO_B(40), fill=INK, anchor="mm"); y += 46
pd.text((rw // 2, y), "чек · фразы на каждый день", font=MONO(22), fill=GREY, anchor="mm"); y += 36
dashes(pd, X, y, rw - 2 * X); y += 46
for en, ru in [(SECTIONS[0][2][0]), (SECTIONS[1][2][1]), (SECTIONS[1][2][2]), (SECTIONS[3][2][1]), (SECTIONS[3][2][3])]:
    pd.text((X, y), en.rstrip(".?!"), font=MONO_B(26), fill=INK); pd.text((rw - X, y), "1", font=MONO_B(26), fill=INK, anchor="ra"); y += 34
    pd.text((X, y), ru.rstrip(".?!").lower(), font=MONO(21), fill=GREY); y += 50
dashes(pd, X, y, rw - 2 * X); y += 48
pd.text((X, y), "ИТОГО", font=MONO_B(42), fill=INK); pd.text((rw - X, y), f"{N} фраз", font=MONO_B(42), fill=RED, anchor="ra"); y += 74
pd.text((rw // 2, y), "СОХРАНИ ЧЕК ↓", font=MONO_B(32), fill=INK, anchor="mm"); y += 40
barcode(pd, (rw - 36 * 13) // 2, y)
place(im, P, 300, 395, 4)
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
    rw = 920; fe, fr = inter("Bold", 46), inter("Regular", 34)
    tmp = ImageDraw.Draw(Image.new("L", (1, 1)))
    body = sum(len(wrap(tmp, e, fe, rw - 120)) * 58 + len(wrap(tmp, r, fr, rw - 120)) * 46 + 64 for e, r in rows)
    rh = 220 + body + 60
    P = paper(rw, rh); pd = ImageDraw.Draw(P); X = 60; y = 50
    pd.text((X, y), num, font=MONO_B(64), fill=RED); pd.text((X + 110, y + 8), title, font=MONO_B(40), fill=INK); y += 100
    dashes(pd, X, y, rw - 2 * X); y += 60
    for i, (en, ru) in enumerate(rows):
        for l in wrap(pd, en, fe, rw - 120): pd.text((X, y), l, font=fe, fill=INK); y += 58
        for l in wrap(pd, ru, fr, rw - 120): pd.text((X, y), l, font=fr, fill=GREY); y += 46
        y += 18
        if i < len(rows) - 1:
            for x in range(X, rw - X, 16): pd.ellipse([x, y, x + 4, y + 4], fill=(200, 200, 200))
        y += 46
    place(im, P, 80, 160, 0 if k % 2 == 0 else 0)
    d = ImageDraw.Draw(im); brand(im, d, k + 2, total)
    im.convert("RGB").save(f"{OUT}/{k + 2:02d}.jpg", quality=94)

# ---- CTA ----
im = bg(); d = ImageDraw.Draw(im)
rw, rh = 760, 900; P = paper(rw, rh); pd = ImageDraw.Draw(P); y = 60
pd.text((rw // 2, y), VENUE, font=MONO_B(44), fill=INK, anchor="mm"); y += 60
dashes(pd, 50, y, rw - 100); y += 60
lg = logo(180); P.alpha_composite(lg, ((rw - 180) // 2, y)); y += 220
for t, f, c in [("СПАСИБО ЗА ВИЗИТ!", MONO_B(40), INK), ("", None, None), ("Фразы — половина дела.", inter("Bold", 40), INK),
                ("Учи 3000 главных слов до B2", inter("Regular", 32), GREY), ("через ассоциации и сразу", inter("Regular", 32), GREY), ("говори с ИИ-собеседником", inter("Regular", 32), GREY)]:
    if t: pd.text((rw // 2, y), t, font=f, fill=c, anchor="mm")
    y += 30 if not t else (56 if f.size >= 40 else 46)
y += 20; dashes(pd, 50, y, rw - 100); y += 70
pd.text((rw // 2, y), "mylexicon.online", font=MONO_B(40), fill=RED, anchor="mm"); y += 60
barcode(pd, (rw - 36 * 13) // 2, y)
place(im, P, (W - rw) // 2, 120, -2)
d = ImageDraw.Draw(im)
d.text((W // 2, H - 170), "Подпишись — каждую неделю новые фразы", font=inter("SemiBold", 34), fill="white", anchor="mm")
brand(im, d, total, total)
im.convert("RGB").save(f"{OUT}/{total:02d}.jpg", quality=94)
print(total)

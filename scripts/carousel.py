import sys, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
BASE, OUT = sys.argv[1], sys.argv[2]
W, H = 1080, 1350
F = "/usr/share/fonts/opentype/inter/Inter-%s.otf"
def font(w, s): return ImageFont.truetype(F % w, s)
DARK, LIGHT, GREY, PURP, ORNG = (22, 20, 30), (90, 86, 104), (140, 136, 152), (124, 77, 230), (240, 150, 30)

def bg():
    g = np.linspace(0, 1, H)[:, None, None]
    arr = np.array((250, 249, 247)) * (1 - g) + np.array((241, 238, 247)) * g
    arr = np.repeat(arr, W, axis=1)
    yy, xx = np.mgrid[0:H, 0:W]
    glow = np.exp(-(((xx - 900) / 420) ** 2 + ((yy - 150) / 320) ** 2))[..., None]
    arr = arr - glow * np.array((6, 16, 0))
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).convert("RGBA")

def grad_text(text, f):
    tmp = ImageDraw.Draw(Image.new("L", (1, 1))); w = int(tmp.textlength(text, font=f)) + 20; h = int(f.size * 1.4)
    m = Image.new("L", (w, h), 0); ImageDraw.Draw(m).text((10, h // 2), text, font=f, fill=255, anchor="lm")
    x = np.linspace(0, 1, w)[None, :, None]
    a, b, c = np.array((254, 168, 47)), np.array((139, 92, 246)), np.array((59, 130, 246))
    gr = np.where(x < .5, a * (1 - x / .5) + b * (x / .5), b * (1 - (x - .5) / .5) + c * ((x - .5) / .5))
    im = Image.fromarray(np.repeat(gr, h, axis=0).astype(np.uint8)).convert("RGBA"); im.putalpha(m); return im

def logo(size):
    im = Image.open(f"{BASE}/logo/mindbyte-logo.jpeg").convert("RGB")
    s = min(im.size); im = im.crop(((im.width - s) // 2, (im.height - s) // 2, (im.width + s) // 2, (im.height + s) // 2))
    z = int(s / 1.25); o = (s - z) // 2; im = im.crop((o, o, o + z, o + z)).resize((size, size), Image.LANCZOS).convert("RGBA")
    m = Image.new("L", (size * 4, size * 4), 0); ImageDraw.Draw(m).ellipse([0, 0, size * 4 - 1, size * 4 - 1], fill=255)
    im.putalpha(m.resize((size, size), Image.LANCZOS)); return im

def wrap(d, text, f, maxw):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if d.textlength(t, font=f) <= maxw: cur = t
        else: lines.append(cur); cur = w
    lines.append(cur); return lines

def header(im, d, n, total):
    lg = logo(56); im.alpha_composite(lg, (80, 72))
    d.text((150, 100), "Lexicon", font=font("Bold", 30), fill=DARK, anchor="lm")
    d.text((W - 80, 100), f"{n}/{total}", font=font("Medium", 28), fill=GREY, anchor="rm")

def footer(d, text="Сохрани, чтобы не потерять 📌".replace(" 📌", "")):
    d.text((W // 2, H - 70), "mylexicon.online", font=font("Medium", 28), fill=GREY, anchor="mm")

TOPIC = "в ресторане"
SLIDES = [
    ("Садимся за столик", [
        ("A table for two, please.", "Столик на двоих, пожалуйста."),
        ("We have a reservation under Anna.", "У нас бронь на имя Анна."),
        ("Can we sit by the window?", "Можно сесть у окна?"),
    ]),
    ("Делаем заказ", [
        ("Can I see the menu, please?", "Можно меню, пожалуйста?"),
        ("What do you recommend?", "Что вы посоветуете?"),
        ("I'll have the pasta.", "Я буду пасту."),
        ("Could I get it without onions?", "Можно без лука?"),
    ]),
    ("Во время ужина", [
        ("Could we get some more water?", "Можно ещё воды?"),
        ("Excuse me, this isn't what I ordered.", "Извините, я заказывал(а) другое."),
        ("Everything was delicious!", "Всё было очень вкусно!"),
    ]),
    ("Платим", [
        ("Can I get the check, please?", "Можно счёт, пожалуйста?"),
        ("Can we pay separately?", "Можно оплатить раздельно?"),
        ("Can I pay by card?", "Можно оплатить картой?"),
        ("Keep the change.", "Сдачи не надо."),
    ]),
]
total = len(SLIDES) + 2

# cover
im = bg(); d = ImageDraw.Draw(im); header(im, d, 1, total)
d.text((80, 300), "14 ФРАЗ", font=font("Bold", 40), fill=PURP)
y = 370
for line in ["Английский", "в ресторане:", "от «столик на двоих»", "до «сдачи не надо»"]:
    f = font("ExtraBold", 92) if y < 560 else font("SemiBold", 54)
    d.text((80, y), line, font=f, fill=DARK); y += 110 if y < 560 else 72
y += 40
d.rounded_rectangle([80, y, 80 + 520, y + 84], radius=42, fill=(124, 77, 230))
d.text((80 + 260, y + 42), "Сохрани, пригодится 📌".replace(" 📌", " ↓"), font=font("SemiBold", 34), fill="white", anchor="mm")
big = logo(300); im.alpha_composite(big, (W - 300 - 60, H - 300 - 150))
d.text((80, H - 110), "Листай →", font=font("Medium", 34), fill=LIGHT)
im.convert("RGB").save(f"{OUT}/01.jpg", quality=94)

for k, (title, rows) in enumerate(SLIDES):
    im = bg(); d = ImageDraw.Draw(im); header(im, d, k + 2, total)
    d.text((80, 220), title, font=font("ExtraBold", 72), fill=DARK)
    x = np.linspace(0, 1, 160)[None, :, None]; A, B = np.array((254, 168, 47)), np.array((139, 92, 246))
    bar = Image.fromarray(np.repeat(A * (1 - x) + B * x, 8, axis=0).astype(np.uint8)).convert("RGBA")
    bm = Image.new("L", bar.size, 0); ImageDraw.Draw(bm).rounded_rectangle([0, 0, 159, 7], radius=4, fill=255); bar.putalpha(bm)
    im.alpha_composite(bar, (82, 318))
    y = 400; fe, fr = font("Bold", 50), font("Regular", 38)
    gap = 60 if len(rows) == 4 else 90
    for en, ru in rows:
        el = wrap(d, en, fe, 920); rl = wrap(d, ru, fr, 920)
        hgt = len(el) * 62 + len(rl) * 50 + 40
        d.rounded_rectangle([60, y - 20, W - 60, y + hgt], radius=28, fill=(255, 255, 255))
        yy = y + 4
        for l in el: d.text((90, yy), l, font=fe, fill=DARK); yy += 62
        yy += 6
        for l in rl: d.text((90, yy), l, font=fr, fill=LIGHT); yy += 50
        y += hgt + gap - 20
    footer(d)
    im.convert("RGB").save(f"{OUT}/{k + 2:02d}.jpg", quality=94)

# CTA
im = bg(); d = ImageDraw.Draw(im); header(im, d, total, total)
big = logo(260); im.alpha_composite(big, ((W - 260) // 2, 260))
wm = grad_text("Lexicon", font("Bold", 110)); im.alpha_composite(wm, ((W - wm.width) // 2, 560))
y = 760
for line, f, col in [("Фразы — это половина дела.", font("SemiBold", 48), DARK),
                     ("Учи 3000 главных слов до B2", font("Regular", 40), LIGHT),
                     ("через ассоциации и сразу говори", font("Regular", 40), LIGHT),
                     ("с ИИ-собеседником", font("Regular", 40), LIGHT)]:
    d.text((W // 2, y), line, font=f, fill=col, anchor="mm"); y += 70 if f.size > 45 else 56
d.rounded_rectangle([(W - 640) // 2, 1080, (W + 640) // 2, 1170], radius=45, fill=(124, 77, 230))
d.text((W // 2, 1125), "mylexicon.online — бесплатно", font=font("SemiBold", 36), fill="white", anchor="mm")
im.convert("RGB").save(f"{OUT}/{total:02d}.jpg", quality=94)
print("slides", total)

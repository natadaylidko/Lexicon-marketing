import sys, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
BASE, OUT = sys.argv[1], sys.argv[2]
W, H = 1080, 1350
F = "/usr/share/fonts/opentype/inter/Inter-%s.otf"
def font(w, s): return ImageFont.truetype(F % w, s)
RED, GREEN = (235, 64, 80), (40, 190, 110)

# deep purple background with neon glows
yy, xx = np.mgrid[0:H, 0:W]
base = np.array((30, 18, 64)) * (1 - yy[..., None] / H) + np.array((58, 24, 92)) * (yy[..., None] / H)
def glow(cx, cy, r, col, k): return np.exp(-(((xx - cx) / r) ** 2 + ((yy - cy) / r) ** 2))[..., None] * np.array(col) * k
arr = base + glow(900, 220, 380, (254, 168, 47), 0.55) + glow(120, 1150, 420, (139, 92, 246), 0.7) + glow(980, 1250, 300, (59, 130, 246), 0.5)
BGARR = np.clip(arr, 0, 255).astype(np.uint8)
def newbg():
    im = Image.fromarray(BGARR).convert("RGBA")
    im.alpha_composite(DOTS); return im
# subtle dot grid
dots = Image.new("RGBA", (W, H), (0, 0, 0, 0)); dd = ImageDraw.Draw(dots)
for y in range(30, H, 54):
    for x in range(30, W, 54): dd.ellipse([x, y, x + 4, y + 4], fill=(255, 255, 255, 22))
DOTS = dots
im = newbg(); d = ImageDraw.Draw(im)

def sticker(text, f, fg, bgc, angle, strike=False, icon=None):
    tmp = ImageDraw.Draw(Image.new("L", (1, 1))); tw = int(tmp.textlength(text, font=f))
    padx, h = 40, int(f.size * 1.75); iw = (h - 30) if icon else 0
    w = tw + padx * 2 + (iw + 22 if icon else 0)
    s = Image.new("RGBA", (w + 60, h + 60), (0, 0, 0, 0)); sd = ImageDraw.Draw(s)
    sh = Image.new("RGBA", s.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).rounded_rectangle([34, 40, 34 + w, 40 + h], radius=h // 2, fill=(0, 0, 0, 120))
    s.alpha_composite(sh.filter(ImageFilter.GaussianBlur(12)))
    sd.rounded_rectangle([30, 30, 30 + w, 30 + h], radius=h // 2, fill=bgc)
    x = 30 + padx
    if icon:
        cx, cy, r = x + iw // 2, 30 + h // 2, iw // 2
        sd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=fg)
        if icon == "x":
            k = r * 0.45; sd.line([(cx - k, cy - k), (cx + k, cy + k)], fill=bgc, width=8); sd.line([(cx + k, cy - k), (cx - k, cy + k)], fill=bgc, width=8)
        else:
            sd.line([(cx - r * .45, cy), (cx - r * .1, cy + r * .38), (cx + r * .5, cy - r * .35)], fill=bgc, width=9, joint="curve")
        x += iw + 22
    sd.text((x, 30 + h // 2), text, font=f, fill=fg, anchor="lm")
    if strike: sd.line([(x - 6, 30 + h // 2 + 2), (x + tw + 6, 30 + h // 2 + 2)], fill=fg, width=7)
    return s.rotate(angle, resample=Image.BICUBIC, expand=True)

# floating stickers
for txt, ang, pos, strike, icon, fg, bgc, sz in [
    ("I'm agree", 7, (560, 120), True, "x", RED, (255, 236, 238), 52),
    ("I have 30 years", -6, (40, 230), True, "x", RED, (255, 236, 238), 46),
    ("I agree", -4, (620, 330), False, "v", GREEN, (230, 250, 238), 52),
]:
    im.alpha_composite(sticker(txt, font("Bold", sz), fg, bgc, ang, strike, icon), pos)

d = ImageDraw.Draw(im)
# STOP badge
y0 = 520
d.rounded_rectangle([80, y0, 80 + 380, y0 + 74], radius=14, fill=RED)
d.text((80 + 190, y0 + 37), "НЕ ГОВОРИ ТАК!", font=font("ExtraBold", 38), fill="white", anchor="mm")
y = y0 + 110
for line, f, col in [("8 ошибок,", font("ExtraBold", 104), (255, 255, 255)),
                     ("которые выдают", font("ExtraBold", 84), (255, 255, 255)),
                     ("русскоязычных", font("ExtraBold", 84), (254, 190, 90)),
                     ("в английском", font("SemiBold", 60), (226, 216, 250))]:
    d.text((80, y), line, font=f, fill=col); y += int(f.size * 1.18)
y += 30
d.rounded_rectangle([80, y, 80 + 470, y + 88], radius=44, fill=(254, 168, 47))
d.text((80 + 235, y + 44), "Сохрани себе ↓", font=font("Bold", 38), fill=(30, 18, 64), anchor="mm")

# logo + brand
lg = Image.open(f"{BASE}/logo/mindbyte-logo.jpeg").convert("RGB"); s0 = min(lg.size)
lg = lg.crop(((lg.width - s0) // 2, (lg.height - s0) // 2, (lg.width + s0) // 2, (lg.height + s0) // 2)); z = int(s0 / 1.25); o = (s0 - z) // 2
lg = lg.crop((o, o, o + z, o + z)).resize((64, 64), Image.LANCZOS).convert("RGBA")
m = Image.new("L", (256, 256), 0); ImageDraw.Draw(m).ellipse([0, 0, 255, 255], fill=255); lg.putalpha(m.resize((64, 64), Image.LANCZOS))
im.alpha_composite(lg, (80, H - 120))
d.text((158, H - 88), "Lexicon", font=font("Bold", 34), fill="white", anchor="lm")
d.text((W - 80, H - 88), "Проверь себя →", font=font("SemiBold", 34), fill=(226, 216, 250), anchor="rm")
im.convert("RGB").save(f"{OUT}/01.jpg", quality=94)
lg = Image.open(f"{BASE}/logo/mindbyte-logo.jpeg").convert("RGB"); s0 = min(lg.size)
lg = lg.crop(((lg.width - s0) // 2, (lg.height - s0) // 2, (lg.width + s0) // 2, (lg.height + s0) // 2)); z = int(s0 / 1.25); o = (s0 - z) // 2
lg = lg.crop((o, o, o + z, o + z)).resize((64, 64), Image.LANCZOS).convert("RGBA")
m = Image.new("L", (256, 256), 0); ImageDraw.Draw(m).ellipse([0, 0, 255, 255], fill=255); lg.putalpha(m.resize((64, 64), Image.LANCZOS))
LG = lg

def brand(im, d, n, total):
    im.alpha_composite(LG, (80, 70)); d.text((158, 102), "Lexicon", font=font("Bold", 34), fill="white", anchor="lm")
    d.text((W - 80, 102), f"{n}/{total}", font=font("Medium", 30), fill=(200, 190, 230), anchor="rm")

PAIRS = [
    ("I'm agree.", "I agree.", "agree — уже глагол, am не нужен"),
    ("I have 30 years.", "I'm 30.", "возраст — через be, а не have"),
    ("Can you explain me?", "Can you explain it to me?", "explain всегда с to"),
    ("How do you think?", "What do you think?", "«как ты думаешь» = what"),
    ("I'm boring.", "I'm bored.", "boring — «я скучный», bored — «мне скучно»"),
    ("Let's discuss about it.", "Let's discuss it.", "после discuss не нужен about"),
    ("It depends of you.", "It depends on you.", "depend on, а не of"),
    ("I'll call you when I will arrive.", "I'll call you when I arrive.", "после when — настоящее время"),
]
total = 6
for k in range(4):
    im = newbg(); d = ImageDraw.Draw(im); brand(im, d, k + 2, total)
    d.rounded_rectangle([80, 190, 80 + 300, 190 + 62], radius=12, fill=RED)
    d.text((80 + 150, 221), f"ОШИБКИ {2*k+1}–{2*k+2}", font=font("ExtraBold", 32), fill="white", anchor="mm")
    y = 310
    for j, (wrong, right, why) in enumerate(PAIRS[2*k:2*k+2]):
        fw = font("Bold", 50); fr = font("Bold", 54)
        while ImageDraw.Draw(Image.new("L",(1,1))).textlength(right, font=fr) > 780: fr = font("Bold", fr.size - 2)
        while ImageDraw.Draw(Image.new("L",(1,1))).textlength(wrong, font=fw) > 780: fw = font("Bold", fw.size - 2)
        a = sticker(wrong, fw, RED, (255, 236, 238), 2 if j == 0 else -2, True, "x")
        im.alpha_composite(a, (40, y)); y += a.height - 10
        b = sticker(right, fr, GREEN, (230, 250, 238), -1 if j == 0 else 1, False, "v")
        im.alpha_composite(b, (60, y)); y += b.height - 4
        d = ImageDraw.Draw(im)
        d.text((100, y + 6), "→ " + why, font=font("SemiBold", 38), fill=(254, 200, 120)); y += 120
    d.text((W // 2, H - 70), "mylexicon.online", font=font("Medium", 30), fill=(200, 190, 230), anchor="mm")
    im.convert("RGB").save(f"{OUT}/{k+2:02d}.jpg", quality=94)

im = newbg(); d = ImageDraw.Draw(im); brand(im, d, total, total)
big = Image.open(f"{BASE}/logo/mindbyte-logo.jpeg").convert("RGB"); s0 = min(big.size)
big = big.crop(((big.width - s0) // 2, (big.height - s0) // 2, (big.width + s0) // 2, (big.height + s0) // 2)); z = int(s0 / 1.25); o = (s0 - z) // 2
big = big.crop((o, o, o + z, o + z)).resize((240, 240), Image.LANCZOS).convert("RGBA")
mm = Image.new("L", (960, 960), 0); ImageDraw.Draw(mm).ellipse([0, 0, 959, 959], fill=255); big.putalpha(mm.resize((240, 240), Image.LANCZOS))
halo = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(halo).ellipse([W//2-170, 230, W//2+170, 570], fill=(254, 168, 47, 120))
im.alpha_composite(halo.filter(ImageFilter.GaussianBlur(50))); im.alpha_composite(big, ((W - 240) // 2, 280))
d = ImageDraw.Draw(im)
y = 620
for line, f, col in [("Сколько ошибок", font("ExtraBold", 72), (255, 255, 255)), ("было у тебя?", font("ExtraBold", 72), (254, 190, 90)),
                     ("Пиши цифру в комментариях", font("SemiBold", 40), (226, 216, 250))]:
    d.text((W // 2, y), line, font=f, fill=col, anchor="mm"); y += 90 if f.size > 60 else 70
y += 30
for line in ["Подпишись — каждую неделю", "новые фразы и разборы ошибок"]:
    d.text((W // 2, y), line, font=font("Regular", 38), fill=(226, 216, 250), anchor="mm"); y += 54
d.rounded_rectangle([(W - 640) // 2, 1110, (W + 640) // 2, 1200], radius=45, fill=(254, 168, 47))
d.text((W // 2, 1155), "mylexicon.online — бесплатно", font=font("Bold", 36), fill=(30, 18, 64), anchor="mm")
im.convert("RGB").save(f"{OUT}/06.jpg", quality=94)
print("ok")

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math, os

OUT = os.path.join(os.path.dirname(__file__), "site", "assets")
os.makedirs(OUT, exist_ok=True)

# ── Colors ──
BG = (10, 10, 18)
PURPLE = (108, 92, 231)
PURPLE_DIM = (60, 50, 140)
CYAN = (24, 255, 255)
GREEN = (0, 230, 118)
GREEN_DIM = (0, 140, 70)
WHITE = (230, 230, 240)
GRAY = (120, 120, 160)

def try_font(size, bold=False):
    paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/TTF/DejaVuSans.ttf",
    ]
    for p in paths:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()

def draw_orbit(draw, cx, cy, rx, ry, angle, color, width=2):
    bbox = [cx - rx, cy - ry, cx + rx, cy + ry]
    tmp = Image.new("RGBA", draw.im.size, (0, 0, 0, 0))
    td = ImageDraw.Draw(tmp)
    td.ellipse(bbox, outline=color + (180,), width=width)
    rotated = tmp.rotate(angle, center=(cx, cy), resample=Image.BICUBIC)
    return rotated

def draw_atom(draw, cx, cy, radius, color1, color2, color3, orbit_width=3):
    layers = []
    for angle_offset, color in [(0, color1), (60, color2), (-60, color3)]:
        orbit = draw_orbit(draw, cx, cy, radius, radius // 3, angle_offset, color, orbit_width)
        layers.append(orbit)
    composite = Image.new("RGBA", draw.im.size, (0, 0, 0, 0))
    for l in layers:
        composite = Image.alpha_composite(composite, l)
    return composite

def make_glow(img, color, radius=20, alpha=60):
    glow = img.copy()
    glow2 = Image.new("RGBA", img.size, color + (alpha,))
    glow = Image.alpha_composite(glow, glow2)
    glow = glow.filter(ImageFilter.GaussianBlur(radius))
    return glow

# ═══════════════════════════════════════
# 1. SQUARE LOGO  1024×1024
# ═══════════════════════════════════════
SZ = 1024
logo = Image.new("RGBA", (SZ, SZ), BG + (255,))
d = ImageDraw.Draw(logo)

# Background gradient circle
for r in range(480, 0, -2):
    t = r / 480
    c = tuple(int(BG[i] + (PURPLE[i] - BG[i]) * (1 - t) * 0.15) for i in range(3))
    d.ellipse([SZ//2 - r, SZ//2 - r, SZ//2 + r, SZ//2 + r], fill=c + (255,))

# Atom orbits
atom_layer = draw_atom(d, SZ // 2, SZ // 2 - 10, 360, PURPLE, CYAN, GREEN, 4)
logo = Image.alpha_composite(logo, atom_layer)

# Core glow
core = Image.new("RGBA", (SZ, SZ), (0, 0, 0, 0))
cd = ImageDraw.Draw(core)
for r in range(120, 0, -2):
    t = r / 120
    a = int(40 * (1 - t))
    cd.ellipse([SZ//2 - r, SZ//2 - 10 - r, SZ//2 + r, SZ//2 - 10 + r], fill=CYAN + (a,))
logo = Image.alpha_composite(logo, core)

# Electron dots
d2 = ImageDraw.Draw(logo)
electron_positions = [
    (SZ//2, SZ//2 - 10 - 360, 8, CYAN),
    (SZ//2 + 312, SZ//2 - 10 + 180, 8, PURPLE),
    (SZ//2 - 312, SZ//2 - 10 + 180, 8, GREEN),
]
for ex, ey, er, ec in electron_positions:
    for gr in range(er * 4, 0, -1):
        a = int(80 * (1 - gr / (er * 4)))
        d2.ellipse([ex - gr, ey - gr, ex + gr, ey + gr], fill=ec + (a,))
    d2.ellipse([ex - er, ey - er, ex + er, ey + er], fill=ec + (255,))

# Central "B" symbol
font_b = try_font(280, bold=True)
d2.text((SZ // 2, SZ // 2 - 10), "B", fill=WHITE + (255,), font=font_b, anchor="mm")

# "QS" subscript
font_qs = try_font(90, bold=True)
d2.text((SZ // 2 + 130, SZ // 2 + 80), "QS", fill=GREEN + (255,), font=font_qs, anchor="mm")

# Outer ring
d2.ellipse([40, 40, SZ - 40, SZ - 40], outline=PURPLE_DIM + (100,), width=2)

logo_rgb = logo.convert("RGB")
logo_rgb.save(os.path.join(OUT, "logo.png"), quality=95)
logo_rgb.resize((512, 512), Image.LANCZOS).save(os.path.join(OUT, "logo-512.png"), quality=95)
logo_rgb.resize((192, 192), Image.LANCZOS).save(os.path.join(OUT, "logo-192.png"), quality=95)
logo_rgb.resize((64, 64), Image.LANCZOS).save(os.path.join(OUT, "favicon.png"), quality=95)
print("Logo saved")

# ═══════════════════════════════════════
# 2. COVER IMAGE  1280×640
# ═══════════════════════════════════════
W, H = 1280, 640
cover = Image.new("RGBA", (W, H), BG + (255,))
dc = ImageDraw.Draw(cover)

# Background gradient
for y in range(H):
    t = y / H
    r = int(BG[0] + (PURPLE[0] - BG[0]) * (1 - t) * 0.12)
    g = int(BG[1] + (PURPLE[1] - BG[1]) * (1 - t) * 0.12)
    b = int(BG[2] + (PURPLE[2] - BG[2]) * (1 - t) * 0.12)
    dc.line([(0, y), (W, y)], fill=(r, g, b, 255))

# Grid pattern (hash chain visual)
for x in range(0, W, 60):
    dc.line([(x, 0), (x, H)], fill=(30, 30, 50, 40), width=1)
for y in range(0, H, 60):
    dc.line([(0, y), (W, y)], fill=(30, 30, 50, 40), width=1)

# Atom on the right side
atom_cover = draw_atom(dc, 960, 320, 240, PURPLE, CYAN, GREEN, 5)
cover = Image.alpha_composite(cover, atom_cover)

# Electron dots on cover
d3 = ImageDraw.Draw(cover)
cover_electrons = [
    (960, 320 - 240, 10, CYAN),
    (960 + 208, 320 + 120, 10, PURPLE),
    (960 - 208, 320 + 120, 10, GREEN),
]
for ex, ey, er, ec in cover_electrons:
    for gr in range(er * 5, 0, -1):
        a = int(60 * (1 - gr / (er * 5)))
        d3.ellipse([ex - gr, ey - gr, ex + gr, ey + gr], fill=ec + (a,))
    d3.ellipse([ex - er, ey - er, ex + er, ey + er], fill=ec + (255,))

# Hash chain dots on left
chain_y = 460
for i in range(8):
    cx = 100 + i * 80
    r = 6 if i < 7 else 10
    color = GREEN if i == 7 else PURPLE_DIM
    d3.ellipse([cx - r, chain_y - r, cx + r, chain_y + r], fill=color + (200,))
    if i < 7:
        d3.line([(cx + r, chain_y), (cx + 80 - r, chain_y)], fill=PURPLE_DIM + (100,), width=2)

# Glow behind text
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
gd.ellipse([100, 100, 700, 500], fill=PURPLE + (15,))
glow = glow.filter(ImageFilter.GaussianBlur(80))
cover = Image.alpha_composite(cover, glow)
d3 = ImageDraw.Draw(cover)

# Title text
font_title = try_font(82, bold=True)
font_sub = try_font(32, bold=False)
font_tag = try_font(20, bold=True)

d3.text((100, 220), "BitcoinQS", fill=WHITE + (255,), font=font_title)

# Gradient underline
for x in range(100, 580):
    t = (x - 100) / 480
    r = int(PURPLE[0] + (GREEN[0] - PURPLE[0]) * t)
    g = int(PURPLE[1] + (GREEN[1] - PURPLE[1]) * t)
    b = int(PURPLE[2] + (GREEN[2] - PURPLE[2]) * t)
    d3.line([(x, 310), (x, 314)], fill=(r, g, b, 255))

d3.text((100, 340), "Quantum-Secure Cryptocurrency", fill=GRAY + (255,), font=font_sub)

# Feature badges
badges = [
    ("WOTS+", GREEN),
    ("POST-QUANTUM", CYAN),
    ("256-BIT", PURPLE),
]
bx = 100
for text, color in badges:
    tw = d3.textlength(text, font=font_tag)
    d3.rounded_rectangle([bx, 400, bx + tw + 20, 432], radius=6, fill=color + (25,), outline=color + (80,), width=1)
    d3.text((bx + 10, 416), text, fill=color + (255,), font=font_tag, anchor="lm")
    bx += int(tw) + 32

# Bottom tagline
font_bottom = try_font(16, bold=False)
d3.text((100, 560), "Immune to Shor's algorithm  \u00b7  Hash-based signatures  \u00b7  Forward secrecy by design", fill=GRAY + (150,), font=font_bottom)

cover_rgb = cover.convert("RGB")
cover_rgb.save(os.path.join(OUT, "cover.png"), quality=95)
cover_rgb.resize((600, 300), Image.LANCZOS).save(os.path.join(OUT, "cover-sm.png"), quality=95)
print("Cover saved")

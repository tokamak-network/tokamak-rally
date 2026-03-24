#!/usr/bin/env python3
"""
Generate PNG assets for Tokamak Rally desert zone upgrade.
Requires: pip install Pillow
Output: ../public/assets/*.png
"""

import os, sys, math, random
from PIL import Image, ImageDraw, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets')
os.makedirs(OUT, exist_ok=True)
random.seed(20260309)

def noise_color(base_r, base_g, base_b, variance=10):
    return (
        max(0, min(255, base_r + random.randint(-variance, variance))),
        max(0, min(255, base_g + random.randint(-variance, variance))),
        max(0, min(255, base_b + random.randint(-variance, variance))),
    )

# ============================================================
# TRACK TILES (256x256)
# ============================================================

def gen_sand_road():
    """Desert road — warm beige-brown with gravel noise, tire marks."""
    img = Image.new('RGBA', (256, 256))
    draw = ImageDraw.Draw(img)
    # Base gradient
    for y in range(256):
        t = y / 256
        r = int(0x8B + (0x96 - 0x8B) * t)
        g = int(0x6B + (0x78 - 0x6B) * t)
        b = int(0x4A + (0x55 - 0x4A) * t)
        for x in range(256):
            c = noise_color(r, g, b, 8)
            img.putpixel((x, y), (*c, 255))
    # Gravel dots
    for _ in range(600):
        x, y = random.randint(0, 255), random.randint(0, 255)
        s = random.randint(1, 3)
        c = random.choice([(0x7A, 0x5A, 0x38), (0x9A, 0x7A, 0x58), (0x6A, 0x4A, 0x2A)])
        draw.ellipse([x, y, x+s, y+s], fill=(*c, 120))
    # Tire track hints (subtle parallel lines)
    for tx in [85, 93, 165, 173]:
        for y in range(0, 256, 3):
            if random.random() < 0.6:
                draw.line([(tx, y), (tx, y+2)], fill=(0x6A, 0x4A, 0x2A, 30), width=1)
    # Sand ripple pattern
    for y in range(0, 256, 6):
        offset = int(math.sin(y * 0.08) * 20)
        draw.line([(0+offset, y), (256+offset, y)], fill=(0xD4, 0xA8, 0x70, 25), width=1)
    img.save(os.path.join(OUT, 'sand_road.png'))
    print('  sand_road.png')

def gen_sand_offroad():
    """Desert offroad — lighter sand with ripple pattern, wind marks."""
    img = Image.new('RGBA', (256, 256))
    for y in range(256):
        t = y / 256
        r = int(0xC8 + (0xD4 - 0xC8) * t)
        g = int(0x94 + (0xA8 - 0x94) * t)
        b = int(0x6A + (0x70 - 0x6A) * t)
        for x in range(256):
            wave = int(math.sin(x * 0.04 + y * 0.02) * 8)
            c = noise_color(r + wave, g + wave // 2, b + wave // 3, 12)
            img.putpixel((x, y), (*c, 255))
    draw = ImageDraw.Draw(img)
    # Sand ripples (wind-blown)
    for y in range(0, 256, 4):
        phase = random.random() * math.pi * 2
        for x in range(256):
            v = int(math.sin(x * 0.03 + phase) * 3)
            if abs(v) > 1:
                draw.point((x, y+v), fill=(0xD4, 0xA8, 0x70, 40))
    # Scattered small stones
    for _ in range(200):
        x, y = random.randint(0,255), random.randint(0,255)
        c = random.choice([(0xA0,0x78,0x48), (0x8B,0x6B,0x4A)])
        draw.point((x,y), fill=(*c, 160))
    img.save(os.path.join(OUT, 'sand_offroad.png'))
    print('  sand_offroad.png')

def gen_sand_curb():
    """Road curb — red/white alternating stripes on sand base."""
    img = Image.new('RGBA', (256, 256))
    draw = ImageDraw.Draw(img)
    # Sand base
    for y in range(256):
        for x in range(256):
            c = noise_color(0xC8, 0x94, 0x6A, 6)
            img.putpixel((x, y), (*c, 255))
    # Diagonal stripes
    stripe_w = 20
    for y in range(256):
        for x in range(256):
            d = (x + y) % (stripe_w * 2)
            if d < stripe_w:
                draw.point((x, y), fill=(0xCC, 0x33, 0x33, 220))
            else:
                draw.point((x, y), fill=(0xFF, 0xFF, 0xFF, 220))
    img.save(os.path.join(OUT, 'sand_curb.png'))
    print('  sand_curb.png')

def gen_sand_grass():
    """Desert scrub / sparse vegetation on sand."""
    img = Image.new('RGBA', (256, 256))
    # Sand base
    for y in range(256):
        for x in range(256):
            c = noise_color(0xC0, 0x98, 0x60, 10)
            img.putpixel((x, y), (*c, 255))
    draw = ImageDraw.Draw(img)
    # Scrub patches
    for _ in range(25):
        cx, cy = random.randint(10,245), random.randint(10,245)
        r = random.randint(8, 20)
        for dx in range(-r, r+1):
            for dy in range(-r, r+1):
                if dx*dx+dy*dy < r*r and 0<=cx+dx<256 and 0<=cy+dy<256:
                    c = random.choice([(0x7A,0x8A,0x40), (0x6A,0x7A,0x30), (0x8A,0x9A,0x50)])
                    img.putpixel((cx+dx, cy+dy), (*c, 140+random.randint(-20,20)))
    img.save(os.path.join(OUT, 'sand_grass.png'))
    print('  sand_grass.png')

# ============================================================
# CARS (64x96, top-down)
# ============================================================

def gen_car_rally():
    """WRC-style rally car — red/white livery, top-down view."""
    img = Image.new('RGBA', (64, 96), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = 32, 48

    # Body shape (elongated rounded rect)
    body_pts = []
    # Define body outline
    bw, bh = 22, 42  # half-width, half-height
    # Front taper
    draw.rounded_rectangle([cx-bw+4, cy-bh, cx+bw-4, cy+bh], radius=8, fill=(0xCC, 0x22, 0x22, 255))
    # Wider middle
    draw.rounded_rectangle([cx-bw, cy-bh+12, cx+bw, cy+bh-12], radius=6, fill=(0xDD, 0x28, 0x28, 255))
    # Windshield (dark, front)
    draw.rounded_rectangle([cx-14, cy-bh+6, cx+14, cy-bh+18], radius=4, fill=(0x1A, 0x2A, 0x3A, 230))
    # Rear window
    draw.rounded_rectangle([cx-12, cy+bh-16, cx+12, cy+bh-8], radius=3, fill=(0x1A, 0x2A, 0x3A, 200))

    # White racing stripes (2 parallel)
    draw.rectangle([cx-4, cy-bh+2, cx-1, cy+bh-2], fill=(0xFF, 0xFF, 0xFF, 180))
    draw.rectangle([cx+1, cy-bh+2, cx+4, cy+bh-2], fill=(0xFF, 0xFF, 0xFF, 180))

    # Headlights (front = top of sprite)
    draw.ellipse([cx-14, cy-bh+2, cx-8, cy-bh+7], fill=(0xFF, 0xEE, 0x88, 240))
    draw.ellipse([cx+8, cy-bh+2, cx+14, cy-bh+7], fill=(0xFF, 0xEE, 0x88, 240))

    # Taillights (rear = bottom)
    draw.rectangle([cx-16, cy+bh-5, cx-10, cy+bh-2], fill=(0xFF, 0x20, 0x20, 240))
    draw.rectangle([cx+10, cy+bh-5, cx+16, cy+bh-2], fill=(0xFF, 0x20, 0x20, 240))

    # Roof light bar
    draw.rectangle([cx-10, cy-8, cx+10, cy-5], fill=(0xFF, 0xCC, 0x00, 200))
    for lx in range(cx-9, cx+10, 4):
        draw.rectangle([lx, cy-8, lx+2, cy-5], fill=(0xFF, 0xFF, 0xAA, 240))

    # Spoiler hint (rear)
    draw.rectangle([cx-18, cy+bh-3, cx+18, cy+bh], fill=(0x44, 0x44, 0x44, 200))

    # Wheels (4 corners, dark)
    for wx, wy in [(cx-bw-1, cy-22), (cx+bw-3, cy-22), (cx-bw-1, cy+18), (cx+bw-3, cy+18)]:
        draw.rounded_rectangle([wx, wy, wx+4, wy+10], radius=1, fill=(0x22, 0x22, 0x22, 230))

    # Side mirrors
    draw.rectangle([cx-bw-2, cy-12, cx-bw, cy-8], fill=(0xCC, 0x22, 0x22, 200))
    draw.rectangle([cx+bw, cy-12, cx+bw+2, cy-8], fill=(0xCC, 0x22, 0x22, 200))

    # Body highlight (subtle)
    draw.line([(cx-bw+6, cy-bh+20), (cx-bw+6, cy+bh-20)], fill=(0xFF, 0x88, 0x88, 60), width=1)
    draw.line([(cx+bw-6, cy-bh+20), (cx+bw-6, cy+bh-20)], fill=(0xFF, 0x88, 0x88, 60), width=1)

    # Number decal area
    draw.rounded_rectangle([cx-8, cy+4, cx+8, cy+16], radius=2, fill=(0xFF, 0xFF, 0xFF, 180))
    # Number "1"
    draw.text((cx-3, cy+4), "1", fill=(0xCC, 0x22, 0x22, 255))

    img.save(os.path.join(OUT, 'car_rally_01.png'))
    print('  car_rally_01.png')

def gen_car_shadow():
    """Soft shadow under car — blurred dark ellipse."""
    img = Image.new('RGBA', (64, 96), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.ellipse([8, 16, 56, 80], fill=(0, 0, 0, 50))
    img = img.filter(ImageFilter.GaussianBlur(radius=6))
    img.save(os.path.join(OUT, 'car_shadow.png'))
    print('  car_shadow.png')

# ============================================================
# OBSTACLES / PROPS
# ============================================================

def gen_cactus():
    """Saguaro cactus — top-down shadow-style."""
    img = Image.new('RGBA', (32, 40), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Main trunk
    draw.rounded_rectangle([12, 5, 20, 38], radius=3, fill=(0x2D, 0x8C, 0x4E, 255))
    # Left arm
    draw.rounded_rectangle([4, 12, 12, 26], radius=3, fill=(0x2D, 0x8C, 0x4E, 255))
    draw.rounded_rectangle([8, 8, 14, 14], radius=2, fill=(0x2D, 0x8C, 0x4E, 255))
    # Right arm
    draw.rounded_rectangle([20, 16, 28, 30], radius=3, fill=(0x2D, 0x8C, 0x4E, 255))
    draw.rounded_rectangle([18, 14, 24, 18], radius=2, fill=(0x2D, 0x8C, 0x4E, 255))
    # Highlights
    draw.line([(15, 8), (15, 36)], fill=(0x4A, 0xAF, 0x6A, 100), width=1)
    draw.line([(7, 14), (7, 24)], fill=(0x4A, 0xAF, 0x6A, 80), width=1)
    draw.line([(23, 18), (23, 28)], fill=(0x4A, 0xAF, 0x6A, 80), width=1)
    # Shadow at base
    draw.ellipse([10, 34, 22, 40], fill=(0, 0, 0, 30))
    img.save(os.path.join(OUT, 'cactus.png'))
    print('  cactus.png')

def gen_rock_small():
    """Small desert rock."""
    img = Image.new('RGBA', (24, 20), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.ellipse([2, 4, 22, 18], fill=(0x8A, 0x7A, 0x5A, 240))
    draw.ellipse([4, 5, 18, 14], fill=(0xAA, 0x9A, 0x7A, 200))
    draw.ellipse([6, 6, 14, 11], fill=(0xBB, 0xAA, 0x88, 120))
    # Shadow
    draw.ellipse([3, 14, 21, 20], fill=(0, 0, 0, 25))
    img.save(os.path.join(OUT, 'rock_small.png'))
    print('  rock_small.png')

def gen_sand_pile():
    """Small sand mound obstacle."""
    img = Image.new('RGBA', (28, 18), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Mound shape
    pts = [(2, 16), (8, 4), (14, 2), (20, 4), (26, 16)]
    draw.polygon(pts, fill=(0xE8, 0xC4, 0x60, 220))
    # Highlight
    draw.polygon([(8, 6), (14, 3), (20, 6), (14, 8)], fill=(0xF8, 0xE0, 0x88, 120))
    # Shadow
    draw.ellipse([4, 12, 24, 18], fill=(0, 0, 0, 20))
    img.save(os.path.join(OUT, 'sand_pile.png'))
    print('  sand_pile.png')

def gen_dust_particle():
    """Dust particle — small soft circle."""
    img = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.ellipse([2, 2, 14, 14], fill=(0xD4, 0xB8, 0x80, 100))
    img = img.filter(ImageFilter.GaussianBlur(radius=2))
    img.save(os.path.join(OUT, 'dust_particle.png'))
    print('  dust_particle.png')

# ============================================================
# MAIN
# ============================================================

if __name__ == '__main__':
    print('Generating desert zone assets...')
    print('\nTrack tiles:')
    gen_sand_road()
    gen_sand_offroad()
    gen_sand_curb()
    gen_sand_grass()
    print('\nVehicles:')
    gen_car_rally()
    gen_car_shadow()
    print('\nProps/obstacles:')
    gen_cactus()
    gen_rock_small()
    gen_sand_pile()
    gen_dust_particle()
    print(f'\nDone! Assets saved to {os.path.abspath(OUT)}')

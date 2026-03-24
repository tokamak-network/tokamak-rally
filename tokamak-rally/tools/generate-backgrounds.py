"""Generate seamless procedural background tiles using Perlin noise with DALL-E reference color palettes."""
from PIL import Image, ImageFilter, ImageDraw
import numpy as np
import os, math

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets')
os.makedirs(OUT, exist_ok=True)

SIZE = 128  # Match existing game tile size

def perlin_2d(shape, scale=16, octaves=4):
    """Simple value noise (Perlin-like) that tiles seamlessly."""
    result = np.zeros(shape, dtype=float)
    for octave in range(octaves):
        freq = 2 ** octave
        amp = 0.5 ** octave
        s = scale * freq
        # Generate random grid (wrapping for seamless tiling)
        grid_h = max(2, shape[0] // s + 2)
        grid_w = max(2, shape[1] // s + 2)
        grid = np.random.RandomState(42 + octave).rand(grid_h, grid_w)
        # Make it tileable
        grid[0, :] = grid[-2, :]
        grid[:, 0] = grid[:, -2]
        
        for y in range(shape[0]):
            for x in range(shape[1]):
                fy = (y / s) % (grid_h - 1)
                fx = (x / s) % (grid_w - 1)
                iy, ix = int(fy), int(fx)
                dy, dx = fy - iy, fx - ix
                # Smoothstep
                dy = dy * dy * (3 - 2 * dy)
                dx = dx * dx * (3 - 2 * dx)
                iy1 = (iy + 1) % grid_h
                ix1 = (ix + 1) % grid_w
                v = (grid[iy, ix] * (1-dx) * (1-dy) +
                     grid[iy, ix1] * dx * (1-dy) +
                     grid[iy1, ix] * (1-dx) * dy +
                     grid[iy1, ix1] * dx * dy)
                result[y, x] += v * amp
    # Normalize to 0-1
    result = (result - result.min()) / (result.max() - result.min() + 1e-10)
    return result

def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))

def make_tile(name, base_colors, detail_func=None, noise_scale=12):
    """Generate a seamless tile with natural color variation."""
    noise = perlin_2d((SIZE, SIZE), scale=noise_scale)
    fine_noise = perlin_2d((SIZE, SIZE), scale=6, octaves=2)
    
    img = Image.new("RGB", (SIZE, SIZE))
    pixels = img.load()
    
    for y in range(SIZE):
        for x in range(SIZE):
            n = noise[y, x]
            fn = fine_noise[y, x]
            
            # Blend between base colors based on noise
            if len(base_colors) == 2:
                c = lerp_color(base_colors[0], base_colors[1], n)
            elif len(base_colors) == 3:
                if n < 0.5:
                    c = lerp_color(base_colors[0], base_colors[1], n * 2)
                else:
                    c = lerp_color(base_colors[1], base_colors[2], (n - 0.5) * 2)
            else:
                c = base_colors[0]
            
            # Add fine detail noise
            detail = int((fn - 0.5) * 20)
            c = tuple(max(0, min(255, c[i] + detail)) for i in range(3))
            
            pixels[x, y] = c
    
    if detail_func:
        img = detail_func(img)
    
    # Slight blur for smoothness
    img = img.filter(ImageFilter.GaussianBlur(0.5))
    
    path = os.path.join(OUT, f"{name}.png")
    img.save(path)
    print(f"  {name}: {SIZE}x{SIZE} → {path}")

# ===== DESERT ZONE =====
# Reference: warm brown sand with tire tracks, golden sand with ripples
def desert_road_detail(img):
    draw = ImageDraw.Draw(img)
    # Subtle tire track lines
    for tx in [45, 50, 78, 83]:
        for y in range(0, SIZE, 3):
            alpha_var = np.random.randint(20, 60)
            draw.line([(tx, y), (tx, y+2)], fill=(75, 68, 58))
    return img

make_tile("bg_desert",
    [(140, 120, 90), (165, 140, 105), (120, 100, 75)],
    detail_func=desert_road_detail, noise_scale=14)

# ===== CANYON ZONE =====
# Reference: red-brown layered rock with cracks
def canyon_detail(img):
    draw = ImageDraw.Draw(img)
    # Subtle crack lines
    for _ in range(8):
        x1 = np.random.randint(0, SIZE)
        y1 = np.random.randint(0, SIZE)
        x2 = x1 + np.random.randint(-20, 20)
        y2 = y1 + np.random.randint(-20, 20)
        draw.line([(x1,y1),(x2,y2)], fill=(100, 50, 30), width=1)
    return img

make_tile("bg_canyon",
    [(160, 80, 50), (140, 65, 40), (120, 55, 35)],
    detail_func=canyon_detail, noise_scale=10)

# ===== RIVERBED ZONE =====
# Muddy green-brown with gravel hints
make_tile("bg_riverbed",
    [(95, 100, 70), (80, 85, 60), (110, 105, 80)],
    noise_scale=12)

# ===== MOUNTAIN ZONE =====
# Grey-blue rock with snow patches and alpine grass
def mountain_detail(img):
    noise = perlin_2d((SIZE, SIZE), scale=20, octaves=2)
    pixels = img.load()
    for y in range(SIZE):
        for x in range(SIZE):
            if noise[y, x] > 0.7:  # Snow patches
                r, g, b = pixels[x, y]
                snow_blend = (noise[y, x] - 0.7) / 0.3
                pixels[x, y] = (
                    int(r + (230 - r) * snow_blend * 0.6),
                    int(g + (235 - g) * snow_blend * 0.6),
                    int(b + (240 - b) * snow_blend * 0.6),
                )
    return img

make_tile("bg_mountain",
    [(100, 110, 120), (80, 90, 100), (90, 100, 95)],
    detail_func=mountain_detail, noise_scale=16)

# ===== SPRINT ZONE =====
# Clean asphalt
def sprint_detail(img):
    draw = ImageDraw.Draw(img)
    # Subtle asphalt texture - small speckles
    for _ in range(200):
        x = np.random.randint(0, SIZE)
        y = np.random.randint(0, SIZE)
        v = np.random.randint(55, 80)
        draw.point((x, y), fill=(v, v, v+2))
    return img

make_tile("bg_sprint",
    [(70, 72, 75), (65, 67, 70), (60, 62, 65)],
    detail_func=sprint_detail, noise_scale=8)

print("\nDone! Background tiles generated.")

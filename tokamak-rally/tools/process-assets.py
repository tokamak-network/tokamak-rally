#!/usr/bin/env python3
"""Process DALL-E generated raw images into individual game assets."""

import os
from PIL import Image, ImageFilter
import numpy as np

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = BASE
OUT = os.path.join(BASE, 'public', 'assets')
os.makedirs(OUT, exist_ok=True)

def remove_white_bg(img, threshold=220):
    """Remove near-white background, return RGBA with transparency."""
    img = img.convert('RGBA')
    data = np.array(img)
    # Where all RGB channels > threshold → transparent
    mask = (data[:,:,0] > threshold) & (data[:,:,1] > threshold) & (data[:,:,2] > threshold)
    data[mask, 3] = 0
    # Also soften edges near the threshold (anti-alias)
    edge_mask = (data[:,:,0] > threshold - 30) & (data[:,:,1] > threshold - 30) & (data[:,:,2] > threshold - 30) & ~mask
    # Reduce alpha proportionally
    for y in range(data.shape[0]):
        for x in range(data.shape[1]):
            if edge_mask[y, x]:
                r, g, b = int(data[y,x,0]), int(data[y,x,1]), int(data[y,x,2])
                brightness = (r + g + b) / 3
                if brightness > threshold - 30:
                    alpha = max(0, min(255, int((threshold - brightness + 30) / 30 * 255)))
                    data[y, x, 3] = alpha
    return Image.fromarray(data)

def remove_white_bg_fast(img, threshold=220):
    """Fast version: remove near-white background."""
    img = img.convert('RGBA')
    data = np.array(img, dtype=np.float32)
    r, g, b = data[:,:,0], data[:,:,1], data[:,:,2]
    brightness = (r + g + b) / 3
    # Fully transparent where very bright
    full_mask = brightness > threshold
    # Partial transparency for edge pixels
    edge_lo = threshold - 40
    partial_mask = (brightness > edge_lo) & ~full_mask
    alpha = data[:,:,3].copy()
    alpha[full_mask] = 0
    alpha[partial_mask] = ((threshold - brightness[partial_mask] + 40) / 40 * 255).clip(0, 255)
    data[:,:,3] = alpha
    return Image.fromarray(data.astype(np.uint8))

def auto_crop_alpha(img, padding=2):
    """Crop to non-transparent bounding box."""
    data = np.array(img)
    if data.shape[2] < 4:
        return img
    alpha = data[:,:,3]
    rows = np.any(alpha > 10, axis=1)
    cols = np.any(alpha > 10, axis=0)
    if not rows.any() or not cols.any():
        return img
    rmin, rmax = np.where(rows)[0][[0, -1]]
    cmin, cmax = np.where(cols)[0][[0, -1]]
    rmin = max(0, rmin - padding)
    rmax = min(data.shape[0] - 1, rmax + padding)
    cmin = max(0, cmin - padding)
    cmax = min(data.shape[1] - 1, cmax + padding)
    return img.crop((cmin, rmin, cmax + 1, rmax + 1))

def resize_keep_ratio(img, target_h):
    """Resize maintaining aspect ratio to target height."""
    w, h = img.size
    ratio = target_h / h
    new_w = int(w * ratio)
    return img.resize((new_w, target_h), Image.LANCZOS)


# ============================================================
# 1. CARS (raw_cars.jpg → 5 individual PNGs)
# ============================================================
print("=== Processing Cars ===")
cars_img = Image.open(os.path.join(RAW, 'raw_cars.jpg'))
w, h = cars_img.size
print(f"  raw_cars.jpg: {w}x{h}")

# Crop regions based on vision analysis (853x1280 image)
# Row 1: 2 cars, Row 2: 3 cars
car_crops = [
    # (left, top, right, bottom), name
    ((60, 30, 410, 520), 'car_01_red'),       # Top-left: red/white
    ((420, 40, 790, 530), 'car_02_blue'),      # Top-right: blue/yellow
    ((10, 540, 300, 1020), 'car_03_green'),     # Bottom-left: green
    ((270, 560, 580, 1030), 'car_04_redstripe'), # Bottom-center: red striped
    ((540, 530, 840, 1010), 'car_05_tokamak'),  # Bottom-right: orange TOKAMAK
]

TARGET_CAR_H = 84  # Larger than original 56px for better detail

for (l, t, r, b), name in car_crops:
    # Clamp to image bounds
    l, t = max(0, l), max(0, t)
    r, b = min(w, r), min(h, b)
    crop = cars_img.crop((l, t, r, b))
    crop = remove_white_bg_fast(crop, threshold=230)
    crop = auto_crop_alpha(crop)
    crop = resize_keep_ratio(crop, TARGET_CAR_H)
    out_path = os.path.join(OUT, f'{name}.png')
    crop.save(out_path)
    print(f"  ✓ {name}.png ({crop.size[0]}x{crop.size[1]})")


# ============================================================
# 2. TILES — Note: files are content-swapped vs names!
# raw_mountain_tiles.jpg actually has desert content
# raw_desert_tiles.jpg actually has mountain content
# ============================================================
print("\n=== Processing Tiles ===")

# Desert tiles from raw_mountain_tiles.jpg (which has desert content)
desert_src = Image.open(os.path.join(RAW, 'raw_mountain_tiles.jpg'))
dw, dh = desert_src.size
half_w, half_h = dw // 2, dh // 2
print(f"  Desert source (raw_mountain_tiles.jpg): {dw}x{dh}")

desert_tiles = [
    ((0, 0, half_w, half_h), 'desert_road'),        # TL: dirt with tire tracks
    ((half_w, 0, dw, half_h), 'desert_sand'),        # TR: wind-rippled sand
    ((0, half_h, half_w, dh), 'desert_curb'),        # BL: asphalt with curb
    ((half_w, half_h, dw, dh), 'desert_scrub'),      # BR: arid scrubland
]

TILE_SIZE = 256  # Higher res tiles

for (l, t, r, b), name in desert_tiles:
    crop = desert_src.crop((l, t, r, b))
    crop = crop.resize((TILE_SIZE, TILE_SIZE), Image.LANCZOS)
    out_path = os.path.join(OUT, f'{name}.png')
    crop.save(out_path)
    print(f"  ✓ {name}.png ({TILE_SIZE}x{TILE_SIZE})")

# Mountain tiles from raw_desert_tiles.jpg (which has mountain content)
mt_src = Image.open(os.path.join(RAW, 'raw_desert_tiles.jpg'))
mw, mh = mt_src.size
mhalf_w, mhalf_h = mw // 2, mh // 2
print(f"  Mountain source (raw_desert_tiles.jpg): {mw}x{mh}")

mountain_tiles = [
    ((0, 0, mhalf_w, mhalf_h), 'mountain_road'),    # TL: asphalt road
    ((mhalf_w, 0, mw, mhalf_h), 'canyon_rock'),      # TR: red/orange rock
    ((0, mhalf_h, mhalf_w, mh), 'mountain_snow'),    # BL: rocky with snow
    ((mhalf_w, mhalf_h, mw, mh), 'forest_floor'),    # BR: green grass with leaves
]

for (l, t, r, b), name in mountain_tiles:
    crop = mt_src.crop((l, t, r, b))
    crop = crop.resize((TILE_SIZE, TILE_SIZE), Image.LANCZOS)
    out_path = os.path.join(OUT, f'{name}.png')
    crop.save(out_path)
    print(f"  ✓ {name}.png ({TILE_SIZE}x{TILE_SIZE})")


# ============================================================
# 3. OBJECTS (raw_objects.jpg → individual PNGs)
# ============================================================
print("\n=== Processing Objects ===")
obj_img = Image.open(os.path.join(RAW, 'raw_objects.jpg'))
ow, oh = obj_img.size
print(f"  raw_objects.jpg: {ow}x{oh}")

# 3 rows × 3-4 columns, 1280x853
# Row heights: ~284 each, Column widths: ~320 each (for 4 cols) or ~426 (for 3 cols)
# Based on vision analysis:
row_h = oh // 3
col_w3 = ow // 3  # 3 columns
col_w4 = ow // 4  # 4 columns

object_crops = [
    # Row 1: 3 objects (cactus, rock, canyon rock)
    ((0, 0, col_w3, row_h), 'cactus', 56),
    ((col_w3, 0, col_w3*2, row_h), 'rock_small', 48),
    ((col_w3*2, 0, ow, row_h), 'rock_canyon', 56),
    # Row 2: 4 objects (bush/tree, sand pile, cone, tire stack)
    ((0, row_h, col_w4, row_h*2), 'tree_top', 56),
    ((col_w4, row_h, col_w4*2, row_h*2), 'sand_pile', 40),
    ((col_w4*2, row_h, col_w4*3, row_h*2), 'cone', 36),
    ((col_w4*3, row_h, ow, row_h*2), 'tire_stack', 48),
    # Row 3: 4 objects (flat rock, log, tire2, cone2)
    ((0, row_h*2, col_w4, oh), 'rock_flat', 40),
    ((col_w4, row_h*2, col_w4*2, oh), 'log', 48),
]

for (l, t, r, b), name, target_size in object_crops:
    l, t = max(0, l), max(0, t)
    r, b = min(ow, r), min(oh, b)
    crop = obj_img.crop((l, t, r, b))
    crop = remove_white_bg_fast(crop, threshold=225)
    crop = auto_crop_alpha(crop)
    # Resize to target size (square-ish)
    crop = resize_keep_ratio(crop, target_size)
    out_path = os.path.join(OUT, f'{name}.png')
    crop.save(out_path)
    print(f"  ✓ {name}.png ({crop.size[0]}x{crop.size[1]})")

print(f"\n✅ All assets saved to {OUT}")
print(f"   Cars: 5, Tiles: 8, Objects: 9")

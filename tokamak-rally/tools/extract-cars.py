"""Extract 5 rally cars from DALL-E generated image with precise cropping and background removal."""
from PIL import Image, ImageFilter
import numpy as np
import os

SRC = os.path.join(os.path.dirname(__file__), '..', 'raw_cars.jpg')
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets')
os.makedirs(OUT, exist_ok=True)

img = Image.open(SRC)
print(f"Source: {img.size}")

# Bounding boxes from vision analysis (left, top, right, bottom)
cars = [
    ("car_01_red",      (115, 65, 370, 500)),
    ("car_02_blue",     (468, 80, 735, 530)),
    ("car_03_green",    (50, 620, 320, 1080)),
    ("car_04_redwhite", (295, 640, 560, 1100)),
    ("car_05_tokamak",  (545, 620, 810, 1070)),
]

# Target size for game: maintain aspect ratio, height = 56px (matching current game)
TARGET_H = 56

for name, bbox in cars:
    crop = img.crop(bbox)
    
    # Convert to RGBA
    rgba = crop.convert("RGBA")
    data = np.array(rgba)
    
    # Remove near-white background (R>230, G>230, B>230)
    white_mask = (data[:,:,0] > 225) & (data[:,:,1] > 225) & (data[:,:,2] > 225)
    data[white_mask, 3] = 0
    
    # Also remove near-white edges with slightly lower threshold
    edge_mask = (data[:,:,0] > 210) & (data[:,:,1] > 210) & (data[:,:,2] > 210)
    # Only apply at borders
    for row in range(data.shape[0]):
        for col in range(data.shape[1]):
            if edge_mask[row, col] and data[row, col, 3] > 0:
                # Check if near a transparent pixel
                neighbors_transparent = False
                for dr, dc in [(-1,0),(1,0),(0,-1),(0,1)]:
                    nr, nc = row+dr, col+dc
                    if 0 <= nr < data.shape[0] and 0 <= nc < data.shape[1]:
                        if data[nr, nc, 3] == 0:
                            neighbors_transparent = True
                            break
                if neighbors_transparent:
                    data[row, col, 3] = 0
    
    result = Image.fromarray(data)
    
    # Trim transparent borders
    bbox_trim = result.getbbox()
    if bbox_trim:
        result = result.crop(bbox_trim)
    
    # Resize to game size (height = TARGET_H, maintain aspect ratio)
    w, h = result.size
    new_w = int(w * TARGET_H / h)
    result = result.resize((new_w, TARGET_H), Image.LANCZOS)
    
    out_path = os.path.join(OUT, f"{name}.png")
    result.save(out_path)
    print(f"  {name}: {result.size} → {out_path}")

# Generate car shadow
shadow_w, shadow_h = 36, 20
shadow = Image.new("RGBA", (shadow_w, shadow_h), (0,0,0,0))
from PIL import ImageDraw
draw = ImageDraw.Draw(shadow)
# Soft elliptical shadow
for i in range(8):
    alpha = int(40 * (1 - i/8))
    draw.ellipse([i, i, shadow_w-i, shadow_h-i], fill=(0,0,0,alpha))
shadow = shadow.filter(ImageFilter.GaussianBlur(2))
shadow.save(os.path.join(OUT, "car_shadow.png"))
print(f"  car_shadow: {shadow.size}")

print("\nDone! Cars extracted.")

"""Extract obstacle objects from DALL-E generated sprite sheet."""
from PIL import Image, ImageFilter
import numpy as np
import os

SRC = os.path.join(os.path.dirname(__file__), '..', 'raw_objects.jpg')
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets')
os.makedirs(OUT, exist_ok=True)

img = Image.open(SRC)
w, h = img.size
print(f"Source: {w}x{h}")

# 3x3 grid layout (1280x853), approximate cells
# Row heights ~284px each, Col widths ~427px each
# But objects are not uniform — using precise coordinates from visual analysis
# Layout: 3 columns × 3 rows + some extras
objects = [
    # Row 1
    ("cactus",       (30, 10, 310, 270)),      # top-down cactus
    ("rock_small",   (380, 20, 620, 260)),      # grey boulder
    ("rock_canyon",  (700, 5, 1050, 290)),       # red canyon rock
    # Row 2
    ("tree_top",     (30, 300, 300, 560)),      # green tree canopy
    ("sand_pile",    (360, 310, 680, 560)),      # sand mound
    ("cone",         (720, 310, 870, 540)),      # traffic cone
    ("tire_stack",   (920, 310, 1080, 560)),     # tire stack
    # Row 3
    ("rock_flat",    (30, 580, 320, 800)),      # flat rock
    ("log",          (370, 600, 680, 790)),      # wooden log
    ("tire_small",   (720, 590, 880, 810)),      # small tire
    ("cone_small",   (920, 590, 1080, 810)),     # small cone
]

# Target sizes — must be proportional to car (40×56px)
# Car height = 56px, so obstacles should be 12-30px range
TARGET_SIZES = {
    "cactus": 22,
    "rock_small": 18,
    "rock_canyon": 28,
    "tree_top": 26,
    "sand_pile": 20,
    "cone": 14,
    "tire_stack": 16,
    "rock_flat": 20,
    "log": 16,
    "tire_small": 12,
    "cone_small": 10,
}

for name, bbox in objects:
    try:
        crop = img.crop(bbox)
        rgba = crop.convert("RGBA")
        data = np.array(rgba)
        
        # Remove white/near-white background
        white_mask = (data[:,:,0] > 220) & (data[:,:,1] > 220) & (data[:,:,2] > 220)
        data[white_mask, 3] = 0
        
        # Erode edges next to transparent
        for _ in range(2):
            alpha = data[:,:,3]
            new_data = data.copy()
            for row in range(1, data.shape[0]-1):
                for col in range(1, data.shape[1]-1):
                    if alpha[row, col] > 0:
                        neighbors = [alpha[row-1,col], alpha[row+1,col], alpha[row,col-1], alpha[row,col+1]]
                        if any(n == 0 for n in neighbors):
                            r, g, b = data[row,col,0], data[row,col,1], data[row,col,2]
                            if r > 200 and g > 200 and b > 200:
                                new_data[row, col, 3] = 0
            data = new_data
        
        result = Image.fromarray(data)
        bbox_trim = result.getbbox()
        if bbox_trim:
            result = result.crop(bbox_trim)
        
        # Resize to game-appropriate size
        target = TARGET_SIZES.get(name, 20)
        rw, rh = result.size
        scale = target / max(rw, rh)
        new_w = max(1, int(rw * scale))
        new_h = max(1, int(rh * scale))
        result = result.resize((new_w, new_h), Image.LANCZOS)
        
        out_path = os.path.join(OUT, f"obj_{name}.png")
        result.save(out_path)
        print(f"  {name}: {result.size} → {out_path}")
    except Exception as e:
        print(f"  {name}: FAILED - {e}")

print("\nDone! Objects extracted.")

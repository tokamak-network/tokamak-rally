#!/bin/bash
set -e

GEN="/opt/homebrew/lib/node_modules/openclaw/skills/openai-image-gen/scripts/gen.py"
BASE="/Users/junwoong/.openclaw/workspace/tokamak-rally/public/assets/v2"

# Helper: generate and resize
gen_opaque() {
  local outdir="$1" prompt="$2" name="$3" size="$4"
  echo "=== Generating: $name ==="
  python3 "$GEN" --prompt "$prompt" --model gpt-image-1 --size 1024x1024 --quality high --background opaque --output-format png --out-dir "/tmp/gen_tmp"
  local src=$(ls -t /tmp/gen_tmp/*.png 2>/dev/null | head -1)
  if [ -z "$src" ]; then src=$(ls -t /tmp/gen_tmp/*.* 2>/dev/null | head -1); fi
  ffmpeg -y -i "$src" -vf "scale=${size}" "$outdir/${name}.png" 2>/dev/null
  rm -rf /tmp/gen_tmp
  echo "Done: $outdir/${name}.png"
}

gen_transparent() {
  local outdir="$1" prompt="$2" name="$3" w="$4" h="$5"
  echo "=== Generating: $name ==="
  python3 "$GEN" --prompt "$prompt" --model gpt-image-1 --size 1024x1024 --quality high --background transparent --output-format webp --out-dir "/tmp/gen_tmp"
  local src=$(ls -t /tmp/gen_tmp/*.webp 2>/dev/null | head -1)
  if [ -z "$src" ]; then src=$(ls -t /tmp/gen_tmp/*.* 2>/dev/null | head -1); fi
  ffmpeg -y -i "$src" -vf "scale=${w}:${h}:force_original_aspect_ratio=decrease" "$outdir/${name}.webp" 2>/dev/null
  rm -rf /tmp/gen_tmp
  echo "Done: $outdir/${name}.webp"
}

# ========== 1. TILES ==========
gen_opaque "$BASE/tiles" "Top-down 2D game tile texture, African savanna dry sandy dirt ground, scattered pebbles, tire tracks, warm yellow-brown, Neo Geo pixel art style, seamless tileable, no objects" "desert" "128:128"
gen_opaque "$BASE/tiles" "Top-down 2D game tile texture, rocky canyon floor with visible individual cobblestones and gravel, red-brown sandstone, Neo Geo pixel art style, seamless tileable" "canyon" "128:128"
gen_opaque "$BASE/tiles" "Top-down 2D game tile texture, dried riverbed with grey-blue gravel, small puddles, moss patches, river stones, Neo Geo pixel art style, seamless tileable" "riverbed" "128:128"
gen_opaque "$BASE/tiles" "Top-down 2D game tile texture, snowy mountain ground, white snow with patches of dark earth and rock, pine needles scattered, Neo Geo pixel art style, seamless tileable" "mountain" "128:128"
gen_opaque "$BASE/tiles" "Top-down 2D game tile texture, dark grey asphalt road surface, realistic tarmac grain, subtle oil stains, concrete seams, Ultimate Racing 2D style, seamless tileable" "sprint" "128:128"

# ========== 2. BARRIERS ==========
gen_transparent "$BASE/barriers" "Top-down 2D game sprite, bamboo wooden fence barrier for rally racing track edge, African style, viewed from above, pixel art, transparent background" "desert" "-1" "24"
gen_transparent "$BASE/barriers" "Top-down 2D game sprite, stone wall and metal guardrail barrier for mountain canyon road edge, viewed from above, pixel art, transparent background" "canyon" "-1" "24"
gen_transparent "$BASE/barriers" "Top-down 2D game sprite, wooden log fence barrier along riverbank road, viewed from above, pixel art, transparent background" "riverbed" "-1" "24"
gen_transparent "$BASE/barriers" "Top-down 2D game sprite, stone wall barrier with snow on top for mountain pass road, viewed from above, pixel art, transparent background" "mountain" "-1" "24"
gen_transparent "$BASE/barriers" "Top-down 2D game sprite, modern metal guardrail and concrete barrier for city racing circuit, viewed from above, pixel art, transparent background" "sprint" "-1" "24"

# ========== 3. CARS ==========
gen_transparent "$BASE/cars" "Top-down 2D game sprite, white rally car with blue Tokamak accent stripe, viewed from directly above, detailed with visible tires, headlights, roof scoop, drop shadow, Ultimate Racing 2D style, pixel art, transparent background" "alpine_white" "40" "56"
gen_transparent "$BASE/cars" "Top-down 2D game sprite, orange rally car Desert Fox, viewed from directly above, rugged off-road body, visible tires and roof rack, drop shadow, Ultimate Racing 2D style, pixel art, transparent background" "desert_fox" "40" "56"
gen_transparent "$BASE/cars" "Top-down 2D game sprite, red rally car Canyon Runner, viewed from directly above, sporty low profile, visible tires, drop shadow, Ultimate Racing 2D style, pixel art, transparent background" "canyon_red" "40" "56"
gen_transparent "$BASE/cars" "Top-down 2D game sprite, blue rally car River Hawk, viewed from directly above, aerodynamic body, visible tires, drop shadow, Ultimate Racing 2D style, pixel art, transparent background" "river_blue" "40" "56"
gen_transparent "$BASE/cars" "Top-down 2D game sprite, black rally car Tundra X, viewed from directly above, aggressive wide body, visible tires, drop shadow, Ultimate Racing 2D style, pixel art, transparent background" "tundra_x" "40" "56"

# ========== 4. OBJECTS ==========
# Desert
gen_transparent "$BASE/objects/desert" "Top-down 2D game sprite, large saguaro cactus viewed from above, desert, pixel art, Neo Geo style, transparent background" "cactus" "32" "48"
gen_transparent "$BASE/objects/desert" "Top-down 2D game sprite, dry desert bush scrub viewed from above, pixel art, Neo Geo style, transparent background" "bush" "32" "32"
gen_transparent "$BASE/objects/desert" "Top-down 2D game sprite, desert rock formation viewed from above, pixel art, Neo Geo style, transparent background" "rock" "40" "32"
gen_transparent "$BASE/objects/desert" "Top-down 2D game sprite, cow animal viewed from directly above, African savanna, pixel art, Neo Geo style, transparent background" "cow" "32" "32"
gen_transparent "$BASE/objects/desert" "Top-down 2D game sprite, tribal figure person viewed from directly above, African style, pixel art, Neo Geo style, transparent background" "tribal" "24" "24"

# Canyon
gen_transparent "$BASE/objects/canyon" "Top-down 2D game sprite, tall rock pillar column viewed from above, canyon, pixel art, Neo Geo style, transparent background" "rock_pillar" "32" "48"
gen_transparent "$BASE/objects/canyon" "Top-down 2D game sprite, rock debris pile viewed from above, canyon, pixel art, Neo Geo style, transparent background" "debris" "32" "32"
gen_transparent "$BASE/objects/canyon" "Top-down 2D game sprite, metal barrier post viewed from above, road safety, pixel art, Neo Geo style, transparent background" "barrier_post" "24" "24"
gen_transparent "$BASE/objects/canyon" "Top-down 2D game sprite, canyon wall section viewed from above, red sandstone, pixel art, Neo Geo style, transparent background" "wall" "48" "32"

# Riverbed
gen_transparent "$BASE/objects/riverbed" "Top-down 2D game sprite, reed cattail cluster viewed from above, riverbank, pixel art, Neo Geo style, transparent background" "reeds" "32" "40"
gen_transparent "$BASE/objects/riverbed" "Top-down 2D game sprite, wooden bridge plank section viewed from above, pixel art, Neo Geo style, transparent background" "bridge" "48" "32"
gen_transparent "$BASE/objects/riverbed" "Top-down 2D game sprite, rounded river boulder viewed from above, pixel art, Neo Geo style, transparent background" "boulder" "32" "32"
gen_transparent "$BASE/objects/riverbed" "Top-down 2D game sprite, flying bird viewed from directly above, wings spread, pixel art, Neo Geo style, transparent background" "bird" "24" "24"

# Mountain
gen_transparent "$BASE/objects/mountain" "Top-down 2D game sprite, snow-covered pine tree with ground shadow viewed from above, pixel art, Neo Geo style, transparent background" "pine_tree" "36" "48"
gen_transparent "$BASE/objects/mountain" "Top-down 2D game sprite, snow-covered rock viewed from above, pixel art, Neo Geo style, transparent background" "snow_rock" "32" "32"
gen_transparent "$BASE/objects/mountain" "Top-down 2D game sprite, small stone building cabin viewed from above, snowy roof, pixel art, Neo Geo style, transparent background" "cabin" "40" "40"
gen_transparent "$BASE/objects/mountain" "Top-down 2D game sprite, snowman viewed from directly above, pixel art, Neo Geo style, transparent background" "snowman" "24" "32"
gen_transparent "$BASE/objects/mountain" "Top-down 2D game sprite, wind turbine viewed from directly above, pixel art, Neo Geo style, transparent background" "turbine" "32" "32"

# Sprint
gen_transparent "$BASE/objects/sprint" "Top-down 2D game sprite, city building viewed from directly above, small urban structure, pixel art, Neo Geo style, transparent background" "building" "48" "48"
gen_transparent "$BASE/objects/sprint" "Top-down 2D game sprite, street light lamp post viewed from directly above, pixel art, Neo Geo style, transparent background" "streetlight" "24" "24"
gen_transparent "$BASE/objects/sprint" "Top-down 2D game sprite, tire barrier stack viewed from above, racing circuit, pixel art, Neo Geo style, transparent background" "tire_barrier" "32" "32"
gen_transparent "$BASE/objects/sprint" "Top-down 2D game sprite, advertising billboard viewed from above, racing track, pixel art, Neo Geo style, transparent background" "billboard" "48" "24"
gen_transparent "$BASE/objects/sprint" "Top-down 2D game sprite, grandstand section with crowd viewed from above, racing circuit, pixel art, Neo Geo style, transparent background" "grandstand" "48" "32"

echo ""
echo "========================================="
echo "All assets generated successfully!"
echo "========================================="
ls -la "$BASE/tiles/"
ls -la "$BASE/barriers/"
ls -la "$BASE/cars/"
ls -la "$BASE/objects/"*/

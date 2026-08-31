#!/usr/bin/env bash
# FUNCTION. mark and app-icon generator. Writes into public/.
#
# Run: bash scripts/brand/render-mark.sh   (requires ImageMagick)
#
# Baloo 2 sets the "F." and the wordmark; Nunito sets the ampersand device.
# Baloo 2 tops out at 800, which still reads a little light at mark size, so
# the glyphs are fattened with a uniform alpha dilation (disc kernel) rather
# than a stroke — a stroke on a trimmed layer seams down the stem, and
# dilation preserves the rounded terminals the whole brand rests on.
#
# The "F." is set as a single string so it keeps the font's own metrics and
# baseline, then centred as one group; the full stop is recoloured acid by
# compositing a disc over the period's measured bounds. Centring the two
# glyphs independently pulls the F off-centre, which is the bug this avoids.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
root="$(cd "$here/../.." && pwd)"
out="$root/public"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

DISPLAY_FONT="$here/baloo2-800.ttf"
AMP_FONT="$here/nunito-900.ttf"

PT=340
FAT=7 # dilation radius in px at PT — the "thicker" dial

INK='#0E0E12'
PAPER='#FFFDF2'
ACID='#D4FF00'
MAGENTA='#FF1F8F'

fatten() { # $1 = glyph, $2 = out
  convert -background none -fill white -font "$DISPLAY_FONT" -pointsize "$PT" \
    label:"$1" -bordercolor none -border 40 \
    -channel A -morphology Dilate "Disk:$FAT" +channel \
    -trim +repage "$2"
}

fatten 'F.' "$work/group.png"
fatten '.' "$work/dot.png"

# `identify -format` emits no trailing newline, which makes `read` exit
# non-zero under `set -e`; the printf adds one.
read -r GW GH < <(identify -format "%w %h\n" "$work/group.png")
read -r DW _ < <(identify -format "%w %h\n" "$work/dot.png")
DR=$((DW / 2))
DCX=$((GW - DR))
DCY=$((GH - DR))

mark() { # $1 = glyph colour, $2 = out
  convert "$work/group.png" -fill "$1" -colorize 100 \
    \( "$work/group.png" -alpha extract \) \
    -alpha off -compose CopyOpacity -composite -alpha on \
    -fill "$ACID" -draw "circle $DCX,$DCY $DCX,$((DCY - DR))" \
    "$2"
}

mark "$PAPER" "$out/mark-paper.png"
mark "$INK" "$out/mark-ink.png"

# App icon: mark centred in the ink tile at ~68% of tile width.
convert -size 512x512 "xc:$INK" \
  \( "$out/mark-paper.png" -resize 348x \) \
  -gravity center -composite "$out/icon-512.png"
convert "$out/icon-512.png" -resize 192x192 "$out/icon-192.png"
convert "$out/icon-512.png" -resize 180x180 "$out/icon-180.png"

# Ampersand device: magenta solid offset behind ink. Solid offset, never blur.
convert -size 512x512 "xc:$PAPER" \
  -font "$AMP_FONT" -pointsize 400 -gravity center \
  -fill "$MAGENTA" -annotate +12+12 '&' \
  -fill "$INK" -annotate +0+0 '&' \
  "$out/ampersand.png"

# Open Graph card: wordmark on paper with the acid full stop.
convert -size 1200x630 "xc:$PAPER" \
  -font "$DISPLAY_FONT" -pointsize 150 -gravity center \
  -fill "$INK" -annotate +0-30 'FUNCTION.' \
  -font "$DISPLAY_FONT" -pointsize 40 \
  -fill "$INK" -annotate +0+70 'Become annoyingly capable.' \
  "$out/og.png"

echo "mark ${GW}x${GH}, dot ${DW}px, acid centre ${DCX},${DCY}"

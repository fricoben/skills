# Media Compression Skill

Compress images and videos using FFmpeg to reduce file size while preserving visual quality.

## Prerequisites

Ensure FFmpeg is installed:
```bash
# macOS
brew install ffmpeg

# Check installation
ffmpeg -version
```

## Image Compression

### PNG/JPEG to WebP (recommended for web)

Lossless WebP (identical quality, ~25-35% smaller):
```bash
ffmpeg -i input.png -lossless 1 output.webp
```

Near-lossless WebP (visually identical, ~50-70% smaller):
```bash
ffmpeg -i input.png -quality 90 output.webp
ffmpeg -i input.jpg -quality 85 output.webp
```

### Batch convert images to WebP

```bash
# All PNGs in current directory
for f in *.png; do ffmpeg -i "$f" -quality 90 "${f%.png}.webp"; done

# All JPEGs
for f in *.jpg; do ffmpeg -i "$f" -quality 85 "${f%.jpg}.webp"; done
```

### Optimize PNG (keep as PNG)

```bash
ffmpeg -i input.png -compression_level 100 output.png
```

## Video Compression

### MP4 to WebM (VP9 - excellent quality/size ratio)

High quality (visually lossless, good compression):
```bash
ffmpeg -i input.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus -b:a 128k output.webm
```

Maximum quality (larger file):
```bash
ffmpeg -i input.mp4 -c:v libvpx-vp9 -crf 20 -b:v 0 -c:a libopus -b:a 192k output.webm
```

### Optimize MP4 (H.264 with better compression)

Visually lossless (CRF 18-23 recommended):
```bash
ffmpeg -i input.mp4 -c:v libx264 -crf 20 -preset slow -c:a aac -b:a 128k output.mp4
```

### MP4 to H.265/HEVC (best compression, ~50% smaller than H.264)

```bash
ffmpeg -i input.mp4 -c:v libx265 -crf 24 -preset medium -c:a aac -b:a 128k output.mp4
```

Note: H.265 has better compression but slower encoding. CRF 24 for H.265 ≈ CRF 20 for H.264.

### Batch convert videos

```bash
# All MP4s to WebM
for f in *.mp4; do ffmpeg -i "$f" -c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus -b:a 128k "${f%.mp4}.webm"; done
```

## Quick Reference

| Source | Target | Command |
|--------|--------|---------|
| PNG | WebP (lossless) | `ffmpeg -i in.png -lossless 1 out.webp` |
| PNG/JPG | WebP (quality) | `ffmpeg -i in.png -quality 90 out.webp` |
| MP4 | WebM (VP9) | `ffmpeg -i in.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus out.webm` |
| MP4 | MP4 (H.264) | `ffmpeg -i in.mp4 -c:v libx264 -crf 20 -preset slow out.mp4` |
| MP4 | MP4 (H.265) | `ffmpeg -i in.mp4 -c:v libx265 -crf 24 -preset medium out.mp4` |

## CRF Values Guide

Lower CRF = higher quality, larger file. Higher CRF = lower quality, smaller file.

**H.264 (libx264):**
- 0 = lossless
- 18 = visually lossless
- 23 = default (good quality)
- 28 = acceptable quality

**H.265 (libx265):**
- 0 = lossless
- 20 = visually lossless
- 28 = default (good quality)

**VP9 (libvpx-vp9):**
- 0 = lossless
- 20-25 = high quality
- 30-35 = good quality (recommended)

## Tips

1. **Always preview** a short clip before batch processing
2. **Keep originals** until you verify output quality
3. **Use -preset slow** for H.264/H.265 when file size matters more than encoding time
4. **WebP** is widely supported in browsers and gives excellent compression for images
5. **VP9/WebM** is great for web video but encoding is slower than H.264

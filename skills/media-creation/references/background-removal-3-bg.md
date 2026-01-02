# Background Removal (Black/White/Red)

Script location: `scripts/extract_transparency.py` (included in this skill).

## Problem Setup
Given three renders of the same image:
- Black background (B=0)
- White background (B=1)
- Colored background (default red: B=(1,0,0))

For a pixel with true color C and alpha A composited over background B:

`Result = C * A + B * (1 - A)`

## Two-Background Alpha (Black + White)
From black and white:
- Black: `R_black = C * A`
- White: `R_white = C * A + (1 - A)`

Solve for alpha (per channel):
- `A = 1 - (R_white - R_black)`

Implementation details:
- Compute alpha per channel, then average across RGB.
- Clamp alpha to [0, 1].

## Three-Background Alpha Refinement (Black + White + Red)
The script refines alpha using the colored background:

For a colored background channel:
- `R_colored = C * A + B * (1 - A)`
- Given `C * A = R_black`, solve:
- `A = 1 - (R_colored - R_black) / B`

Practical steps used:
1. Compute `alpha_initial` from black/white.
2. For each channel where the colored background component > 0.1:
   - Compute `alpha_ch = 1 - (img_colored[ch] - img_black[ch]) / bg_color[ch]`.
   - Clamp to [0, 1].
3. Weighted average:
   - 0.5 weight to `alpha_initial`.
   - Remaining 0.5 distributed equally across colored-channel estimates.
4. Clamp final alpha to [0, 1].

## Color Recovery
Color is recovered from the black background using premultiplication:
- `C = R_black / A` (with epsilon to avoid divide-by-zero)
- If A is effectively zero, color is set to 0.
- Clamp C to [0, 1].

## Output
- Combine RGB color and alpha into an RGBA image.
- Save as PNG.
- Script prints alpha statistics (min, max, and counts of transparent/opaque pixels).

## Defaults
- Colored background defaults to red `(1.0, 0.0, 0.0)`.
- Images are loaded as float32 arrays normalized to [0, 1].
- All inputs must have identical dimensions.

## Gemini Background-Variant Workflow
Gemini does not reliably output true transparency. The preferred workflow is:
1. Generate the base image.
2. Ask Gemini to regenerate variants on **solid white**, **solid black**, and **solid red** backgrounds using the original image as context (keep subject/pose identical).
3. Run the extractor with those three images to recover a clean RGBA PNG.

## Two-Background Option (Quality Tradeoff)
The extractor supports two backgrounds (black + white) and gives good results. Using **black + red only** is weaker:
- Red background only provides an alpha estimate for the red channel; green/blue channels give no new information beyond the black image.
- This reduces robustness around dark or red-tinted subjects and can produce less stable alpha.
Recommendation: use **black + white** if you must use two, and use all three for best accuracy.

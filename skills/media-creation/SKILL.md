---
name: media-creation
description: >
  Creates images and video via Alibaba Wan 2.6 (DashScope), Google Gemini/Veo, and OpenAI GPT Image 1.5 APIs, plus background extraction workflows.
  Trigger terms: image generation, video generation, dashscope, wan 2.6, alibaba, gemini, banana, veo, gpt image, openai images, background removal, alpha extraction.
---

## When to Use
- Generate images or video via Alibaba Wan, Google Gemini/Veo, or OpenAI GPT Image APIs.
- Convert black/white/red background renders into a transparent RGBA output.

## When NOT to Use
- If API access or credentials are not available.
- If the task does not involve media generation or background extraction.

## Inputs the Agent Should Ask For (only if missing; otherwise proceed)
- Provider: Alibaba Wan (DashScope), Google (Gemini/Veo), or OpenAI (GPT Image).
- Model ID and task type (T2I, I2V, T2V).
- Prompt text and any input image path (for I2V).
- Output size/resolution and aspect ratio.
- Desired output format and count.
- For background extraction: paths to black/white/red background images and the colored background RGB (0-1).
- Credentials env vars: `DASHSCOPE_API_KEY`, `GOOGLE_GENAI_API_KEY`, `OPENAI_API_KEY`.

## Outputs / Definition of Done
- A clear, credential-safe request plan or script snippet using placeholders for keys.
- For generation: task submission, polling, and decode/download steps.
- For background removal: algorithm steps and expected RGBA output.

## Procedure
- Use `references/alibaba-wan-api.md` for Wan 2.6 endpoints and parameters (image, T2V, I2V).
- Use `references/gemini-banana-api.md` for Gemini 3 Pro Image and Veo 3.1 in the Gemini API.
- Use `references/openai-gpt-image-api.md` for GPT Image 1.5 endpoints and parameters.
- Use `references/background-removal-3-bg.md` for the three-background alpha extraction algorithm.
- Never include real API keys; use env vars or placeholders.
- Placeholders are replaced during deployment via dotenvx from the encrypted `.env`.

## Checks & Guardrails (accessibility, consistency, performance, security)
- Do not embed or log API keys; require env vars or user-provided secrets.
- Validate image sizes/formats and rate limits.
- Ensure base64 encoding formats match API expectations.
- Keep credentials as placeholders (e.g., `$OPENAI_API_KEY`) so deploy-time replacement can fill them.

## References
- references/alibaba-wan-api.md
- references/gemini-banana-api.md
- references/openai-gpt-image-api.md
- references/background-removal-3-bg.md

## Scripts
- None.

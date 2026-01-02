# Google Gemini / Veo ("Banana") API Notes

Sources: Google AI for Developers docs (Gemini image generation and Veo 3.1 video). Credentials redacted.

## Overview (latest models only)
- Image generation:
  - `gemini-2.5-flash-image` (recommended, fast)
  - `gemini-3-pro-image-preview` (higher quality)
- Video generation: `veo-3.1-generate-preview` (paid preview)

## Auth and Base URL
- Base URL: `https://generativelanguage.googleapis.com/v1beta`
- Header: `X-goog-api-key: ${GOOGLE_GENAI_API_KEY}` (placeholder; replaced at deploy time)

## Image Generation (Gemini 3 Pro Image)

Endpoint pattern:
- `POST /models/{model}:generateContent`

Request structure:
```json
{
  "contents": [{
    "parts": [{"text": "<prompt>"}]
  }],
  "generationConfig": {
    "responseModalities": ["IMAGE"],
    "imageConfig": {
      "imageSize": "4K",
      "aspectRatio": "16:9"
    }
  }
}
```

Notes:
- `imageSize` values: `"1K"`, `"2K"`, `"4K"` (uppercase K).
- `aspectRatio` values include `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `9:16`, `16:9`, `21:9`.

Response contains base64 image data:
```json
{
  "candidates": [{
    "content": {
      "parts": [{
        "inlineData": {
          "mimeType": "image/jpeg",
          "data": "<base64>"
        }
      }]
    }
  }]
}
```

## Video Generation (Veo 3.1)

Gemini API uses long-running operations for video generation.

SDK pattern:
- `client.models.generate_videos(model="veo-3.1-generate-preview", prompt=...)`
- Poll the operation until done, then download `generated_videos[0].video`.

REST pattern:
- `POST /models/veo-3.1-generate-preview:predictLongRunning`
- Poll `GET /{operation_name}` until `done=true`, then download the video from
  `response.generateVideoResponse.generatedSamples[0].video.uri` using the API key.

Image-to-video: pass a starting image along with the prompt.

## Security
- Do not store API keys in repo.
- Use environment variables or a local config file ignored by Git.

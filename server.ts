import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import express, { type Request, type Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import {
  getPixelDimensions,
  type ImageSize,
  type SupportedAspectRatio,
} from './src/utils/storyboard.ts';

const PORT = Number(process.env.PORT) || 3000;
const GEMINI_MODEL_ID = 'gemini-3-pro-image-preview';
const FREE_MODEL_ID = 'ai-horde-community';
const AI_HORDE_API = 'https://aihorde.net/api/v2';

const VALID_IMAGE_SIZES = new Set<ImageSize>(['1K', '2K', '4K']);
const VALID_ASPECT_RATIOS = new Set<SupportedAspectRatio>([
  '1:1',
  '3:4',
  '4:3',
  '9:16',
  '16:9',
]);

interface GenerateImageRequestBody {
  prompt?: unknown;
  aspectRatio?: unknown;
  imageSize?: unknown;
  provider?: unknown;
}

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'MISSING_API_KEY: GEMINI_API_KEY is not configured. Add a billing-enabled Gemini key in Settings > Secrets, switch to Free (AI Horde), or use Copy Prompt + Upload Image with Google AI Pro.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const rawMessage = err instanceof Error ? err.message : String(err);

  if (rawMessage.startsWith('MISSING_API_KEY:')) {
    return {
      status: 400,
      message: rawMessage.replace('MISSING_API_KEY:', '').trim(),
    };
  }

  if (
    rawMessage.includes('PERMISSION_DENIED') ||
    rawMessage.includes('API_KEY_INVALID') ||
    rawMessage.includes('403')
  ) {
    return {
      status: 403,
      message:
        'API key permission denied or invalid for gemini-3-pro-image-preview. Verify a billing-enabled API key in Settings > Secrets, or switch to Free (AI Horde).',
    };
  }

  if (rawMessage.includes('RESOURCE_EXHAUSTED') || rawMessage.includes('429')) {
    return {
      status: 429,
      message:
        'Paid tier required or quota exceeded for gemini-3-pro-image-preview. Switch Engine to Free (AI Horde), or copy prompts to Google AI Pro and upload images back.',
    };
  }

  if (rawMessage.includes('NOT_FOUND') || rawMessage.includes('404')) {
    return {
      status: 404,
      message: `Model ${GEMINI_MODEL_ID} was not found or is unavailable for this API key.`,
    };
  }

  return {
    status: 500,
    message: rawMessage || 'Failed to generate image via Gemini API.',
  };
}

async function submitAiHordeJob(
  prompt: string,
  aspectRatio: SupportedAspectRatio,
  imageSize: ImageSize
): Promise<{ jobId: string }> {
  const { width, height } = getPixelDimensions(aspectRatio, imageSize);
  // Move "no text / no watermark" clauses into AI Horde's native ### negative prompt so CLIP focuses on the scene
  const positive = prompt
    .replace(/Strictly clean photographic frame only:.*$/is, '')
    .replace(/,?\s*no text,?\s*no letters,?\s*no watermark,?\s*no typography\.?/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 600);
  const fullPrompt = `${positive} ### text, words, letters, watermark, logo, signature, caption, typography, ui overlay, nsfw, nude`;

  const upstream = await fetch(`${AI_HORDE_API}/generate/async`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: '0000000000',
      'Client-Agent': 'CleanFrameStudio:1.0:aistudio-build',
    },
    body: JSON.stringify({
      prompt: fullPrompt,
      params: {
        width,
        height,
        steps: 22,
        cfg_scale: 7,
        n: 1,
      },
      nsfw: false,
      censor_nsfw: true,
      models: ['epiCRealism', 'Deliberate', 'DreamShaper', 'Realistic Vision'],
      r2: true,
    }),
    signal: AbortSignal.timeout(15_000),
  });

  const data = (await upstream.json()) as { id?: string; message?: string };
  if (!upstream.ok || !data.id) {
    throw new Error(
      data.message ||
        `Free AI Horde service returned HTTP ${upstream.status}. Please retry or use Google AI Pro Copy+Upload.`
    );
  }

  return { jobId: data.id };
}

async function createApp() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    const hasKey =
      Boolean(process.env.GEMINI_API_KEY?.trim()) &&
      process.env.GEMINI_API_KEY?.trim() !== 'MY_GEMINI_API_KEY';
    res.json({
      ok: true,
      model: GEMINI_MODEL_ID,
      freeModel: FREE_MODEL_ID,
      apiKeyConfigured: hasKey,
    });
  });

  app.post('/api/generate-image', async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as GenerateImageRequestBody;
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    const requestedSize =
      typeof body.imageSize === 'string'
        ? (body.imageSize.trim().toUpperCase() as ImageSize)
        : '1K';
    const requestedRatio =
      typeof body.aspectRatio === 'string'
        ? (body.aspectRatio.trim() as SupportedAspectRatio)
        : '9:16';
    const provider =
      body.provider === 'free-horde' ? 'free-horde' : 'gemini';

    if (!prompt) {
      res.status(400).json({ error: 'A non-empty clean prompt is required.' });
      return;
    }

    const imageSize: ImageSize = VALID_IMAGE_SIZES.has(requestedSize)
      ? requestedSize
      : '1K';
    const aspectRatio: SupportedAspectRatio = VALID_ASPECT_RATIOS.has(
      requestedRatio
    )
      ? requestedRatio
      : '9:16';

    if (provider === 'free-horde') {
      try {
        const { jobId } = await submitAiHordeJob(
          prompt,
          aspectRatio,
          imageSize
        );
        res.status(202).json({
          pending: true,
          jobId,
          provider: 'free-horde',
          model: FREE_MODEL_ID,
          imageSize,
          aspectRatio,
        });
      } catch (err) {
        res.status(502).json({
          error:
            err instanceof Error
              ? err.message
              : 'Free AI Horde submission failed.',
        });
      }
      return;
    }

    try {
      const ai = getGenAIClient();
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL_ID,
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio,
            imageSize,
          },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts ?? [];
      let imageDataUrl: string | null = null;
      let mimeType = 'image/png';
      let modelNote = '';

      for (const part of parts) {
        if (part.inlineData?.data) {
          mimeType = part.inlineData.mimeType ?? 'image/png';
          imageDataUrl = `data:${mimeType};base64,${part.inlineData.data}`;
          break;
        }
        if (part.text) {
          modelNote += part.text;
        }
      }

      if (!imageDataUrl) {
        res.status(502).json({
          error: modelNote
            ? `Model returned text without an image: ${modelNote}`
            : 'No image data was returned by gemini-3-pro-image-preview.',
        });
        return;
      }

      res.json({
        imageUrl: imageDataUrl,
        mimeType,
        model: GEMINI_MODEL_ID,
        provider: 'gemini',
        imageSize,
        aspectRatio,
      });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.get(
    '/api/generate-image/status/:jobId',
    async (req: Request, res: Response) => {
      const jobId = String(req.params.jobId ?? '').trim();
      if (!jobId) {
        res.status(400).json({ error: 'Missing jobId parameter.' });
        return;
      }

      try {
        const statusRes = await fetch(
          `${AI_HORDE_API}/generate/status/${encodeURIComponent(jobId)}`,
          {
            headers: {
              'Client-Agent': 'CleanFrameStudio:1.0:aistudio-build',
            },
            signal: AbortSignal.timeout(15_000),
          }
        );

        const data = (await statusRes.json()) as {
          done?: boolean;
          faulted?: boolean;
          wait_time?: number;
          queue_position?: number;
          message?: string;
          generations?: Array<{ img?: string; censored?: boolean }>;
        };

        if (!statusRes.ok) {
          res.status(502).json({
            error:
              data.message ||
              `Free AI Horde status check failed (${statusRes.status}).`,
          });
          return;
        }

        if (data.faulted) {
          res.status(502).json({
            error: 'Free worker faulted while rendering. Please try again.',
          });
          return;
        }

        if (!data.done) {
          res.json({
            done: false,
            queuePosition: data.queue_position ?? 0,
            waitTime: data.wait_time ?? 0,
          });
          return;
        }

        const firstGen = data.generations?.[0];
        if (firstGen?.censored) {
          res.status(502).json({
            error:
              'Free worker triggered a false-positive filter on this scene. Click Try Again to route to another worker.',
          });
          return;
        }

        const remoteImgUrl = firstGen?.img;
        if (!remoteImgUrl) {
          res.status(502).json({
            error: 'Free worker completed without returning an image.',
          });
          return;
        }

        const imgRes = await fetch(remoteImgUrl, {
          signal: AbortSignal.timeout(20_000),
        });
        if (!imgRes.ok) {
          res.status(502).json({
            error: `Failed to download rendered image (${imgRes.status}).`,
          });
          return;
        }

        const mimeType = imgRes.headers.get('content-type') || 'image/webp';
        const arrayBuf = await imgRes.arrayBuffer();
        const base64 = Buffer.from(arrayBuf).toString('base64');

        res.json({
          done: true,
          imageUrl: `data:${mimeType};base64,${base64}`,
          mimeType,
          model: FREE_MODEL_ID,
          provider: 'free-horde',
        });
      } catch (err) {
        res.status(502).json({
          error:
            err instanceof Error
              ? err.message
              : 'Failed to check free image status.',
        });
      }
    }
  );

  const distDir = path.resolve(process.cwd(), 'dist');
  const distIndex = path.join(distDir, 'index.html');
  const isDev =
    process.env.NODE_ENV === 'development' || !fs.existsSync(distIndex);

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(distIndex);
    });
  }

  return app;
}

createApp()
  .then((app) => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`CleanFrame Studio listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { ImageSize, SupportedAspectRatio } from '../utils/storyboard';

export type ImageEngineProvider = 'gemini' | 'free-horde';

interface ResolutionToolbarProps {
  provider: ImageEngineProvider;
  onChangeProvider: (provider: ImageEngineProvider) => void;
  imageSize: ImageSize;
  onChangeImageSize: (size: ImageSize) => void;
  aspectRatioOverride: 'auto' | SupportedAspectRatio;
  detectedAspectRatio: SupportedAspectRatio;
  onChangeAspectRatioOverride: (ratio: 'auto' | SupportedAspectRatio) => void;
  frameCount: number;
  generatedCount: number;
  onCopyAllPrompts: () => Promise<boolean>;
}

const IMAGE_SIZES: Array<{ value: ImageSize; label: string; detail: string }> = [
  { value: '1K', label: '1K', detail: 'Fast draft' },
  { value: '2K', label: '2K', detail: 'Sharp HD' },
  { value: '4K', label: '4K', detail: 'Ultra crisp' },
];

const ASPECT_OPTIONS: Array<{
  value: 'auto' | SupportedAspectRatio;
  label: string;
}> = [
  { value: 'auto', label: 'From JSON' },
  { value: '9:16', label: '9:16 Vertical' },
  { value: '16:9', label: '16:9 Wide' },
  { value: '3:4', label: '3:4 Portrait' },
  { value: '4:3', label: '4:3 Standard' },
  { value: '1:1', label: '1:1 Square' },
];

export const ResolutionToolbar: React.FC<ResolutionToolbarProps> = ({
  provider,
  onChangeProvider,
  imageSize,
  onChangeImageSize,
  aspectRatioOverride,
  detectedAspectRatio,
  onChangeAspectRatioOverride,
  frameCount,
  generatedCount,
  onCopyAllPrompts,
}) => {
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyAll = async () => {
    const ok = await onCopyAllPrompts();
    if (ok) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };

  return (
    <section
      aria-label="Output controls"
      className="bg-white border border-slate-200 rounded-xl px-4 py-3.5 sm:px-5 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-3 text-sm text-slate-600">
          <span className="font-medium text-slate-900">
            Clean Output Pipeline
          </span>
          <span aria-hidden="true" className="hidden sm:inline text-slate-300">
            ·
          </span>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono tabular-nums text-slate-600">
              {provider === 'gemini'
                ? 'gemini-3-pro-image-preview'
                : 'ai-horde-community'}
            </span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span className="tabular-nums text-slate-500">
              {generatedCount}/{frameCount} frames ready
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <span
              id="engine-group-label"
              className="text-xs font-medium text-slate-600 whitespace-nowrap"
            >
              Engine
            </span>
            <div
              role="group"
              aria-labelledby="engine-group-label"
              className="inline-flex items-center p-1 bg-slate-100 rounded-lg"
            >
              <button
                type="button"
                aria-pressed={provider === 'gemini'}
                onClick={() => onChangeProvider('gemini')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#217346] ${
                  provider === 'gemini'
                    ? 'bg-white text-[#217346] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Gemini 3 Pro
              </button>
              <button
                type="button"
                aria-pressed={provider === 'free-horde'}
                onClick={() => onChangeProvider('free-horde')}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#217346] ${
                  provider === 'free-horde'
                    ? 'bg-white text-[#217346] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Free (AI Horde)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="aspect-ratio-select"
              className="text-xs font-medium text-slate-600 whitespace-nowrap"
            >
              Ratio
            </label>
            <select
              id="aspect-ratio-select"
              value={aspectRatioOverride}
              onChange={(e) =>
                onChangeAspectRatioOverride(
                  e.target.value as 'auto' | SupportedAspectRatio
                )
              }
              className="h-9 px-2.5 text-xs font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus-visible:outline-2 focus-visible:outline-[#217346] font-mono tabular-nums"
            >
              {ASPECT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.value === 'auto'
                    ? `From JSON (${detectedAspectRatio})`
                    : opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span
              id="resolution-group-label"
              className="text-xs font-medium text-slate-600 whitespace-nowrap"
            >
              Image Size
            </span>
            <div
              role="group"
              aria-labelledby="resolution-group-label"
              className="inline-flex items-center p-1 bg-slate-100 rounded-lg"
            >
              {IMAGE_SIZES.map((option) => {
                const selected = imageSize === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onChangeImageSize(option.value)}
                    className={`px-3 py-1.5 text-xs font-mono font-semibold tabular-nums rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#217346] ${
                      selected
                        ? 'bg-white text-[#217346] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title={option.detail}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            disabled={frameCount === 0}
            onClick={handleCopyAll}
            className="h-9 px-3 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 disabled:opacity-45 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[#217346]"
          >
            {copiedAll ? (
              <Check className="w-3.5 h-3.5 text-[#217346]" aria-hidden="true" />
            ) : (
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            {copiedAll ? 'Copied All Prompts' : 'Copy All Prompts'}
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-500 border-t border-slate-100 pt-2.5">
        {provider === 'free-horde'
          ? 'Free (AI Horde) renders watermark-free images on community GPUs without an API key (short queue wait). Or use Copy Prompt + Upload Image with your Google AI Pro plan.'
          : 'Gemini 3 Pro renders high-resolution 1K/2K/4K images using a billing-enabled Gemini key, or use Copy Prompt + Upload Image on each card with your Google AI Pro plan.'}
      </p>
    </section>
  );
};

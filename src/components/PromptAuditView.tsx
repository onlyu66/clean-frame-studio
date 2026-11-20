import React, { useState } from 'react';
import { Check, Copy, Film } from 'lucide-react';
import type {
  CleanSceneFrame,
  ImageSize,
  SupportedAspectRatio,
} from '../utils/storyboard';

interface PromptAuditViewProps {
  frames: CleanSceneFrame[];
  aspectRatio: SupportedAspectRatio;
  imageSize: ImageSize;
  onCopyImagePrompt: (frame: CleanSceneFrame) => Promise<boolean>;
  onCopyVideoPrompt: (frame: CleanSceneFrame) => Promise<boolean>;
  onCopyAllImagePrompts: () => Promise<boolean>;
  onCopyAllVideoPrompts: () => Promise<boolean>;
}

export const PromptAuditView: React.FC<PromptAuditViewProps> = ({
  frames,
  aspectRatio,
  imageSize,
  onCopyImagePrompt,
  onCopyVideoPrompt,
  onCopyAllImagePrompts,
  onCopyAllVideoPrompts,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedBundle, setCopiedBundle] = useState<'image' | 'video' | null>(
    null
  );

  const hasVideoPrompts = frames.some((f) => Boolean(f.videoPrompt));

  if (frames.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
        <h2 className="text-base font-semibold text-slate-900">
          No storyboard frames to audit
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Switch to the Storyboard tab and provide a valid JSON payload first.
        </p>
      </div>
    );
  }

  const handleCopyCell = async (
    frame: CleanSceneFrame,
    kind: 'image' | 'video'
  ) => {
    const ok =
      kind === 'image'
        ? await onCopyImagePrompt(frame)
        : await onCopyVideoPrompt(frame);
    if (ok) {
      const k = `${frame.id}:${kind}`;
      setCopiedKey(k);
      setTimeout(() => setCopiedKey((prev) => (prev === k ? null : prev)), 1800);
    }
  };

  const handleCopyAll = async (kind: 'image' | 'video') => {
    const ok =
      kind === 'image'
        ? await onCopyAllImagePrompts()
        : await onCopyAllVideoPrompts();
    if (ok) {
      setCopiedBundle(kind);
      setTimeout(() => setCopiedBundle(null), 2000);
    }
  };

  return (
    <section
      aria-label="Synchronized image and video prompt audit"
      className="bg-white border border-slate-200 rounded-xl overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Side-by-Side Image &amp; Video Prompt Sync
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Each scene pairs its clean image prompt next to its clean video
            motion prompt, with all Vietnamese overlays and captions stripped.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono tabular-nums text-slate-600 mr-1">
            {frames.length} frames · {aspectRatio} · {imageSize}
          </span>
          <button
            type="button"
            onClick={() => handleCopyAll('image')}
            className="px-3 py-1.5 text-xs font-medium text-white bg-[#217346] hover:bg-[#1a5c38] rounded-lg transition-colors whitespace-nowrap inline-flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[#217346]"
          >
            {copiedBundle === 'image' ? (
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            {copiedBundle === 'image'
              ? 'Copied All Images'
              : 'Copy All Image Prompts'}
          </button>
          {hasVideoPrompts && (
            <button
              type="button"
              onClick={() => handleCopyAll('video')}
              className="px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap inline-flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[#217346]"
            >
              {copiedBundle === 'video' ? (
                <Check
                  className="w-3.5 h-3.5 text-[#217346]"
                  aria-hidden="true"
                />
              ) : (
                <Film className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              {copiedBundle === 'video'
                ? 'Copied All Videos'
                : 'Copy All Video Prompts'}
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
              <th className="py-3 px-4 w-32">Frame</th>
              <th className="py-3 px-4 min-w-[280px]">
                Image Prompt (Clean)
              </th>
              <th className="py-3 px-4 min-w-[280px]">
                Video Motion Prompt (Clean)
              </th>
              <th className="py-3 px-4 w-64">Stripped Text (Excluded)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-xs">
            {frames.map((frame) => {
              const imgCopied = copiedKey === `${frame.id}:image`;
              const vidCopied = copiedKey === `${frame.id}:video`;
              const allExcluded = [
                ...frame.excludedFields,
                ...(frame.videoPrompt?.excludedFields ?? []),
              ];

              return (
                <tr key={frame.id} className="align-top hover:bg-slate-50/60">
                  <td className="py-3.5 px-4 font-medium text-slate-900 whitespace-nowrap">
                    <div>{frame.label}</div>
                    <div className="font-mono text-[11px] text-slate-500 tabular-nums mt-0.5">
                      {aspectRatio} · {imageSize}
                      {frame.videoPrompt?.durationSec
                        ? ` · ${frame.videoPrompt.durationSec}s`
                        : ''}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-800">
                        Still Frame
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCell(frame, 'image')}
                        aria-label={`Copy image prompt for ${frame.label}`}
                        className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors inline-flex items-center gap-1 whitespace-nowrap"
                      >
                        {imgCopied ? (
                          <Check
                            className="w-3 h-3 text-[#217346]"
                            aria-hidden="true"
                          />
                        ) : (
                          <Copy className="w-3 h-3" aria-hidden="true" />
                        )}
                        {imgCopied ? 'Copied' : 'Copy Image'}
                      </button>
                    </div>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                      {frame.cleanPrompt}
                    </p>
                  </td>

                  <td className="py-3.5 px-4 space-y-2.5">
                    {frame.videoPrompt ? (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-slate-800">
                            Motion ({frame.videoPrompt.durationSec ?? '?'}s)
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCell(frame, 'video')}
                            aria-label={`Copy video motion prompt for ${frame.label}`}
                            className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors inline-flex items-center gap-1 whitespace-nowrap"
                          >
                            {vidCopied ? (
                              <Check
                                className="w-3 h-3 text-[#217346]"
                                aria-hidden="true"
                              />
                            ) : (
                              <Film className="w-3 h-3" aria-hidden="true" />
                            )}
                            {vidCopied ? 'Copied' : 'Copy Video'}
                          </button>
                        </div>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                          {frame.videoPrompt.cleanMotionPrompt}
                        </p>
                      </>
                    ) : (
                      <span className="text-slate-400">
                        No matching scene_clips entry (Cover frame is image-only)
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    {allExcluded.length === 0 ? (
                      <span className="text-slate-400">None present</span>
                    ) : (
                      <dl className="space-y-2">
                        {allExcluded.map((field, idx) => (
                          <div key={`${field.key}-${idx}`}>
                            <dt className="font-mono text-[11px] font-semibold text-red-700">
                              {field.key}
                            </dt>
                            <dd className="text-slate-600 line-through decoration-red-400/60 mt-0.5">
                              {field.value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

import React from 'react';
import { Download, Image as ImageIcon, Maximize2 } from 'lucide-react';
import type { CleanSceneFrame } from '../utils/storyboard';
import type { FrameGenerationState } from './FrameCard';

interface OutputGalleryViewProps {
  frames: CleanSceneFrame[];
  generations: Record<string, FrameGenerationState>;
  onGoToStoryboard: () => void;
  onPreview: (frame: CleanSceneFrame, imageUrl: string) => void;
  onDownload: (frame: CleanSceneFrame, imageUrl: string) => void;
  onDownloadAll: () => void;
}

export const OutputGalleryView: React.FC<OutputGalleryViewProps> = ({
  frames,
  generations,
  onGoToStoryboard,
  onPreview,
  onDownload,
  onDownloadAll,
}) => {
  const readyFrames = frames.filter((frame) => {
    const state = generations[frame.id];
    return state?.status === 'success' && Boolean(state.imageUrl);
  });

  if (readyFrames.length === 0) {
    return (
      <section className="bg-white border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
          <ImageIcon className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="space-y-1 max-w-md">
          <h2 className="text-base font-semibold text-slate-900">
            No generated frames yet
          </h2>
          <p className="text-sm text-slate-600">
            Generate individual scenes or run the full storyboard batch to collect
            clean, text-free images here.
          </p>
        </div>
        <button
          type="button"
          onClick={onGoToStoryboard}
          className="mt-1 px-4 py-2 text-sm font-medium text-white bg-[#217346] hover:bg-[#1a5c38] rounded-lg transition-colors"
        >
          Back to Storyboard
        </button>
      </section>
    );
  }

  return (
    <section aria-label="Generated output gallery" className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="text-sm text-slate-700">
          <span className="font-semibold text-slate-900 tabular-nums">
            {readyFrames.length}
          </span>{' '}
          clean {readyFrames.length === 1 ? 'image' : 'images'} ready for export
        </div>
        <button
          type="button"
          onClick={onDownloadAll}
          className="px-3.5 py-2 text-xs font-medium text-white bg-[#217346] hover:bg-[#1a5c38] rounded-lg transition-colors inline-flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          Download All ({readyFrames.length})
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {readyFrames.map((frame) => {
          const gen = generations[frame.id];
          const url = gen.imageUrl!;
          return (
            <article
              key={frame.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col"
            >
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  {frame.label}
                </h3>
                <span className="text-xs font-mono tabular-nums text-slate-500">
                  {gen.generatedRatio ?? frame.aspectRatio} ·{' '}
                  {gen.generatedSize ?? '1K'}
                </span>
              </div>
              <div className="aspect-[9/16] bg-slate-100 overflow-hidden">
                <img
                  src={url}
                  alt={`Clean output image for ${frame.label}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3 border-t border-slate-200 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onPreview(frame, url)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Inspect
                </button>
                <button
                  type="button"
                  onClick={() => onDownload(frame, url)}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-[#217346] hover:bg-[#1a5c38] rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  Download PNG
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

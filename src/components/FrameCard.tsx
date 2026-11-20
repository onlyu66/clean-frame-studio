import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  Film,
  Image as ImageIcon,
  Maximize2,
  RefreshCw,
  Upload,
} from 'lucide-react';
import type {
  CleanSceneFrame,
  ImageSize,
  SupportedAspectRatio,
} from '../utils/storyboard';

export interface FrameGenerationState {
  status: 'idle' | 'loading' | 'success' | 'error';
  imageUrl?: string;
  errorMessage?: string;
  generatedSize?: ImageSize;
  generatedRatio?: SupportedAspectRatio;
  sourceLabel?: string;
  statusDetail?: string;
}

interface FrameCardProps {
  frame: CleanSceneFrame;
  effectiveAspectRatio: SupportedAspectRatio;
  targetImageSize: ImageSize;
  generation: FrameGenerationState;
  onGenerate: (frame: CleanSceneFrame) => void;
  onImportFile: (frame: CleanSceneFrame, file: File) => void;
  onCopyImagePrompt: (frame: CleanSceneFrame) => Promise<boolean>;
  onCopyVideoPrompt: (frame: CleanSceneFrame) => Promise<boolean>;
  onPreview: (frame: CleanSceneFrame, imageUrl: string) => void;
  onDownload: (frame: CleanSceneFrame, imageUrl: string) => void;
}

const ASPECT_CLASS_MAP: Record<SupportedAspectRatio, string> = {
  '9:16': 'aspect-[9/16]',
  '16:9': 'aspect-[16/9]',
  '3:4': 'aspect-[3/4]',
  '4:3': 'aspect-[4/3]',
  '1:1': 'aspect-square',
};

export const FrameCard: React.FC<FrameCardProps> = ({
  frame,
  effectiveAspectRatio,
  targetImageSize,
  generation,
  onGenerate,
  onImportFile,
  onCopyImagePrompt,
  onCopyVideoPrompt,
  onPreview,
  onDownload,
}) => {
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [copiedType, setCopiedType] = useState<'image' | 'video' | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectClass = ASPECT_CLASS_MAP[effectiveAspectRatio] ?? 'aspect-[9/16]';
  const isLoading = generation.status === 'loading';
  const hasImage =
    generation.status === 'success' &&
    Boolean(generation.imageUrl) &&
    !imageLoadFailed;

  const allExcludedKeys = [
    ...frame.excludedFields.map((f) => f.key),
    ...(frame.videoPrompt?.excludedFields.map((f) => f.key) ?? []),
  ];
  const uniqueExcludedKeys = Array.from(new Set(allExcludedKeys));
  const strippedKeysText =
    uniqueExcludedKeys.length > 0 ? uniqueExcludedKeys.join(' · ') : 'none';

  const handleCopyImage = async () => {
    const ok = await onCopyImagePrompt(frame);
    if (ok) {
      setCopiedType('image');
      setTimeout(() => setCopiedType((p) => (p === 'image' ? null : p)), 1800);
    }
  };

  const handleCopyVideo = async () => {
    const ok = await onCopyVideoPrompt(frame);
    if (ok) {
      setCopiedType('video');
      setTimeout(() => setCopiedType((p) => (p === 'video' ? null : p)), 1800);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageLoadFailed(false);
      onImportFile(frame, file);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageLoadFailed(false);
      onImportFile(frame, file);
    }
  };

  const statusLabel =
    generation.status === 'success'
      ? generation.sourceLabel ?? 'Clean image'
      : generation.status === 'loading'
        ? 'Rendering'
        : generation.status === 'error'
          ? 'Error'
          : frame.videoPrompt?.durationSec
            ? `${frame.videoPrompt.durationSec}s clip`
            : 'Ready';

  return (
    <article
      data-testid={`frame-card-${frame.id}`}
      className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col"
    >
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 truncate">
            {frame.label}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono tabular-nums">
            <span>{effectiveAspectRatio}</span>
            <span aria-hidden="true">·</span>
            <span>{generation.generatedSize ?? targetImageSize}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{statusLabel}</span>
          </div>
        </div>

        <button
          type="button"
          disabled={isLoading}
          onClick={() => {
            setImageLoadFailed(false);
            onGenerate(frame);
          }}
          aria-label={
            hasImage ? `Regenerate ${frame.label}` : `Generate ${frame.label}`
          }
          className="px-3 py-1.5 text-xs font-medium text-white bg-[#217346] hover:bg-[#1a5c38] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[#217346]"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          {hasImage ? 'Regenerate' : 'Generate'}
        </button>
      </div>

      <div className="p-3.5 flex-1 flex flex-col gap-2.5">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`relative w-full ${aspectClass} rounded-lg overflow-hidden border transition-colors flex flex-col ${
            isDragOver
              ? 'border-[#217346] bg-[#217346]/5'
              : 'border-slate-200/80 bg-slate-100'
          }`}
        >
          {hasImage && generation.imageUrl ? (
            <>
              <img
                src={generation.imageUrl}
                alt={`Clean generated frame for ${frame.label}`}
                referrerPolicy="no-referrer"
                onError={() => setImageLoadFailed(true)}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/75 via-black/35 to-transparent flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => onPreview(frame, generation.imageUrl!)}
                  aria-label={`Inspect ${frame.label}`}
                  className="px-2.5 py-1.5 text-xs font-medium text-white bg-black/55 hover:bg-black/75 rounded-md backdrop-blur-xs transition-colors inline-flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-white"
                >
                  <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Inspect
                </button>
                <button
                  type="button"
                  onClick={() => onDownload(frame, generation.imageUrl!)}
                  aria-label={`Download ${frame.label} PNG`}
                  className="px-2.5 py-1.5 text-xs font-medium text-white bg-[#217346] hover:bg-[#1a5c38] rounded-md transition-colors inline-flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-white"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  Download
                </button>
              </div>
            </>
          ) : isLoading ? (
            <div className="w-full h-full p-5 flex flex-col items-center justify-center text-center gap-3 bg-slate-50">
              <div className="w-9 h-9 rounded-lg border-2 border-[#217346]/25 border-t-[#217346] animate-spin" />
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-900">
                  Generating clean {targetImageSize} image
                </p>
                <p className="text-[11px] font-mono text-slate-500">
                  {generation.statusDetail
                    ? generation.statusDetail
                    : `No overlay text · ${effectiveAspectRatio}`}
                </p>
              </div>
            </div>
          ) : generation.status === 'error' || imageLoadFailed ? (
            <div
              role="alert"
              className="w-full h-full p-5 flex flex-col items-center justify-center text-center gap-3 bg-red-50/70"
            >
              <AlertTriangle
                className="w-6 h-6 text-red-600 shrink-0"
                aria-hidden="true"
              />
              <div className="space-y-1 max-w-xs">
                <p className="text-xs font-semibold text-red-900">
                  Generation failed
                </p>
                <p className="text-xs text-red-700 leading-relaxed">
                  {imageLoadFailed
                    ? 'The generated image could not be decoded by the browser.'
                    : generation.errorMessage}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setImageLoadFailed(false);
                    onGenerate(frame);
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-red-800 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Upload Image
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full h-full p-5 flex flex-col justify-between bg-gradient-to-b from-slate-50 to-slate-100/80">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>TEXT-FREE FRAME</span>
                <span>{effectiveAspectRatio}</span>
              </div>

              <div className="my-auto flex flex-col items-center text-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500">
                  <ImageIcon className="w-5 h-5" aria-hidden="true" />
                </div>
                <p className="text-xs text-slate-700 leading-relaxed line-clamp-5">
                  {frame.basePromptEn}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-500 text-center">
                Generate at {targetImageSize} or drop an image from Google AI Pro
              </div>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="sr-only"
          aria-label={`Upload image file for ${frame.label}`}
        />

        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={handleCopyImage}
            aria-label={`Copy image prompt for ${frame.label}`}
            className="py-1.5 px-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors whitespace-nowrap inline-flex items-center justify-center gap-1 focus-visible:outline-2 focus-visible:outline-[#217346]"
          >
            {copiedType === 'image' ? (
              <Check className="w-3.5 h-3.5 text-[#217346]" aria-hidden="true" />
            ) : (
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
            )}
            {copiedType === 'image' ? 'Copied' : 'Copy Image'}
          </button>

          {frame.videoPrompt ? (
            <button
              type="button"
              onClick={handleCopyVideo}
              aria-label={`Copy video motion prompt for ${frame.label}`}
              className="py-1.5 px-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors whitespace-nowrap inline-flex items-center justify-center gap-1 focus-visible:outline-2 focus-visible:outline-[#217346]"
            >
              {copiedType === 'video' ? (
                <Check
                  className="w-3.5 h-3.5 text-[#217346]"
                  aria-hidden="true"
                />
              ) : (
                <Film className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              {copiedType === 'video' ? 'Copied' : 'Copy Video'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label={`Upload image for ${frame.label}`}
              className="py-1.5 px-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors whitespace-nowrap inline-flex items-center justify-center gap-1 focus-visible:outline-2 focus-visible:outline-[#217346]"
            >
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              {hasImage ? 'Replace' : 'Upload'}
            </button>
          )}
        </div>

        {frame.videoPrompt && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label={`Upload image for ${frame.label}`}
            className="w-full py-1.5 px-2.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap inline-flex items-center justify-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[#217346]"
          >
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            {hasImage ? 'Replace Image' : 'Upload Image from Google AI Pro'}
          </button>
        )}

        <div className="space-y-1 text-xs pt-0.5">
          {frame.videoPrompt && (
            <div className="text-slate-600 leading-relaxed line-clamp-2">
              <span className="font-medium text-slate-800">
                Video ({frame.videoPrompt.durationSec ?? '?'}s):
              </span>{' '}
              {frame.videoPrompt.motionPromptEn}
            </div>
          )}
          <div className="text-[11px] text-slate-500 font-mono truncate">
            Excluded: {strippedKeysText}
          </div>
        </div>
      </div>
    </article>
  );
};

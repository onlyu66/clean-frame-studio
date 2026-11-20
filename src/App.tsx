import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TopBar, type WorkspaceTab } from './components/TopBar';
import {
  ResolutionToolbar,
  type ImageEngineProvider,
} from './components/ResolutionToolbar';
import { JsonEditorPanel } from './components/JsonEditorPanel';
import { FrameCard, type FrameGenerationState } from './components/FrameCard';
import { PromptAuditView } from './components/PromptAuditView';
import { OutputGalleryView } from './components/OutputGalleryView';
import { ImageLightboxModal } from './components/ImageLightboxModal';
import {
  loadGenerationsFromStorage,
  loadSettingsSync,
  mergeHydratedGenerations,
  saveGenerationsToStorage,
  saveSettingsSync,
  type JsonEditorTab,
  type PersistedWorkspaceSettings,
} from './utils/persistence';
import {
  CLIP_SCRIPT_SAMPLE_JSON,
  DEFAULT_STORYBOARD_JSON,
  formatAllCleanPromptsForCopy,
  formatAllVideoPromptsForCopy,
  syncImageAndVideoStoryboards,
  type CleanSceneFrame,
  type ImageSize,
  type SupportedAspectRatio,
} from './utils/storyboard';

const DEFAULT_PERSISTED_SETTINGS: PersistedWorkspaceSettings = {
  rawImageJson: DEFAULT_STORYBOARD_JSON,
  rawVideoJson: CLIP_SCRIPT_SAMPLE_JSON,
  activeTab: 'storyboard',
  activeJsonTab: 'image',
  provider: 'gemini',
  imageSize: '1K',
  aspectRatioOverride: 'auto',
};

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall back to execCommand below
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export default function App() {
  const initialSettings = useMemo(
    () => loadSettingsSync(DEFAULT_PERSISTED_SETTINGS),
    []
  );

  const [rawImageJson, setRawImageJson] = useState<string>(
    initialSettings.rawImageJson
  );
  const [rawVideoJson, setRawVideoJson] = useState<string>(
    initialSettings.rawVideoJson
  );
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(
    initialSettings.activeTab
  );
  const [activeJsonTab, setActiveJsonTab] = useState<JsonEditorTab>(
    initialSettings.activeJsonTab
  );
  const [provider, setProvider] = useState<ImageEngineProvider>(
    initialSettings.provider
  );
  const [imageSize, setImageSize] = useState<ImageSize>(
    initialSettings.imageSize
  );
  const [aspectRatioOverride, setAspectRatioOverride] = useState<
    'auto' | SupportedAspectRatio
  >(initialSettings.aspectRatioOverride);
  const [generations, setGenerations] = useState<
    Record<string, FrameGenerationState>
  >({});
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<{
    frame: CleanSceneFrame;
    imageUrl: string;
  } | null>(null);

  const hasHydratedGenerationsRef = useRef(false);
  const clearedAllGenerationsRef = useRef(false);
  const touchedGenerationIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    saveSettingsSync({
      rawImageJson,
      rawVideoJson,
      activeTab,
      activeJsonTab,
      provider,
      imageSize,
      aspectRatioOverride,
    });
  }, [
    rawImageJson,
    rawVideoJson,
    activeTab,
    activeJsonTab,
    provider,
    imageSize,
    aspectRatioOverride,
  ]);

  useEffect(() => {
    let active = true;
    loadGenerationsFromStorage()
      .then((restored) => {
        if (!active) return;
        hasHydratedGenerationsRef.current = true;
        if (clearedAllGenerationsRef.current) {
          return;
        }
        if (Object.keys(restored).length > 0) {
          setGenerations((current) =>
            mergeHydratedGenerations(
              restored,
              current,
              touchedGenerationIdsRef.current
            )
          );
        }
      })
      .catch(() => {
        if (active) {
          hasHydratedGenerationsRef.current = true;
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hasHydratedGenerationsRef.current) {
      return;
    }
    void saveGenerationsToStorage(generations);
  }, [generations]);

  const synced = useMemo(
    () => syncImageAndVideoStoryboards(rawImageJson, rawVideoJson),
    [rawImageJson, rawVideoJson]
  );

  const frames = synced.frames;
  const detectedAspectRatio = synced.aspectRatio;
  const effectiveAspectRatio: SupportedAspectRatio =
    aspectRatioOverride === 'auto' ? detectedAspectRatio : aspectRatioOverride;

  const generatedCount = useMemo(
    () =>
      frames.filter((f) => generations[f.id]?.status === 'success').length,
    [frames, generations]
  );

  const generateSingleFrame = useCallback(
    async (frame: CleanSceneFrame) => {
      const targetRatio =
        aspectRatioOverride === 'auto' ? frame.aspectRatio : aspectRatioOverride;

      clearedAllGenerationsRef.current = false;
      touchedGenerationIdsRef.current.add(frame.id);
      setGenerations((prev) => ({
        ...prev,
        [frame.id]: {
          status: 'loading',
        },
      }));

      try {
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: frame.cleanPrompt,
            aspectRatio: targetRatio,
            imageSize,
            provider,
          }),
        });

        const payload = (await res.json()) as {
          pending?: boolean;
          jobId?: string;
          imageUrl?: string;
          error?: string;
          imageSize?: ImageSize;
          aspectRatio?: SupportedAspectRatio;
          provider?: ImageEngineProvider;
        };

        if (!res.ok) {
          throw new Error(
            payload.error || `Server returned status ${res.status}`
          );
        }

        if (payload.pending && payload.jobId) {
          const maxAttempts = 45;
          let completedUrl: string | null = null;
          for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await new Promise((resolve) => setTimeout(resolve, 2500));
            const statusRes = await fetch(
              `/api/generate-image/status/${encodeURIComponent(payload.jobId)}`
            );
            const statusData = (await statusRes.json()) as {
              done?: boolean;
              queuePosition?: number;
              waitTime?: number;
              imageUrl?: string;
              error?: string;
            };

            if (!statusRes.ok) {
              throw new Error(
                statusData.error ||
                  `Free worker status check failed (${statusRes.status})`
              );
            }

            if (statusData.done && statusData.imageUrl) {
              completedUrl = statusData.imageUrl;
              break;
            }

            setGenerations((prev) => ({
              ...prev,
              [frame.id]: {
                status: 'loading',
                statusDetail:
                  statusData.queuePosition && statusData.queuePosition > 0
                    ? `Free queue #${statusData.queuePosition} · ~${statusData.waitTime ?? 0}s`
                    : 'Rendering on community GPU...',
              },
            }));
          }

          if (!completedUrl) {
            throw new Error(
              'Free community queue timed out. Please retry or use Copy Image + Upload Image with Google AI Pro.'
            );
          }

          setGenerations((prev) => ({
            ...prev,
            [frame.id]: {
              status: 'success',
              imageUrl: completedUrl,
              generatedSize: imageSize,
              generatedRatio: targetRatio,
              sourceLabel: 'Free',
            },
          }));
          return;
        }

        if (!payload.imageUrl) {
          throw new Error(
            payload.error || `Server returned status ${res.status}`
          );
        }

        setGenerations((prev) => ({
          ...prev,
          [frame.id]: {
            status: 'success',
            imageUrl: payload.imageUrl,
            generatedSize: payload.imageSize ?? imageSize,
            generatedRatio: payload.aspectRatio ?? targetRatio,
            sourceLabel: 'Gemini 3',
          },
        }));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unexpected generation error.';
        setGenerations((prev) => ({
          ...prev,
          [frame.id]: {
            status: 'error',
            errorMessage: message,
          },
        }));
      }
    },
    [aspectRatioOverride, imageSize, provider]
  );

  const handleGenerateAll = useCallback(async () => {
    if (frames.length === 0 || isGeneratingAll) {
      return;
    }
    setIsGeneratingAll(true);
    try {
      for (const frame of frames) {
        await generateSingleFrame(frame);
      }
    } finally {
      setIsGeneratingAll(false);
    }
  }, [frames, generateSingleFrame, isGeneratingAll]);

  const handleImportFile = useCallback(
    (frame: CleanSceneFrame, file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const targetRatio =
            aspectRatioOverride === 'auto'
              ? frame.aspectRatio
              : aspectRatioOverride;
          clearedAllGenerationsRef.current = false;
          touchedGenerationIdsRef.current.add(frame.id);
          setGenerations((prev) => ({
            ...prev,
            [frame.id]: {
              status: 'success',
              imageUrl: reader.result as string,
              generatedSize: imageSize,
              generatedRatio: targetRatio,
              sourceLabel: 'Imported',
            },
          }));
        }
      };
      reader.readAsDataURL(file);
    },
    [aspectRatioOverride, imageSize]
  );

  const handleCopyImagePrompt = useCallback(
    async (frame: CleanSceneFrame): Promise<boolean> => {
      const targetRatio =
        aspectRatioOverride === 'auto' ? frame.aspectRatio : aspectRatioOverride;
      const text = `Aspect ratio: ${targetRatio}\n\n${frame.cleanPrompt}`;
      return copyTextToClipboard(text);
    },
    [aspectRatioOverride]
  );

  const handleCopyVideoPrompt = useCallback(
    async (frame: CleanSceneFrame): Promise<boolean> => {
      if (!frame.videoPrompt) return false;
      const targetRatio =
        aspectRatioOverride === 'auto' ? frame.aspectRatio : aspectRatioOverride;
      const text = `Aspect ratio: ${targetRatio}\n\n${frame.videoPrompt.cleanMotionPrompt}`;
      return copyTextToClipboard(text);
    },
    [aspectRatioOverride]
  );

  const handleCopyAllImagePrompts = useCallback(async (): Promise<boolean> => {
    if (frames.length === 0) return false;
    const bundle = formatAllCleanPromptsForCopy(frames, effectiveAspectRatio);
    return copyTextToClipboard(bundle);
  }, [effectiveAspectRatio, frames]);

  const handleCopyAllVideoPrompts = useCallback(async (): Promise<boolean> => {
    const bundle = formatAllVideoPromptsForCopy(frames, effectiveAspectRatio);
    if (!bundle) return false;
    return copyTextToClipboard(bundle);
  }, [effectiveAspectRatio, frames]);

  const handleFormatActiveJson = useCallback(
    (tab: 'image' | 'video') => {
      const source = tab === 'image' ? rawImageJson : rawVideoJson;
      try {
        const obj = JSON.parse(source);
        const formatted = JSON.stringify(obj, null, 2);
        if (tab === 'image') {
          setRawImageJson(formatted);
        } else {
          setRawVideoJson(formatted);
        }
      } catch {
        // Keep invalid input untouched so inline error remains visible
      }
    },
    [rawImageJson, rawVideoJson]
  );

  const handleLoadSampleForTab = useCallback((tab: 'image' | 'video') => {
    if (tab === 'image') {
      setRawImageJson(DEFAULT_STORYBOARD_JSON);
      setAspectRatioOverride('auto');
    } else {
      setRawVideoJson(CLIP_SCRIPT_SAMPLE_JSON);
    }
  }, []);

  const handleClearActiveJson = useCallback((tab: 'image' | 'video') => {
    if (tab === 'image') {
      setRawImageJson('');
      clearedAllGenerationsRef.current = true;
      touchedGenerationIdsRef.current.clear();
      setGenerations({});
      void saveGenerationsToStorage({});
    } else {
      setRawVideoJson('');
    }
  }, []);

  const handleDownloadFrame = useCallback(
    (frame: CleanSceneFrame, imageUrl: string) => {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `${frame.id}-clean-${imageSize.toLowerCase()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [imageSize]
  );

  const handleDownloadAll = useCallback(() => {
    frames.forEach((frame, index) => {
      const state = generations[frame.id];
      if (state?.status === 'success' && state.imageUrl) {
        setTimeout(() => {
          handleDownloadFrame(frame, state.imageUrl!);
        }, index * 150);
      }
    });
  }, [frames, generations, handleDownloadFrame]);

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        frameCount={frames.length}
        generatedCount={generatedCount}
        isGeneratingAll={isGeneratingAll}
        canGenerate={frames.length > 0}
        onGenerateAll={handleGenerateAll}
      />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900 text-balance">
            Synced Image &amp; Video Storyboard Studio
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl">
            Pairs <span className="font-mono text-xs">scene_images</span> with{' '}
            <span className="font-mono text-xs">scene_clips</span> by scene so
            clean image prompts and clean video motion prompts sit side-by-side,
            free of Vietnamese overlays, captions, and spoken lines.
          </p>
        </div>

        <ResolutionToolbar
          provider={provider}
          onChangeProvider={setProvider}
          imageSize={imageSize}
          onChangeImageSize={setImageSize}
          aspectRatioOverride={aspectRatioOverride}
          detectedAspectRatio={detectedAspectRatio}
          onChangeAspectRatioOverride={setAspectRatioOverride}
          frameCount={frames.length}
          generatedCount={generatedCount}
          onCopyAllPrompts={handleCopyAllImagePrompts}
        />

        {activeTab === 'storyboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-[440px_minmax(0,1fr)] gap-6 items-start">
            <JsonEditorPanel
              activeJsonTab={activeJsonTab}
              onChangeActiveJsonTab={setActiveJsonTab}
              rawImageJson={rawImageJson}
              rawVideoJson={rawVideoJson}
              onChangeImageJson={setRawImageJson}
              onChangeVideoJson={setRawVideoJson}
              onFormatActiveJson={handleFormatActiveJson}
              onLoadSampleForTab={handleLoadSampleForTab}
              onClearActiveJson={handleClearActiveJson}
              synced={synced}
            />

            <section aria-label="Extracted clean scene frames">
              {frames.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {frames.map((frame) => (
                    <FrameCard
                      key={frame.id}
                      frame={frame}
                      effectiveAspectRatio={effectiveAspectRatio}
                      targetImageSize={imageSize}
                      generation={generations[frame.id] ?? { status: 'idle' }}
                      onGenerate={generateSingleFrame}
                      onImportFile={handleImportFile}
                      onCopyImagePrompt={handleCopyImagePrompt}
                      onCopyVideoPrompt={handleCopyVideoPrompt}
                      onPreview={(f, url) =>
                        setPreviewTarget({ frame: f, imageUrl: url })
                      }
                      onDownload={handleDownloadFrame}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3">
                  <h2 className="text-base font-semibold text-slate-900">
                    Waiting for valid storyboard JSON
                  </h2>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    Fix the JSON syntax on the left or reload the sample
                    Image &amp; Video templates.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleLoadSampleForTab('image')}
                      className="px-4 py-2 text-sm font-medium text-white bg-[#217346] hover:bg-[#1a5c38] rounded-lg transition-colors"
                    >
                      Load Image Sample
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSampleForTab('video')}
                      className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Load Video Sample
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'audit' && (
          <PromptAuditView
            frames={frames}
            aspectRatio={effectiveAspectRatio}
            imageSize={imageSize}
            onCopyImagePrompt={handleCopyImagePrompt}
            onCopyVideoPrompt={handleCopyVideoPrompt}
            onCopyAllImagePrompts={handleCopyAllImagePrompts}
            onCopyAllVideoPrompts={handleCopyAllVideoPrompts}
          />
        )}

        {activeTab === 'gallery' && (
          <OutputGalleryView
            frames={frames}
            generations={generations}
            onGoToStoryboard={() => setActiveTab('storyboard')}
            onPreview={(f, url) => setPreviewTarget({ frame: f, imageUrl: url })}
            onDownload={handleDownloadFrame}
            onDownloadAll={handleDownloadAll}
          />
        )}
      </main>

      <ImageLightboxModal
        frame={previewTarget?.frame ?? null}
        imageUrl={previewTarget?.imageUrl ?? null}
        onClose={() => setPreviewTarget(null)}
        onDownload={handleDownloadFrame}
      />
    </div>
  );
}

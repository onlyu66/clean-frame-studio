import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type { SyncedStoryboardsResult } from '../utils/storyboard';
import type { JsonEditorTab } from '../utils/persistence';

type JsonTab = JsonEditorTab;

interface JsonEditorPanelProps {
  activeJsonTab: JsonTab;
  onChangeActiveJsonTab: (tab: JsonTab) => void;
  rawImageJson: string;
  rawVideoJson: string;
  onChangeImageJson: (next: string) => void;
  onChangeVideoJson: (next: string) => void;
  onFormatActiveJson: (tab: JsonTab) => void;
  onLoadSampleForTab: (tab: JsonTab) => void;
  onClearActiveJson: (tab: JsonTab) => void;
  synced: SyncedStoryboardsResult;
}

export const JsonEditorPanel: React.FC<JsonEditorPanelProps> = ({
  activeJsonTab,
  onChangeActiveJsonTab,
  rawImageJson,
  rawVideoJson,
  onChangeImageJson,
  onChangeVideoJson,
  onFormatActiveJson,
  onLoadSampleForTab,
  onClearActiveJson,
  synced,
}) => {
  const activeValue = activeJsonTab === 'image' ? rawImageJson : rawVideoJson;
  const handleChange =
    activeJsonTab === 'image' ? onChangeImageJson : onChangeVideoJson;

  return (
    <aside
      aria-label="Synchronized Storyboard JSON inputs"
      className="bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden"
    >
      <div className="px-4 py-3.5 border-b border-slate-200 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Synced Storyboard JSON
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Pairs <span className="font-mono">scene_images</span> with{' '}
              <span className="font-mono">scene_clips</span> by scene number
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div
            role="tablist"
            aria-label="JSON input type"
            className="inline-flex items-center p-1 bg-slate-100 rounded-lg"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeJsonTab === 'image'}
              onClick={() => onChangeActiveJsonTab('image')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeJsonTab === 'image'
                  ? 'bg-white text-[#217346] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Image JSON
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeJsonTab === 'video'}
              onClick={() => onChangeActiveJsonTab('video')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeJsonTab === 'video'
                  ? 'bg-white text-[#217346] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Video JSON
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onFormatActiveJson(activeJsonTab)}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-md transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-[#217346]"
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              Format
            </button>
            <button
              type="button"
              onClick={() => onLoadSampleForTab(activeJsonTab)}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-md transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-[#217346]"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Sample
            </button>
            <button
              type="button"
              onClick={() => onClearActiveJson(activeJsonTab)}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1 focus-visible:outline-2 focus-visible:outline-[#217346]"
              aria-label={`Clear ${activeJsonTab} JSON`}
            >
              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col gap-3">
        <label htmlFor="storyboard-json-textarea" className="sr-only">
          {activeJsonTab === 'image'
            ? 'Image storyboard JSON payload'
            : 'Video motion clips JSON payload'}
        </label>
        <textarea
          id="storyboard-json-textarea"
          value={activeValue}
          onChange={(e) => handleChange(e.target.value)}
          spellCheck={false}
          rows={18}
          placeholder={
            activeJsonTab === 'image'
              ? 'Paste Image JSON ("cover_image" / "scene_images")...'
              : 'Paste Video JSON ("scene_clips" with "motion_prompt_en")...'
          }
          className="w-full min-h-[340px] lg:min-h-[450px] p-3.5 text-xs leading-relaxed font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded-lg resize-y focus:outline-none focus:border-[#217346] focus:ring-2 focus:ring-[#217346]/15"
        />

        <div className="space-y-2 pt-1">
          {synced.imageStatus.ok ? (
            <div className="flex items-start gap-2 text-xs text-slate-600">
              <CheckCircle2
                className="w-4 h-4 text-[#217346] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="font-medium text-slate-900">
                  Image: {synced.imageStatus.frames.length} frames
                </span>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <span className="font-mono tabular-nums">
                  {synced.aspectRatio}
                </span>
              </div>
            </div>
          ) : rawImageJson.trim() ? (
            <div
              role="alert"
              className="flex items-start gap-2 p-2.5 text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg"
            >
              <AlertCircle
                className="w-4 h-4 text-red-600 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>Image JSON: {synced.imageStatus.error}</span>
            </div>
          ) : null}

          {synced.videoStatus.ok ? (
            <div className="flex items-start gap-2 text-xs text-slate-600">
              <CheckCircle2
                className="w-4 h-4 text-[#217346] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="font-medium text-slate-900">
                  Video synced: {synced.videoStatus.matchedCount}/
                  {synced.videoStatus.clipCount} scenes matched
                </span>
                {synced.videoStatus.metaSummary && (
                  <>
                    <span aria-hidden="true" className="text-slate-300">
                      ·
                    </span>
                    <span className="text-slate-500">
                      {synced.videoStatus.metaSummary}
                    </span>
                  </>
                )}
              </div>
            </div>
          ) : synced.videoStatus.error ? (
            <div
              role="alert"
              className="flex items-start gap-2 p-2.5 text-xs text-red-800 bg-red-50 border border-red-200 rounded-lg"
            >
              <AlertCircle
                className="w-4 h-4 text-red-600 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>{synced.videoStatus.error}</span>
            </div>
          ) : (
            <div className="text-xs text-slate-500">
              Optional: Switch to <span className="font-medium">Video JSON</span>{' '}
              tab to attach motion prompts (<span className="font-mono">scene_clips</span>).
            </div>
          )}
        </div>

        {synced.imageStatus.ok &&
          (synced.imageStatus.visualStyleGuide ||
            synced.imageStatus.characterConsistencyNotes) && (
            <div className="border-t border-slate-200 pt-3 space-y-2 text-xs">
              {synced.imageStatus.visualStyleGuide && (
                <div>
                  <div className="font-medium text-slate-800 mb-0.5">
                    Applied Style Guide
                  </div>
                  <p className="text-slate-600 leading-relaxed line-clamp-2">
                    {synced.imageStatus.visualStyleGuide}
                  </p>
                </div>
              )}
              {synced.imageStatus.characterConsistencyNotes && (
                <div>
                  <div className="font-medium text-slate-800 mb-0.5">
                    Subject &amp; Lighting Consistency
                  </div>
                  <p className="text-slate-600 leading-relaxed line-clamp-2">
                    {synced.imageStatus.characterConsistencyNotes}
                  </p>
                </div>
              )}
            </div>
          )}
      </div>
    </aside>
  );
};

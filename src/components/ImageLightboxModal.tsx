import React, { useEffect } from 'react';
import { Download, X } from 'lucide-react';
import type { CleanSceneFrame } from '../utils/storyboard';

interface ImageLightboxModalProps {
  frame: CleanSceneFrame | null;
  imageUrl: string | null;
  onClose: () => void;
  onDownload: (frame: CleanSceneFrame, imageUrl: string) => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  frame,
  imageUrl,
  onClose,
  onDownload,
}) => {
  useEffect(() => {
    if (!frame) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [frame, onClose]);

  if (!frame || !imageUrl) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${frame.label} preview`}
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_320px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-900 flex items-center justify-center p-4 max-h-[70vh] md:max-h-[90vh] overflow-hidden">
          <img
            src={imageUrl}
            alt={`Full preview of ${frame.label}`}
            referrerPolicy="no-referrer"
            className="max-h-[65vh] md:max-h-[82vh] w-auto object-contain rounded-md"
          />
        </div>

        <div className="p-5 flex flex-col justify-between gap-4 border-t md:border-t-0 md:border-l border-slate-200 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  {frame.label}
                </h2>
                <p className="text-xs font-mono text-slate-500 mt-0.5">
                  Clean text-free frame
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close preview"
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-slate-800">
                Clean Image Prompt
              </div>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {frame.cleanPrompt}
              </p>
            </div>

            {frame.videoPrompt && (
              <div className="space-y-1.5 pt-3 border-t border-slate-200">
                <div className="text-xs font-semibold text-slate-800">
                  Synced Video Motion Prompt (
                  {frame.videoPrompt.durationSec ?? '?'}s)
                </div>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {frame.videoPrompt.cleanMotionPrompt}
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onDownload(frame, imageUrl)}
            className="w-full py-2.5 px-4 text-sm font-medium text-white bg-[#217346] hover:bg-[#1a5c38] rounded-lg transition-colors inline-flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            Download Clean PNG
          </button>
        </div>
      </div>
    </div>
  );
};

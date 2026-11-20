import React from 'react';

export type WorkspaceTab = 'storyboard' | 'audit' | 'gallery';

interface TopBarProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  frameCount: number;
  generatedCount: number;
  isGeneratingAll: boolean;
  canGenerate: boolean;
  onGenerateAll: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  frameCount,
  generatedCount,
  isGeneratingAll,
  canGenerate,
  onGenerateAll,
}) => {
  const tabs: Array<{ id: WorkspaceTab; label: string }> = [
    { id: 'storyboard', label: 'Storyboard' },
    { id: 'audit', label: 'Prompt Audit' },
    {
      id: 'gallery',
      label: generatedCount > 0 ? `Gallery (${generatedCount})` : 'Gallery',
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              onSelectTab('storyboard');
            }}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#217346]"
          >
            CleanFrame Studio
          </a>

          <nav
            aria-label="Workspace views"
            className="hidden md:flex items-center gap-7"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative py-5 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#217346] ${
                    isActive
                      ? 'text-[#217346]'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#217346]"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              disabled={!canGenerate || isGeneratingAll}
              onClick={onGenerateAll}
              className="px-4 py-2 text-sm font-medium text-white bg-[#217346] rounded-lg hover:bg-[#1a5c38] disabled:opacity-45 disabled:cursor-not-allowed transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#217346] tabular-nums"
            >
              {isGeneratingAll
                ? 'Generating...'
                : frameCount > 0
                  ? `Generate All (${frameCount})`
                  : 'Generate All'}
            </button>
          </div>
        </div>
      </header>

      <nav
        aria-label="Mobile workspace views"
        className="md:hidden bg-white border-b border-slate-200 px-4 flex items-center gap-6"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative py-3 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#217346] ${
                isActive
                  ? 'text-[#217346]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#217346]"
                />
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};

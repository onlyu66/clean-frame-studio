import type { FrameGenerationState } from '../components/FrameCard';
import type { ImageEngineProvider } from '../components/ResolutionToolbar';
import type { WorkspaceTab } from '../components/TopBar';
import type { ImageSize, SupportedAspectRatio } from './storyboard';

export type JsonEditorTab = 'image' | 'video';

export interface PersistedWorkspaceSettings {
  rawImageJson: string;
  rawVideoJson: string;
  activeTab: WorkspaceTab;
  activeJsonTab: JsonEditorTab;
  provider: ImageEngineProvider;
  imageSize: ImageSize;
  aspectRatioOverride: 'auto' | SupportedAspectRatio;
}

const SETTINGS_STORAGE_KEY = 'cleanframe_studio_settings_v1';
const GENERATIONS_FALLBACK_KEY = 'cleanframe_studio_generations_fallback_v1';
const IDB_NAME = 'cleanframe_studio_v1';
const IDB_VERSION = 1;
const IDB_STORE = 'workspace';
const IDB_GENERATIONS_KEY = 'generations';

const VALID_TABS = new Set<WorkspaceTab>(['storyboard', 'audit', 'gallery']);
const VALID_JSON_TABS = new Set<JsonEditorTab>(['image', 'video']);
const VALID_PROVIDERS = new Set<ImageEngineProvider>(['gemini', 'free-horde']);
const VALID_IMAGE_SIZES = new Set<ImageSize>(['1K', '2K', '4K']);
const VALID_FRAME_ASPECT_RATIOS = new Set<SupportedAspectRatio>([
  '1:1',
  '3:4',
  '4:3',
  '9:16',
  '16:9',
]);
const VALID_ASPECT_RATIOS = new Set<'auto' | SupportedAspectRatio>([
  'auto',
  ...VALID_FRAME_ASPECT_RATIOS,
]);

export function parsePersistedSettings(
  raw: string | null,
  defaults: PersistedWorkspaceSettings
): PersistedWorkspaceSettings {
  if (!raw) {
    return { ...defaults };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedWorkspaceSettings> | null;
    if (!parsed || typeof parsed !== 'object') {
      return { ...defaults };
    }

    return {
      rawImageJson:
        typeof parsed.rawImageJson === 'string'
          ? parsed.rawImageJson
          : defaults.rawImageJson,
      rawVideoJson:
        typeof parsed.rawVideoJson === 'string'
          ? parsed.rawVideoJson
          : defaults.rawVideoJson,
      activeTab:
        parsed.activeTab && VALID_TABS.has(parsed.activeTab)
          ? parsed.activeTab
          : defaults.activeTab,
      activeJsonTab:
        parsed.activeJsonTab && VALID_JSON_TABS.has(parsed.activeJsonTab)
          ? parsed.activeJsonTab
          : defaults.activeJsonTab,
      provider:
        parsed.provider && VALID_PROVIDERS.has(parsed.provider)
          ? parsed.provider
          : defaults.provider,
      imageSize:
        parsed.imageSize && VALID_IMAGE_SIZES.has(parsed.imageSize)
          ? parsed.imageSize
          : defaults.imageSize,
      aspectRatioOverride:
        parsed.aspectRatioOverride &&
        VALID_ASPECT_RATIOS.has(parsed.aspectRatioOverride)
          ? parsed.aspectRatioOverride
          : defaults.aspectRatioOverride,
    };
  } catch {
    return { ...defaults };
  }
}

export function sanitizePersistedGenerations(
  input: unknown
): Record<string, FrameGenerationState> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {};
  }

  const output: Record<string, FrameGenerationState> = {};
  for (const [frameId, rawState] of Object.entries(
    input as Record<string, unknown>
  )) {
    if (!frameId || !rawState || typeof rawState !== 'object') {
      continue;
    }

    const state = rawState as Partial<FrameGenerationState>;
    if (
      state.status === 'success' &&
      typeof state.imageUrl === 'string' &&
      state.imageUrl.length > 0
    ) {
      output[frameId] = {
        status: 'success',
        imageUrl: state.imageUrl,
        ...(state.generatedSize && VALID_IMAGE_SIZES.has(state.generatedSize)
          ? { generatedSize: state.generatedSize }
          : {}),
        ...(state.generatedRatio &&
        VALID_FRAME_ASPECT_RATIOS.has(state.generatedRatio)
          ? { generatedRatio: state.generatedRatio }
          : {}),
        ...(typeof state.sourceLabel === 'string' && state.sourceLabel
          ? { sourceLabel: state.sourceLabel }
          : {}),
      };
    } else if (
      state.status === 'error' &&
      typeof state.errorMessage === 'string' &&
      state.errorMessage.length > 0
    ) {
      output[frameId] = {
        status: 'error',
        errorMessage: state.errorMessage,
      };
    }
    // Interrupted 'loading' or 'idle' entries are intentionally omitted so
    // reloaded frames return cleanly to ready state rather than spinning forever.
  }

  return output;
}

export function mergeHydratedGenerations(
  restored: Record<string, FrameGenerationState>,
  current: Record<string, FrameGenerationState>,
  touchedIds?: ReadonlySet<string>
): Record<string, FrameGenerationState> {
  const merged: Record<string, FrameGenerationState> = { ...restored };
  for (const [frameId, state] of Object.entries(current)) {
    if (touchedIds?.has(frameId) || state.status !== 'idle') {
      merged[frameId] = state;
    }
  }
  return merged;
}

export function loadSettingsSync(
  defaults: PersistedWorkspaceSettings
): PersistedWorkspaceSettings {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { ...defaults };
    }
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    return parsePersistedSettings(raw, defaults);
  } catch {
    return { ...defaults };
  }
}

export function saveSettingsSync(settings: PersistedWorkspaceSettings): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota / privacy mode errors
  }
}

function openWorkspaceDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

export async function loadGenerationsFromStorage(): Promise<
  Record<string, FrameGenerationState>
> {
  try {
    const db = await openWorkspaceDb();
    try {
      const value = await new Promise<unknown>((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const store = tx.objectStore(IDB_STORE);
        const req = store.get(IDB_GENERATIONS_KEY);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () =>
          reject(req.error ?? new Error('Failed to read generations'));
      });
      const sanitized = sanitizePersistedGenerations(value);
      if (Object.keys(sanitized).length > 0) {
        return sanitized;
      }
    } finally {
      db.close();
    }
  } catch {
    // Fall through to localStorage backup
  }

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const fallbackRaw = window.localStorage.getItem(GENERATIONS_FALLBACK_KEY);
      if (fallbackRaw) {
        return sanitizePersistedGenerations(JSON.parse(fallbackRaw));
      }
    }
  } catch {
    // Ignore fallback errors
  }

  return {};
}

export async function saveGenerationsToStorage(
  generations: Record<string, FrameGenerationState>
): Promise<void> {
  const sanitized = sanitizePersistedGenerations(generations);

  try {
    const db = await openWorkspaceDb();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        const store = tx.objectStore(IDB_STORE);
        if (Object.keys(sanitized).length === 0) {
          store.delete(IDB_GENERATIONS_KEY);
        } else {
          store.put(sanitized, IDB_GENERATIONS_KEY);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () =>
          reject(tx.error ?? new Error('Failed to write generations'));
      });
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(GENERATIONS_FALLBACK_KEY);
      }
      return;
    } finally {
      db.close();
    }
  } catch {
    // Fallback to localStorage for smaller payloads if IndexedDB is unavailable
  }

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (Object.keys(sanitized).length === 0) {
        window.localStorage.removeItem(GENERATIONS_FALLBACK_KEY);
      } else {
        window.localStorage.setItem(
          GENERATIONS_FALLBACK_KEY,
          JSON.stringify(sanitized)
        );
      }
    }
  } catch {
    // Ignore quota exceeded in fallback mode
  }
}

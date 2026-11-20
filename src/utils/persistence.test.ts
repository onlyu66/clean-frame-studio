import assert from 'node:assert/strict';
import test from 'node:test';
import {
  mergeHydratedGenerations,
  parsePersistedSettings,
  sanitizePersistedGenerations,
  type PersistedWorkspaceSettings,
} from './persistence';

const DEFAULTS: PersistedWorkspaceSettings = {
  rawImageJson: '{"default":true}',
  rawVideoJson: '{"video":true}',
  activeTab: 'storyboard',
  activeJsonTab: 'image',
  provider: 'gemini',
  imageSize: '1K',
  aspectRatioOverride: 'auto',
};

test('parsePersistedSettings returns defaults for null or malformed JSON', () => {
  assert.deepEqual(parsePersistedSettings(null, DEFAULTS), DEFAULTS);
  assert.deepEqual(parsePersistedSettings('{bad json', DEFAULTS), DEFAULTS);
});

test('parsePersistedSettings preserves empty cleared JSON drafts and valid settings', () => {
  const saved = JSON.stringify({
    rawImageJson: '',
    rawVideoJson: '{"custom":1}',
    activeTab: 'audit',
    activeJsonTab: 'video',
    provider: 'free-horde',
    imageSize: '4K',
    aspectRatioOverride: '16:9',
  });

  assert.deepEqual(parsePersistedSettings(saved, DEFAULTS), {
    rawImageJson: '',
    rawVideoJson: '{"custom":1}',
    activeTab: 'audit',
    activeJsonTab: 'video',
    provider: 'free-horde',
    imageSize: '4K',
    aspectRatioOverride: '16:9',
  });
});

test('parsePersistedSettings falls back safely on invalid enum values', () => {
  const saved = JSON.stringify({
    rawImageJson: '{"edited":1}',
    activeTab: 'unknown-tab',
    activeJsonTab: 'audio',
    provider: 'unknown-engine',
    imageSize: '8K',
    aspectRatioOverride: '21:9',
  });

  const result = parsePersistedSettings(saved, DEFAULTS);
  assert.equal(result.rawImageJson, '{"edited":1}');
  assert.equal(result.rawVideoJson, DEFAULTS.rawVideoJson);
  assert.equal(result.activeTab, 'storyboard');
  assert.equal(result.activeJsonTab, 'image');
  assert.equal(result.provider, 'gemini');
  assert.equal(result.imageSize, '1K');
  assert.equal(result.aspectRatioOverride, 'auto');
});

test('sanitizePersistedGenerations drops loading states and invalid records while preserving images and errors', () => {
  const input = {
    cover: {
      status: 'success',
      imageUrl: 'data:image/png;base64,AAA',
      generatedSize: '2K',
      generatedRatio: '9:16',
      sourceLabel: 'Imported',
    },
    scene_1: {
      status: 'loading',
      statusDetail: 'Free queue #3',
    },
    scene_2: {
      status: 'success',
      imageUrl: '',
    },
    scene_3: {
      status: 'error',
      errorMessage: 'Queue timeout',
    },
  };

  assert.deepEqual(sanitizePersistedGenerations(input), {
    cover: {
      status: 'success',
      imageUrl: 'data:image/png;base64,AAA',
      generatedSize: '2K',
      generatedRatio: '9:16',
      sourceLabel: 'Imported',
    },
    scene_3: {
      status: 'error',
      errorMessage: 'Queue timeout',
    },
  });
});

test('mergeHydratedGenerations keeps in-flight or newly touched user actions over restored DB entries', () => {
  const restored = {
    cover: {
      status: 'success' as const,
      imageUrl: 'data:image/png;base64,OLD_COVER',
      sourceLabel: 'Free',
    },
    scene_1: {
      status: 'success' as const,
      imageUrl: 'data:image/png;base64,RESTORED_1',
      sourceLabel: 'Imported',
    },
  };

  const current = {
    cover: {
      status: 'loading' as const,
      statusDetail: 'Rendering...',
    },
  };

  const merged = mergeHydratedGenerations(
    restored,
    current,
    new Set(['cover'])
  );

  assert.equal(merged.cover.status, 'loading');
  assert.equal(merged.scene_1.imageUrl, 'data:image/png;base64,RESTORED_1');
});

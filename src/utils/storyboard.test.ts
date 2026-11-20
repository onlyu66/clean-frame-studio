import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CLIP_SCRIPT_SAMPLE_JSON,
  DEFAULT_STORYBOARD_JSON,
  formatAllCleanPromptsForCopy,
  formatAllVideoPromptsForCopy,
  getPixelDimensions,
  normalizeAspectRatio,
  parseStoryboardJson,
  sanitizeBasePrompt,
  syncImageAndVideoStoryboards,
} from './storyboard';

test('parses default storyboard JSON into cover + 5 scenes', () => {
  const result = parseStoryboardJson(DEFAULT_STORYBOARD_JSON);
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.equal(result.schemaType, 'image_storyboard');
  assert.equal(result.aspectRatio, '9:16');
  assert.equal(result.frames.length, 6);
  assert.equal(result.frames[0]?.id, 'cover');
  assert.equal(result.frames[0]?.label, 'Cover Frame');
  assert.equal(result.frames[1]?.id, 'scene-1');
  assert.equal(result.frames[5]?.id, 'scene-5');
});

test('strictly excludes overlay_text_vi, text_position, and visual_goal from cleanPrompt', () => {
  const result = parseStoryboardJson(DEFAULT_STORYBOARD_JSON);
  assert.equal(result.ok, true);
  if (!result.ok) return;

  for (const frame of result.frames) {
    for (const excluded of frame.excludedFields) {
      assert.equal(
        frame.cleanPrompt.includes(excluded.value),
        false,
        `cleanPrompt for ${frame.id} must not contain ${excluded.key} value`
      );
    }
    assert.equal(frame.cleanPrompt.includes('EXCEL: LỌC DỮ LIỆU'), false);
    assert.equal(frame.cleanPrompt.includes('CHIỀU THỨ 6'), false);
    assert.equal(frame.cleanPrompt.includes('top_safe'), false);
    assert.equal(frame.cleanPrompt.includes('bottom_safe'), false);
    assert.equal(frame.cleanPrompt.includes('Establish the stressful'), false);
  }
});

test('syncImageAndVideoStoryboards pairs Cover + Scene 1..5 with matched Video motion prompts', () => {
  const synced = syncImageAndVideoStoryboards(
    DEFAULT_STORYBOARD_JSON,
    CLIP_SCRIPT_SAMPLE_JSON
  );

  assert.equal(synced.imageStatus.ok, true);
  assert.equal(synced.videoStatus.ok, true);
  assert.equal(synced.videoStatus.clipCount, 5);
  assert.equal(synced.videoStatus.matchedCount, 5);
  assert.equal(synced.frames.length, 6);

  // Cover Frame has no video clip match; Scenes 1-5 match 1:1
  assert.equal(synced.frames[0]?.videoPrompt, null);
  assert.equal(synced.frames[1]?.videoPrompt?.durationSec, 6);
  assert.equal(
    synced.frames[1]?.videoPrompt?.cleanMotionPrompt.includes(
      'Subtle slow zoom into a computer screen'
    ),
    true
  );
  assert.equal(
    synced.frames[1]?.videoPrompt?.cleanMotionPrompt.includes('CHIỀU THỨ 6'),
    false
  );
  assert.equal(
    synced.frames[1]?.videoPrompt?.cleanMotionPrompt.includes('Lại là chiều thứ Sáu'),
    false
  );
});

test('formatAllVideoPromptsForCopy exports clean synced video motion prompts', () => {
  const synced = syncImageAndVideoStoryboards(
    DEFAULT_STORYBOARD_JSON,
    CLIP_SCRIPT_SAMPLE_JSON
  );
  const videoBundle = formatAllVideoPromptsForCopy(synced.frames, '9:16');
  assert.equal(
    videoBundle.includes('1. Scene 1 Video Motion | Aspect Ratio: 9:16 | Duration: 6s'),
    true
  );
  assert.equal(
    videoBundle.includes('5. Scene 5 Video Motion | Aspect Ratio: 9:16 | Duration: 6s'),
    true
  );
  assert.equal(videoBundle.includes('VỀ SỚM THÔI!'), false);
  assert.equal(videoBundle.includes('BÍ KÍP: CTRL'), false);
});

test('sanitizeBasePrompt strips text overlay space directives while preserving visual content', () => {
  const cleaned = sanitizeBasePrompt(
    'Warm sunset desk, clean background space for text overlay, no text, no watermark.'
  );
  assert.equal(cleaned.includes('text overlay'), false);
  assert.equal(cleaned.includes('Warm sunset desk'), true);
});

test('returns descriptive error on empty or invalid JSON', () => {
  const emptyRes = parseStoryboardJson('   ');
  assert.equal(emptyRes.ok, false);

  const badJsonRes = parseStoryboardJson('{ not valid json');
  assert.equal(badJsonRes.ok, false);

  const noFramesRes = parseStoryboardJson('{"platform": {"aspect_ratio": "9:16"}}');
  assert.equal(noFramesRes.ok, false);
});

test('normalizes aspect ratio with fallback from assembly_notes or 9:16', () => {
  assert.equal(normalizeAspectRatio('16:9'), '16:9');
  assert.equal(normalizeAspectRatio('9:16'), '9:16');
  assert.equal(
    normalizeAspectRatio(undefined, 'Xuất file ở định dạng ngang 16:9'),
    '16:9'
  );
  assert.equal(normalizeAspectRatio('invalid-ratio'), '9:16');
  assert.equal(normalizeAspectRatio(undefined), '9:16');
});

test('computes pixel dimensions aligned to multiples of 64', () => {
  const d1 = getPixelDimensions('9:16', '1K');
  assert.equal(d1.width, 512);
  assert.equal(d1.height, 896);
  assert.equal(d1.width % 64, 0);
  assert.equal(d1.height % 64, 0);

  const dWide = getPixelDimensions('16:9', '4K');
  assert.equal(dWide.width, 896);
  assert.equal(dWide.height, 512);
});

test('formatAllCleanPromptsForCopy includes all frames without leaking excluded Vietnamese text', () => {
  const parsed = parseStoryboardJson(DEFAULT_STORYBOARD_JSON);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;

  const bundle = formatAllCleanPromptsForCopy(parsed.frames, '9:16');
  assert.equal(bundle.includes('1. Cover Frame | Aspect Ratio: 9:16'), true);
  assert.equal(bundle.includes('6. Scene 5 | Aspect Ratio: 9:16'), true);
  assert.equal(bundle.includes('VỀ SỚM THÔI!'), false);
  assert.equal(bundle.includes('top_safe'), false);
  assert.equal(bundle.includes('Establish the stressful'), false);
});

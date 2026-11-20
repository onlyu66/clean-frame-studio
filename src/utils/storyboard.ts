export type ImageSize = '1K' | '2K' | '4K';

export type SupportedAspectRatio =
  | '1:1'
  | '3:4'
  | '4:3'
  | '9:16'
  | '16:9';

export interface StoryboardCore {
  visual_style_guide?: string;
  character_consistency_notes?: string;
  pacing_plan?: string;
  audio_direction?: string;
}

export interface RawCoverImage {
  base_prompt_en?: string;
  overlay_text_vi?: string;
  text_position?: string;
  composition_notes?: string;
}

export interface RawSceneImage {
  scene?: number | string;
  base_prompt_en?: string;
  overlay_text_vi?: string;
  text_position?: string;
  visual_goal?: string;
}

export interface RawSceneClip {
  scene?: number | string;
  duration_sec?: number;
  camera_movement?: string;
  motion_prompt_en?: string;
  spoken_line_vi?: string;
  on_screen_caption_vi?: string;
}

export interface RawStoryboardJson {
  core?: StoryboardCore;
  platform?: {
    aspect_ratio?: string;
    assembly_notes?: string;
    cover_image?: RawCoverImage;
    scene_images?: RawSceneImage[];
    scene_clips?: RawSceneClip[];
    voiceover?: {
      voice_preset?: string;
      estimated_duration_sec?: number;
    };
    background_music?: {
      bpm?: number;
      mood?: string;
    };
  };
}

export type ExcludedFieldKey =
  | 'overlay_text_vi'
  | 'text_position'
  | 'visual_goal'
  | 'composition_notes'
  | 'on_screen_caption_vi'
  | 'spoken_line_vi';

export interface SyncedVideoPrompt {
  durationSec: number | null;
  cameraMovement: string;
  motionPromptEn: string;
  cleanMotionPrompt: string;
  excludedFields: Array<{
    key: ExcludedFieldKey;
    value: string;
  }>;
}

export interface CleanSceneFrame {
  id: string;
  kind: 'cover' | 'scene';
  label: string;
  sceneNumber: number | null;
  aspectRatio: SupportedAspectRatio;
  basePromptEn: string;
  cleanPrompt: string;
  excludedFields: Array<{
    key: ExcludedFieldKey;
    value: string;
  }>;
  videoPrompt: SyncedVideoPrompt | null;
}

export interface ParsedStoryboardResult {
  ok: true;
  schemaType: 'image_storyboard' | 'video_script';
  aspectRatio: SupportedAspectRatio;
  visualStyleGuide: string;
  characterConsistencyNotes: string;
  scriptMetaSummary: string;
  frames: CleanSceneFrame[];
}

export interface ParsedStoryboardError {
  ok: false;
  error: string;
}

export interface SyncedStoryboardsResult {
  imageStatus: ParsedStoryboardResult | ParsedStoryboardError;
  videoStatus: {
    ok: boolean;
    error?: string;
    clipCount: number;
    matchedCount: number;
    metaSummary: string;
  };
  frames: CleanSceneFrame[];
  aspectRatio: SupportedAspectRatio;
}

const SUPPORTED_ASPECT_RATIOS: ReadonlySet<string> = new Set([
  '1:1',
  '3:4',
  '4:3',
  '9:16',
  '16:9',
]);

const TEXT_NEGATIVE_GUARD =
  'Strictly clean photographic frame only: zero text, no words, no letters, no captions, no titles, no UI text overlays, no watermarks, no typography anywhere in the image.';

const VIDEO_NEGATIVE_GUARD =
  'Clean visual motion only: no on-screen captions, no subtitles, no text overlays, no watermarks.';

export const DEFAULT_STORYBOARD_JSON_OBJECT = {
  core: {
    visual_style_guide:
      'Professional corporate tech aesthetic with a warm Friday afternoon vibe. Color palette: Excel Green (#217346), clean white, and soft sunset orange lighting. High-definition 4K visuals, shallow depth of field for keyboard shots, sharp screen focus for software shots. Minimalist workspace setting, clutter-free desk. Clean background space for text overlay, no text, no letters, no watermark, no typography.',
    character_consistency_notes:
      'Main subjects include a high-end mechanical keyboard with tactile keys and a clean 27-inch monitor displaying a Microsoft Excel interface with dense but organized data rows. Lighting remains consistent as if from a nearby window during late afternoon.',
  },
  platform: {
    aspect_ratio: '9:16',
    cover_image: {
      base_prompt_en:
        'Cinematic close-up of a finger about to press a mechanical keyboard, a glowing green aura around the Ctrl, Shift, and L keys, blurred Excel spreadsheet on a monitor in the background, warm office sunset lighting, soft bokeh, clean background space for text overlay, no text, no letters, no watermark, no typography.',
      overlay_text_vi: 'EXCEL: LỌC DỮ LIỆU TRONG 3 GIÂY',
      text_position: 'center',
      composition_notes:
        'Center the finger and keyboard focus. Text will be placed in the upper-middle region to avoid covering the main action.',
    },
    scene_images: [
      {
        scene: 1,
        base_prompt_en:
          'Point of view shot of a vast, overwhelming Excel spreadsheet on a large monitor, a wooden desk with a coffee mug, late afternoon sunlight casting long shadows, clean background space for text overlay, no text, no letters, no watermark, no typography.',
        overlay_text_vi: 'CHIỀU THỨ 6 VÀ ĐỐNG DATA...',
        text_position: 'top_safe',
        visual_goal:
          'Establish the stressful Friday afternoon mood and the massive amount of data.',
      },
      {
        scene: 2,
        base_prompt_en:
          'Extreme close-up of a computer mouse cursor moving slowly and aimlessly towards the top menu bar of a software interface, blurred background, clinical lighting, clean background space for text overlay, no text, no letters, no watermark, no typography.',
        overlay_text_vi: 'SAI LẦM: DI CHUỘT TÌM FILTER',
        text_position: 'center',
        visual_goal:
          'Highlight the inefficiency of the traditional manual method.',
      },
      {
        scene: 3,
        base_prompt_en:
          'Close-up top-down view of a hand pressing Ctrl, Shift, and L simultaneously on a backlit keyboard, keys are glowing with a soft green light, crisp focus, clean background space for text overlay, no text, no letters, no watermark, no typography.',
        overlay_text_vi: 'BÍ KÍP: CTRL + SHIFT + L',
        text_position: 'bottom_safe',
        visual_goal: 'Clearly demonstrate the shortcut key combination.',
      },
      {
        scene: 4,
        base_prompt_en:
          'Macro shot of an Excel spreadsheet header instantly popping up with filter icons, sleek motion blur effect to show speed, professional UI design, clean background space for text overlay, no text, no letters, no watermark, no typography.',
        overlay_text_vi: 'BẬT TẮT FILTER TRONG 1 GIÂY',
        text_position: 'center',
        visual_goal:
          'Show the immediate and satisfying result of the shortcut.',
      },
      {
        scene: 5,
        base_prompt_en:
          'A laptop being closed gently on a tidy wooden desk, a pair of office keys and a smartphone next to it, warm celebratory evening light, peaceful atmosphere, clean background space for text overlay, no text, no letters, no watermark, no typography.',
        overlay_text_vi: 'VỀ SỚM THÔI!',
        text_position: 'top_safe',
        visual_goal:
          'Conclude with the rewarding feeling of finishing work early.',
      },
    ],
  },
  assumptions: [
    'Thời lượng 30 giây là ước tính dựa trên tốc độ đọc trung bình cho kịch bản 150 chữ.',
    'Người xem mục tiêu là nhân viên văn phòng sử dụng Windows (do phím tắt Ctrl+Shift+L là chuẩn Windows).',
  ],
  verify_next: [
    'Xác nhận lại phím tắt tương ứng trên MacOS (Command+Shift+F) nếu đối tượng dùng Mac.',
    'Kiểm tra lại các quy định về bản quyền giao diện phần mềm trên nền tảng cần xác nhận lại trên trang chính thức.',
  ],
  sources: [
    {
      title: 'Microsoft Excel Shortcuts',
      url: 'https://support.microsoft.com/en-us/office/keyboard-shortcuts-in-excel-1798d9d5-842a-42b8-9c99-9b7213f0040f',
    },
  ],
};

export const DEFAULT_STORYBOARD_JSON = JSON.stringify(
  DEFAULT_STORYBOARD_JSON_OBJECT,
  null,
  2
);

export const CLIP_SCRIPT_SAMPLE_OBJECT = {
  core: {
    pacing_plan:
      "Nhịp dựng nhanh (fast-cut) ở 10 giây đầu để tạo sự gấp gáp, sau đó giãn nhịp ở phần hướng dẫn kỹ thuật. Sử dụng kỹ thuật 'match cut' giữa thao tác bàn phím và phản ứng trên màn hình để giữ chân người xem.",
    audio_direction:
      'Giọng đọc truyền cảm hứng, tốc độ khoảng 140-150 WPM. Cần nhấn mạnh vào tên các phím tắt. Nhạc nền tự động giảm âm lượng (ducking) xuống 18% khi có giọng đọc để đảm bảo độ rõ nét của thông tin kỹ thuật.',
  },
  platform: {
    voiceover: {
      voice_preset: 'Puck',
      speaking_style_prompt:
        'Giọng nam trẻ trung, năng động, pha chút hối hả ở đoạn đầu và tự tin, chuyên nghiệp ở phần hướng dẫn phím tắt.',
      clean_text_vi:
        'Lai la chieu thu Sau va sep gui mot bang Ec xen dai dang dac yeu cau loc du lieu gap de bao cao? Thay vi mo mat di chuot len thanh cong cu roi tim nut Sot va Phin to rat mat thoi gian va de nham lan. Ban chi can chon mot o bat ky trong bang du lieu, sau do nhan dong thoi to hop phim Con tron cong Sip cong chu Le. Ngay lap tuc, cac mui ten bo loc se hien ra o dau moi cot. De bo loc nhanh va quay lai trang thai ban dau, ban cung chi can nhan lai to hop phim Con tron cong Sip cong chu Le mot lan nua. Cuc ky nhanh gon va chuyen nghiep. Ban con biet phim tat nao giup cuu nguy ngay thu Sau khong? Binh luan chia se ben duoi de anh em cung ve som nhe.',
      estimated_duration_sec: 30,
    },
    background_music: {
      lyria_prompt_en:
        'Upbeat lo-fi hip hop with a steady driving beat, light synthesizer melodies, corporate productivity vibe, energetic but not distracting, instrumental only.',
      bpm: 115,
      mood: 'Năng động, tích cực, hiệu quả',
      ducking_gain: 0.18,
    },
    scene_clips: [
      {
        scene: 1,
        duration_sec: 6,
        camera_movement: 'Slow zoom into the messy spreadsheet rows.',
        motion_prompt_en:
          'Subtle slow zoom into a computer screen displaying a massive Excel spreadsheet with thousands of rows, glowing office light reflected on the screen.',
        spoken_line_vi:
          'Lại là chiều thứ Sáu và sếp gửi một bảng Excel dài dằng dặc yêu cầu lọc dữ liệu gấp để báo cáo?',
        on_screen_caption_vi: 'CHIỀU THỨ 6 VÀ ĐỐNG DATA...',
      },
      {
        scene: 2,
        duration_sec: 5,
        camera_movement: 'Handheld slight shake to simulate frustration.',
        motion_prompt_en:
          'Close up of a mouse cursor moving erratically and slowly across a blurry software menu, symbolizing confusion.',
        spoken_line_vi:
          'Thay vì mờ mắt di chuột lên thanh công cụ rồi tìm nút Sort và Filter rất mất thời gian và dễ nhầm lẫn.',
        on_screen_caption_vi: 'SAI LẦM: DI CHUỘT TÌM FILTER',
      },
      {
        scene: 3,
        duration_sec: 7,
        camera_movement: 'Extreme close-up, sharp focus on keyboard.',
        motion_prompt_en:
          'Macro shot of fingers pressing Ctrl, Shift, and L keys simultaneously on a mechanical keyboard with a subtle neon glow effect.',
        spoken_line_vi:
          'Bạn chỉ cần chọn một ô bất kỳ trong bảng dữ liệu, sau đó nhấn đồng thời tổ hợp phím Ctrl cộng Shift cộng chữ L. Ngay lập tức, các mũi tên bộ lọc sẽ hiện ra ở đầu mỗi cột.',
        on_screen_caption_vi: 'BÍ KÍP: CTRL + SHIFT + L',
      },
      {
        scene: 4,
        duration_sec: 6,
        camera_movement: 'Fast pan across the top of the spreadsheet.',
        motion_prompt_en:
          'Screen recording style animation showing filter icons instantly appearing and disappearing at the top of Excel columns.',
        spoken_line_vi:
          'Để bỏ lọc nhanh và quay lại trạng thái ban đầu, bạn cũng chỉ cần nhấn lại tổ hợp phím Ctrl cộng Shift cộng L một lần nữa. Cực kỳ nhanh gọn và chuyên nghiệp.',
        on_screen_caption_vi: 'BẬT TẮT FILTER TRONG 1 GIÂY',
      },
      {
        scene: 5,
        duration_sec: 6,
        camera_movement: 'Pull back to reveal a relaxing office view.',
        motion_prompt_en:
          'A laptop being closed gently in a cozy office with a sunset visible through the window, warm lighting.',
        spoken_line_vi:
          'Bạn còn biết phím tắt nào giúp cứu nguy ngày thứ Sáu không? Bình luận chia sẻ bên dưới để anh em cùng về sớm nhé.',
        on_screen_caption_vi: 'VỀ SỚM THÔI!',
      },
    ],
    assembly_notes:
      "Sử dụng Voiceover làm trục thời gian chính. Khớp các hiệu ứng âm thanh (SFX) 'click' hoặc 'ding' khi các phím tắt được nhấn và bộ lọc hiện ra. Xuất file ở định dạng dọc 9:16, chèn phụ đề .srt ở vùng an toàn (giữa màn hình) để tránh bị che bởi giao diện Reels.",
  },
};

export const CLIP_SCRIPT_SAMPLE_JSON = JSON.stringify(
  CLIP_SCRIPT_SAMPLE_OBJECT,
  null,
  2
);

export function normalizeAspectRatio(
  raw?: string,
  fallbackNotes?: string
): SupportedAspectRatio {
  if (raw && SUPPORTED_ASPECT_RATIOS.has(raw.trim())) {
    return raw.trim() as SupportedAspectRatio;
  }
  if (fallbackNotes) {
    const match = fallbackNotes.match(/\b(9:16|16:9|3:4|4:3|1:1)\b/);
    if (match && SUPPORTED_ASPECT_RATIOS.has(match[1])) {
      return match[1] as SupportedAspectRatio;
    }
  }
  return '9:16';
}

export function sanitizeBasePrompt(rawPrompt: string): string {
  return rawPrompt
    .replace(/clean background space for text overlay,?\s*/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function buildCleanPrompt(
  core: StoryboardCore | undefined,
  basePromptEn: string
): string {
  const parts: string[] = [];
  const cleanScenePrompt = sanitizeBasePrompt(basePromptEn);
  if (cleanScenePrompt) {
    parts.push(cleanScenePrompt);
  }
  if (core?.visual_style_guide?.trim()) {
    parts.push(`Visual Style: ${sanitizeBasePrompt(core.visual_style_guide)}`);
  }
  if (core?.character_consistency_notes?.trim()) {
    parts.push(
      `Subject & Lighting Consistency: ${core.character_consistency_notes.trim()}`
    );
  }
  parts.push(TEXT_NEGATIVE_GUARD);
  return parts.join('\n\n');
}

function buildClipMotionPrompt(clip: RawSceneClip): string {
  const parts: string[] = [];
  const motion = sanitizeBasePrompt(clip.motion_prompt_en ?? '');
  const camera = sanitizeBasePrompt(clip.camera_movement ?? '');
  if (motion) {
    parts.push(motion);
  }
  if (camera) {
    parts.push(`Camera Movement: ${camera}`);
  }
  if (typeof clip.duration_sec === 'number' && Number.isFinite(clip.duration_sec)) {
    parts.push(`Target Duration: ${clip.duration_sec}s`);
  }
  parts.push(VIDEO_NEGATIVE_GUARD);
  return parts.join('\n\n');
}

function collectExcludedFields(
  item: RawCoverImage | RawSceneImage | RawSceneClip
): CleanSceneFrame['excludedFields'] {
  const excluded: CleanSceneFrame['excludedFields'] = [];
  if ('overlay_text_vi' in item && item.overlay_text_vi) {
    excluded.push({
      key: 'overlay_text_vi',
      value: String(item.overlay_text_vi),
    });
  }
  if ('text_position' in item && item.text_position) {
    excluded.push({
      key: 'text_position',
      value: String(item.text_position),
    });
  }
  if ('visual_goal' in item && item.visual_goal) {
    excluded.push({
      key: 'visual_goal',
      value: String(item.visual_goal),
    });
  }
  if ('composition_notes' in item && item.composition_notes) {
    excluded.push({
      key: 'composition_notes',
      value: String(item.composition_notes),
    });
  }
  if ('on_screen_caption_vi' in item && item.on_screen_caption_vi) {
    excluded.push({
      key: 'on_screen_caption_vi',
      value: String(item.on_screen_caption_vi),
    });
  }
  if ('spoken_line_vi' in item && item.spoken_line_vi) {
    excluded.push({
      key: 'spoken_line_vi',
      value: String(item.spoken_line_vi),
    });
  }
  return excluded;
}

function buildSyncedVideoPrompt(clip: RawSceneClip): SyncedVideoPrompt {
  return {
    durationSec:
      typeof clip.duration_sec === 'number' && Number.isFinite(clip.duration_sec)
        ? clip.duration_sec
        : null,
    cameraMovement: clip.camera_movement?.trim() ?? '',
    motionPromptEn: clip.motion_prompt_en?.trim() ?? '',
    cleanMotionPrompt: buildClipMotionPrompt(clip),
    excludedFields: collectExcludedFields(clip),
  };
}

export function parseStoryboardJson(
  rawInput: string
): ParsedStoryboardResult | ParsedStoryboardError {
  if (!rawInput || !rawInput.trim()) {
    return {
      ok: false,
      error:
        'Storyboard JSON is empty. Paste an image storyboard or scene_clips JSON payload.',
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawInput);
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? `Invalid JSON syntax: ${err.message}`
          : 'Invalid JSON syntax.',
    };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      ok: false,
      error:
        'Root JSON value must be an object containing "platform" or "core" sections.',
    };
  }

  const data = parsed as RawStoryboardJson;
  const aspectRatio = normalizeAspectRatio(
    data.platform?.aspect_ratio,
    data.platform?.assembly_notes
  );
  const frames: CleanSceneFrame[] = [];

  if (data.platform?.cover_image) {
    const cover = data.platform.cover_image;
    const basePrompt = cover.base_prompt_en?.trim() ?? '';
    if (!basePrompt) {
      return {
        ok: false,
        error: 'platform.cover_image is missing a non-empty "base_prompt_en".',
      };
    }
    frames.push({
      id: 'cover',
      kind: 'cover',
      label: 'Cover Frame',
      sceneNumber: null,
      aspectRatio,
      basePromptEn: basePrompt,
      cleanPrompt: buildCleanPrompt(data.core, basePrompt),
      excludedFields: collectExcludedFields(cover),
      videoPrompt: null,
    });
  }

  if (Array.isArray(data.platform?.scene_images)) {
    data.platform.scene_images.forEach((sceneItem, idx) => {
      const basePrompt = sceneItem.base_prompt_en?.trim() ?? '';
      if (!basePrompt) {
        return;
      }
      const numericScene =
        typeof sceneItem.scene === 'number'
          ? sceneItem.scene
          : Number.parseInt(String(sceneItem.scene ?? idx + 1), 10);
      const sceneNum = Number.isFinite(numericScene) ? numericScene : idx + 1;
      frames.push({
        id: `scene-${sceneNum}`,
        kind: 'scene',
        label: `Scene ${sceneNum}`,
        sceneNumber: sceneNum,
        aspectRatio,
        basePromptEn: basePrompt,
        cleanPrompt: buildCleanPrompt(data.core, basePrompt),
        excludedFields: collectExcludedFields(sceneItem),
        videoPrompt: null,
      });
    });
  }

  const isClipSchema =
    frames.length === 0 &&
    Array.isArray(data.platform?.scene_clips) &&
    data.platform.scene_clips.length > 0;

  if (isClipSchema && data.platform?.scene_clips) {
    data.platform.scene_clips.forEach((clipItem, idx) => {
      const motionPrompt = clipItem.motion_prompt_en?.trim() ?? '';
      if (!motionPrompt) {
        return;
      }
      const numericScene =
        typeof clipItem.scene === 'number'
          ? clipItem.scene
          : Number.parseInt(String(clipItem.scene ?? idx + 1), 10);
      const sceneNum = Number.isFinite(numericScene) ? numericScene : idx + 1;
      const synced = buildSyncedVideoPrompt(clipItem);
      frames.push({
        id: `clip-scene-${sceneNum}`,
        kind: 'scene',
        label: `Scene ${sceneNum}`,
        sceneNumber: sceneNum,
        aspectRatio,
        basePromptEn: motionPrompt,
        cleanPrompt: synced.cleanMotionPrompt,
        excludedFields: synced.excludedFields,
        videoPrompt: synced,
      });
    });
  }

  if (frames.length === 0) {
    return {
      ok: false,
      error:
        'No valid frames found. Include "platform.cover_image" / "platform.scene_images" (base_prompt_en) or "platform.scene_clips" (motion_prompt_en).',
    };
  }

  let scriptMetaSummary = '';
  if (isClipSchema) {
    const metaParts: string[] = ['Video script format (scene_clips)'];
    if (data.platform?.voiceover?.voice_preset) {
      const dur = data.platform.voiceover.estimated_duration_sec
        ? ` (${data.platform.voiceover.estimated_duration_sec}s)`
        : '';
      metaParts.push(`Voiceover ${data.platform.voiceover.voice_preset}${dur}`);
    }
    if (data.platform?.background_music?.bpm) {
      metaParts.push(`Music ${data.platform.background_music.bpm} BPM`);
    }
    scriptMetaSummary = metaParts.join(' · ');
  }

  return {
    ok: true,
    schemaType: isClipSchema ? 'video_script' : 'image_storyboard',
    aspectRatio,
    visualStyleGuide: data.core?.visual_style_guide?.trim() ?? '',
    characterConsistencyNotes:
      data.core?.character_consistency_notes?.trim() ?? '',
    scriptMetaSummary,
    frames,
  };
}

export function syncImageAndVideoStoryboards(
  rawImageJson: string,
  rawVideoJson: string
): SyncedStoryboardsResult {
  const imageStatus = parseStoryboardJson(rawImageJson);

  let videoClipsMap = new Map<number, SyncedVideoPrompt>();
  let videoOk = false;
  let videoError: string | undefined;
  let videoMetaSummary = '';

  if (rawVideoJson.trim()) {
    try {
      const parsedVideo = JSON.parse(rawVideoJson) as RawStoryboardJson;
      const clips = parsedVideo?.platform?.scene_clips;
      if (!Array.isArray(clips) || clips.length === 0) {
        videoError = 'Video JSON is missing a non-empty "platform.scene_clips" array.';
      } else {
        clips.forEach((clip, idx) => {
          if (!clip.motion_prompt_en?.trim()) return;
          const numericScene =
            typeof clip.scene === 'number'
              ? clip.scene
              : Number.parseInt(String(clip.scene ?? idx + 1), 10);
          const sceneNum = Number.isFinite(numericScene) ? numericScene : idx + 1;
          videoClipsMap.set(sceneNum, buildSyncedVideoPrompt(clip));
        });

        if (videoClipsMap.size === 0) {
          videoError = 'No valid "motion_prompt_en" entries found in scene_clips.';
        } else {
          videoOk = true;
          const parts: string[] = [`${videoClipsMap.size} motion clips`];
          if (parsedVideo.platform?.voiceover?.voice_preset) {
            const dur = parsedVideo.platform.voiceover.estimated_duration_sec
              ? ` (${parsedVideo.platform.voiceover.estimated_duration_sec}s)`
              : '';
            parts.push(`Voice ${parsedVideo.platform.voiceover.voice_preset}${dur}`);
          }
          if (parsedVideo.platform?.background_music?.bpm) {
            parts.push(`${parsedVideo.platform.background_music.bpm} BPM`);
          }
          videoMetaSummary = parts.join(' · ');
        }
      }
    } catch (err) {
      videoError =
        err instanceof Error
          ? `Invalid Video JSON syntax: ${err.message}`
          : 'Invalid Video JSON syntax.';
    }
  }

  let frames: CleanSceneFrame[] = [];
  let aspectRatio: SupportedAspectRatio = '9:16';
  let matchedCount = 0;

  if (imageStatus.ok) {
    aspectRatio = imageStatus.aspectRatio;
    frames = imageStatus.frames.map((frame) => {
      if (frame.sceneNumber !== null && videoClipsMap.has(frame.sceneNumber)) {
        matchedCount += 1;
        return {
          ...frame,
          videoPrompt: videoClipsMap.get(frame.sceneNumber)!,
        };
      }
      return frame;
    });
  } else if (!rawImageJson.trim() && videoOk) {
    // Allow standalone video JSON if image JSON is intentionally empty
    const fallbackVideoParsed = parseStoryboardJson(rawVideoJson);
    if (fallbackVideoParsed.ok) {
      frames = fallbackVideoParsed.frames;
      aspectRatio = fallbackVideoParsed.aspectRatio;
      matchedCount = frames.length;
    }
  }

  return {
    imageStatus,
    videoStatus: {
      ok: videoOk,
      error: videoError,
      clipCount: videoClipsMap.size,
      matchedCount,
      metaSummary: videoMetaSummary,
    },
    frames,
    aspectRatio,
  };
}

export function getPixelDimensions(
  aspectRatio: SupportedAspectRatio,
  imageSize: ImageSize
): { width: number; height: number } {
  const baseMap: Record<SupportedAspectRatio, { w: number; h: number }> = {
    '9:16': { w: 512, h: 896 },
    '16:9': { w: 896, h: 512 },
    '3:4': { w: 576, h: 768 },
    '4:3': { w: 768, h: 576 },
    '1:1': { w: 640, h: 640 },
  };
  const chosen = baseMap[aspectRatio] ?? baseMap['9:16'];
  void imageSize;
  return {
    width: chosen.w,
    height: chosen.h,
  };
}

export function formatAllCleanPromptsForCopy(
  frames: CleanSceneFrame[],
  aspectRatio: SupportedAspectRatio
): string {
  return frames
    .map(
      (frame, index) =>
        `[${index + 1}. ${frame.label} | Aspect Ratio: ${aspectRatio}]\n${frame.cleanPrompt}`
    )
    .join('\n\n---\n\n');
}

export function formatAllVideoPromptsForCopy(
  frames: CleanSceneFrame[],
  aspectRatio: SupportedAspectRatio
): string {
  const withVideo = frames.filter((f) => Boolean(f.videoPrompt));
  return withVideo
    .map((frame, index) => {
      const vp = frame.videoPrompt!;
      const dur = vp.durationSec ? ` | Duration: ${vp.durationSec}s` : '';
      return `[${index + 1}. ${frame.label} Video Motion | Aspect Ratio: ${aspectRatio}${dur}]\n${vp.cleanMotionPrompt}`;
    })
    .join('\n\n---\n\n');
}

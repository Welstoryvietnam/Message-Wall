import confetti from 'canvas-confetti';
import { FamilyIconId, NoteColorId, TopicId, VALIDATION_LIMITS } from '../types';

const GUEST_UID_STORAGE_KEY = 'welstory_kids_day_2026_guest_uid';
const LIKED_NOTES_STORAGE_KEY = 'welstory_kids_day_2026_liked_notes';

export function getOrCreateGuestUid(): string {
  try {
    const existing = localStorage.getItem(GUEST_UID_STORAGE_KEY);
    if (existing && /^guest_[a-zA-Z0-9_\-]{8,64}$/.test(existing)) {
      return existing;
    }
    const randomPart = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 36).toString(36)
    ).join('');
    const newId = `guest_${Date.now().toString(36)}_${randomPart}`;
    localStorage.setItem(GUEST_UID_STORAGE_KEY, newId);
    return newId;
  } catch {
    return 'guest_welstory2026_default01';
  }
}

export function getLikedNoteIds(): Record<string, number> {
  try {
    const raw = localStorage.getItem(LIKED_NOTES_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return {};
  }
}

export function markNoteLikedLocally(noteId: string): void {
  try {
    const current = getLikedNoteIds();
    current[noteId] = (current[noteId] || 0) + 1;
    localStorage.setItem(LIKED_NOTES_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // ignore storage errors
  }
}

export function triggerCelebrationConfetti(): void {
  if (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return;
  }

  const colors = ['#E11D48', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#FB7185'];

  confetti({
    particleCount: 75,
    spread: 70,
    origin: { y: 0.65 },
    colors,
  });

  window.setTimeout(() => {
    confetti({
      particleCount: 45,
      angle: 60,
      spread: 55,
      origin: { x: 0.15, y: 0.65 },
      colors,
    });
    confetti({
      particleCount: 45,
      angle: 120,
      spread: 55,
      origin: { x: 0.85, y: 0.65 },
      colors,
    });
  }, 180);
}

export function triggerHeartConfetti(originX = 0.5, originY = 0.6): void {
  if (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return;
  }

  const colors = ['#F43F5E', '#FB7185', '#EA5514', '#F59E0B', '#EC4899', '#FFE4E6'];

  confetti({
    particleCount: 40,
    spread: 65,
    startVelocity: 28,
    scalar: 0.9,
    origin: {
      x: Math.min(Math.max(originX, 0.08), 0.92),
      y: Math.min(Math.max(originY, 0.1), 0.9),
    },
    colors,
  });
}

export async function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Không thể đọc tệp ảnh đã chọn.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Định dạng ảnh không hợp lệ.'));
      img.onload = () => {
        const maxDimension = 1024;
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Không thể khởi tạo bộ xử lý ảnh.'));
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.78;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        while (dataUrl.length > VALIDATION_LIMITS.PHOTO_DATA_MAX - 50000 && quality > 0.35) {
          quality -= 0.12;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        if (dataUrl.length > VALIDATION_LIMITS.PHOTO_DATA_MAX) {
          reject(new Error('Ảnh có dung lượng quá lớn, vui lòng chọn ảnh nhỏ hơn.'));
          return;
        }
        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export interface SeedNotePayload {
  id: string;
  parentName: string;
  childName: string;
  department: string;
  familyIcon: FamilyIconId;
  noteColor: NoteColorId;
  topic: TopicId;
  promptUsed: string;
  message: string;
  photoData: string;
  photoCaption: string;
}

export const BTC_WELCOME_NOTE_ID = 'seed_btc_welcome_v2_2026';

export const LEGACY_SEED_NOTE_IDS: string[] = [
  'seed_note_bento_01',
  'seed_note_letter_02',
  'seed_note_family_03',
  'seed_note_wish_04',
  'seed_btc_welcome_2026',
];

export const INITIAL_SEED_NOTES: SeedNotePayload[] = [
  {
    id: BTC_WELCOME_NOTE_ID,
    parentName: 'Ban Tổ Chức',
    childName: "Welstory Kids' Day 2026",
    department: 'Ban Tổ Chức Sự Kiện',
    familyIcon: 'chef-family',
    noteColor: 'butter',
    topic: 'ky-niem-dep',
    promptUsed: '',
    message:
      "Chào mừng đại gia đình Welstory đến với Bảng Lưu Bút Yêu Thương - Welstory Kids' Day 2026! Những tiếng cười giòn tan và ánh mắt rạng rỡ của các thiên thần nhỏ là món quà tuyệt vời nhất. Bố mẹ và các bé hãy cùng ghim lên tường những kỷ niệm đẹp, những câu nói ngộ nghĩnh đáng yêu và cảm xúc sau ngày hội hôm nay nhé!",
    photoData: '',
    photoCaption: '',
  },
];



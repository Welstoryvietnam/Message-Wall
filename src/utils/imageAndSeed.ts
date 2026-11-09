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

export const INITIAL_SEED_NOTES: SeedNotePayload[] = [
  {
    id: 'seed_note_bento_01',
    parentName: 'Nguyễn Minh Tuấn',
    childName: 'Bé Bảo An (6 tuổi)',
    department: 'Vận hành Bếp Trung Tâm',
    familyIcon: 'chef-family',
    noteColor: 'butter',
    topic: 'ky-niem-dep',
    promptUsed: 'Khoảnh khắc nào tại Welstory Kids Day 2026 làm cả gia đình mình bật cười hạnh phúc nhất?',
    message:
      'Lần đầu tiên Bảo An được đội chiếc mũ đầu bếp giống bố và tự tay xếp từng ngôi sao cà rốt vào hộp cơm Bento. Con cứ xuýt xoa "Hóa ra mỗi ngày bố đều làm ra những suất ăn đẹp như thế này ạ!". Khoảnh khắc hai bố con cùng cười bên bàn bếp là kỷ niệm đẹp nhất của gia đình mình năm nay.',
    photoData: '/src/assets/images/memory_cooking_class_1794212239072.jpg',
    photoCaption: 'Hai bố con hào hứng trang trí hộp cơm Bento dinh dưỡng tại Welstory Kids Day 2026',
  },
  {
    id: 'seed_note_letter_02',
    parentName: 'Trần Thu Hà',
    childName: 'Bé Gia Huy (5 tuổi)',
    department: 'Kiểm soát Chất lượng (QA/QC)',
    familyIcon: 'heart-hands',
    noteColor: 'rose',
    topic: 'loi-con-noi',
    promptUsed: 'Khi lần đầu đến thăm nơi làm việc của Bố/Mẹ, bé đã thốt lên câu nói ngộ nghĩnh gì?',
    message:
      'Lúc ngồi ở góc vẽ tranh, Gia Huy nắn nót viết dòng chữ "Con yêu mẹ Hà" lên tấm thiệp hồng rồi thủ thỉ: "Mẹ ơi, công ty mẹ vui quá, mai mốt lớn lên con cũng muốn đi kiểm tra đồ ăn ngon cùng mẹ để mọi người đều khỏe mạnh!". Nghe con nói mà bao nhiêu mệt mỏi tan biến hết.',
    photoData: '/src/assets/images/memory_painting_corner_1794212242616.jpg',
    photoCaption: 'Mẹ Hà và bé Gia Huy cùng viết thiệp yêu thương tại góc sáng tạo',
  },
  {
    id: 'seed_note_family_03',
    parentName: 'Lê Hoàng Nam & Phạm Lan Anh',
    childName: 'Bé Minh Khôi & Bé Sóc',
    department: 'Chuỗi Cung ứng & Thu mua',
    familyIcon: 'sunshine-home',
    noteColor: 'mint',
    topic: 'cam-on-btc',
    promptUsed: 'Gia đình mình ấn tượng nhất với hoạt động nào và muốn gửi lời cảm ơn gì tới Ban Tổ Chức?',
    message:
      'Gia đình mình xin gửi lời cảm ơn chân thành đến Ban Giám Đốc và Ban Tổ Chức Welstory Kids Day 2026. Từ khu vực đón tiếp, góc trải nghiệm làm bếp đến những phần quà nhỏ đều được chuẩn bị vô cùng tỉ mỉ, ấm cúng và an toàn cho các bé. Hẹn gặp lại đại gia đình Welstory vào mùa hội năm sau!',
    photoData: '/src/assets/images/memory_family_stage_1794212241701.jpg',
    photoCaption: 'Cả nhà rạng rỡ lưu giữ khoảnh khắc sum vầy tại sảnh chính sự kiện',
  },
  {
    id: 'seed_note_wish_04',
    parentName: 'Đỗ Phương Thảo',
    childName: 'Bé Mầm (4 tuổi)',
    department: 'Nghiên cứu Thực đơn (R&D)',
    familyIcon: 'star-sprout',
    noteColor: 'sky',
    topic: 'loi-nhan-vien',
    promptUsed: 'Bố/Mẹ muốn nhắn gửi lời chúc hay ước mong gì cho hành trình khôn lớn của con yêu?',
    message:
      'Hôm nay đưa con đến thăm nơi mẹ làm việc mỗi ngày, nhìn ánh mắt tò mò và nụ cười trong veo của con khi gặp các cô chú đồng nghiệp, mẹ thấy thật tự hào. Mẹ chúc em bé Mầm của mẹ luôn giữ trái tim ấm áp, hay ăn chóng lớn và mỗi ngày đều tràn ngập niềm vui như ngày hội hôm nay nhé!',
    photoData: '',
    photoCaption: '',
  },
];

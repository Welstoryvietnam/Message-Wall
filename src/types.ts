import { Timestamp } from 'firebase/firestore';

export type FamilyIconId =
  | 'chef-family'
  | 'sunshine-home'
  | 'happy-bears'
  | 'star-sprout'
  | 'heart-hands'
  | 'rainbow-kids';

export type NoteColorId =
  | 'butter'
  | 'rose'
  | 'mint'
  | 'sky'
  | 'lavender'
  | 'peach';

export type TopicId =
  | 'ky-niem-dep'
  | 'loi-nhan-vien'
  | 'loi-con-noi'
  | 'cam-on-btc';

export interface MemoryNote {
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
  heartsCount: number;
  authorUid: string;
  visibility: 'public';
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export const VALIDATION_LIMITS = {
  PARENT_NAME_MAX: 80,
  CHILD_NAME_MAX: 80,
  DEPARTMENT_MAX: 80,
  PROMPT_USED_MAX: 200,
  MESSAGE_MAX: 1000,
  PHOTO_DATA_MAX: 700000,
  PHOTO_CAPTION_MAX: 140,
  AUTHOR_UID_REGEX: /^[a-zA-Z0-9_\-]+$/,
} as const;

export interface TopicOption {
  id: TopicId;
  label: string;
  emoji: string;
  optionText: string;
}

export const TOPICS: TopicOption[] = [
  {
    id: 'ky-niem-dep',
    label: 'Kỷ niệm đẹp',
    emoji: '📸',
    optionText: '📸 Kỷ niệm đẹp đáng nhớ',
  },
  {
    id: 'loi-nhan-vien',
    label: 'Lời của nhân viên',
    emoji: '💼',
    optionText: '💼 Lời chia sẻ của nhân viên',
  },
  {
    id: 'loi-con-noi',
    label: 'Lời con nói',
    emoji: '👶',
    optionText: '👶 Câu nói đáng yêu của bé',
  },
  {
    id: 'cam-on-btc',
    label: 'Cảm ơn BTC',
    emoji: '💌',
    optionText: '💌 Cảm ơn & Góp ý BTC',
  },
];

export interface NoteColorOption {
  id: NoteColorId;
  name: string;
  bgClass: string;
  borderClass: string;
  swatchClass: string;
  pinClass: string;
  accentTextClass: string;
}

export const NOTE_COLORS: NoteColorOption[] = [
  {
    id: 'butter',
    name: 'Vàng Nắng',
    bgClass: 'bg-amber-50/95',
    borderClass: 'border-amber-200',
    swatchClass: 'bg-amber-100 border-amber-300',
    pinClass: 'bg-red-500',
    accentTextClass: 'text-amber-800',
  },
  {
    id: 'rose',
    name: 'Hồng Phấn',
    bgClass: 'bg-rose-50/95',
    borderClass: 'border-rose-200',
    swatchClass: 'bg-rose-100 border-rose-300',
    pinClass: 'bg-rose-500',
    accentTextClass: 'text-rose-800',
  },
  {
    id: 'mint',
    name: 'Xanh Ngọc',
    bgClass: 'bg-emerald-50/95',
    borderClass: 'border-emerald-200',
    swatchClass: 'bg-emerald-100 border-emerald-300',
    pinClass: 'bg-emerald-500',
    accentTextClass: 'text-emerald-800',
  },
  {
    id: 'sky',
    name: 'Xanh Mây',
    bgClass: 'bg-sky-50/95',
    borderClass: 'border-sky-200',
    swatchClass: 'bg-sky-100 border-sky-300',
    pinClass: 'bg-sky-500',
    accentTextClass: 'text-sky-800',
  },
  {
    id: 'lavender',
    name: 'Tím Nhạt',
    bgClass: 'bg-purple-50/95',
    borderClass: 'border-purple-200',
    swatchClass: 'bg-purple-100 border-purple-300',
    pinClass: 'bg-purple-500',
    accentTextClass: 'text-purple-800',
  },
  {
    id: 'peach',
    name: 'Cam Đào',
    bgClass: 'bg-orange-50/95',
    borderClass: 'border-orange-200',
    swatchClass: 'bg-orange-100 border-orange-300',
    pinClass: 'bg-[#EA5514]',
    accentTextClass: 'text-orange-800',
  },
];

export interface PromptSuggestion {
  id: string;
  number: string;
  topic: TopicId;
  topicLabel: string;
  question: string;
}

export const PROMPT_SUGGESTIONS: PromptSuggestion[] = [
  {
    id: 'p1',
    number: '1.',
    topic: 'ky-niem-dep',
    topicLabel: 'Kỷ niệm đẹp',
    question: 'Khoảnh khắc hay trò chơi nào trong chương trình làm anh/chị hoặc bé ấn tượng nhất?',
  },
  {
    id: 'p2',
    number: '2.',
    topic: 'loi-con-noi',
    topicLabel: 'Lời con nói',
    question: 'Bé đã líu lo kể hay nói câu gì đáng yêu nhất với bố/mẹ sau khi tham gia sự kiện?',
  },
  {
    id: 'p3',
    number: '3.',
    topic: 'loi-nhan-vien',
    topicLabel: 'Lời của nhân viên',
    question: 'Cảm xúc của bố/mẹ khi lần đầu đưa con yêu đến thăm nơi làm việc và đồng nghiệp tại Welstory?',
  },
  {
    id: 'p4',
    number: '4.',
    topic: 'cam-on-btc',
    topicLabel: 'Cảm ơn BTC',
    question: 'Anh/chị muốn gửi lời cảm ơn hay nhắn nhủ gì cho Ban Tổ Chức vào mùa Kids Day năm sau?',
  },
];

export const DEPARTMENTS = [
  'Phòng Hành chính Nhân sự (HR)',
  'Bộ phận Vận hành Bếp (Operations)',
  'Phòng Kế toán - Tài chính',
  'Kiểm soát Chất lượng (QA/QC)',
  'Phòng Kinh doanh & Khách hàng',
  'Chuỗi Cung ứng & Thu mua',
  'Nghiên cứu Thực đơn (R&D)',
  'Công nghệ Thông tin (IT)',
];

export const PRESET_EVENT_PHOTOS = [
  {
    id: 'cooking',
    label: 'Ảnh góc Đầu Bếp Nhí Bento',
    url: '/src/assets/images/memory_cooking_class_1794212239072.jpg',
    defaultCaption: 'Hai bố con hào hứng trang trí hộp cơm Bento tại Welstory Kids Day 2026',
  },
  {
    id: 'painting',
    label: 'Ảnh góc Vẽ Tranh & Làm Thiệp',
    url: '/src/assets/images/memory_painting_corner_1794212242616.jpg',
    defaultCaption: 'Mẹ và bé cùng nắn nót viết lưu bút yêu thương',
  },
  {
    id: 'stage',
    label: 'Ảnh Gia Đình Sum Vầy',
    url: '/src/assets/images/memory_family_stage_1794212241701.jpg',
    defaultCaption: 'Nụ cười rạng rỡ của cả gia đình tại ngày hội Welstory Kids Day 2026',
  },
];

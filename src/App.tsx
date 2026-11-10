import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import {
  Heart,
  Send,
  Lightbulb,
  X,
  Plus,
  Image as ImageIcon,
  MessageCircleHeart,
  Sparkles,
  ChevronDown,
  ArrowUp,
  Share2,
  Music,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  db,
  OperationType,
  handleFirestoreError,
} from './firebase';
import {
  MemoryNote,
  FamilyIconId,
  NoteColorId,
  TopicId,
  VALIDATION_LIMITS,
  TOPICS,
  NOTE_COLORS,
  PROMPT_SUGGESTIONS,
  PromptSuggestion,
} from './types';
import { FAMILY_ICONS } from './components/FamilyIcons';
import { NoteCard } from './components/NoteCard';
import { NoteDetailModal } from './components/NoteDetailModal';
import { SocialShareModal } from './components/SocialShareModal';
import { bgmPlayer } from './utils/bgmPlayer';
import {
  BTC_WELCOME_NOTE_ID,
  compressImageFile,
  getLikedNoteIds,
  getOrCreateGuestUid,
  INITIAL_SEED_NOTES,
  LEGACY_SEED_NOTE_IDS,
  markNoteLikedLocally,
  triggerCelebrationConfetti,
  triggerHeartConfetti,
  shareOnFacebook,
  shareOnInstagram,
} from './utils/imageAndSeed';

export default function App() {
  // Device guest session ID (no login required)
  const [guestUid] = useState<string>(() => getOrCreateGuestUid());

  // Firestore real-time notes state
  const [notes, setNotes] = useState<MemoryNote[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const hasSeededRef = useRef<boolean>(false);
  const knownNoteIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef<boolean>(true);

  // Local heart tracking
  const [likedNotesMap, setLikedNotesMap] = useState<Record<string, number>>(() =>
    getLikedNoteIds()
  );

  // Header Inspiration Box & Post Modal state
  const [showInspirationBox, setShowInspirationBox] = useState<boolean>(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState<boolean>(false);

  // Lightbox image zoom state
  const [lightboxPhoto, setLightboxPhoto] = useState<{
    url: string;
    caption: string;
  } | null>(null);

  // Form state inside Post Modal
  const [parentName, setParentName] = useState<string>('');
  const [childName, setChildName] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [familyIcon, setFamilyIcon] = useState<FamilyIconId>('chef-family');
  const [noteColor, setNoteColor] = useState<NoteColorId>('butter');
  const [topic, setTopic] = useState<TopicId>('ky-niem-dep');
  const [promptUsed, setPromptUsed] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [photoData, setPhotoData] = useState<string>('');
  const [photoFileName, setPhotoFileName] = useState<string>('Chưa chọn ảnh nào');
  const [photoCaption, setPhotoCaption] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Filter & Wall controls
  const [activeTopicFilter, setActiveTopicFilter] = useState<TopicId | 'all'>('all');
  const [isTopicListOpen, setIsTopicListOpen] = useState<boolean>(false);
  const [selectedNote, setSelectedNote] = useState<MemoryNote | null>(null);
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isBgmPlaying, setIsBgmPlaying] = useState<boolean>(false);
  const [shareData, setShareData] = useState<{
    title: string;
    text: string;
    url?: string;
  }>({
    title: "Bảng Lưu Bút Yêu Thương - Welstory Kids' Day 2026",
    text: "Cùng xem và gửi lời chúc, kỷ niệm đẹp tại Bảng Lưu Bút Welstory Kids' Day 2026!",
  });
  const topicDropdownRef = useRef<HTMLDivElement | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const authorInputRef = useRef<HTMLInputElement | null>(null);
  const messageTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const toggleBgm = () => {
    const playing = bgmPlayer.toggle();
    setIsBgmPlaying(playing);
    if (playing) {
      showToast('🎵 Đang phát bài hát: "Khát Vọng Welstory"');
    } else {
      showToast('🔇 Đã tắt bài hát nền');
    }
  };

  const openShareModal = (note?: MemoryNote) => {
    if (note) {
      setShareData({
        title: `Lưu bút của gia đình ${note.parentName} & ${note.childName}`,
        text: `“${note.message}” — Lời chia sẻ từ gia đình ${note.parentName} & ${note.childName} (${note.department}) tại Welstory Kids' Day 2026!`,
      });
    } else {
      setShareData({
        title: "Bảng Lưu Bút Yêu Thương - Welstory Kids' Day 2026",
        text: "Chào mừng bạn đến với Bảng Lưu Bút Yêu Thương Welstory Kids' Day 2026! Cùng ghim những kỷ niệm đẹp và lời chúc ngọt ngào nhé.",
      });
    }
    setIsShareModalOpen(true);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3800);
  };

  // Listen to Firestore notes in real time (no login required)
  useEffect(() => {
    const notesPath = 'notes';
    const q = query(collection(db, notesPath), where('visibility', '==', 'public'));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        // Always purge any legacy seed notes if they exist in the database
        const legacyDocs = snapshot.docs.filter((d) => LEGACY_SEED_NOTE_IDS.includes(d.id));
        if (legacyDocs.length > 0) {
          await Promise.allSettled(
            legacyDocs.map((d) => deleteDoc(doc(db, notesPath, d.id)))
          );
        }

        const hasBtcWelcome = snapshot.docs.some((d) => d.id === BTC_WELCOME_NOTE_ID);
        if (!hasBtcWelcome && !hasSeededRef.current) {
          hasSeededRef.current = true;
          try {
            await Promise.allSettled(
              snapshot.docs
                .filter((d) => d.id !== BTC_WELCOME_NOTE_ID)
                .map((existingDoc) => deleteDoc(doc(db, notesPath, existingDoc.id)))
            );

            const authorId = getOrCreateGuestUid();

            for (const seed of INITIAL_SEED_NOTES) {
              await setDoc(doc(db, notesPath, seed.id), {
                parentName: seed.parentName.slice(0, VALIDATION_LIMITS.PARENT_NAME_MAX),
                childName: seed.childName.slice(0, VALIDATION_LIMITS.CHILD_NAME_MAX),
                department: seed.department.slice(0, VALIDATION_LIMITS.DEPARTMENT_MAX),
                familyIcon: seed.familyIcon,
                noteColor: seed.noteColor,
                topic: seed.topic,
                promptUsed: seed.promptUsed.slice(0, VALIDATION_LIMITS.PROMPT_USED_MAX),
                message: seed.message.slice(0, VALIDATION_LIMITS.MESSAGE_MAX),
                photoData: seed.photoData.slice(0, VALIDATION_LIMITS.PHOTO_DATA_MAX),
                photoCaption: seed.photoCaption.slice(0, VALIDATION_LIMITS.PHOTO_CAPTION_MAX),
                heartsCount: 0,
                authorUid: authorId,
                visibility: 'public',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
            }
          } catch (seedErr) {
            console.warn('Could not seed initial notes:', seedErr);
          }
          setIsLoadingNotes(false);
          return;
        }

        const fetchedNotes: MemoryNote[] = [];
        let hasNewRemoteNote = false;

        snapshot.forEach((docSnap) => {
          if (LEGACY_SEED_NOTE_IDS.includes(docSnap.id)) {
            return;
          }
          const data = docSnap.data();
          const item: MemoryNote = {
            id: docSnap.id,
            parentName: String(data.parentName || ''),
            childName: String(data.childName || ''),
            department: String(data.department || ''),
            familyIcon: (data.familyIcon as FamilyIconId) || 'chef-family',
            noteColor: (data.noteColor as NoteColorId) || 'butter',
            topic: (data.topic as TopicId) || 'ky-niem-dep',
            promptUsed: String(data.promptUsed || ''),
            message: String(data.message || ''),
            photoData: String(data.photoData || ''),
            photoCaption: String(data.photoCaption || ''),
            heartsCount: Number(data.heartsCount || 0),
            authorUid: String(data.authorUid || ''),
            visibility: 'public',
            createdAt: data.createdAt || null,
            updatedAt: data.updatedAt || null,
          };
          fetchedNotes.push(item);

          if (!isInitialLoadRef.current && !knownNoteIdsRef.current.has(docSnap.id)) {
            hasNewRemoteNote = true;
          }
          knownNoteIdsRef.current.add(docSnap.id);
        });

        isInitialLoadRef.current = false;
        setNotes(fetchedNotes);
        setIsLoadingNotes(false);

        if (hasNewRemoteNote) {
          showToast('✨ Có lời chia sẻ mới vừa được ghim lên tường!');
        }
      },
      (error) => {
        setIsLoadingNotes(false);
        handleFirestoreError(error, OperationType.LIST, notesPath);
      }
    );

    return () => unsubscribe();
  }, []);

  // Keep selectedNote in sync with real-time updates
  useEffect(() => {
    if (!selectedNote) return;
    const updated = notes.find((n) => n.id === selectedNote.id);
    if (updated) {
      setSelectedNote(updated);
    }
  }, [notes, selectedNote?.id]);

  // Close topic shortlist dropdown when clicking outside
  useEffect(() => {
    if (!isTopicListOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        topicDropdownRef.current &&
        !topicDropdownRef.current.contains(event.target as Node)
      ) {
        setIsTopicListOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isTopicListOpen]);

  // Show "Back to top" button when scrolling down past 500px
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-play background music on load/first interaction (runs continuously until user clicks mute/off)
  useEffect(() => {
    bgmPlayer.setupAutoPlayOnInteraction((playing) => {
      setIsBgmPlaying(playing);
    });
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open modal and focus input
  const openPostModal = (suggestion?: PromptSuggestion) => {
    if (suggestion) {
      setTopic(suggestion.topic);
      setPromptUsed(suggestion.question);
    }
    setFormError(null);
    setIsPostModalOpen(true);
    window.setTimeout(() => {
      if (suggestion) {
        messageTextareaRef.current?.focus();
      } else {
        authorInputRef.current?.focus();
      }
    }, 80);
  };

  const closePostModal = () => {
    setIsPostModalOpen(false);
    setFormError(null);
  };

  // Handle file upload with client-side compression
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    setFormError(null);
    setPhotoFileName(file.name);
    try {
      const compressedDataUrl = await compressImageFile(file);
      setPhotoData(compressedDataUrl);
      if (!photoCaption) {
        setPhotoCaption('Khoảnh khắc Welstory Kids Day 2026');
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Không thể tải ảnh lên.');
      setPhotoFileName('Chưa chọn ảnh nào');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const clearUploadedPhoto = () => {
    setPhotoData('');
    setPhotoCaption('');
    setPhotoFileName('Chưa chọn ảnh nào');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit new note to Firestore
  const handleSubmitNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanParent = parentName.trim().slice(0, VALIDATION_LIMITS.PARENT_NAME_MAX);
    const cleanChild = (childName.trim() || 'Bé yêu').slice(0, VALIDATION_LIMITS.CHILD_NAME_MAX);
    const cleanDept = department.trim().slice(0, VALIDATION_LIMITS.DEPARTMENT_MAX);
    const cleanPrompt = promptUsed.trim().slice(0, VALIDATION_LIMITS.PROMPT_USED_MAX);
    const cleanMessage = message.trim().slice(0, VALIDATION_LIMITS.MESSAGE_MAX);
    const cleanPhoto = photoData.trim().slice(0, VALIDATION_LIMITS.PHOTO_DATA_MAX);
    const cleanCaption = photoCaption.trim().slice(0, VALIDATION_LIMITS.PHOTO_CAPTION_MAX);

    if (!cleanParent || !cleanDept || !cleanMessage) {
      setFormError('Vui lòng điền đầy đủ Tên Bố/Mẹ & Bé, Phòng ban và Lời chia sẻ.');
      return;
    }

    setIsSubmitting(true);
    const notesPath = 'notes';

    try {
      await addDoc(collection(db, notesPath), {
        parentName: cleanParent,
        childName: cleanChild,
        department: cleanDept,
        familyIcon,
        noteColor,
        topic,
        promptUsed: cleanPrompt,
        message: cleanMessage,
        photoData: cleanPhoto,
        photoCaption: cleanCaption,
        heartsCount: 0,
        authorUid: guestUid,
        visibility: 'public',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      triggerCelebrationConfetti();
      setParentName('');
      setChildName('');
      setDepartment('');
      setMessage('');
      setPromptUsed('');
      clearUploadedPhoto();
      setFamilyIcon('chef-family');
      setNoteColor('butter');
      setActiveTopicFilter('all');
      closePostModal();
      showToast('Đã ghim lời chia sẻ của gia đình lên bảng lưu bút!');
    } catch (error) {
      setFormError('Không thể gửi lưu bút lúc này. Vui lòng thử lại.');
      handleFirestoreError(error, OperationType.CREATE, notesPath);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Heart reaction handler (atomic +1 in Firestore)
  const handleHeartClick = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const originX =
      typeof window !== 'undefined' && e.clientX ? e.clientX / window.innerWidth : 0.5;
    const originY =
      typeof window !== 'undefined' && e.clientY ? e.clientY / window.innerHeight : 0.6;

    markNoteLikedLocally(noteId);
    setLikedNotesMap(getLikedNoteIds());

    const notePath = `notes/${noteId}`;
    try {
      await updateDoc(doc(db, 'notes', noteId), {
        heartsCount: increment(1),
        updatedAt: serverTimestamp(),
      });
      triggerHeartConfetti(originX, originY);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, notePath);
    }
  };

  // Delete note handler
  const handleDeleteNote = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const notePath = `notes/${noteId}`;
    try {
      await deleteDoc(doc(db, 'notes', noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
      showToast('Đã xóa lưu bút khỏi tường.');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, notePath);
    }
  };

  // Computed KPI metrics & topic counts
  const metrics = useMemo(() => {
    const totalNotes = notes.length;
    const totalHearts = notes.reduce((acc, n) => acc + (n.heartsCount || 0), 0);
    const countsByTopic: Record<string, number> = { all: notes.length };
    for (const t of TOPICS) {
      countsByTopic[t.id] = notes.filter((n) => n.topic === t.id).length;
    }
    return { totalNotes, totalHearts, countsByTopic };
  }, [notes]);

  // Filtered and sorted notes (newest first)
  const filteredNotes = useMemo(() => {
    return notes
      .filter((note) => {
        if (activeTopicFilter !== 'all' && note.topic !== activeTopicFilter) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const timeA =
          a.createdAt && typeof a.createdAt.toMillis === 'function'
            ? a.createdAt.toMillis()
            : Date.now();
        const timeB =
          b.createdAt && typeof b.createdAt.toMillis === 'function'
            ? b.createdAt.toMillis()
            : Date.now();
        return timeB - timeA;
      });
  }, [notes, activeTopicFilter]);

  return (
    <div className="min-h-screen text-slate-800 flex flex-col justify-between overflow-x-hidden">
      {/* ================= HEADER / HERO BANNER ================= */}
      <header className="relative bg-gradient-to-b from-orange-100/90 via-amber-50/60 to-transparent pt-5 pb-6 px-4 sm:px-6 lg:px-8 overflow-hidden border-b border-orange-200/50">
        {/* Floating corner decorations */}
        <div
          className="hidden md:block absolute top-6 left-10 text-4xl opacity-60 float-anim pointer-events-none select-none"
          aria-hidden="true"
        >
          🎈
        </div>
        <div
          className="hidden md:block absolute top-12 right-12 text-4xl opacity-60 float-anim pointer-events-none select-none"
          style={{ animationDelay: '1.5s' }}
          aria-hidden="true"
        >
          🎡
        </div>
        <div
          className="hidden lg:block absolute bottom-6 left-1/5 text-3xl opacity-50 float-anim pointer-events-none select-none"
          style={{ animationDelay: '2.5s' }}
          aria-hidden="true"
        >
          🎨
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Official Key Visual Banner Image - Balanced & Compact Size */}
          <div
            className="max-w-md sm:max-w-lg mx-auto mb-4 rounded-2xl overflow-hidden shadow-md border-4 border-white bg-sky-100/70 transition-transform duration-300 hover:scale-[1.01] cursor-pointer"
            onClick={() => openPostModal()}
          >
            <img
              src="/assets/aistudio/Background_ab42acbc.png"
              alt="Welstory Kid's Day 2026 - Bảng Lưu Bút Yêu Thương"
              className="w-full h-auto block"
            />
          </div>

          {/* Key Visual Title & Kêu gọi */}
          <p className="max-w-xl mx-auto text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
            Những tiếng cười giòn tan và ánh mắt rạng rỡ của các &ldquo;thiên thần nhỏ&rdquo; là món quà tuyệt vời nhất. Hãy cùng lưu giữ lại những cảm xúc, kỷ niệm đẹp và các câu nói ngộ nghĩnh của các bé sau ngày hội tại bức tường kỷ niệm này nhé!
          </p>

          {/* Action Buttons */}
          <div className="flex flex-row flex-nowrap items-center justify-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => openPostModal()}
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-gradient-to-r from-[#EA5514] to-orange-500 hover:from-orange-600 hover:to-red-500 text-white font-heading font-bold text-xs sm:text-sm px-3.5 py-2.5 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl shadow-md shadow-orange-500/25 transform hover:-translate-y-0.5 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Viết chia sẻ ngay</span>
            </button>

            <button
              type="button"
              onClick={() => setShowInspirationBox((prev) => !prev)}
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-gradient-to-r from-[#EA5514] to-orange-500 hover:from-orange-600 hover:to-red-500 text-white font-heading font-bold text-xs sm:text-sm px-3.5 py-2.5 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl shadow-md shadow-orange-500/25 transform hover:-translate-y-0.5 transition-all active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-200 shrink-0" />
              <span>Gợi ý viết cảm nghĩ</span>
            </button>

            <button
              type="button"
              onClick={() => openShareModal()}
              title="Chia sẻ lên Facebook / Instagram"
              className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-orange-50 text-slate-700 hover:text-[#EA5514] border border-orange-200 font-heading font-bold text-xs sm:text-sm px-3 py-2.5 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl shadow-sm hover:shadow transition-all active:scale-95 whitespace-nowrap cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#EA5514] shrink-0" />
              <span className="hidden xs:inline sm:inline">Chia sẻ</span>
            </button>

            <button
              type="button"
              onClick={toggleBgm}
              title={isBgmPlaying ? 'Tắt nhạc nền' : 'Bật nhạc nền vui tươi'}
              aria-label={isBgmPlaying ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
              className={`inline-flex items-center justify-center gap-1.5 font-heading font-bold text-xs sm:text-sm px-3 py-2.5 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl border transition-all active:scale-95 whitespace-nowrap cursor-pointer ${
                isBgmPlaying
                  ? 'bg-amber-100/90 border-amber-300 text-amber-900 shadow-sm shadow-amber-300/40 animate-pulse'
                  : 'bg-white hover:bg-orange-50 border-orange-200 text-slate-700 hover:text-[#EA5514]'
              }`}
            >
              {isBgmPlaying ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#EA5514] shrink-0" />
                  <span className="hidden sm:inline">Nhạc: Bật</span>
                </>
              ) : (
                <>
                  <Music className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 shrink-0" />
                  <span className="hidden sm:inline">Nhạc nền</span>
                </>
              )}
            </button>
          </div>

          {/* Question Prompts Box on Top of Page */}
          {showInspirationBox && (
            <div className="max-w-2xl mx-auto mt-5 bg-white/95 backdrop-blur-md border-2 border-dashed border-amber-300 rounded-2xl p-4 text-left shadow-sm transition-all">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h2 className="font-heading font-bold text-slate-800 flex items-center gap-2 text-xs sm:text-sm">
                  <span className="text-lg" aria-hidden="true">
                    💡
                  </span>
                  <span>
                    Bố mẹ chưa biết bắt đầu từ đâu? Hãy chạm vào 1 trong các câu hỏi gợi ý sau nhé:
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={() => setShowInspirationBox(false)}
                  aria-label="Ẩn hộp gợi ý"
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <ul className="space-y-1.5 text-xs sm:text-sm text-slate-600 pl-1">
                {PROMPT_SUGGESTIONS.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => openPostModal(item)}
                      className="w-full text-left flex items-start gap-2 py-1 px-2 rounded-xl hover:bg-amber-50/90 hover:text-slate-900 transition-colors group cursor-pointer"
                    >
                      <span className="text-[#EA5514] font-heading font-bold shrink-0">
                        {item.number}
                      </span>
                      <span className="flex-1">
                        {item.question}{' '}
                        <span className="text-xs font-heading font-semibold text-[#EA5514] opacity-80 group-hover:opacity-100">
                          ({item.topicLabel} →)
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </header>

      {/* ================= TOOLBAR & COLLAPSIBLE TOPIC SHORTLIST ================= */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-6 mb-8 relative z-20">
        <div className="bg-white/95 backdrop-blur-md border border-orange-100 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Stats & Online Sync Status */}
          <div className="flex items-center gap-5 w-full sm:w-auto justify-center sm:justify-start border-b sm:border-b-0 pb-3 sm:pb-0 border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#EA5514] flex items-center justify-center shrink-0">
                <MessageCircleHeart className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Lời chia sẻ</p>
                <p className="font-heading font-extrabold text-lg text-slate-800 leading-none font-mono-num">
                  {metrics.totalNotes}
                </p>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200" />

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-500 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 fill-rose-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Lượt thả tim</p>
                <p className="font-heading font-extrabold text-lg text-slate-800 leading-none font-mono-num">
                  {metrics.totalHearts}
                </p>
              </div>
            </div>

            <div className="hidden md:block h-8 w-px bg-slate-200" />

            <div className="hidden md:flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/60">
              <span>Đồng bộ trực tuyến</span>
            </div>
          </div>

          {/* Clickable Topic Shortlist Dropdown */}
          <div ref={topicDropdownRef} className="relative w-full sm:w-72">
            <button
              type="button"
              onClick={() => setIsTopicListOpen((prev) => !prev)}
              aria-expanded={isTopicListOpen}
              className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-orange-50/80 border border-slate-200 hover:border-orange-200 text-slate-800 font-heading font-bold text-xs sm:text-sm transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2 truncate">
                <span className="text-slate-500 font-semibold">Chủ đề lưu bút:</span>
                {activeTopicFilter === 'all' ? (
                  <span className="text-[#EA5514] truncate">🌟 Tất cả</span>
                ) : (
                  <span className="text-[#EA5514] truncate">
                    {TOPICS.find((t) => t.id === activeTopicFilter)?.emoji}{' '}
                    {TOPICS.find((t) => t.id === activeTopicFilter)?.label}
                  </span>
                )}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                  isTopicListOpen ? 'rotate-180 text-[#EA5514]' : ''
                }`}
              />
            </button>

            {/* Dropdown List shown only when clicked */}
            {isTopicListOpen && (
              <div className="absolute right-0 left-0 mt-2 bg-white rounded-2xl shadow-xl border border-orange-100 p-2 z-30">
                <ul className="flex flex-col gap-1" role="listbox">
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTopicFilter('all');
                        setIsTopicListOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-heading font-bold transition-all cursor-pointer ${
                        activeTopicFilter === 'all'
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-700 hover:bg-orange-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>🌟</span>
                        <span>Tất cả</span>
                      </span>
                      <span
                        className={`text-xs font-mono-num px-2 py-0.5 rounded-lg ${
                          activeTopicFilter === 'all'
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {metrics.countsByTopic.all || 0}
                      </span>
                    </button>
                  </li>

                  {TOPICS.map((t) => {
                    const isActive = activeTopicFilter === t.id;
                    return (
                      <li key={t.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTopicFilter(t.id);
                            setIsTopicListOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-heading font-bold transition-all cursor-pointer ${
                            isActive
                              ? 'bg-slate-800 text-white'
                              : 'text-slate-700 hover:bg-orange-50'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>{t.emoji}</span>
                            <span>{t.label}</span>
                          </span>
                          <span
                            className={`text-xs font-mono-num px-2 py-0.5 rounded-lg ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {metrics.countsByTopic[t.id] || 0}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ================= MESSAGE WALL GRID (BẢNG LƯU BÚT) ================= */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex-grow pb-16">
        {isLoadingNotes ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 items-start">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-64 rounded-3xl border-2 border-amber-200 bg-amber-50/60 p-6 animate-pulse flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="h-10 w-2/3 bg-amber-200/60 rounded-2xl" />
                  <div className="h-4 w-1/3 bg-amber-200/60 rounded-lg" />
                  <div className="h-20 w-full bg-amber-200/50 rounded-xl" />
                </div>
                <div className="h-6 w-full bg-amber-200/50 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="bg-white/80 border border-orange-100 rounded-3xl text-center py-16 px-4">
            <div className="text-6xl mb-4" aria-hidden="true">
              🎈
            </div>
            <h3 className="font-heading font-bold text-xl text-slate-700 mb-2">
              Chưa có lời chia sẻ nào trong chủ đề này
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              Hãy trở thành gia đình đầu tiên viết cảm nghĩ cho chủ đề này nhé!
            </p>
            <div className="flex items-center justify-center gap-3">
              {activeTopicFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setActiveTopicFilter('all')}
                  className="px-5 py-2.5 bg-orange-100 hover:bg-orange-200 text-orange-700 font-heading font-bold rounded-xl text-sm transition-all cursor-pointer"
                >
                  Xem tất cả lưu bút
                </button>
              )}
              <button
                type="button"
                onClick={() => openPostModal()}
                className="px-5 py-2.5 bg-gradient-to-r from-[#EA5514] to-orange-500 text-white font-heading font-bold rounded-xl text-sm transition-all cursor-pointer"
              >
                Gửi lưu bút ngay
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 items-start">
            {filteredNotes.map((note, idx) => (
              <NoteCard
                key={note.id}
                note={note}
                index={idx}
                localLikes={likedNotesMap[note.id] || 0}
                canDelete={note.authorUid === guestUid}
                onHeartClick={handleHeartClick}
                onSelectNote={(n) => setSelectedNote(n)}
                onOpenLightbox={(url, caption, e) => {
                  e.stopPropagation();
                  setLightboxPhoto({ url, caption });
                }}
                onDeleteNote={handleDeleteNote}
                onShareNote={(n) => openShareModal(n)}
              />
            ))}
          </div>
        )}
      </main>

      {/* FLOATING ACTION BUTTONS (MUSIC, BACK TO TOP & MOBILE POST) */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-3">
        {/* Floating Music Button */}
        <button
          type="button"
          onClick={toggleBgm}
          title={isBgmPlaying ? 'Tắt nhạc nền' : 'Bật nhạc nền vui tươi'}
          aria-label={isBgmPlaying ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
          className={`inline-flex items-center justify-center p-3 sm:px-4 sm:py-2.5 rounded-2xl border-2 shadow-lg transition-all duration-300 cursor-pointer active:scale-95 ${
            isBgmPlaying
              ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-amber-300/40 animate-pulse'
              : 'bg-white/95 hover:bg-orange-50 border-orange-200 text-slate-700 hover:text-[#EA5514] shadow-orange-500/10'
          }`}
        >
          {isBgmPlaying ? (
            <div className="flex items-center gap-1.5 font-heading font-bold text-xs sm:text-sm text-[#EA5514]">
              <Volume2 className="w-4 h-4 shrink-0 animate-bounce" />
              <span className="hidden sm:inline">Tắt nhạc</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 font-heading font-bold text-xs sm:text-sm">
              <Music className="w-4 h-4 text-slate-600 shrink-0" />
              <span className="hidden sm:inline">Bật nhạc</span>
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={scrollToTop}
          title="Lên đầu trang"
          aria-label="Lên đầu trang"
          className={`inline-flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl bg-white/95 hover:bg-orange-50 text-[#EA5514] border-2 border-orange-200 shadow-lg shadow-orange-500/15 font-heading font-bold text-xs sm:text-sm transition-all duration-300 cursor-pointer active:scale-95 ${
            showBackToTop
              ? 'opacity-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          <ArrowUp className="w-4 h-4 shrink-0" />
          <span>Lên đầu trang</span>
        </button>

        <button
          type="button"
          onClick={() => openPostModal()}
          className="md:hidden bg-gradient-to-r from-[#EA5514] to-orange-500 text-white p-4 rounded-full shadow-xl shadow-orange-500/40 flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
          aria-label="Viết chia sẻ"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* ================= MODAL GỬI LỜI CHIA SẺ ================= */}
      {isPostModalOpen && (
        <div
          onClick={closePostModal}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-orange-100 p-6 sm:p-7"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-orange-100 text-[#EA5514] flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="font-heading font-bold text-xl text-slate-800">
                    Gửi Lưu Bút Kids&apos; Day 2026
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={closePostModal}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitNote} className="space-y-4">
              {/* Row 1: Parent Name & Child Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-heading font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tên Bố/Mẹ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    ref={authorInputRef}
                    type="text"
                    required
                    maxLength={VALIDATION_LIMITS.PARENT_NAME_MAX}
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="VD: Mẹ Thu Hà / Bố Tuấn"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EA5514]/40 focus:border-[#EA5514]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-heading font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tên Bé Yêu
                  </label>
                  <input
                    type="text"
                    maxLength={VALIDATION_LIMITS.CHILD_NAME_MAX}
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="VD: Bé Bắp (5 tuổi)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EA5514]/40 focus:border-[#EA5514]"
                  />
                </div>
              </div>

              {/* Row 2: Department */}
              <div>
                <label className="block text-xs font-heading font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Phòng ban / Bộ phận <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={VALIDATION_LIMITS.DEPARTMENT_MAX}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Nhập phòng ban / bộ phận của bạn..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EA5514]/40 focus:border-[#EA5514]"
                />
              </div>

              {/* Row 3: Topic & Family Avatar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-heading font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Chủ đề chia sẻ
                  </label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value as TopicId)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EA5514]/40 focus:border-[#EA5514]"
                  >
                    {TOPICS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.optionText}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-heading font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Biểu tượng gia đình
                  </label>
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-1.5">
                    {FAMILY_ICONS.map((icon) => {
                      const active = familyIcon === icon.id;
                      return (
                        <button
                          key={icon.id}
                          type="button"
                          onClick={() => setFamilyIcon(icon.id)}
                          title={icon.label}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all cursor-pointer ${
                            active
                              ? 'bg-white shadow-xs ring-2 ring-[#EA5514]'
                              : 'hover:bg-white'
                          }`}
                        >
                          {icon.emoji}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Row 4: Message Content */}
              <div>
                <label className="block text-xs font-heading font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Lời chia sẻ / Kỷ niệm của gia đình <span className="text-rose-500">*</span>
                </label>
                {promptUsed && (
                  <div className="mb-2 flex items-center justify-between gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs text-amber-900">
                    <span className="truncate">Gợi ý: “{promptUsed}”</span>
                    <button
                      type="button"
                      onClick={() => setPromptUsed('')}
                      className="text-amber-700 hover:underline shrink-0"
                    >
                      Bỏ
                    </button>
                  </div>
                )}
                <textarea
                  ref={messageTextareaRef}
                  rows={4}
                  required
                  maxLength={VALIDATION_LIMITS.MESSAGE_MAX}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hãy chia sẻ cảm xúc của bố mẹ hoặc trích dẫn câu nói ngộ nghĩnh của các bé sau ngày hội nhé..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EA5514]/40 focus:border-[#EA5514] resize-none"
                />
              </div>

              {/* Row 5: Photo Upload & Quick Presets */}
              <div>
                <label className="block text-xs font-heading font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Đính kèm hình ảnh kỷ niệm (Tùy chọn)
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={isUploadingPhoto}
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 font-medium text-xs sm:text-sm rounded-xl border border-orange-200 transition-colors"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>{isUploadingPhoto ? 'Đang nén ảnh...' : 'Chọn ảnh từ máy'}</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <span className="text-xs text-slate-400 truncate max-w-[160px]">
                    {photoFileName}
                  </span>
                  {photoData && (
                    <button
                      type="button"
                      onClick={clearUploadedPhoto}
                      className="text-xs text-rose-500 hover:underline font-medium"
                    >
                      Xóa ảnh
                    </button>
                  )}
                </div>

                {photoData && (
                  <div className="mt-3 relative w-full h-40 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                    <img
                      src={photoData}
                      alt="Xem trước ảnh đính kèm"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>

              {/* Row 6: Note Paper Color */}
              <div>
                <label className="block text-xs font-heading font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Chọn màu giấy Note
                </label>
                <div className="flex items-center gap-3">
                  {NOTE_COLORS.map((color) => {
                    const active = noteColor === color.id;
                    return (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => setNoteColor(color.id)}
                        title={color.name}
                        className={`w-8 h-8 rounded-full border-2 ${color.swatchClass} transition-all cursor-pointer ${
                          active ? 'ring-2 ring-offset-2 ring-[#EA5514]' : ''
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {formError && (
                <div className="rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs text-rose-700 font-medium">
                  {formError}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closePostModal}
                  className="px-5 py-2.5 rounded-xl text-sm font-heading font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingPhoto}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#EA5514] to-orange-500 hover:from-orange-600 hover:to-red-500 text-white font-heading font-bold text-sm rounded-xl shadow-md shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Đang ghim...' : 'Ghim lên tường'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL XEM ẢNH TO (LIGHTBOX) ================= */}
      {lightboxPhoto && (
        <div
          onClick={() => setLightboxPhoto(null)}
          className="fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 cursor-zoom-out"
        >
          <img
            src={lightboxPhoto.url}
            alt={lightboxPhoto.caption}
            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl border-4 border-white object-contain"
          />
          {lightboxPhoto.caption && (
            <p className="mt-3 text-sm font-heading font-bold text-white bg-slate-900/70 px-4 py-1.5 rounded-xl">
              {lightboxPhoto.caption}
            </p>
          )}
        </div>
      )}

      {/* ================= MODAL XEM CHI TIẾT LƯU BÚT ================= */}
      <NoteDetailModal
        note={selectedNote}
        localLikes={selectedNote ? likedNotesMap[selectedNote.id] || 0 : 0}
        onClose={() => setSelectedNote(null)}
        onHeartClick={handleHeartClick}
        onShareNote={(n) => openShareModal(n)}
      />

      {/* ================= MODAL CHIA SẺ FACEBOOK & INSTAGRAM ================= */}
      <SocialShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={shareData.title}
        shareText={shareData.text}
        shareUrl={shareData.url}
        onNotify={showToast}
      />

      {/* ================= TOAST THÔNG BÁO ================= */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300 ${
          toastMessage ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-medium">
          <span className="text-xl" aria-hidden="true">
            🎉
          </span>
          <span>{toastMessage || 'Cảm ơn bố/mẹ đã gửi lời chia sẻ lên tường!'}</span>
        </div>
      </div>

      {/* ================= FOOTER ================= */}
      <footer className="bg-white/80 border-t border-orange-100 py-6 px-4 text-center text-xs sm:text-sm text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-heading font-bold text-slate-700">
            🌟 Ban Tổ Chức Welstory Kids&apos; Day 2026
          </p>
          <p>Cảm ơn sự đồng hành tuyệt vời của các bố mẹ và các siêu nhí!</p>
        </div>
      </footer>
    </div>
  );
}

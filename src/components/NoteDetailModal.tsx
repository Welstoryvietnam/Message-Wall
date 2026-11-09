import React, { useEffect, useState } from 'react';
import { X, Heart, MessageSquareQuote, Image as ImageIcon } from 'lucide-react';
import { MemoryNote, NOTE_COLORS, TOPICS } from '../types';
import { FamilyEmblemSvg, FAMILY_ICONS } from './FamilyIcons';
import { formatRelativeTime } from './NoteCard';

interface NoteDetailModalProps {
  note: MemoryNote | null;
  localLikes: number;
  onClose: () => void;
  onHeartClick: (noteId: string, e: React.MouseEvent) => void;
}

export const NoteDetailModal: React.FC<NoteDetailModalProps> = ({
  note,
  localLikes,
  onClose,
  onHeartClick,
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [note?.id]);

  useEffect(() => {
    if (!note) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [note, onClose]);

  if (!note) return null;

  const colorTheme = NOTE_COLORS.find((c) => c.id === note.noteColor) || NOTE_COLORS[0];
  const topicMeta = TOPICS.find((t) => t.id === note.topic) || TOPICS[0];
  const iconMeta = FAMILY_ICONS.find((i) => i.id === note.familyIcon) || FAMILY_ICONS[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-note-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-2xl rounded-2xl border ${colorTheme.bgClass} ${colorTheme.borderClass} p-6 sm:p-8 my-8`}
      >
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-black/10">
          <div className="flex items-center gap-4 min-w-0">
            <div className="shrink-0 rounded-xl border border-black/10 bg-white p-2">
              <FamilyEmblemSvg iconId={note.familyIcon} className="w-11 h-11" />
            </div>
            <div className="min-w-0">
              <h2
                id="modal-note-title"
                className="font-display text-xl sm:text-2xl font-bold text-zinc-900 leading-snug"
              >
                {note.parentName} <span className="text-rose-600 font-normal">&amp;</span> {note.childName}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs sm:text-sm text-zinc-600">
                <span className="font-medium text-zinc-800">{note.department}</span>
                <span aria-hidden="true">·</span>
                <span className={`font-medium ${colorTheme.accentTextClass}`}>{topicMeta.label}</span>
                <span aria-hidden="true">·</span>
                <span>{iconMeta.label}</span>
                <span aria-hidden="true">·</span>
                <span>{formatRelativeTime(note.createdAt)}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="shrink-0 w-10 h-10 rounded-xl bg-white/80 border border-black/10 flex items-center justify-center text-zinc-700 hover:bg-white hover:text-zinc-950 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {note.promptUsed && (
          <div className="mt-5 rounded-xl bg-white/70 border border-black/5 p-3.5 flex items-start gap-2.5 text-sm text-zinc-700 italic">
            <MessageSquareQuote className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            <span>Gợi ý chia sẻ: “{note.promptUsed}”</span>
          </div>
        )}

        <div className="mt-5">
          <p className="text-base sm:text-lg leading-relaxed text-zinc-900 whitespace-pre-line">
            {note.message}
          </p>
        </div>

        {note.photoData && (
          <div className="mt-6 rounded-xl bg-white border border-black/10 p-3">
            {!imgError ? (
              <div className="overflow-hidden rounded-lg bg-zinc-100 max-h-[420px] flex items-center justify-center">
                <img
                  src={note.photoData}
                  alt={note.photoCaption || `Ảnh kỷ niệm của ${note.parentName} và ${note.childName}`}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="max-h-[420px] w-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-[16/9] w-full rounded-lg bg-gradient-to-br from-amber-50 via-rose-50 to-sky-50 flex flex-col items-center justify-center p-6 text-center">
                <ImageIcon className="w-8 h-8 text-rose-400 mb-2" />
                <span className="text-sm font-medium text-zinc-700">
                  Ảnh kỷ niệm gia đình {note.parentName} &amp; {note.childName}
                </span>
              </div>
            )}
            {note.photoCaption && (
              <p className="mt-2.5 text-center text-sm text-zinc-600 italic">
                “{note.photoCaption}”
              </p>
            )}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-black/10 flex items-center justify-between gap-4">
          <span className="text-xs text-zinc-600">
            Đồng bộ trực tuyến theo thời gian thực · Welstory Kids Day 2026
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => onHeartClick(note.id, e)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                localLikes > 0
                  ? 'bg-rose-600 text-white'
                  : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
              }`}
            >
              <Heart
                className={`w-4 h-4 ${
                  localLikes > 0 ? 'fill-white text-white' : 'fill-rose-500 text-rose-500'
                }`}
              />
              <span>Thả tim yêu thương</span>
              <span className="font-mono-num">{note.heartsCount}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

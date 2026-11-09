import React, { useState } from 'react';
import { Heart, Clock, Building2, Trash2, Image as ImageIcon } from 'lucide-react';
import { MemoryNote, NOTE_COLORS, TOPICS } from '../types';
import { FamilyEmblemSvg } from './FamilyIcons';

interface NoteCardProps {
  note: MemoryNote;
  index: number;
  localLikes: number;
  canDelete: boolean;
  onHeartClick: (noteId: string, e: React.MouseEvent) => void;
  onSelectNote: (note: MemoryNote) => void;
  onOpenLightbox: (imgUrl: string, caption: string, e: React.MouseEvent) => void;
  onDeleteNote?: (noteId: string, e: React.MouseEvent) => void;
}

export function formatRelativeTime(timestamp: MemoryNote['createdAt']): string {
  if (!timestamp || typeof timestamp.toDate !== 'function') {
    return 'Vừa xong';
  }
  const date = timestamp.toDate();
  const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSeconds < 60) return 'Vừa xong';
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} phút trước`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} giờ trước`;
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

const ROTATIONS = ['-rotate-1', 'rotate-1', 'rotate-0'] as const;

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  index,
  localLikes,
  canDelete,
  onHeartClick,
  onSelectNote,
  onOpenLightbox,
  onDeleteNote,
}) => {
  const [imgError, setImgError] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);

  const colorTheme = NOTE_COLORS.find((c) => c.id === note.noteColor) || NOTE_COLORS[0];
  const topicMeta = TOPICS.find((t) => t.id === note.topic) || TOPICS[0];
  const rotationClass = ROTATIONS[index % ROTATIONS.length];

  const isLiked = localLikes > 0;

  const displayAuthor =
    note.childName &&
    note.childName.trim() !== '' &&
    !note.parentName.toLowerCase().includes(note.childName.toLowerCase())
      ? `${note.parentName} & ${note.childName}`
      : note.parentName;

  const handleLikeButton = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHeartAnim(true);
    window.setTimeout(() => setHeartAnim(false), 380);
    onHeartClick(note.id, e);
  };

  return (
    <article
      onClick={() => onSelectNote(note)}
      className={`note-card relative ${colorTheme.bgClass} border-2 ${colorTheme.borderClass} rounded-3xl p-5 sm:p-6 shadow-xs ${rotationClass} flex flex-col justify-between cursor-pointer`}
    >
      {/* 3D Push-Pin at top center */}
      <div className={`pin-dot ${colorTheme.pinClass}`} />

      <div>
        {/* Author Avatar + Name + Department */}
        <div className="flex items-start justify-between gap-3 mb-3 pt-1">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white shadow-xs border border-slate-100 flex items-center justify-center text-2xl shrink-0">
              <FamilyEmblemSvg iconId={note.familyIcon} />
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-bold text-slate-800 text-base leading-snug truncate">
                {displayAuthor}
              </h3>
              <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{note.department}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Category / Topic Line */}
        <div className="mb-3 flex items-center gap-1.5 text-xs font-heading font-bold">
          <span>{topicMeta.emoji}</span>
          <span className={colorTheme.accentTextClass}>{topicMeta.label}</span>
          {note.promptUsed && (
            <>
              <span className="text-slate-400" aria-hidden="true">
                ·
              </span>
              <span className="text-slate-500 font-normal truncate">
                {note.promptUsed}
              </span>
            </>
          )}
        </div>

        {/* Quoted Message Content */}
        <p className="text-slate-700 text-sm sm:text-[15px] leading-relaxed whitespace-pre-line mb-4 font-normal break-words">
          “{note.message}”
        </p>

        {/* Attached Memory Image */}
        {note.photoData && (
          <div
            onClick={(e) => onOpenLightbox(note.photoData, note.photoCaption || displayAuthor, e)}
            className="mb-4 rounded-2xl overflow-hidden border-2 border-white shadow-xs bg-slate-100 cursor-zoom-in group"
          >
            {!imgError ? (
              <img
                src={note.photoData}
                alt={note.photoCaption || `Kỷ niệm Welstory Kids' Day - ${displayAuthor}`}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-44 bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 flex flex-col items-center justify-center p-4 text-center">
                <ImageIcon className="w-7 h-7 text-orange-400 mb-1.5" />
                <span className="text-xs font-heading font-bold text-slate-700">
                  Welstory Kids&apos; Day 2026 · {displayAuthor}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer: Relative Time + Heart Reaction Button */}
      <div className="pt-3 border-t border-black/5 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1 font-medium text-slate-500">
          <Clock className="w-3.5 h-3.5" />
          <span>{formatRelativeTime(note.createdAt)}</span>
        </span>

        <div className="flex items-center gap-2">
          {canDelete && onDeleteNote && (
            <button
              type="button"
              onClick={(e) => onDeleteNote(note.id, e)}
              title="Xóa lưu bút này"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleLikeButton}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-heading font-bold text-xs transition-all active:scale-90 whitespace-nowrap shrink-0 ${
              isLiked
                ? 'bg-rose-100/90 border-rose-200 text-rose-600'
                : 'bg-white/85 border-slate-200/80 text-slate-600 hover:bg-rose-50 hover:text-rose-600'
            }`}
          >
            <Heart
              className={`w-4 h-4 ${heartAnim ? 'animate-heart' : ''} ${
                isLiked ? 'fill-rose-500 text-rose-500' : 'text-slate-500'
              }`}
            />
            <span className="font-mono-num">{note.heartsCount}</span>
          </button>
        </div>
      </div>
    </article>
  );
};

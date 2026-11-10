import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Share2 } from 'lucide-react';
import { shareOnFacebook, shareOnInstagram } from '../utils/imageAndSeed';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  shareText?: string;
  shareUrl?: string;
  onNotify?: (msg: string) => void;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  isOpen,
  onClose,
  title = 'Chia sẻ Lưu Bút Yêu Thương',
  shareText = "Bảng Lưu Bút Yêu Thương - Welstory Kids' Day 2026! Cùng lưu giữ những khoảnh khắc tuyệt vời của các bé và gia đình.",
  shareUrl,
  onNotify,
}) => {
  const [copied, setCopied] = useState(false);
  const currentUrl = shareUrl || (typeof window !== 'undefined' ? window.location.href : '');

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareText}\n${currentUrl}`);
        setCopied(true);
        if (onNotify) onNotify('Đã sao chép liên kết & lời nhắn vào bộ nhớ tạm!');
        setTimeout(() => setCopied(false), 2200);
      }
    } catch {
      // fallback
    }
  };

  const handleShareFacebook = () => {
    shareOnFacebook(currentUrl);
    if (onNotify) onNotify('Đang mở Facebook để chia sẻ...');
  };

  const handleShareInstagram = () => {
    const res = shareOnInstagram(shareText);
    if (onNotify) onNotify(res.message);
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: shareText,
          url: currentUrl,
        });
      } catch {
        // user cancelled or share failed
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-orange-100 relative animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-orange-100 text-[#EA5514] flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-heading font-bold text-base sm:text-lg text-slate-800">
                {title}
              </h3>
              <p className="text-xs text-slate-500">Lan tỏa niềm vui Welstory Kids&apos; Day 2026</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Share buttons */}
        <div className="py-5 grid grid-cols-2 gap-3.5">
          {/* Facebook Button */}
          <button
            type="button"
            onClick={handleShareFacebook}
            className="group flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl border-2 border-blue-100 hover:border-blue-400 bg-blue-50/50 hover:bg-blue-50 transition-all cursor-pointer active:scale-95"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#1877F2] text-white flex items-center justify-center shadow-md shadow-blue-500/30 group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </div>
            <div className="text-center">
              <span className="block font-heading font-bold text-xs sm:text-sm text-slate-800">
                Facebook
              </span>
              <span className="text-[11px] text-blue-600 font-medium inline-flex items-center gap-0.5">
                Chia sẻ ngay <ExternalLink className="w-2.5 h-2.5" />
              </span>
            </div>
          </button>

          {/* Instagram Button */}
          <button
            type="button"
            onClick={handleShareInstagram}
            className="group flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl border-2 border-pink-100 hover:border-pink-400 bg-pink-50/50 hover:bg-pink-50 transition-all cursor-pointer active:scale-95"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shadow-md shadow-pink-500/30 group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </div>
            <div className="text-center">
              <span className="block font-heading font-bold text-xs sm:text-sm text-slate-800">
                Instagram
              </span>
              <span className="text-[11px] text-pink-600 font-medium inline-flex items-center gap-0.5">
                Story / Bài viết <ExternalLink className="w-2.5 h-2.5" />
              </span>
            </div>
          </button>
        </div>

        {/* Copy Link input */}
        <div className="pt-2">
          <label className="block text-xs font-heading font-bold text-slate-600 mb-1.5">
            Hoặc sao chép liên kết chia sẻ:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={currentUrl}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 truncate focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-heading font-bold transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-orange-50 hover:bg-orange-100 text-[#EA5514] border border-orange-200'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Đã chép</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Device Native Share (if available on mobile) */}
        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={handleNativeShare}
              className="text-xs font-heading font-semibold text-slate-500 hover:text-[#EA5514] inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Chia sẻ qua ứng dụng khác (Zalo, Tin nhắn, v.v.)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

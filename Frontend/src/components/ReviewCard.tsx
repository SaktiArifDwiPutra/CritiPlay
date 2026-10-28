import { useNavigate } from 'react-router-dom';
import { Star, ThumbsUp, MessageSquare, Edit3, Trash2 } from 'lucide-react';
import type { Review } from '../types';
import { RATING_DESCRIPTIONS } from './StarRatingInput';
import { GamerAvatar, GamerUserName, GamerBadgePill } from './GamerBadge';

interface ReviewCardProps {
  review: Review;
  onDelete: (reviewId: string) => void;
  onEdit: (review: Review) => void;
  onHelpful: (reviewId: string) => void;
  onDiscussion: (reviewId: string) => void;
  isOwner?: boolean;
}

export default function ReviewCard({
  review,
  onDelete,
  onEdit,
  onHelpful,
  onDiscussion,
  isOwner = false,
}: ReviewCardProps) {
  const navigate = useNavigate();

  const handleOpenProfile = () => {
    navigate(`/profile/${review.userId}`);
  };

  const overallScoreNum = Number(review.ratingOverall || 0);
  const roundedOverall = Math.min(10, Math.max(1, Math.round(overallScoreNum)));
  const descriptor = RATING_DESCRIPTIONS[roundedOverall];

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 sm:p-6 backdrop-blur-md shadow-sm transition-all duration-200 hover:border-slate-700/80">
      {/* User Header + Date + Actions */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <button
          type="button"
          onClick={handleOpenProfile}
          className="group flex items-center gap-3 text-left"
        >
          {/* User Avatar with Tier Ring */}
          <GamerAvatar
            avatar={review.userAvatar}
            name={review.userName}
            stats={review.gamerStats}
            sizeClass="h-11 w-11"
          />

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <GamerUserName
                name={review.userName}
                stats={review.gamerStats}
                className="text-sm font-bold"
              />
              {review.gamerStats && (
                <GamerBadgePill stats={review.gamerStats} size="xs" />
              )}
              {isOwner && (
                <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-300 border border-indigo-500/30">
                  Anda
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-0.5">
              {new Date(review.dateAdded).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        </button>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {isOwner && (
            <>
              <button
                type="button"
                onClick={() => onEdit(review)}
                className="flex items-center gap-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 transition-colors hover:bg-indigo-500/20"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={() => onDelete(review.id)}
                className="flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Hapus</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Overall Score Badge */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-1.5">
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span className="text-xl font-black text-amber-400">
            {overallScoreNum.toFixed(1)}
          </span>
          <span className="text-xs font-medium text-amber-400/80">/ 10</span>
        </div>

        {descriptor && (
          <span
            className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${descriptor.badgeBg}`}
          >
            {descriptor.title} ({descriptor.subtitle})
          </span>
        )}
      </div>

      {/* Aspect Breakdown Cards */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-2.5 text-center">
          <p className="text-[11px] font-semibold text-slate-400">Gameplay</p>
          <p className="text-base sm:text-lg font-bold text-indigo-400 mt-0.5">
            {Number(review.ratingGameplay).toFixed(1)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-2.5 text-center">
          <p className="text-[11px] font-semibold text-slate-400">Story</p>
          <p className="text-base sm:text-lg font-bold text-purple-400 mt-0.5">
            {Number(review.ratingStory).toFixed(1)}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-2.5 text-center">
          <p className="text-[11px] font-semibold text-slate-400">Visual</p>
          <p className="text-base sm:text-lg font-bold text-cyan-400 mt-0.5">
            {Number(review.ratingVisual).toFixed(1)}
          </p>
        </div>
      </div>

      {/* Review Content */}
      {review.reviewText && (
        <div className="mt-3 rounded-xl border border-slate-800/60 bg-slate-950/30 p-3.5">
          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
            {review.reviewText}
          </p>
        </div>
      )}

      {/* Interaction Footer */}
      <div className="mt-4 flex items-center gap-2.5 pt-3 border-t border-slate-800/80 text-xs">
        <button
          type="button"
          onClick={() => onHelpful(review.id)}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-semibold transition-all duration-150 active:scale-95 ${
            review.isHelpfulByMe
              ? 'border-indigo-500/40 bg-indigo-600/20 text-indigo-300 shadow-sm shadow-indigo-500/10'
              : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
          }`}
        >
          <ThumbsUp
            className={`h-3.5 w-3.5 ${
              review.isHelpfulByMe ? 'fill-indigo-400 text-indigo-400' : ''
            }`}
          />
          <span>Membantu</span>
          {review.helpfulCount > 0 && (
            <span className="ml-0.5 rounded-full bg-slate-800 px-1.5 py-0.2 text-[10px] text-slate-300">
              {review.helpfulCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onDiscussion(review.id)}
          className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-800/40 px-3 py-1.5 font-semibold text-slate-400 transition-colors hover:border-slate-700 hover:text-slate-200"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Diskusi</span>
        </button>
      </div>
    </div>
  );
}

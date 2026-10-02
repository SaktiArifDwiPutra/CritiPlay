import { useNavigate } from 'react-router-dom';
import type { Review } from '../types';

interface ReviewCardProps {
  review: Review;
  onDelete: (reviewId: string) => void;
  onEdit: (review: Review) => void;
}

export default function ReviewCard({
  review,
  onDelete,
  onEdit
}: ReviewCardProps) {
  const navigate = useNavigate();

  const handleOpenProfile = () => {
    navigate(`/profile/${review.userId}`);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      {/* User + Date */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <div className="flex items-center gap-3">
            {/* User Profile */}
            <button
              type="button"
              onClick={handleOpenProfile}
              className="flex items-center gap-3 text-left group"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold overflow-hidden shrink-0">
            {review.avatar ? (
              <img
                src={review.avatar}
                alt={review.name}
                className="w-full h-full object-cover"
              />
            ) : (
              review.name?.charAt(0).toUpperCase() ?? 'U'
            )}
            </div>
              <div>
                <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                  {review.name}
                </p>

                <p className="text-sm text-slate-400">
                  {new Date(review.dateAdded).toLocaleDateString(
                    'id-ID',
                    {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }
                  )}
                </p>
              </div>
            </button>
          </div>

          {/* Overall */}
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-500">
              {Number(review.ratingOverall).toFixed(1)}
            </span>

            <span className="text-sm text-slate-400">
              / 10 Overall
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(review)}
            className="px-3 py-2 rounded-lg bg-blue-50 text-blue-600 text-sm font-semibold hover:bg-blue-100"
          >
            Edit
          </button>

          <button
            onClick={() => onDelete(review.id)}
            className="px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100"
          >
            Hapus
          </button>
        </div>
      </div>

      {/* Rating Detail */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-400 font-semibold mb-1">
            Gameplay
          </p>

          <p className="text-xl font-bold text-slate-800">
            {Number(review.ratingGameplay).toFixed(1)}
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-400 font-semibold mb-1">
            Story
          </p>

          <p className="text-xl font-bold text-slate-800">
            {Number(review.ratingStory).toFixed(1)}
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-400 font-semibold mb-1">
            Visual
          </p>

          <p className="text-xl font-bold text-slate-800">
            {Number(review.ratingVisual).toFixed(1)}
          </p>
        </div>
      </div>

      {/* Comment */}
      {review.reviewText && (
        <div className="border-t border-slate-100 pt-5">
          <p className="text-slate-600 leading-relaxed">
            {review.reviewText}
          </p>
        </div>
      )}
    </div>
  );
}
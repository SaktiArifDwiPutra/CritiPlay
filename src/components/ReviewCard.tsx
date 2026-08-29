import type { Review } from '../types';

// Mendefinisikan tipe data untuk props yang diterima komponen ini
interface ReviewCardProps {
  review: Review;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  // Helper untuk format tanggal biar rapi
  const formattedDate = new Date(review.dateAdded).toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  // Helper untuk warna badge status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'Playing': return 'bg-blue-100 text-blue-700';
      case 'Dropped': return 'bg-red-100 text-red-700';
      case 'Plan to Play': return 'bg-purple-100 text-purple-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className={`inline-block px-3 py-1 text-sm font-bold rounded-lg mb-2 ${getStatusColor(review.status)}`}>
            {review.status}
          </span>
          <p className="text-slate-400 text-sm">{formattedDate}</p>
        </div>
        
        <div className="bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shadow-md">
          {review.overallRating}
        </div>
      </div>
      
      <p className="text-slate-700 leading-relaxed mb-6">
        {review.content}
      </p>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-50">
        {review.aspectRatings.map((aspect) => (
          <div key={aspect.aspect} className="bg-slate-50 p-3 rounded-xl flex flex-col items-center">
            <span className="text-slate-500 text-xs uppercase font-semibold">{aspect.aspect}</span>
            <span className="text-slate-800 font-bold text-lg">{aspect.score}/10</span>
          </div>
        ))}
      </div>
    </div>
  );
}
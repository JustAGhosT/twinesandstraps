'use client';

import React, { useState } from 'react';

interface Review {
  id: number;
  author: string;
  rating: number;
  date: string;
  title: string;
  content: string;
  verified: boolean;
}

interface ProductReviewsProps {
  productId: number;
  productName: string;
}

// Sample reviews - in production, fetch from API/database
const sampleReviews: Review[] = [
  {
    id: 1,
    author: 'Johan M.',
    rating: 5,
    date: '2024-11-15',
    title: 'Excellent quality twine',
    content: 'This twine exceeded my expectations. Very strong and durable, perfect for our agricultural needs.',
    verified: true,
  },
  {
    id: 2,
    author: 'Sarah P.',
    rating: 4,
    date: '2024-10-28',
    title: 'Good product, fast delivery',
    content: 'The rope quality is great. Delivery was quick. Would have given 5 stars but packaging could be improved.',
    verified: true,
  },
  {
    id: 3,
    author: 'David K.',
    rating: 5,
    date: '2024-10-10',
    title: 'Best local supplier',
    content: 'Been using TASSA products for years. Consistent quality and great customer service.',
    verified: false,
  },
];

const StarRating: React.FC<{ rating: number; interactive?: boolean; onRate?: (rating: number) => void }> = ({
  rating,
  interactive = false,
  onRate,
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onRate?.(star)}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          className={`${interactive ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <svg
            className={`w-5 h-5 transition-colors ${
              star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
};

const ProductReviews: React.FC<ProductReviewsProps> = ({ productId, productName }) => {
  const [reviews] = useState<Review[]>(sampleReviews);
  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 0, title: '', content: '', author: '' });
  const [submitted, setSubmitted] = useState(false);

  const averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;
  const ratingCounts = [5, 4, 3, 2, 1].map(
    (rating) => reviews.filter((r) => r.rating === rating).length
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, send to API
    console.log('Review submitted for product', productId, ':', newReview);
    setSubmitted(true);
    setShowForm(false);
    setNewReview({ rating: 0, title: '', content: '', author: '' });
  };

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold text-secondary-900 mb-6">Customer Reviews</h3>

      {/* Rating Summary */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="text-center md:text-left">
            <div className="text-4xl font-bold text-secondary-900">{averageRating.toFixed(1)}</div>
            <StarRating rating={Math.round(averageRating)} />
            <p className="text-sm text-gray-500 mt-1">{reviews.length} reviews</p>
          </div>
          <div className="flex-1">
            {[5, 4, 3, 2, 1].map((rating, index) => (
              <div key={rating} className="flex items-center gap-2 mb-1">
                <span className="text-sm text-gray-600 w-8">{rating} star</span>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full"
                    style={{ width: `${(ratingCounts[index] / reviews.length) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500 w-8">{ratingCounts[index]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Write Review Button */}
      {!showForm && !submitted && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-6 px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          Write a Review
        </button>
      )}

      {submitted && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          Thank you for your review! It will be published after moderation.
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 bg-gray-50 rounded-lg p-6">
          <h4 className="font-semibold text-secondary-900 mb-4">Write a Review for {productName}</h4>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
            <StarRating
              rating={newReview.rating}
              interactive
              onRate={(rating) => setNewReview({ ...newReview, rating })}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
            <input
              type="text"
              value={newReview.author}
              onChange={(e) => setNewReview({ ...newReview, author: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Review Title</label>
            <input
              type="text"
              value={newReview.title}
              onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
            <textarea
              value={newReview.content}
              onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={newReview.rating === 0}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Review
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="border-b border-gray-200 pb-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <StarRating rating={review.rating} />
                  {review.verified && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      Verified Purchase
                    </span>
                  )}
                </div>
                <h4 className="font-semibold text-secondary-900 mt-1">{review.title}</h4>
              </div>
              <span className="text-sm text-gray-500">
                {new Date(review.date).toLocaleDateString('en-ZA', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <p className="text-gray-600 mb-2">{review.content}</p>
            <p className="text-sm text-gray-500">By {review.author}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductReviews;

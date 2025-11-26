'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Review {
  id: number;
  product_id: number | null;
  user_id: number | null;
  author_name: string;
  author_email: string | null;
  company: string | null;
  role: string | null;
  rating: number;
  title: string | null;
  content: string;
  status: string;
  verified_purchase: boolean;
  promoted_to_testimonial: boolean;
  admin_notes: string | null;
  created_at: string;
  product?: { id: number; name: string } | null;
  user?: { id: number; name: string; email: string } | null;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      
      const res = await fetch(`/api/admin/reviews?${params}`, {
        credentials: 'include',
      });
      
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const updateReview = async (id: number, updates: Record<string, unknown>) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const data = await res.json();
        setMessage({ type: 'success', text: data.message });
        fetchReviews();
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error });
      }
    } catch (err) {
      console.error('Error updating review:', err);
      setMessage({ type: 'error', text: 'Failed to update review' });
    } finally {
      setActionLoading(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const deleteReview = async (id: number) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Review deleted successfully' });
        fetchReviews();
      } else {
        setMessage({ type: 'error', text: 'Failed to delete review' });
      }
    } catch (err) {
      console.error('Error deleting review:', err);
      setMessage({ type: 'error', text: 'Failed to delete review' });
    } finally {
      setActionLoading(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded">Pending</span>;
      case 'APPROVED':
        return <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded">Approved</span>;
      case 'REJECTED':
        return <span className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded">Rejected</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Customer Reviews</h1>
          <p className="text-gray-500 mt-1">Manage and moderate customer feedback</p>
        </div>
        <Link
          href="/admin/testimonials"
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          View Testimonials
        </Link>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">All Reviews</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <p className="text-lg font-medium">No reviews found</p>
          <p className="text-sm">Customer reviews will appear here for moderation</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {renderStars(review.rating)}
                    {getStatusBadge(review.status)}
                    {review.verified_purchase && (
                      <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded">
                        Verified Purchase
                      </span>
                    )}
                    {review.promoted_to_testimonial && (
                      <span className="px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded">
                        Promoted to Testimonial
                      </span>
                    )}
                  </div>
                  
                  {review.title && (
                    <h3 className="font-semibold text-secondary-900 mb-1">{review.title}</h3>
                  )}
                  
                  <p className="text-gray-600 mb-3">&quot;{review.content}&quot;</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <span className="font-medium text-gray-700">{review.author_name}</span>
                    {review.company && <span>at {review.company}</span>}
                    {review.role && <span>• {review.role}</span>}
                    {review.product && (
                      <span className="text-primary-600">
                        Product: {review.product.name}
                      </span>
                    )}
                    <span>
                      {new Date(review.created_at).toLocaleDateString('en-ZA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 lg:flex-col">
                  {review.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => updateReview(review.id, { status: 'APPROVED' })}
                        disabled={actionLoading === review.id}
                        className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => updateReview(review.id, { status: 'REJECTED' })}
                        disabled={actionLoading === review.id}
                        className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  
                  {review.status === 'APPROVED' && !review.promoted_to_testimonial && (
                    <button
                      onClick={() => updateReview(review.id, { promoteToTestimonial: true })}
                      disabled={actionLoading === review.id}
                      className="px-3 py-1.5 text-sm font-medium text-purple-700 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
                    >
                      Promote to Testimonial
                    </button>
                  )}
                  
                  <button
                    onClick={() => deleteReview(review.id)}
                    disabled={actionLoading === review.id}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">About Customer Reviews</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Reviews submitted by customers are set to &quot;Pending&quot; and require approval</li>
          <li>• Approved reviews are displayed publicly on product pages</li>
          <li>• You can promote high-quality reviews to Testimonials for the homepage</li>
          <li>• Promoted testimonials can be managed in the <Link href="/admin/testimonials" className="underline">Testimonials</Link> section</li>
        </ul>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';

interface Testimonial {
  id: string;
  name: string;
  company: string;
  role: string;
  content: string;
  rating: number;
  featured: boolean;
}

const defaultTestimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Johan van der Berg',
    company: 'Van Berg Farms',
    role: 'Farm Manager',
    content: 'TASSA has been our go-to supplier for agricultural ropes. The quality is consistently excellent, and their delivery is always on time.',
    rating: 5,
    featured: true,
  },
  {
    id: '2',
    name: 'Sarah Nkosi',
    company: 'Cape Industrial Supplies',
    role: 'Procurement Manager',
    content: 'We switched to TASSA last year and haven\'t looked back. Their product range and competitive pricing make them stand out.',
    rating: 5,
    featured: true,
  },
  {
    id: '3',
    name: 'Mike Thompson',
    company: 'Thompson Marine Services',
    role: 'Operations Director',
    content: 'The marine-grade ropes from TASSA have exceeded our expectations. Excellent durability and the team\'s expertise is invaluable.',
    rating: 5,
    featured: true,
  },
];

const TESTIMONIALS_KEY = 'tassa_testimonials';

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(defaultTestimonials);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<Omit<Testimonial, 'id'>>({
    name: '',
    company: '',
    role: '',
    content: '',
    rating: 5,
    featured: false,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(TESTIMONIALS_KEY);
    if (stored) {
      try {
        setTestimonials(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading testimonials:', e);
      }
    }
  }, []);

  const saveTestimonials = (newTestimonials: Testimonial[]) => {
    setTestimonials(newTestimonials);
    localStorage.setItem(TESTIMONIALS_KEY, JSON.stringify(newTestimonials));
  };

  const startEdit = (testimonial: Testimonial) => {
    setEditingId(testimonial.id);
    setForm({
      name: testimonial.name,
      company: testimonial.company,
      role: testimonial.role,
      content: testimonial.content,
      rating: testimonial.rating,
      featured: testimonial.featured,
    });
    setShowNew(false);
  };

  const startNew = () => {
    setShowNew(true);
    setEditingId(null);
    setForm({
      name: '',
      company: '',
      role: '',
      content: '',
      rating: 5,
      featured: false,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowNew(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingId) {
      const updated = testimonials.map(t =>
        t.id === editingId ? { ...form, id: editingId } : t
      );
      saveTestimonials(updated);
    } else {
      const newTestimonial: Testimonial = {
        ...form,
        id: Date.now().toString(),
      };
      saveTestimonials([...testimonials, newTestimonial]);
    }

    cancelEdit();
  };

  const handleDelete = (id: string) => {
    saveTestimonials(testimonials.filter(t => t.id !== id));
    setDeleteConfirm(null);
  };

  const toggleFeatured = (id: string) => {
    const updated = testimonials.map(t =>
      t.id === id ? { ...t, featured: !t.featured } : t
    );
    saveTestimonials(updated);
  };

  const renderStars = (rating: number, onChange?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            className={`${onChange ? 'cursor-pointer' : 'cursor-default'}`}
            disabled={!onChange}
          >
            <svg
              className={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
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

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">Testimonials</h1>
          <p className="text-gray-500 mt-1">Manage customer testimonials displayed on your website</p>
        </div>
        <button
          onClick={startNew}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Testimonial
        </button>
      </div>

      {/* New/Edit Form */}
      {(showNew || editingId) && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">
            {editingId ? 'Edit Testimonial' : 'New Testimonial'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role/Title</label>
                <input
                  type="text"
                  value={form.role}
                  onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Testimonial Content *</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                required
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                {renderStars(form.rating, (rating) => setForm(prev => ({ ...prev, rating })))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  checked={form.featured}
                  onChange={(e) => setForm(prev => ({ ...prev, featured: e.target.checked }))}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="featured" className="text-sm text-gray-700">Featured on homepage</label>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                {editingId ? 'Save Changes' : 'Add Testimonial'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Testimonials List */}
      <div className="space-y-4">
        {testimonials.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
            No testimonials yet. Add your first testimonial above.
          </div>
        ) : (
          testimonials.map(testimonial => (
            <div key={testimonial.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-secondary-900">{testimonial.name}</h3>
                    {testimonial.featured && (
                      <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full">
                        Featured
                      </span>
                    )}
                  </div>
                  {(testimonial.company || testimonial.role) && (
                    <p className="text-sm text-gray-500 mb-2">
                      {testimonial.role}{testimonial.role && testimonial.company ? ' at ' : ''}{testimonial.company}
                    </p>
                  )}
                  <div className="mb-3">{renderStars(testimonial.rating)}</div>
                  <p className="text-gray-700 italic">&quot;{testimonial.content}&quot;</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => toggleFeatured(testimonial.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      testimonial.featured
                        ? 'text-primary-600 bg-primary-50 hover:bg-primary-100'
                        : 'text-gray-400 hover:text-primary-600 hover:bg-gray-100'
                    }`}
                    title={testimonial.featured ? 'Remove from featured' : 'Add to featured'}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => startEdit(testimonial)}
                    className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  {deleteConfirm === testimonial.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(testimonial.id)}
                        className="p-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        title="Confirm Delete"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Cancel"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(testimonial.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">Note</h3>
        <p className="text-sm text-blue-700">
          Testimonials marked as &quot;Featured&quot; will appear on the homepage. Changes are saved to browser storage for preview.
          For production use, these should be stored in the database.
        </p>
      </div>
    </div>
  );
}

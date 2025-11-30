'use client';

import React, { useState, useEffect } from 'react';

interface Testimonial {
  id: number;
  name: string;
  company: string;
  industry: string;
  quote: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Johan van der Merwe',
    company: 'Van der Merwe Boerdery',
    industry: 'Agriculture',
    quote: 'TASSA twines have been a game-changer for our hay baling operations. The UV resistance is exceptional - we\'ve seen much better durability compared to imported alternatives.',
    rating: 5,
  },
  {
    id: 2,
    name: 'Sipho Nkosi',
    company: 'Marine Supplies SA',
    industry: 'Marine & Boating',
    quote: 'We\'ve been using TASSA ropes for our commercial fishing clients for over 3 years. The quality is consistently excellent and their delivery is always on time.',
    rating: 5,
  },
  {
    id: 3,
    name: 'Michelle Potgieter',
    company: 'Potgieter Construction',
    industry: 'Construction',
    quote: 'The poly steel ropes from TASSA are perfect for our scaffolding and rigging needs. Great strength-to-weight ratio and the team is always helpful with custom orders.',
    rating: 5,
  },
  {
    id: 4,
    name: 'David Mokoena',
    company: 'Fresh Farms Logistics',
    industry: 'Transport & Logistics',
    quote: 'Reliable products at competitive prices. TASSA understands the needs of the logistics industry and their bulk pricing helps us keep costs down.',
    rating: 4,
  },
];

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <svg
        key={star}
        className={`w-5 h-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

const Testimonials: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleDotClick = (index: number) => {
    setActiveIndex(index);
    setIsAutoPlaying(false);
  };

  return (
    <section className="py-16 bg-gray-50 dark:bg-secondary-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-lg text-accent-500 max-w-2xl mx-auto">
            Trusted by businesses across South Africa for quality and reliability.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Testimonial Card */}
          <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-lg p-8 md:p-10 relative">
            <div className="absolute top-6 left-8 text-6xl text-primary-100 font-serif">&ldquo;</div>

            <div className="relative z-10">
              <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed mb-6 italic">
                {testimonials[activeIndex].quote}
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="font-bold text-secondary-900">{testimonials[activeIndex].name}</p>
                  <p className="text-sm text-accent-500">
                    {testimonials[activeIndex].company} • {testimonials[activeIndex].industry}
                  </p>
                </div>
                <StarRating rating={testimonials[activeIndex].rating} />
              </div>
            </div>
          </div>

          {/* Navigation Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === activeIndex
                    ? 'bg-primary-600 w-8'
                    : 'bg-gray-300 dark:bg-secondary-600 hover:bg-gray-400 dark:hover:bg-secondary-500'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>

          {/* Navigation Arrows */}
          <div className="flex justify-center gap-4 mt-4">
            <button
              onClick={() => {
                setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
                setIsAutoPlaying(false);
              }}
              className="p-2 rounded-full bg-gray-200 dark:bg-secondary-700 hover:bg-gray-300 dark:hover:bg-secondary-600 transition-colors"
              aria-label="Previous testimonial"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => {
                setActiveIndex((prev) => (prev + 1) % testimonials.length);
                setIsAutoPlaying(false);
              }}
              className="p-2 rounded-full bg-gray-200 dark:bg-secondary-700 hover:bg-gray-300 dark:hover:bg-secondary-600 transition-colors"
              aria-label="Next testimonial"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;

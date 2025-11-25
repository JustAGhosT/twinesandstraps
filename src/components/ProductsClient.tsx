'use client';

import React, { useState, useMemo } from 'react';
import type { Product, Category } from '@prisma/client';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';

type ProductWithCategory = Product & { category: Category };

interface ProductsClientProps {
  products: ProductWithCategory[];
  categories: Category[];
}

type SortOption = 'newest' | 'price-low' | 'price-high' | 'name-asc' | 'name-desc';

export default function ProductsClient({ products, categories }: ProductsClientProps) {
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const sortedProducts = useMemo(() => {
    const sorted = [...products];
    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-high':
        return sorted.sort((a, b) => b.price - a.price);
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case 'newest':
      default:
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [products, sortBy]);

  // Count products per category
  const categoryProductCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      if (p.category) {
        counts[p.category.slug] = (counts[p.category.slug] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="bg-primary-600 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Our Products</h1>
          <p className="text-white/80">
            Quality ropes, twines, and straps for every application. From industrial to agricultural use.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <nav className="mb-6 text-sm">
          <ol className="flex items-center space-x-2 text-gray-500">
            <li><Link href="/" className="hover:text-primary-600 transition-colors">Home</Link></li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 font-medium">Products</li>
          </ol>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-56 flex-shrink-0">
            <div className="sticky top-20 bg-white rounded-lg p-4 shadow-sm">
              {/* Categories */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  <h3 className="text-sm font-semibold text-gray-900">Categories</h3>
                </div>
                <ul className="space-y-1">
                  <li>
                    <Link 
                      href="/products" 
                      className="flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium text-primary-600 bg-primary-50"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                        All Products
                      </span>
                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">{products.length}</span>
                    </Link>
                  </li>
                  {categories.map((category) => (
                    <li key={category.id}>
                      <Link 
                        href={`/products?category=${category.slug}`}
                        className="flex items-center justify-between px-3 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                          {category.name}
                        </span>
                        <span className="text-xs text-gray-400">{categoryProductCounts[category.slug] || 0}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Divider */}
              <hr className="my-4 border-gray-200" />
              
              {/* Need Help Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Need Help?</h3>
                <p className="text-xs text-gray-500 mb-3">
                  Can&apos;t find what you&apos;re looking for? Request a custom quote.
                </p>
                <Link 
                  href="/quote"
                  className="block w-full text-center bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                >
                  Request Quote
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Header with count and sort */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{sortedProducts.length}</span> products available
              </p>
              
              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-sm text-gray-500">Sort by:</label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-3 py-1.5 border border-gray-200 rounded-md bg-white text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="name-desc">Name: Z to A</option>
                </select>
              </div>
            </div>
            
            {sortedProducts.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center shadow-sm">
                <p className="text-gray-500 mb-4">No products found.</p>
                <Link href="/" className="text-primary-600 hover:text-primary-700 font-medium">
                  Return to Home
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {sortedProducts.map((product) => (
                  <Link href={`/products/${product.id}`} key={product.id}>
                    <ProductCard product={product} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

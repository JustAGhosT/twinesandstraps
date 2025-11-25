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

  return (
    <div className="min-h-screen bg-rope-pattern bg-accent-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Products</h1>
          <p className="text-primary-100 text-lg max-w-2xl">
            Quality ropes, twines, and straps for every application. From industrial to agricultural use.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="mb-6 text-sm">
          <ol className="flex items-center space-x-2 text-accent-600">
            <li><Link href="/" className="hover:text-primary-600 transition-colors">Home</Link></li>
            <li className="text-accent-400">/</li>
            <li className="text-accent-900 font-semibold">Products</li>
          </ol>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8 border border-accent-100">
              <h3 className="text-xl font-bold text-accent-900 mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                Categories
              </h3>
              <ul className="space-y-1">
                <li>
                  <Link 
                    href="/products" 
                    className="flex items-center px-4 py-3 rounded-xl hover:bg-primary-50 transition-colors font-semibold text-primary-600 bg-primary-50 border border-primary-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    All Products
                    <span className="ml-auto bg-primary-100 text-primary-700 text-xs px-2 py-1 rounded-full">
                      {products.length}
                    </span>
                  </Link>
                </li>
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link 
                      href={`/products?category=${category.slug}`}
                      className="flex items-center px-4 py-3 rounded-xl hover:bg-accent-100 transition-colors text-accent-700 hover:text-accent-900"
                    >
                      <span className="w-2 h-2 rounded-full bg-primary-400 mr-3"></span>
                      {category.name}
                      <span className="ml-auto text-accent-400 text-sm">
                        {products.filter(p => p.category_id === category.id).length}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              
              <div className="mt-8 pt-6 border-t border-accent-200">
                <h3 className="text-lg font-bold text-accent-900 mb-4">Need Help?</h3>
                <p className="text-sm text-accent-600 mb-4">
                  Can&apos;t find what you&apos;re looking for? Request a custom quote.
                </p>
                <Link 
                  href="/quote"
                  className="block w-full text-center bg-primary-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-primary-600 transition-colors shadow-md hover:shadow-lg"
                >
                  Request Quote
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-xl p-4 shadow-sm border border-accent-100">
              <div className="text-accent-600">
                <span className="font-semibold text-accent-900">{sortedProducts.length}</span> products available
              </div>
              
              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-sm text-accent-600">Sort by:</label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-4 py-2 border border-accent-200 rounded-lg bg-white text-accent-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
              <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-accent-100">
                <div className="rope-icon w-24 h-24 mx-auto mb-4 opacity-30"></div>
                <p className="text-accent-600 mb-4 text-lg">No products found.</p>
                <Link href="/" className="text-primary-600 hover:text-primary-700 font-semibold">
                  Return to Home
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
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

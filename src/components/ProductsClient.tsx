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
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Calculate price range from products
  const maxPrice = useMemo(() => {
    return Math.ceil(Math.max(...products.map(p => p.price), 100));
  }, [products]);

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.material?.toLowerCase().includes(query) ||
        p.category?.name.toLowerCase().includes(query)
      );
    }
    
    // Price filter
    filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);
    
    // Sort
    switch (sortBy) {
      case 'price-low':
        return filtered.sort((a, b) => a.price - b.price);
      case 'price-high':
        return filtered.sort((a, b) => b.price - a.price);
      case 'name-asc':
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return filtered.sort((a, b) => b.name.localeCompare(a.name));
      case 'newest':
      default:
        return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [products, sortBy, searchQuery, priceRange]);

  return (
    <div className="min-h-screen bg-rope-pattern bg-accent-50">
      {/* Hero Section - more compact */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Our Products</h1>
          <p className="text-primary-100 text-sm md:text-base max-w-xl">
            Quality ropes, twines, and straps for every application.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <nav className="mb-4 text-sm">
          <ol className="flex items-center space-x-2 text-accent-600">
            <li><Link href="/" className="hover:text-primary-600 transition-colors">Home</Link></li>
            <li className="text-accent-400">/</li>
            <li className="text-accent-900 font-semibold">Products</li>
          </ol>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden flex items-center justify-center gap-2 bg-white border border-accent-200 rounded-lg px-4 py-2 text-accent-700"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </button>

          {/* Sidebar Filters - narrower */}
          <aside className={`lg:w-56 flex-shrink-0 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-xl shadow-sm p-4 sticky top-4 border border-accent-100">
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-accent-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <svg className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Categories */}
              <div className="mb-4">
                <h3 className="text-sm font-bold text-accent-900 mb-2">Categories</h3>
                <ul className="space-y-0.5">
                  <li>
                    <Link 
                      href="/products" 
                      className="flex items-center justify-between px-2 py-1.5 rounded-lg text-sm font-medium text-primary-600 bg-primary-50"
                    >
                      <span>All Products</span>
                      <span className="bg-primary-100 text-primary-700 text-xs px-1.5 py-0.5 rounded">
                        {products.length}
                      </span>
                    </Link>
                  </li>
                  {categories.map((category) => (
                    <li key={category.id}>
                      <Link 
                        href={`/products?category=${category.slug}`}
                        className="flex items-center justify-between px-2 py-1.5 rounded-lg text-sm text-accent-600 hover:bg-accent-50 transition-colors"
                      >
                        <span>{category.name}</span>
                        <span className="text-accent-400 text-xs">
                          {products.filter(p => p.category_id === category.id).length}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price Range Filter */}
              <div className="mb-4 pb-4 border-b border-accent-100">
                <h3 className="text-sm font-bold text-accent-900 mb-2">Price Range</h3>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max={maxPrice}
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full h-1.5 bg-accent-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
                  />
                  <div className="flex items-center justify-between text-xs text-accent-600">
                    <span>R0</span>
                    <span>R{priceRange[1]}</span>
                  </div>
                </div>
              </div>
              
              {/* Help Section */}
              <div>
                <h3 className="text-sm font-bold text-accent-900 mb-2">Need Help?</h3>
                <p className="text-xs text-accent-500 mb-2">
                  Can&apos;t find what you need?
                </p>
                <Link 
                  href="/quote"
                  className="block w-full text-center bg-primary-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
                >
                  Request Quote
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white rounded-lg p-3 shadow-sm border border-accent-100">
              <div className="text-sm text-accent-600">
                <span className="font-semibold text-accent-900">{filteredAndSortedProducts.length}</span> products
              </div>
              
              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-xs text-accent-500">Sort:</label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-2 py-1.5 border border-accent-200 rounded-lg bg-white text-accent-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low-High</option>
                  <option value="price-high">Price: High-Low</option>
                  <option value="name-asc">Name: A-Z</option>
                  <option value="name-desc">Name: Z-A</option>
                </select>
              </div>
            </div>
            
            {filteredAndSortedProducts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-accent-100">
                <div className="rope-icon w-16 h-16 mx-auto mb-3 opacity-30"></div>
                <p className="text-accent-600 mb-3">No products found.</p>
                <button 
                  onClick={() => { setSearchQuery(''); setPriceRange([0, maxPrice]); }}
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredAndSortedProducts.map((product) => (
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

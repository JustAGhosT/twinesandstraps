'use client';

import React, { useState, useMemo } from 'react';
import type { Product, Category } from '@prisma/client';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type ProductWithCategory = Product & { category: Category };

interface ProductsClientProps {
  products: ProductWithCategory[];
  categories: Category[];
}

type SortOption = 'newest' | 'price-low' | 'price-high' | 'name-asc' | 'name-desc';

export default function ProductsClient({ products, categories }: ProductsClientProps) {
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [materialFilter, setMaterialFilter] = useState<string>('');
  const [diameterRange, setDiameterRange] = useState<{ min: number; max: number }>({ min: 0, max: 100 });
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 10000 });
  const [showFilters, setShowFilters] = useState(false);
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const categoryFilter = searchParams.get('category') || '';

  // Get unique materials from products
  const uniqueMaterials = useMemo(() => {
    const materials = new Set<string>();
    products.forEach(p => {
      if (p.material) materials.add(p.material);
    });
    return Array.from(materials).sort();
  }, [products]);

  // Get price and diameter ranges from products
  const priceStats = useMemo(() => {
    const prices = products.map(p => p.price);
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices))
    };
  }, [products]);

  const diameterStats = useMemo(() => {
    const diameters = products.filter(p => p.diameter).map(p => p.diameter as number);
    if (diameters.length === 0) return { min: 0, max: 100 };
    return {
      min: Math.floor(Math.min(...diameters)),
      max: Math.ceil(Math.max(...diameters))
    };
  }, [products]);

  // Initialize ranges on first render
  React.useEffect(() => {
    setPriceRange({ min: priceStats.min, max: priceStats.max });
    setDiameterRange({ min: diameterStats.min, max: diameterStats.max });
  }, [priceStats, diameterStats]);

  const clearAllFilters = () => {
    setMaterialFilter('');
    setPriceRange({ min: priceStats.min, max: priceStats.max });
    setDiameterRange({ min: diameterStats.min, max: diameterStats.max });
  };

  const hasActiveFilters = materialFilter ||
    priceRange.min > priceStats.min ||
    priceRange.max < priceStats.max ||
    diameterRange.min > diameterStats.min ||
    diameterRange.max < diameterStats.max;

  // Filter products by all criteria
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        (product.material && product.material.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (categoryFilter) {
      filtered = filtered.filter(product =>
        product.category?.slug === categoryFilter
      );
    }

    // Filter by material
    if (materialFilter) {
      filtered = filtered.filter(product =>
        product.material === materialFilter
      );
    }

    // Filter by price range
    filtered = filtered.filter(product =>
      product.price >= priceRange.min && product.price <= priceRange.max
    );

    // Filter by diameter range
    filtered = filtered.filter(product => {
      if (!product.diameter) return true; // Include products without diameter
      return product.diameter >= diameterRange.min && product.diameter <= diameterRange.max;
    });

    return filtered;
  }, [products, searchQuery, categoryFilter, materialFilter, priceRange, diameterRange]);

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
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
  }, [filteredProducts, sortBy]);

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
          <h1 className="text-3xl font-bold mb-2">
            {searchQuery ? `Search Results for "${searchQuery}"` : 'Our Products'}
          </h1>
          <p className="text-white/80">
            {searchQuery
              ? `Found ${sortedProducts.length} product${sortedProducts.length !== 1 ? 's' : ''} matching your search.`
              : 'Quality ropes, twines, and straps for every application. From industrial to agricultural use.'
            }
          </p>
          {searchQuery && (
            <Link href="/products" className="inline-block mt-3 text-sm bg-white/20 hover:bg-white/30 px-4 py-1.5 rounded-full transition-colors">
              Clear search
            </Link>
          )}
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
                      className={`flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        !categoryFilter && !searchQuery
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${!categoryFilter && !searchQuery ? 'bg-primary-500' : 'bg-gray-400'}`}></span>
                        All Products
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${!categoryFilter && !searchQuery ? 'bg-primary-100 text-primary-700' : 'text-gray-400'}`}>{products.length}</span>
                    </Link>
                  </li>
                  {categories.map((category) => (
                    <li key={category.id}>
                      <Link
                        href={`/products?category=${category.slug}`}
                        className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                          categoryFilter === category.slug
                            ? 'text-primary-600 bg-primary-50 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${categoryFilter === category.slug ? 'bg-primary-500' : 'bg-gray-400'}`}></span>
                          {category.name}
                        </span>
                        <span className={`text-xs ${categoryFilter === category.slug ? 'bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full' : 'text-gray-400'}`}>{categoryProductCounts[category.slug] || 0}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Divider */}
              <hr className="my-4 border-gray-200" />

              {/* Filters Toggle (Mobile) */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-sm font-medium text-gray-700 mb-4"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filters
                  {hasActiveFilters && <span className="w-2 h-2 bg-primary-500 rounded-full" />}
                </span>
                <svg className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Filters Section */}
              <div className={`space-y-4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                {/* Clear Filters */}
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear all filters
                  </button>
                )}

                {/* Material Filter */}
                {uniqueMaterials.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Material</h4>
                    <select
                      value={materialFilter}
                      onChange={(e) => setMaterialFilter(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">All Materials</option>
                      {uniqueMaterials.map(material => (
                        <option key={material} value={material}>{material}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Price Range Filter */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Price Range (R)</h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                      min={priceStats.min}
                      max={priceRange.max}
                      className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-primary-500"
                      placeholder="Min"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="number"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                      min={priceRange.min}
                      max={priceStats.max}
                      className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-primary-500"
                      placeholder="Max"
                    />
                  </div>
                </div>

                {/* Diameter Range Filter */}
                {diameterStats.max > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Diameter (mm)</h4>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={diameterRange.min}
                        onChange={(e) => setDiameterRange({ ...diameterRange, min: Number(e.target.value) })}
                        min={diameterStats.min}
                        max={diameterRange.max}
                        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-primary-500"
                        placeholder="Min"
                      />
                      <span className="text-gray-400">-</span>
                      <input
                        type="number"
                        value={diameterRange.max}
                        onChange={(e) => setDiameterRange({ ...diameterRange, max: Number(e.target.value) })}
                        min={diameterRange.min}
                        max={diameterStats.max}
                        className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-primary-500"
                        placeholder="Max"
                      />
                    </div>
                  </div>
                )}
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

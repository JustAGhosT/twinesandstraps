import React from 'react';
import prisma from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';

// Force dynamic rendering - data is fetched at request time
export const dynamic = 'force-dynamic';

async function getProducts() {
  const products = await prisma.product.findMany({
    include: {
      category: true,
    },
    orderBy: {
      created_at: 'desc',
    },
  });
  return products;
}

async function getCategories() {
  const categories = await prisma.category.findMany({
    where: {
      parent_id: null,
    },
  });
  return categories;
}

export default async function ProductListPage() {
  const products = await getProducts();
  const categories = await getCategories();

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumbs */}
        <nav className="mb-6 text-sm">
          <ol className="flex items-center space-x-2 text-gray-600">
            <li><Link href="/" className="hover:text-gray-900">Home</Link></li>
            <li>/</li>
            <li className="text-gray-900 font-semibold">Products</li>
          </ol>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h3 className="text-lg font-semibold mb-4">Categories</h3>
              <ul className="space-y-2">
                <li>
                  <Link 
                    href="/products" 
                    className="block px-3 py-2 rounded hover:bg-gray-100 transition-colors font-semibold text-blue-600"
                  >
                    All Products
                  </Link>
                </li>
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link 
                      href={`/products?category=${category.slug}`}
                      className="block px-3 py-2 rounded hover:bg-gray-100 transition-colors"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
              
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-semibold mb-4">Need Help?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Can&apos;t find what you&apos;re looking for? Request a custom quote.
                </p>
                <Link 
                  href="/quote"
                  className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Request Quote
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-2">Our Products</h1>
                <p className="text-gray-600">{products.length} products available</p>
              </div>
            </div>
            
            {products.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <p className="text-gray-600 mb-4">No products found.</p>
                <Link href="/" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Return to Home
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product) => (
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

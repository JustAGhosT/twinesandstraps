import Link from 'next/link';
import prisma from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';

// Force dynamic rendering - data is fetched at request time
export const dynamic = 'force-dynamic';

async function getFeaturedProducts() {
  const products = await prisma.product.findMany({
    take: 3,
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

export default async function Home() {
  const featuredProducts = await getFeaturedProducts();
  const categories = await getCategories();

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-secondary-900 via-primary-600 to-secondary-900 text-white py-20 overflow-hidden">
        {/* Diagonal pattern overlay */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute h-full w-16 bg-black transform -skew-x-12"
              style={{ left: `${i * 14}%`, opacity: 0.3 }}
            />
          ))}
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Boundless Strength, Endless Solutions!
            </h1>
            <p className="text-xl mb-8 text-gray-200">
              Proudly South African manufacturer and supplier of quality ropes, twines, and straps. 
              From natural fiber to synthetic ropes, we have you covered.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/products" 
                className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-center"
              >
                Browse Products
              </Link>
              <Link 
                href="/quote" 
                className="bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-800 transition-colors border border-primary-500 text-center"
              >
                Request a Quote
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Values Section */}
      <section className="py-12 bg-warm-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center">
              <span className="text-3xl mb-2">🏭</span>
              <h3 className="font-semibold text-secondary-900">Local Manufacturing</h3>
              <p className="text-sm text-accent-500">Proudly South African</p>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl mb-2">💪</span>
              <h3 className="font-semibold text-secondary-900">Boundless Strength</h3>
              <p className="text-sm text-accent-500">Built to last</p>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl mb-2">☀️</span>
              <h3 className="font-semibold text-secondary-900">UV Resistant</h3>
              <p className="text-sm text-accent-500">Climate tough</p>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-3xl mb-2">🎯</span>
              <h3 className="font-semibold text-secondary-900">Customization</h3>
              <p className="text-sm text-accent-500">Tailored solutions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center text-secondary-900">Shop by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {categories.map((category) => (
              <Link 
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center border-l-4 border-primary-600"
              >
                <h3 className="text-xl font-semibold mb-2 text-secondary-900">{category.name}</h3>
                <p className="text-primary-600 hover:text-primary-700">Browse products →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-secondary-900">Featured Products</h2>
            <Link href="/products" className="text-primary-600 hover:text-primary-700 font-semibold">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <Link href={`/products/${product.id}`} key={product.id}>
                <ProductCard product={product} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* B2B Section */}
      <section className="py-16 bg-gradient-to-r from-secondary-900 to-primary-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Business Buyer?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Get competitive bulk pricing with our streamlined quote process. 
            Contact us directly via WhatsApp for personalized quotes and business support.
          </p>
          <Link 
            href="/quote" 
            className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Request a Business Quote
          </Link>
        </div>
      </section>
    </>
  );
}

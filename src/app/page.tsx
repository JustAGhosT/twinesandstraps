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
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Quality Ropes & Straps for Every Need
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Trusted supplier for retail and business customers across South Africa. 
              From natural fiber to synthetic ropes, we have you covered.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/products" 
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-center"
              >
                Shop Products
              </Link>
              <Link 
                href="/quote" 
                className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors border border-blue-500 text-center"
              >
                Request a Quote
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Shop by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {categories.map((category) => (
              <Link 
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
              >
                <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                <p className="text-blue-600 hover:text-blue-700">Browse products →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Featured Products</h2>
            <Link href="/products" className="text-blue-600 hover:text-blue-700 font-semibold">
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
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Business Buyer?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Get competitive bulk pricing with our streamlined quote process. 
            Receive detailed quotations with VAT compliance for your business needs.
          </p>
          <Link 
            href="/quote" 
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Request a Business Quote
          </Link>
        </div>
      </section>
    </>
  );
}

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
      <section className="relative bg-gradient-to-r from-secondary-900 via-primary-600 to-secondary-900 text-white py-24 overflow-hidden">
        {/* Diagonal pattern overlay */}
        <div className="absolute inset-0 opacity-20">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute h-full w-20 bg-black transform -skew-x-12"
              style={{ left: `${i * 12}%`, opacity: 0.3 }}
            />
          ))}
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <span className="text-sm font-medium">🇿🇦 Proudly South African Since 2016</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Boundless Strength,<br />
                <span className="text-primary-300">Endless Solutions!</span>
              </h1>
              <p className="text-xl mb-8 text-gray-200 leading-relaxed">
                Leading local manufacturer specializing in high-quality twines and ropes. 
                Our carefully selected manufacturing equipment ensures consistency, durability, and excellence in every roll.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/products" 
                  className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-center shadow-lg hover:shadow-xl"
                >
                  Browse Products
                </Link>
                <Link 
                  href="/quote" 
                  className="bg-primary-700 text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary-800 transition-colors border border-primary-500 text-center"
                >
                  Request a Quote
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative">
                <div className="w-72 h-72 mx-auto rounded-full border-4 border-white/20 flex items-center justify-center bg-white/5 backdrop-blur-sm">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-white">70+</div>
                    <div className="text-lg text-gray-300 mt-2">Years Combined<br />Industry Experience</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">Why Choose TASSA?</h2>
            <p className="text-lg text-accent-500 max-w-2xl mx-auto">
              Strict quality control and decades of experience ensure superior products every time.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-gray-50 p-6 rounded-xl border-l-4 border-primary-600 hover:shadow-lg transition-shadow">
              <div className="text-primary-600 text-2xl mb-3">✓</div>
              <h3 className="font-bold text-secondary-900 mb-2">Premium Quality</h3>
              <p className="text-sm text-accent-500">Strict quality control ensures superior products.</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl border-l-4 border-primary-600 hover:shadow-lg transition-shadow">
              <div className="text-primary-600 text-2xl mb-3">✓</div>
              <h3 className="font-bold text-secondary-900 mb-2">Customization Available</h3>
              <p className="text-sm text-accent-500">We tailor solutions to meet specific customer needs.</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl border-l-4 border-primary-600 hover:shadow-lg transition-shadow">
              <div className="text-primary-600 text-2xl mb-3">✓</div>
              <h3 className="font-bold text-secondary-900 mb-2">Reliable Supply Chain</h3>
              <p className="text-sm text-accent-500">Consistent and timely delivery.</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl border-l-4 border-primary-600 hover:shadow-lg transition-shadow">
              <div className="text-primary-600 text-2xl mb-3">✓</div>
              <h3 className="font-bold text-secondary-900 mb-2">Proudly South African</h3>
              <p className="text-sm text-accent-500">Supporting local manufacturing and job creation.</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl border-l-4 border-primary-600 hover:shadow-lg transition-shadow">
              <div className="text-primary-600 text-2xl mb-3">✓</div>
              <h3 className="font-bold text-secondary-900 mb-2">Climate & UV Resistant</h3>
              <p className="text-sm text-accent-500">Built to last in harsh conditions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-6">About TASSA</h2>
              <div className="space-y-4 text-accent-600">
                <p className="leading-relaxed">
                  <strong className="text-secondary-900">Twines and Straps SA (TASSA)</strong> is a leading local manufacturer 
                  specializing in the production of high-quality twines and ropes. Founded in 2016, we have steadily grown 
                  into a full-scale production facility, dedicated to providing premium products.
                </p>
                <p className="leading-relaxed">
                  Our carefully selected manufacturing equipment ensures <strong className="text-secondary-900">consistency, 
                  durability, and excellence</strong> in every roll.
                </p>
              </div>
              <div className="mt-8">
                <Link 
                  href="/about" 
                  className="inline-flex items-center gap-2 text-primary-600 font-semibold hover:text-primary-700"
                >
                  Learn more about us →
                </Link>
              </div>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-secondary-900 mb-6 border-b pb-4">Our Expertise</h3>
              <p className="text-accent-600 leading-relaxed">
                At TASSA, we pride ourselves on our highly skilled and motivated workforce. Our management and advisory team 
                collectively boast over <strong className="text-secondary-900">70 years of experience</strong> in manufacturing 
                and the plastics industry.
              </p>
              <p className="text-accent-600 leading-relaxed mt-4">
                Through continuous research and development, we have perfected a proprietary manufacturing process, allowing us 
                to produce some of the <strong className="text-secondary-900">highest-quality twines and ropes in South Africa</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Customers Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 mb-4">Our Commitment to Customers</h2>
          <p className="text-lg text-accent-500 max-w-3xl mx-auto mb-8">
            We are committed to <strong className="text-secondary-900">customer satisfaction</strong>, ensuring our products 
            consistently meet your expectations. We work closely with clients across various industries, tailoring solutions 
            to specific requirements.
          </p>
          <div className="bg-primary-600 text-white py-4 px-8 rounded-lg inline-block">
            <span className="text-xl font-bold">Your trust is our priority!</span>
          </div>
        </div>
      </section>

      {/* Brand Values Section */}
      <section className="py-12 bg-warm-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow-sm">
              <span className="text-4xl mb-3">🏭</span>
              <h3 className="font-bold text-secondary-900">Local Manufacturing</h3>
              <p className="text-sm text-accent-500 mt-1">Proudly South African</p>
            </div>
            <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow-sm">
              <span className="text-4xl mb-3">💪</span>
              <h3 className="font-bold text-secondary-900">Boundless Strength</h3>
              <p className="text-sm text-accent-500 mt-1">Built to last</p>
            </div>
            <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow-sm">
              <span className="text-4xl mb-3">☀️</span>
              <h3 className="font-bold text-secondary-900">UV Resistant</h3>
              <p className="text-sm text-accent-500 mt-1">Climate tough</p>
            </div>
            <div className="flex flex-col items-center bg-white p-6 rounded-xl shadow-sm">
              <span className="text-4xl mb-3">🎯</span>
              <h3 className="font-bold text-secondary-900">Customization</h3>
              <p className="text-sm text-accent-500 mt-1">Tailored solutions</p>
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
                className="bg-white p-8 rounded-xl shadow-sm hover:shadow-lg transition-all text-center border-l-4 border-primary-600 group"
              >
                <h3 className="text-xl font-semibold mb-2 text-secondary-900 group-hover:text-primary-600 transition-colors">{category.name}</h3>
                <p className="text-primary-600 hover:text-primary-700">Browse products →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-white">
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

      {/* Product Info Banner */}
      <section className="py-12 bg-secondary-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-4">Our Products</h3>
              <p className="text-gray-300 leading-relaxed">
                <strong className="text-white">Polypropylene and Poly Steel Ropes</strong> available in 4mm–10mm, in various colors. 
                Rolls available up to 25 kg without splices, but can be made up to 100 kg with splices.
              </p>
              <p className="text-gray-300 leading-relaxed mt-4">
                Ideal for <strong className="text-white">borehole use, marine and boating, agriculture and farming, transport and logistics, 
                construction and scaffolding, rigging and hoisting, temporary fencing and barriers</strong>, as well as tying, pulling, lifting, 
                and securing loads.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 inline-block">
                <p className="text-lg mb-2">Twine Rolls available in</p>
                <p className="text-3xl font-bold text-primary-400">2kg, 5kg, 10kg, and 20kg sizes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* B2B Section */}
      <section className="py-16 bg-gradient-to-r from-secondary-900 to-primary-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Business Buyer?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Get competitive bulk pricing with our streamlined quote process. 
            Contact us directly for personalized quotes and business support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/quote" 
              className="inline-block bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Request a Business Quote
            </Link>
            <Link 
              href="/contact" 
              className="inline-block bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/20 transition-colors border border-white/20"
            >
              Contact Our Team
            </Link>
          </div>
        </div>
      </section>

      {/* Terms Note */}
      <section className="py-6 bg-gray-100 border-t">
        <div className="container mx-auto px-4 text-center text-sm text-accent-500">
          <p>Approximate measurements apply. Anti-static options available. Terms & Conditions Apply. Prices are subject to change and exclude VAT.</p>
        </div>
      </section>
    </>
  );
}

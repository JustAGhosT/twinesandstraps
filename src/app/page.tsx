import Link from 'next/link';
import Image from 'next/image';
import prisma from '@/lib/prisma';
import ProductCard from '@/components/ProductCard';
import Testimonials from '@/components/Testimonials';
import TrustBadges from '@/components/TrustBadges';
import { featureFlags } from '@/config/featureFlags';
import type { Product, Category } from '@/types/database';

import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

// Force dynamic rendering - data is fetched at request time
export const dynamic = 'force-dynamic';

async function getFeaturedProducts() {
  try {
    const products = await prisma.product.findMany({
      take: 3,
      orderBy: {
        created_at: 'desc',
      },
    });
    return products;
  } catch (error) {
    logError('Failed to fetch featured products:', error);
    return [];
  }
}

async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      where: {
        parent_id: null,
      },
    });
    return categories;
  } catch (error) {
    logError('Failed to fetch categories:', error);
    return [];
  }
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
      <section className="py-16 bg-white dark:bg-secondary-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-4">Why Choose TASSA?</h2>
            <p className="text-lg text-accent-500 dark:text-gray-400 max-w-2xl mx-auto">
              Strict quality control and decades of experience ensure superior products every time.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-gray-50 dark:bg-secondary-800 p-6 rounded-xl border-l-4 border-primary-600 hover:shadow-lg transition-shadow">
              <div className="text-primary-600 dark:text-primary-500 text-2xl mb-3">✓</div>
              <h3 className="font-bold text-secondary-900 dark:text-white mb-2">Premium Quality</h3>
              <p className="text-sm text-accent-500 dark:text-gray-400">Strict quality control ensures superior products.</p>
            </div>
            <div className="bg-gray-50 dark:bg-secondary-800 p-6 rounded-xl border-l-4 border-primary-600 hover:shadow-lg transition-shadow">
              <div className="text-primary-600 dark:text-primary-500 text-2xl mb-3">✓</div>
              <h3 className="font-bold text-secondary-900 dark:text-white mb-2">Customization Available</h3>
              <p className="text-sm text-accent-500 dark:text-gray-400">We tailor solutions to meet specific customer needs.</p>
            </div>
            <div className="bg-gray-50 dark:bg-secondary-800 p-6 rounded-xl border-l-4 border-primary-600 hover:shadow-lg transition-shadow">
              <div className="text-primary-600 dark:text-primary-500 text-2xl mb-3">✓</div>
              <h3 className="font-bold text-secondary-900 dark:text-white mb-2">Reliable Supply Chain</h3>
              <p className="text-sm text-accent-500 dark:text-gray-400">Consistent and timely delivery.</p>
            </div>
            <div className="bg-gray-50 dark:bg-secondary-800 p-6 rounded-xl border-l-4 border-primary-600 hover:shadow-lg transition-shadow">
              <div className="text-primary-600 dark:text-primary-500 text-2xl mb-3">✓</div>
              <h3 className="font-bold text-secondary-900 dark:text-white mb-2">Proudly South African</h3>
              <p className="text-sm text-accent-500 dark:text-gray-400">Supporting local manufacturing and job creation.</p>
            </div>
            <div className="bg-gray-50 dark:bg-secondary-800 p-6 rounded-xl border-l-4 border-primary-600 hover:shadow-lg transition-shadow">
              <div className="text-primary-600 dark:text-primary-500 text-2xl mb-3">✓</div>
              <h3 className="font-bold text-secondary-900 dark:text-white mb-2">Climate & UV Resistant</h3>
              <p className="text-sm text-accent-500 dark:text-gray-400">Built to last in harsh conditions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-gray-50 dark:bg-secondary-800">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-6">About TASSA</h2>
              <div className="space-y-4 text-accent-600 dark:text-gray-300">
                <p className="leading-relaxed">
                  <strong className="text-secondary-900 dark:text-white">Twines and Straps SA (TASSA)</strong> is a leading local manufacturer
                  specializing in the production of high-quality twines and ropes. Founded in 2016, we have steadily grown
                  into a full-scale production facility, dedicated to providing premium products.
                </p>
                <p className="leading-relaxed">
                  Our carefully selected manufacturing equipment ensures <strong className="text-secondary-900 dark:text-white">consistency,
                  durability, and excellence</strong> in every roll.
                </p>
              </div>
              <div className="mt-8">
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-500 font-semibold hover:text-primary-700 dark:hover:text-primary-400"
                >
                  Learn more about us →
                </Link>
              </div>
            </div>
            <div className="bg-white dark:bg-secondary-900 p-8 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-6 border-b border-gray-200 dark:border-secondary-700 pb-4">Our Expertise</h3>
              <p className="text-accent-600 dark:text-gray-300 leading-relaxed">
                At TASSA, we pride ourselves on our highly skilled and motivated workforce. Our management and advisory team
                collectively boast over <strong className="text-secondary-900 dark:text-white">70 years of experience</strong> in manufacturing
                and the plastics industry.
              </p>
              <p className="text-accent-600 dark:text-gray-300 leading-relaxed mt-4">
                Through continuous research and development, we have perfected a proprietary manufacturing process, allowing us
                to produce some of the <strong className="text-secondary-900 dark:text-white">highest-quality twines and ropes in South Africa</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      {featureFlags.trustBadges && <TrustBadges />}

      {/* Our Customers Section */}
      <section className="py-16 bg-white dark:bg-secondary-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary-900 dark:text-white mb-4">Our Commitment to Customers</h2>
          <p className="text-lg text-accent-500 dark:text-gray-400 max-w-3xl mx-auto mb-8">
            We are committed to <strong className="text-secondary-900 dark:text-white">customer satisfaction</strong>, ensuring our products
            consistently meet your expectations. We work closely with clients across various industries, tailoring solutions
            to specific requirements.
          </p>
          <div className="bg-primary-600 text-white py-4 px-8 rounded-lg inline-block">
            <span className="text-xl font-bold">Your trust is our priority!</span>
          </div>
        </div>
      </section>

      {/* Brand Values Section */}
      <section className="py-12 bg-warm-100 dark:bg-secondary-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center bg-white dark:bg-secondary-900 p-6 rounded-xl shadow-sm">
              <span className="text-4xl mb-3">🏭</span>
              <h3 className="font-bold text-secondary-900 dark:text-white">Local Manufacturing</h3>
              <p className="text-sm text-accent-500 dark:text-gray-400 mt-1">Proudly South African</p>
            </div>
            <div className="flex flex-col items-center bg-white dark:bg-secondary-900 p-6 rounded-xl shadow-sm">
              <span className="text-4xl mb-3">💪</span>
              <h3 className="font-bold text-secondary-900 dark:text-white">Boundless Strength</h3>
              <p className="text-sm text-accent-500 dark:text-gray-400 mt-1">Built to last</p>
            </div>
            <div className="flex flex-col items-center bg-white dark:bg-secondary-900 p-6 rounded-xl shadow-sm">
              <span className="text-4xl mb-3">☀️</span>
              <h3 className="font-bold text-secondary-900 dark:text-white">UV Resistant</h3>
              <p className="text-sm text-accent-500 dark:text-gray-400 mt-1">Climate tough</p>
            </div>
            <div className="flex flex-col items-center bg-white dark:bg-secondary-900 p-6 rounded-xl shadow-sm">
              <span className="text-4xl mb-3">🎯</span>
              <h3 className="font-bold text-secondary-900 dark:text-white">Customization</h3>
              <p className="text-sm text-accent-500 dark:text-gray-400 mt-1">Tailored solutions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50 dark:bg-secondary-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center text-secondary-900 dark:text-white">Shop by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {categories.map((category: Category) => {
              // Category-specific images and icons
              const categoryData: Record<string, { image: string; icon: string; description: string }> = {
                'twines': {
                  image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
                  icon: '🧵',
                  description: 'High-quality twines for agricultural and industrial use'
                },
                'ropes': {
                  image: 'https://images.unsplash.com/photo-1504280645497-4a3adfe6ade0?w=400&h=300&fit=crop',
                  icon: '🪢',
                  description: 'Durable ropes for all applications'
                },
                'nets': {
                  image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=300&fit=crop',
                  icon: '🥅',
                  description: 'Cargo, safety, and sports nets for every need'
                },
                'accessories': {
                  image: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400&h=300&fit=crop',
                  icon: '🔗',
                  description: 'Hooks, shackles, connectors, and tensioners'
                }
              };
              const data = categoryData[category.slug] || {
                image: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400&h=300&fit=crop',
                icon: '📦',
                description: 'Quality products for your needs'
              };

              return (
                <Link
                  key={category.id}
                  href={`/products?category=${category.slug}`}
                  className="bg-white dark:bg-secondary-900 rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden group"
                >
                  <div className="relative h-40 bg-gray-200 dark:bg-secondary-700 overflow-hidden">
                    <Image
                      src={data.image}
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <span className="text-2xl mb-1 block">{data.icon}</span>
                      <h3 className="text-xl font-bold text-white">{category.name}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{data.description}</p>
                    <span className="text-primary-600 dark:text-primary-500 font-medium text-sm group-hover:text-primary-700 dark:group-hover:text-primary-400 inline-flex items-center gap-1">
                      Browse products
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-white dark:bg-secondary-900">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-secondary-900 dark:text-white">Featured Products</h2>
            <Link href="/products" className="text-primary-600 dark:text-primary-500 hover:text-primary-700 dark:hover:text-primary-400 font-semibold">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {featuredProducts.map((product: Product) => (
              <Link href={`/products/${(product as any).slug || product.id}`} key={product.id}>
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

      {/* Customer Testimonials */}
      {featureFlags.testimonials && <Testimonials />}

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
      <section className="py-6 bg-gray-100 dark:bg-secondary-800 border-t border-gray-200 dark:border-secondary-700">
        <div className="container mx-auto px-4 text-center text-sm text-accent-500 dark:text-gray-400">
          <p>Approximate measurements apply. Anti-static options available. Terms & Conditions Apply. Prices are subject to change and exclude VAT.</p>
        </div>
      </section>
    </>
  );
}

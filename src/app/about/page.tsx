import Link from 'next/link';

export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-secondary-900 via-primary-600 to-secondary-900 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute h-full w-20 bg-black transform -skew-x-12"
              style={{ left: `${i * 12}%`, opacity: 0.3 }}
            />
          ))}
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About TASSA</h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Twines and Straps SA (Pty) Ltd - Proudly South African Manufacturer of Twines and Ropes
          </p>
        </div>
      </section>

      {/* About Us */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="border-l-4 border-primary-600 pl-6 mb-12">
              <h2 className="text-3xl font-bold text-secondary-900 mb-6">About Us</h2>
              <p className="text-lg text-accent-600 leading-relaxed">
                Twines and Straps SA (TASSA) is a leading local manufacturer specializing in the production of high-quality 
                twines and ropes. Founded in 2016, we have steadily grown into a full-scale production facility, dedicated 
                to providing premium products. Our carefully selected manufacturing equipment ensures consistency, durability, 
                and excellence in every roll.
              </p>
            </div>

            <div className="border-l-4 border-primary-600 pl-6 mb-12">
              <h2 className="text-3xl font-bold text-secondary-900 mb-6">Our Expertise</h2>
              <p className="text-lg text-accent-600 leading-relaxed mb-4">
                At TASSA, we pride ourselves on our highly skilled and motivated workforce. Our management and advisory team 
                collectively boast over <strong className="text-secondary-900">70 years of experience</strong> in manufacturing 
                and the plastics industry.
              </p>
              <p className="text-lg text-accent-600 leading-relaxed">
                Through continuous research and development, we have perfected a proprietary manufacturing process, allowing us 
                to produce some of the <strong className="text-secondary-900">highest-quality twines and ropes in South Africa</strong>.
              </p>
            </div>

            <div className="border-l-4 border-primary-600 pl-6 mb-12">
              <h2 className="text-3xl font-bold text-secondary-900 mb-6">Our Customers</h2>
              <p className="text-lg text-accent-600 leading-relaxed mb-4">
                We are committed to <strong className="text-secondary-900">customer satisfaction</strong>, ensuring our products 
                consistently meet your expectations. We work closely with clients across various industries, tailoring solutions 
                to specific requirements.
              </p>
              <div className="bg-primary-600 text-white py-4 px-6 rounded-lg inline-block mt-4">
                <span className="text-xl font-bold">Your trust is our priority!</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-secondary-900 text-center mb-12">Why Choose Us?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-sm border-l-4 border-primary-600">
              <div className="text-primary-600 text-3xl mb-4">✓</div>
              <h3 className="text-xl font-bold text-secondary-900 mb-3">Premium Quality</h3>
              <p className="text-accent-600">Strict quality control ensures superior products.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border-l-4 border-primary-600">
              <div className="text-primary-600 text-3xl mb-4">✓</div>
              <h3 className="text-xl font-bold text-secondary-900 mb-3">Customization Available</h3>
              <p className="text-accent-600">We tailor solutions to meet specific customer needs.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border-l-4 border-primary-600">
              <div className="text-primary-600 text-3xl mb-4">✓</div>
              <h3 className="text-xl font-bold text-secondary-900 mb-3">Reliable Supply Chain</h3>
              <p className="text-accent-600">Consistent and timely delivery.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border-l-4 border-primary-600">
              <div className="text-primary-600 text-3xl mb-4">✓</div>
              <h3 className="text-xl font-bold text-secondary-900 mb-3">Proudly South African</h3>
              <p className="text-accent-600">Supporting local manufacturing and job creation.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border-l-4 border-primary-600">
              <div className="text-primary-600 text-3xl mb-4">✓</div>
              <h3 className="text-xl font-bold text-secondary-900 mb-3">Climate & UV Resistant</h3>
              <p className="text-accent-600">Built to last in harsh conditions.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border-l-4 border-primary-600">
              <div className="text-primary-600 text-3xl mb-4">✓</div>
              <h3 className="text-xl font-bold text-secondary-900 mb-3">Industry Experience</h3>
              <p className="text-accent-600">Over 70 years of combined expertise.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Company Stats */}
      <section className="py-16 bg-secondary-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-primary-400 mb-2">2016</div>
              <p className="text-gray-300">Founded</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-primary-400 mb-2">70+</div>
              <p className="text-gray-300">Years Combined Experience</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-primary-400 mb-2">100%</div>
              <p className="text-gray-300">South African Made</p>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-primary-400 mb-2">UV</div>
              <p className="text-gray-300">Stabilized Products</p>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-secondary-900 mb-8">Our Commitment</h2>
          <div className="flex flex-wrap justify-center gap-8">
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="text-4xl mb-3">🏭</div>
              <p className="font-semibold text-secondary-900">Local Manufacturing</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="text-4xl mb-3">♻️</div>
              <p className="font-semibold text-secondary-900">Recyclable Materials</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="text-4xl mb-3">☀️</div>
              <p className="font-semibold text-secondary-900">UV Stabilized</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl">
              <div className="text-4xl mb-3">✅</div>
              <p className="font-semibold text-secondary-900">Quality Assured</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-secondary-900 to-primary-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Work With Us?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Contact our team to discuss your requirements and get a personalized quote.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/contact" 
              className="inline-block bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Contact Us
            </Link>
            <Link 
              href="/products" 
              className="inline-block bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors border border-primary-500"
            >
              View Products
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

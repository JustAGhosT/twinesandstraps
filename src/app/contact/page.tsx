import Link from 'next/link';

export default function ContactPage() {
  const contacts = [
    { name: 'Annemarie', phone: '074 187 4975' },
    { name: 'Andre', phone: '082 577 8039' },
    { name: 'Martyn', phone: '083 966 0593' },
  ];

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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Get in touch with our team for quotes, inquiries, and support.
          </p>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-secondary-900 text-center mb-12">Reach Out to Our Team</h2>
            
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {contacts.map((contact) => (
                <div key={contact.name} className="bg-gray-50 p-6 rounded-xl text-center hover:shadow-lg transition-shadow border-t-4 border-primary-600">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-secondary-900 mb-2">{contact.name}</h3>
                  <a 
                    href={`tel:${contact.phone.replace(/\s/g, '')}`}
                    className="text-lg text-primary-600 hover:text-primary-700 font-semibold"
                  >
                    {contact.phone}
                  </a>
                </div>
              ))}
            </div>

            {/* General Contact Info */}
            <div className="bg-secondary-900 text-white rounded-2xl p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-bold mb-6">General Inquiries</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Email</p>
                        <a href="mailto:info@twinesandstraps.co.za" className="text-white hover:text-primary-400 transition-colors">
                          info@twinesandstraps.co.za
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Business Hours</p>
                        <p className="text-white">Mon - Fri: 8:00 AM - 5:00 PM</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-6">Quick Actions</h3>
                  <div className="space-y-4">
                    <Link 
                      href="/quote"
                      className="flex items-center gap-4 bg-primary-600 hover:bg-primary-700 p-4 rounded-lg transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="font-semibold">Request a Quote</span>
                    </Link>
                    <Link 
                      href="/products"
                      className="flex items-center gap-4 bg-white/10 hover:bg-white/20 p-4 rounded-lg transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <span className="font-semibold">Browse Products</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Location Note */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-secondary-900 mb-4">
              <span className="text-3xl">🇿🇦</span>
              <h3 className="text-2xl font-bold">Proudly South African</h3>
            </div>
            <p className="text-accent-600">
              TASSA is a local manufacturer supporting South African industry and job creation. 
              All our products are manufactured locally with pride.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ or Additional Info */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-secondary-900 text-center mb-12">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="font-bold text-secondary-900 mb-2">Do you offer bulk pricing?</h3>
                <p className="text-accent-600">Yes! We offer competitive bulk pricing for business customers. Contact us for a personalized quote based on your requirements.</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="font-bold text-secondary-900 mb-2">What is the lead time for orders?</h3>
                <p className="text-accent-600">Standard orders are typically fulfilled within 3-5 business days. Large or custom orders may require additional time.</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="font-bold text-secondary-900 mb-2">Do you offer custom products?</h3>
                <p className="text-accent-600">Yes, we offer customization options to meet specific customer needs. Contact our team to discuss your requirements.</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="font-bold text-secondary-900 mb-2">What payment methods do you accept?</h3>
                <p className="text-accent-600">We accept EFT, credit card, and other payment methods. For business accounts, we offer 30-day terms upon approval.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

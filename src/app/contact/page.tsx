import Link from 'next/link';
import FAQ from '@/components/FAQ';

export default function ContactPage() {
  const faqItems = [
    {
      question: 'What is your minimum order quantity?',
      answer: 'We offer flexible ordering options. For standard products, there is no minimum order quantity. However, bulk orders may qualify for volume discounts. Please contact us for specific requirements.',
    },
    {
      question: 'Do you offer delivery services?',
      answer: 'Yes, we provide delivery services across South Africa. Delivery costs and timeframes depend on your location and order size. We work with trusted courier partners to ensure safe and timely delivery.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept various payment methods including credit/debit cards via PayFast, EFT transfers, and bank deposits. For large B2B orders, we can arrange payment terms upon approval.',
    },
    {
      question: 'Can I return or exchange products?',
      answer: 'Yes, we have a return and exchange policy. Products must be returned in original condition within 14 days of purchase. Custom orders may have different terms. Please see our Returns & Warranty page for full details.',
    },
    {
      question: 'Do you offer custom product specifications?',
      answer: 'Absolutely! We specialize in custom orders and can manufacture products to your specific requirements including diameter, length, material, and strength ratings. Contact us with your specifications for a quote.',
    },
    {
      question: 'What is your warranty policy?',
      answer: 'All our products come with a quality guarantee. We stand behind the durability and performance of our twines and straps. Specific warranty terms vary by product type. Please refer to our Returns & Warranty page for detailed information.',
    },
    {
      question: 'How long does it take to process an order?',
      answer: 'Standard orders are typically processed within 1-2 business days. Custom orders may take 5-10 business days depending on specifications. We\'ll provide an estimated delivery date when you place your order.',
    },
    {
      question: 'Do you serve both retail and B2B customers?',
      answer: 'Yes! We serve both individual customers and businesses. B2B customers may qualify for volume pricing, custom terms, and dedicated account management. Contact us to discuss your business needs.',
    },
  ];
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
      <section className="py-16 bg-white dark:bg-secondary-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-secondary-900 dark:text-white text-center mb-12">Reach Out to Our Team</h2>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {contacts.map((contact) => (
                <div key={contact.name} className="bg-gray-50 dark:bg-secondary-800 p-6 rounded-xl text-center hover:shadow-lg transition-shadow border-t-4 border-primary-600">
                  <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-primary-600 dark:text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-2">{contact.name}</h3>
                  <a
                    href={`tel:${contact.phone.replace(/\s/g, '')}`}
                    className="text-lg text-primary-600 dark:text-primary-500 hover:text-primary-700 dark:hover:text-primary-400 font-semibold"
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
      <section className="py-12 bg-gray-50 dark:bg-secondary-800">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 text-secondary-900 dark:text-white mb-4">
              <span className="text-3xl">🇿🇦</span>
              <h3 className="text-2xl font-bold">Proudly South African</h3>
            </div>
            <p className="text-accent-600 dark:text-gray-300">
              TASSA is a local manufacturer supporting South African industry and job creation.
              All our products are manufactured locally with pride.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50 dark:bg-secondary-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <FAQ items={faqItems} />
          </div>
        </div>
      </section>
    </>
  );
}

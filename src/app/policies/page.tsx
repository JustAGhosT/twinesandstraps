import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Returns & Warranty Policy',
  description: 'Learn about our returns, warranty, and shipping policies for TASSA products.',
};

export default function PoliciesPage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-foreground">Returns & Warranty Policy</h1>

          {/* Returns Policy */}
          <section className="mb-12 bg-card text-card-foreground rounded-lg shadow-sm p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-4">Returns Policy</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                At TASSA, we stand behind the quality of our products. If you're not satisfied with your purchase, 
                we're here to help.
              </p>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">Return Conditions</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Products must be returned within 14 days of purchase</li>
                  <li>Items must be in original, unused condition with all packaging intact</li>
                  <li>Custom or made-to-order products are not eligible for return unless defective</li>
                  <li>Proof of purchase (invoice or order confirmation) is required</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Return Process</h3>
                <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>Contact us at <a href="mailto:info@twinesandstraps.co.za" className="text-primary hover:underline">info@twinesandstraps.co.za</a> or call us to initiate a return</li>
                  <li>Provide your order number and reason for return</li>
                  <li>We'll provide return instructions and a return authorization number</li>
                  <li>Package the item securely and ship it back to us</li>
                  <li>Once received and inspected, we'll process your refund or exchange</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Refunds</h3>
                <p>
                  Refunds will be processed to the original payment method within 5-10 business days after we receive 
                  and inspect the returned item. Shipping costs are non-refundable unless the return is due to our error.
                </p>
              </div>
            </div>
          </section>

          {/* Warranty Policy */}
          <section className="mb-12 bg-card text-card-foreground rounded-lg shadow-sm p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-4">Warranty Policy</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                All TASSA products are manufactured to the highest quality standards. We guarantee our products against 
                manufacturing defects.
              </p>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Warranty Coverage</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Standard Products:</strong> 12 months from date of purchase against manufacturing defects</li>
                  <li><strong>Custom Products:</strong> Warranty terms will be specified in your order confirmation</li>
                  <li>Warranty covers defects in materials and workmanship under normal use</li>
                  <li>Warranty does not cover damage from misuse, improper storage, or normal wear and tear</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Warranty Claims</h3>
                <p>
                  To make a warranty claim, contact us with your order number, photos of the defect, and a description 
                  of the issue. We'll assess the claim and either repair, replace, or refund the product at our discretion.
                </p>
              </div>
            </div>
          </section>

          {/* Shipping Policy */}
          <section className="mb-12 bg-card text-card-foreground rounded-lg shadow-sm p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-4">Shipping & Delivery Policy</h2>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Delivery Areas</h3>
                <p>
                  We deliver throughout South Africa. Delivery times and costs vary by location and order size.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Shipping Methods</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Standard Delivery:</strong> 3-5 business days (major centers)</li>
                  <li><strong>Express Delivery:</strong> 1-2 business days (available for select areas)</li>
                  <li><strong>Bulk Orders:</strong> Arranged on a case-by-case basis</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Shipping Costs</h3>
                <p>
                  Shipping costs are calculated at checkout based on your location and order weight. 
                  Free shipping may be available for orders over a certain value - check our current promotions.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-2">Order Processing</h3>
                <p>
                  Orders are typically processed within 1-2 business days. Custom orders may take 5-10 business days 
                  to manufacture before shipping. You'll receive tracking information once your order ships.
                </p>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section className="bg-primary-50 dark:bg-primary-900/20 rounded-lg shadow-sm p-6 md:p-8 text-center">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Questions About Our Policies?</h2>
            <p className="text-muted-foreground mb-6">
              If you have any questions about our returns, warranty, or shipping policies, please don't hesitate to contact us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Contact Us
              </Link>
              <Link
                href="/products"
                className="inline-block bg-white dark:bg-secondary-800 text-primary-600 dark:text-primary-400 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-secondary-700 transition-colors border border-primary-600 dark:border-primary-400"
              >
                Browse Products
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}


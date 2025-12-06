/**
 * Privacy Policy Page
 * POPIA compliant privacy policy
 */

import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Twines and Straps SA - POPIA Compliant',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-secondary-900 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-sm p-8 md:p-12">
          <h1 className="text-4xl font-bold text-secondary-900 dark:text-white mb-6">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Last updated: {new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="prose dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-secondary-900 dark:text-white mb-4">
                1. Introduction
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Twines and Straps SA (Pty) Ltd (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy.
                This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information in accordance
                with the Protection of Personal Information Act (POPIA) of South Africa.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-secondary-900 dark:text-white mb-4">
                2. Information We Collect
              </h2>
              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-3">
                2.1 Personal Information
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may collect the following personal information:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                <li>Name and contact information (email, phone number)</li>
                <li>Billing and shipping addresses</li>
                <li>Payment information (processed securely through PayFast)</li>
                <li>Account credentials (username, password)</li>
                <li>Order history and preferences</li>
                <li>Communication preferences</li>
              </ul>

              <h3 className="text-xl font-semibold text-secondary-900 dark:text-white mb-3">
                2.2 Automatically Collected Information
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We automatically collect certain information when you visit our website:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                <li>IP address and browser type</li>
                <li>Device information</li>
                <li>Usage data and browsing patterns</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-secondary-900 dark:text-white mb-4">
                3. How We Use Your Information
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We use your personal information for the following purposes:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                <li>To process and fulfill your orders</li>
                <li>To communicate with you about your orders and inquiries</li>
                <li>To improve our website and services</li>
                <li>To send marketing communications (with your consent)</li>
                <li>To comply with legal obligations</li>
                <li>To prevent fraud and ensure security</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-secondary-900 dark:text-white mb-4">
                4. Cookies and Tracking Technologies
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We use cookies and similar technologies to enhance your browsing experience. You can manage your cookie
                preferences through our cookie consent banner. We use the following types of cookies:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                <li><strong>Necessary Cookies:</strong> Required for the website to function properly</li>
                <li><strong>Functional Cookies:</strong> Enable enhanced functionality and personalization</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how visitors use our website</li>
                <li><strong>Marketing Cookies:</strong> Used to deliver personalized advertisements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-secondary-900 dark:text-white mb-4">
                5. Data Sharing and Disclosure
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We do not sell your personal information. We may share your information with:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                <li>Service providers (payment processors, shipping companies)</li>
                <li>Legal authorities when required by law</li>
                <li>Business partners with your explicit consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-secondary-900 dark:text-white mb-4">
                6. Your Rights (POPIA)
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Under POPIA, you have the following rights:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300 mb-4">
                <li><strong>Right to Access:</strong> Request a copy of your personal information</li>
                <li><strong>Right to Correction:</strong> Request correction of inaccurate information</li>
                <li><strong>Right to Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Right to Object:</strong> Object to processing of your personal information</li>
                <li><strong>Right to Restrict Processing:</strong> Request restriction of processing</li>
                <li><strong>Right to Data Portability:</strong> Request transfer of your data</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                To exercise these rights, please contact us at{' '}
                <a href="mailto:info@twinesandstraps.co.za" className="text-primary-600 dark:text-primary-400 hover:underline">
                  info@twinesandstraps.co.za
                </a>
                {' '}or use our{' '}
                <Link href="/api/user/data-export" className="text-primary-600 dark:text-primary-400 hover:underline">
                  data export
                </Link>
                {' '}and{' '}
                <Link href="/account/delete" className="text-primary-600 dark:text-primary-400 hover:underline">
                  account deletion
                </Link>
                {' '}features.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-secondary-900 dark:text-white mb-4">
                7. Data Security
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We implement appropriate technical and organizational measures to protect your personal information
                against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission
                over the Internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-secondary-900 dark:text-white mb-4">
                8. Data Retention
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We retain your personal information only for as long as necessary to fulfill the purposes outlined
                in this Privacy Policy, unless a longer retention period is required by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-secondary-900 dark:text-white mb-4">
                9. Children&apos;s Privacy
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Our services are not directed to individuals under the age of 18. We do not knowingly collect
                personal information from children.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-secondary-900 dark:text-white mb-4">
                10. Changes to This Privacy Policy
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting
                the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-secondary-900 dark:text-white mb-4">
                11. Contact Us
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have any questions about this Privacy Policy or wish to exercise your rights, please contact us:
              </p>
              <div className="bg-gray-50 dark:bg-secondary-700 rounded-lg p-4 space-y-2">
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Email:</strong>{' '}
                  <a href="mailto:info@twinesandstraps.co.za" className="text-primary-600 dark:text-primary-400 hover:underline">
                    info@twinesandstraps.co.za
                  </a>
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Phone:</strong> +27 (0)63 969 0773
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Address:</strong> South Africa
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}


'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NewsletterSignup from '@/components/NewsletterSignup';
import { featureFlags } from '@/config/featureFlags';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

// Social media icons
const FacebookIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
  </svg>
);

const LinkedInIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
  </svg>
);

const Footer: React.FC = () => {
  const router = useRouter();
  const { settings } = useSiteSettings();
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  // Check if any social links are configured
  const socialLinks = [
    { url: settings.socialFacebook, icon: FacebookIcon, label: 'Facebook' },
    { url: settings.socialInstagram, icon: InstagramIcon, label: 'Instagram' },
    { url: settings.socialLinkedIn, icon: LinkedInIcon, label: 'LinkedIn' },
    { url: settings.socialTwitter, icon: TwitterIcon, label: 'X (Twitter)' },
    { url: settings.socialYoutube, icon: YouTubeIcon, label: 'YouTube' },
  ].filter(link => link.url && link.url.trim() !== '');

  const hasSocialLinks = socialLinks.length > 0;

  // Hidden admin access - click logo 5 times quickly
  const handleLogoClick = () => {
    const now = Date.now();
    if (now - lastClickTime > 2000) {
      // Reset if more than 2 seconds since last click
      setClickCount(1);
    } else {
      setClickCount(prev => prev + 1);
    }
    setLastClickTime(now);

    if (clickCount >= 4) {
      // 5th click
      setClickCount(0);
      router.push('/admin/login');
    }
  };

  return (
    <footer className="bg-secondary-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 ${
          featureFlags.newsletterSignup ? 'lg:grid-cols-4' : 'lg:grid-cols-3'
        }`}>
          <div>
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-2 mb-4 cursor-default select-none"
              aria-label="TASSA"
            >
              <div className="w-8 h-8 rounded-full border-2 border-primary-600 flex items-center justify-center bg-white">
                <span className="text-primary-600 font-bold text-xs">TS</span>
              </div>
              <h3 className="text-lg font-semibold">TASSA</h3>
            </button>
            <p className="text-gray-400 text-sm mb-2">
              {settings.companyName}
            </p>
            <p className="text-gray-400 text-sm">
              Your trusted supplier of quality ropes, twines, and straps for both retail and business customers.
            </p>
            <p className="text-primary-600 mt-3 italic text-sm">&quot;{settings.tagline}&quot;</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/products" className="text-gray-400 hover:text-primary-600 transition-colors text-sm">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/quote" className="text-gray-400 hover:text-primary-600 transition-colors text-sm">
                  Request a Quote
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-primary-600 transition-colors text-sm">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-primary-600 transition-colors text-sm">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>Email: {settings.email}</li>
              <li>Phone: {settings.phone}</li>
              <li>Business Hours: {settings.businessHours}</li>
            </ul>
            {hasSocialLinks && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Follow Us</h4>
                <div className="flex gap-3">
                  {socialLinks.map(({ url, icon: Icon, label }) => (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-primary-500 transition-colors"
                      aria-label={label}
                    >
                      <Icon />
                    </a>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-4 flex gap-2">
              <span className="inline-block px-2 py-1 bg-primary-600/20 text-primary-500 rounded text-xs">🏭 Local Manufacturing</span>
              <span className="inline-block px-2 py-1 bg-primary-600/20 text-primary-500 rounded text-xs">🇿🇦 Proudly SA</span>
            </div>
          </div>
          {featureFlags.newsletterSignup && (
            <div className="md:col-span-2 lg:col-span-1">
              <NewsletterSignup variant="footer" />
            </div>
          )}
        </div>
        <div className="border-t border-secondary-700 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} {settings.companyName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

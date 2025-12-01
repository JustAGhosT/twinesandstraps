/**
 * WhatsAppButton Component Tests
 *
 * These tests ensure the WhatsApp link functionality works correctly.
 * Regression tests for the issue where WhatsApp link stopped working.
 *
 * Issue: "selfs die whatapp link het gewerk en ek kon n whatsapp stuur"
 *        "maar nou werk dit nie meer"
 * (even the WhatsApp link worked and I could send a WhatsApp, but now it doesn't work anymore)
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WhatsAppButton from '@/components/WhatsAppButton';
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext';
import { ToastProvider } from '@/components/Toast';

// Mock the contexts
jest.mock('@/contexts/SiteSettingsContext', () => {
  const actual = jest.requireActual('@/contexts/SiteSettingsContext');
  return {
    ...actual,
    useSiteSettings: jest.fn(),
  };
});

jest.mock('@/components/Toast', () => {
  const actual = jest.requireActual('@/components/Toast');
  return {
    ...actual,
    useToast: jest.fn(),
  };
});

import { useSiteSettings } from '@/contexts/SiteSettingsContext';
import { useToast } from '@/components/Toast';

const mockUseSiteSettings = useSiteSettings as jest.MockedFunction<typeof useSiteSettings>;
const mockUseToast = useToast as jest.MockedFunction<typeof useToast>;

describe('WhatsAppButton', () => {
  const mockWarning = jest.fn();
  const mockWindowOpen = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock for useToast
    mockUseToast.mockReturnValue({
      toasts: [],
      showToast: jest.fn(),
      removeToast: jest.fn(),
      success: jest.fn(),
      error: jest.fn(),
      warning: mockWarning,
      info: jest.fn(),
    });

    // Mock window.open
    Object.defineProperty(window, 'open', {
      value: mockWindowOpen,
      writable: true,
    });
  });

  describe('WhatsApp Link Generation', () => {
    it('should open WhatsApp with correct URL when configured', () => {
      mockUseSiteSettings.mockReturnValue({
        settings: {
          companyName: 'Test Company',
          tagline: '',
          email: 'test@example.com',
          phone: '+27 123 456 7890',
          whatsappNumber: '27123456789',
          address: '',
          businessHours: '',
          vatRate: '15',
          logoUrl: '',
          socialFacebook: '',
          socialInstagram: '',
          socialLinkedIn: '',
          socialTwitter: '',
          socialYoutube: '',
        },
        loading: false,
        error: null,
        refreshSettings: jest.fn(),
      });

      render(<WhatsAppButton />);

      const button = screen.getByRole('button', { name: /contact us on whatsapp/i });
      fireEvent.click(button);

      // Should open WhatsApp with correct number and pre-filled message
      expect(mockWindowOpen).toHaveBeenCalledTimes(1);
      const callArgs = mockWindowOpen.mock.calls[0];
      expect(callArgs[0]).toContain('https://wa.me/27123456789');
      expect(callArgs[0]).toContain('text=');
      expect(callArgs[1]).toBe('_blank');
      expect(callArgs[2]).toContain('noopener');
    });

    it('should include pre-filled inquiry message', () => {
      mockUseSiteSettings.mockReturnValue({
        settings: {
          companyName: 'Test Company',
          tagline: '',
          email: 'test@example.com',
          phone: '+27 123 456 7890',
          whatsappNumber: '27821234567',
          address: '',
          businessHours: '',
          vatRate: '15',
          logoUrl: '',
          socialFacebook: '',
          socialInstagram: '',
          socialLinkedIn: '',
          socialTwitter: '',
          socialYoutube: '',
        },
        loading: false,
        error: null,
        refreshSettings: jest.fn(),
      });

      render(<WhatsAppButton />);

      const button = screen.getByRole('button', { name: /contact us on whatsapp/i });
      fireEvent.click(button);

      const url = mockWindowOpen.mock.calls[0][0];
      // URL should contain encoded message
      expect(url).toContain(encodeURIComponent('Hi! I would like to inquire about your products.'));
    });

    it('should handle various South African phone formats', () => {
      const phoneNumbers = [
        '27821234567',    // Standard format
        '27111234567',    // Landline format
        '27600123456',    // Cell format starting with 60
      ];

      phoneNumbers.forEach((number) => {
        mockWindowOpen.mockClear();

        mockUseSiteSettings.mockReturnValue({
          settings: {
            companyName: 'Test',
            tagline: '',
            email: 'test@example.com',
            phone: '',
            whatsappNumber: number,
            address: '',
            businessHours: '',
            vatRate: '15',
            logoUrl: '',
            socialFacebook: '',
            socialInstagram: '',
            socialLinkedIn: '',
            socialTwitter: '',
            socialYoutube: '',
          },
          loading: false,
          error: null,
          refreshSettings: jest.fn(),
        });

        const { unmount } = render(<WhatsAppButton />);
        const button = screen.getByRole('button', { name: /contact us on whatsapp/i });
        fireEvent.click(button);

        expect(mockWindowOpen).toHaveBeenCalledWith(
          expect.stringContaining(`https://wa.me/${number}`),
          '_blank',
          expect.any(String)
        );

        unmount();
      });
    });
  });

  describe('Unconfigured WhatsApp Number', () => {
    it('should show warning when WhatsApp number is placeholder', () => {
      mockUseSiteSettings.mockReturnValue({
        settings: {
          companyName: 'Test Company',
          tagline: '',
          email: 'fallback@example.com',
          phone: '',
          whatsappNumber: '27XXXXXXXXX', // Placeholder value
          address: '',
          businessHours: '',
          vatRate: '15',
          logoUrl: '',
          socialFacebook: '',
          socialInstagram: '',
          socialLinkedIn: '',
          socialTwitter: '',
          socialYoutube: '',
        },
        loading: false,
        error: null,
        refreshSettings: jest.fn(),
      });

      render(<WhatsAppButton />);

      const button = screen.getByRole('button', { name: /contact us on whatsapp/i });
      fireEvent.click(button);

      // Should NOT open window
      expect(mockWindowOpen).not.toHaveBeenCalled();

      // Should show warning with email fallback
      expect(mockWarning).toHaveBeenCalledWith(
        expect.stringContaining('WhatsApp not configured')
      );
      expect(mockWarning).toHaveBeenCalledWith(
        expect.stringContaining('fallback@example.com')
      );
    });

    it('should use default number when settings number is empty', () => {
      mockUseSiteSettings.mockReturnValue({
        settings: {
          companyName: 'Test',
          tagline: '',
          email: 'test@example.com',
          phone: '',
          whatsappNumber: '', // Empty - will fallback to default (27639690773)
          address: '',
          businessHours: '',
          vatRate: '15',
          logoUrl: '',
          socialFacebook: '',
          socialInstagram: '',
          socialLinkedIn: '',
          socialTwitter: '',
          socialYoutube: '',
        },
        loading: false,
        error: null,
        refreshSettings: jest.fn(),
      });

      render(<WhatsAppButton />);

      const button = screen.getByRole('button', { name: /contact us on whatsapp/i });
      fireEvent.click(button);

      // Should open WhatsApp with the default number
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('https://wa.me/27639690773'),
        '_blank',
        expect.any(String)
      );
    });
  });

  describe('Button Rendering and Accessibility', () => {
    beforeEach(() => {
      mockUseSiteSettings.mockReturnValue({
        settings: {
          companyName: 'Test',
          tagline: '',
          email: 'test@example.com',
          phone: '',
          whatsappNumber: '27821234567',
          address: '',
          businessHours: '',
          vatRate: '15',
          logoUrl: '',
          socialFacebook: '',
          socialInstagram: '',
          socialLinkedIn: '',
          socialTwitter: '',
          socialYoutube: '',
        },
        loading: false,
        error: null,
        refreshSettings: jest.fn(),
      });
    });

    it('should render the WhatsApp button', () => {
      render(<WhatsAppButton />);

      const button = screen.getByRole('button', { name: /contact us on whatsapp/i });
      expect(button).toBeInTheDocument();
    });

    it('should have accessible label', () => {
      render(<WhatsAppButton />);

      const button = screen.getByRole('button', { name: /contact us on whatsapp/i });
      expect(button).toHaveAttribute('aria-label', 'Contact us on WhatsApp');
    });

    it('should show "Chat with us" text on hover', () => {
      render(<WhatsAppButton />);

      const chatText = screen.getByText('Chat with us');
      expect(chatText).toBeInTheDocument();
    });

    it('should be fixed positioned at bottom right', () => {
      render(<WhatsAppButton />);

      const button = screen.getByRole('button', { name: /contact us on whatsapp/i });
      expect(button).toHaveClass('fixed', 'bottom-6', 'right-6');
    });
  });

  describe('URL Security', () => {
    it('should open with noopener,noreferrer for security', () => {
      mockUseSiteSettings.mockReturnValue({
        settings: {
          companyName: 'Test',
          tagline: '',
          email: 'test@example.com',
          phone: '',
          whatsappNumber: '27821234567',
          address: '',
          businessHours: '',
          vatRate: '15',
          logoUrl: '',
          socialFacebook: '',
          socialInstagram: '',
          socialLinkedIn: '',
          socialTwitter: '',
          socialYoutube: '',
        },
        loading: false,
        error: null,
        refreshSettings: jest.fn(),
      });

      render(<WhatsAppButton />);

      const button = screen.getByRole('button', { name: /contact us on whatsapp/i });
      fireEvent.click(button);

      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.any(String),
        '_blank',
        'noopener,noreferrer'
      );
    });
  });
});

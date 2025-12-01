/**
 * SiteSettingsContext Tests
 *
 * These tests ensure contact information (email, phone, WhatsApp number)
 * is properly loaded and persisted. Regression tests for the issue where
 * phone and email fields were losing their values.
 *
 * Issue: "Maar vannaand is epos en tel nr weer weg"
 * (But tonight the email and phone number are gone again)
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { SiteSettingsProvider, useSiteSettings } from '@/contexts/SiteSettingsContext';

// Test component to access context values
function TestConsumer({ onSettingsLoad }: { onSettingsLoad?: (settings: ReturnType<typeof useSiteSettings>) => void }) {
  const contextValue = useSiteSettings();

  React.useEffect(() => {
    if (!contextValue.loading && onSettingsLoad) {
      onSettingsLoad(contextValue);
    }
  }, [contextValue, onSettingsLoad]);

  return (
    <div>
      <span data-testid="email">{contextValue.settings.email}</span>
      <span data-testid="phone">{contextValue.settings.phone}</span>
      <span data-testid="whatsapp">{contextValue.settings.whatsappNumber}</span>
      <span data-testid="loading">{contextValue.loading ? 'loading' : 'loaded'}</span>
      <span data-testid="error">{contextValue.error || 'no-error'}</span>
    </div>
  );
}

describe('SiteSettingsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Contact Information Persistence', () => {
    it('should load contact settings from API on mount', async () => {
      const mockSettings = {
        companyName: 'Test Company',
        email: 'custom@example.com',
        phone: '+27 123 456 7890',
        whatsappNumber: '27123456789',
        tagline: 'Test tagline',
        address: '123 Test St',
        businessHours: 'Mon-Fri 9-5',
        vatRate: '15',
        logoUrl: '',
        socialFacebook: '',
        socialInstagram: '',
        socialLinkedIn: '',
        socialTwitter: '',
        socialYoutube: '',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSettings,
      });

      render(
        <SiteSettingsProvider>
          <TestConsumer />
        </SiteSettingsProvider>
      );

      // Wait for settings to load
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      // Verify contact info is loaded correctly
      expect(screen.getByTestId('email')).toHaveTextContent('custom@example.com');
      expect(screen.getByTestId('phone')).toHaveTextContent('+27 123 456 7890');
      expect(screen.getByTestId('whatsapp')).toHaveTextContent('27123456789');
    });

    it('should retain default values when API returns partial data', async () => {
      // API returns only some fields - email and phone should not be overwritten with undefined
      const partialSettings = {
        companyName: 'Partial Company',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => partialSettings,
      });

      render(
        <SiteSettingsProvider>
          <TestConsumer />
        </SiteSettingsProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      // Contact info should fall back to defaults when not provided
      expect(screen.getByTestId('email')).toHaveTextContent('admin@tassa.co.za');
      expect(screen.getByTestId('phone')).toHaveTextContent('+27 (0)63 969 0773');
    });

    it('should use default contact info when API fails', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(
        <SiteSettingsProvider>
          <TestConsumer />
        </SiteSettingsProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      // Should fall back to default values
      expect(screen.getByTestId('email')).toHaveTextContent('admin@tassa.co.za');
      expect(screen.getByTestId('phone')).toHaveTextContent('+27 (0)63 969 0773');
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to load site settings');
    });

    it('should use default values when API returns non-ok response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      render(
        <SiteSettingsProvider>
          <TestConsumer />
        </SiteSettingsProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      // Should fall back to defaults
      expect(screen.getByTestId('email')).toHaveTextContent('admin@tassa.co.za');
      expect(screen.getByTestId('phone')).toHaveTextContent('+27 (0)63 969 0773');
    });

    it('should not lose contact info on refresh', async () => {
      const mockSettings = {
        email: 'persistent@example.com',
        phone: '+27 999 888 7777',
        whatsappNumber: '27999888777',
      };

      // First load
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSettings,
      });

      let capturedRefresh: (() => Promise<void>) | null = null;

      function RefreshTestConsumer() {
        const { settings, refreshSettings, loading } = useSiteSettings();

        React.useEffect(() => {
          capturedRefresh = refreshSettings;
        }, [refreshSettings]);

        return (
          <div>
            <span data-testid="email">{settings.email}</span>
            <span data-testid="phone">{settings.phone}</span>
            <span data-testid="loading">{loading ? 'loading' : 'loaded'}</span>
          </div>
        );
      }

      render(
        <SiteSettingsProvider>
          <RefreshTestConsumer />
        </SiteSettingsProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      expect(screen.getByTestId('email')).toHaveTextContent('persistent@example.com');
      expect(screen.getByTestId('phone')).toHaveTextContent('+27 999 888 7777');

      // Setup mock for refresh - same data should persist
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockSettings,
      });

      // Trigger refresh
      await act(async () => {
        if (capturedRefresh) {
          await capturedRefresh();
        }
      });

      // Contact info should still be present after refresh
      expect(screen.getByTestId('email')).toHaveTextContent('persistent@example.com');
      expect(screen.getByTestId('phone')).toHaveTextContent('+27 999 888 7777');
    });

    it('should preserve empty string values (not treat as missing)', async () => {
      // User explicitly cleared a field - it should stay empty, not revert to default
      const settingsWithEmptyPhone = {
        email: 'test@example.com',
        phone: '', // Explicitly empty
        whatsappNumber: '27123456789',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => settingsWithEmptyPhone,
      });

      render(
        <SiteSettingsProvider>
          <TestConsumer />
        </SiteSettingsProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
      });

      // Empty string should be preserved, not replaced with default
      expect(screen.getByTestId('phone')).toHaveTextContent('');
      expect(screen.getByTestId('email')).toHaveTextContent('test@example.com');
    });
  });

  describe('Context Provider Requirements', () => {
    it('should throw error when useSiteSettings is used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useSiteSettings must be used within a SiteSettingsProvider');

      consoleSpy.mockRestore();
    });
  });
});

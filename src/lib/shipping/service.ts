/**
 * Unified Shipping Service
 * Main entry point for shipping operations using provider pattern
 */

import { shippingProviderFactory } from './provider.factory';
import { IShippingProvider } from './provider.interface';
import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

import {
  ShippingQuoteRequest,
  ShippingQuote,
  WaybillRequest,
  Waybill,
  TrackingInfo,
  CollectionPoint,
} from './types';

/**
 * Get shipping quotes from all configured providers
 */
export async function getShippingQuotes(request: ShippingQuoteRequest): Promise<ShippingQuote[]> {
  return shippingProviderFactory.getAllQuotes(request);
}

/**
 * Get best shipping quote (cheapest or fastest)
 */
export async function getBestShippingQuote(
  request: ShippingQuoteRequest,
  preference: 'cheapest' | 'fastest' = 'cheapest'
): Promise<ShippingQuote | null> {
  return shippingProviderFactory.getBestQuote(request, preference);
}

/**
 * Create waybill using specified provider or auto-select
 */
export async function createWaybill(
  request: WaybillRequest,
  providerName?: string
): Promise<Waybill | null> {
  let provider: IShippingProvider | null;

  if (providerName) {
    provider = shippingProviderFactory.getProvider(providerName);
    if (!provider || !provider.isConfigured()) {
      throw new Error(`Provider "${providerName}" is not available or not configured`);
    }
  } else {
    // Auto-select provider based on request characteristics
    provider = await shippingProviderFactory.getAutoProvider({
      origin: {
        city: request.origin.city,
        province: request.origin.province,
        postalCode: request.origin.postalCode,
      },
      destination: {
        city: request.destination.city,
        province: request.destination.province,
        postalCode: request.destination.postalCode,
      },
      weight: request.items.reduce((sum, item) => sum + item.weight * item.quantity, 0),
      collectionPointId: request.collectionPointId,
    });
  }

  if (!provider) {
    throw new Error('No shipping provider available');
  }

  return provider.createWaybill(request);
}

/**
 * Get tracking information
 */
export async function getTrackingInfo(
  waybillNumber: string,
  providerName?: string
): Promise<TrackingInfo | null> {
  if (providerName) {
    const provider = shippingProviderFactory.getProvider(providerName);
    if (!provider || !provider.isConfigured()) {
      return null;
    }
    return provider.getTracking(waybillNumber);
  }

  // Try all providers until we find one that has tracking info
  const providers = shippingProviderFactory.getConfiguredProviders();
  for (const provider of providers) {
    try {
      const tracking = await provider.getTracking(waybillNumber);
      if (tracking) {
        return tracking;
      }
    } catch (error) {
      // Continue to next provider
      continue;
    }
  }

  return null;
}

/**
 * Search collection points
 */
export async function searchCollectionPoints(
  postalCode: string,
  city?: string,
  province?: string,
  radiusKm: number = 10
): Promise<CollectionPoint[]> {
  const providers = shippingProviderFactory.getConfiguredProviders();
  const allPoints: CollectionPoint[] = [];

  // Search all providers that support collection points
  for (const provider of providers) {
    if (provider.supportsCollectionPoints()) {
      try {
        const points = await provider.searchCollectionPoints(postalCode, city, province, radiusKm);
        allPoints.push(...points);
      } catch (error) {
        logError(`Error searching collection points with ${provider.name}:`, error);
      }
    }
  }

  // Sort by distance if available
  return allPoints.sort((a, b) => {
    if (a.distance !== undefined && b.distance !== undefined) {
      return a.distance - b.distance;
    }
    return 0;
  });
}

/**
 * Get all available providers
 */
export function getAvailableProviders(): IShippingProvider[] {
  return shippingProviderFactory.getAllProviders();
}

/**
 * Get all configured providers
 */
export function getConfiguredProviders(): IShippingProvider[] {
  return shippingProviderFactory.getConfiguredProviders();
}


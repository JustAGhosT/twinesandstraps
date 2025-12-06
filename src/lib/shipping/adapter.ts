/**
 * Shipping Adapter
 * Provides backward compatibility with existing code that uses courier-guy.ts directly
 * This adapter wraps the new provider system for gradual migration
 */

import {
  ShippingQuoteRequest,
  ShippingQuote,
  WaybillRequest,
  Waybill,
} from './types';
import {
  getBestShippingQuote,
  createWaybill as createWaybillService,
  getTrackingInfo as getTrackingInfoService,
} from './service';
import { shippingProviderFactory } from './provider.factory';

/**
 * Backward compatibility: Get shipping quote
 * @deprecated Use getBestShippingQuote from './service' instead
 */
export async function getShippingQuote(request: ShippingQuoteRequest): Promise<ShippingQuote | null> {
  return getBestShippingQuote(request, 'cheapest');
}

/**
 * Backward compatibility: Create waybill
 * @deprecated Use createWaybill from './service' instead
 */
export async function createWaybill(request: WaybillRequest): Promise<Waybill | null> {
  return createWaybillService(request);
}

/**
 * Backward compatibility: Get tracking info
 * @deprecated Use getTrackingInfo from './service' instead
 */
export async function getTrackingInfo(waybillNumber: string): Promise<{
  status: string;
  currentLocation?: string;
  estimatedDelivery?: Date;
  history: Array<{
    status: string;
    location?: string;
    timestamp: Date;
    notes?: string;
  }>;
} | null> {
  return getTrackingInfoService(waybillNumber);
}

/**
 * Backward compatibility: Check if Courier Guy is configured
 * @deprecated Use provider factory instead
 */
export function isCourierGuyConfigured(): boolean {
  const provider = shippingProviderFactory.getProvider('courier-guy');
  return provider?.isConfigured() || false;
}

// Re-export types for backward compatibility
export type {
  ShippingQuoteRequest,
  ShippingQuote,
  WaybillRequest,
  Waybill,
} from './types';


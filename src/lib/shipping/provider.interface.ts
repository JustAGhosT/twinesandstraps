/**
 * Shipping Provider Interface
 * All shipping providers must implement this interface
 */

import {
  ShippingQuoteRequest,
  ShippingQuote,
  WaybillRequest,
  Waybill,
  TrackingInfo,
  CollectionPoint,
} from './types';

export interface IShippingProvider {
  /**
   * Provider identifier (e.g., 'courier-guy', 'pargo')
   */
  readonly name: string;

  /**
   * Human-readable provider name
   */
  readonly displayName: string;

  /**
   * Check if provider is configured and available
   */
  isConfigured(): boolean;

  /**
   * Get shipping quote for a shipment
   */
  getQuote(request: ShippingQuoteRequest): Promise<ShippingQuote | null>;

  /**
   * Create waybill/shipment
   */
  createWaybill(request: WaybillRequest): Promise<Waybill | null>;

  /**
   * Get tracking information for a waybill
   */
  getTracking(waybillNumber: string): Promise<TrackingInfo | null>;

  /**
   * Cancel a waybill (if supported)
   */
  cancelWaybill(waybillNumber: string, reason?: string): Promise<boolean>;

  /**
   * Check if provider supports collection points
   */
  supportsCollectionPoints(): boolean;

  /**
   * Search for collection points near a location
   */
  searchCollectionPoints(
    postalCode: string,
    city?: string,
    province?: string,
    radiusKm?: number
  ): Promise<CollectionPoint[]>;

  /**
   * Get maximum weight supported (in kg)
   */
  getMaxWeight(): number;

  /**
   * Get supported service types
   */
  getSupportedServiceTypes(): string[];
}


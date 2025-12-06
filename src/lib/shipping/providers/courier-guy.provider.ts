/**
 * The Courier Guy Shipping Provider
 * Implements IShippingProvider interface
 */

import { IShippingProvider } from '../provider.interface';
import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

import {
  ShippingQuoteRequest,
  ShippingQuote,
  WaybillRequest,
  Waybill,
  TrackingInfo,
  CollectionPoint,
} from '../types';

const COURIER_GUY_API_KEY = process.env.COURIER_GUY_API_KEY || '';
const COURIER_GUY_API_URL = process.env.COURIER_GUY_API_URL || 'https://api.thecourierguy.co.za';

export class CourierGuyProvider implements IShippingProvider {
  readonly name = 'courier-guy';
  readonly displayName = 'The Courier Guy';

  isConfigured(): boolean {
    return !!COURIER_GUY_API_KEY;
  }

  supportsCollectionPoints(): boolean {
    return false;
  }

  async searchCollectionPoints(): Promise<CollectionPoint[]> {
    return [];
  }

  getMaxWeight(): number {
    return 70; // kg
  }

  getSupportedServiceTypes(): string[] {
    return ['standard', 'express', 'overnight'];
  }

  async getQuote(request: ShippingQuoteRequest): Promise<ShippingQuote | null> {
    if (!this.isConfigured()) {
      logWarn('The Courier Guy API key not configured');
      return null;
    }

    try {
      const response = await fetch(`${COURIER_GUY_API_URL}/api/v1/quotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${COURIER_GUY_API_KEY}`,
        },
        body: JSON.stringify({
          origin: request.origin,
          destination: request.destination,
          weight: request.weight,
          dimensions: request.dimensions,
          service_type: request.serviceType || 'standard',
        }),
      });

      if (!response.ok) {
        throw new Error(`Courier Guy API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        provider: this.name,
        serviceType: data.service_type || request.serviceType || 'standard',
        estimatedDays: data.estimated_days || 3,
        cost: data.cost || 0,
        currency: data.currency || 'ZAR',
      };
    } catch (error) {
      logError('Error fetching shipping quote from Courier Guy:', error);
      
      // Fallback to estimated cost
      return this.estimateShippingCost(request);
    }
  }

  private estimateShippingCost(request: ShippingQuoteRequest): ShippingQuote {
    const baseCost = 50; // R50 base cost
    const perKgCost = 15; // R15 per kg
    const weightCost = request.weight * perKgCost;
    
    const sameProvince = request.origin.province === request.destination.province;
    const distanceMultiplier = sameProvince ? 1 : 1.5;
    
    const estimatedCost = (baseCost + weightCost) * distanceMultiplier;
    const estimatedDays = sameProvince ? 3 : 5;

    return {
      provider: this.name,
      serviceType: request.serviceType || 'standard',
      estimatedDays,
      cost: Math.round(estimatedCost * 100) / 100,
      currency: 'ZAR',
    };
  }

  async createWaybill(request: WaybillRequest): Promise<Waybill | null> {
    if (!this.isConfigured()) {
      logWarn('The Courier Guy API key not configured');
      return null;
    }

    try {
      const response = await fetch(`${COURIER_GUY_API_URL}/api/v1/waybills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${COURIER_GUY_API_KEY}`,
        },
        body: JSON.stringify({
          origin: request.origin,
          destination: request.destination,
          items: request.items,
          service_type: request.serviceType,
          reference: request.reference,
        }),
      });

      if (!response.ok) {
        throw new Error(`Courier Guy API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        waybillNumber: data.waybill_number,
        trackingUrl: data.tracking_url || `${COURIER_GUY_API_URL}/tracking/${data.waybill_number}`,
        cost: data.cost || 0,
        estimatedDelivery: new Date(data.estimated_delivery),
        provider: this.name,
      };
    } catch (error) {
      logError('Error creating waybill with Courier Guy:', error);
      return null;
    }
  }

  async getTracking(waybillNumber: string): Promise<TrackingInfo | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const response = await fetch(`${COURIER_GUY_API_URL}/api/v1/tracking/${waybillNumber}`, {
        headers: {
          'Authorization': `Bearer ${COURIER_GUY_API_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Courier Guy API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        status: data.status,
        currentLocation: data.current_location,
        estimatedDelivery: data.estimated_delivery ? new Date(data.estimated_delivery) : undefined,
        history: (data.history || []).map((item: any) => ({
          status: item.status,
          location: item.location,
          timestamp: new Date(item.timestamp),
          notes: item.notes,
        })),
      };
    } catch (error) {
      logError('Error fetching tracking info from Courier Guy:', error);
      return null;
    }
  }

  async cancelWaybill(waybillNumber: string, reason?: string): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const response = await fetch(`${COURIER_GUY_API_URL}/api/v1/waybills/${waybillNumber}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${COURIER_GUY_API_KEY}`,
        },
        body: JSON.stringify({ reason }),
      });

      return response.ok;
    } catch (error) {
      logError('Error canceling waybill with Courier Guy:', error);
      return false;
    }
  }
}


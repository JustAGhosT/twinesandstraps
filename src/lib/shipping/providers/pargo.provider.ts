/**
 * Pargo Shipping Provider
 * Implements IShippingProvider interface for Pargo collection points
 * Reference: https://docs.pargo.co.za/
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

const PARGO_API_KEY = process.env.PARGO_API_KEY || '';
const PARGO_API_URL = process.env.PARGO_API_URL || 'https://api.pargo.co.za/v1';
const PARGO_CLIENT_ID = process.env.PARGO_CLIENT_ID || '';

export class PargoProvider implements IShippingProvider {
  readonly name = 'pargo';
  readonly displayName = 'Pargo Collection Points';

  isConfigured(): boolean {
    return !!(PARGO_API_KEY && PARGO_CLIENT_ID);
  }

  supportsCollectionPoints(): boolean {
    return true;
  }

  async searchCollectionPoints(
    postalCode: string,
    city?: string,
    province?: string,
    radiusKm: number = 10
  ): Promise<CollectionPoint[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const queryParams = new URLSearchParams({
        postal_code: postalCode,
        radius: radiusKm.toString(),
      });

      if (city) queryParams.append('city', city);
      if (province) queryParams.append('province', province);

      const response = await fetch(`${PARGO_API_URL}/collection-points?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${PARGO_API_KEY}`,
          'X-Client-Id': PARGO_CLIENT_ID,
        },
      });

      if (!response.ok) {
        throw new Error(`Pargo API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return (data.collection_points || []).map((point: any) => ({
        id: point.id || point.pickup_point_id,
        name: point.name || point.description,
        address: point.address_line_1 || point.address,
        city: point.city,
        province: point.province,
        postalCode: point.postal_code || postalCode,
        latitude: point.latitude,
        longitude: point.longitude,
        distance: point.distance_km,
        hours: point.opening_hours,
        phone: point.phone,
      }));
    } catch (error) {
      logError('Error searching Pargo collection points:', error);
      return [];
    }
  }

  getMaxWeight(): number {
    return 20; // kg - Pargo's weight limit
  }

  getSupportedServiceTypes(): string[] {
    return ['standard'];
  }

  async getQuote(request: ShippingQuoteRequest): Promise<ShippingQuote | null> {
    if (!this.isConfigured()) {
      logWarn('Pargo API key not configured');
      return null;
    }

    // Check weight limit
    if (request.weight > this.getMaxWeight()) {
      return null; // Too heavy for Pargo
    }

    try {
      const payload: any = {
        postal_code: request.destination.postalCode,
        weight: request.weight,
      };

      if (request.collectionPointId) {
        payload.collection_point_id = request.collectionPointId;
      }

      const response = await fetch(`${PARGO_API_URL}/quotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PARGO_API_KEY}`,
          'X-Client-Id': PARGO_CLIENT_ID,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Pargo API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      const quote: ShippingQuote = {
        provider: this.name,
        serviceType: 'standard',
        estimatedDays: data.estimated_delivery_days || 3,
        cost: data.cost || this.estimateCost(request.weight),
        currency: 'ZAR',
      };

      // Include collection point info if provided
      if (request.collectionPointId && data.collection_point) {
        quote.collectionPoint = {
          id: data.collection_point.id,
          name: data.collection_point.name,
          address: data.collection_point.address,
          city: data.collection_point.city,
          distance: data.collection_point.distance_km,
        };
      }

      return quote;
    } catch (error) {
      logError('Error fetching shipping quote from Pargo:', error);
      
      // Fallback to estimated cost
      return {
        provider: this.name,
        serviceType: 'standard',
        estimatedDays: 3,
        cost: this.estimateCost(request.weight),
        currency: 'ZAR',
      };
    }
  }

  private estimateCost(weight: number): number {
    // Pargo flat rate is typically R40-60, cheaper than door-to-door
    const baseCost = 45; // R45 base cost
    const perKgCost = 5; // R5 per kg (much cheaper than door-to-door)
    return Math.round((baseCost + weight * perKgCost) * 100) / 100;
  }

  async createWaybill(request: WaybillRequest): Promise<Waybill | null> {
    if (!this.isConfigured()) {
      logWarn('Pargo API key not configured');
      return null;
    }

    if (!request.collectionPointId) {
      throw new Error('Pargo requires a collection point ID');
    }

    try {
      const payload: any = {
        reference: request.reference,
        collection_point_id: request.collectionPointId,
        recipient: {
          name: request.destination.name,
          email: request.destination.email,
          phone: request.destination.phone,
        },
        sender: {
          name: request.origin.name,
          email: request.origin.email,
          phone: request.origin.phone,
        },
        items: request.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          weight: item.weight,
          value: item.value,
        })),
      };

      const response = await fetch(`${PARGO_API_URL}/shipments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PARGO_API_KEY}`,
          'X-Client-Id': PARGO_CLIENT_ID,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Pargo API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      return {
        waybillNumber: data.tracking_number || data.shipment_id,
        trackingUrl: data.tracking_url || `https://tracking.pargo.co.za/${data.tracking_number}`,
        cost: data.cost || 0,
        estimatedDelivery: data.estimated_delivery_date 
          ? new Date(data.estimated_delivery_date) 
          : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days default
        provider: this.name,
      };
    } catch (error) {
      logError('Error creating waybill with Pargo:', error);
      return null;
    }
  }

  async getTracking(waybillNumber: string): Promise<TrackingInfo | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const response = await fetch(`${PARGO_API_URL}/tracking/${waybillNumber}`, {
        headers: {
          'Authorization': `Bearer ${PARGO_API_KEY}`,
          'X-Client-Id': PARGO_CLIENT_ID,
        },
      });

      if (!response.ok) {
        throw new Error(`Pargo API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        status: data.status || 'unknown',
        currentLocation: data.current_location,
        estimatedDelivery: data.estimated_delivery_date ? new Date(data.estimated_delivery_date) : undefined,
        history: (data.tracking_history || []).map((item: any) => ({
          status: item.status,
          location: item.location,
          timestamp: new Date(item.timestamp),
          notes: item.notes || item.description,
        })),
      };
    } catch (error) {
      logError('Error fetching tracking info from Pargo:', error);
      return null;
    }
  }

  async cancelWaybill(waybillNumber: string, reason?: string): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const response = await fetch(`${PARGO_API_URL}/shipments/${waybillNumber}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${PARGO_API_KEY}`,
          'X-Client-Id': PARGO_CLIENT_ID,
        },
        body: JSON.stringify({ reason }),
      });

      return response.ok;
    } catch (error) {
      logError('Error canceling waybill with Pargo:', error);
      return false;
    }
  }
}


/**
 * FastWay Shipping Provider
 * Implements IShippingProvider interface
 * Popular courier service in South Africa
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

const FASTWAY_API_KEY = process.env.FASTWAY_API_KEY || '';
const FASTWAY_ACCOUNT_NUMBER = process.env.FASTWAY_ACCOUNT_NUMBER || '';
const FASTWAY_API_URL = process.env.FASTWAY_API_URL || 'https://api.fastway.co.za/v1';

export class FastWayProvider implements IShippingProvider {
  readonly name = 'fastway';
  readonly displayName = 'FastWay';

  isConfigured(): boolean {
    return !!(FASTWAY_API_KEY && FASTWAY_ACCOUNT_NUMBER);
  }

  supportsCollectionPoints(): boolean {
    return true; // FastWay has depots
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

      const response = await fetch(`${FASTWAY_API_URL}/depots?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${FASTWAY_API_KEY}`,
          'X-Account-Number': FASTWAY_ACCOUNT_NUMBER,
        },
      });

      if (!response.ok) {
        throw new Error(`FastWay API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return (data.depots || []).map((depot: any) => ({
        id: depot.id || depot.depot_code,
        name: depot.name || depot.description,
        address: depot.address_line_1 || depot.address,
        city: depot.city,
        province: depot.province,
        postalCode: depot.postal_code || postalCode,
        latitude: depot.latitude,
        longitude: depot.longitude,
        distance: depot.distance_km,
        hours: depot.opening_hours,
        phone: depot.phone,
      }));
    } catch (error) {
      logError('Error searching FastWay depots:', error);
      return [];
    }
  }

  getMaxWeight(): number {
    return 30; // kg - FastWay weight limit
  }

  getSupportedServiceTypes(): string[] {
    return ['standard', 'express'];
  }

  async getQuote(request: ShippingQuoteRequest): Promise<ShippingQuote | null> {
    if (!this.isConfigured()) {
      logWarn('FastWay API key not configured');
      return null;
    }

    try {
      const response = await fetch(`${FASTWAY_API_URL}/quotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FASTWAY_API_KEY}`,
          'X-Account-Number': FASTWAY_ACCOUNT_NUMBER,
        },
        body: JSON.stringify({
          origin_postal_code: request.origin.postalCode,
          destination_postal_code: request.destination.postalCode,
          weight: request.weight,
          dimensions: request.dimensions,
          service_type: request.serviceType || 'standard',
        }),
      });

      if (!response.ok) {
        throw new Error(`FastWay API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        provider: this.name,
        serviceType: data.service_type || request.serviceType || 'standard',
        estimatedDays: data.estimated_days || 3,
        cost: data.cost || this.estimateCost(request.weight),
        currency: 'ZAR',
      };
    } catch (error) {
      logError('Error fetching shipping quote from FastWay:', error);
      
      // Fallback to estimated cost
      return {
        provider: this.name,
        serviceType: request.serviceType || 'standard',
        estimatedDays: 3,
        cost: this.estimateCost(request.weight),
        currency: 'ZAR',
      };
    }
  }

  private estimateCost(weight: number): number {
    const baseCost = 60; // R60 base cost
    const perKgCost = 12; // R12 per kg
    return Math.round((baseCost + weight * perKgCost) * 100) / 100;
  }

  async createWaybill(request: WaybillRequest): Promise<Waybill | null> {
    if (!this.isConfigured()) {
      logWarn('FastWay API key not configured');
      return null;
    }

    try {
      const response = await fetch(`${FASTWAY_API_URL}/consignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FASTWAY_API_KEY}`,
          'X-Account-Number': FASTWAY_ACCOUNT_NUMBER,
        },
        body: JSON.stringify({
          reference: request.reference,
          sender: {
            name: request.origin.name,
            address: request.origin.address,
            city: request.origin.city,
            province: request.origin.province,
            postal_code: request.origin.postalCode,
            phone: request.origin.phone,
            email: request.origin.email,
          },
          receiver: {
            name: request.destination.name,
            address: request.destination.address,
            city: request.destination.city,
            province: request.destination.province,
            postal_code: request.destination.postalCode,
            phone: request.destination.phone,
            email: request.destination.email,
          },
          items: request.items.map(item => ({
            description: item.description,
            quantity: item.quantity,
            weight: item.weight,
            value: item.value,
          })),
          service_type: request.serviceType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`FastWay API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      return {
        waybillNumber: data.consignment_number || data.tracking_number,
        trackingUrl: data.tracking_url || `https://www.fastway.co.za/track/${data.consignment_number}`,
        cost: data.cost || 0,
        estimatedDelivery: data.estimated_delivery_date 
          ? new Date(data.estimated_delivery_date) 
          : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days default
        provider: this.name,
      };
    } catch (error) {
      logError('Error creating waybill with FastWay:', error);
      return null;
    }
  }

  async getTracking(waybillNumber: string): Promise<TrackingInfo | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const response = await fetch(`${FASTWAY_API_URL}/consignments/${waybillNumber}/tracking`, {
        headers: {
          'Authorization': `Bearer ${FASTWAY_API_KEY}`,
          'X-Account-Number': FASTWAY_ACCOUNT_NUMBER,
        },
      });

      if (!response.ok) {
        throw new Error(`FastWay API error: ${response.statusText}`);
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
      logError('Error fetching tracking info from FastWay:', error);
      return null;
    }
  }

  async cancelWaybill(waybillNumber: string, reason?: string): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const response = await fetch(`${FASTWAY_API_URL}/consignments/${waybillNumber}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FASTWAY_API_KEY}`,
          'X-Account-Number': FASTWAY_ACCOUNT_NUMBER,
        },
        body: JSON.stringify({ reason }),
      });

      return response.ok;
    } catch (error) {
      logError('Error canceling waybill with FastWay:', error);
      return false;
    }
  }
}


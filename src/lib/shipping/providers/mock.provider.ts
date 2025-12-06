/**
 * Mock Shipping Provider
 * For testing and development purposes
 */

import { IShippingProvider } from '../provider.interface';
import {
    CollectionPoint,
    ShippingQuote,
    ShippingQuoteRequest,
    TrackingInfo,
    Waybill,
    WaybillRequest,
} from '../types';

export class MockShippingProvider implements IShippingProvider {
  readonly name = 'mock';
  readonly displayName = 'Mock Shipping Provider';

  private mockWaybills: Map<string, { status: string; created: Date }> = new Map();

  isConfigured(): boolean {
    return true; // Always available for testing
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
    // Return mock collection points
    return [
      {
        id: 'mock-cp-1',
        name: 'Mock Collection Point 1',
        address: '123 Test Street',
        city: city || 'Test City',
        province: province || 'Gauteng',
        postalCode,
        latitude: -26.2041,
        longitude: 28.0473,
        distance: 2.5,
        hours: 'Mon-Fri: 08:00-18:00',
        phone: '+27 11 123 4567',
      },
      {
        id: 'mock-cp-2',
        name: 'Mock Collection Point 2',
        address: '456 Demo Avenue',
        city: city || 'Test City',
        province: province || 'Gauteng',
        postalCode,
        latitude: -26.2141,
        longitude: 28.0573,
        distance: 5.0,
        hours: 'Mon-Sat: 09:00-17:00',
        phone: '+27 11 234 5678',
      },
    ];
  }

  getMaxWeight(): number {
    return 100; // kg
  }

  getSupportedServiceTypes(): string[] {
    return ['standard', 'express', 'overnight'];
  }

  async getQuote(request: ShippingQuoteRequest): Promise<ShippingQuote | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Mock quote calculation
    const baseCost = 50;
    const perKgCost = 10;
    const weightCost = request.weight * perKgCost;
    const sameProvince = request.origin.province === request.destination.province;
    const distanceMultiplier = sameProvince ? 1 : 1.5;
    const estimatedCost = (baseCost + weightCost) * distanceMultiplier;
    const estimatedDays = sameProvince ? 2 : 4;

    return {
      provider: this.name,
      serviceType: request.serviceType || 'standard',
      estimatedDays,
      cost: Math.round(estimatedCost * 100) / 100,
      currency: 'ZAR',
    };
  }

  async createWaybill(request: WaybillRequest): Promise<Waybill | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    const waybillNumber = `MOCK${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Store mock waybill
    this.mockWaybills.set(waybillNumber, {
      status: 'created',
      created: new Date(),
    });

    return {
      waybillNumber,
      trackingUrl: `/tracking/${waybillNumber}`,
      cost: 0, // Mock doesn't charge
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      provider: this.name,
    };
  }

  async getTracking(waybillNumber: string): Promise<TrackingInfo | null> {
    const mockWaybill = this.mockWaybills.get(waybillNumber);

    if (!mockWaybill) {
      return null;
    }

    // Simulate tracking status progression
    const statuses = ['created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered'];
    const daysSinceCreation = Math.floor((Date.now() - mockWaybill.created.getTime()) / (24 * 60 * 60 * 1000));
    const statusIndex = Math.min(daysSinceCreation, statuses.length - 1);
    const status = statuses[statusIndex];

    return {
      status,
      currentLocation: status === 'delivered' ? 'Destination' : 'In Transit',
      estimatedDelivery: new Date(Date.now() + (3 - daysSinceCreation) * 24 * 60 * 60 * 1000),
      history: [
        {
          status: 'created',
          location: 'Origin',
          timestamp: mockWaybill.created,
          notes: 'Waybill created',
        },
        ...(statusIndex > 0 ? [{
          status: statuses[statusIndex],
          location: 'In Transit',
          timestamp: new Date(),
          notes: `Status updated to ${status}`,
        }] : []),
      ],
    };
  }

  async cancelWaybill(waybillNumber: string, reason?: string): Promise<boolean> {
    const mockWaybill = this.mockWaybills.get(waybillNumber);
    if (!mockWaybill) {
      return false;
    }

    mockWaybill.status = 'cancelled';
    return true;
  }
}


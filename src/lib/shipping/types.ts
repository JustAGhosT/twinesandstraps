/**
 * Shared types for shipping providers
 */

export interface Address {
  name: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
}

export interface ShippingQuoteRequest {
  origin: {
    city: string;
    province: string;
    postalCode: string;
  };
  destination: {
    city: string;
    province: string;
    postalCode: string;
  };
  weight: number; // in kg
  dimensions?: {
    length: number; // in cm
    width: number;
    height: number;
  };
  serviceType?: 'standard' | 'express' | 'overnight';
  collectionPointId?: string; // For Pargo collection points
}

export interface ShippingQuote {
  provider: string;
  serviceType: string;
  estimatedDays: number;
  cost: number;
  currency: string;
  collectionPoint?: {
    id: string;
    name: string;
    address: string;
    city: string;
    distance?: number; // km
  };
}

export interface WaybillRequest {
  orderId: string;
  origin: Address;
  destination: Address;
  items: Array<{
    description: string;
    quantity: number;
    weight: number;
    value: number;
  }>;
  serviceType: 'standard' | 'express';
  reference: string;
  collectionPointId?: string; // For Pargo collection points
}

export interface Waybill {
  waybillNumber: string;
  trackingUrl: string;
  cost: number;
  estimatedDelivery: Date;
  provider: string;
}

export interface TrackingInfo {
  status: string;
  currentLocation?: string;
  estimatedDelivery?: Date;
  history: Array<{
    status: string;
    location?: string;
    timestamp: Date;
    notes?: string;
  }>;
}

export interface CollectionPoint {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  distance?: number; // km from search location
  hours?: string;
  phone?: string;
}


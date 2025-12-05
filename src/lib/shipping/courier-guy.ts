/**
 * The Courier Guy API integration
 * Handles shipping quotes, waybill creation, and tracking
 */

const COURIER_GUY_API_KEY = process.env.COURIER_GUY_API_KEY || '';
const COURIER_GUY_API_URL = process.env.COURIER_GUY_API_URL || 'https://api.thecourierguy.co.za';

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
}

export interface ShippingQuote {
  serviceType: string;
  estimatedDays: number;
  cost: number;
  currency: string;
}

export interface WaybillRequest {
  orderId: string;
  origin: {
    name: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    phone: string;
    email: string;
  };
  destination: {
    name: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    phone: string;
    email: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    weight: number;
    value: number;
  }>;
  serviceType: 'standard' | 'express';
  reference: string;
}

export interface Waybill {
  waybillNumber: string;
  trackingUrl: string;
  cost: number;
  estimatedDelivery: Date;
}

/**
 * Check if The Courier Guy is configured
 */
export function isCourierGuyConfigured(): boolean {
  return !!COURIER_GUY_API_KEY;
}

/**
 * Get shipping quote
 */
export async function getShippingQuote(request: ShippingQuoteRequest): Promise<ShippingQuote | null> {
  if (!isCourierGuyConfigured()) {
    console.warn('The Courier Guy API key not configured');
    return null;
  }

  try {
    // This is a placeholder - actual API implementation would go here
    // The Courier Guy API endpoint structure would be:
    // POST /api/v1/quotes
    
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
      serviceType: data.service_type || 'standard',
      estimatedDays: data.estimated_days || 3,
      cost: data.cost || 0,
      currency: data.currency || 'ZAR',
    };
  } catch (error) {
    console.error('Error fetching shipping quote:', error);
    
    // Fallback to estimated cost based on weight and distance
    return estimateShippingCost(request);
  }
}

/**
 * Estimate shipping cost (fallback when API is unavailable)
 */
function estimateShippingCost(request: ShippingQuoteRequest): ShippingQuote {
  const baseCost = 50; // R50 base cost
  const perKgCost = 15; // R15 per kg
  const weightCost = request.weight * perKgCost;
  
  // Simple distance estimation based on provinces
  const sameProvince = request.origin.province === request.destination.province;
  const distanceMultiplier = sameProvince ? 1 : 1.5;
  
  const estimatedCost = (baseCost + weightCost) * distanceMultiplier;
  const estimatedDays = sameProvince ? 3 : 5;

  return {
    serviceType: request.serviceType || 'standard',
    estimatedDays,
    cost: Math.round(estimatedCost * 100) / 100, // Round to 2 decimals
    currency: 'ZAR',
  };
}

/**
 * Create waybill
 */
export async function createWaybill(request: WaybillRequest): Promise<Waybill | null> {
  if (!isCourierGuyConfigured()) {
    console.warn('The Courier Guy API key not configured');
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
    };
  } catch (error) {
    console.error('Error creating waybill:', error);
    return null;
  }
}

/**
 * Get tracking information
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
  if (!isCourierGuyConfigured()) {
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
    console.error('Error fetching tracking info:', error);
    return null;
  }
}


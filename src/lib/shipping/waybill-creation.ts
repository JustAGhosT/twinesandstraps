/**
 * Waybill creation on order confirmation
 * Automatically creates waybills when orders are confirmed
 * Now uses the unified provider system
 */

import { createWaybill } from './service';
import { WaybillRequest } from './types';
import prisma from '../prisma';

export interface OrderForWaybill {
  id: number;
  order_number: string;
  shipping_provider?: string; // Optional: preferred provider (e.g., 'courier-guy', 'pargo')
  collection_point_id?: string; // Optional: for Pargo collection points
  shipping_address: {
    street_address: string;
    city: string;
    province: string;
    postal_code: string;
  } | null;
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
  }>;
  user: {
    name: string;
    email: string;
    phone: string | null;
  } | null;
}

/**
 * Create waybill for confirmed order
 */
export async function createWaybillForOrder(order: OrderForWaybill): Promise<{
  success: boolean;
  waybillNumber?: string;
  trackingUrl?: string;
  provider?: string;
  error?: string;
}> {
  if (!order.shipping_address) {
    return {
      success: false,
      error: 'Order has no shipping address',
    };
  }

  if (!order.user) {
    return {
      success: false,
      error: 'Order has no user information',
    };
  }

  // Get warehouse address from environment or use default
  const warehouseAddress = {
    name: process.env.WAREHOUSE_NAME || 'TASSA Warehouse',
    address: process.env.WAREHOUSE_ADDRESS || '123 Warehouse Street',
    city: process.env.WAREHOUSE_CITY || 'Johannesburg',
    province: process.env.WAREHOUSE_PROVINCE || 'Gauteng',
    postalCode: process.env.WAREHOUSE_POSTAL_CODE || '2000',
    phone: process.env.WAREHOUSE_PHONE || '+27 (0)63 969 0773',
    email: process.env.WAREHOUSE_EMAIL || 'admin@tassa.co.za',
  };

  // Estimate weight and value
  const estimatedWeight = Math.max(1, order.items.length * 0.5); // 0.5kg per item
  const totalValue = order.items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

  const waybillRequest: WaybillRequest = {
    orderId: order.order_number,
    origin: warehouseAddress,
    destination: {
      name: order.user.name,
      address: order.shipping_address.street_address,
      city: order.shipping_address.city,
      province: order.shipping_address.province,
      postalCode: order.shipping_address.postal_code,
      phone: order.user.phone || '',
      email: order.user.email,
    },
    items: order.items.map(item => ({
      description: item.product_name,
      quantity: item.quantity,
      weight: estimatedWeight / order.items.length, // Distribute weight evenly
      value: item.unit_price * item.quantity,
    })),
    serviceType: 'standard', // Can be made configurable per order
    reference: order.order_number,
    collectionPointId: order.collection_point_id,
  };

  try {
    // Use preferred provider if specified, otherwise auto-select
    const waybill = await createWaybill(waybillRequest, order.shipping_provider);

    if (!waybill) {
      return {
        success: false,
        error: 'Failed to create waybill',
      };
    }

    // Update order with tracking number and provider
    await prisma.order.update({
      where: { id: order.id },
      data: {
        tracking_number: waybill.waybillNumber,
        tracking_url: waybill.trackingUrl,
        status: 'SHIPPED',
        shipped_at: new Date(),
        status_history: {
          create: {
            status: 'SHIPPED',
            notes: `Waybill created: ${waybill.waybillNumber} (Provider: ${waybill.provider})`,
          },
        },
      },
    });

    return {
      success: true,
      waybillNumber: waybill.waybillNumber,
      trackingUrl: waybill.trackingUrl,
      provider: waybill.provider,
    };
  } catch (error) {
    console.error('Error creating waybill:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Channel-Specific Pricing
 * Allows different pricing for different sales channels
 */

import prisma from '../prisma';

export type SalesChannel = 'WEBSITE' | 'TAKEALOT' | 'FACEBOOK' | 'GOOGLE_SHOPPING' | 'BOB_SHOP';

export interface ChannelPricing {
  productId: number;
  channel: SalesChannel;
  price: number;
  currency: string;
  markup?: number; // Percentage markup/discount from base price
  isActive: boolean;
}

/**
 * Get price for a product on a specific channel
 */
export async function getChannelPrice(
  productId: number,
  channel: SalesChannel
): Promise<number> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { price: true },
  });

  if (!product) {
    return 0;
  }

  // In production, you'd have a ChannelPricing table
  // For now, apply channel-specific rules:
  const basePrice = product.price;

  switch (channel) {
    case 'TAKEALOT':
      // Takealot typically requires competitive pricing
      // Apply 5% discount to account for commission
      return Math.round(basePrice * 0.95 * 100) / 100;

    case 'FACEBOOK':
    case 'GOOGLE_SHOPPING':
      // Social channels - same as website
      return basePrice;

    case 'BOB_SHOP':
      // Bob Shop - slightly lower for competitiveness
      return Math.round(basePrice * 0.97 * 100) / 100;

    case 'WEBSITE':
    default:
      return basePrice;
  }
}

/**
 * Get all channel prices for a product
 */
export async function getAllChannelPrices(productId: number): Promise<ChannelPricing[]> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { price: true },
  });

  if (!product) {
    return [];
  }

  const channels: SalesChannel[] = ['WEBSITE', 'TAKEALOT', 'FACEBOOK', 'GOOGLE_SHOPPING', 'BOB_SHOP'];

  return Promise.all(
    channels.map(async (channel) => {
      const price = await getChannelPrice(productId, channel);
      const basePrice = product.price;
      const markup = ((price - basePrice) / basePrice) * 100;

      return {
        productId,
        channel,
        price,
        currency: 'ZAR',
        markup: Math.round(markup * 100) / 100,
        isActive: true,
      };
    })
  );
}

/**
 * Update channel-specific price
 */
export async function updateChannelPrice(
  productId: number,
  channel: SalesChannel,
  price: number
): Promise<void> {
  // In production, update ChannelPricing table
  // For now, this is a placeholder
  console.log(`Updating ${channel} price for product ${productId} to R${price}`);
}


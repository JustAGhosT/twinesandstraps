/**
 * Analytics utilities for Google Analytics 4 and Meta Pixel
 */

// Google Analytics 4
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

export const event = (action: string, params: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, params);
  }
};

// E-commerce events
export const trackViewItem = (product: {
  id: number;
  name: string;
  price: number;
  category?: string;
}) => {
  event('view_item', {
    currency: 'ZAR',
    value: product.price,
    items: [
      {
        item_id: product.id.toString(),
        item_name: product.name,
        price: product.price,
        item_category: product.category,
      },
    ],
  });
};

export const trackAddToCart = (product: {
  id: number;
  name: string;
  price: number;
  quantity: number;
  category?: string;
}) => {
  event('add_to_cart', {
    currency: 'ZAR',
    value: product.price * product.quantity,
    items: [
      {
        item_id: product.id.toString(),
        item_name: product.name,
        price: product.price,
        quantity: product.quantity,
        item_category: product.category,
      },
    ],
  });
};

export const trackBeginCheckout = (items: Array<{
  id: number;
  name: string;
  price: number;
  quantity: number;
}>, total: number) => {
  event('begin_checkout', {
    currency: 'ZAR',
    value: total,
    items: items.map(item => ({
      item_id: item.id.toString(),
      item_name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
  });
};

export const trackPurchase = (transactionId: string, items: Array<{
  id: number;
  name: string;
  price: number;
  quantity: number;
}>, total: number) => {
  event('purchase', {
    transaction_id: transactionId,
    currency: 'ZAR',
    value: total,
    items: items.map(item => ({
      item_id: item.id.toString(),
      item_name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
  });
};

// Meta Pixel
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';

export const trackMetaEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, params);
  }
};

// Declare global types for analytics
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}


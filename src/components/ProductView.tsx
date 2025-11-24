'use client';

import React, { useState } from 'react';
import type { Product } from '@prisma/client';

interface ProductViewProps {
  product: Product;
}

const ProductView: React.FC<ProductViewProps> = ({ product }) => {
  const [quantity, setQuantity] = useState(1);
  const totalPrice = product.price * quantity;

  const handleRequestQuote = () => {
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
    
    // Validate WhatsApp number is configured
    if (!whatsappNumber || whatsappNumber === '27XXXXXXXXX') {
      alert('WhatsApp number not configured. Please contact us at info@twinesandstraps.co.za');
      return;
    }
    
    // Sanitize product details for URL encoding
    const sanitizedName = String(product.name || 'Product');
    const sanitizedSku = String(product.sku || 'N/A');
    
    // Create WhatsApp message with quote details
    const message = `Hi! I'd like to request a quote for:\n\nProduct: ${sanitizedName}\nSKU: ${sanitizedSku}\nQuantity: ${quantity}\nPrice per unit: ZAR ${product.price.toFixed(2)}\nTotal: ZAR ${totalPrice.toFixed(2)}\n\nPlease send me a quote. Thank you!`;
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const getStockBadge = () => {
    switch (product.stock_status) {
      case 'IN_STOCK':
        return <span className="inline-block px-3 py-1 text-sm font-semibold text-green-800 bg-green-100 rounded">In Stock</span>;
      case 'LOW_STOCK':
        return <span className="inline-block px-3 py-1 text-sm font-semibold text-yellow-800 bg-yellow-100 rounded">Low Stock</span>;
      case 'OUT_OF_STOCK':
        return <span className="inline-block px-3 py-1 text-sm font-semibold text-red-800 bg-red-100 rounded">Out of Stock</span>;
      default:
        return null;
    }
  };

  const isOutOfStock = product.stock_status === 'OUT_OF_STOCK';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
          {/* Placeholder for a larger image */}
          <span className="text-gray-500 text-lg">Image Gallery</span>
        </div>
      </div>
      <div>
        <div className="mb-4">
          {getStockBadge()}
        </div>
        <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
        <div className="mb-6">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-3xl font-bold text-gray-900">ZAR {product.price.toFixed(2)}</span>
          </div>
        </div>
        <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>
        
        {/* Quantity Selector and Add to Cart */}
        <div className="mb-6 pb-6 border-b">
          <label className="block text-sm font-semibold mb-2">Quantity</label>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center border rounded">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2 hover:bg-gray-100 transition-colors"
                disabled={isOutOfStock}
              >
                -
              </button>
              <input 
                type="number" 
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-center border-x py-2"
                min="1"
                disabled={isOutOfStock}
              />
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="px-4 py-2 hover:bg-gray-100 transition-colors"
                disabled={isOutOfStock}
              >
                +
              </button>
            </div>
            {quantity > 1 && (
              <div className="text-sm text-gray-600">
                <p>Total: ZAR {totalPrice.toFixed(2)}</p>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleRequestQuote}
              disabled={isOutOfStock}
              className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
                isOutOfStock 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              {isOutOfStock ? 'Out of Stock' : 'Request Quote via WhatsApp'}
            </button>
          </div>
        </div>

        {/* Specifications */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Specifications</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 p-3 rounded">
              <span className="text-sm text-gray-600">SKU</span>
              <p className="font-semibold">{product.sku}</p>
            </div>
            {product.material && (
              <div className="bg-gray-50 p-3 rounded">
                <span className="text-sm text-gray-600">Material</span>
                <p className="font-semibold">{product.material}</p>
              </div>
            )}
            {product.diameter && (
              <div className="bg-gray-50 p-3 rounded">
                <span className="text-sm text-gray-600">Diameter</span>
                <p className="font-semibold">{product.diameter}mm</p>
              </div>
            )}
            {product.length && (
              <div className="bg-gray-50 p-3 rounded">
                <span className="text-sm text-gray-600">Length</span>
                <p className="font-semibold">{product.length}m</p>
              </div>
            )}
            {product.strength_rating && (
              <div className="bg-gray-50 p-3 rounded">
                <span className="text-sm text-gray-600">Strength Rating</span>
                <p className="font-semibold">{product.strength_rating}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductView;

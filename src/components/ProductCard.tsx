'use client';

import React, { useState } from 'react';
import type { Product } from '@prisma/client';
import Image from 'next/image';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(product.image_url);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageError, setImageError] = useState(false);

  const getStockBadge = () => {
    switch (product.stock_status) {
      case 'IN_STOCK':
        return <span className="inline-block px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded">In Stock</span>;
      case 'LOW_STOCK':
        return <span className="inline-block px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded">Low Stock</span>;
      case 'OUT_OF_STOCK':
        return <span className="inline-block px-2 py-1 text-xs font-semibold text-red-800 bg-red-100 rounded">Out of Stock</span>;
      default:
        return null;
    }
  };

  const handleGenerateImage = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isGenerating) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/products/${product.id}/generate-image`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        setImageUrl(data.image_url);
        setImageError(false);
      }
    } catch (error) {
      console.error('Failed to generate image:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col bg-white">
      <div className="aspect-square mb-4 relative">
        {imageUrl && !imageError ? (
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover rounded"
            onError={() => setImageError(true)}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="bg-gray-200 w-full h-full flex flex-col items-center justify-center rounded">
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                <span className="text-gray-500 text-sm">Generating...</span>
              </>
            ) : (
              <>
                <span className="text-gray-500 mb-2">No Image</span>
                <button
                  onClick={handleGenerateImage}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Generate with AI
                </button>
              </>
            )}
          </div>
        )}
        <div className="absolute top-2 right-2">
          {getStockBadge()}
        </div>
      </div>
      <div className="flex-grow">
        <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
      </div>
      <div className="mt-4">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-gray-900">ZAR {product.price.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;

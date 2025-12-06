/**
 * Enhanced AI Inventory Optimization
 * Additional AI-powered features for inventory management
 */

import { isAIConfigured } from '@/lib/ai';
import { callAI } from '@/lib/ai';
import prisma from '@/lib/prisma';
import { logInfo, logError } from '@/lib/logging/logger';

/**
 * AI-powered reorder quantity suggestion
 */
export async function suggestReorderQuantity(
  productId: number,
  currentStock: number,
  minStockLevel: number
): Promise<{
  suggestedQuantity: number;
  reasoning: string;
  factors: string[];
  confidence: 'high' | 'medium' | 'low';
}> {
  if (!isAIConfigured()) {
    return {
      suggestedQuantity: minStockLevel * 2,
      reasoning: 'AI not configured, using default calculation',
      factors: ['Default 2x minimum stock'],
      confidence: 'low',
    };
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        order_items: {
          where: {
            order: {
              created_at: {
                gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
              },
            },
          },
          select: {
            quantity: true,
          },
        },
        supplier: true,
      },
    });

    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    const totalSold = product.order_items.reduce((sum, item) => sum + item.quantity, 0);
    const monthlySales = totalSold / 3;
    const supplier = product.supplier;

    const systemPrompt = `You are an inventory optimization AI for Twines and Straps SA.

Calculate optimal reorder quantity considering:
1. Current stock levels
2. Sales velocity (units sold per month)
3. Supplier lead times
4. Minimum order quantities
5. Carrying costs
6. Stockout risk
7. Seasonal trends

Respond in valid JSON:
{
  "suggestedQuantity": 0,
  "reasoning": "explanation",
  "factors": ["factor 1", "factor 2"],
  "confidence": "high|medium|low"
}`;

    const userPrompt = `Calculate reorder quantity for:
- Product: ${product.name}
- Current Stock: ${currentStock}
- Minimum Stock Level: ${minStockLevel}
- Monthly Sales: ${monthlySales.toFixed(1)} units
- Supplier: ${supplier?.name || 'Not assigned'}
- Lead Time: ${supplier?.lead_time_days || 'Unknown'} days
- Min Order Value: ${supplier?.min_order_value ? `R${supplier.min_order_value}` : 'None'}

Provide optimal reorder quantity for South African B2B context.`;

    const response = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }

    const data = JSON.parse(jsonMatch[0]);
    return {
      suggestedQuantity: data.suggestedQuantity || minStockLevel * 2,
      reasoning: data.reasoning || '',
      factors: data.factors || [],
      confidence: data.confidence || 'medium',
    };
  } catch (error) {
    logError('Error suggesting reorder quantity', error, { productId });
    return {
      suggestedQuantity: minStockLevel * 2,
      reasoning: 'Error calculating, using default',
      factors: ['Default calculation'],
      confidence: 'low',
    };
  }
}

/**
 * AI-powered inventory health analysis
 */
export async function analyzeInventoryHealth(): Promise<{
  healthy: number;
  lowStock: number;
  excessStock: number;
  deadStock: number;
  recommendations: Array<{
    productId: number;
    productName: string;
    issue: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}> {
  if (!isAIConfigured()) {
    return {
      healthy: 0,
      lowStock: 0,
      excessStock: 0,
      deadStock: 0,
      recommendations: [],
    };
  }

  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        order_items: {
          where: {
            order: {
              created_at: {
                gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months
              },
            },
          },
          select: {
            quantity: true,
            created_at: true,
          },
        },
      },
    });

    const recommendations: Array<{
      productId: number;
      productName: string;
      issue: string;
      recommendation: string;
      priority: 'high' | 'medium' | 'low';
    }> = [];

    let healthy = 0;
    let lowStock = 0;
    let excessStock = 0;
    let deadStock = 0;

    for (const product of products) {
      const totalSold = product.order_items.reduce((sum, item) => sum + item.quantity, 0);
      const monthlySales = totalSold / 6;
      const stockStatus = product.stock_status;

      if (stockStatus === 'OUT_OF_STOCK') {
        lowStock++;
        recommendations.push({
          productId: product.id,
          productName: product.name,
          issue: 'Out of stock',
          recommendation: 'Urgent reorder required',
          priority: 'high',
        });
      } else if (stockStatus === 'LOW_STOCK') {
        lowStock++;
        recommendations.push({
          productId: product.id,
          productName: product.name,
          issue: 'Low stock',
          recommendation: 'Consider reordering soon',
          priority: 'medium',
        });
      } else if (totalSold === 0 && stockStatus === 'IN_STOCK') {
        deadStock++;
        recommendations.push({
          productId: product.id,
          productName: product.name,
          issue: 'No sales in 6 months',
          recommendation: 'Consider promotions or liquidation',
          priority: 'medium',
        });
      } else if (monthlySales > 0) {
        const monthsOfStock = 100 / (monthlySales || 1); // Assuming 100 units in stock
        if (monthsOfStock > 12) {
          excessStock++;
          recommendations.push({
            productId: product.id,
            productName: product.name,
            issue: `Excess stock (${monthsOfStock.toFixed(1)} months)`,
            recommendation: 'Reduce inventory through promotions or marketplace listings',
            priority: 'low',
          });
        } else {
          healthy++;
        }
      } else {
        healthy++;
      }
    }

    logInfo('Inventory health analysis completed', {
      healthy,
      lowStock,
      excessStock,
      deadStock,
      recommendations: recommendations.length,
    });

    return {
      healthy,
      lowStock,
      excessStock,
      deadStock,
      recommendations,
    };
  } catch (error) {
    logError('Error analyzing inventory health', error);
    return {
      healthy: 0,
      lowStock: 0,
      excessStock: 0,
      deadStock: 0,
      recommendations: [],
    };
  }
}


/**
 * AI-Powered Inventory Optimization
 * Uses AI to provide intelligent recommendations for inventory management
 */

import { isAIConfigured, getAIStatus } from '@/lib/ai';
import { callAI } from '@/lib/ai';
import prisma from '@/lib/prisma';
import { logInfo, logError, logWarn } from '@/lib/logging/logger';

export interface SupplierSearchResult {
  supplierName: string;
  supplierId?: number;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  estimatedCost?: number;
  estimatedLeadTime?: number;
  contactInfo?: string;
}

export interface StockOffsetMethod {
  method: string;
  description: string;
  estimatedValue: number;
  timeframe: string;
  confidence: 'high' | 'medium' | 'low';
  steps: string[];
}

export interface InventoryRecommendation {
  action: 'reorder' | 'reduce' | 'maintain' | 'liquidate';
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
  recommendations: string[];
  estimatedImpact: string;
}

/**
 * AI-powered supplier search for low stock items
 */
export async function findSupplierForLowStock(
  productId: number,
  currentStock: number,
  minStockLevel: number = 10
): Promise<SupplierSearchResult[]> {
  if (!isAIConfigured()) {
    logWarn('AI not configured, cannot search for suppliers', { productId });
    return [];
  }

  try {
    // Get product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        supplier: true,
      },
    });

    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    // Get all suppliers
    const suppliers = await prisma.supplier.findMany({
      where: { is_active: true },
      select: {
        id: true,
        name: true,
        contact_name: true,
        email: true,
        phone: true,
        default_markup: true,
        lead_time_days: true,
      },
    });

    const systemPrompt = `You are an inventory management AI assistant for Twines and Straps SA, a South African manufacturer of industrial twines, ropes, and strapping materials.

When a product is running low on stock, you need to help find the best supplier to reorder from. Consider:
1. Supplier reliability and lead times
2. Product compatibility (materials, specifications)
3. Pricing and margins
4. Existing supplier relationships
5. South African market availability

Always respond in valid JSON format with this structure:
{
  "suppliers": [
    {
      "supplierName": "name",
      "reason": "why this supplier is suitable",
      "confidence": "high|medium|low",
      "estimatedCost": 0,
      "estimatedLeadTime": 0,
      "contactInfo": "contact details"
    }
  ]
}`;

    const userPrompt = `Product needs restocking:
- Product Name: ${product.name}
- SKU: ${product.sku}
- Material: ${product.material || 'Not specified'}
- Current Stock: ${currentStock}
- Minimum Stock Level: ${minStockLevel}
- Category: ${product.category?.name || 'General'}
- Current Supplier: ${product.supplier?.name || 'None'}
- Supplier Price: ${product.supplier_price ? `R${product.supplier_price.toFixed(2)}` : 'Unknown'}

Available Suppliers:
${suppliers.map(s => `- ${s.name} (ID: ${s.id}, Lead Time: ${s.lead_time_days || 'Unknown'} days, Default Markup: ${s.default_markup}%)`).join('\n')}

Recommend the best suppliers for reordering this product. Consider material compatibility, lead times, and pricing.`;

    logInfo('Searching for suppliers using AI', { productId, productName: product.name });

    const response = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }

    const data = JSON.parse(jsonMatch[0]);
    
    // Enhance results with actual supplier IDs
    const results: SupplierSearchResult[] = (data.suppliers || []).map((result: any) => {
      const supplier = suppliers.find(s => 
        s.name.toLowerCase().includes(result.supplierName.toLowerCase()) ||
        result.supplierName.toLowerCase().includes(s.name.toLowerCase())
      );

      return {
        supplierName: result.supplierName,
        supplierId: supplier?.id,
        reason: result.reason,
        confidence: result.confidence || 'medium',
        estimatedCost: result.estimatedCost,
        estimatedLeadTime: result.estimatedLeadTime || supplier?.lead_time_days,
        contactInfo: supplier ? `${supplier.contact_name || ''} ${supplier.email || ''} ${supplier.phone || ''}`.trim() : result.contactInfo,
      };
    });

    logInfo('AI supplier search completed', { 
      productId, 
      resultsCount: results.length,
      suppliers: results.map(r => r.supplierName),
    });

    return results;
  } catch (error) {
    logError('Error finding supplier for low stock', error, { productId });
    return [];
  }
}

/**
 * AI-powered offset method search for excess stock
 */
export async function findOffsetMethodsForExcessStock(
  productId: number,
  currentStock: number,
  averageMonthlySales?: number
): Promise<StockOffsetMethod[]> {
  if (!isAIConfigured()) {
    logWarn('AI not configured, cannot find offset methods', { productId });
    return [];
  }

  try {
    // Get product details and sales data
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        order_items: {
          where: {
            order: {
              created_at: {
                gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
              },
            },
          },
          select: {
            quantity: true,
          },
        },
      },
    });

    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    // Calculate sales rate
    const totalSold = product.order_items.reduce((sum, item) => sum + item.quantity, 0);
    const monthlySales = averageMonthlySales || (totalSold / 3); // 90 days = 3 months
    const monthsOfStock = currentStock / (monthlySales || 1);
    const excessMonths = monthsOfStock > 6 ? monthsOfStock - 6 : 0; // Excess if more than 6 months stock

    const systemPrompt = `You are an inventory optimization AI for Twines and Straps SA, a South African B2B supplier of industrial twines, ropes, and strapping materials.

When products have excess inventory (more than 6 months of stock), suggest methods to reduce stock levels while maximizing value recovery. Consider:
1. Promotions and discounts
2. Bundle deals
3. Marketplace listings
4. B2B bulk discounts
5. Alternative markets or channels
6. Cross-selling opportunities

Always respond in valid JSON format:
{
  "methods": [
    {
      "method": "method name",
      "description": "detailed description",
      "estimatedValue": 0,
      "timeframe": "expected timeframe",
      "confidence": "high|medium|low",
      "steps": ["step 1", "step 2"]
    }
  ]
}`;

    const userPrompt = `Product has excess inventory:
- Product Name: ${product.name}
- SKU: ${product.sku}
- Current Stock: ${currentStock}
- Average Monthly Sales: ${monthlySales.toFixed(1)} units
- Months of Stock: ${monthsOfStock.toFixed(1)} months
- Excess: ${excessMonths.toFixed(1)} months worth
- Current Price: R${product.price.toFixed(2)}
- Category: ${product.category?.name || 'General'}
- Material: ${product.material || 'Not specified'}

Suggest practical methods to reduce this excess stock while maximizing value recovery for the South African B2B market.`;

    logInfo('Searching for offset methods using AI', { 
      productId, 
      productName: product.name,
      excessMonths: excessMonths.toFixed(1),
    });

    const response = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid AI response format');
    }

    const data = JSON.parse(jsonMatch[0]);
    const results: StockOffsetMethod[] = (data.methods || []).map((method: any) => ({
      method: method.method,
      description: method.description,
      estimatedValue: method.estimatedValue || 0,
      timeframe: method.timeframe || 'Unknown',
      confidence: method.confidence || 'medium',
      steps: method.steps || [],
    }));

    logInfo('AI offset method search completed', { 
      productId, 
      methodsCount: results.length,
      methods: results.map(m => m.method),
    });

    return results;
  } catch (error) {
    logError('Error finding offset methods for excess stock', error, { productId });
    return [];
  }
}

/**
 * AI-powered inventory recommendation
 */
export async function getInventoryRecommendation(
  productId: number
): Promise<InventoryRecommendation | null> {
  if (!isAIConfigured()) {
    return null;
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
      },
    });

    if (!product) {
      return null;
    }

    // Calculate inventory metrics
    const totalSold = product.order_items.reduce((sum, item) => sum + item.quantity, 0);
    const monthlySales = totalSold / 3;
    const stockStatus = product.stock_status;
    const isLowStock = stockStatus === 'LOW_STOCK' || stockStatus === 'OUT_OF_STOCK';
    const currentStock = isLowStock ? 0 : 100; // Simplified - would get from actual stock

    const systemPrompt = `You are an inventory optimization AI for Twines and Straps SA.

Analyze inventory status and provide actionable recommendations. Consider:
- Current stock levels
- Sales velocity
- Product lifecycle
- Market demand
- Supplier availability

Respond in valid JSON:
{
  "action": "reorder|reduce|maintain|liquidate",
  "priority": "high|medium|low",
  "reasoning": "explanation",
  "recommendations": ["action 1", "action 2"],
  "estimatedImpact": "expected outcome"
}`;

    const userPrompt = `Analyze inventory for:
- Product: ${product.name}
- SKU: ${product.sku}
- Stock Status: ${stockStatus}
- Monthly Sales: ${monthlySales.toFixed(1)} units
- Price: R${product.price.toFixed(2)}
- Category: ${product.category?.name || 'General'}

Provide inventory management recommendation.`;

    const response = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }

    const data = JSON.parse(jsonMatch[0]);
    return {
      action: data.action || 'maintain',
      priority: data.priority || 'medium',
      reasoning: data.reasoning || '',
      recommendations: data.recommendations || [],
      estimatedImpact: data.estimatedImpact || '',
    };
  } catch (error) {
    logError('Error getting inventory recommendation', error, { productId });
    return null;
  }
}


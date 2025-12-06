import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { logInfo, logError, logWarn, logDebug } from '@/lib/logging/logger';

import { 
  isAIConfigured,
  getAIStatus,
  analyzeProduct, 
  enhanceDescription, 
  getMarketResearch, 
  suggestPricing,
  performSWOTAnalysis,
  performCompetitorResearch,
  getProductRecommendations,
  getBusinessInsights
} from '@/lib/ai';

/**
 * AI-powered product analysis and enhancement endpoints
 * 
 * POST /api/admin/ai
 * Body: { action: string, ...params }
 * 
 * Actions:
 * - analyze: Analyze a product for market insights
 * - enhance-description: Improve product description
 * - market-research: Get market research for a category
 * - suggest-pricing: Get pricing suggestions
 * - swot-analysis: Perform SWOT analysis
 * - competitor-research: Deep competitor analysis
 * - product-recommendations: Get product bundle and cross-sell recommendations
 * - business-insights: Get strategic business insights
 * - status: Check if AI is configured
 */
export async function POST(request: NextRequest) {
  // Verify admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { action, ...params } = body;

    // Check AI configuration status
    if (action === 'status') {
      const status = getAIStatus();
      return NextResponse.json({
        configured: status.configured,
        provider: status.provider,
        message: status.message,
      });
    }

    // Validate AI is configured for other actions
    if (!isAIConfigured()) {
      const status = getAIStatus();
      return NextResponse.json(
        { 
          error: 'AI not configured',
          message: status.message,
        },
        { status: 503 }
      );
    }

    switch (action) {
      case 'analyze': {
        const { name, description, material, category, currentPrice } = params;
        
        if (!name || !description || currentPrice === undefined) {
          return NextResponse.json(
            { error: 'Missing required fields: name, description, currentPrice' },
            { status: 400 }
          );
        }

        const price = parseFloat(currentPrice);
        if (isNaN(price) || price < 0) {
          return NextResponse.json(
            { error: 'Invalid price format. Price must be a positive number.' },
            { status: 400 }
          );
        }

        const analysis = await analyzeProduct({
          name,
          description,
          material,
          category,
          currentPrice: price,
        });

        return NextResponse.json({ success: true, data: analysis });
      }

      case 'enhance-description': {
        const { description, name, material, specifications } = params;
        
        if (!description || !name) {
          return NextResponse.json(
            { error: 'Missing required fields: description, name' },
            { status: 400 }
          );
        }

        const enhanced = await enhanceDescription(description, {
          name,
          material,
          specifications,
        });

        return NextResponse.json({ success: true, data: enhanced });
      }

      case 'market-research': {
        const { category } = params;
        
        if (!category) {
          return NextResponse.json(
            { error: 'Missing required field: category' },
            { status: 400 }
          );
        }

        const research = await getMarketResearch(category);

        return NextResponse.json({ success: true, data: research });
      }

      case 'suggest-pricing': {
        const { name, material, specifications, similarProducts } = params;
        
        if (!name) {
          return NextResponse.json(
            { error: 'Missing required field: name' },
            { status: 400 }
          );
        }

        const pricing = await suggestPricing({
          name,
          material,
          specifications,
          similarProducts,
        });

        return NextResponse.json({ success: true, data: pricing });
      }

      case 'swot-analysis': {
        const { productName, category, description, businessContext } = params;

        const swot = await performSWOTAnalysis({
          productName,
          category,
          description,
          businessContext,
        });

        return NextResponse.json({ success: true, data: swot });
      }

      case 'competitor-research': {
        const { category, productTypes, region } = params;

        if (!category) {
          return NextResponse.json(
            { error: 'Missing required field: category' },
            { status: 400 }
          );
        }

        const competitors = await performCompetitorResearch({
          category,
          productTypes,
          region,
        });

        return NextResponse.json({ success: true, data: competitors });
      }

      case 'product-recommendations': {
        const { currentProduct, category, customerSegment, existingProducts } = params;

        if (!currentProduct) {
          return NextResponse.json(
            { error: 'Missing required field: currentProduct' },
            { status: 400 }
          );
        }

        const recommendations = await getProductRecommendations({
          currentProduct,
          category,
          customerSegment,
          existingProducts,
        });

        return NextResponse.json({ success: true, data: recommendations });
      }

      case 'business-insights': {
        const { focusArea, currentChallenges, goals } = params;

        const insights = await getBusinessInsights({
          focusArea,
          currentChallenges,
          goals,
        });

        return NextResponse.json({ success: true, data: insights });
      }

      default:
        return NextResponse.json(
          { 
            error: 'Unknown action', 
            validActions: [
              'status', 
              'analyze', 
              'enhance-description', 
              'market-research', 
              'suggest-pricing',
              'swot-analysis',
              'competitor-research',
              'product-recommendations',
              'business-insights'
            ] 
          },
          { status: 400 }
        );
    }
  } catch (error) {
    logError('AI API error:', error);
    return NextResponse.json(
      { 
        error: 'AI operation failed',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/ai
 * Returns AI configuration status
 */
export async function GET(request: NextRequest) {
  // Verify admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  const status = getAIStatus();
  return NextResponse.json({
    configured: status.configured,
    provider: status.provider,
    message: status.message,
    features: [
      'Product market analysis',
      'Description enhancement',
      'Market research',
      'Pricing suggestions',
      'SWOT analysis',
      'Competitor research',
      'Product recommendations',
      'Business insights',
    ],
  });
}

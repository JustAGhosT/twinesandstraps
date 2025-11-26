import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { 
  isAIConfigured, 
  analyzeProduct, 
  enhanceDescription, 
  getMarketResearch, 
  suggestPricing 
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
 * - status: Check if AI is configured
 */
export async function POST(request: NextRequest) {
  // Verify admin authentication
  const authError = requireAdminAuth(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { action, ...params } = body;

    // Check AI configuration status
    if (action === 'status') {
      return NextResponse.json({
        configured: isAIConfigured(),
        message: isAIConfigured() 
          ? 'AI features are available' 
          : 'AI is not configured. Set AZURE_AI_ENDPOINT and AZURE_AI_API_KEY in environment variables.',
      });
    }

    // Validate AI is configured for other actions
    if (!isAIConfigured()) {
      return NextResponse.json(
        { 
          error: 'AI not configured',
          message: 'Azure AI is not configured. Please set AZURE_AI_ENDPOINT and AZURE_AI_API_KEY environment variables.',
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

        const analysis = await analyzeProduct({
          name,
          description,
          material,
          category,
          currentPrice: parseFloat(currentPrice),
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

      default:
        return NextResponse.json(
          { error: 'Unknown action', validActions: ['status', 'analyze', 'enhance-description', 'market-research', 'suggest-pricing'] },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('AI API error:', error);
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
  const authError = requireAdminAuth(request);
  if (authError) return authError;

  return NextResponse.json({
    configured: isAIConfigured(),
    message: isAIConfigured() 
      ? 'AI features are available' 
      : 'AI is not configured. Set AZURE_AI_ENDPOINT and AZURE_AI_API_KEY in environment variables.',
    features: [
      'Product market analysis',
      'Description enhancement',
      'Market research',
      'Pricing suggestions',
    ],
  });
}

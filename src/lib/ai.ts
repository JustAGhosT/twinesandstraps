/**
 * AI Integration Library for Azure OpenAI
 * 
 * This module provides AI-powered features for product management:
 * - Market research and competitor analysis
 * - Price suggestions
 * - Description enhancement
 * - Product insights
 */

// AI Configuration from environment variables
const AZURE_AI_ENDPOINT = process.env.AZURE_AI_ENDPOINT;
const AZURE_AI_API_KEY = process.env.AZURE_AI_API_KEY;
const AZURE_AI_DEPLOYMENT_NAME = process.env.AZURE_AI_DEPLOYMENT_NAME || 'gpt-4o';

/**
 * Check if AI features are configured
 */
export function isAIConfigured(): boolean {
  return Boolean(AZURE_AI_ENDPOINT && AZURE_AI_API_KEY);
}

/**
 * AI response for product analysis
 */
export interface ProductAnalysis {
  marketInsights: string;
  competitorAnalysis: string;
  priceSuggestion: {
    recommended: number;
    range: { min: number; max: number };
    reasoning: string;
  };
  descriptionSuggestions: string[];
}

/**
 * AI response for description enhancement
 */
export interface DescriptionEnhancement {
  enhanced: string;
  seoOptimized: string;
  keyFeatures: string[];
  callToAction: string;
}

/**
 * Call Azure OpenAI API
 */
async function callAzureOpenAI(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  temperature: number = 0.7
): Promise<string> {
  if (!isAIConfigured()) {
    throw new Error('Azure AI is not configured. Please set AZURE_AI_ENDPOINT and AZURE_AI_API_KEY environment variables.');
  }

  const url = `${AZURE_AI_ENDPOINT}/openai/deployments/${AZURE_AI_DEPLOYMENT_NAME}/chat/completions?api-version=2024-02-01`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': AZURE_AI_API_KEY!,
    },
    body: JSON.stringify({
      messages,
      temperature,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Azure OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

/**
 * Analyze a product for market insights, competitor analysis, and pricing suggestions
 */
export async function analyzeProduct(product: {
  name: string;
  description: string;
  material?: string | null;
  category?: string;
  currentPrice: number;
}): Promise<ProductAnalysis> {
  const systemPrompt = `You are an expert in industrial products, specifically twines, ropes, and strapping materials for the South African market. 
  
Analyze products and provide:
1. Market insights about demand and trends
2. Competitor analysis and positioning
3. Price suggestions in South African Rand (ZAR)
4. Description improvement suggestions

Always respond in valid JSON format with the following structure:
{
  "marketInsights": "string with market analysis",
  "competitorAnalysis": "string with competitor information",
  "priceSuggestion": {
    "recommended": number,
    "range": { "min": number, "max": number },
    "reasoning": "string explaining the price logic"
  },
  "descriptionSuggestions": ["array", "of", "suggestions"]
}`;

  const userPrompt = `Analyze this industrial product:
  
Name: ${product.name}
Description: ${product.description}
Material: ${product.material || 'Not specified'}
Category: ${product.category || 'General'}
Current Price: R${product.currentPrice.toFixed(2)}

Provide market insights, competitor analysis, pricing suggestions (in ZAR), and description improvements for the South African industrial market.`;

  try {
    const response = await callAzureOpenAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from AI');
    }
    
    return JSON.parse(jsonMatch[0]) as ProductAnalysis;
  } catch (error) {
    console.error('Error analyzing product:', error);
    throw error;
  }
}

/**
 * Enhance a product description for better SEO and customer engagement
 */
export async function enhanceDescription(
  currentDescription: string,
  productDetails: {
    name: string;
    material?: string | null;
    specifications?: string;
  }
): Promise<DescriptionEnhancement> {
  const systemPrompt = `You are an expert copywriter specializing in industrial B2B products for the South African market. 
  
Enhance product descriptions to be:
1. Clear and professional
2. SEO-optimized with relevant keywords
3. Highlighting key features and benefits
4. Including a compelling call to action

Always respond in valid JSON format with the following structure:
{
  "enhanced": "string with improved description",
  "seoOptimized": "string with SEO keywords integrated",
  "keyFeatures": ["array", "of", "key", "features"],
  "callToAction": "string with compelling CTA"
}`;

  const userPrompt = `Enhance this product description for Twines and Straps SA, a South African industrial twines and ropes manufacturer:

Product Name: ${productDetails.name}
Material: ${productDetails.material || 'Not specified'}
Additional Specs: ${productDetails.specifications || 'None provided'}

Current Description:
${currentDescription}

Provide an enhanced description suitable for a B2B e-commerce website.`;

  try {
    const response = await callAzureOpenAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from AI');
    }
    
    return JSON.parse(jsonMatch[0]) as DescriptionEnhancement;
  } catch (error) {
    console.error('Error enhancing description:', error);
    throw error;
  }
}

/**
 * Get market research for a product category
 */
export async function getMarketResearch(category: string): Promise<{
  overview: string;
  trends: string[];
  opportunities: string[];
  challenges: string[];
  competitors: string[];
}> {
  const systemPrompt = `You are a market research expert specializing in industrial supplies and materials for the South African market.

Provide comprehensive market research analysis in valid JSON format with the following structure:
{
  "overview": "string with market overview",
  "trends": ["array", "of", "current", "trends"],
  "opportunities": ["array", "of", "market", "opportunities"],
  "challenges": ["array", "of", "industry", "challenges"],
  "competitors": ["array", "of", "known", "competitors"]
}`;

  const userPrompt = `Provide market research for the "${category}" category in the South African industrial supplies market, focusing on twines, ropes, and strapping materials.`;

  try {
    const response = await callAzureOpenAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from AI');
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error getting market research:', error);
    throw error;
  }
}

/**
 * Suggest pricing for a new product based on similar products
 */
export async function suggestPricing(product: {
  name: string;
  material?: string | null;
  specifications?: string;
  similarProducts?: Array<{ name: string; price: number }>;
}): Promise<{
  suggested: number;
  range: { min: number; max: number };
  factors: string[];
  strategy: string;
}> {
  const systemPrompt = `You are a pricing strategist specializing in industrial B2B products for the South African market.

Suggest optimal pricing in South African Rand (ZAR) considering:
1. Material costs and quality
2. Market positioning
3. Competitor pricing
4. Value proposition

Always respond in valid JSON format with the following structure:
{
  "suggested": number,
  "range": { "min": number, "max": number },
  "factors": ["array", "of", "pricing", "factors"],
  "strategy": "string explaining pricing strategy"
}`;

  const similarProductsInfo = product.similarProducts
    ? `\nSimilar products in our catalog:\n${product.similarProducts.map(p => `- ${p.name}: R${p.price.toFixed(2)}`).join('\n')}`
    : '';

  const userPrompt = `Suggest pricing for this new industrial product:

Name: ${product.name}
Material: ${product.material || 'Not specified'}
Specifications: ${product.specifications || 'Standard specifications'}
${similarProductsInfo}

Provide a pricing recommendation in South African Rand (ZAR).`;

  try {
    const response = await callAzureOpenAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from AI');
    }
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error suggesting pricing:', error);
    throw error;
  }
}

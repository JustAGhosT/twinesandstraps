/**
 * AI Integration Library for Azure OpenAI and OpenAI
 * 
 * This module provides AI-powered features for product management:
 * - Market research and competitor analysis
 * - Price suggestions
 * - Description enhancement
 * - Product insights
 * - SWOT analysis
 * - Competitor research
 * - Product recommendations
 * - Business insights
 * 
 * Supports both Azure OpenAI and OpenAI API (set OPENAI_API_KEY for OpenAI)
 */

// Company configuration - can be customized per deployment
const COMPANY_NAME = process.env.COMPANY_NAME || 'Twines and Straps SA';
const COMPANY_FULL_NAME = process.env.COMPANY_FULL_NAME || 'Twines and Straps SA (Pty) Ltd';
const COMPANY_INDUSTRY = process.env.COMPANY_INDUSTRY || 'industrial twines, ropes, and strapping materials';

// AI Configuration from environment variables
const AZURE_AI_ENDPOINT = process.env.AZURE_AI_ENDPOINT;
const AZURE_AI_API_KEY = process.env.AZURE_AI_API_KEY;
const AZURE_AI_DEPLOYMENT_NAME = process.env.AZURE_AI_DEPLOYMENT_NAME || 'gpt-4o';

// OpenAI API configuration (alternative to Azure)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

/**
 * Determine which AI provider to use (Azure is preferred if both are configured)
 */
function getAIProvider(): 'azure' | 'openai' | null {
  // Prefer Azure OpenAI if configured
  if (AZURE_AI_ENDPOINT && AZURE_AI_API_KEY) return 'azure';
  // Fall back to OpenAI if Azure is not configured
  if (OPENAI_API_KEY) return 'openai';
  return null;
}

/**
 * Check if AI features are configured
 */
export function isAIConfigured(): boolean {
  return getAIProvider() !== null;
}

/**
 * Get AI configuration status with detailed provider info
 */
export function getAIStatus(): { 
  configured: boolean; 
  provider: 'azure' | 'openai' | null;
  message: string;
} {
  const provider = getAIProvider();
  
  if (provider === 'azure') {
    return {
      configured: true,
      provider: 'azure',
      message: 'Using Azure OpenAI (preferred provider)',
    };
  }
  
  if (provider === 'openai') {
    return {
      configured: true,
      provider: 'openai',
      message: 'Using OpenAI API (Azure not configured)',
    };
  }
  
  return {
    configured: false,
    provider: null,
    message: 'AI is not configured. Set AZURE_AI_ENDPOINT + AZURE_AI_API_KEY (preferred), or OPENAI_API_KEY as alternative.',
  };
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
 * Call OpenAI API directly
 */
async function callOpenAI(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  temperature: number = 0.7
): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      temperature,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

/**
 * Call the configured AI provider
 */
async function callAI(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  temperature: number = 0.7
): Promise<string> {
  const provider = getAIProvider();
  
  if (!provider) {
    throw new Error('AI is not configured. Please set AZURE_AI_ENDPOINT and AZURE_AI_API_KEY, or OPENAI_API_KEY environment variables.');
  }
  
  if (provider === 'azure') {
    return callAzureOpenAI(messages, temperature);
  }
  
  return callOpenAI(messages, temperature);
}

/**
 * Safely extract and parse JSON from AI response
 * The AI may include text before/after the JSON, so we find the first valid JSON object
 */
function extractJSON<T>(response: string): T {
  // Try to parse the response directly first
  try {
    return JSON.parse(response) as T;
  } catch {
    // If direct parsing fails, try to find a JSON object in the response
  }

  // Find the first { and try to find its matching }
  const startIndex = response.indexOf('{');
  if (startIndex === -1) {
    throw new Error('No JSON object found in response');
  }

  let depth = 0;
  let endIndex = -1;
  
  for (let i = startIndex; i < response.length; i++) {
    if (response[i] === '{') depth++;
    if (response[i] === '}') depth--;
    if (depth === 0) {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    throw new Error('Invalid JSON structure in response');
  }

  const jsonStr = response.substring(startIndex, endIndex + 1);
  
  try {
    return JSON.parse(jsonStr) as T;
  } catch (e) {
    throw new Error(`Failed to parse JSON from AI response: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
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
    const response = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    return extractJSON<ProductAnalysis>(response);
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
    const response = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    return extractJSON<DescriptionEnhancement>(response);
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
    const response = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    return extractJSON<{
      overview: string;
      trends: string[];
      opportunities: string[];
      challenges: string[];
      competitors: string[];
    }>(response);
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
    const response = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);

    return extractJSON<{
      suggested: number;
      range: { min: number; max: number };
      factors: string[];
      strategy: string;
    }>(response);
  } catch (error) {
    console.error('Error suggesting pricing:', error);
    throw error;
  }
}

/**
 * SWOT Analysis for a product or business category
 */
export interface SWOTAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  summary: string;
  recommendations: string[];
}

export async function performSWOTAnalysis(context: {
  productName?: string;
  category?: string;
  description?: string;
  businessContext?: string;
}): Promise<SWOTAnalysis> {
  const systemPrompt = `You are a strategic business analyst specializing in the South African industrial supplies market, particularly in twines, ropes, and strapping materials.

Perform a comprehensive SWOT analysis considering:
- The South African industrial market dynamics
- Import/export factors and local manufacturing advantages
- Competition from international suppliers
- Twines and Straps SA's position as a local manufacturer

Always respond in valid JSON format with the following structure:
{
  "strengths": ["array of 4-6 key strengths"],
  "weaknesses": ["array of 3-5 weaknesses to address"],
  "opportunities": ["array of 4-6 market opportunities"],
  "threats": ["array of 3-5 potential threats"],
  "summary": "brief executive summary of the analysis",
  "recommendations": ["array of 3-5 actionable recommendations"]
}`;

  const userPrompt = `Perform a SWOT analysis for Twines and Straps SA with the following context:

Company: Twines and Straps SA (Pty) Ltd - South African manufacturer of industrial twines and ropes
Product/Category: ${context.productName || context.category || 'Industrial twines and ropes'}
Description: ${context.description || 'Industrial-grade twines, ropes, and strapping materials for various applications'}
Additional Context: ${context.businessContext || 'B2B supplier serving agricultural, manufacturing, and logistics sectors'}

Provide detailed strategic insights for the South African market.`;

  try {
    const response = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], 0.6);

    return extractJSON<SWOTAnalysis>(response);
  } catch (error) {
    console.error('Error performing SWOT analysis:', error);
    throw error;
  }
}

/**
 * Deep competitor research and analysis
 */
export interface CompetitorResearch {
  competitors: Array<{
    name: string;
    type: 'local' | 'international' | 'online';
    strengths: string[];
    weaknesses: string[];
    pricePosition: 'budget' | 'mid-range' | 'premium';
  }>;
  marketPosition: string;
  competitiveAdvantages: string[];
  areasForImprovement: string[];
  strategicRecommendations: string[];
}

export async function performCompetitorResearch(context: {
  category: string;
  productTypes?: string[];
  region?: string;
}): Promise<CompetitorResearch> {
  const systemPrompt = `You are a competitive intelligence analyst specializing in the South African industrial supplies market.

Research and analyze competitors in the twines, ropes, and strapping industry considering:
- Local South African manufacturers
- International importers and distributors
- Online marketplaces and suppliers
- Price positioning and market share

Provide actionable competitive intelligence in valid JSON format:
{
  "competitors": [
    {
      "name": "competitor name",
      "type": "local|international|online",
      "strengths": ["key strengths"],
      "weaknesses": ["known weaknesses"],
      "pricePosition": "budget|mid-range|premium"
    }
  ],
  "marketPosition": "analysis of Twines and Straps SA's position",
  "competitiveAdvantages": ["current advantages"],
  "areasForImprovement": ["areas to develop"],
  "strategicRecommendations": ["actionable recommendations"]
}`;

  const userPrompt = `Conduct competitor research for Twines and Straps SA:

Category Focus: ${context.category}
Product Types: ${context.productTypes?.join(', ') || 'Industrial twines, ropes, strapping materials'}
Geographic Focus: ${context.region || 'South Africa (with consideration of African export markets)'}

Identify key competitors, their positioning, and provide strategic recommendations for competitive advantage.`;

  try {
    const response = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], 0.6);

    return extractJSON<CompetitorResearch>(response);
  } catch (error) {
    console.error('Error performing competitor research:', error);
    throw error;
  }
}

/**
 * Product bundle and cross-sell recommendations
 */
export interface ProductRecommendations {
  relatedProducts: Array<{
    suggestion: string;
    reason: string;
    potentialMargin: 'low' | 'medium' | 'high';
  }>;
  bundleIdeas: Array<{
    name: string;
    products: string[];
    targetCustomer: string;
    valueProposition: string;
  }>;
  crossSellOpportunities: string[];
  upSellStrategies: string[];
}

export async function getProductRecommendations(context: {
  currentProduct: string;
  category?: string;
  customerSegment?: string;
  existingProducts?: string[];
}): Promise<ProductRecommendations> {
  const systemPrompt = `You are a product strategy consultant for industrial B2B suppliers in South Africa.

Analyze product opportunities and provide recommendations for:
- Related products that complement existing offerings
- Product bundles for different customer segments
- Cross-selling opportunities
- Upselling strategies

Consider the industrial twines and ropes market context.

Respond in valid JSON format:
{
  "relatedProducts": [
    {
      "suggestion": "product idea",
      "reason": "why this fits",
      "potentialMargin": "low|medium|high"
    }
  ],
  "bundleIdeas": [
    {
      "name": "bundle name",
      "products": ["product list"],
      "targetCustomer": "customer segment",
      "valueProposition": "why customers would buy"
    }
  ],
  "crossSellOpportunities": ["opportunities"],
  "upSellStrategies": ["strategies"]
}`;

  const existingProductsInfo = context.existingProducts?.length 
    ? `\nExisting product catalog includes: ${context.existingProducts.join(', ')}`
    : '';

  const userPrompt = `Provide product recommendations for Twines and Straps SA:

Current Product Focus: ${context.currentProduct}
Category: ${context.category || 'Industrial supplies'}
Target Customer Segment: ${context.customerSegment || 'B2B industrial, agricultural, and logistics'}
${existingProductsInfo}

Suggest related products, bundles, and sales strategies for the South African market.`;

  try {
    const response = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], 0.7);

    return extractJSON<ProductRecommendations>(response);
  } catch (error) {
    console.error('Error getting product recommendations:', error);
    throw error;
  }
}

/**
 * Business insights and strategic recommendations
 */
export interface BusinessInsights {
  marketTrends: Array<{
    trend: string;
    impact: 'positive' | 'negative' | 'neutral';
    timeframe: 'immediate' | 'short-term' | 'long-term';
    recommendation: string;
  }>;
  growthOpportunities: Array<{
    opportunity: string;
    investmentLevel: 'low' | 'medium' | 'high';
    potentialReturn: string;
    implementation: string;
  }>;
  riskAssessment: Array<{
    risk: string;
    likelihood: 'low' | 'medium' | 'high';
    mitigation: string;
  }>;
  actionPlan: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    timeline: string;
    expectedOutcome: string;
  }>;
}

export async function getBusinessInsights(context: {
  focusArea?: string;
  currentChallenges?: string[];
  goals?: string[];
}): Promise<BusinessInsights> {
  const systemPrompt = `You are a senior business strategist advising Twines and Straps SA, a South African manufacturer of industrial twines and ropes.

Provide strategic business insights considering:
- The South African economic environment
- Manufacturing sector dynamics
- Export opportunities in Africa
- E-commerce and digital transformation
- Sustainability trends in industrial supplies

Respond in valid JSON format:
{
  "marketTrends": [
    {
      "trend": "description",
      "impact": "positive|negative|neutral",
      "timeframe": "immediate|short-term|long-term",
      "recommendation": "what to do"
    }
  ],
  "growthOpportunities": [
    {
      "opportunity": "description",
      "investmentLevel": "low|medium|high",
      "potentialReturn": "expected ROI",
      "implementation": "how to implement"
    }
  ],
  "riskAssessment": [
    {
      "risk": "description",
      "likelihood": "low|medium|high",
      "mitigation": "how to mitigate"
    }
  ],
  "actionPlan": [
    {
      "action": "specific action",
      "priority": "high|medium|low",
      "timeline": "when to complete",
      "expectedOutcome": "what success looks like"
    }
  ]
}`;

  const challengesInfo = context.currentChallenges?.length
    ? `\nCurrent Challenges: ${context.currentChallenges.join('; ')}`
    : '';

  const goalsInfo = context.goals?.length
    ? `\nBusiness Goals: ${context.goals.join('; ')}`
    : '';

  const userPrompt = `Provide strategic business insights for Twines and Straps SA:

Focus Area: ${context.focusArea || 'Overall business growth and market positioning'}
${challengesInfo}
${goalsInfo}

Company Context: 
- South African manufacturer of industrial twines, ropes, and strapping materials
- B2B focus serving agricultural, manufacturing, logistics, and construction sectors
- Positioned as a quality local manufacturer with competitive pricing

Provide actionable insights and a clear action plan.`;

  try {
    const response = await callAI([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], 0.6);

    return extractJSON<BusinessInsights>(response);
  } catch (error) {
    console.error('Error getting business insights:', error);
    throw error;
  }
}

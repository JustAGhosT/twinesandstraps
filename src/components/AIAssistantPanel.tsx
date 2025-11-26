'use client';

import React, { useState, useCallback } from 'react';

interface AIAssistantPanelProps {
  productData?: {
    name: string;
    description: string;
    material?: string | null;
    category?: string;
    price: number;
  };
  onApplyDescription?: (description: string) => void;
  onApplyPrice?: (price: number) => void;
}

type AIAction = 'status' | 'analyze' | 'enhance-description' | 'market-research' | 'suggest-pricing' | 'swot-analysis' | 'competitor-research' | 'product-recommendations' | 'business-insights';

interface AIStatus {
  configured: boolean;
  provider: 'azure' | 'openai' | null;
  message: string;
}

interface ProductAnalysis {
  marketInsights: string;
  competitorAnalysis: string;
  priceSuggestion: {
    recommended: number;
    range: { min: number; max: number };
    reasoning: string;
  };
  descriptionSuggestions: string[];
}

interface DescriptionEnhancement {
  enhanced: string;
  seoOptimized: string;
  keyFeatures: string[];
  callToAction: string;
}

interface MarketResearch {
  overview: string;
  trends: string[];
  opportunities: string[];
  challenges: string[];
  competitors: string[];
}

interface PricingSuggestion {
  suggested: number;
  range: { min: number; max: number };
  factors: string[];
  strategy: string;
}

interface SWOTAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  summary: string;
  recommendations: string[];
}

interface CompetitorResearch {
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

interface ProductRecommendations {
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

interface BusinessInsights {
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

type ActiveTab = 'analyze' | 'description' | 'research' | 'pricing' | 'swot' | 'competitors' | 'recommendations' | 'insights';

export default function AIAssistantPanel({
  productData,
  onApplyDescription,
  onApplyPrice,
}: AIAssistantPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiStatus, setAIStatus] = useState<AIStatus | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('analyze');
  
  // Results state
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [enhancement, setEnhancement] = useState<DescriptionEnhancement | null>(null);
  const [research, setResearch] = useState<MarketResearch | null>(null);
  const [pricing, setPricing] = useState<PricingSuggestion | null>(null);
  const [swotAnalysis, setSWOTAnalysis] = useState<SWOTAnalysis | null>(null);
  const [competitorResearch, setCompetitorResearch] = useState<CompetitorResearch | null>(null);
  const [productRecommendations, setProductRecommendations] = useState<ProductRecommendations | null>(null);
  const [businessInsights, setBusinessInsights] = useState<BusinessInsights | null>(null);

  // Input state
  const [categoryInput, setCategoryInput] = useState('');
  const [focusAreaInput, setFocusAreaInput] = useState('');
  const [challengesInput, setChallengesInput] = useState('');
  const [goalsInput, setGoalsInput] = useState('');

  const callAI = useCallback(async (action: AIAction, params: Record<string, unknown> = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, ...params }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'AI request failed');
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkStatus = useCallback(async () => {
    try {
      const result = await callAI('status');
      setAIStatus(result);
    } catch {
      // Error already handled
    }
  }, [callAI]);

  const handleExpand = useCallback(() => {
    setIsExpanded(true);
    if (!aiStatus) {
      checkStatus();
    }
  }, [aiStatus, checkStatus]);

  const handleAnalyze = async () => {
    if (!productData) {
      setError('No product data available');
      return;
    }
    try {
      const result = await callAI('analyze', {
        name: productData.name,
        description: productData.description,
        material: productData.material,
        category: productData.category,
        currentPrice: productData.price,
      });
      setAnalysis(result.data);
    } catch { /* Error handled */ }
  };

  const handleEnhanceDescription = async () => {
    if (!productData) {
      setError('No product data available');
      return;
    }
    try {
      const result = await callAI('enhance-description', {
        description: productData.description,
        name: productData.name,
        material: productData.material,
      });
      setEnhancement(result.data);
    } catch { /* Error handled */ }
  };

  const handleMarketResearch = async () => {
    const category = categoryInput || productData?.category;
    if (!category) {
      setError('Please enter a category for market research');
      return;
    }
    try {
      const result = await callAI('market-research', { category });
      setResearch(result.data);
    } catch { /* Error handled */ }
  };

  const handleSuggestPricing = async () => {
    if (!productData) {
      setError('No product data available');
      return;
    }
    try {
      const result = await callAI('suggest-pricing', {
        name: productData.name,
        material: productData.material,
      });
      setPricing(result.data);
    } catch { /* Error handled */ }
  };

  const handleSWOTAnalysis = async () => {
    try {
      const result = await callAI('swot-analysis', {
        productName: productData?.name,
        category: categoryInput || productData?.category,
        description: productData?.description,
        businessContext: focusAreaInput || undefined,
      });
      setSWOTAnalysis(result.data);
    } catch { /* Error handled */ }
  };

  const handleCompetitorResearch = async () => {
    const category = categoryInput || productData?.category;
    if (!category) {
      setError('Please enter a category for competitor research');
      return;
    }
    try {
      const result = await callAI('competitor-research', { category, region: 'South Africa' });
      setCompetitorResearch(result.data);
    } catch { /* Error handled */ }
  };

  const handleProductRecommendations = async () => {
    const currentProduct = productData?.name || categoryInput;
    if (!currentProduct) {
      setError('Please provide a product name or category');
      return;
    }
    try {
      const result = await callAI('product-recommendations', {
        currentProduct,
        category: productData?.category || categoryInput,
        customerSegment: focusAreaInput || 'B2B industrial',
      });
      setProductRecommendations(result.data);
    } catch { /* Error handled */ }
  };

  const handleBusinessInsights = async () => {
    try {
      const result = await callAI('business-insights', {
        focusArea: focusAreaInput || undefined,
        currentChallenges: challengesInput ? challengesInput.split(',').map(s => s.trim()) : undefined,
        goals: goalsInput ? goalsInput.split(',').map(s => s.trim()) : undefined,
      });
      setBusinessInsights(result.data);
    } catch { /* Error handled */ }
  };

  const tabs = [
    { id: 'analyze' as const, label: 'Analyze', icon: '🔍' },
    { id: 'description' as const, label: 'Description', icon: '✏️' },
    { id: 'research' as const, label: 'Market', icon: '📊' },
    { id: 'pricing' as const, label: 'Pricing', icon: '💰' },
    { id: 'swot' as const, label: 'SWOT', icon: '⚡' },
    { id: 'competitors' as const, label: 'Competitors', icon: '🎯' },
    { id: 'recommendations' as const, label: 'Products', icon: '💡' },
    { id: 'insights' as const, label: 'Insights', icon: '📈' },
  ];

  if (!isExpanded) {
    return (
      <button
        onClick={handleExpand}
        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl p-4 flex items-center justify-between hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="text-left">
            <h3 className="font-semibold">AI Business Assistant</h3>
            <p className="text-sm text-white/80">SWOT, competitors, insights, & more</p>
          </div>
        </div>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold">AI Business Assistant</h3>
              <p className="text-sm text-white/80">
                {aiStatus?.configured && aiStatus.provider
                  ? `Ready (${aiStatus.provider === 'azure' ? 'Azure OpenAI' : 'OpenAI'})` 
                  : aiStatus?.configured
                    ? 'Ready'
                    : 'Checking status...'}
              </p>
            </div>
          </div>
          <button onClick={() => setIsExpanded(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Status Warning */}
      {aiStatus && !aiStatus.configured && (
        <div className="p-4 bg-yellow-50 border-b border-yellow-100">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm text-yellow-800 font-medium">AI Not Configured</p>
              <p className="text-sm text-yellow-700 mt-1">{aiStatus.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex -mb-px min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-3 text-xs font-medium text-center border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[600px] overflow-y-auto">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-gray-500">AI is thinking...</span>
          </div>
        )}

        {/* Analyze Tab */}
        {!loading && activeTab === 'analyze' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Get comprehensive product analysis including market insights and competitor evaluation.</p>
            <button onClick={handleAnalyze} disabled={!productData || !aiStatus?.configured} className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">Analyze Product</button>
            {analysis && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg"><h4 className="font-medium text-gray-900 mb-2">Market Insights</h4><p className="text-sm text-gray-700">{analysis.marketInsights}</p></div>
                <div className="p-4 bg-gray-50 rounded-lg"><h4 className="font-medium text-gray-900 mb-2">Competitor Analysis</h4><p className="text-sm text-gray-700">{analysis.competitorAnalysis}</p></div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Price Suggestion</h4>
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-2xl font-bold text-green-600">R{analysis.priceSuggestion.recommended.toFixed(2)}</span>
                    <span className="text-sm text-gray-500">(Range: R{analysis.priceSuggestion.range.min.toFixed(2)} - R{analysis.priceSuggestion.range.max.toFixed(2)})</span>
                    {onApplyPrice && <button onClick={() => onApplyPrice(analysis.priceSuggestion.recommended)} className="ml-auto px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">Apply</button>}
                  </div>
                  <p className="text-sm text-gray-700">{analysis.priceSuggestion.reasoning}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Description Tab */}
        {!loading && activeTab === 'description' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Enhance your product description for better SEO and customer engagement.</p>
            <button onClick={handleEnhanceDescription} disabled={!productData || !aiStatus?.configured} className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">Enhance Description</button>
            {enhancement && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">Enhanced Description</h4>
                    {onApplyDescription && <button onClick={() => onApplyDescription(enhancement.enhanced)} className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700">Apply</button>}
                  </div>
                  <p className="text-sm text-gray-700">{enhancement.enhanced}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg"><h4 className="font-medium text-gray-900 mb-2">SEO-Optimized</h4><p className="text-sm text-gray-700">{enhancement.seoOptimized}</p></div>
                <div className="p-4 bg-gray-50 rounded-lg"><h4 className="font-medium text-gray-900 mb-2">Key Features</h4><ul className="list-disc list-inside space-y-1">{enhancement.keyFeatures.map((f, i) => <li key={i} className="text-sm text-gray-700">{f}</li>)}</ul></div>
              </div>
            )}
          </div>
        )}

        {/* Market Research Tab */}
        {!loading && activeTab === 'research' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Get market research insights for a product category.</p>
            <div className="flex gap-2">
              <input type="text" value={categoryInput} onChange={(e) => setCategoryInput(e.target.value)} placeholder={productData?.category || 'Enter category...'} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
              <button onClick={handleMarketResearch} disabled={(!categoryInput && !productData?.category) || !aiStatus?.configured} className="py-2 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">Research</button>
            </div>
            {research && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg"><h4 className="font-medium text-gray-900 mb-2">Market Overview</h4><p className="text-sm text-gray-700">{research.overview}</p></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg"><h4 className="font-medium text-gray-900 mb-2">Trends</h4><ul className="list-disc list-inside space-y-1">{research.trends.map((t, i) => <li key={i} className="text-sm text-gray-700">{t}</li>)}</ul></div>
                  <div className="p-4 bg-blue-50 rounded-lg"><h4 className="font-medium text-gray-900 mb-2">Opportunities</h4><ul className="list-disc list-inside space-y-1">{research.opportunities.map((o, i) => <li key={i} className="text-sm text-gray-700">{o}</li>)}</ul></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pricing Tab */}
        {!loading && activeTab === 'pricing' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Get AI-powered pricing suggestions based on market analysis.</p>
            <button onClick={handleSuggestPricing} disabled={!productData || !aiStatus?.configured} className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">Suggest Pricing</button>
            {pricing && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">Suggested Price</h4>
                    {onApplyPrice && <button onClick={() => onApplyPrice(pricing.suggested)} className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700">Apply</button>}
                  </div>
                  <div className="flex items-baseline gap-4">
                    <span className="text-3xl font-bold text-green-600">R{pricing.suggested.toFixed(2)}</span>
                    <span className="text-sm text-gray-500">Range: R{pricing.range.min.toFixed(2)} - R{pricing.range.max.toFixed(2)}</span>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg"><h4 className="font-medium text-gray-900 mb-2">Strategy</h4><p className="text-sm text-gray-700">{pricing.strategy}</p></div>
              </div>
            )}
          </div>
        )}

        {/* SWOT Tab */}
        {!loading && activeTab === 'swot' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Perform a SWOT analysis for your product or business.</p>
            <input type="text" value={categoryInput} onChange={(e) => setCategoryInput(e.target.value)} placeholder={productData?.category || 'Enter category (optional)...'} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
            <button onClick={handleSWOTAnalysis} disabled={!aiStatus?.configured} className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">Run SWOT Analysis</button>
            {swotAnalysis && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg"><h4 className="font-medium text-gray-900 mb-2">Summary</h4><p className="text-sm text-gray-700">{swotAnalysis.summary}</p></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg"><h4 className="font-medium text-green-800 mb-2">💪 Strengths</h4><ul className="list-disc list-inside space-y-1">{swotAnalysis.strengths.map((s, i) => <li key={i} className="text-sm text-gray-700">{s}</li>)}</ul></div>
                  <div className="p-4 bg-red-50 rounded-lg"><h4 className="font-medium text-red-800 mb-2">⚠️ Weaknesses</h4><ul className="list-disc list-inside space-y-1">{swotAnalysis.weaknesses.map((w, i) => <li key={i} className="text-sm text-gray-700">{w}</li>)}</ul></div>
                  <div className="p-4 bg-blue-50 rounded-lg"><h4 className="font-medium text-blue-800 mb-2">🚀 Opportunities</h4><ul className="list-disc list-inside space-y-1">{swotAnalysis.opportunities.map((o, i) => <li key={i} className="text-sm text-gray-700">{o}</li>)}</ul></div>
                  <div className="p-4 bg-yellow-50 rounded-lg"><h4 className="font-medium text-yellow-800 mb-2">⚡ Threats</h4><ul className="list-disc list-inside space-y-1">{swotAnalysis.threats.map((t, i) => <li key={i} className="text-sm text-gray-700">{t}</li>)}</ul></div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg"><h4 className="font-medium text-purple-800 mb-2">📋 Recommendations</h4><ul className="list-disc list-inside space-y-1">{swotAnalysis.recommendations.map((r, i) => <li key={i} className="text-sm text-gray-700">{r}</li>)}</ul></div>
              </div>
            )}
          </div>
        )}

        {/* Competitors Tab */}
        {!loading && activeTab === 'competitors' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Deep dive into competitor analysis for your market segment.</p>
            <div className="flex gap-2">
              <input type="text" value={categoryInput} onChange={(e) => setCategoryInput(e.target.value)} placeholder={productData?.category || 'Enter category...'} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
              <button onClick={handleCompetitorResearch} disabled={(!categoryInput && !productData?.category) || !aiStatus?.configured} className="py-2 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">Research</button>
            </div>
            {competitorResearch && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg"><h4 className="font-medium text-gray-900 mb-2">Market Position</h4><p className="text-sm text-gray-700">{competitorResearch.marketPosition}</p></div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Competitors</h4>
                  <div className="space-y-3">{competitorResearch.competitors.map((c, i) => (
                    <div key={i} className="p-3 bg-white rounded border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{c.name}</span>
                        <span className={`text-xs px-2 py-1 rounded ${c.type === 'local' ? 'bg-green-100 text-green-700' : c.type === 'international' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{c.type}</span>
                      </div>
                      <div className="text-xs text-gray-500">Price: <span className={`font-medium ${c.pricePosition === 'budget' ? 'text-green-600' : c.pricePosition === 'premium' ? 'text-purple-600' : 'text-gray-600'}`}>{c.pricePosition}</span></div>
                    </div>
                  ))}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg"><h4 className="font-medium text-gray-900 mb-2">Our Advantages</h4><ul className="list-disc list-inside space-y-1">{competitorResearch.competitiveAdvantages.map((a, i) => <li key={i} className="text-sm text-gray-700">{a}</li>)}</ul></div>
                  <div className="p-4 bg-yellow-50 rounded-lg"><h4 className="font-medium text-gray-900 mb-2">Areas to Improve</h4><ul className="list-disc list-inside space-y-1">{competitorResearch.areasForImprovement.map((a, i) => <li key={i} className="text-sm text-gray-700">{a}</li>)}</ul></div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg"><h4 className="font-medium text-gray-900 mb-2">Strategic Recommendations</h4><ul className="list-disc list-inside space-y-1">{competitorResearch.strategicRecommendations.map((r, i) => <li key={i} className="text-sm text-gray-700">{r}</li>)}</ul></div>
              </div>
            )}
          </div>
        )}

        {/* Recommendations Tab */}
        {!loading && activeTab === 'recommendations' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Get product bundle ideas, cross-sell, and upsell opportunities.</p>
            <input type="text" value={focusAreaInput} onChange={(e) => setFocusAreaInput(e.target.value)} placeholder="Target customer segment (optional)..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
            <button onClick={handleProductRecommendations} disabled={(!productData?.name && !categoryInput) || !aiStatus?.configured} className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">Get Recommendations</button>
            {productRecommendations && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Related Products to Add</h4>
                  <div className="space-y-2">{productRecommendations.relatedProducts.map((p, i) => (
                    <div key={i} className="p-3 bg-white rounded border border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{p.suggestion}</span>
                        <span className={`text-xs px-2 py-1 rounded ${p.potentialMargin === 'high' ? 'bg-green-100 text-green-700' : p.potentialMargin === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{p.potentialMargin} margin</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{p.reason}</p>
                    </div>
                  ))}</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Bundle Ideas</h4>
                  <div className="space-y-3">{productRecommendations.bundleIdeas.map((b, i) => (
                    <div key={i} className="p-3 bg-white rounded border border-blue-200">
                      <div className="font-medium text-sm text-blue-800">{b.name}</div>
                      <div className="text-xs text-gray-600 mt-1">Products: {b.products.join(', ')}</div>
                      <div className="text-xs text-blue-600 mt-1">{b.valueProposition}</div>
                    </div>
                  ))}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg"><h4 className="font-medium text-gray-900 mb-2">Cross-Sell</h4><ul className="list-disc list-inside space-y-1">{productRecommendations.crossSellOpportunities.map((c, i) => <li key={i} className="text-sm text-gray-700">{c}</li>)}</ul></div>
                  <div className="p-4 bg-purple-50 rounded-lg"><h4 className="font-medium text-gray-900 mb-2">Upsell</h4><ul className="list-disc list-inside space-y-1">{productRecommendations.upSellStrategies.map((u, i) => <li key={i} className="text-sm text-gray-700">{u}</li>)}</ul></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Business Insights Tab */}
        {!loading && activeTab === 'insights' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Get strategic business insights and action plans.</p>
            <input type="text" value={focusAreaInput} onChange={(e) => setFocusAreaInput(e.target.value)} placeholder="Focus area (e.g., growth, exports, digital)..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
            <input type="text" value={challengesInput} onChange={(e) => setChallengesInput(e.target.value)} placeholder="Current challenges (comma-separated)..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
            <input type="text" value={goalsInput} onChange={(e) => setGoalsInput(e.target.value)} placeholder="Business goals (comma-separated)..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" />
            <button onClick={handleBusinessInsights} disabled={!aiStatus?.configured} className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">Get Business Insights</button>
            {businessInsights && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">📊 Market Trends</h4>
                  <div className="space-y-2">{businessInsights.marketTrends.map((t, i) => (
                    <div key={i} className="p-3 bg-white rounded border border-gray-200">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${t.impact === 'positive' ? 'bg-green-500' : t.impact === 'negative' ? 'bg-red-500' : 'bg-gray-500'}`}></span>
                        <span className="font-medium text-sm">{t.trend}</span>
                        <span className="text-xs text-gray-500">({t.timeframe})</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{t.recommendation}</p>
                    </div>
                  ))}</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">🚀 Growth Opportunities</h4>
                  <div className="space-y-2">{businessInsights.growthOpportunities.map((g, i) => (
                    <div key={i} className="p-3 bg-white rounded border border-green-200">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{g.opportunity}</span>
                        <span className={`text-xs px-2 py-1 rounded ${g.investmentLevel === 'low' ? 'bg-green-100 text-green-700' : g.investmentLevel === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{g.investmentLevel} investment</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Return: {g.potentialReturn}</p>
                    </div>
                  ))}</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">⚠️ Risk Assessment</h4>
                  <div className="space-y-2">{businessInsights.riskAssessment.map((r, i) => (
                    <div key={i} className="p-3 bg-white rounded border border-red-200">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{r.risk}</span>
                        <span className={`text-xs px-2 py-1 rounded ${r.likelihood === 'high' ? 'bg-red-100 text-red-700' : r.likelihood === 'low' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.likelihood} likelihood</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Mitigation: {r.mitigation}</p>
                    </div>
                  ))}</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">📋 Action Plan</h4>
                  <div className="space-y-2">{businessInsights.actionPlan.map((a, i) => (
                    <div key={i} className="p-3 bg-white rounded border border-purple-200">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{a.action}</span>
                        <span className={`text-xs px-2 py-1 rounded ${a.priority === 'high' ? 'bg-red-100 text-red-700' : a.priority === 'low' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700'}`}>{a.priority} priority</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Timeline: {a.timeline}</p>
                      <p className="text-xs text-gray-600">Expected: {a.expectedOutcome}</p>
                    </div>
                  ))}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

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

type AIAction = 'status' | 'analyze' | 'enhance-description' | 'market-research' | 'suggest-pricing';

interface AIStatus {
  configured: boolean;
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

export default function AIAssistantPanel({
  productData,
  onApplyDescription,
  onApplyPrice,
}: AIAssistantPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiStatus, setAIStatus] = useState<AIStatus | null>(null);
  const [activeTab, setActiveTab] = useState<'analyze' | 'description' | 'research' | 'pricing'>('analyze');
  
  // Results state
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [enhancement, setEnhancement] = useState<DescriptionEnhancement | null>(null);
  const [research, setResearch] = useState<MarketResearch | null>(null);
  const [pricing, setPricing] = useState<PricingSuggestion | null>(null);

  // Category input for market research
  const [categoryInput, setCategoryInput] = useState('');

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
    } catch {
      // Error already handled
    }
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
    } catch {
      // Error already handled
    }
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
    } catch {
      // Error already handled
    }
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
    } catch {
      // Error already handled
    }
  };

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
            <h3 className="font-semibold">AI Assistant</h3>
            <p className="text-sm text-white/80">Market research, pricing & descriptions</p>
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
              <h3 className="font-semibold">AI Assistant</h3>
              <p className="text-sm text-white/80">
                {aiStatus?.configured ? 'Ready to help' : 'Checking status...'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
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
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          {[
            { id: 'analyze', label: 'Analyze' },
            { id: 'description', label: 'Description' },
            { id: 'research', label: 'Market Research' },
            { id: 'pricing', label: 'Pricing' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 py-3 px-4 text-sm font-medium text-center border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-4">
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

        {!loading && activeTab === 'analyze' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Get comprehensive product analysis including market insights, competitor evaluation, and improvement suggestions.
            </p>
            <button
              onClick={handleAnalyze}
              disabled={!productData || !aiStatus?.configured}
              className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Analyze Product
            </button>

            {analysis && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Market Insights</h4>
                  <p className="text-sm text-gray-700">{analysis.marketInsights}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Competitor Analysis</h4>
                  <p className="text-sm text-gray-700">{analysis.competitorAnalysis}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Price Suggestion</h4>
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-2xl font-bold text-green-600">
                      R{analysis.priceSuggestion.recommended.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500">
                      (Range: R{analysis.priceSuggestion.range.min.toFixed(2)} - R{analysis.priceSuggestion.range.max.toFixed(2)})
                    </span>
                    {onApplyPrice && (
                      <button
                        onClick={() => onApplyPrice(analysis.priceSuggestion.recommended)}
                        className="ml-auto px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">{analysis.priceSuggestion.reasoning}</p>
                </div>
                {analysis.descriptionSuggestions.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Description Suggestions</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {analysis.descriptionSuggestions.map((suggestion, idx) => (
                        <li key={idx} className="text-sm text-gray-700">{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === 'description' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Enhance your product description for better SEO and customer engagement.
            </p>
            <button
              onClick={handleEnhanceDescription}
              disabled={!productData || !aiStatus?.configured}
              className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Enhance Description
            </button>

            {enhancement && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">Enhanced Description</h4>
                    {onApplyDescription && (
                      <button
                        onClick={() => onApplyDescription(enhancement.enhanced)}
                        className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">{enhancement.enhanced}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">SEO-Optimized Version</h4>
                  <p className="text-sm text-gray-700">{enhancement.seoOptimized}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Key Features</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {enhancement.keyFeatures.map((feature, idx) => (
                      <li key={idx} className="text-sm text-gray-700">{feature}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Call to Action</h4>
                  <p className="text-sm text-gray-700">{enhancement.callToAction}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === 'research' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Get market research insights for a product category.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                placeholder={productData?.category || 'Enter category...'}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <button
                onClick={handleMarketResearch}
                disabled={(!categoryInput && !productData?.category) || !aiStatus?.configured}
                className="py-2 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Research
              </button>
            </div>

            {research && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Market Overview</h4>
                  <p className="text-sm text-gray-700">{research.overview}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Trends</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {research.trends.map((trend, idx) => (
                        <li key={idx} className="text-sm text-gray-700">{trend}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Opportunities</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {research.opportunities.map((opp, idx) => (
                        <li key={idx} className="text-sm text-gray-700">{opp}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Challenges</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {research.challenges.map((challenge, idx) => (
                        <li key={idx} className="text-sm text-gray-700">{challenge}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Competitors</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {research.competitors.map((competitor, idx) => (
                        <li key={idx} className="text-sm text-gray-700">{competitor}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === 'pricing' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Get AI-powered pricing suggestions based on market analysis.
            </p>
            <button
              onClick={handleSuggestPricing}
              disabled={!productData || !aiStatus?.configured}
              className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Suggest Pricing
            </button>

            {pricing && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">Suggested Price</h4>
                    {onApplyPrice && (
                      <button
                        onClick={() => onApplyPrice(pricing.suggested)}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Apply
                      </button>
                    )}
                  </div>
                  <div className="flex items-baseline gap-4">
                    <span className="text-3xl font-bold text-green-600">
                      R{pricing.suggested.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500">
                      Range: R{pricing.range.min.toFixed(2)} - R{pricing.range.max.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Pricing Strategy</h4>
                  <p className="text-sm text-gray-700">{pricing.strategy}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Key Factors</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {pricing.factors.map((factor, idx) => (
                      <li key={idx} className="text-sm text-gray-700">{factor}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

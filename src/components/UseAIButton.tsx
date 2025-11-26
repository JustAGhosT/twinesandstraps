'use client';

import React, { useState, useCallback } from 'react';

export type AIActionType = 'enhance-description' | 'suggest-pricing' | 'analyze';

// Constants for text truncation
const MAX_REASONING_LENGTH = 100;
const MAX_DESCRIPTION_LINES = 4;

interface UseAIButtonProps {
  /** The action type to perform */
  action: AIActionType;
  /** Context data to send with the AI request */
  contextData: Record<string, unknown>;
  /** Callback when AI generates a result to apply to a field */
  onApply: (value: string | number) => void;
  /** Button label */
  label?: string;
  /** Optional custom prompt to display */
  promptHint?: string;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Size variant */
  size?: 'sm' | 'md';
}

interface AIResponse {
  success?: boolean;
  data?: {
    enhanced?: string;
    seoOptimized?: string;
    suggested?: number;
    range?: { min: number; max: number };
    priceSuggestion?: {
      recommended: number;
      range: { min: number; max: number };
      reasoning: string;
    };
    descriptionSuggestions?: string[];
  };
  error?: string;
  message?: string;
}

export default function UseAIButton({
  action,
  contextData,
  onApply,
  label = 'Use AI',
  promptHint,
  disabled = false,
  size = 'sm',
}: UseAIButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIResponse['data'] | null>(null);

  const callAI = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, ...contextData }),
      });

      const data: AIResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'AI request failed');
      }

      setResult(data.data || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [action, contextData]);

  const handleApply = useCallback(() => {
    if (!result) return;

    // Determine what value to apply based on action type
    if (action === 'enhance-description' && result.enhanced) {
      onApply(result.enhanced);
    } else if (action === 'suggest-pricing' && result.suggested) {
      onApply(result.suggested);
    } else if (action === 'analyze' && result.priceSuggestion) {
      onApply(result.priceSuggestion.recommended);
    }

    setIsOpen(false);
    setResult(null);
  }, [action, result, onApply]);

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-1 text-xs gap-1' 
    : 'px-3 py-1.5 text-sm gap-1.5';

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  const getPromptHint = () => {
    if (promptHint) return promptHint;
    switch (action) {
      case 'enhance-description':
        return 'AI will improve your description for better SEO and customer engagement.';
      case 'suggest-pricing':
        return 'AI will suggest optimal pricing based on market analysis.';
      case 'analyze':
        return 'AI will analyze your product for market insights.';
      default:
        return 'AI will assist with this field.';
    }
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`inline-flex items-center ${sizeClasses} bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-md font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm`}
        title={getPromptHint()}
      >
        <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        {label}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Popup */}
          <div className="absolute z-50 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden right-0">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="font-medium">AI Assistant</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                {getPromptHint()}
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                  <span className="ml-3 text-sm text-gray-500">AI is thinking...</span>
                </div>
              ) : result ? (
                <div className="space-y-3">
                  {action === 'enhance-description' && result.enhanced && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700" style={{ display: '-webkit-box', WebkitLineClamp: MAX_DESCRIPTION_LINES, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {result.enhanced}
                      </p>
                    </div>
                  )}
                  
                  {action === 'suggest-pricing' && result.suggested && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">
                        R{result.suggested.toFixed(2)}
                      </div>
                      {result.range && (
                        <p className="text-xs text-gray-500 mt-1">
                          Range: R{result.range.min.toFixed(2)} - R{result.range.max.toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}

                  {action === 'analyze' && result.priceSuggestion && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">
                        R{result.priceSuggestion.recommended.toFixed(2)}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {result.priceSuggestion.reasoning.length > MAX_REASONING_LENGTH 
                          ? `${result.priceSuggestion.reasoning.substring(0, MAX_REASONING_LENGTH)}...`
                          : result.priceSuggestion.reasoning}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleApply}
                      className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setResult(null);
                        callAI();
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={callAI}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Generate with AI
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

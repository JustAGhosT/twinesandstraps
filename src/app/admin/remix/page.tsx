'use client';

import React, { useState, useCallback, useRef } from 'react';
import Image from 'next/image';

// Types
interface ActivityLogEntry {
  id: string;
  type: 'upload' | 'transform' | 'ai' | 'error';
  title: string;
  description: string;
  status: 'success' | 'pending' | 'error';
  timestamp: Date;
}

interface TransformHistoryEntry {
  id: string;
  name: string;
  timestamp: Date;
}

interface Transform {
  id: string;
  name: string;
  description: string;
  category: 'border' | 'background' | 'style';
}

const TRANSFORMS: Transform[] = [
  { id: 'rounded-border', name: 'Add Rounded Border', description: 'Add a rounded rectangle border', category: 'border' },
  { id: 'circle-border', name: 'Add Circle Border', description: 'Add a circular border around the SVG', category: 'border' },
  { id: 'path-stroke', name: 'Add Path Stroke', description: 'Add stroke to all paths', category: 'border' },
  { id: 'remove-background', name: 'Remove Background', description: 'Remove background elements for transparency', category: 'background' },
  { id: 'add-white-bg', name: 'Add White Background', description: 'Add a white background', category: 'background' },
  { id: 'invert-colors', name: 'Invert Colors', description: 'Invert all colors in the SVG', category: 'style' },
  { id: 'grayscale', name: 'Convert to Grayscale', description: 'Convert to grayscale', category: 'style' },
  { id: 'optimize', name: 'Optimize SVG', description: 'Remove unnecessary elements and optimize', category: 'style' },
];

export default function RemixPage() {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [originalSvg, setOriginalSvg] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'ai' | 'transforms'>('transforms');
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [transformHistory, setTransformHistory] = useState<TransformHistoryEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add activity log entry
  const addActivityLog = useCallback((entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => {
    const newEntry: ActivityLogEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    setActivityLog(prev => [newEntry, ...prev]);
  }, []);

  // Add transform history entry
  const addTransformHistory = useCallback((name: string) => {
    const newEntry: TransformHistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      timestamp: new Date(),
    };
    setTransformHistory(prev => [newEntry, ...prev]);
  }, []);

  // AI analysis
  const analyzeWithAI = useCallback(async (content: string) => {
    setIsLoadingAi(true);
    addActivityLog({
      type: 'ai',
      title: 'AI analysis started',
      description: 'Analyzing SVG for improvements...',
      status: 'pending',
    });

    try {
      const response = await fetch('/api/admin/remix/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ svgContent: content }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiSuggestions(data.suggestions || []);
        addActivityLog({
          type: 'ai',
          title: 'AI Iterative complete',
          description: data.suggestions?.length > 0
            ? `Found ${data.suggestions.length} improvement suggestions`
            : 'No improvement found',
          status: 'success',
        });
      } else {
        setAiSuggestions([]);
        addActivityLog({
          type: 'ai',
          title: 'AI Iterative complete',
          description: 'No improvement found',
          status: 'success',
        });
      }
    } catch (error) {
      setAiSuggestions([]);
      addActivityLog({
        type: 'ai',
        title: 'AI Iterative complete',
        description: 'No improvement found',
        status: 'success',
      });
    } finally {
      setIsLoadingAi(false);
    }
  }, [addActivityLog]);

  // Handle file upload
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('svg') && !file.name.endsWith('.svg')) {
      addActivityLog({
        type: 'error',
        title: 'Invalid file type',
        description: 'Please upload an SVG file',
        status: 'error',
      });
      return;
    }

    try {
      const content = await file.text();
      setSvgContent(content);
      setOriginalSvg(content);
      setFileName(file.name);
      setTransformHistory([]);

      addActivityLog({
        type: 'upload',
        title: 'Image uploaded',
        description: `${file.name} processed successfully`,
        status: 'success',
      });

      // Auto-trigger AI analysis
      analyzeWithAI(content);
    } catch (error) {
      addActivityLog({
        type: 'error',
        title: 'Upload failed',
        description: 'Failed to process the SVG file',
        status: 'error',
      });
    }
  }, [addActivityLog, analyzeWithAI]);

  // Apply transform
  const applyTransform = useCallback(async (transform: Transform) => {
    if (!svgContent) return;

    setIsProcessing(true);
    addActivityLog({
      type: 'transform',
      title: `Applying ${transform.name}`,
      description: transform.description,
      status: 'pending',
    });

    try {
      const response = await fetch('/api/admin/remix/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ svgContent, transformId: transform.id }),
      });

      if (response.ok) {
        const data = await response.json();
        setSvgContent(data.transformedSvg);
        addTransformHistory(transform.name);
        addActivityLog({
          type: 'transform',
          title: 'Conversion complete',
          description: `${transform.name} applied successfully`,
          status: 'success',
        });
      } else {
        addActivityLog({
          type: 'error',
          title: 'Transform failed',
          description: `Failed to apply ${transform.name}`,
          status: 'error',
        });
      }
    } catch (error) {
      addActivityLog({
        type: 'error',
        title: 'Transform failed',
        description: `Failed to apply ${transform.name}`,
        status: 'error',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [svgContent, addActivityLog, addTransformHistory]);

  // Undo last transform
  const undoTransform = useCallback((historyId: string) => {
    const index = transformHistory.findIndex(h => h.id === historyId);
    if (index === -1) return;

    // Reset to original and replay transforms up to (but not including) the one to remove
    const newHistory = transformHistory.slice(index + 1);
    setTransformHistory(newHistory);
    setSvgContent(originalSvg);

    addActivityLog({
      type: 'transform',
      title: 'Undo transform',
      description: `Reverted ${transformHistory[index].name}`,
      status: 'success',
    });
  }, [transformHistory, originalSvg, addActivityLog]);

  // Clear activity log
  const clearActivityLog = useCallback(() => {
    setActivityLog([]);
  }, []);

  // Clear transformation history
  const clearTransformHistory = useCallback(() => {
    setTransformHistory([]);
    setSvgContent(originalSvg);
  }, [originalSvg]);

  // Copy SVG to clipboard
  const copySvg = useCallback(() => {
    if (!svgContent) return;
    navigator.clipboard.writeText(svgContent);
    addActivityLog({
      type: 'transform',
      title: 'Copied to clipboard',
      description: 'SVG content copied',
      status: 'success',
    });
  }, [svgContent, addActivityLog]);

  // Download SVG
  const downloadSvg = useCallback(() => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'remixed.svg';
    a.click();
    URL.revokeObjectURL(url);
  }, [svgContent, fileName]);

  // Apply changes (save)
  const applyChanges = useCallback(async () => {
    if (!svgContent) return;

    setIsProcessing(true);
    try {
      // Convert to data URL for storage
      const base64Content = btoa(unescape(encodeURIComponent(svgContent)));
      const dataUrl = `data:image/svg+xml;base64,${base64Content}`;

      const response = await fetch('/api/admin/logo', {
        method: 'POST',
        body: (() => {
          const formData = new FormData();
          const blob = new Blob([svgContent], { type: 'image/svg+xml' });
          formData.append('file', blob, fileName || 'logo.svg');
          return formData;
        })(),
      });

      if (response.ok) {
        addActivityLog({
          type: 'transform',
          title: 'Changes applied',
          description: 'Logo updated successfully',
          status: 'success',
        });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      addActivityLog({
        type: 'error',
        title: 'Save failed',
        description: 'Failed to apply changes',
        status: 'error',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [svgContent, fileName, addActivityLog]);

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const groupedTransforms = {
    border: TRANSFORMS.filter(t => t.category === 'border'),
    background: TRANSFORMS.filter(t => t.category === 'background'),
    style: TRANSFORMS.filter(t => t.category === 'style'),
  };

  return (
    <div className="min-h-screen bg-secondary-950">
      {/* Header */}
      <div className="bg-secondary-900 border-b border-secondary-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">SVG Remix Studio</h1>
              <p className="text-sm text-gray-400">AI-powered improvements and transformations</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={copySvg}
              disabled={!svgContent}
              className="flex items-center gap-2 px-4 py-2 bg-secondary-800 text-gray-300 rounded-lg hover:bg-secondary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy SVG
            </button>
            <button
              onClick={downloadSvg}
              disabled={!svgContent}
              className="flex items-center gap-2 px-4 py-2 bg-secondary-800 text-gray-300 rounded-lg hover:bg-secondary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
            <button
              onClick={applyChanges}
              disabled={!svgContent || isProcessing}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Apply Changes
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Preview Panel */}
            <div className="lg:col-span-2">
              <div className="bg-secondary-900 rounded-xl border border-secondary-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-secondary-700 flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-white font-medium">Preview</span>
                </div>

                <div className="p-8 min-h-[400px] flex items-center justify-center bg-secondary-950">
                  {svgContent ? (
                    <div className="bg-white rounded-lg p-4 shadow-lg max-w-md">
                      <div
                        dangerouslySetInnerHTML={{ __html: svgContent }}
                        className="w-full h-auto max-h-[300px] overflow-hidden [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[300px]"
                      />
                    </div>
                  ) : (
                    <div
                      className="border-2 border-dashed border-secondary-600 rounded-xl p-12 text-center cursor-pointer hover:border-secondary-500 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <svg className="w-16 h-16 text-secondary-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-400 mb-2">Drop an SVG file here or click to upload</p>
                      <p className="text-sm text-gray-500">SVG files only</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Transformation History */}
              <div className="mt-6 bg-secondary-900 rounded-xl border border-secondary-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-secondary-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-white font-medium">Transformation History</span>
                  </div>
                  {transformHistory.length > 0 && (
                    <button
                      onClick={clearTransformHistory}
                      className="text-sm text-gray-400 hover:text-gray-300 flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Clear
                    </button>
                  )}
                </div>

                <div className="p-4">
                  {transformHistory.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {transformHistory.map(entry => (
                        <button
                          key={entry.id}
                          onClick={() => undoTransform(entry.id)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-secondary-800 rounded-lg text-sm text-gray-300 hover:bg-secondary-700 transition-colors group"
                        >
                          <svg className="w-4 h-4 text-gray-500 group-hover:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                          </svg>
                          {entry.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No transformations applied yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Transforms Panel */}
            <div className="bg-secondary-900 rounded-xl border border-secondary-700 overflow-hidden">
              {/* Tabs */}
              <div className="flex border-b border-secondary-700">
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    activeTab === 'ai'
                      ? 'text-white bg-secondary-800 border-b-2 border-emerald-500'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  AI Suggestions
                </button>
                <button
                  onClick={() => setActiveTab('transforms')}
                  className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    activeTab === 'transforms'
                      ? 'text-white bg-secondary-800 border-b-2 border-emerald-500'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  Transforms
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-4 max-h-[600px] overflow-y-auto">
                {activeTab === 'ai' ? (
                  <div className="space-y-3">
                    {isLoadingAi ? (
                      <div className="text-center py-8">
                        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                        <p className="text-sm text-gray-400">Analyzing SVG...</p>
                      </div>
                    ) : aiSuggestions.length > 0 ? (
                      aiSuggestions.map((suggestion, index) => (
                        <div key={index} className="p-3 bg-secondary-800 rounded-lg">
                          <p className="text-sm text-gray-300">{suggestion}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <svg className="w-12 h-12 text-secondary-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <p className="text-sm text-gray-500">Upload an SVG to get AI suggestions</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Border Transforms */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <input type="checkbox" className="rounded" defaultChecked />
                        <span className="text-sm font-medium text-white">Border</span>
                        <span className="text-xs text-gray-500 bg-secondary-800 px-2 py-0.5 rounded">{groupedTransforms.border.length}</span>
                      </div>
                      <div className="space-y-2">
                        {groupedTransforms.border.map(transform => (
                          <div key={transform.id} className="flex items-center justify-between p-3 bg-secondary-800 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-white">{transform.name}</p>
                              <p className="text-xs text-gray-500">{transform.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button className="p-1.5 text-gray-400 hover:text-white transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => applyTransform(transform)}
                                disabled={!svgContent || isProcessing}
                                className="px-3 py-1 bg-secondary-700 text-sm text-white rounded hover:bg-secondary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Apply
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Background Transforms */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <input type="checkbox" className="rounded" defaultChecked />
                        <span className="text-sm font-medium text-white">Background</span>
                        <span className="text-xs text-gray-500 bg-secondary-800 px-2 py-0.5 rounded">{groupedTransforms.background.length}</span>
                      </div>
                      <div className="space-y-2">
                        {groupedTransforms.background.map(transform => (
                          <div key={transform.id} className="flex items-center justify-between p-3 bg-secondary-800 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-white">{transform.name}</p>
                              <p className="text-xs text-gray-500">{transform.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button className="p-1.5 text-gray-400 hover:text-white transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => applyTransform(transform)}
                                disabled={!svgContent || isProcessing}
                                className="px-3 py-1 bg-secondary-700 text-sm text-white rounded hover:bg-secondary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Apply
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Style Transforms */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <input type="checkbox" className="rounded" defaultChecked />
                        <span className="text-sm font-medium text-white">Style</span>
                        <span className="text-xs text-gray-500 bg-secondary-800 px-2 py-0.5 rounded">{groupedTransforms.style.length}</span>
                      </div>
                      <div className="space-y-2">
                        {groupedTransforms.style.map(transform => (
                          <div key={transform.id} className="flex items-center justify-between p-3 bg-secondary-800 rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-white">{transform.name}</p>
                              <p className="text-xs text-gray-500">{transform.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button className="p-1.5 text-gray-400 hover:text-white transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => applyTransform(transform)}
                                disabled={!svgContent || isProcessing}
                                className="px-3 py-1 bg-secondary-700 text-sm text-white rounded hover:bg-secondary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Apply
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Log Sidebar */}
        <div className="w-80 bg-secondary-900 border-l border-secondary-700 flex-shrink-0">
          <div className="p-4 border-b border-secondary-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div>
                <h2 className="text-white font-medium">Activity Log</h2>
                <p className="text-xs text-gray-500">Track what&apos;s happening</p>
              </div>
            </div>
            <button
              onClick={clearActivityLog}
              className="p-1.5 text-gray-400 hover:text-gray-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          <div className="p-4 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
            {activityLog.length > 0 ? (
              activityLog.map(entry => (
                <div key={entry.id} className="flex items-start gap-3">
                  <div className={`mt-1 flex-shrink-0 ${
                    entry.type === 'upload' ? 'text-blue-400' :
                    entry.type === 'ai' ? 'text-purple-400' :
                    entry.type === 'transform' ? 'text-emerald-400' :
                    'text-red-400'
                  }`}>
                    {entry.type === 'upload' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    )}
                    {entry.type === 'ai' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    )}
                    {entry.type === 'transform' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                    {entry.type === 'error' && (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white truncate">{entry.title}</p>
                      <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full ${
                        entry.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                        entry.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {entry.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{entry.description}</p>
                    <p className="text-xs text-gray-600 mt-1">{formatTimeAgo(entry.timestamp)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-secondary-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p className="text-sm text-gray-500">No activity yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".svg,image/svg+xml"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}

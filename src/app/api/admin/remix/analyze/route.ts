import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { isAIConfigured } from '@/lib/ai';

// AI Configuration
const AZURE_AI_ENDPOINT = process.env.AZURE_AI_ENDPOINT;
const AZURE_AI_API_KEY = process.env.AZURE_AI_API_KEY;
const AZURE_AI_DEPLOYMENT_NAME = process.env.AZURE_AI_DEPLOYMENT_NAME || 'gpt-4o';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

interface SVGAnalysis {
  suggestions: string[];
  hasBackground: boolean;
  hasStroke: boolean;
  colorCount: number;
  complexity: 'simple' | 'moderate' | 'complex';
}

// Local SVG analysis (no AI needed)
function analyzeLocalSvg(svgContent: string): SVGAnalysis {
  const suggestions: string[] = [];

  // Check for background
  const hasBackground = /<rect[^>]*fill="(?:white|#fff|#ffffff)"[^>]*>/i.test(svgContent) ||
    /style="[^"]*background/i.test(svgContent);

  // Check for strokes
  const hasStroke = /stroke="[^"none]"/i.test(svgContent) || /stroke-width/i.test(svgContent);

  // Count unique colors
  const fillMatches = svgContent.match(/fill="([^"]+)"/g) || [];
  const strokeMatches = svgContent.match(/stroke="([^"]+)"/g) || [];
  const uniqueColors = new Set([...fillMatches, ...strokeMatches]);
  const colorCount = uniqueColors.size;

  // Estimate complexity
  const pathCount = (svgContent.match(/<path/g) || []).length;
  const elementCount = (svgContent.match(/<[a-z]+/gi) || []).length;
  let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
  if (elementCount > 50 || pathCount > 20) complexity = 'complex';
  else if (elementCount > 15 || pathCount > 5) complexity = 'moderate';

  // Generate suggestions based on analysis
  if (hasBackground) {
    suggestions.push('Consider removing the white background for better flexibility with different page backgrounds.');
  }

  if (!hasStroke && pathCount > 0) {
    suggestions.push('Adding subtle strokes to paths could improve visibility and definition.');
  }

  if (colorCount > 5) {
    suggestions.push('This SVG uses many colors. Consider simplifying the color palette for better brand consistency.');
  }

  if (colorCount === 1 && pathCount > 2) {
    suggestions.push('This is a monochrome SVG. Consider adding an accent color for visual interest.');
  }

  if (complexity === 'complex') {
    suggestions.push('This is a complex SVG. Consider optimizing it to reduce file size and improve rendering performance.');
  }

  if (!svgContent.includes('viewBox')) {
    suggestions.push('Adding a viewBox attribute would improve scaling and responsiveness.');
  }

  if (svgContent.includes('<!--') || svgContent.includes('<metadata')) {
    suggestions.push('Optimize the SVG by removing comments and metadata to reduce file size.');
  }

  if (svgContent.length > 10000) {
    suggestions.push('This SVG is quite large. Consider optimizing paths and removing unnecessary elements.');
  }

  // Add border suggestions if no visual border exists
  if (!/<rect[^>]*stroke/i.test(svgContent) && !/<circle[^>]*stroke/i.test(svgContent)) {
    suggestions.push('Consider adding a border (rounded or circular) to create a contained logo feel.');
  }

  return {
    suggestions,
    hasBackground,
    hasStroke,
    colorCount,
    complexity,
  };
}

// AI-powered analysis
async function analyzeWithAI(svgContent: string): Promise<string[]> {
  const systemPrompt = `You are an expert SVG designer and optimizer. Analyze the given SVG content and provide 3-5 actionable suggestions for improvement. Focus on:
1. Visual design improvements
2. Optimization opportunities
3. Accessibility considerations
4. Brand consistency tips
5. Technical improvements

Keep suggestions concise and actionable. Return ONLY a JSON array of suggestion strings, nothing else.`;

  const userPrompt = `Analyze this SVG and provide improvement suggestions:

${svgContent.substring(0, 2000)}${svgContent.length > 2000 ? '...[truncated]' : ''}`;

  try {
    let response: Response;

    if (AZURE_AI_ENDPOINT && AZURE_AI_API_KEY) {
      const url = `${AZURE_AI_ENDPOINT}/openai/deployments/${AZURE_AI_DEPLOYMENT_NAME}/chat/completions?api-version=2024-02-01`;
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': AZURE_AI_API_KEY,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });
    } else if (OPENAI_API_KEY) {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });
    } else {
      return [];
    }

    if (!response.ok) {
      console.error('AI API error:', await response.text());
      return [];
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Try to parse as JSON array
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed.filter((s): s is string => typeof s === 'string');
      }
    } catch {
      // If not valid JSON, try to extract suggestions from text
      const lines = content.split('\n').filter((line: string) => line.trim().length > 0);
      return lines.slice(0, 5);
    }

    return [];
  } catch (error) {
    console.error('AI analysis error:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  // Verify admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const { svgContent } = await request.json();

    if (!svgContent || typeof svgContent !== 'string') {
      return NextResponse.json(
        { error: 'SVG content is required' },
        { status: 400 }
      );
    }

    // Always run local analysis
    const localAnalysis = analyzeLocalSvg(svgContent);

    // Try AI analysis if configured
    let aiSuggestions: string[] = [];
    if (isAIConfigured()) {
      aiSuggestions = await analyzeWithAI(svgContent);
    }

    // Combine suggestions, prioritizing AI suggestions if available
    const allSuggestions = aiSuggestions.length > 0
      ? [...aiSuggestions, ...localAnalysis.suggestions.filter(s => !aiSuggestions.some(ai => ai.toLowerCase().includes(s.toLowerCase().substring(0, 20))))]
      : localAnalysis.suggestions;

    return NextResponse.json({
      success: true,
      suggestions: allSuggestions.slice(0, 6),
      analysis: {
        hasBackground: localAnalysis.hasBackground,
        hasStroke: localAnalysis.hasStroke,
        colorCount: localAnalysis.colorCount,
        complexity: localAnalysis.complexity,
        aiEnabled: isAIConfigured(),
      },
    });
  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze SVG' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';

// SVG transformation functions
const transforms: Record<string, (svg: string) => string> = {
  'rounded-border': (svg: string) => {
    // Parse the SVG to get dimensions
    const widthMatch = svg.match(/width="([^"]+)"/);
    const heightMatch = svg.match(/height="([^"]+)"/);
    const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);

    let width = 100;
    let height = 100;

    if (viewBoxMatch) {
      const parts = viewBoxMatch[1].split(/\s+/);
      width = parseFloat(parts[2]) || 100;
      height = parseFloat(parts[3]) || 100;
    } else if (widthMatch && heightMatch) {
      width = parseFloat(widthMatch[1]) || 100;
      height = parseFloat(heightMatch[1]) || 100;
    }

    // Add padding for the border
    const padding = Math.max(width, height) * 0.05;
    const borderRadius = Math.max(width, height) * 0.1;
    const newWidth = width + padding * 2;
    const newHeight = height + padding * 2;

    // Create border rectangle
    const borderRect = `<rect x="${padding/4}" y="${padding/4}" width="${newWidth - padding/2}" height="${newHeight - padding/2}" rx="${borderRadius}" ry="${borderRadius}" fill="none" stroke="#333" stroke-width="${padding/2}"/>`;

    // Update SVG with new viewBox and add border
    let result = svg;

    // Update or add viewBox
    if (viewBoxMatch) {
      result = result.replace(/viewBox="[^"]+"/,  `viewBox="0 0 ${newWidth} ${newHeight}"`);
    } else {
      result = result.replace(/<svg/, `<svg viewBox="0 0 ${newWidth} ${newHeight}"`);
    }

    // Wrap content in a group with translation
    result = result.replace(/<svg([^>]*)>/, `<svg$1><g transform="translate(${padding}, ${padding})">`);
    result = result.replace(/<\/svg>/, `</g>${borderRect}</svg>`);

    return result;
  },

  'circle-border': (svg: string) => {
    const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);

    let width = 100;
    let height = 100;

    if (viewBoxMatch) {
      const parts = viewBoxMatch[1].split(/\s+/);
      width = parseFloat(parts[2]) || 100;
      height = parseFloat(parts[3]) || 100;
    }

    const maxDim = Math.max(width, height);
    const padding = maxDim * 0.1;
    const newSize = maxDim + padding * 2;
    const radius = newSize / 2 - padding / 2;
    const center = newSize / 2;

    const circle = `<circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="#333" stroke-width="${padding/2}"/>`;

    let result = svg;

    if (viewBoxMatch) {
      result = result.replace(/viewBox="[^"]+"/,  `viewBox="0 0 ${newSize} ${newSize}"`);
    } else {
      result = result.replace(/<svg/, `<svg viewBox="0 0 ${newSize} ${newSize}"`);
    }

    // Center the content
    const offsetX = (newSize - width) / 2;
    const offsetY = (newSize - height) / 2;

    result = result.replace(/<svg([^>]*)>/, `<svg$1><g transform="translate(${offsetX}, ${offsetY})">`);
    result = result.replace(/<\/svg>/, `</g>${circle}</svg>`);

    return result;
  },

  'path-stroke': (svg: string) => {
    // Add stroke to all paths that don't have one
    let result = svg;

    // Add stroke to paths without stroke
    result = result.replace(/<path([^>]*?)(?<!\s)>/g, (match, attrs) => {
      if (!/stroke=/.test(attrs)) {
        return `<path${attrs} stroke="#000" stroke-width="1">`;
      }
      return match;
    });

    // Also handle self-closing paths
    result = result.replace(/<path([^>]*?)\/>/g, (match, attrs) => {
      if (!/stroke=/.test(attrs)) {
        return `<path${attrs} stroke="#000" stroke-width="1"/>`;
      }
      return match;
    });

    return result;
  },

  'remove-background': (svg: string) => {
    let result = svg;

    // Remove rect elements that appear to be backgrounds (first rect, or rects with fill covering full area)
    // Look for rect elements at the start of the SVG content that have fill
    result = result.replace(/<rect([^>]*?)fill="(?:white|#fff|#ffffff|#FFF|#FFFFFF)"([^>]*?)\/>/gi, '');
    result = result.replace(/<rect([^>]*?)fill="(?:white|#fff|#ffffff|#FFF|#FFFFFF)"([^>]*?)><\/rect>/gi, '');

    // Remove style backgrounds
    result = result.replace(/style="[^"]*background(?:-color)?:\s*(?:white|#fff|#ffffff)[^"]*"/gi, '');

    return result;
  },

  'add-white-bg': (svg: string) => {
    const viewBoxMatch = svg.match(/viewBox="([^"]+)"/);

    let width = 100;
    let height = 100;
    let x = 0;
    let y = 0;

    if (viewBoxMatch) {
      const parts = viewBoxMatch[1].split(/\s+/);
      x = parseFloat(parts[0]) || 0;
      y = parseFloat(parts[1]) || 0;
      width = parseFloat(parts[2]) || 100;
      height = parseFloat(parts[3]) || 100;
    }

    const bgRect = `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="white"/>`;

    // Insert background rect right after opening svg tag
    const result = svg.replace(/<svg([^>]*)>/, `<svg$1>${bgRect}`);

    return result;
  },

  'invert-colors': (svg: string) => {
    let result = svg;

    // Simple color inversion for common colors
    const colorMap: Record<string, string> = {
      '#000': '#fff',
      '#000000': '#ffffff',
      'black': 'white',
      '#fff': '#000',
      '#ffffff': '#000000',
      'white': 'black',
    };

    // Replace colors in fill and stroke attributes
    Object.entries(colorMap).forEach(([from, to]) => {
      const regex = new RegExp(`(fill|stroke)="${from}"`, 'gi');
      result = result.replace(regex, `$1="${to}"`);
    });

    // Also handle currentColor references with a filter
    if (!result.includes('filter="invert(1)"')) {
      result = result.replace(/<svg([^>]*)>/, '<svg$1 style="filter: invert(1);">');
    }

    return result;
  },

  'grayscale': (svg: string) => {
    // Add grayscale filter
    let result = svg;

    // Check if defs section exists
    if (result.includes('<defs>')) {
      result = result.replace(/<defs>/, `<defs>
        <filter id="grayscale-filter">
          <feColorMatrix type="saturate" values="0"/>
        </filter>`);
    } else {
      result = result.replace(/<svg([^>]*)>/, `<svg$1>
        <defs>
          <filter id="grayscale-filter">
            <feColorMatrix type="saturate" values="0"/>
          </filter>
        </defs>`);
    }

    // Apply filter to a group containing all content
    result = result.replace(/<\/defs>/, '</defs><g filter="url(#grayscale-filter)">');
    result = result.replace(/<\/svg>/, '</g></svg>');

    return result;
  },

  'optimize': (svg: string) => {
    let result = svg;

    // Remove comments
    result = result.replace(/<!--[\s\S]*?-->/g, '');

    // Remove empty groups
    result = result.replace(/<g[^>]*>\s*<\/g>/g, '');

    // Remove unnecessary whitespace
    result = result.replace(/\s+/g, ' ');
    result = result.replace(/>\s+</g, '><');

    // Remove empty attributes
    result = result.replace(/\s+[a-z-]+=""/gi, '');

    // Remove metadata elements
    result = result.replace(/<metadata[\s\S]*?<\/metadata>/gi, '');

    // Remove sodipodi and inkscape attributes (from Inkscape exports)
    result = result.replace(/\s+(sodipodi|inkscape):[a-z-]+="[^"]*"/gi, '');

    // Remove unnecessary namespace declarations that aren't used
    result = result.replace(/\s+xmlns:(sodipodi|inkscape)="[^"]*"/gi, '');

    return result.trim();
  },
};

export async function POST(request: NextRequest) {
  // Verify admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const { svgContent, transformId } = await request.json();

    if (!svgContent || typeof svgContent !== 'string') {
      return NextResponse.json(
        { error: 'SVG content is required' },
        { status: 400 }
      );
    }

    if (!transformId || !transforms[transformId]) {
      return NextResponse.json(
        { error: 'Invalid transform ID' },
        { status: 400 }
      );
    }

    const transformFn = transforms[transformId];
    const transformedSvg = transformFn(svgContent);

    return NextResponse.json({
      success: true,
      transformedSvg,
      transformId,
    });
  } catch (error) {
    console.error('Transform error:', error);
    return NextResponse.json(
      { error: 'Failed to apply transform' },
      { status: 500 }
    );
  }
}

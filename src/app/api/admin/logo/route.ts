import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';

// Only allow SVG format for logos
const ALLOWED_MIME_TYPE = 'image/svg+xml';
const MAX_FILE_SIZE = 512 * 1024; // 512KB - SVGs should be small
const SITE_SETTINGS_ID = 1;

// Basic SVG validation to ensure it's a valid SVG
function isValidSvg(content: string): boolean {
  const trimmed = content.trim();
  // Check if it starts with XML declaration or SVG element
  const hasXmlOrSvg = trimmed.startsWith('<?xml') || trimmed.startsWith('<svg');
  // Check if it contains an svg element
  const hasSvgElement = /<svg[\s>]/i.test(trimmed) && /<\/svg>/i.test(trimmed);
  return hasXmlOrSvg && hasSvgElement;
}

/**
 * Sanitize SVG content by removing potentially dangerous elements.
 * Uses iterative approach to handle nested/repeated patterns.
 */
function sanitizeSvg(content: string): string {
  let sanitized = content;
  let previousLength: number;
  
  // Iterate until no more changes are made (handles nested patterns)
  do {
    previousLength = sanitized.length;
    
    // Remove script elements with flexible whitespace handling
    // Matches <script...>...</script> with any whitespace variations
    sanitized = sanitized.replace(/<script[^>]*>[\s\S]*?<\/\s*script\s*>/gi, '');
    // Also remove self-closing script tags
    sanitized = sanitized.replace(/<script[^>]*\/\s*>/gi, '');
    // Remove orphan script tags
    sanitized = sanitized.replace(/<\/?script[^>]*>/gi, '');
    
    // Remove on* event handlers - match attribute patterns more precisely
    // Handle quoted values
    sanitized = sanitized.replace(/\s+on[a-z]+\s*=\s*"[^"]*"/gi, '');
    sanitized = sanitized.replace(/\s+on[a-z]+\s*=\s*'[^']*'/gi, '');
    // Handle unquoted values
    sanitized = sanitized.replace(/\s+on[a-z]+\s*=\s*[^\s>"']+/gi, '');
    
    // Remove javascript: protocol in any context
    sanitized = sanitized.replace(/javascript\s*:/gi, 'blocked:');
    
    // Remove potentially dangerous data: URIs
    // Block anything that's not an image type
    sanitized = sanitized.replace(/data\s*:\s*(?!image\/(?:png|jpeg|jpg|gif|webp|svg\+xml))[a-z/+]+/gi, 'data:text/plain');
    
    // Remove foreignObject elements (can contain arbitrary HTML)
    sanitized = sanitized.replace(/<foreignObject[^>]*>[\s\S]*?<\/\s*foreignObject\s*>/gi, '');
    sanitized = sanitized.replace(/<foreignObject[^>]*\/\s*>/gi, '');
    
    // Remove use elements with external references
    sanitized = sanitized.replace(/<use[^>]*href\s*=\s*["'](?!#)[^"']*["'][^>]*\/?>/gi, '');
    
    // Remove set elements (can modify attributes dynamically)
    sanitized = sanitized.replace(/<set[^>]*\/?>/gi, '');
    
    // Remove animate elements that target href attributes
    sanitized = sanitized.replace(/<animate[^>]*attributeName\s*=\s*["'](?:href|xlink:href)["'][^>]*\/?>/gi, '');
    
    // Remove iframe and object elements
    sanitized = sanitized.replace(/<iframe[^>]*>[\s\S]*?<\/\s*iframe\s*>/gi, '');
    sanitized = sanitized.replace(/<object[^>]*>[\s\S]*?<\/\s*object\s*>/gi, '');
    sanitized = sanitized.replace(/<embed[^>]*\/?>/gi, '');
    
  } while (sanitized.length !== previousLength);
  
  return sanitized;
}

export async function GET(request: NextRequest) {
  // Verify admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const settings = await prisma.siteSetting.findUnique({
      where: { id: SITE_SETTINGS_ID },
      select: { logo_url: true },
    });

    if (settings?.logo_url) {
      return NextResponse.json({ 
        hasLogo: true, 
        url: settings.logo_url,
      });
    }
    
    return NextResponse.json({ 
      hasLogo: false, 
      url: null 
    });
  } catch (error) {
    console.error('Error fetching logo:', error);
    return NextResponse.json({ 
      hasLogo: false, 
      url: null 
    });
  }
}

export async function POST(request: NextRequest) {
  // Verify admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: 'File too large',
          details: { size: `Maximum file size is ${MAX_FILE_SIZE / 1024}KB` }
        },
        { status: 400 }
      );
    }

    // Validate file extension - must be exactly .svg at the end
    const fileName = file.name.toLowerCase();
    const svgExtensionMatch = fileName.match(/\.svg$/);
    if (!svgExtensionMatch) {
      return NextResponse.json(
        {
          error: 'Invalid file type',
          details: { type: 'Only SVG files are allowed for logos' }
        },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (file.type !== ALLOWED_MIME_TYPE) {
      return NextResponse.json(
        {
          error: 'Invalid file type',
          details: { mime: 'File must be an SVG image (image/svg+xml)' }
        },
        { status: 400 }
      );
    }

    // Read file content as text for SVG validation and sanitization
    const content = await file.text();

    // Validate SVG structure
    if (!isValidSvg(content)) {
      return NextResponse.json(
        {
          error: 'Invalid SVG file',
          details: { format: 'The file does not appear to be a valid SVG' }
        },
        { status: 400 }
      );
    }

    // Sanitize SVG content
    const sanitizedContent = sanitizeSvg(content);
    
    // Post-sanitization security check: reject if dangerous patterns remain
    // This is an additional safety layer in case the sanitization missed something
    const dangerousPatterns = [
      /<script/i,
      /\son[a-z]+\s*=/i,
      /javascript\s*:/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /<foreignObject/i,
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(sanitizedContent)) {
        return NextResponse.json(
          {
            error: 'SVG contains potentially unsafe content',
            details: { security: 'The SVG file contains elements that are not allowed for security reasons' }
          },
          { status: 400 }
        );
      }
    }

    // Convert SVG to data URL for storage in database
    const base64Content = Buffer.from(sanitizedContent).toString('base64');
    const dataUrl = `data:image/svg+xml;base64,${base64Content}`;

    // Store logo URL in database
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTINGS_ID },
      create: {
        id: SITE_SETTINGS_ID,
        logo_url: dataUrl,
      },
      update: {
        logo_url: dataUrl,
      },
    });

    return NextResponse.json({
      success: true,
      url: dataUrl,
      message: 'Logo uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    return NextResponse.json(
      { error: 'Failed to upload logo. Please try again.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // Verify admin authentication
  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    // Clear logo URL in database
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTINGS_ID },
      create: {
        id: SITE_SETTINGS_ID,
        logo_url: '',
      },
      update: {
        logo_url: '',
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Logo removed successfully'
    });
  } catch (error) {
    console.error('Error removing logo:', error);
    return NextResponse.json(
      { error: 'Failed to remove logo. Please try again.' },
      { status: 500 }
    );
  }
}

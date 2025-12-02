import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import { uploadFile, isBlobStorageConfigured, getStorageStatus } from '@/lib/blob-storage';
import type { UploadData } from '@/types/api';
import { successResponse, errorResponse } from '@/types/api';

// Only allow SVG format for logos
const ALLOWED_MIME_TYPE = 'image/svg+xml';
// Maximum file size:
// - 1MB when using blob storage (SVGs should be small but allow more for blob)
// - 512KB when using base64
const MAX_FILE_SIZE_BLOB = 1024 * 1024; // 1MB
const MAX_FILE_SIZE_BASE64 = 512 * 1024; // 512KB
const SITE_SETTINGS_ID = 1;

// Logo response data
interface LogoData {
  hasLogo: boolean;
  url: string | null;
}

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

    const logoData: LogoData = settings?.logo_url 
      ? { hasLogo: true, url: settings.logo_url }
      : { hasLogo: false, url: null };

    return NextResponse.json(
      successResponse(logoData, logoData.hasLogo ? 'Logo found' : 'No logo configured')
    );
  } catch (error) {
    console.error('Error fetching logo:', error);
    return NextResponse.json(
      successResponse({ hasLogo: false, url: null }, 'Error fetching logo, returning default')
    );
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
        errorResponse('No file provided'),
        { status: 400 }
      );
    }

    // Determine max file size based on storage type
    const useBlobStorage = isBlobStorageConfigured();
    const maxFileSize = useBlobStorage ? MAX_FILE_SIZE_BLOB : MAX_FILE_SIZE_BASE64;

    // Validate file size
    if (file.size > maxFileSize) {
      return NextResponse.json(
        errorResponse('File too large', { size: `Maximum file size is ${maxFileSize / 1024}KB` }),
        { status: 400 }
      );
    }

    // Validate file extension - must be exactly .svg at the end
    const fileName = file.name.toLowerCase();
    const svgExtensionMatch = fileName.match(/\.svg$/);
    if (!svgExtensionMatch) {
      return NextResponse.json(
        errorResponse('Invalid file type', { type: 'Only SVG files are allowed for logos' }),
        { status: 400 }
      );
    }

    // Validate MIME type
    if (file.type !== ALLOWED_MIME_TYPE) {
      return NextResponse.json(
        errorResponse('Invalid file type', { mime: 'File must be an SVG image (image/svg+xml)' }),
        { status: 400 }
      );
    }

    // Read file content as text for SVG validation and sanitization
    const content = await file.text();

    // Validate SVG structure
    if (!isValidSvg(content)) {
      return NextResponse.json(
        errorResponse('Invalid SVG file', { format: 'The file does not appear to be a valid SVG' }),
        { status: 400 }
      );
    }

    // Sanitize SVG content
    const sanitizedContent = sanitizeSvg(content);
    
    // Post-sanitization security check: reject if dangerous patterns remain
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
          errorResponse('SVG contains potentially unsafe content', { 
            security: 'The SVG file contains elements that are not allowed for security reasons' 
          }),
          { status: 400 }
        );
      }
    }

    let logoUrl: string;

    if (useBlobStorage) {
      // Create a new File from sanitized content for blob upload
      const sanitizedFile = new File([sanitizedContent], file.name, { type: file.type });
      const result = await uploadFile(sanitizedFile, { folder: 'logos' });
      logoUrl = result.url;
    } else if (process.env.NODE_ENV === 'production') {
      // In production, Azure Blob Storage is required
      const status = getStorageStatus();
      return NextResponse.json(
        errorResponse(
          'Azure Blob Storage configuration required',
          { 
            configuration: 'Azure Blob Storage is required for logo uploads in production.',
            missing: status.missingVariables.join(', '),
            help: 'Please configure Azure Blob Storage environment variables in Netlify dashboard.'
          }
        ),
        { status: 503 }
      );
    } else {
      // In development, allow base64 fallback with a warning
      console.warn('[LOGO UPLOAD] Azure Blob Storage not configured. Using base64 fallback (development only).');
      const base64Content = Buffer.from(sanitizedContent).toString('base64');
      logoUrl = `data:image/svg+xml;base64,${base64Content}`;
    }

    // Store logo URL in database
    await prisma.siteSetting.upsert({
      where: { id: SITE_SETTINGS_ID },
      create: {
        id: SITE_SETTINGS_ID,
        logo_url: logoUrl,
      },
      update: {
        logo_url: logoUrl,
      },
    });

    const uploadData: UploadData = {
      url: logoUrl,
      filename: file.name,
      size: file.size,
      type: file.type,
    };

    return NextResponse.json(
      successResponse(uploadData, 'Logo uploaded successfully')
    );
  } catch (error) {
    console.error('Error uploading logo:', error);
    return NextResponse.json(
      errorResponse('Failed to upload logo. Please try again.'),
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
    
    return NextResponse.json(
      successResponse(null, 'Logo removed successfully')
    );
  } catch (error) {
    console.error('Error removing logo:', error);
    return NextResponse.json(
      errorResponse('Failed to remove logo. Please try again.'),
      { status: 500 }
    );
  }
}

/**
 * Supplier File Upload API
 * Handles CSV and EDI file uploads for supplier integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/admin-auth';
import { requireCsrfToken } from '@/lib/security/csrf';
import { withRateLimit, getRateLimitConfig } from '@/lib/security/rate-limit-wrapper';
import { logInfo, logError } from '@/lib/logging/logger';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

async function handlePOST(request: NextRequest) {
  const csrfError = requireCsrfToken(request);
  if (csrfError) return csrfError;

  const authError = await requireAdminAuth(request);
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!type || !['csv', 'edi'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Must be csv or edi' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Read file content
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileContent = buffer.toString('utf-8');

    if (type === 'csv') {
      // For CSV, return the content as base64 for storage
      const csvData = `data:text/csv;base64,${buffer.toString('base64')}`;
      
      // Try to detect column mapping (first row as headers)
      const lines = fileContent.split('\n').filter(line => line.trim());
      const headers = lines[0]?.split(',').map(h => h.trim().replace(/^"|"$/g, '')) || [];
      
      // Auto-detect common column names
      const columnMapping: Record<string, string> = {};
      headers.forEach((header, index) => {
        const lowerHeader = header.toLowerCase();
        if (lowerHeader.includes('sku') || lowerHeader.includes('product')) {
          columnMapping.sku = header;
        } else if (lowerHeader.includes('name') || lowerHeader.includes('title')) {
          columnMapping.name = header;
        } else if (lowerHeader.includes('price') || lowerHeader.includes('cost')) {
          columnMapping.price = header;
        } else if (lowerHeader.includes('quantity') || lowerHeader.includes('qty') || lowerHeader.includes('stock')) {
          columnMapping.quantity = header;
        } else if (lowerHeader.includes('description')) {
          columnMapping.description = header;
        } else if (lowerHeader.includes('category')) {
          columnMapping.category = header;
        }
      });

      logInfo('CSV file uploaded', { 
        filename: file.name, 
        size: file.size,
        headers: headers.length,
        detectedColumns: Object.keys(columnMapping).length,
      });

      return NextResponse.json({
        success: true,
        csvData,
        columnMapping: Object.keys(columnMapping).length > 0 ? columnMapping : undefined,
        headers,
        rowCount: lines.length - 1,
      });
    } else if (type === 'edi') {
      // Detect EDI format
      let format: 'X12' | 'EDIFACT' | 'TRADACOMS' = 'X12';
      
      // X12 typically starts with ISA or ST segment
      if (fileContent.startsWith('ISA') || fileContent.includes('~ST~')) {
        format = 'X12';
      } 
      // EDIFACT starts with UNA, UNB, or UNH
      else if (fileContent.startsWith('UNA') || fileContent.includes("'UNB") || fileContent.includes("'UNH")) {
        format = 'EDIFACT';
      }
      // TRADACOMS uses STX/END
      else if (fileContent.includes('STX') || fileContent.includes('END')) {
        format = 'TRADACOMS';
      }

      const ediData = buffer.toString('utf-8');

      logInfo('EDI file uploaded', { 
        filename: file.name, 
        size: file.size,
        format,
      });

      return NextResponse.json({
        success: true,
        ediData,
        format,
      });
    }

    return NextResponse.json(
      { error: 'Unsupported file type' },
      { status: 400 }
    );
  } catch (error) {
    logError('Error processing supplier file upload:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process file' },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(handlePOST, getRateLimitConfig('admin'));


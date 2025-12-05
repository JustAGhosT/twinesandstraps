/**
 * PDF Quote Generation
 * Generates branded PDF quotes for customers
 */

// Note: This is a placeholder implementation
// In production, you would use a library like:
// - @react-pdf/renderer (React-based)
// - pdfkit (Node.js)
// - puppeteer (HTML to PDF)
// - jsPDF (Client-side)

export interface QuotePDFData {
  quoteNumber: string;
  customerName: string;
  customerEmail: string;
  customerCompany?: string;
  items: Array<{
    productName: string;
    productSku?: string;
    description?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  vatAmount: number;
  total: number;
  notes?: string;
  expiresAt?: Date;
  createdAt: Date;
}

/**
 * Generate PDF quote (placeholder - requires PDF library)
 */
export async function generateQuotePDF(data: QuotePDFData): Promise<Buffer | null> {
  // This is a placeholder implementation
  // In production, implement using a PDF library:
  
  // Example with @react-pdf/renderer:
  // import { renderToBuffer } from '@react-pdf/renderer';
  // import QuotePDFDocument from './QuotePDFDocument';
  // return await renderToBuffer(<QuotePDFDocument data={data} />);
  
  // Example with pdfkit:
  // import PDFDocument from 'pdfkit';
  // const doc = new PDFDocument();
  // doc.text(`Quote ${data.quoteNumber}`, 100, 100);
  // ... add content ...
  // return doc.end();
  
  console.warn('PDF generation not yet implemented. Install a PDF library to enable this feature.');
  return null;
}

/**
 * Generate quote PDF as HTML (for email or preview)
 */
export function generateQuoteHTML(data: QuotePDFData): string {
  const itemsHtml = data.items.map((item, index) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${index + 1}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        <strong>${item.productName}</strong>
        ${item.productSku ? `<br><small>SKU: ${item.productSku}</small>` : ''}
        ${item.description ? `<br><small>${item.description}</small>` : ''}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">R${item.unitPrice.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">R${item.totalPrice.toFixed(2)}</td>
    </tr>
  `).join('');

  const expiryText = data.expiresAt 
    ? `<p><strong>Valid until:</strong> ${data.expiresAt.toLocaleDateString()}</p>`
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
        .header { background-color: #E31E24; color: white; padding: 20px; text-align: center; margin-bottom: 30px; }
        .content { max-width: 800px; margin: 0 auto; background: white; padding: 30px; }
        .quote-info { margin-bottom: 30px; }
        .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .items-table th { background-color: #f5f5f5; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
        .items-table td { padding: 10px; border-bottom: 1px solid #eee; }
        .totals { margin-top: 20px; text-align: right; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="content">
        <div class="header">
          <h1>QUOTE</h1>
          <h2>TASSA - Twines and Straps SA</h2>
        </div>

        <div class="quote-info">
          <p><strong>Quote Number:</strong> ${data.quoteNumber}</p>
          <p><strong>Date:</strong> ${data.createdAt.toLocaleDateString()}</p>
          ${expiryText}
          <p><strong>Customer:</strong> ${data.customerName}</p>
          ${data.customerCompany ? `<p><strong>Company:</strong> ${data.customerCompany}</p>` : ''}
          <p><strong>Email:</strong> ${data.customerEmail}</p>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 5%;">#</th>
              <th>Product</th>
              <th style="width: 10%; text-align: center;">Qty</th>
              <th style="width: 15%; text-align: right;">Unit Price</th>
              <th style="width: 15%; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals">
          <p><strong>Subtotal:</strong> R${data.subtotal.toFixed(2)}</p>
          <p><strong>VAT (15%):</strong> R${data.vatAmount.toFixed(2)}</p>
          <p style="font-size: 1.2em; font-weight: bold; margin-top: 10px;">Total: R${data.total.toFixed(2)}</p>
        </div>

        ${data.notes ? `<div style="margin-top: 30px; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #E31E24;"><strong>Notes:</strong><br>${data.notes}</div>` : ''}

        <div class="footer">
          <p>TASSA - Twines and Straps SA (Pty) Ltd</p>
          <p>Email: admin@tassa.co.za | Phone: +27 (0)63 969 0773</p>
          <p>This quote is valid for 30 days from the date of issue unless otherwise stated.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}


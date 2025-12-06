/**
 * Supplier & Marketplace Accounting Integration
 * Syncs supplier invoices and marketplace expenses to accounting system
 */

import { getAccountingProvider } from '@/lib/accounting/provider.factory';
import { ContactRequest, InvoiceRequest, PaymentRequest } from '@/lib/accounting/provider.interface';
import prisma from '@/lib/prisma';
import { logInfo, logError, logWarn } from '@/lib/logging/logger';

/**
 * Sync supplier to accounting system as a contact
 */
export async function syncSupplierToAccounting(supplierId: number): Promise<{
  success: boolean;
  contactId?: string;
  error?: string;
}> {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      return { success: false, error: 'Supplier not found' };
    }

    const accountingProvider = getAccountingProvider();
    if (!accountingProvider || !await accountingProvider.isConnected()) {
      logWarn('Accounting provider not connected, cannot sync supplier', { supplierId });
      return { success: false, error: 'Accounting provider not connected' };
    }

    const contactRequest: ContactRequest = {
      name: supplier.name,
      email: supplier.email || undefined,
      phone: supplier.phone || undefined,
      address: supplier.address ? {
        street: supplier.address,
        city: '',
        province: '',
        postalCode: '',
        country: 'South Africa',
      } : undefined,
      isSupplier: true,
      isCustomer: false,
    };

    const result = await accountingProvider.createOrUpdateContact(contactRequest);

    if (result.success && result.contactId) {
      logInfo('Supplier synced to accounting', { 
        supplierId, 
        supplierName: supplier.name,
        contactId: result.contactId,
      });
    }

    return result;
  } catch (error) {
    logError('Error syncing supplier to accounting', error, { supplierId });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create accounting invoice for supplier purchase order
 */
export async function createSupplierInvoice(
  supplierId: number,
  purchaseOrder: {
    orderNumber: string;
    items: Array<{
      name: string;
      quantity: number;
      unitPrice: number;
    }>;
    total: number;
    tax: number;
    orderDate: Date;
    dueDate?: Date;
    reference?: string;
  }
): Promise<{
  success: boolean;
  invoiceId?: string;
  error?: string;
}> {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
    });

    if (!supplier) {
      return { success: false, error: 'Supplier not found' };
    }

    const accountingProvider = getAccountingProvider();
    if (!accountingProvider || !await accountingProvider.isConnected()) {
      return { success: false, error: 'Accounting provider not connected' };
    }

    // Ensure supplier contact exists in accounting
    const contactResult = await syncSupplierToAccounting(supplierId);
    if (!contactResult.success || !contactResult.contactId) {
      logWarn('Failed to sync supplier contact before creating invoice', { supplierId });
    }

    const invoiceRequest: InvoiceRequest = {
      orderId: `SUPPLIER-${supplierId}-${purchaseOrder.orderNumber}`,
      orderNumber: purchaseOrder.orderNumber,
      customer: {
        name: supplier.name,
        email: supplier.email || undefined,
        phone: supplier.phone || undefined,
        address: supplier.address ? {
          street: supplier.address,
          city: '',
          province: '',
          postalCode: '',
          country: 'South Africa',
        } : undefined,
      },
      items: purchaseOrder.items,
      subtotal: purchaseOrder.total - purchaseOrder.tax,
      tax: purchaseOrder.tax,
      total: purchaseOrder.total,
      currency: 'ZAR',
      invoiceDate: purchaseOrder.orderDate,
      dueDate: purchaseOrder.dueDate,
      reference: purchaseOrder.reference,
      notes: `Supplier purchase order from ${supplier.name}`,
    };

    const result = await accountingProvider.createInvoice(invoiceRequest);

    if (result.success) {
      logInfo('Supplier invoice created in accounting', {
        supplierId,
        orderNumber: purchaseOrder.orderNumber,
        invoiceId: result.invoiceId,
      });
    }

    return result;
  } catch (error) {
    logError('Error creating supplier invoice', error, { supplierId });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sync marketplace expenses to accounting
 */
export async function syncMarketplaceExpenses(
  marketplaceName: string,
  expenses: Array<{
    date: Date;
    description: string;
    amount: number;
    feeType: 'commission' | 'listing' | 'transaction' | 'advertising';
    reference?: string;
  }>
): Promise<{
  success: boolean;
  synced: number;
  failed: number;
  errors?: string[];
}> {
  try {
    const accountingProvider = getAccountingProvider();
    if (!accountingProvider || !await accountingProvider.isConnected()) {
      return { success: false, synced: 0, failed: expenses.length };
    }

    // Create marketplace as a supplier/contact if not exists
    const contactRequest: ContactRequest = {
      name: `${marketplaceName} Marketplace`,
      isSupplier: true,
      isCustomer: false,
    };

    await accountingProvider.createOrUpdateContact(contactRequest);

    // Record each expense as a bill/invoice
    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const expense of expenses) {
      try {
        const invoiceRequest: InvoiceRequest = {
          orderId: `MARKETPLACE-${marketplaceName}-${expense.reference || Date.now()}`,
          orderNumber: expense.reference || `MP-${Date.now()}`,
          customer: {
            name: `${marketplaceName} Marketplace`,
          },
          items: [{
            name: `${expense.feeType} fee - ${expense.description}`,
            quantity: 1,
            unitPrice: expense.amount,
          }],
          subtotal: expense.amount,
          tax: 0,
          total: expense.amount,
          currency: 'ZAR',
          invoiceDate: expense.date,
          notes: `Marketplace ${expense.feeType} fee`,
        };

        const result = await accountingProvider.createInvoice(invoiceRequest);
        if (result.success) {
          synced++;
        } else {
          failed++;
          errors.push(`${expense.description}: ${result.error}`);
        }
      } catch (error) {
        failed++;
        errors.push(`${expense.description}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    logInfo('Marketplace expenses synced to accounting', {
      marketplaceName,
      synced,
      failed,
      total: expenses.length,
    });

    return {
      success: synced > 0,
      synced,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    logError('Error syncing marketplace expenses', error, { marketplaceName });
    return {
      success: false,
      synced: 0,
      failed: expenses.length,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Record payment to supplier in accounting
 */
export async function recordSupplierPayment(
  supplierId: number,
  payment: {
    invoiceId: string;
    amount: number;
    paymentDate: Date;
    paymentMethod?: string;
    reference?: string;
  }
): Promise<{
  success: boolean;
  paymentId?: string;
  error?: string;
}> {
  try {
    const accountingProvider = getAccountingProvider();
    if (!accountingProvider || !await accountingProvider.isConnected()) {
      return { success: false, error: 'Accounting provider not connected' };
    }

    const paymentRequest: PaymentRequest = {
      invoiceId: payment.invoiceId,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod || 'Bank Transfer',
      reference: payment.reference,
    };

    const result = await accountingProvider.recordPayment(paymentRequest);

    if (result.success) {
      logInfo('Supplier payment recorded in accounting', {
        supplierId,
        invoiceId: payment.invoiceId,
        amount: payment.amount,
      });
    }

    return result;
  } catch (error) {
    logError('Error recording supplier payment', error, { supplierId });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get supplier accounting summary
 */
export async function getSupplierAccountingSummary(supplierId: number): Promise<{
  contactId?: string;
  totalInvoices: number;
  totalPaid: number;
  totalDue: number;
  recentInvoices: Array<{
    invoiceId: string;
    amount: number;
    status: string;
    date: Date;
  }>;
}> {
  try {
    // This would query accounting system via provider
    // For now, return placeholder structure
    return {
      totalInvoices: 0,
      totalPaid: 0,
      totalDue: 0,
      recentInvoices: [],
    };
  } catch (error) {
    logError('Error getting supplier accounting summary', error, { supplierId });
    return {
      totalInvoices: 0,
      totalPaid: 0,
      totalDue: 0,
      recentInvoices: [],
    };
  }
}


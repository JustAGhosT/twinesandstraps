/**
 * API Response Types Tests
 * 
 * Tests for the standardized API response types and helper functions.
 */

import { successResponse, errorResponse } from '@/types/api';
import type { ApiSuccessResponse, ApiErrorResponse, PaginatedData, UploadData } from '@/types/api';

describe('API Response Types', () => {
  describe('successResponse helper', () => {
    it('should create a success response with data', () => {
      const data = { id: 1, name: 'Test' };
      const response = successResponse(data, 'Operation successful');

      expect(response.success).toBe(true);
      expect(response.message).toBe('Operation successful');
      expect(response.data).toEqual(data);
    });

    it('should use default message when not provided', () => {
      const data = { id: 1 };
      const response = successResponse(data);

      expect(response.success).toBe(true);
      expect(response.message).toBe('Operation successful');
      expect(response.data).toEqual(data);
    });

    it('should handle null data', () => {
      const response = successResponse(null, 'Deleted');

      expect(response.success).toBe(true);
      expect(response.data).toBeNull();
    });

    it('should handle array data', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const response = successResponse(data, 'Items retrieved');

      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(2);
    });
  });

  describe('errorResponse helper', () => {
    it('should create an error response', () => {
      const response = errorResponse('Something went wrong');

      expect(response.success).toBe(false);
      expect(response.error).toBe('Something went wrong');
      expect(response.message).toBe('Something went wrong');
    });

    it('should include details when provided', () => {
      const response = errorResponse('Validation failed', {
        email: 'Invalid email format',
        password: 'Password too short',
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Validation failed');
      expect(response.details).toEqual({
        email: 'Invalid email format',
        password: 'Password too short',
      });
    });
  });

  describe('Type checking', () => {
    it('should correctly type ApiSuccessResponse', () => {
      interface TestData {
        id: number;
        name: string;
      }

      const response: ApiSuccessResponse<TestData> = {
        success: true,
        message: 'Success',
        data: { id: 1, name: 'Test' },
      };

      expect(response.success).toBe(true);
      expect(response.data.id).toBe(1);
      expect(response.data.name).toBe('Test');
    });

    it('should correctly type ApiErrorResponse', () => {
      const response: ApiErrorResponse = {
        success: false,
        message: 'Error',
        error: 'Something went wrong',
        details: { field: 'error message' },
      };

      expect(response.success).toBe(false);
      expect(response.error).toBe('Something went wrong');
    });

    it('should correctly type PaginatedData', () => {
      interface Item {
        id: number;
      }

      const paginatedData: PaginatedData<Item> = {
        items: [{ id: 1 }, { id: 2 }],
        pagination: {
          page: 1,
          limit: 10,
          total: 100,
          totalPages: 10,
          hasMore: true,
        },
      };

      expect(paginatedData.items).toHaveLength(2);
      expect(paginatedData.pagination.page).toBe(1);
      expect(paginatedData.pagination.hasMore).toBe(true);
    });

    it('should correctly type UploadData', () => {
      const uploadData: UploadData = {
        url: 'https://example.com/image.jpg',
        filename: 'image.jpg',
        size: 1024,
        type: 'image/jpeg',
      };

      expect(uploadData.url).toBe('https://example.com/image.jpg');
      expect(uploadData.filename).toBe('image.jpg');
      expect(uploadData.size).toBe(1024);
      expect(uploadData.type).toBe('image/jpeg');
    });
  });
});

describe('API Response Patterns', () => {
  describe('Success response patterns', () => {
    it('should match pattern for single item response', () => {
      const product = { id: 1, name: 'Test Product', price: 99.99 };
      const response = successResponse(product, 'Product retrieved successfully');

      expect(response).toMatchObject({
        success: true,
        message: 'Product retrieved successfully',
        data: product,
      });
    });

    it('should match pattern for list response', () => {
      const products = [
        { id: 1, name: 'Product 1' },
        { id: 2, name: 'Product 2' },
      ];
      const response = successResponse(products, 'Products retrieved successfully');

      expect(response).toMatchObject({
        success: true,
        message: 'Products retrieved successfully',
        data: products,
      });
    });

    it('should match pattern for paginated response', () => {
      const paginatedData: PaginatedData<{ id: number }> = {
        items: [{ id: 1 }, { id: 2 }],
        pagination: {
          page: 1,
          limit: 20,
          total: 100,
          totalPages: 5,
          hasMore: true,
        },
      };
      const response = successResponse(paginatedData, 'Items retrieved');

      expect(response.success).toBe(true);
      expect(response.data.items).toHaveLength(2);
      expect(response.data.pagination.totalPages).toBe(5);
    });

    it('should match pattern for delete response', () => {
      const response = successResponse(null, 'Item deleted successfully');

      expect(response).toMatchObject({
        success: true,
        message: 'Item deleted successfully',
        data: null,
      });
    });
  });

  describe('Error response patterns', () => {
    it('should match pattern for validation error', () => {
      const response = errorResponse('Validation failed', {
        name: 'Name is required',
        email: 'Invalid email format',
      });

      expect(response.success).toBe(false);
      expect(response.error).toBe('Validation failed');
      expect(response.details).toHaveProperty('name');
      expect(response.details).toHaveProperty('email');
    });

    it('should match pattern for not found error', () => {
      const response = errorResponse('Product not found');

      expect(response.success).toBe(false);
      expect(response.error).toBe('Product not found');
    });

    it('should match pattern for server error', () => {
      const response = errorResponse('Failed to process request. Please try again.');

      expect(response.success).toBe(false);
      expect(response.error).toBe('Failed to process request. Please try again.');
    });
  });
});

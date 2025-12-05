# Database Query Optimization

**Last Updated:** December 2024

This document outlines the database query optimizations implemented in the application.

---

## Optimizations Implemented

### 1. Related Products Query (`getRelatedProducts`)

**Before:**
- Two separate queries when `categoryId` not provided:
  1. Fetch product to get `category_id`
  2. Fetch related products

**After:**
- Optimized to fetch only `category_id` when needed (minimal data)
- Single query for related products with selective includes
- Uses caching to avoid repeated queries

**Impact:** Reduced from 2 queries to 1-2 queries (only when categoryId missing), with caching

---

### 2. Order Lookup Query (`/api/user/orders/[id]`)

**Before:**
- Two separate queries:
  1. Try to find by `order_number`
  2. If not found, try by `id`

**After:**
- Single query using `OR` condition
- Handles both `order_number` and `id` in one query

**Impact:** Reduced from 2 queries to 1 query

---

### 3. Customer List Query (`/api/admin/customers`)

**Already Optimized:**
- Uses `Promise.all` for parallel queries
- Batch query for order totals (prevents N+1)
- Uses `_count` for efficient counting

**Status:** ✅ Already optimized

---

### 4. Product Listing Query (`/api/products`)

**Already Optimized:**
- Single query with `include` for category
- Proper pagination with `skip` and `take`
- Uses `Promise.all` for count and data

**Status:** ✅ Already optimized

---

## Indexes Added

The following indexes have been added to optimize query performance:

### Product Table
- `category_id` - For category filtering
- `stock_status` - For stock status filtering
- `created_at` - For sorting by date
- `supplier_id` - For supplier filtering
- `slug` - For SEO-friendly URL lookups

### Order Table
- `user_id` - For user order lookups
- `status` - For status filtering
- `payment_status` - For payment status filtering
- `created_at` - For date sorting
- `order_number` - For order number lookups

---

## Caching Strategy

### In-Memory Cache
- Product details: 1 hour TTL
- Related products: 1 hour TTL
- Featured products: 30 minutes TTL

### Cache Keys
- `product:{idOrSlug}` - Individual products
- `related:{productId}` - Related products
- `featured:{count}` - Featured products

### Cache Invalidation
- Product updates invalidate product cache
- Category updates invalidate related products cache

---

## Query Patterns to Avoid

### ❌ N+1 Query Problem

**Bad:**
```typescript
const orders = await prisma.order.findMany();
for (const order of orders) {
  const user = await prisma.user.findUnique({ where: { id: order.user_id } });
}
```

**Good:**
```typescript
const orders = await prisma.order.findMany({
  include: { user: true }
});
```

### ❌ Multiple Sequential Queries

**Bad:**
```typescript
const product = await prisma.product.findUnique({ where: { id } });
const category = await prisma.category.findUnique({ where: { id: product.category_id } });
```

**Good:**
```typescript
const product = await prisma.product.findUnique({
  where: { id },
  include: { category: true }
});
```

### ❌ Unnecessary Data Fetching

**Bad:**
```typescript
const products = await prisma.product.findMany({
  include: { 
    category: true,
    order_items: true,
    reviews: true,
    quote_items: true
  }
});
```

**Good:**
```typescript
const products = await prisma.product.findMany({
  include: { 
    category: {
      select: { id: true, name: true, slug: true }
    }
  }
});
```

---

## Performance Monitoring

### Query Performance Metrics

Monitor the following:
- Query execution time (target: < 100ms for most queries)
- Number of queries per request (target: < 5 for complex pages)
- Cache hit rate (target: > 80%)

### Tools

1. **Prisma Query Logging:**
   ```typescript
   const prisma = new PrismaClient({
     log: ['query', 'info', 'warn', 'error'],
   });
   ```

2. **Database Query Analysis:**
   - Enable PostgreSQL slow query log
   - Use `EXPLAIN ANALYZE` for query plans

3. **Application Insights:**
   - Track query execution times
   - Monitor cache hit rates

---

## Future Optimizations

### Planned

1. **Redis Caching Layer**
   - Replace in-memory cache with Redis
   - Distributed caching across instances
   - Longer TTL for stable data

2. **Database Connection Pooling**
   - Configure Prisma connection pool
   - Optimize pool size based on load

3. **Query Result Pagination**
   - Implement cursor-based pagination for large datasets
   - Reduce memory usage

4. **Materialized Views**
   - For complex aggregations (e.g., sales reports)
   - Refresh on schedule

---

## Best Practices

1. **Always use `include` or `select`** instead of separate queries
2. **Use `Promise.all`** for parallel independent queries
3. **Limit data fetched** with `select` for large relations
4. **Use indexes** on frequently filtered/sorted columns
5. **Cache expensive queries** with appropriate TTL
6. **Monitor query performance** regularly
7. **Use database query logging** in development

---

*This document should be updated as new optimizations are implemented.*


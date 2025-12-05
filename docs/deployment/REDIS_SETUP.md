# Redis Caching Setup

**Last Updated:** December 2024

This document explains how to set up Redis caching for the application.

---

## Overview

The application now supports Redis caching with automatic fallback to in-memory cache. When Redis is configured, it will be used automatically. If Redis is not available, the application falls back to in-memory caching.

---

## Azure Cache for Redis Setup

### 1. Create Redis Instance

#### Option A: Azure Portal

1. Go to Azure Portal → **Create a resource**
2. Search for **Azure Cache for Redis**
3. Click **Create**
4. Fill in the details:
   - **Subscription:** Your subscription
   - **Resource group:** Your resource group
   - **DNS name:** `twinesandstraps-redis` (or your preferred name)
   - **Location:** Same region as your App Service
   - **Pricing tier:** Basic C0 (for development) or Standard C1+ (for production)
5. Click **Create**

#### Option B: Azure CLI

```bash
# Create Redis cache
az redis create \
  --resource-group rg-twinesandstraps \
  --name twinesandstraps-redis \
  --location southafricanorth \
  --sku Basic \
  --vm-size c0
```

### 2. Get Connection String

1. Go to your Redis cache in Azure Portal
2. Navigate to **Access keys**
3. Copy the **Primary connection string** (or Secondary for redundancy)

The connection string format:
```
rediss://:password@hostname:6380?ssl=true
```

### 3. Configure Environment Variables

Add to your App Service **Configuration** → **Application settings**:

```bash
REDIS_URL=rediss://:your-password@your-redis-hostname:6380?ssl=true
```

**Or for local development, add to `.env.local`:**
```bash
REDIS_URL=redis://localhost:6379
```

---

## Local Development Setup

### Option 1: Docker (Recommended)

```bash
# Run Redis in Docker
docker run -d -p 6379:6379 --name redis redis:7-alpine

# Or with persistence
docker run -d -p 6379:6379 --name redis -v redis-data:/data redis:7-alpine redis-server --appendonly yes
```

### Option 2: Install Redis Locally

**Windows:**
- Download from: https://github.com/microsoftarchive/redis/releases
- Or use WSL: `sudo apt-get install redis-server`

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

### Option 3: Use Redis Cloud (Free Tier)

1. Sign up at https://redis.com/try-free/
2. Create a free database
3. Get connection string
4. Add to `.env.local`:
```bash
REDIS_URL=redis://:password@hostname:port
```

---

## Verification

### Check Redis Connection

The application will automatically:
- Try to connect to Redis on startup
- Log connection status to console
- Fall back to memory cache if Redis unavailable

### Test Redis Connection

```bash
# Using redis-cli (if installed)
redis-cli ping
# Should return: PONG

# Or test from Node.js
node -e "const Redis = require('ioredis'); const r = new Redis(process.env.REDIS_URL); r.ping().then(console.log);"
```

### Check Cache Type in Admin

1. Go to `/admin/cache/stats`
2. Check `cacheType` field:
   - `"redis"` = Redis is active
   - `"memory"` = Using in-memory cache (Redis not available)

---

## Cache Statistics

### View Cache Stats

**API Endpoint:**
```
GET /api/admin/cache/stats
```

**Response:**
```json
{
  "success": true,
  "cacheType": "redis",
  "redisConnected": true,
  "stats": {
    "hits": 1250,
    "misses": 350,
    "sets": 450,
    "deletes": 120,
    "hitRate": 78.13
  }
}
```

### Cache Warming

**Manual Cache Warm-up:**
```
POST /api/admin/cache/warm
```

This pre-fetches:
- Featured products
- Categories
- Other frequently accessed data

---

## Cache Invalidation

Cache is automatically invalidated when:
- Products are created/updated/deleted
- Categories are created/updated/deleted
- Related data changes

**Manual Invalidation:**
```typescript
import { invalidateProductCache, invalidateCategoryCache } from '@/lib/cache';

// Invalidate all product cache
await invalidateProductCache();

// Invalidate specific product
await invalidateProductCache(productId);

// Invalidate category cache
await invalidateCategoryCache();
```

---

## Performance Benefits

### With Redis:
- ✅ Shared cache across multiple app instances
- ✅ Persistent cache (survives app restarts)
- ✅ Better performance for high-traffic scenarios
- ✅ Cache hit rate tracking
- ✅ Distributed caching

### With Memory Cache (Fallback):
- ✅ No external dependencies
- ✅ Fast for single-instance deployments
- ✅ Automatic cleanup of expired entries
- ⚠️ Cache lost on app restart
- ⚠️ Not shared across instances

---

## Monitoring

### Azure Portal

1. Go to your Redis cache
2. Navigate to **Metrics**
3. Monitor:
   - **Cache hits**
   - **Cache misses**
   - **Connected clients**
   - **Memory usage**

### Application Logs

Check application logs for:
- `✅ Redis connected` - Successful connection
- `Redis connection error` - Connection issues
- `Redis reconnecting...` - Automatic reconnection

---

## Troubleshooting

### Redis Not Connecting

1. **Check Connection String:**
   - Verify `REDIS_URL` is set correctly
   - Ensure password is included
   - Check SSL settings for Azure

2. **Check Network:**
   - Azure: Verify App Service can reach Redis (same VNet or public endpoint)
   - Local: Ensure Redis is running on correct port

3. **Check Firewall:**
   - Azure: Add App Service IP to Redis firewall rules
   - Local: Check if port 6379 is accessible

### High Memory Usage

1. **Monitor Redis Memory:**
   - Check Azure Portal metrics
   - Use `redis-cli INFO memory`

2. **Adjust TTL:**
   - Reduce TTL for less critical data
   - Clear cache periodically if needed

3. **Upgrade Tier:**
   - Consider upgrading Redis tier if memory is consistently high

### Cache Not Working

1. **Check Cache Type:**
   - Verify Redis is actually being used (check `/api/admin/cache/stats`)
   - Check application logs for connection errors

2. **Test Manually:**
   - Try cache warming endpoint
   - Check if data is being cached

---

## Best Practices

1. **TTL Configuration:**
   - Product data: 1 hour
   - Category data: 1 hour
   - Featured products: 30 minutes
   - Site settings: 24 hours

2. **Cache Warming:**
   - Warm cache on application startup
   - Warm cache after deployments
   - Schedule periodic cache warming

3. **Invalidation:**
   - Always invalidate cache on data updates
   - Use pattern-based invalidation for related data
   - Don't over-invalidate (only when necessary)

4. **Monitoring:**
   - Track cache hit rates (target: > 80%)
   - Monitor Redis memory usage
   - Set up alerts for connection failures

---

## Cost Considerations

### Azure Cache for Redis

- **Basic C0:** ~$15/month (250MB, single instance)
- **Standard C1:** ~$60/month (1GB, with replication)
- **Standard C2:** ~$120/month (2.5GB, with replication)

### Free Alternatives

- **Redis Cloud:** Free tier (30MB)
- **Local Redis:** Free (for development)
- **Docker Redis:** Free (for development)

---

## Security

1. **Use SSL/TLS:**
   - Azure Redis uses SSL by default
   - Local: Consider using `rediss://` for SSL

2. **Password Protection:**
   - Always use passwords in production
   - Rotate passwords regularly

3. **Network Security:**
   - Use Azure Private Endpoints if possible
   - Restrict access to specific IPs
   - Use VNet integration for Azure resources

---

*Last Updated: December 2024*


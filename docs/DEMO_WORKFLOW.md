# Demo Workflow

Step-by-step guide for presenting the platform to clients and stakeholders.

> **Looking for setup instructions?** See the [Setup Guide](./SETUP.md) for environment configuration.

---

## Pre-Demo Setup

### 1. Environment Setup
```bash
# Ensure dependencies are installed
npm install

# Run database migrations
npx prisma migrate dev

# Seed demo data (if available)
npx prisma db seed

# Start the development server
npm run dev
```

### 2. Demo Credentials
| Role | URL | Credentials |
|------|-----|-------------|
| Admin | `/admin/login` | Set via `ADMIN_PASSWORD` env var |
| Test User | `/login` | Create during demo or pre-seed |

### 3. Browser Setup
- Open two browser windows (one for admin, one for customer view)
- Clear any existing session cookies if needed
- Have mobile device ready for responsive demo

---

## Demo Script

### Part 1: Public Website (5-10 min)

#### 1.1 Homepage Tour
1. Navigate to `/`
2. Highlight:
   - Professional branding and design
   - Hero section with call-to-action
   - Featured products section
   - Trust badges and testimonials
   - WhatsApp integration
   - Responsive navigation

#### 1.2 Product Catalog
1. Navigate to `/products`
2. Demonstrate:
   - Category filtering (sidebar)
   - Search functionality (if enabled)
   - Product grid layout
   - Stock status badges
   - Price display in ZAR

#### 1.3 Product Detail Page
1. Click on any product
2. Show:
   - High-quality image with zoom
   - Complete specifications (SKU, material, dimensions)
   - Quantity selector
   - "Add to Cart" button (controlled by feature flag)
   - "Request Quote" button
   - WhatsApp quote integration
   - Related products section

#### 1.4 Shopping Cart
1. Add items to cart
2. Navigate to `/cart`
3. Demonstrate:
   - Cart summary with VAT breakdown
   - Quantity adjustments
   - Remove items
   - Price calculations
   - "Send Quote Request" via WhatsApp (sends all cart items)
   - Continue shopping / Clear cart options

---

### Part 2: User Account Features (5-10 min)

#### 2.1 Registration
1. Navigate to `/register`
2. Create a new account:
   - Name: Demo User
   - Email: demo@example.com
   - Password: (secure password)
   - Marketing consent checkbox

#### 2.2 Login
1. Navigate to `/login`
2. Show:
   - Email/password login
   - "Forgot password?" link
   - Registration link

#### 2.3 User Profile
1. Navigate to `/profile`
2. Tour each tab:

**Overview Tab:**
- Quick stats (orders, addresses, products viewed)
- Recent orders summary
- Recently viewed products

**Orders Tab:**
- Order history list
- Order status badges
- Click to view order details

**Addresses Tab:**
- Saved addresses list
- Click "Add New Address"
- Fill in SA address with province dropdown
- Set as default option
- Edit/Delete existing addresses

**Recently Viewed Tab:**
- View history grid
- Clear history button

**Settings Tab:**
- Update profile information
- Change password
- Marketing preferences

#### 2.4 Password Reset Flow
1. Logout and go to `/login`
2. Click "Forgot password?"
3. Show the reset flow:
   - Enter email
   - (Explain email would be sent)
   - Reset password page

---

### Part 3: Admin Panel (10-15 min)

#### 3.1 Admin Login
1. Navigate to `/admin/login`
2. Enter admin credentials
3. Note: Hidden access via footer logo (click 5 times)

#### 3.2 Dashboard
1. Show overview statistics:
   - Total orders
   - Revenue
   - Customer count
   - Recent activity

#### 3.3 Order Management
1. Navigate to `/admin/orders`
2. Demonstrate:
   - Order list with filters (status, date)
   - Search by order number
   - Click order for details
   - Update order status
   - View order items and customer info
   - Order timeline/history

#### 3.4 Customer Management
1. Navigate to `/admin/customers`
2. Show:
   - Customer list with search
   - Sort by name, date, orders
   - Click customer for details
   - View customer orders
   - View saved addresses
   - Customer statistics (total spent, order count)

#### 3.5 Product Management
1. Navigate to `/admin/products`
2. Demonstrate:
   - Product list
   - Add new product
   - Edit existing product
   - Upload images
   - Set pricing and stock status
   - Assign categories

#### 3.6 Category Management
1. Navigate to `/admin/categories`
2. Show:
   - Category list
   - Add/edit categories
   - Category hierarchy (if applicable)

#### 3.7 Feature Flags
1. Navigate to `/admin/features`
2. Demonstrate toggling features:
   - Turn off "Newsletter Signup"
   - Refresh public site to show change
   - Turn it back on
3. Explain categories:
   - Marketing & Engagement
   - E-commerce Features
   - UI/UX Features
   - User Features

#### 3.8 Site Settings
1. Navigate to `/admin/settings`
2. Show configurable options:
   - Store name and contact info
   - Business details
   - WhatsApp number

#### 3.9 Theme Customization
1. Navigate to `/admin/theme`
2. Demonstrate:
   - Color picker for primary/secondary colors
   - Live preview
   - Save and apply changes

---

### Part 4: Mobile Responsiveness (2-3 min)

1. Open site on mobile device or use browser dev tools
2. Show:
   - Responsive navigation (hamburger menu)
   - Mobile-optimized product grid
   - Touch-friendly buttons
   - Mobile cart experience

---

### Part 5: Technical Highlights (2-3 min)

Briefly mention:
- **Built with Next.js 14** - Modern React framework
- **PostgreSQL Database** - Reliable data storage
- **Prisma ORM** - Type-safe database access
- **Feature Flags** - Toggle features without code changes
- **Responsive Design** - Works on all devices
- **South African Focus** - ZAR currency, SA provinces, local payment options ready

---

## Q&A Topics

Be prepared to discuss:

1. **Hosting**
   - Currently deployed on Netlify
   - Alternative: Vercel, Self-hosted

2. **Payment Integration**
   - PayFast (SA popular)
   - Stripe
   - Yoco

3. **Future Features**
   - Full checkout flow (already built, controlled by feature flag)
   - Product reviews
   - Inventory management
   - Email notifications
   - Analytics dashboard

4. **Customization**
   - Branding changes
   - Additional features
   - Integration with existing systems

5. **Costs**
   - Reference `docs/COST_ANALYSIS.md`
   - Free tier available for testing
   - Production costs R665-R1,615/month

---

## Demo Checklist

### Before Demo
- [ ] Development server running
- [ ] Database seeded with sample data
- [ ] Admin password set
- [ ] Test user account created
- [ ] Sample products with images
- [ ] Sample orders in various statuses

### During Demo
- [ ] Homepage tour complete
- [ ] Product browsing demonstrated
- [ ] User registration shown
- [ ] Profile features walked through
- [ ] Admin panel fully toured
- [ ] Feature flags demonstrated
- [ ] Mobile responsiveness shown

### After Demo
- [ ] Answer questions
- [ ] Provide cost estimate
- [ ] Discuss timeline for customizations
- [ ] Share documentation links

---

## Troubleshooting

### Common Issues

**"Cannot connect to database"**
```bash
# Check database is running
npx prisma db push
```

**"Admin login not working"**
```bash
# Ensure ADMIN_PASSWORD is set in .env
echo "ADMIN_PASSWORD=your_secure_password" >> .env
```

**"Products not showing"**
```bash
# Seed the database
npx prisma db seed
```

**"Styles look broken"**
```bash
# Rebuild CSS
npm run build
```

---

## Demo URLs Quick Reference

| Page | URL |
|------|-----|
| Homepage | `http://localhost:3000/` |
| Products | `http://localhost:3000/products` |
| Cart | `http://localhost:3000/cart` |
| Login | `http://localhost:3000/login` |
| Register | `http://localhost:3000/register` |
| Profile | `http://localhost:3000/profile` |
| Forgot Password | `http://localhost:3000/forgot-password` |
| Admin Login | `http://localhost:3000/admin/login` |
| Admin Dashboard | `http://localhost:3000/admin` |
| Admin Orders | `http://localhost:3000/admin/orders` |
| Admin Customers | `http://localhost:3000/admin/customers` |
| Admin Products | `http://localhost:3000/admin/products` |
| Admin Features | `http://localhost:3000/admin/features` |

---

**Last Updated**: November 2024
**Demo Duration**: 25-35 minutes
**Version**: 1.0

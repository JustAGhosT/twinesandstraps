# Copilot Instructions for Twines and Straps SA

## Project Overview

This is a Next.js 14 e-commerce platform for Twines and Straps SA, a South African manufacturer of industrial twines and ropes. The application uses:

- **Framework**: Next.js 14 with App Router
- **Database**: PostgreSQL via Neon (cloud) with Prisma ORM
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Deployment**: Azure App Service

## Code Style Guidelines

### TypeScript
- Use strict TypeScript - avoid `any` types
- Prefer interfaces over types for object shapes
- Use proper type imports: `import type { ... } from '...'`

### React/Next.js
- Use Server Components by default, add `'use client'` only when needed
- Follow the App Router conventions (`app/` directory structure)
- Use `async/await` for data fetching in Server Components
- Prefer named exports for components

### Prisma
- Always use the singleton Prisma client from `@/lib/prisma`
- Include proper error handling for database operations
- Use transactions for multi-step database operations

### Styling
- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Use the project's color scheme: primary (brand colors), secondary, accent

## File Structure

```
src/
├── app/           # Next.js App Router pages
├── components/    # Reusable React components
├── contexts/      # React Context providers
├── lib/           # Utility functions and shared code
prisma/
├── schema.prisma  # Database schema
├── migrations/    # Database migrations
├── seed.ts        # Database seeding script
```

## Database Schema

Key models:
- `Product`: Industrial products (twines, ropes) with pricing, materials, dimensions
- `Category`: Product categorization
- `User`: Customer accounts with roles

## Environment Variables

Required:
- `DATABASE_URL`: Neon PostgreSQL connection string

Optional (but recommended for production):
- `NEXT_PUBLIC_WHATSAPP_NUMBER`: WhatsApp Business number for quote requests
- `ADMIN_PASSWORD`: Secure password for admin panel access (min 8 characters)

## Common Tasks

### Adding a new product field
1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name descriptive_name`
3. Update seed data if needed
4. Update relevant components

### Creating a new page
1. Create folder in `src/app/`
2. Add `page.tsx` with Server Component
3. Use `'use client'` only for interactive parts

## Testing and Verification

Before submitting changes, always run these commands:

```bash
# Lint the code
npm run lint

# Type check
npx tsc --noEmit

# Build the application (skipping production migration for local testing)
npx prisma generate && DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" npx next build
```

Note: The build command requires a DATABASE_URL. For CI/testing purposes, use a placeholder URL as shown above since the app uses dynamic rendering. The actual `npm run build` command also runs production migrations, which should only run in deployment environments.

## Security Considerations

- Never commit secrets or credentials to the repository
- Use environment variables for sensitive data
- The `ADMIN_PASSWORD` must be set securely in production
- Always validate user input on both client and server

## Additional Guidelines

### Error Handling
- Always wrap database operations in try/catch blocks
- Provide meaningful error messages for API responses
- Use appropriate HTTP status codes

### API Routes
- Place API routes in `src/app/api/` directory
- Use Next.js route handlers with proper HTTP methods
- Return consistent JSON response formats

### Components
- Keep components small and focused
- Extract reusable logic into custom hooks in `src/hooks/`
- Use TypeScript interfaces for component props

## Deployment

- Migrations run automatically during Azure deployments via `prisma migrate deploy`
- Environment variables must be set in Azure App Service (Configuration → Application settings)
- CI/CD pipeline runs lint, type-check, and build on every PR

# Copilot Instructions for Twines and Straps SA

## Project Overview

This is a Next.js 14 e-commerce platform for Twines and Straps SA, a South African manufacturer of industrial twines and ropes. The application uses:

- **Framework**: Next.js 14 with App Router
- **Database**: PostgreSQL via Neon (cloud) with Prisma ORM
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Deployment**: Netlify

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

## Testing

- Run `npm run lint` before committing
- Ensure `npm run build` passes

## Deployment

- Migrations run automatically during Netlify builds via `prisma migrate deploy`
- Environment variables must be set in Netlify dashboard

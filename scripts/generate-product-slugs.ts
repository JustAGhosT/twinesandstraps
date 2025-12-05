/**
 * Script to generate slugs for all existing products
 * Run this after the migration: npx tsx scripts/generate-product-slugs.ts
 */

import { PrismaClient } from '@prisma/client';
import { generateSlug, generateUniqueSlug } from '../src/lib/utils/slug';

const prisma = new PrismaClient();

async function generateSlugsForProducts() {
  console.log('Generating slugs for all products...');

  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  console.log(`Found ${products.length} products to process`);

  let updated = 0;
  let skipped = 0;

  for (const product of products) {
    // Skip if slug already exists and is not a temporary one
    if (product.slug && !product.slug.startsWith('product-')) {
      skipped++;
      continue;
    }

    const baseSlug = generateSlug(product.name);

    // Check if slug is unique
    const existing = await prisma.product.findFirst({
      where: {
        slug: baseSlug,
        id: { not: product.id },
      },
    });

    let finalSlug = baseSlug;
    if (existing) {
      // Generate unique slug
      let attempt = 1;
      while (attempt < 100) {
        const testSlug = `${baseSlug}-${attempt}`;
        const exists = await prisma.product.findFirst({
          where: { slug: testSlug },
        });
        if (!exists) {
          finalSlug = testSlug;
          break;
        }
        attempt++;
      }
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { slug: finalSlug },
    });

    updated++;
    console.log(`Updated product ${product.id}: ${product.name} -> ${finalSlug}`);
  }

  console.log(`\nCompleted:`);
  console.log(`- Updated: ${updated}`);
  console.log(`- Skipped: ${skipped}`);
  console.log(`- Total: ${products.length}`);
}

generateSlugsForProducts()
  .catch((error) => {
    console.error('Error generating slugs:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


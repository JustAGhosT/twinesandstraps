/**
 * Quick script to check if products exist and if slug column is present
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProducts() {
  try {
    // Check if slug column exists by trying to query it
    const productCount = await prisma.product.count();
    console.log(`Total products in database: ${productCount}`);

    if (productCount > 0) {
      // Try to get a product with slug
      const sampleProduct = await prisma.product.findFirst({
        select: {
          id: true,
          name: true,
          slug: true,
        },
      });

      if (sampleProduct) {
        console.log(`\nSample product:`);
        console.log(`- ID: ${sampleProduct.id}`);
        console.log(`- Name: ${sampleProduct.name}`);
        console.log(`- Slug: ${sampleProduct.slug || '(not set)'}`);
      }
    } else {
      console.log('\nNo products found in database.');
      console.log('You may need to seed the database or add products first.');
    }
  } catch (error: any) {
    if (error.message?.includes('slug') || error.message?.includes('column')) {
      console.error('Error: Slug column may not exist yet.');
      console.error('Please run: npx prisma migrate dev --name add_product_slug');
    } else {
      console.error('Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

checkProducts();


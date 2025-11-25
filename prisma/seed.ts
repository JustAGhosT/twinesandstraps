import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Static placeholder images for products (high-quality rope/twine images)
const productImages: Record<string, string> = {
  // Twines - white/natural
  'Twine T310': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  'Twine T120': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  'Twine R120': 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&q=80',
  // Twines - colored
  'Big Pack Black Twine': 'https://images.unsplash.com/photo-1635274605638-d44babc08a4f?w=800&q=80',
  'Big Pack Blue Twine': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80',
  'Jumbo Blue Twine': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80',
  'Jumbo Recycling Baler Twine': 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&q=80',
  // Ropes
  'Polypropylene Rope Blue': 'https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?w=800&q=80',
  'Polypropylene Rope Orange': 'https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?w=800&q=80',
  'Polypropylene Rope Black': 'https://images.unsplash.com/photo-1635274605638-d44babc08a4f?w=800&q=80',
  'Poly Steel Rope': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80',
  // Natural Ropes
  'Manila Rope': 'https://images.unsplash.com/photo-1635274605638-d44babc08a4f?w=800&q=80',
  'Sisal Rope': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  'Jute Rope': 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=800&q=80',
  'Cotton Rope': 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&q=80',
};

async function main() {
  console.log('Seeding database with products...');

  // Create categories
  const twinesCategory = await prisma.category.create({
    data: {
      name: 'Twines',
      slug: 'twines',
    },
  })

  const syntheticRopesCategory = await prisma.category.create({
    data: {
      name: 'Synthetic Ropes',
      slug: 'synthetic-ropes',
    },
  })

  const naturalRopesCategory = await prisma.category.create({
    data: {
      name: 'Natural Fiber Ropes',
      slug: 'natural-fiber-ropes',
    },
  })

  // TWINES from reference image
  const twineProducts = [
    {
      name: 'Twine T310',
      sku: 'TWINE-T310',
      description: 'High-quality white twine with 3.1 g/m weight. Length 320m per kg, breaking strain 100kg. Available in 5kg and 10kg packaging.',
      price: 89.99,
      material: 'Polypropylene',
      diameter: 2,
      length: 320,
      strength_rating: '100kg',
      category_id: twinesCategory.id,
      image_url: productImages['Twine T310'],
    },
    {
      name: 'Twine T120',
      sku: 'TWINE-T120',
      description: 'Lightweight twine with 1.2 g/m weight. Length 830m per kg, breaking strain 40kg. Perfect for light bundling. Available in 5kg and 10kg packaging.',
      price: 69.99,
      material: 'Polypropylene',
      diameter: 1.5,
      length: 830,
      strength_rating: '40kg',
      category_id: twinesCategory.id,
      image_url: productImages['Twine T120'],
    },
    {
      name: 'Twine R120',
      sku: 'TWINE-R120',
      description: 'Versatile twine with 1.2 g/m weight. Length 830m per kg, breaking strain 45kg. Ideal for agricultural use. Available in 5kg and 10kg packaging.',
      price: 74.99,
      material: 'Polypropylene',
      diameter: 1.5,
      length: 830,
      strength_rating: '45kg',
      category_id: twinesCategory.id,
      image_url: productImages['Twine R120'],
    },
    {
      name: 'Big Pack Black Twine',
      sku: 'BP-BLACK-TWINE',
      description: 'Heavy-duty black twine with 8 g/m weight. Length 125m per kg, breaking strain 220kg. UV resistant. 10kg packaging.',
      price: 159.99,
      material: 'Polypropylene',
      diameter: 3,
      length: 125,
      strength_rating: '220kg',
      category_id: twinesCategory.id,
      image_url: productImages['Big Pack Black Twine'],
    },
    {
      name: 'Big Pack Blue Twine',
      sku: 'BP-BLUE-TWINE',
      description: 'Heavy-duty blue twine with 8 g/m weight. Length 125m per kg, breaking strain 280kg. UV resistant. 10kg packaging.',
      price: 169.99,
      material: 'Polypropylene',
      diameter: 3,
      length: 125,
      strength_rating: '280kg',
      category_id: twinesCategory.id,
      image_url: productImages['Big Pack Blue Twine'],
    },
    {
      name: 'Jumbo Blue Twine',
      sku: 'JUMBO-BLUE-TWINE',
      description: 'Extra heavy-duty blue twine with 10 g/m weight. Length 100m per kg, breaking strain 320kg. Industrial grade. 10kg packaging.',
      price: 189.99,
      material: 'Polypropylene',
      diameter: 4,
      length: 100,
      strength_rating: '320kg',
      category_id: twinesCategory.id,
      image_url: productImages['Jumbo Blue Twine'],
    },
    {
      name: 'Jumbo Recycling Baler Twine',
      sku: 'JUMBO-BALER-TWINE',
      description: 'Modern Logistics Jumbo Recycling Baler Twine. 10.5 g/m weight, 95m per kg, breaking strain 300kg. Available in 10kg and 20kg packaging.',
      price: 199.99,
      material: 'Recycled Polypropylene',
      diameter: 4,
      length: 95,
      strength_rating: '300kg',
      category_id: twinesCategory.id,
      image_url: productImages['Jumbo Recycling Baler Twine'],
    },
  ];

  // SYNTHETIC ROPES from reference image
  const syntheticRopeProducts = [
    {
      name: 'Polypropylene Rope 4mm Blue',
      sku: 'PP-ROPE-4MM-BLUE',
      description: 'Polypropylene rope 4mm diameter in blue. Lightweight and floatable. Ideal for marine and outdoor use. Rolls available up to 25kg without splices.',
      price: 24.99,
      material: 'Polypropylene',
      diameter: 4,
      length: 200,
      strength_rating: '150kg',
      category_id: syntheticRopesCategory.id,
      image_url: productImages['Polypropylene Rope Blue'],
    },
    {
      name: 'Polypropylene Rope 6mm Blue',
      sku: 'PP-ROPE-6MM-BLUE',
      description: 'Polypropylene rope 6mm diameter in blue. Great for borehole use, marine and boating, agriculture and farming.',
      price: 34.99,
      material: 'Polypropylene',
      diameter: 6,
      length: 150,
      strength_rating: '300kg',
      category_id: syntheticRopesCategory.id,
      image_url: productImages['Polypropylene Rope Blue'],
    },
    {
      name: 'Polypropylene Rope 8mm Orange',
      sku: 'PP-ROPE-8MM-ORANGE',
      description: 'High-visibility orange polypropylene rope 8mm. Perfect for transport and logistics, construction and scaffolding.',
      price: 44.99,
      material: 'Polypropylene',
      diameter: 8,
      length: 100,
      strength_rating: '500kg',
      category_id: syntheticRopesCategory.id,
      image_url: productImages['Polypropylene Rope Orange'],
    },
    {
      name: 'Polypropylene Rope 10mm Black',
      sku: 'PP-ROPE-10MM-BLACK',
      description: 'Heavy-duty black polypropylene rope 10mm. Ideal for rigging and hoisting, temporary fencing and barriers.',
      price: 54.99,
      material: 'Polypropylene',
      diameter: 10,
      length: 100,
      strength_rating: '800kg',
      category_id: syntheticRopesCategory.id,
      image_url: productImages['Polypropylene Rope Black'],
    },
    {
      name: 'Poly Steel Rope 8mm',
      sku: 'POLYSTEEL-8MM',
      description: 'Poly Steel rope combining strength and flexibility. 8mm diameter. Ideal for heavy-duty tying, pulling, lifting, and securing loads.',
      price: 64.99,
      material: 'Poly Steel',
      diameter: 8,
      length: 100,
      strength_rating: '1200kg',
      category_id: syntheticRopesCategory.id,
      image_url: productImages['Poly Steel Rope'],
    },
  ];

  // NATURAL FIBER ROPES
  const naturalRopeProducts = [
    {
      name: 'Manila Rope 10mm',
      sku: 'MANILA-ROPE-10MM',
      description: 'A strong, durable, and flexible rope made from natural manila fibers. Perfect for marine, agricultural, and decorative applications.',
      price: 5.99,
      material: 'Manila',
      diameter: 10,
      length: 50,
      strength_rating: '500kg',
      category_id: naturalRopesCategory.id,
      image_url: productImages['Manila Rope'],
    },
    {
      name: 'Sisal Rope 8mm',
      sku: 'SISAL-ROPE-8MM',
      description: 'A tough, biodegradable rope ideal for agricultural and decorative uses. Eco-friendly and naturally resistant to UV damage.',
      price: 4.50,
      material: 'Sisal',
      diameter: 8,
      length: 100,
      strength_rating: '350kg',
      category_id: naturalRopesCategory.id,
      image_url: productImages['Sisal Rope'],
    },
    {
      name: 'Jute Rope 6mm',
      sku: 'JUTE-ROPE-6MM',
      description: 'Natural jute rope for gardening, packaging, and crafts. Biodegradable and environmentally friendly.',
      price: 3.49,
      material: 'Jute',
      diameter: 6,
      length: 100,
      strength_rating: '200kg',
      category_id: naturalRopesCategory.id,
      image_url: productImages['Jute Rope'],
    },
    {
      name: 'Cotton Rope 6mm',
      sku: 'COTTON-ROPE-6MM',
      description: 'Soft, natural cotton rope perfect for crafts, macrame, and decorative projects. Gentle on hands.',
      price: 3.99,
      material: 'Cotton',
      diameter: 6,
      length: 50,
      strength_rating: '150kg',
      category_id: naturalRopesCategory.id,
      image_url: productImages['Cotton Rope'],
    },
  ];

  // Create all products
  const allProducts = [...twineProducts, ...syntheticRopeProducts, ...naturalRopeProducts];
  
  for (const productData of allProducts) {
    await prisma.product.create({
      data: productData,
    });
    console.log(`Created product: ${productData.name}`);
  }

  console.log(`\nSeeding completed! Created ${allProducts.length} products.`);
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

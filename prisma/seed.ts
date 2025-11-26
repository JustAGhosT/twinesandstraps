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

  // Create or update categories using upsert
  const twinesCategory = await prisma.category.upsert({
    where: { slug: 'twines' },
    update: { name: 'Twines' },
    create: {
      name: 'Twines',
      slug: 'twines',
    },
  })

  const syntheticRopesCategory = await prisma.category.upsert({
    where: { slug: 'ropes' },
    update: { name: 'Ropes' },
    create: {
      name: 'Ropes',
      slug: 'ropes',
    },
  })

  // TWINES from reference image - exact specifications from brochure
  const twineProducts = [
    {
      name: 'Twine T310',
      sku: 'TWINE-T310',
      description: 'Premium white twine with 3.1 g/m weight. Length 320m per kg, breaking strain 100kg. Ideal for general bundling and tying applications. Available in 5kg and 10kg packaging. UV stabilized for outdoor use.',
      price: 89.99,
      material: 'Polypropylene',
      diameter: 2,
      length: 320,
      strength_rating: '100kg breaking strain',
      category_id: twinesCategory.id,
      image_url: productImages['Twine T310'],
    },
    {
      name: 'Twine T120',
      sku: 'TWINE-T120',
      description: 'Lightweight twine with 1.2 g/m weight. Exceptional length of 830m per kg, breaking strain 40kg. Perfect for light bundling and agricultural use. Available in 5kg and 10kg packaging.',
      price: 69.99,
      material: 'Polypropylene',
      diameter: 1.5,
      length: 830,
      strength_rating: '40kg breaking strain',
      category_id: twinesCategory.id,
      image_url: productImages['Twine T120'],
    },
    {
      name: 'Twine R120',
      sku: 'TWINE-R120',
      description: 'Versatile twine with 1.2 g/m weight. Length 830m per kg, breaking strain 45kg. Ideal for agricultural and industrial use. Available in 5kg and 10kg packaging. UV resistant.',
      price: 74.99,
      material: 'Polypropylene',
      diameter: 1.5,
      length: 830,
      strength_rating: '45kg breaking strain',
      category_id: twinesCategory.id,
      image_url: productImages['Twine R120'],
    },
    {
      name: 'Big Pack Black Twine',
      sku: 'BP-BLACK-TWINE',
      description: 'Heavy-duty black twine with 8 g/m weight. Length 125m per kg, breaking strain 220kg. UV resistant and ideal for outdoor applications. 10kg packaging. Perfect for securing heavy loads.',
      price: 159.99,
      material: 'Polypropylene',
      diameter: 3,
      length: 125,
      strength_rating: '220kg breaking strain',
      category_id: twinesCategory.id,
      image_url: productImages['Big Pack Black Twine'],
    },
    {
      name: 'Big Pack Blue Twine',
      sku: 'BP-BLUE-TWINE',
      description: 'Heavy-duty blue twine with 8 g/m weight. Length 125m per kg, exceptional breaking strain of 280kg. UV resistant and highly visible. 10kg packaging. Industrial grade quality.',
      price: 169.99,
      material: 'Polypropylene',
      diameter: 3,
      length: 125,
      strength_rating: '280kg breaking strain',
      category_id: twinesCategory.id,
      image_url: productImages['Big Pack Blue Twine'],
    },
    {
      name: 'Jumbo Blue Twine',
      sku: 'JUMBO-BLUE-TWINE',
      description: 'Extra heavy-duty blue twine with 10 g/m weight. Length 100m per kg, superior breaking strain of 320kg. Industrial grade for demanding applications. 10kg packaging.',
      price: 189.99,
      material: 'Polypropylene',
      diameter: 4,
      length: 100,
      strength_rating: '320kg breaking strain',
      category_id: twinesCategory.id,
      image_url: productImages['Jumbo Blue Twine'],
    },
    {
      name: 'Modern Logistics Jumbo Recycling Baler Twine',
      sku: 'JUMBO-BALER-TWINE',
      description: 'Premium recycling baler twine with 10.5 g/m weight. Length 95m per kg, breaking strain 300kg. Designed for modern recycling facilities and baling operations. Available in 10kg and 20kg packaging.',
      price: 199.99,
      material: 'Recycled Polypropylene',
      diameter: 4,
      length: 95,
      strength_rating: '300kg breaking strain',
      category_id: twinesCategory.id,
      image_url: productImages['Jumbo Recycling Baler Twine'],
    },
  ];

  // ROPES from reference image - Polypropylene and Poly Steel Ropes
  const ropeProducts = [
    {
      name: 'Polypropylene Rope 4mm Blue',
      sku: 'PP-ROPE-4MM-BLUE',
      description: 'Polypropylene rope 4mm diameter in blue. Lightweight and floatable. Ideal for borehole use, marine and boating, agriculture and farming. Rolls available up to 25kg without splices, can be made up to 100kg with splices.',
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
      description: 'Polypropylene rope 6mm diameter in blue. Great for borehole use, marine and boating, agriculture and farming, transport and logistics. UV stabilized.',
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
      description: 'High-visibility orange polypropylene rope 8mm. Perfect for transport and logistics, construction and scaffolding, rigging and hoisting. UV resistant for outdoor use.',
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
      description: 'Heavy-duty black polypropylene rope 10mm. Ideal for rigging and hoisting, temporary fencing and barriers, tying, pulling, lifting, and securing loads.',
      price: 54.99,
      material: 'Polypropylene',
      diameter: 10,
      length: 100,
      strength_rating: '800kg',
      category_id: syntheticRopesCategory.id,
      image_url: productImages['Polypropylene Rope Black'],
    },
    {
      name: 'Poly Steel Rope 6mm',
      sku: 'POLYSTEEL-6MM',
      description: 'Poly Steel rope combining strength and flexibility. 6mm diameter. Superior strength-to-weight ratio. Ideal for heavy-duty applications.',
      price: 54.99,
      material: 'Poly Steel',
      diameter: 6,
      length: 100,
      strength_rating: '900kg',
      category_id: syntheticRopesCategory.id,
      image_url: productImages['Poly Steel Rope'],
    },
    {
      name: 'Poly Steel Rope 8mm',
      sku: 'POLYSTEEL-8MM',
      description: 'Poly Steel rope combining strength and flexibility. 8mm diameter. Ideal for heavy-duty tying, pulling, lifting, and securing loads. Available in various colors.',
      price: 64.99,
      material: 'Poly Steel',
      diameter: 8,
      length: 100,
      strength_rating: '1200kg',
      category_id: syntheticRopesCategory.id,
      image_url: productImages['Poly Steel Rope'],
    },
    {
      name: 'Poly Steel Rope 10mm',
      sku: 'POLYSTEEL-10MM',
      description: 'Heavy-duty Poly Steel rope 10mm diameter. Maximum strength for demanding industrial applications. Ideal for construction and marine use.',
      price: 74.99,
      material: 'Poly Steel',
      diameter: 10,
      length: 100,
      strength_rating: '1800kg',
      category_id: syntheticRopesCategory.id,
      image_url: productImages['Poly Steel Rope'],
    },
  ];

  // Create or update all products using upsert
  const allProducts = [...twineProducts, ...ropeProducts];
  
  for (const productData of allProducts) {
    await prisma.product.upsert({
      where: { sku: productData.sku },
      update: {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        material: productData.material,
        diameter: productData.diameter,
        length: productData.length,
        strength_rating: productData.strength_rating,
        category_id: productData.category_id,
        image_url: productData.image_url,
      },
      create: productData,
    });
    console.log(`Upserted product: ${productData.name}`);
  }

  console.log(`\nSeeding completed! Created ${allProducts.length} products.`);
  console.log('\nProduct Notes:');
  console.log('- Twine rolls available in 2kg, 5kg, 10kg, and 20kg sizes');
  console.log('- Rope rolls available up to 25kg without splices, up to 100kg with splices');
  console.log('- Anti-static options available');
  console.log('- Approximate measurements apply');
  console.log('- Terms & Conditions Apply. Prices are subject to change and exclude VAT.');
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

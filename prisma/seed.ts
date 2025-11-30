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
  // Nets
  'Cargo Net': 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80',
  'Safety Net': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80',
  'Sports Net': 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
  // Accessories
  'Hook': 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800&q=80',
  'Shackle': 'https://images.unsplash.com/photo-1635274605638-d44babc08a4f?w=800&q=80',
  'Tensioner': 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&q=80',
};

// Default admin setup tasks for store onboarding
const defaultSetupTasks = [
  {
    task_key: 'upload_logo',
    title: 'Upload Company Logo',
    description: 'Add your company logo to personalize your store and build brand recognition.',
    category: 'BRANDING',
    priority: 1,
    is_required: true,
    link_url: '/admin/settings#branding',
    link_text: 'Upload Logo',
  },
  {
    task_key: 'add_social_links',
    title: 'Add Social Media Links',
    description: 'Connect your social media profiles to help customers find and follow you online.',
    category: 'BRANDING',
    priority: 2,
    is_required: false,
    link_url: '/admin/settings#social',
    link_text: 'Add Social Links',
  },
  {
    task_key: 'add_product_images',
    title: 'Add Product Images',
    description: 'Upload high-quality images for your products to improve customer engagement and sales.',
    category: 'PRODUCTS',
    priority: 1,
    is_required: true,
    link_url: '/admin/products',
    link_text: 'Manage Products',
  },
  {
    task_key: 'update_contact_info',
    title: 'Update Contact Information',
    description: 'Ensure your email, phone, and business hours are accurate for customer inquiries.',
    category: 'SETTINGS',
    priority: 1,
    is_required: true,
    link_url: '/admin/settings#contact',
    link_text: 'Update Contact Info',
  },
  {
    task_key: 'set_business_address',
    title: 'Set Business Address',
    description: 'Add your physical address to build trust and enable local customers to find you.',
    category: 'SETTINGS',
    priority: 2,
    is_required: false,
    link_url: '/admin/settings#contact',
    link_text: 'Add Address',
  },
  {
    task_key: 'configure_vat',
    title: 'Configure VAT Settings',
    description: 'Set the correct VAT rate for your business to ensure accurate pricing.',
    category: 'SETTINGS',
    priority: 1,
    is_required: true,
    link_url: '/admin/settings#tax',
    link_text: 'Configure VAT',
  },
  {
    task_key: 'add_categories',
    title: 'Organize Product Categories',
    description: 'Create and organize product categories to help customers find what they need.',
    category: 'PRODUCTS',
    priority: 2,
    is_required: false,
    link_url: '/admin/categories',
    link_text: 'Manage Categories',
  },
  {
    task_key: 'review_products',
    title: 'Review Product Details',
    description: 'Ensure all product descriptions, prices, and specifications are accurate.',
    category: 'PRODUCTS',
    priority: 2,
    is_required: false,
    link_url: '/admin/products',
    link_text: 'Review Products',
  },
];

async function seedSetupTasks() {
  console.log('\nSeeding admin setup tasks...');

  for (const task of defaultSetupTasks) {
    await prisma.adminSetupTask.upsert({
      where: { task_key: task.task_key },
      update: {
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        is_required: task.is_required,
        link_url: task.link_url,
        link_text: task.link_text,
      },
      create: task,
    });
    console.log(`Upserted setup task: ${task.title}`);
  }

  console.log(`Created ${defaultSetupTasks.length} setup tasks.`);
}

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

  const netsCategory = await prisma.category.upsert({
    where: { slug: 'nets' },
    update: { name: 'Nets' },
    create: {
      name: 'Nets',
      slug: 'nets',
    },
  })

  const accessoriesCategory = await prisma.category.upsert({
    where: { slug: 'accessories' },
    update: { name: 'Accessories' },
    create: {
      name: 'Accessories',
      slug: 'accessories',
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

  // NETS - Cargo, Safety, and Sports Nets
  const netProducts = [
    {
      name: 'Heavy Duty Cargo Net 1.5m x 2m',
      sku: 'NET-CARGO-1520',
      description: 'Heavy-duty cargo net for securing loads on trailers, bakkies, and trucks. 1.5m x 2m size with 100mm mesh. Features reinforced edges and metal hooks at corners. UV stabilized polypropylene construction.',
      price: 349.99,
      material: 'Polypropylene',
      diameter: 6,
      strength_rating: '500kg total load capacity',
      category_id: netsCategory.id,
      image_url: productImages['Cargo Net'],
    },
    {
      name: 'Heavy Duty Cargo Net 2m x 3m',
      sku: 'NET-CARGO-2030',
      description: 'Extra-large cargo net for commercial vehicles and large trailers. 2m x 3m coverage with 100mm mesh. Heavy-duty construction with carabiner hooks. Perfect for construction and logistics industries.',
      price: 549.99,
      material: 'Polypropylene',
      diameter: 8,
      strength_rating: '800kg total load capacity',
      category_id: netsCategory.id,
      image_url: productImages['Cargo Net'],
    },
    {
      name: 'Elastic Cargo Net with Hooks',
      sku: 'NET-CARGO-ELASTIC',
      description: 'Expandable elastic cargo net with 12 metal hooks. Stretches from 80cm x 80cm to 120cm x 120cm. Ideal for securing irregular loads and quick fastening applications.',
      price: 129.99,
      material: 'Elastic Cord',
      diameter: 4,
      strength_rating: '50kg per hook',
      category_id: netsCategory.id,
      image_url: productImages['Cargo Net'],
    },
    {
      name: 'Construction Safety Net 3m x 6m',
      sku: 'NET-SAFETY-3060',
      description: 'SANS-compliant construction safety net for fall protection and debris containment. 3m x 6m with 50mm mesh. High-visibility orange with reinforced border rope. Includes tie-down ropes.',
      price: 899.99,
      material: 'HDPE',
      diameter: 4,
      strength_rating: '150kg/m² impact resistance',
      category_id: netsCategory.id,
      image_url: productImages['Safety Net'],
      stock_status: 'IN_STOCK',
    },
    {
      name: 'Scaffolding Safety Net 2m x 10m',
      sku: 'NET-SAFETY-SCAFFOLD',
      description: 'Debris netting for scaffolding and building sites. 2m x 10m roll with 25mm mesh. Flame retardant and UV stabilized. Reduces wind load while containing debris.',
      price: 649.99,
      material: 'HDPE',
      diameter: 2,
      strength_rating: '100kg/m² impact resistance',
      category_id: netsCategory.id,
      image_url: productImages['Safety Net'],
    },
    {
      name: 'Swimming Pool Safety Net',
      sku: 'NET-SAFETY-POOL',
      description: 'Child and pet safety net for swimming pools. Custom-cut to pool shape up to 50m². UV-resistant black mesh with stainless steel anchors and cover. Compliant with SANS 10134.',
      price: 1299.99,
      material: 'UV-Stabilized Polyethylene',
      diameter: 3,
      strength_rating: '200kg distributed load',
      category_id: netsCategory.id,
      image_url: productImages['Safety Net'],
    },
    {
      name: 'Sports Barrier Net 3m x 10m',
      sku: 'NET-SPORTS-BARRIER',
      description: 'Multi-purpose sports barrier net suitable for cricket, soccer, golf, and ball containment. 3m x 10m with 50mm mesh. UV stabilized with reinforced rope edges. Includes hanging loops.',
      price: 449.99,
      material: 'HDPE',
      diameter: 3,
      strength_rating: 'Ball impact rated',
      category_id: netsCategory.id,
      image_url: productImages['Sports Net'],
    },
    {
      name: 'Cricket Practice Net 3m x 3m x 6m',
      sku: 'NET-SPORTS-CRICKET',
      description: 'Three-sided cricket practice cage net. 3m wide x 3m high x 6m deep. Heavy-duty 48mm mesh construction. Includes guy ropes and ground pegs. Professional club quality.',
      price: 1899.99,
      material: 'Nylon',
      diameter: 4,
      strength_rating: 'Professional grade',
      category_id: netsCategory.id,
      image_url: productImages['Sports Net'],
    },
    {
      name: 'Goal Net - Soccer/Hockey',
      sku: 'NET-SPORTS-GOAL',
      description: 'Replacement goal net for standard soccer or hockey goals. 7.3m x 2.4m with 120mm mesh. Weather-resistant white polyethylene. Reinforced corners with tie-cords included.',
      price: 349.99,
      material: 'Polyethylene',
      diameter: 4,
      strength_rating: 'Competition grade',
      category_id: netsCategory.id,
      image_url: productImages['Sports Net'],
    },
  ];

  // ACCESSORIES - Hooks, Shackles, Connectors, Tensioners
  const accessoryProducts = [
    {
      name: 'Snap Hook 80mm Zinc Plated',
      sku: 'ACC-HOOK-SNAP-80',
      description: 'Heavy-duty zinc plated snap hook, 80mm length. Spring-loaded gate for quick attachment. Working load limit 120kg. Ideal for ropes up to 10mm diameter.',
      price: 24.99,
      material: 'Zinc Plated Steel',
      strength_rating: '120kg WLL',
      category_id: accessoriesCategory.id,
      image_url: productImages['Hook'],
    },
    {
      name: 'Snap Hook 100mm Stainless Steel',
      sku: 'ACC-HOOK-SNAP-100SS',
      description: 'Marine-grade stainless steel snap hook, 100mm length. Corrosion resistant for outdoor and marine use. Working load limit 200kg. Suitable for ropes up to 12mm.',
      price: 59.99,
      material: 'Stainless Steel 316',
      strength_rating: '200kg WLL',
      category_id: accessoriesCategory.id,
      image_url: productImages['Hook'],
    },
    {
      name: 'Carabiner Hook 80mm',
      sku: 'ACC-CARABINER-80',
      description: 'Aluminum carabiner hook with screw lock gate. 80mm size, 8mm gate opening. Not for climbing - ideal for cargo and general purpose use. Working load 100kg.',
      price: 19.99,
      material: 'Aluminum Alloy',
      strength_rating: '100kg WLL',
      category_id: accessoriesCategory.id,
      image_url: productImages['Hook'],
    },
    {
      name: 'D-Shackle 10mm Galvanized',
      sku: 'ACC-SHACKLE-D10',
      description: 'Galvanized steel D-shackle with screw pin. 10mm pin diameter. Working load limit 500kg. Essential connector for rope and chain applications.',
      price: 34.99,
      material: 'Galvanized Steel',
      strength_rating: '500kg WLL',
      category_id: accessoriesCategory.id,
      image_url: productImages['Shackle'],
    },
    {
      name: 'D-Shackle 12mm Stainless Steel',
      sku: 'ACC-SHACKLE-D12SS',
      description: 'Marine-grade stainless steel D-shackle. 12mm pin diameter. Working load limit 800kg. Ideal for marine, outdoor, and corrosive environments.',
      price: 89.99,
      material: 'Stainless Steel 316',
      strength_rating: '800kg WLL',
      category_id: accessoriesCategory.id,
      image_url: productImages['Shackle'],
    },
    {
      name: 'Bow Shackle 10mm Galvanized',
      sku: 'ACC-SHACKLE-BOW10',
      description: 'Galvanized bow shackle (omega shape) with screw pin. 10mm pin diameter. Wider bow accommodates multiple ropes. Working load limit 500kg.',
      price: 39.99,
      material: 'Galvanized Steel',
      strength_rating: '500kg WLL',
      category_id: accessoriesCategory.id,
      image_url: productImages['Shackle'],
    },
    {
      name: 'Rope Tensioner Ratchet 25mm',
      sku: 'ACC-TENSIONER-25',
      description: 'Ratchet rope tensioner for 25mm webbing/rope. Creates tight, secure tension on guy ropes, tarpaulins, and cargo. Quick release mechanism. Load capacity 500kg.',
      price: 49.99,
      material: 'Steel with Rubber Grip',
      strength_rating: '500kg capacity',
      category_id: accessoriesCategory.id,
      image_url: productImages['Tensioner'],
    },
    {
      name: 'Rope Tensioner Ratchet 50mm',
      sku: 'ACC-TENSIONER-50',
      description: 'Heavy-duty ratchet tensioner for 50mm webbing. Professional grade for truck and cargo securing. Double J-hooks. Load capacity 2000kg.',
      price: 89.99,
      material: 'Steel with Rubber Grip',
      strength_rating: '2000kg capacity',
      category_id: accessoriesCategory.id,
      image_url: productImages['Tensioner'],
    },
    {
      name: 'Turnbuckle Hook/Eye 10mm',
      sku: 'ACC-TURNBUCKLE-10',
      description: 'Galvanized turnbuckle with hook and eye ends. 10mm thread, 150mm take-up. Perfect for tensioning wire, rope, and cables. Working load 320kg.',
      price: 44.99,
      material: 'Galvanized Steel',
      strength_rating: '320kg WLL',
      category_id: accessoriesCategory.id,
      image_url: productImages['Tensioner'],
    },
    {
      name: 'Wire Rope Clip 6mm (Pack of 5)',
      sku: 'ACC-CLIP-WIRE6',
      description: 'Galvanized wire rope clips for 6mm wire rope. U-bolt style with saddle. Pack of 5. Essential for creating loops and terminations in wire rope.',
      price: 29.99,
      material: 'Galvanized Steel',
      strength_rating: 'Per SANS spec',
      category_id: accessoriesCategory.id,
      image_url: productImages['Hook'],
    },
    {
      name: 'Thimble 10mm Stainless Steel',
      sku: 'ACC-THIMBLE-10SS',
      description: 'Stainless steel rope thimble for 10mm rope. Protects rope eyes from wear and abrasion. Marine grade 316 stainless steel.',
      price: 14.99,
      material: 'Stainless Steel 316',
      strength_rating: 'N/A',
      category_id: accessoriesCategory.id,
      image_url: productImages['Hook'],
    },
    {
      name: 'Swivel Hook 80mm',
      sku: 'ACC-HOOK-SWIVEL-80',
      description: '360-degree swivel hook with safety latch. 80mm overall length. Prevents rope twisting under load. Working load limit 150kg.',
      price: 39.99,
      material: 'Zinc Plated Steel',
      strength_rating: '150kg WLL',
      category_id: accessoriesCategory.id,
      image_url: productImages['Hook'],
    },
  ];

  // Create or update all products using upsert
  const allProducts = [...twineProducts, ...ropeProducts, ...netProducts, ...accessoryProducts];
  
  for (const productData of allProducts) {
    await prisma.product.upsert({
      where: { sku: productData.sku },
      update: {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        material: productData.material,
        diameter: 'diameter' in productData ? (productData as typeof productData & { diameter: number }).diameter : undefined,
        length: 'length' in productData ? (productData as typeof productData & { length: number }).length : undefined,
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

  // Seed admin setup tasks
  await seedSetupTasks();
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

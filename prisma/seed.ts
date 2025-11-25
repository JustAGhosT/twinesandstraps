import { PrismaClient } from '@prisma/client'
import OpenAI from 'openai'

const prisma = new PrismaClient()

// Generate image prompt based on product details
function generateImagePrompt(product: {
  name: string;
  description: string;
  material: string | null;
  diameter: number | null;
  categoryName: string;
}): string {
  const parts = [
    `Professional product photo of ${product.name}`,
    product.material ? `made from ${product.material}` : '',
    product.diameter ? `with ${product.diameter}mm diameter` : '',
    `in the ${product.categoryName} category`,
    'on a clean white background',
    'high quality commercial product photography',
    'well-lit studio shot',
  ];

  return parts.filter(Boolean).join(', ');
}

// Generate AI image for a product
async function generateProductImage(
  openai: OpenAI,
  product: {
    name: string;
    description: string;
    material: string | null;
    diameter: number | null;
    categoryName: string;
  }
): Promise<string | null> {
  try {
    const prompt = generateImagePrompt(product);
    console.log(`Generating image for ${product.name}...`);
    
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    const imageUrl = response.data[0]?.url;
    if (imageUrl) {
      console.log(`✓ Generated image for ${product.name}`);
      return imageUrl;
    }
    return null;
  } catch (error) {
    console.error(`Failed to generate image for ${product.name}:`, error);
    return null;
  }
}

async function main() {
  // Check if OpenAI API key is available for image generation
  // Only use OpenAI if a real API key is provided (not the placeholder)
  const apiKey = process.env.OPENAI_API_KEY;
  const hasValidApiKey = apiKey && apiKey.length > 10 && !apiKey.startsWith('sk-...');
  const openai = hasValidApiKey ? new OpenAI({ apiKey }) : null;
  
  if (!openai) {
    console.log('Note: OPENAI_API_KEY not set or invalid. Products will be created without AI-generated images.');
    console.log('To generate images, set a valid OPENAI_API_KEY and run the seed again.');
  }

  // Create a couple of categories
  const category1 = await prisma.category.create({
    data: {
      name: 'Natural Fiber Ropes',
      slug: 'natural-fiber-ropes',
    },
  })

  const category2 = await prisma.category.create({
    data: {
      name: 'Synthetic Ropes',
      slug: 'synthetic-ropes',
    },
  })

  // Product definitions
  const products = [
    {
      name: 'Manila Rope',
      sku: 'MANILA-ROPE-10MM',
      description: 'A strong, durable, and flexible rope made from natural manila fibers.',
      price: 5.99,
      material: 'Manila',
      diameter: 10,
      length: 50,
      strength_rating: '500kg',
      category_id: category1.id,
      categoryName: category1.name,
    },
    {
      name: 'Sisal Rope',
      sku: 'SISAL-ROPE-8MM',
      description: 'A tough, biodegradable rope ideal for agricultural and decorative uses.',
      price: 4.50,
      material: 'Sisal',
      diameter: 8,
      length: 100,
      strength_rating: '350kg',
      category_id: category1.id,
      categoryName: category1.name,
    },
    {
      name: 'Nylon Rope',
      sku: 'NYLON-ROPE-12MM',
      description: 'A high-strength, shock-absorbent synthetic rope with excellent abrasion resistance.',
      price: 12.75,
      material: 'Nylon',
      diameter: 12,
      length: 50,
      strength_rating: '2500kg',
      category_id: category2.id,
      categoryName: category2.name,
    },
  ];

  // Create products with AI-generated images if API key is available
  for (const productData of products) {
    let image_url: string | null = null;
    
    if (openai) {
      image_url = await generateProductImage(openai, productData);
    }

    await prisma.product.create({
      data: {
        name: productData.name,
        sku: productData.sku,
        description: productData.description,
        price: productData.price,
        material: productData.material,
        diameter: productData.diameter,
        length: productData.length,
        strength_rating: productData.strength_rating,
        category_id: productData.category_id,
        image_url: image_url,
      },
    });
    
    console.log(`Created product: ${productData.name}${image_url ? ' (with image)' : ''}`);
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

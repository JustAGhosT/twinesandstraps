import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id, 10);
    
    if (isNaN(productId) || productId <= 0) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Get the product details
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // If product already has an image, return it
    if (product.image_url) {
      return NextResponse.json({ image_url: product.image_url });
    }

    // Check if OpenAI API key is configured
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });

    // Generate a prompt based on product details
    const prompt = generateImagePrompt(product);

    // Generate image using DALL-E
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    });

    const imageUrl = response.data[0]?.url;

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Failed to generate image' },
        { status: 500 }
      );
    }

    // Update the product with the generated image URL
    await prisma.product.update({
      where: { id: productId },
      data: { image_url: imageUrl },
    });

    return NextResponse.json({ image_url: imageUrl });
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}

function generateImagePrompt(product: {
  name: string;
  description: string;
  material: string | null;
  diameter: number | null;
  category: { name: string };
}): string {
  const parts = [
    `Professional product photo of ${product.name}`,
    product.material ? `made from ${product.material}` : '',
    product.diameter ? `with ${product.diameter}mm diameter` : '',
    `in the ${product.category.name} category`,
    'on a clean white background',
    'high quality commercial product photography',
    'well-lit studio shot',
  ];

  return parts.filter(Boolean).join(', ');
}

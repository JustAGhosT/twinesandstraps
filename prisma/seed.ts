import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
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

  // Create a few products
  await prisma.product.create({
    data: {
      name: 'Manila Rope',
      sku: 'MANILA-ROPE-10MM',
      description: 'A strong, durable, and flexible rope made from natural manila fibers.',
      price: 5.99,
      material: 'Manila',
      diameter: 10,
      length: 50,
      strength_rating: '500kg',
      category_id: category1.id,
    },
  })

  await prisma.product.create({
    data: {
      name: 'Sisal Rope',
      sku: 'SISAL-ROPE-8MM',
      description: 'A tough, biodegradable rope ideal for agricultural and decorative uses.',
      price: 4.50,
      material: 'Sisal',
      diameter: 8,
      length: 100,
      strength_rating: '350kg',
      category_id: category1.id,
    },
  })

  await prisma.product.create({
    data: {
      name: 'Nylon Rope',
      sku: 'NYLON-ROPE-12MM',
      description: 'A high-strength, shock-absorbent synthetic rope with excellent abrasion resistance.',
      price: 12.75,
      material: 'Nylon',
      diameter: 12,
      length: 50,
      strength_rating: '2500kg',
      category_id: category2.id,
    },
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

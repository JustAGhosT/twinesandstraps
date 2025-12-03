import Link from 'next/link';
import { getFeaturedProducts } from '@/lib/data';
import ProductCard from './ProductCard';

interface NotFoundProps {
  title: string;
  message: string;
}

export default async function NotFound({ title, message }: NotFoundProps) {
  const featuredProducts = await getFeaturedProducts(4);

  return (
    <div className="container mx-auto px-4 py-8 bg-background min-h-screen">
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold mb-4 text-foreground">{title}</h1>
        <p className="text-muted-foreground mb-8">{message}</p>
        <Link href="/products" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
          Browse all products
        </Link>
      </div>

      {featuredProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 text-center text-foreground">
            You might be interested in
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

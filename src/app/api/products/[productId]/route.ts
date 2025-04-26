import { NextResponse } from 'next/server';
// Restore imports
import path from 'path';
import fs from 'fs/promises';
import { ProductDefinition } from '@/types';

// Remove the explicit RouteParams type definition as we'll type inline
// type RouteParams = {
//   params: {
//     productId: string;
//   }
// }

export async function GET(
  request: Request,
  // Update params type to Promise
  { params }: { params: Promise<{ productId: string }> }
): Promise<NextResponse> {
  // Await params before accessing productId
  const { productId } = await params;

  // Restore original logic
  if (!productId) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
  }

  // Basic validation to prevent path traversal
  if (productId.includes('/') || productId.includes('..')) {
     return NextResponse.json({ error: 'Invalid Product ID format' }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), 'src', 'data', 'products', `${productId}.json`);

  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    const productData: ProductDefinition = JSON.parse(fileContents);
    return NextResponse.json(productData);
  } catch (error: unknown) {
    console.error(`API Error reading product data (${productId}):`, error);
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') {
      return NextResponse.json({ error: `Product '${productId}' not found` }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error reading product data' }, { status: 500 });
  }
} 
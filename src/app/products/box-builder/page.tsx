import path from 'path';
import fs from 'fs/promises';
import { BoxBuilderForm } from '@/components/products/box-builder/BoxBuilderForm';
import { ProductDefinition, Material } from '@/types'; // Assuming types are defined elsewhere

async function getProductData(productId: string): Promise<ProductDefinition | null> {
  const filePath = path.join(process.cwd(), 'src', 'data', 'products', `${productId}.json`);
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error(`Error reading product data (${productId}):`, error);
    return null;
  }
}

async function getMaterialsData(): Promise<Material[] | null> {
  const filePath = path.join(process.cwd(), 'src', 'data', 'materials', 'materials.json');
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error('Error reading materials data:', error);
    return null;
  }
}


export default async function BoxBuilderPage() {
  const product = await getProductData('box-builder');
  const materials = await getMaterialsData();

  if (!product || !materials) {
    // TODO: Add a more user-friendly error state
    return <div>Error loading product configuration. Please try again later.</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">{product.name}</h1>
      <p className="text-muted-foreground mb-8">{product.description}</p>

      {/* TODO: Maybe split layout: Form on left, Preview on right? */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <BoxBuilderForm product={product} materials={materials} />
        </div>
        <div className="md:col-span-1 bg-muted rounded-lg p-4">
          {/* Placeholder for Preview or Price Summary */}
          <h2 className="text-xl font-semibold mb-4">Preview / Summary</h2>
          <p className="text-sm text-muted-foreground">
            (Box preview and price calculation will appear here)
          </p>
        </div>
      </div>
    </div>
  );
}


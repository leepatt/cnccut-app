import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { Material } from '@/types'; // Assuming types are correct

export async function GET() {
  const filePath = path.join(process.cwd(), 'src', 'data', 'materials', 'materials.json');

  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    const materialsData: Material[] = JSON.parse(fileContents);
    return NextResponse.json(materialsData);
  } catch (error: unknown) {
    console.error('API Error reading materials data:', error);
    // If you need to access error properties, you'd check its type first
    // For example: if (error instanceof Error) { console.error(error.message); }
    return NextResponse.json({ error: 'Internal Server Error reading materials data' }, { status: 500 });
  }
}

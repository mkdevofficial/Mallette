import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { getDocumentById } from '@/lib/db';
import { getPdfPath, renderPageToImage } from '@/lib/pdf';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pageNum: string }> }
) {
  const { id, pageNum } = await params;
  const num = parseInt(pageNum, 10);

  if (!id || isNaN(num) || num < 1) {
    return new NextResponse('Invalid document ID or page number', { status: 400 });
  }

  const doc = getDocumentById(id);
  if (!doc) {
    return new NextResponse('Document not found in database', { status: 404 });
  }

  const pdfPath = getPdfPath(id, doc.category);
  if (!pdfPath) {
    return new NextResponse('PDF file not found on disk', { status: 404 });
  }

  const imagePath = renderPageToImage(pdfPath, id, num);
  if (!imagePath || !fs.existsSync(imagePath)) {
    return new NextResponse('Failed to render page image', { status: 500 });
  }

  const fileBuffer = fs.readFileSync(imagePath);

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': String(fileBuffer.length),
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  });
}

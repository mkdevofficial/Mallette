import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { getDocumentById } from '@/lib/db';
import { getPdfPath, extractSinglePage } from '@/lib/pdf';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pageNum: string }> }
) {
  const { id, pageNum } = await params;
  const page = parseInt(pageNum, 10);
  if (isNaN(page) || page < 1) {
    return new NextResponse('Invalid page number', { status: 400 });
  }

  const doc = getDocumentById(id);
  const pdfPath = getPdfPath(id, doc?.category);
  if (!pdfPath || !fs.existsSync(pdfPath)) {
    return new NextResponse('Document Not Found', { status: 404 });
  }

  const singlePagePath = extractSinglePage(pdfPath, id, page);
  if (!singlePagePath || !fs.existsSync(singlePagePath)) {
    return new NextResponse(`Could not extract page ${page}`, { status: 404 });
  }

  const stat = fs.statSync(singlePagePath);
  const stream = fs.createReadStream(singlePagePath);
  const readable = new ReadableStream({
    start(controller) {
      stream.on('data', (chunk) => controller.enqueue(chunk));
      stream.on('end', () => controller.close());
      stream.on('error', (err) => controller.error(err));
    },
  });

  return new NextResponse(readable, {
    status: 200,
    headers: {
      'Content-Length': String(stat.size),
      'Content-Type': 'application/pdf',
      'Accept-Ranges': 'bytes',
    },
  });
}

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { getDocumentById } from '@/lib/db';
import { getPdfPath, sanitizeFilename } from '@/lib/pdf';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const doc = getDocumentById(id);
  const pdfPath = getPdfPath(id, doc?.category);

  if (!pdfPath || !fs.existsSync(pdfPath)) {
    return new NextResponse('PDF Not Found', { status: 404 });
  }

  const stat = fs.statSync(pdfPath);
  const cleanTitle = sanitizeFilename(doc?.titleAR || `Document_${id}`);
  const filename = `${cleanTitle}.pdf`;
  const encodedFilename = encodeURIComponent(filename);

  const stream = fs.createReadStream(pdfPath);
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
      'Content-Disposition': `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
    },
  });
}

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import { getDocumentById } from '@/lib/db';
import { getPdfPath } from '@/lib/pdf';

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
  const fileSize = stat.size;
  const rangeHeader = request.headers.get('range');

  if (rangeHeader) {
    const parts = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize) {
      return new NextResponse(null, {
        status: 416,
        headers: {
          'Content-Range': `bytes */${fileSize}`,
        },
      });
    }

    const chunkSize = end - start + 1;
    const stream = fs.createReadStream(pdfPath, { start, end });
    // Convert Node stream to web ReadableStream
    const readable = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(chunk));
        stream.on('end', () => controller.close());
        stream.on('error', (err) => controller.error(err));
      },
    });

    return new NextResponse(readable, {
      status: 206,
      headers: {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': String(chunkSize),
        'Content-Type': 'application/pdf',
      },
    });
  }

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
      'Content-Length': String(fileSize),
      'Content-Type': 'application/pdf',
      'Accept-Ranges': 'bytes',
    },
  });
}

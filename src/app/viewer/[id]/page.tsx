import { notFound } from 'next/navigation';
import { getDocumentById, getSearchHitsForDoc } from '@/lib/db';
import { getPdfPath, getPdfPageCount } from '@/lib/pdf';
import PdfViewerClient from '@/components/PdfViewerClient';

export const dynamic = 'force-dynamic';

export default async function ViewerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { id } = await params;
  const sParams = await searchParams;

  const doc = getDocumentById(id);
  if (!doc) {
    notFound();
  }

  const targetPage = Math.max(1, parseInt(sParams.page || '1', 10));
  const searchQuery = (sParams.q || '').trim();

  const pdfPath = getPdfPath(id, doc.category);
  const totalPages = pdfPath ? getPdfPageCount(pdfPath) : null;
  const searchHits = searchQuery ? getSearchHitsForDoc(id, searchQuery) : [];

  return (
    <PdfViewerClient
      doc={{
        id: doc.id,
        category: doc.category,
        titleAR: doc.titleAR,
        titleFR: doc.titleFR,
      }}
      initialPage={targetPage}
      initialTotalPages={totalPages}
      searchHits={searchHits}
      searchQuery={searchQuery}
    />
  );
}

import { NextRequest, NextResponse } from 'next/server';
import { searchContent, searchTitles } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';
  const type = searchParams.get('type') || 'content';
  const category = searchParams.get('category')?.trim() || undefined;
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  if (!q) {
    return NextResponse.json({ items: [], total: 0 });
  }

  if (type === 'title') {
    const data = searchTitles(q, category, limit, offset);
    return NextResponse.json(data);
  } else {
    const data = searchContent(q, category, limit, offset);
    return NextResponse.json(data);
  }
}

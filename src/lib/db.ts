import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

type SqliteDatabase = ReturnType<typeof Database>;

const DB_PATH = path.join(process.cwd(), 'mallette_search.db');

let dbInstance: SqliteDatabase | null = null;

export function getDb(): SqliteDatabase {
  if (!dbInstance) {
    if (!fs.existsSync(DB_PATH)) {
      throw new Error(`Database file not found at: ${DB_PATH}`);
    }
    dbInstance = new Database(DB_PATH, { readonly: true });
  }
  return dbInstance;
}

export interface DocumentRow {
  id: string;
  category: string;
  titleAR: string;
  titleFR: string | null;
  urlBookAR: string | null;
  urlBookFR: string | null;
  pdf_downloaded: number;
}

export interface SearchResultItem {
  id: string;
  category: string;
  titleAR: string;
  titleFR: string | null;
  urlBookFR: string | null;
  page_num?: number;
  snippet?: string;
}

export function getCategoriesCounts(): Record<string, number> {
  const db = getDb();
  const rows = db.prepare('SELECT category, count(*) as cnt FROM documents GROUP BY category ORDER BY cnt DESC').all() as { category: string; cnt: number }[];
  const map: Record<string, number> = {};
  for (const r of rows) {
    map[r.category] = r.cnt;
  }
  return map;
}

export function getTotalDocsCount(): number {
  const db = getDb();
  const row = db.prepare('SELECT count(*) as cnt FROM documents').get() as { cnt: number };
  return row.cnt;
}

export function getTotalPagesCount(): number {
  const db = getDb();
  const row = db.prepare('SELECT count(*) as cnt FROM pdf_pages').get() as { cnt: number };
  return row.cnt;
}

export function searchContent(
  query: string,
  category?: string,
  limit: number = 20,
  offset: number = 0
): { items: SearchResultItem[]; total: number } {
  const db = getDb();
  const safeQ = `"${query.replace(/"/g, '""')}"`;

  let countSql = `SELECT count(*) as total FROM pdf_pages WHERE pdf_pages MATCH ?`;
  let searchSql = `
    SELECT doc_id as id, category, title as titleAR, page_num,
           snippet(pdf_pages, 4, '<mark>', '</mark>', '...', 25) AS snippet
    FROM pdf_pages
    WHERE pdf_pages MATCH ?
  `;
  const params: (string | number)[] = [safeQ];

  if (category) {
    countSql += ` AND category = ?`;
    searchSql += ` AND category = ?`;
    params.push(category);
  }

  try {
    const countRow = db.prepare(countSql).get(...params) as { total: number };
    const total = countRow ? countRow.total : 0;

    searchSql += ` ORDER BY rank LIMIT ? OFFSET ?`;
    const searchParams = [...params, limit, offset];
    const rows = db.prepare(searchSql).all(...searchParams) as any[];

    const items: SearchResultItem[] = rows.map((r) => ({
      id: r.id,
      category: r.category,
      titleAR: r.titleAR,
      titleFR: null,
      urlBookFR: null,
      page_num: r.page_num,
      snippet: r.snippet,
    }));

    return { items, total };
  } catch (err) {
    // Fallback to LIKE if FTS expression has syntax quirk
    let fallbackCount = `SELECT count(*) as total FROM pdf_pages WHERE page_text LIKE ?`;
    let fallbackSql = `
      SELECT doc_id as id, category, title as titleAR, page_num,
             substr(page_text, 1, 150) as snippet
      FROM pdf_pages
      WHERE page_text LIKE ?
    `;
    const fParams: (string | number)[] = [`%${query}%`];
    if (category) {
      fallbackCount += ` AND category = ?`;
      fallbackSql += ` AND category = ?`;
      fParams.push(category);
    }
    const countRow = db.prepare(fallbackCount).get(...fParams) as { total: number };
    const total = countRow ? countRow.total : 0;

    fallbackSql += ` LIMIT ? OFFSET ?`;
    const rows = db.prepare(fallbackSql).all(...fParams, limit, offset) as any[];
    const items: SearchResultItem[] = rows.map((r) => ({
      id: r.id,
      category: r.category,
      titleAR: r.titleAR,
      titleFR: null,
      urlBookFR: null,
      page_num: r.page_num,
      snippet: r.snippet,
    }));
    return { items, total };
  }
}

export function searchTitles(
  query: string,
  category?: string,
  limit: number = 20,
  offset: number = 0
): { items: SearchResultItem[]; total: number } {
  const db = getDb();
  const qLike = `%${query}%`;

  let countSql = `SELECT count(*) as total FROM documents WHERE (titleAR LIKE ? OR titleFR LIKE ?)`;
  let searchSql = `
    SELECT id, category, titleAR, titleFR, urlBookFR
    FROM documents
    WHERE (titleAR LIKE ? OR titleFR LIKE ?)
  `;
  const params: (string | number)[] = [qLike, qLike];

  if (category) {
    countSql += ` AND category = ?`;
    searchSql += ` AND category = ?`;
    params.push(category);
  }

  const countRow = db.prepare(countSql).get(...params) as { total: number };
  const total = countRow ? countRow.total : 0;

  searchSql += ` ORDER BY category, titleAR LIMIT ? OFFSET ?`;
  const rows = db.prepare(searchSql).all(...params, limit, offset) as DocumentRow[];

  const items: SearchResultItem[] = rows.map((r) => ({
    id: r.id,
    category: r.category,
    titleAR: r.titleAR,
    titleFR: r.titleFR,
    urlBookFR: r.urlBookFR,
  }));

  return { items, total };
}

export function getDocumentsList(
  category?: string,
  limit: number = 20,
  offset: number = 0
): { items: SearchResultItem[]; total: number } {
  const db = getDb();
  let countSql = `SELECT count(*) as total FROM documents WHERE 1=1`;
  let querySql = `
    SELECT id, category, titleAR, titleFR, urlBookFR
    FROM documents
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (category) {
    countSql += ` AND category = ?`;
    querySql += ` AND category = ?`;
    params.push(category);
  }

  const countRow = db.prepare(countSql).get(...params) as { total: number };
  const total = countRow ? countRow.total : 0;

  querySql += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
  const rows = db.prepare(querySql).all(...params, limit, offset) as DocumentRow[];

  const items: SearchResultItem[] = rows.map((r) => ({
    id: r.id,
    category: r.category,
    titleAR: r.titleAR,
    titleFR: r.titleFR,
    urlBookFR: r.urlBookFR,
  }));

  return { items, total };
}

export function getDocumentById(id: string): DocumentRow | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as DocumentRow | undefined;
  return row || null;
}

export function getSearchHitsForDoc(docId: string, query: string): number[] {
  if (!query) return [];
  const db = getDb();
  const safeQ = `"${query.replace(/"/g, '""')}"`;
  try {
    const rows = db
      .prepare('SELECT page_num FROM pdf_pages WHERE doc_id = ? AND pdf_pages MATCH ? ORDER BY page_num ASC LIMIT 30')
      .all(docId, safeQ) as { page_num: number }[];
    return rows.map((r) => r.page_num);
  } catch {
    return [];
  }
}

import path from 'path';
import fs from 'fs';
import { execFileSync } from 'child_process';

const BASE_DIR = process.cwd();
const PDF_DIR = path.join(BASE_DIR, 'downloaded_pdfs');
const CACHE_DIR = path.join(BASE_DIR, 'cache', 'pages');
const IMAGE_CACHE_DIR = path.join(BASE_DIR, 'cache', 'images');

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}
if (!fs.existsSync(IMAGE_CACHE_DIR)) {
  fs.mkdirSync(IMAGE_CACHE_DIR, { recursive: true });
}

export function getPdfPath(docId: string, category?: string): string | null {
  if (category) {
    const cleanName = `${category}_${docId}.pdf`.replace(/\//g, '_');
    const p = path.join(PDF_DIR, cleanName);
    if (fs.existsSync(p)) return p;
  }

  // Fallback: search directory for docId
  if (fs.existsSync(PDF_DIR)) {
    const files = fs.readdirSync(PDF_DIR);
    for (const f of files) {
      if (f.includes(docId) && f.endsWith('.pdf')) {
        return path.join(PDF_DIR, f);
      }
    }
  }

  return null;
}

export function getPdfPageCount(pdfPath: string): number | null {
  if (!pdfPath || !fs.existsSync(pdfPath)) return null;
  try {
    const out = execFileSync('pdfinfo', [pdfPath], { encoding: 'latin1', stdio: ['ignore', 'pipe', 'ignore'] });
    const match = out.match(/Pages:\s+(\d+)/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
  } catch {
    // fallback
  }
  return null;
}

export function extractSinglePage(pdfPath: string, docId: string, pageNum: number): string | null {
  if (!pdfPath || !fs.existsSync(pdfPath) || pageNum < 1) return null;

  const cachedFile = path.join(CACHE_DIR, `${docId}_p${pageNum}.pdf`);
  if (fs.existsSync(cachedFile) && fs.statSync(cachedFile).size > 0) {
    return cachedFile;
  }

  try {
    // Run pdfseparate -f <page> -l <page> <src> <dest>
    execFileSync('pdfseparate', ['-f', String(pageNum), '-l', String(pageNum), pdfPath, cachedFile], {
      stdio: 'ignore',
    });

    if (fs.existsSync(cachedFile) && fs.statSync(cachedFile).size > 0) {
      return cachedFile;
    }
  } catch (err) {
    console.error(`Failed to extract page ${pageNum} for ${docId}:`, err);
  }

  return null;
}

export function sanitizeFilename(name: string): string {
  const clean = name.replace(/[\\/*?:"<>|]/g, '').trim();
  return clean.length > 70 ? clean.substring(0, 70) : clean;
}

export function renderPageToImage(pdfPath: string, docId: string, pageNum: number): string | null {
  if (!pdfPath || !fs.existsSync(pdfPath) || pageNum < 1) return null;

  const prefix = path.join(IMAGE_CACHE_DIR, `${docId}_p${pageNum}`);
  
  if (fs.existsSync(IMAGE_CACHE_DIR)) {
    const cached = fs.readdirSync(IMAGE_CACHE_DIR).find(
      (f) => f.startsWith(`${docId}_p${pageNum}-`) && f.endsWith('.png')
    );
    if (cached) {
      const full = path.join(IMAGE_CACHE_DIR, cached);
      if (fs.existsSync(full) && fs.statSync(full).size > 0) return full;
    }
  }

  try {
    // pdftoppm -png -r 150 -f <page> -l <page> <pdfPath> <prefix>
    execFileSync('pdftoppm', ['-png', '-r', '150', '-f', String(pageNum), '-l', String(pageNum), pdfPath, prefix], {
      stdio: 'ignore',
    });

    const generated = fs.readdirSync(IMAGE_CACHE_DIR).find(
      (f) => f.startsWith(`${docId}_p${pageNum}-`) && f.endsWith('.png')
    );
    if (generated) {
      const full = path.join(IMAGE_CACHE_DIR, generated);
      if (fs.existsSync(full) && fs.statSync(full).size > 0) return full;
    }
  } catch (err) {
    console.error(`Failed to render page image ${pageNum} for ${docId}:`, err);
  }

  return null;
}

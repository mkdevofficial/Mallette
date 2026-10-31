import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { getCategoriesCounts, getTotalDocsCount, getTotalPagesCount } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default function StatsPage() {
  const totalDocs = getTotalDocsCount();
  const totalPages = getTotalPagesCount();
  const categoriesCounts = getCategoriesCounts();

  const pdfDir = path.join(process.cwd(), 'downloaded_pdfs');
  const downloadedCount = fs.existsSync(pdfDir)
    ? fs.readdirSync(pdfDir).filter((f) => f.endsWith('.pdf')).length
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-3">
          <i className="fa-solid fa-chart-line"></i> مؤشرات الأداء والبيانات
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3">
          إحصائيات قاعدة البيانات والمكتبة
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          بيانات تفصيلية حول أعداد القوانين، الصفحات الممسوحة، محرك الفهرسة والبحث النصي FTS5 في تطبيق Next.js.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-3xl">
            <i className="fa-solid fa-book-bookmark"></i>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900">{totalDocs}</div>
            <div className="text-xs text-slate-500 font-semibold">إجمالي النصوص القانونية</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-3xl">
            <i className="fa-solid fa-file-lines"></i>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900">{totalPages.toLocaleString()}</div>
            <div className="text-xs text-slate-500 font-semibold">صفحة ممسوحة ومفهرسة</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl">
            <i className="fa-solid fa-file-pdf"></i>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900">{downloadedCount}</div>
            <div className="text-xs text-slate-500 font-semibold">ملفات PDF محلية جاهزة</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-3xl">
            <i className="fa-solid fa-folder-tree"></i>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900">{Object.keys(categoriesCounts).length}</div>
            <div className="text-xs text-slate-500 font-semibold">أقسام وتصنيفات رسمية</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-12">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <i className="fa-solid fa-list-check text-emerald-600"></i>
          توزيع النصوص والوثائق حسب الأقسام
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold">
                <th className="py-3 px-4">القسم / التصنيف</th>
                <th className="py-3 px-4">عدد الوثائق</th>
                <th className="py-3 px-4">النسبة المئوية</th>
                <th className="py-3 px-4 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(categoriesCounts).map(([cat, count]) => {
                const pct = ((count / totalDocs) * 100).toFixed(1);
                return (
                  <tr key={cat} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-800">{cat}</td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">{count}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-32 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-2.5 rounded-full"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">{pct}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Link
                        href={`/?category=${encodeURIComponent(cat)}`}
                        className="px-3 py-1 bg-slate-100 hover:bg-emerald-700 hover:text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        استعراض
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

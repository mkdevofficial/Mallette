import Link from 'next/link';
import {
  getCategoriesCounts,
  getTotalDocsCount,
  searchContent,
  searchTitles,
  getDocumentsList,
  SearchResultItem,
} from '@/lib/db';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    type?: string;
    category?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const query = (params.q || '').trim();
  const searchType = params.type === 'title' ? 'title' : 'content';
  const selectedCategory = (params.category || '').trim();
  const currentPage = Math.max(1, parseInt(params.page || '1', 10));
  const perPage = 20;
  const offset = (currentPage - 1) * perPage;

  const categoriesCounts = getCategoriesCounts();
  const totalLibraryDocs = getTotalDocsCount();

  let items: SearchResultItem[] = [];
  let totalCount = 0;

  if (query) {
    if (searchType === 'title') {
      const res = searchTitles(query, selectedCategory || undefined, perPage, offset);
      items = res.items;
      totalCount = res.total;
    } else {
      const res = searchContent(query, selectedCategory || undefined, perPage, offset);
      items = res.items;
      totalCount = res.total;
    }
  } else {
    const res = getDocumentsList(selectedCategory || undefined, perPage, offset);
    items = res.items;
    totalCount = res.total;
  }

  const totalPages = Math.ceil(totalCount / perPage);

  const getCategoryBadgeClass = (cat: string) => {
    switch (cat) {
      case 'قوانين':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'مراسيم':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'الجريدة الرسمية':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'قرارات المحاكم':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'مقررات':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'الاتفاقيات الدولية':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-rose-100 text-rose-800 border-rose-200';
    }
  };

  return (
    <div>
      {/* Hero Search Section */}
      <section className="bg-gradient-to-b from-emerald-950 via-emerald-900 to-slate-900 text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:16px_16px]"></div>

        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-semibold mb-4 backdrop-blur-sm">
            <i className="fa-solid fa-scale-balanced"></i>
            منظومة البحث القانوني الموحدة للجمهورية الإسلامية الموريتانية (Next.js)
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
            ابحث في <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-amber-300">جميع القوانين والمراسيم</span> وتصفحها بدقة
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
            محرك بحث ذكي يبحث في العناوين وداخل نصوص وصفحات ملفات الـ PDF (أكثر من 9,000 صفحة) مع إمكانية القراءة المباشرة وتنزيل صفحة واحدة أو المستند كاملاً.
          </p>

          {/* Search Form Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-2xl text-slate-800 border border-slate-100 text-right">
            <form action="/" method="GET" className="space-y-4">
              <div className="relative flex flex-col sm:flex-row gap-2">
                <div className="relative flex-grow">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400 text-lg">
                    <i className="fa-solid fa-magnifying-glass"></i>
                  </div>
                  <input
                    type="text"
                    name="q"
                    defaultValue={query}
                    placeholder="اكتب كلمة البحث (مثال: شيك، عقوبة، نزع الملكية، حضانة، مرسوم، سلاح)..."
                    className="w-full pr-12 pl-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 outline-none text-base transition-all font-medium"
                    autoFocus
                  />
                  {query && (
                    <Link
                      href={`/?category=${encodeURIComponent(selectedCategory)}&type=${searchType}`}
                      className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-600"
                      title="مسح"
                    >
                      <i className="fa-solid fa-circle-xmark"></i>
                    </Link>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-8 py-3.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
                >
                  <i className="fa-solid fa-magnifying-glass"></i>
                  <span>بحث فوري</span>
                </button>
              </div>

              {/* Options & Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs sm:text-sm text-slate-600">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-slate-700">
                    <i className="fa-solid fa-sliders text-emerald-700 ml-1"></i> نوع البحث:
                  </span>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer hover:text-emerald-800">
                    <input
                      type="radio"
                      name="type"
                      value="content"
                      defaultChecked={searchType === 'content'}
                      className="text-emerald-700 focus:ring-emerald-600"
                    />
                    <span className="font-semibold">داخل نصوص وصفحات الـ PDF (الأشمل)</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer hover:text-emerald-800">
                    <input
                      type="radio"
                      name="type"
                      value="title"
                      defaultChecked={searchType === 'title'}
                      className="text-emerald-700 focus:ring-emerald-600"
                    />
                    <span className="font-semibold">في العناوين والمسميات فقط</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <label htmlFor="cat-select" className="font-bold text-slate-700">
                    التصنيف:
                  </label>
                  <select
                    id="cat-select"
                    name="category"
                    defaultValue={selectedCategory}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="">جميع التصنيفات ({totalLibraryDocs} وثيقة)</option>
                    {Object.entries(categoriesCounts).map(([cat, count]) => (
                      <option key={cat} value={cat}>
                        {cat} ({count})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </form>
          </div>

          {/* Quick Suggestions */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
            <span>كلمات مقترحة للبحث:</span>
            {['عقوبة', 'التأمين', 'المحكمة العليا', 'حضانة', 'شيك', 'الأسلحة', 'نزع الملكية'].map((term) => (
              <Link
                key={term}
                href={`/?q=${encodeURIComponent(term)}&type=content`}
                className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Category Pills Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 text-sm">
            <span className="text-xs font-bold text-slate-400 ml-2 whitespace-nowrap">
              <i className="fa-solid fa-filter"></i> تصفية:
            </span>

            <Link
              href={`/?q=${encodeURIComponent(query)}&type=${searchType}`}
              className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all font-semibold flex items-center gap-1.5 ${
                !selectedCategory
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>الكل</span>
              <span
                className={`text-xs px-1.5 py-0.2 rounded-full ${
                  !selectedCategory ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {totalLibraryDocs}
              </span>
            </Link>

            {Object.entries(categoriesCounts).map(([cat, count]) => (
              <Link
                key={cat}
                href={`/?category=${encodeURIComponent(cat)}&q=${encodeURIComponent(query)}&type=${searchType}`}
                className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all font-semibold flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? 'bg-emerald-800 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-xs px-1.5 py-0.2 rounded-full ${
                    selectedCategory === cat ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
              {query ? (
                <>
                  <i className="fa-solid fa-magnifying-glass text-emerald-600"></i>
                  <span>نتائج البحث عن: "<span className="text-emerald-700">{query}</span>"</span>
                </>
              ) : selectedCategory ? (
                <>
                  <i className="fa-solid fa-folder-open text-emerald-600"></i>
                  <span>تصفح قسم: {selectedCategory}</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-book-bookmark text-emerald-600"></i>
                  <span>دليل النصوص والوثائق القانونية</span>
                </>
              )}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {query ? (
                <>
                  تم العثور على <b>{totalCount}</b> نتيجة مطابقة{' '}
                  {searchType === 'content' ? '(تم مسح 9,030 صفحة)' : '(في عناوين النصوص)'}
                </>
              ) : (
                <>
                  عرض <b>{items.length}</b> من إجمالي <b>{totalCount}</b> وثيقة قانونية متاحة للقراءة والتحميل
                </>
              )}
            </p>
          </div>

          {query && (
            <div className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-lg font-medium flex items-center gap-2">
              <i className="fa-solid fa-bolt text-emerald-600"></i>
              <span>البحث مدعوم بـ SQLite FTS5 فائق السرعة</span>
            </div>
          )}
        </div>

        {/* Empty State */}
        {items.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto my-12 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 mx-auto flex items-center justify-center text-3xl mb-4 border border-amber-200">
              <i className="fa-solid fa-file-circle-question"></i>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">لم يتم العثور على نتائج مطابقة</h3>
            <p className="text-sm text-slate-500 mb-6">
              لم نتمكن من إيجاد نتائج مطابقة لكلمة البحث "<b className="text-slate-700">{query}</b>". جرب استخدام صيغ أو مرادفات أخرى، أو اختر البحث في كامل المحتوى.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {searchType === 'title' && (
                <Link
                  href={`/?q=${encodeURIComponent(query)}&type=content&category=${encodeURIComponent(selectedCategory)}`}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  <i className="fa-solid fa-magnifying-glass ml-1"></i> البحث في محتوى الصفحات بدلاً من العناوين
                </Link>
              )}
              <Link
                href="/"
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
              >
                عرض جميع القوانين
              </Link>
            </div>
          </div>
        )}

        {/* Results List */}
        {items.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {items.map((item, idx) => (
              <div
                key={`${item.id}-${item.page_num || idx}`}
                className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-500/50 p-5 shadow-sm hover:shadow-md transition-all duration-200 text-right group"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${getCategoryBadgeClass(
                        item.category
                      )}`}
                    >
                      <i className="fa-solid fa-folder text-[10px]"></i> {item.category}
                    </span>

                    {item.page_num && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/30">
                        <i className="fa-solid fa-file-lines text-[10px]"></i> صفحة رقم: {item.page_num}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 font-mono">ID: {item.id}</div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors mb-1.5 leading-snug">
                  <Link
                    href={`/viewer/${item.id}${
                      item.page_num ? `?page=${item.page_num}${query ? `&q=${encodeURIComponent(query)}` : ''}` : ''
                    }`}
                  >
                    {item.titleAR}
                  </Link>
                </h3>

                {item.titleFR && (
                  <p className="text-xs text-slate-500 mb-3 font-sans dir-ltr text-right" dir="ltr">
                    {item.titleFR}
                  </p>
                )}

                {item.snippet && (
                  <div className="bg-amber-50/60 border-r-4 border-amber-500 rounded-lg p-3 my-3 text-sm text-slate-700 leading-relaxed font-sans">
                    <span className="text-xs text-amber-700 font-bold block mb-1">
                      <i className="fa-solid fa-quote-right ml-1"></i> مقتطف من الصفحة {item.page_num}:
                    </span>
                    <div
                      className="pr-2"
                      dangerouslySetInnerHTML={{ __html: `... ${item.snippet} ...` }}
                    />
                  </div>
                )}

                {/* Actions Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* View Button */}
                    <Link
                      href={`/viewer/${item.id}${
                        item.page_num ? `?page=${item.page_num}${query ? `&q=${encodeURIComponent(query)}` : ''}` : ''
                      }`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition-colors"
                    >
                      <i className="fa-solid fa-book-open"></i>
                      <span>
                        تصفح وقراءة المستند {item.page_num ? `(صفحة ${item.page_num})` : ''}
                      </span>
                    </Link>

                    {/* Download Single Page Button (If page_num exists) */}
                    {item.page_num && (
                      <a
                        href={`/api/pdf/${item.id}/page/${item.page_num}/download`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors"
                        title={`تنزيل الصفحة ${item.page_num} فقط كملف PDF مستقل`}
                      >
                        <i className="fa-solid fa-file-pdf text-amber-600"></i>
                        <span>تنزيل الصفحة {item.page_num} فقط (PDF)</span>
                      </a>
                    )}

                    {/* Download Full Document Button */}
                    <a
                      href={`/api/pdf/${item.id}/download`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                      title="تنزيل ملف الـ PDF كاملاً"
                    >
                      <i className="fa-solid fa-download text-slate-500"></i>
                      <span>تنزيل كامل الـ PDF</span>
                    </a>
                  </div>

                  {item.urlBookFR && (
                    <a
                      href={item.urlBookFR}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-indigo-700 hover:text-indigo-900 hover:underline"
                    >
                      <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                      <span>Version Française (PDF)</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            {currentPage > 1 && (
              <Link
                href={`/?q=${encodeURIComponent(query)}&type=${searchType}&category=${encodeURIComponent(
                  selectedCategory
                )}&page=${currentPage - 1}`}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold transition-colors"
              >
                <i className="fa-solid fa-chevron-right ml-1"></i> السابق
              </Link>
            )}

            <span className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 text-sm font-bold">
              صفحة {currentPage} من {totalPages}
            </span>

            {currentPage < totalPages && (
              <Link
                href={`/?q=${encodeURIComponent(query)}&type=${searchType}&category=${encodeURIComponent(
                  selectedCategory
                )}&page=${currentPage + 1}`}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold transition-colors"
              >
                التالي <i className="fa-solid fa-chevron-left mr-1"></i>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

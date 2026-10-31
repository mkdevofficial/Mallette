import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'الحقيبة القضائية الموريتانية | محرك البحث ومتصفح وتنزيل القوانين',
  description: 'منظومة البحث القانوني الموحدة وتصفح وتحميل نصوص القوانين والمراسيم والقرارات القضائية الموريتانية',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased font-sans">
        {/* Navigation Bar */}
        <header className="bg-gradient-to-l from-emerald-950 via-emerald-900 to-emerald-800 text-white shadow-lg sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              
              {/* Logo & Brand */}
              <div className="flex items-center gap-3">
                <Link href="/" className="flex items-center gap-3 group">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 text-xl shadow-inner group-hover:scale-105 transition-transform">
                    <i className="fa-solid fa-scale-balanced"></i>
                  </div>
                  <div>
                    <span className="text-xl font-bold tracking-tight text-white block leading-tight">
                      الحقيبة القضائية
                    </span>
                    <span className="text-xs text-emerald-200/80 block font-normal">
                      النصوص القانونية للجمهورية الإسلامية الموريتانية
                    </span>
                  </div>
                </Link>
              </div>

              {/* Navigation Links */}
              <nav className="hidden md:flex items-center gap-1 text-sm font-semibold">
                <Link
                  href="/"
                  className="px-3.5 py-2 rounded-lg text-slate-100 hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <i className="fa-solid fa-magnifying-glass text-xs"></i>
                  <span>محرك البحث</span>
                </Link>
                <Link
                  href="/categories"
                  className="px-3.5 py-2 rounded-lg text-slate-100 hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <i className="fa-solid fa-folder-tree text-xs"></i>
                  <span>تصفح الأقسام</span>
                </Link>
                <Link
                  href="/stats"
                  className="px-3.5 py-2 rounded-lg text-slate-100 hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <i className="fa-solid fa-chart-pie text-xs"></i>
                  <span>الإحصائيات</span>
                </Link>
              </nav>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  258 نصاً قانونياً متاحاً
                </span>
                <Link href="/" className="md:hidden p-2 text-slate-200 hover:text-white" title="البحث">
                  <i className="fa-solid fa-magnifying-glass text-lg"></i>
                </Link>
              </div>

            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow">{children}</main>

        {/* Footer */}
        <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-sm mt-16">
          <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-slate-300">
                <i className="fa-solid fa-balance-scale text-amber-400 text-2xl"></i>
                <div>
                  <div className="font-bold text-white">الحقيبة القضائية الموريتانية (Next.js Edition)</div>
                  <div className="text-xs text-slate-400">
                    محرك بحث ذكي في القوانين والمراسيم والجريدة الرسمية والقرارات القضائية
                  </div>
                </div>
              </div>
              <div className="text-center md:text-left text-xs text-slate-500">
                مبني بـ Next.js و SQLite FTS5 &bull; متصفح PDF.js متطور &bull; تنزيل صفحة مفردة أو كامل المستند
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

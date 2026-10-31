'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';

interface PdfViewerClientProps {
  doc: {
    id: string;
    category: string;
    titleAR: string;
    titleFR: string | null;
  };
  initialPage: number;
  initialTotalPages: number | null;
  searchHits: number[];
  searchQuery: string;
}

export default function PdfViewerClient({
  doc,
  initialPage,
  initialTotalPages,
  searchHits,
  searchQuery,
}: PdfViewerClientProps) {
  const [currentPage, setCurrentPage] = useState<number>(initialPage || 1);
  const [totalPages, setTotalPages] = useState<number>(initialTotalPages || 1);
  const [loading, setLoading] = useState<boolean>(true);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [isRtl, setIsRtl] = useState<boolean>(true); // RTL by default for Arabic
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<number>(0);

  const pageImageUrl = `/api/pdf/${doc.id}/page/${currentPage}/image`;

  // Preload adjacent page images for instant page flips
  useEffect(() => {
    if (currentPage < totalPages) {
      const nextImg = new window.Image();
      nextImg.src = `/api/pdf/${doc.id}/page/${currentPage + 1}/image`;
    }
    if (currentPage > 1) {
      const prevImg = new window.Image();
      prevImg.src = `/api/pdf/${doc.id}/page/${currentPage - 1}/image`;
    }
  }, [currentPage, totalPages, doc.id]);

  // Page navigation
  const goToPage = useCallback(
    (num: number) => {
      if (num < 1 || num > totalPages) return;
      setCurrentPage(num);
      setLoading(true);

      // Update URL quietly
      window.history.replaceState(
        null,
        '',
        `?page=${num}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}`
      );

      // Scroll to top
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
    },
    [totalPages, searchQuery]
  );

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, goToPage]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  // RTL-aware navigation:
  // Right arrow (>) = Next Page (التالي)
  // Left arrow (<) = Previous Page (السابق)
  const handleRightArrowClick = () => {
    if (isRtl) nextPage();
    else prevPage();
  };

  const handleLeftArrowClick = () => {
    if (isRtl) prevPage();
    else nextPage();
  };

  const isRightDisabled = isRtl ? currentPage >= totalPages : currentPage <= 1;
  const isLeftDisabled = isRtl ? currentPage <= 1 : currentPage >= totalPages;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'ArrowRight') {
        if (isRtl) nextPage();
        else prevPage();
      } else if (e.key === 'ArrowLeft') {
        if (isRtl) prevPage();
        else nextPage();
      } else if (e.key === ' ' || e.key === 'PageDown') {
        nextPage();
      } else if (e.key === 'PageUp') {
        prevPage();
      } else if (e.key === 'Escape') {
        setShowMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRtl, nextPage, prevPage]);

  // Touch gesture handling (swipe & double-tap zoom)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const now = Date.now();
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const duration = now - touchStartRef.current.time;

    // Double-tap zoom toggle
    const tapInterval = now - lastTapRef.current;
    if (tapInterval < 300 && Math.abs(deltaX) < 15 && Math.abs(deltaY) < 15) {
      lastTapRef.current = 0;
      setIsZoomed((z) => !z);
      return;
    }
    lastTapRef.current = now;

    // Horizontal swipe (when not zoomed)
    if (!isZoomed && duration < 400 && Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX < 0) {
        if (isRtl) nextPage();
        else prevPage();
      } else {
        if (isRtl) prevPage();
        else nextPage();
      }
    }
  };

  return (
    <div
      id="fullscreen-viewer"
      className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col select-none overflow-hidden h-[100dvh] w-screen"
    >
      {/* 1. Main Full-Screen & Full-Width Document View Area */}
      <div
        ref={containerRef}
        id="pdf-canvas-container"
        className="relative w-full h-[100dvh] overflow-y-auto overflow-x-auto bg-slate-950 flex justify-center items-start p-0 m-0 custom-scrollbar"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/75 z-20 pointer-events-none">
            <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mb-3"></div>
            <p className="text-sm font-bold text-slate-200">جارٍ تصيير صفحة {currentPage} بدقة فائقة...</p>
          </div>
        )}

        {/* The PDF Page Image (Uses 100% of Screen Width, Edge-to-Edge) */}
        <img
          key={`${doc.id}-${currentPage}`}
          src={pageImageUrl}
          alt={`وثيقة ${doc.titleAR} - صفحة ${currentPage}`}
          onLoad={() => setLoading(false)}
          className={`block m-0 p-0 bg-white select-none transition-all duration-150 ${
            isZoomed
              ? 'w-[180%] min-w-[180%] max-w-none cursor-zoom-out'
              : 'w-full min-w-full max-w-full h-auto cursor-zoom-in'
          }`}
          onClick={() => setIsZoomed((z) => !z)}
        />
      </div>

      {/* 2. Floating "..." Menu Button (Top-Left) */}
      <div className="fixed top-3 left-3 z-40 sm:top-4 sm:left-4">
        <button
          onClick={() => setShowMenu((prev) => !prev)}
          aria-label="القائمة والخيارات"
          className="w-12 h-12 rounded-full bg-slate-900/85 hover:bg-slate-900 active:bg-slate-800 text-white backdrop-blur-md shadow-2xl border border-white/20 flex items-center justify-center text-xl cursor-pointer transition-all hover:scale-105 active:scale-95"
          title="خيارات المستند (تنزيل الصفحة، الرجوع للرئيسية)"
        >
          <i className="fa-solid fa-ellipsis"></i>
        </button>

        {/* Dropdown Menu Modal */}
        {showMenu && (
          <>
            {/* Backdrop Click Dismiss */}
            <div
              className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs"
              onClick={() => setShowMenu(false)}
            />

            {/* Menu Card */}
            <div
              className="absolute left-0 mt-2 z-40 w-72 bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-2xl p-4 shadow-2xl flex flex-col gap-3 text-right animate-in fade-in zoom-in-95 duration-150"
              dir="rtl"
            >
              {/* Header / Document Title */}
              <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-3">
                <div className="min-w-0">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-1">
                    {doc.category}
                  </span>
                  <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug" title={doc.titleAR}>
                    {doc.titleAR}
                  </h3>
                  <p className="text-[11px] font-semibold text-emerald-400 mt-1">
                    الصفحة المعروضة: {currentPage} من {totalPages}
                  </p>
                </div>
                <button
                  onClick={() => setShowMenu(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
                  title="إغلاق"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>

              {/* 1. Button: Download Current Page */}
              <a
                href={`/api/pdf/${doc.id}/page/${currentPage}/download`}
                onClick={() => setShowMenu(false)}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-sm shadow-md transition-all group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-600/30 flex items-center justify-center text-slate-950 text-base shrink-0 group-hover:scale-105 transition-transform">
                  <i className="fa-solid fa-file-arrow-down"></i>
                </div>
                <div className="text-right flex-grow">
                  <span className="block leading-tight text-slate-950 font-extrabold">تنزيل هذه الصفحة</span>
                  <span className="block text-[11px] font-semibold text-slate-800 mt-0.5">
                    حفظ صفحة {currentPage} كملف PDF
                  </span>
                </div>
              </a>

              {/* 2. Button: Return to Home Page */}
              <Link
                href={`/${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`}
                onClick={() => setShowMenu(false)}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-bold text-sm border border-slate-700 shadow-md transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-base shrink-0 group-hover:scale-105 transition-transform">
                  <i className="fa-solid fa-house"></i>
                </div>
                <div className="text-right flex-grow">
                  <span className="block leading-tight font-extrabold text-white">الرجوع للصفحة الرئيسية</span>
                  <span className="block text-[11px] font-normal text-slate-400 mt-0.5">
                    العودة إلى محرك البحث
                  </span>
                </div>
              </Link>

              {/* 3. Extra Option: Download Full Document PDF */}
              <a
                href={`/api/pdf/${doc.id}/download`}
                onClick={() => setShowMenu(false)}
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs border border-white/5 transition-colors"
              >
                <i className="fa-solid fa-download text-emerald-400"></i>
                <span>تنزيل كامل ملف الـ PDF</span>
              </a>

              {/* Quick Jump Input */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 text-xs">
                <span className="text-slate-400">الانتقال لصفحة:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    defaultValue={currentPage}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = parseInt((e.target as HTMLInputElement).value, 10);
                        if (val) {
                          goToPage(val);
                          setShowMenu(false);
                        }
                      }
                    }}
                    className="w-14 text-center bg-slate-800 text-white font-bold rounded py-1 px-1 border border-slate-600 text-xs focus:outline-none"
                    id="menu-jump-input"
                  />
                  <button
                    onClick={() => {
                      const inp = document.getElementById('menu-jump-input') as HTMLInputElement;
                      if (inp && inp.value) {
                        const val = parseInt(inp.value, 10);
                        if (val) {
                          goToPage(val);
                          setShowMenu(false);
                        }
                      }
                    }}
                    className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 rounded text-white font-bold text-xs"
                  >
                    انتقال
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 3. Floating Subtle Page Indicator (Top-Center) */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white text-xs font-mono font-bold shadow-lg">
          {currentPage} / {totalPages}
        </div>
      </div>

      {/* 4. Overlaid Navigation Arrows (Fixed at Left & Right Edges) */}
      <>
        {/* Right Arrow (RTL: Next Page | LTR: Previous Page) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRightArrowClick();
          }}
          disabled={isRightDisabled}
          aria-label={isRtl ? `الصفحة التالية (صفحة ${currentPage + 1})` : `الصفحة السابقة (صفحة ${currentPage - 1})`}
          className={`fixed right-0 top-1/2 -translate-y-1/2 z-30 w-12 h-20 sm:w-16 sm:h-28 flex flex-col items-center justify-center rounded-l-2xl backdrop-blur-md transition-all shadow-2xl cursor-pointer ${
            isRightDisabled
              ? 'opacity-0 pointer-events-none'
              : 'bg-black/45 hover:bg-black/75 active:bg-emerald-600/80 text-white/90 border-l border-y border-white/20 hover:scale-105 active:scale-95'
          }`}
        >
          <i className="fa-solid fa-chevron-right text-2xl sm:text-3xl"></i>
          <span className="text-[10px] sm:text-xs font-bold mt-1 text-emerald-300">
            {isRtl ? 'التالي' : 'السابق'}
          </span>
        </button>

        {/* Left Arrow (RTL: Previous Page | LTR: Next Page) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleLeftArrowClick();
          }}
          disabled={isLeftDisabled}
          aria-label={isRtl ? `الصفحة السابقة (صفحة ${currentPage - 1})` : `الصفحة التالية (صفحة ${currentPage + 1})`}
          className={`fixed left-0 top-1/2 -translate-y-1/2 z-30 w-12 h-20 sm:w-16 sm:h-28 flex flex-col items-center justify-center rounded-r-2xl backdrop-blur-md transition-all shadow-2xl cursor-pointer ${
            isLeftDisabled
              ? 'opacity-0 pointer-events-none'
              : 'bg-black/45 hover:bg-black/75 active:bg-emerald-600/80 text-white/90 border-r border-y border-white/20 hover:scale-105 active:scale-95'
          }`}
        >
          <i className="fa-solid fa-chevron-left text-2xl sm:text-3xl"></i>
          <span className="text-[10px] sm:text-xs font-bold mt-1 text-slate-300">
            {isRtl ? 'السابق' : 'التالي'}
          </span>
        </button>
      </>

      {/* 5. Search Hits Floating Pills (If navigated from a search with multiple hits) */}
      {searchHits.length > 1 && (
        <div className="fixed bottom-3 inset-x-4 z-30 max-w-md mx-auto flex items-center justify-center gap-1.5 overflow-x-auto custom-scrollbar py-1.5 px-3 rounded-2xl bg-black/75 backdrop-blur-md border border-white/15 text-[11px] shadow-2xl">
          <span className="text-amber-400 font-bold whitespace-nowrap ml-1">
            <i className="fa-solid fa-highlighter"></i> المطابقات:
          </span>
          {searchHits.map((p) => (
            <button
              key={p}
              onClick={() => goToPage(p)}
              className={`px-2 py-0.5 rounded font-bold transition-colors whitespace-nowrap cursor-pointer ${
                currentPage === p
                  ? 'bg-amber-400 text-slate-950 shadow'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
              }`}
            >
              ص {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

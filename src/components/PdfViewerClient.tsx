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

declare global {
  interface Window {
    pdfjsLib?: any;
  }
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
  const [renderMode, setRenderMode] = useState<'hd' | 'canvas' | 'native'>('hd');
  const [isFitWidth, setIsFitWidth] = useState<boolean>(true);
  const [customScale, setCustomScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState<boolean>(false);
  const [isRtl, setIsRtl] = useState<boolean>(true); // RTL by default for Arabic
  const [jumpInput, setJumpInput] = useState<string>(String(initialPage || 1));

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pdfDocRef = useRef<any>(null);
  const currentPageRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);
  const autoHideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Touch gesture tracking (swipe, double tap)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTapRef = useRef<number>(0);

  const pdfUrl = `/api/pdf/${doc.id}`;
  const pageImageUrl = `/api/pdf/${doc.id}/page/${currentPage}/image`;

  // Start / Reset auto-hide timer for overlay
  const resetAutoHideTimer = useCallback(() => {
    if (autoHideTimeoutRef.current) {
      clearTimeout(autoHideTimeoutRef.current);
    }
    autoHideTimeoutRef.current = setTimeout(() => {
      setShowOverlay(false);
    }, 4500);
  }, []);

  // Toggle overlay controls
  const toggleOverlay = () => {
    setShowOverlay((prev) => {
      const nextState = !prev;
      if (nextState) {
        resetAutoHideTimer();
      } else if (autoHideTimeoutRef.current) {
        clearTimeout(autoHideTimeoutRef.current);
      }
      return nextState;
    });
  };

  // Preload adjacent page images in HD mode for instant flipping
  useEffect(() => {
    if (renderMode === 'hd') {
      if (currentPage < totalPages) {
        const nextImg = new window.Image();
        nextImg.src = `/api/pdf/${doc.id}/page/${currentPage + 1}/image`;
      }
      if (currentPage > 1) {
        const prevImg = new window.Image();
        prevImg.src = `/api/pdf/${doc.id}/page/${currentPage - 1}/image`;
      }
    }
  }, [currentPage, totalPages, doc.id, renderMode]);

  // Load PDF.js only when canvas mode is requested
  useEffect(() => {
    if (renderMode !== 'canvas') return;
    let isMounted = true;

    const loadScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.pdfjsLib) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = '/pdfjs/pdf.min.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load pdf.min.js'));
        document.head.appendChild(script);
      });
    };

    loadScript()
      .then(() => {
        if (!isMounted || !window.pdfjsLib) return;

        window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.js';

        const loadingTask = window.pdfjsLib.getDocument({
          url: pdfUrl,
          cMapUrl: '/pdfjs/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: '/pdfjs/standard_fonts/',
          enableXfa: true,
          isEvalSupported: true,
          useSystemFonts: true,
        });

        loadingTask.promise
          .then((pdf: any) => {
            if (!isMounted) return;
            pdfDocRef.current = pdf;
            if (!totalPages || totalPages <= 1) {
              setTotalPages(pdf.numPages);
            }
            renderCanvasPage(currentPage, pdf);
          })
          .catch((err: any) => {
            console.error('PDF.js getDocument error:', err);
            if (isMounted) {
              setError('تعذر تصيير الكانفاس، يتم التحويل تلقائياً لوضع الصور فائق الدقة.');
              setRenderMode('hd');
            }
          });
      })
      .catch((err) => {
        console.error('PDF.js load error:', err);
        if (isMounted) {
          setRenderMode('hd');
        }
      });

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (_) {}
      }
    };
  }, [renderMode, doc.id, pdfUrl, totalPages, currentPage]);

  // Render Canvas Page for PDF.js mode
  const renderCanvasPage = useCallback(
    async (pageNum: number, pdfInstance?: any) => {
      const pdf = pdfInstance || pdfDocRef.current;
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!pdf || !canvas || !container) return;

      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (_) {}
      }

      setLoading(true);

      try {
        const page = await pdf.getPage(pageNum);
        currentPageRef.current = page;

        const containerWidth = container.clientWidth || window.innerWidth;
        const vp1 = page.getViewport({ scale: 1.0, rotation });
        const fitScale = containerWidth > 0 && vp1.width > 0 ? +(containerWidth / vp1.width).toFixed(4) : 1.0;
        const activeScale = isFitWidth ? fitScale : customScale;

        const pixelRatio = Math.max(window.devicePixelRatio || 1, 1.5);
        const viewport = page.getViewport({ scale: activeScale, rotation });

        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const transform = pixelRatio !== 1 ? [pixelRatio, 0, 0, pixelRatio, 0, 0] : null;

        const renderContext = {
          canvasContext: ctx,
          viewport,
          transform,
        };

        const task = page.render(renderContext);
        renderTaskRef.current = task;

        await task.promise;
        setLoading(false);
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Canvas render error:', err);
          setLoading(false);
        }
      }
    },
    [customScale, isFitWidth, rotation]
  );

  // Page navigation
  const goToPage = useCallback(
    (num: number) => {
      if (num < 1 || num > totalPages) return;
      setCurrentPage(num);
      setJumpInput(String(num));
      setLoading(true);

      if (renderMode === 'canvas') {
        renderCanvasPage(num);
      }

      // Update URL silently
      window.history.replaceState(
        null,
        '',
        `?page=${num}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ''}`
      );

      // Scroll container to top
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
    },
    [totalPages, renderMode, renderCanvasPage, searchQuery]
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
  // In RTL Arabic reading:
  // Right arrow (>) advances to NEXT page
  // Left arrow (<) returns to PREVIOUS page
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

  // Zoom controls
  const handleZoomIn = () => {
    setIsFitWidth(false);
    setCustomScale((prev) => +(prev + 0.25).toFixed(2));
  };

  const handleZoomOut = () => {
    setIsFitWidth(false);
    setCustomScale((prev) => Math.max(0.4, +(prev - 0.25).toFixed(2)));
  };

  const handleFitWidth = () => {
    setIsFitWidth(true);
    setCustomScale(1.0);
  };

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
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleFitWidth();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRtl, nextPage, prevPage]);

  // Touch gesture handlers (swipe & double-tap zoom)
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

    // Detect double-tap zoom
    const tapInterval = now - lastTapRef.current;
    if (tapInterval < 300 && Math.abs(deltaX) < 15 && Math.abs(deltaY) < 15) {
      lastTapRef.current = 0;
      if (isFitWidth) {
        setIsFitWidth(false);
        setCustomScale(1.75);
      } else {
        handleFitWidth();
      }
      return;
    }
    lastTapRef.current = now;

    // Detect horizontal swipe (when fit to width)
    if (isFitWidth && duration < 400 && Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      if (deltaX < 0) {
        if (isRtl) nextPage();
        else prevPage();
      } else {
        if (isRtl) prevPage();
        else nextPage();
      }
      return;
    }

    // Simple tap toggles overlay
    if (duration < 250 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      toggleOverlay();
    }
  };

  return (
    <div
      id="fullscreen-viewer"
      className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col select-none overflow-hidden h-[100dvh] w-screen"
    >
      {/* 1. Main Full-Screen PDF Reading Area */}
      <div
        ref={containerRef}
        id="pdf-canvas-container"
        className="relative flex-grow w-full h-full overflow-y-auto overflow-x-auto bg-slate-950 flex justify-center items-start p-0 m-0 custom-scrollbar"
        onClick={(e) => {
          if (e.target === containerRef.current) {
            toggleOverlay();
          }
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Loading Spinner */}
        {loading && renderMode !== 'native' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-20 pointer-events-none">
            <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mb-3"></div>
            <p className="text-sm font-bold text-slate-200">جارٍ تحميل صفحة {currentPage} بدقة فائقة...</p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex flex-col items-center justify-center p-8 text-center text-amber-300 max-w-md mx-auto my-auto z-20">
            <i className="fa-solid fa-triangle-exclamation text-4xl mb-3"></i>
            <h3 className="text-sm font-bold mb-3">{error}</h3>
          </div>
        )}

        {/* Render Mode 1: HD Native Cairo Image (Default - 100% connected Arabic letters!) */}
        {renderMode === 'hd' && (
          <img
            key={`${doc.id}-${currentPage}`}
            src={pageImageUrl}
            alt={`صفحة ${currentPage}`}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setRenderMode('canvas');
            }}
            className="block m-0 p-0 shadow-2xl bg-white select-none transition-transform duration-100"
            style={{
              width: isFitWidth ? '100%' : `${Math.round(customScale * 100)}%`,
              maxWidth: isFitWidth ? '100%' : 'none',
              height: 'auto',
              transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
            }}
          />
        )}

        {/* Render Mode 2: PDF.js Canvas */}
        {renderMode === 'canvas' && (
          <canvas
            ref={canvasRef}
            className="block m-0 p-0 shadow-2xl bg-white transition-opacity duration-200"
          />
        )}

        {/* Render Mode 3: Native Browser PDF Viewer */}
        {renderMode === 'native' && (
          <iframe
            src={`${pdfUrl}#page=${currentPage}`}
            className="w-full h-full border-0"
            title="العارض المدمج"
          />
        )}
      </div>

      {/* 2. Overlaid Navigation Arrows (Fixed at Left & Right Edges, Vertically Centered) */}
      {renderMode !== 'native' && (
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
      )}

      {/* 3. Top Floating Minimal Overlay Bar (Toggles on Tap, Auto-hides) */}
      <div
        className={`fixed top-0 inset-x-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-white/10 px-3 py-2 sm:px-6 transition-all duration-300 ease-out transform ${
          showOverlay
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : '-translate-y-full opacity-0 pointer-events-none'
        }`}
        onClick={resetAutoHideTimer}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Back & Doc Title */}
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href={`/?q=${encodeURIComponent(searchQuery)}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-bold shrink-0 transition-colors"
            >
              <i className="fa-solid fa-arrow-right"></i>
              <span className="hidden sm:inline">رجوع للبحث</span>
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                  {doc.category}
                </span>
                <h1 className="text-xs sm:text-sm font-bold text-white truncate max-w-[180px] sm:max-w-md" title={doc.titleAR}>
                  {doc.titleAR}
                </h1>
              </div>
            </div>
          </div>

          {/* Page Badge & Downloads */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-mono font-bold bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">
              {currentPage} / {totalPages}
            </span>

            {/* Download single page */}
            <a
              href={`/api/pdf/${doc.id}/page/${currentPage}/download`}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all"
              title={`تنزيل صفحة ${currentPage} كملف PDF`}
            >
              <i className="fa-solid fa-file-pdf"></i>
              <span className="hidden md:inline">صفحة {currentPage}</span>
            </a>

            {/* Download full PDF */}
            <a
              href={`/api/pdf/${doc.id}/download`}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition-all"
              title="تنزيل كامل الـ PDF"
            >
              <i className="fa-solid fa-download"></i>
              <span className="hidden md:inline">كامل PDF</span>
            </a>

            {/* Close Overlay */}
            <button
              onClick={() => setShowOverlay(false)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="إغلاق شريط التحكم"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Bottom Floating Minimal Control Bar (Toggles on Tap, Auto-hides) */}
      <div
        className={`fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-white/10 px-3 py-2.5 sm:px-6 transition-all duration-300 ease-out transform ${
          showOverlay
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : 'translate-y-full opacity-0 pointer-events-none'
        }`}
        onClick={resetAutoHideTimer}
      >
        <div className="max-w-3xl mx-auto flex flex-col gap-2">
          {/* Quick Page Slider & Jump */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 shrink-0">1</span>
            <input
              type="range"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => goToPage(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
            />
            <span className="text-xs font-bold text-slate-400 shrink-0">{totalPages}</span>

            <div className="flex items-center gap-1 shrink-0 bg-slate-900 border border-slate-700 rounded-lg px-2 py-0.5">
              <span className="text-[11px] text-slate-400">صفحة</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={jumpInput}
                onChange={(e) => setJumpInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const num = parseInt(jumpInput, 10);
                    if (num) goToPage(num);
                  }
                }}
                className="w-12 text-center text-xs font-bold bg-slate-800 text-white rounded px-1 py-0.5 border border-slate-600 focus:outline-none"
              />
              <button
                onClick={() => {
                  const num = parseInt(jumpInput, 10);
                  if (num) goToPage(num);
                }}
                className="text-[11px] px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 rounded text-white font-bold"
              >
                انتقال
              </button>
            </div>
          </div>

          {/* Action Tools Row */}
          <div className="flex items-center justify-between gap-2 text-xs">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleZoomOut}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                title="تصغير (-)"
              >
                <i className="fa-solid fa-magnifying-glass-minus text-xs"></i>
              </button>

              <button
                onClick={handleFitWidth}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  isFitWidth
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
                title="ملء عرض الشاشة تلقائياً"
              >
                <i className="fa-solid fa-arrows-left-right-to-line ml-1"></i>
                <span>احتواء العرض</span>
              </button>

              <button
                onClick={handleZoomIn}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                title="تكبير (+)"
              >
                <i className="fa-solid fa-magnifying-glass-plus text-xs"></i>
              </button>
            </div>

            {/* Mode selection & Navigation direction */}
            <div className="flex items-center gap-1.5">
              {/* Render Mode Selector */}
              <div className="flex items-center rounded-lg bg-slate-900 p-0.5 border border-slate-700">
                <button
                  onClick={() => setRenderMode('hd')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                    renderMode === 'hd' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="عرض الصور فائق الدقة (حروف عربية متصلة ومثالية)"
                >
                  فائق الدقة (HD)
                </button>
                <button
                  onClick={() => setRenderMode('canvas')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                    renderMode === 'canvas' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="عارض PDF.js Canvas"
                >
                  PDF.js
                </button>
                <button
                  onClick={() => setRenderMode('native')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                    renderMode === 'native' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="العارض المدمج في المتصفح"
                >
                  مدمج
                </button>
              </div>

              <button
                onClick={() => setRotation((r) => (r + 90) % 360)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                title="تدوير الصفحة 90°"
              >
                <i className="fa-solid fa-rotate-right text-xs"></i>
              </button>

              <button
                onClick={() => setIsRtl(!isRtl)}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 border border-slate-700"
                title="تغيير اتجاه الأسهم (RTL / LTR)"
              >
                {isRtl ? 'عربي (يمين التالي)' : 'فرنسي (يسار التالي)'}
              </button>
            </div>
          </div>

          {/* Search Hits Quick Pills */}
          {searchHits.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-1 text-[11px]">
              <span className="text-amber-400 font-bold whitespace-nowrap">
                <i className="fa-solid fa-magnifying-glass ml-1"></i> ورود الكلمة:
              </span>
              {searchHits.map((p) => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`px-2 py-0.5 rounded font-bold transition-colors whitespace-nowrap ${
                    currentPage === p
                      ? 'bg-amber-400 text-slate-950 shadow'
                      : 'bg-amber-500/20 hover:bg-amber-500/40 text-amber-200 border border-amber-500/30'
                  }`}
                >
                  صفحة {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

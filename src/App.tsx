import { useState, useCallback, useMemo } from 'react';
import Header from './components/Header';
import UploadArea from './components/UploadArea';
import PageCard from './components/PageCard';
import ManualEditorModal from './components/ManualEditorModal';
import PanelPreviewModal from './components/PanelPreviewModal';
import RuleGuideModal from './components/RuleGuideModal';
import { MangaPage, PanelCrop, CutLine } from './types';
import { sortFilesNaturally } from './lib/sortUtils';
import { detectMangaPanels, loadImage, fileToDataUrl, analyzeWithGemini } from './lib/cvDetector';
import { generatePanelCrops } from './lib/cropUtils';
import { exportPagesToZip, ZipExportProgress } from './lib/zipExporter';
import { generateAllSampleCases } from './lib/samplePages';
import {
  Download,
  Trash2,
  RefreshCw,
  FileCheck2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Layers,
  CheckCircle2,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

export default function App() {
  const [pages, setPages] = useState<MangaPage[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [editingPage, setEditingPage] = useState<{ page: MangaPage; index: number } | null>(null);
  const [selectedPreviewPanel, setSelectedPreviewPanel] = useState<{
    panel: PanelCrop;
    pageName: string;
  } | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [zipProgress, setZipProgress] = useState<ZipExportProgress | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [analyzingAiPageId, setAnalyzingAiPageId] = useState<string | null>(null);
  const [isBatchAiRunning, setIsBatchAiRunning] = useState(false);

  // Total panels count across all pages
  const totalPanels = useMemo(() => {
    return pages.reduce((acc, p) => acc + p.panels.length, 0);
  }, [pages]);

  // Process a single manga page with local computer vision
  const processSinglePage = useCallback(
    async (file: File, pageIndex: number): Promise<MangaPage> => {
      const pageId = `page-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      let originalUrl = '';
      try {
        originalUrl = await fileToDataUrl(file);
      } catch {
        originalUrl = URL.createObjectURL(file);
      }

      try {
        const img = await loadImage(originalUrl);
        const origW = img.naturalWidth || img.width;
        const origH = img.naturalHeight || img.height;

        // Stage A: Local Computer Vision Detection
        const { analysis, cutLines } = await detectMangaPanels(img);

        const isKeptIntact = analysis.detectedRule === 4 || cutLines.length === 0;

        // Generate high resolution panel crops
        const panels = await generatePanelCrops(img, cutLines, pageIndex, isKeptIntact);

        return {
          id: pageId,
          file,
          name: file.name,
          originalUrl,
          width: origW,
          height: origH,
          status: isKeptIntact ? 'manual_review' : 'done',
          progress: 100,
          analysis,
          cutLines,
          panels,
          isKeptIntact,
        };
      } catch (err: any) {
        console.error(`Error processing ${file.name}:`, err);
        return {
          id: pageId,
          file,
          name: file.name,
          originalUrl,
          width: 0,
          height: 0,
          status: 'error',
          progress: 100,
          cutLines: [],
          panels: [],
          isKeptIntact: true,
          errorMessage: err.message || 'Gagal memproses gambar',
        };
      }
    },
    []
  );

  // Handle new file uploads (multi-image, naturally sorted)
  const handleFilesSelected = useCallback(
    async (newFiles: File[]) => {
      if (newFiles.length === 0) return;

      // Natural sort by filename so e.g. 01, 02, 10 are in strict reading order
      const sortedFiles = sortFilesNaturally(newFiles);

      setIsProcessingBatch(true);
      setBatchProgress({ current: 0, total: sortedFiles.length });
      setStatusMessage(`Mengurutkan dan memproses ${sortedFiles.length} halaman manga...`);

      const processedNewPages: MangaPage[] = [];

      for (let i = 0; i < sortedFiles.length; i++) {
        setBatchProgress({ current: i + 1, total: sortedFiles.length });
        const page = await processSinglePage(sortedFiles[i], pages.length + i);
        processedNewPages.push(page);
      }

      setPages((prev) => {
        // Merge and re-sort all pages naturally
        const allPages = [...prev, ...processedNewPages];
        return allPages.sort((a, b) => {
          return a.name.localeCompare(b.name, undefined, {
            numeric: true,
            sensitivity: 'base',
          });
        });
      });

      setIsProcessingBatch(false);
      setStatusMessage(`Berhasil memproses ${sortedFiles.length} halaman!`);
      setTimeout(() => setStatusMessage(null), 4000);
    },
    [pages.length, processSinglePage]
  );

  // Load sample pages demonstrating the 4 cases
  const handleLoadSamples = async () => {
    try {
      setIsLoadingSample(true);
      const sampleFiles = await generateAllSampleCases();
      await handleFilesSelected(sampleFiles);
    } catch (err) {
      console.error('Error generating samples:', err);
    } finally {
      setIsLoadingSample(false);
    }
  };

  // Reprocess a single page with local CV
  const handleReprocessPage = async (pageIndex: number) => {
    const page = pages[pageIndex];
    if (!page) return;

    setStatusMessage(`Memproses ulang ${page.name}...`);
    const updated = await processSinglePage(page.file, pageIndex);

    setPages((prev) => {
      const next = [...prev];
      next[pageIndex] = updated;
      return next;
    });

    setStatusMessage(`Selesai memproses ulang ${page.name}`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Toggle single page between intact and cut
  const handleToggleIntact = async (pageIndex: number) => {
    const page = pages[pageIndex];
    if (!page) return;

    const newIntact = !page.isKeptIntact;
    try {
      const img = await loadImage(page.originalUrl);
      const newPanels = await generatePanelCrops(img, page.cutLines, pageIndex, newIntact);

      setPages((prev) => {
        const next = [...prev];
        next[pageIndex] = {
          ...page,
          isKeptIntact: newIntact,
          panels: newPanels,
          status: newIntact ? 'manual_review' : 'done',
        };
        return next;
      });

      setStatusMessage(
        newIntact
          ? `${page.name} sekarang diatur sebagai 1 halaman utuh.`
          : `${page.name} dipotong sesuai ${page.cutLines.length} garis pemisah.`
      );
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // Analyze single page using Gemini Vision
  const handleAnalyzeAi = async (pageIndex: number) => {
    const page = pages[pageIndex];
    if (!page) return;

    try {
      setAnalyzingAiPageId(page.id);
      setStatusMessage(`Menghubungi Gemini AI untuk menganalisis layout ${page.name}...`);

      const aiResult = await analyzeWithGemini(page.originalUrl);
      const isKeptIntact = aiResult.rule === 4 || aiResult.suggestedCutRatios.length === 0;

      const newCuts: CutLine[] = aiResult.suggestedCutRatios.map((ratio, i) => {
        const yPixel = Math.round(ratio * page.height);
        return {
          id: `ai-cut-${i}-${Date.now()}`,
          yRatio: ratio,
          yPixel,
          isUserAdded: false,
        };
      });

      const img = await loadImage(page.originalUrl);
      const newPanels = await generatePanelCrops(img, newCuts, pageIndex, isKeptIntact);

      setPages((prev) => {
        const next = [...prev];
        next[pageIndex] = {
          ...page,
          cutLines: newCuts,
          isKeptIntact,
          panels: newPanels,
          analysis: {
            detectedRule: aiResult.rule,
            ruleName: `AI: ${aiResult.ruleName}`,
            confidenceScore: aiResult.confidenceScore,
            candidateCuts: newCuts.map((c) => c.yPixel),
            requiresManualReview: isKeptIntact,
            notes: `[Gemini AI] ${aiResult.notes}`,
          },
          status: isKeptIntact ? 'manual_review' : 'done',
        };
        return next;
      });

      setStatusMessage(`Analisis AI selesai: ${aiResult.ruleName} (${newPanels.length} gambar)`);
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error('Gemini analysis failed:', err);
      alert(`Bantuan Gemini AI gagal: ${err.message}. Deteksi lokal tetap aktif.`);
    } finally {
      setAnalyzingAiPageId(null);
    }
  };

  // Batch analyze all pages with Gemini AI
  const handleBatchAnalyzeAi = async () => {
    if (pages.length === 0 || isBatchAiRunning) return;

    setIsBatchAiRunning(true);
    setStatusMessage(`Menganalisis ${pages.length} halaman secara semantik dengan Gemini AI...`);

    for (let i = 0; i < pages.length; i++) {
      try {
        await handleAnalyzeAi(i);
      } catch (err) {
        console.error(`AI error on page ${i}:`, err);
      }
    }

    setIsBatchAiRunning(false);
    setStatusMessage('Selesai menganalisis semua halaman dengan Gemini AI!');
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Delete single page
  const handleDeletePage = (pageIndex: number) => {
    setPages((prev) => {
      const pageToDelete = prev[pageIndex];
      if (pageToDelete?.originalUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(pageToDelete.originalUrl);
      }
      return prev.filter((_, idx) => idx !== pageIndex);
    });
  };

  // Clear all pages
  const handleClearAll = () => {
    if (pages.length === 0) return;
    if (window.confirm('Yakin ingin menghapus seluruh halaman yang telah diunggah?')) {
      for (const p of pages) {
        if (p.originalUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(p.originalUrl);
        }
      }
      setPages([]);
    }
  };

  // Save manual edit corrections
  const handleSaveManualEdit = (updatedPage: MangaPage) => {
    if (!editingPage) return;
    setPages((prev) => {
      const next = [...prev];
      next[editingPage.index] = updatedPage;
      return next;
    });
    setEditingPage(null);
    setStatusMessage(`Koreksi manual pada ${updatedPage.name} berhasil disimpan!`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Download all confirmed crops as a ZIP archive
  const handleDownloadZip = async () => {
    if (pages.length === 0 || totalPanels === 0) return;

    try {
      await exportPagesToZip(pages, (prog) => {
        setZipProgress(prog);
        if (prog.isCompleted) {
          setTimeout(() => setZipProgress(null), 2500);
        }
      });
    } catch (err: any) {
      alert(`Gagal mengekspor ZIP: ${err.message}`);
      setZipProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 flex flex-col font-sans">
      {/* Header */}
      <Header
        totalPages={pages.length}
        totalPanels={totalPanels}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Upload Dropzone */}
        <UploadArea
          onFilesSelected={handleFilesSelected}
          isLoadingSample={isLoadingSample}
          onLoadSamples={handleLoadSamples}
        />

        {/* Global Status Banner */}
        {statusMessage && (
          <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <span>{statusMessage}</span>
            </div>
          </div>
        )}

        {/* Batch Processing Indicator */}
        {isProcessingBatch && (
          <div className="mb-8 p-5 bg-white border border-blue-200 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-2">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                Menganalisis Susunan Panel Manga ({batchProgress.current} dari {batchProgress.total})
              </span>
              <span className="text-blue-600">
                {Math.round((batchProgress.current / batchProgress.total) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{
                  width: `${(batchProgress.current / batchProgress.total) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* ZIP Export Progress Modal */}
        {zipProgress && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-100 text-center animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-4">
                <Download className="w-6 h-6 animate-bounce" />
              </div>
              <h3 className="font-bold text-base text-gray-900 mb-1">
                Membuat Berkas ZIP
              </h3>
              <p className="text-xs text-gray-500 mb-4">{zipProgress.message}</p>
              <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden mb-2">
                <div
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-200"
                  style={{ width: `${zipProgress.percent}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-600">
                {zipProgress.percent}%
              </span>
            </div>
          </div>
        )}

        {/* Action Bar & Summary (Shown when pages exist) */}
        {pages.length > 0 && (
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <span className="font-bold text-sm text-gray-900">
                  {pages.length} Halaman Siap
                </span>
              </div>
              <span className="text-gray-300">•</span>
              <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 font-semibold px-2.5 py-1 rounded-full">
                {totalPanels} Total Potongan Gambar
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
              {/* Batch Gemini AI Button */}
              <button
                onClick={handleBatchAnalyzeAi}
                disabled={isBatchAiRunning}
                className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                title="Analisis seluruh halaman menggunakan kecerdasan visual Gemini AI"
              >
                {isBatchAiRunning ? (
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                ) : (
                  <Sparkles className="w-4 h-4 text-purple-600" />
                )}
                <span>{isBatchAiRunning ? 'Memproses AI...' : 'Analisis Semua dengan AI'}</span>
              </button>

              <button
                onClick={handleClearAll}
                className="px-3.5 py-2 rounded-xl border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-600 text-xs font-semibold transition flex items-center gap-1.5"
                title="Hapus semua halaman"
              >
                <Trash2 className="w-4 h-4" />
                <span>Kosongkan Semua</span>
              </button>

              <button
                onClick={handleDownloadZip}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition flex items-center gap-2"
                title="Unduh seluruh potongan gambar dalam format ZIP"
              >
                <Download className="w-4 h-4" />
                <span>Unduh ZIP ({totalPanels} Gambar)</span>
              </button>
            </div>
          </div>
        )}

        {/* Manga Pages List */}
        {pages.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl shadow-xs border border-gray-100 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
              <Layers className="w-8 h-8 opacity-70" />
            </div>
            <h3 className="font-bold text-base text-gray-800 mb-1">
              Belum Ada Halaman Manga yang Diunggah
            </h3>
            <p className="text-xs text-gray-500 max-w-md mb-6 leading-relaxed">
              Tarik file halaman manga ke area upload di atas, atau klik tombol di bawah untuk memuat 4 sampel kasus deteksi panel secara instan.
            </p>
            <button
              onClick={handleLoadSamples}
              disabled={isLoadingSample}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Muat 4 Contoh Kasus Manga</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {pages.map((page, index) => (
              <PageCard
                key={page.id}
                page={page}
                index={index}
                isAiAnalyzing={analyzingAiPageId === page.id}
                onEdit={() => setEditingPage({ page, index })}
                onReprocess={() => handleReprocessPage(index)}
                onToggleIntact={() => handleToggleIntact(index)}
                onAnalyzeAi={() => handleAnalyzeAi(index)}
                onDelete={() => handleDeletePage(index)}
                onSelectPanel={(panel) =>
                  setSelectedPreviewPanel({ panel, pageName: page.name })
                }
              />
            ))}
          </div>
        )}
      </main>

      {/* Manual Correction Editor Modal */}
      {editingPage && (
        <ManualEditorModal
          page={editingPage.page}
          pageIndex={editingPage.index}
          isOpen={true}
          onClose={() => setEditingPage(null)}
          onSave={handleSaveManualEdit}
        />
      )}

      {/* High-res Panel Zoom Modal */}
      {selectedPreviewPanel && (
        <PanelPreviewModal
          panel={selectedPreviewPanel.panel}
          pageName={selectedPreviewPanel.pageName}
          onClose={() => setSelectedPreviewPanel(null)}
        />
      )}

      {/* Rule Guide Modal */}
      <RuleGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12 py-5 text-center text-xs text-gray-400">
        <p>Auto Cut Panel Manga • Computer Vision cerdas berbasis struktur panel asli manga</p>
      </footer>
    </div>
  );
}

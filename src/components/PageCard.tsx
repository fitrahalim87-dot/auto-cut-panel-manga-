import { useState } from 'react';
import {
  Scissors,
  Eye,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ZoomIn,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { MangaPage, PanelCrop } from '../types';

interface PageCardProps {
  page: MangaPage;
  index: number;
  isAiAnalyzing?: boolean;
  onEdit: () => void;
  onReprocess: () => void;
  onToggleIntact: () => void;
  onAnalyzeAi: () => void;
  onDelete: () => void;
  onSelectPanel: (panel: PanelCrop) => void;
}

export default function PageCard({
  page,
  index,
  isAiAnalyzing = false,
  onEdit,
  onReprocess,
  onToggleIntact,
  onAnalyzeAi,
  onDelete,
  onSelectPanel,
}: PageCardProps) {
  const getRuleBadge = () => {
    if (page.status === 'error') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
          Gagal Memproses
        </span>
      );
    }

    if (page.isKeptIntact) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
          Halaman Utuh (1 Gambar)
        </span>
      );
    }

    const rule = page.analysis?.detectedRule;
    if (rule === 1) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          {page.analysis?.ruleName || 'Tiga Panel Horizontal'}
        </span>
      );
    }
    if (rule === 2) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
          <Layers className="w-3.5 h-3.5 text-purple-600" />
          Dua Panel Horizontal
        </span>
      );
    }
    if (rule === 3) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <Layers className="w-3.5 h-3.5 text-emerald-600" />
          Panel Pendek Digabung
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
        <ShieldCheck className="w-3.5 h-3.5 text-gray-600" />
        {page.analysis?.ruleName || 'Halaman Utuh'}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition duration-200 overflow-hidden flex flex-col">
      {/* Card Header */}
      <div className="px-5 py-3.5 bg-gray-50/60 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
            {index + 1}
          </span>
          <span className="font-semibold text-sm text-gray-900 truncate" title={page.name}>
            {page.name}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {getRuleBadge()}
          <button
            onClick={onDelete}
            title="Hapus halaman ini"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Card Main Body */}
      <div className="p-5 flex-1 grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left: Source Page Preview with cut lines (4 cols) */}
        <div className="md:col-span-4 flex flex-col items-center">
          <div className="relative border border-gray-200 rounded-xl overflow-hidden bg-gray-100 shadow-sm group max-h-64 w-full flex items-center justify-center">
            <img
              src={page.originalUrl}
              alt={page.name}
              className="max-h-64 w-auto object-contain block mx-auto"
            />

            {/* Cut lines overlay indicators */}
            {!page.isKeptIntact &&
              page.cutLines.map((cut, cIdx) => (
                <div
                  key={cut.id || cIdx}
                  className="absolute left-0 right-0 h-0.5 bg-red-500/90 shadow-sm pointer-events-none"
                  style={{ top: `${(cut.yPixel / page.height) * 100}%` }}
                >
                  <span className="absolute right-1 -top-2 bg-red-600 text-[9px] text-white font-bold px-1 rounded-sm">
                    {cIdx + 1}
                  </span>
                </div>
              ))}

            {page.isKeptIntact && (
              <div className="absolute inset-0 bg-amber-500/10 border-2 border-dashed border-amber-400 pointer-events-none flex items-center justify-center">
                <span className="bg-amber-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded shadow">
                  Dibiarkan Utuh (1 Gambar)
                </span>
              </div>
            )}
          </div>

          <div className="mt-2.5 w-full flex items-center justify-between text-[11px] text-gray-500">
            <span>Resolusi: {page.width} × {page.height} px</span>
            {page.analysis && (
              <span className="font-medium text-blue-600">
                Keyakinan: {Math.round(page.analysis.confidenceScore * 100)}%
              </span>
            )}
          </div>
        </div>

        {/* Right: Detected Results & Cropped Panels (8 cols) */}
        <div className="md:col-span-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Hasil Potongan ({page.panels.length} Gambar)
                </h4>
              </div>

              {page.analysis?.requiresManualReview && (
                <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  Disarankan Periksa Manual
                </span>
              )}
            </div>

            {page.status === 'error' ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs mb-3">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  Gagal Memproses Halaman
                </p>
                <p className="text-red-600 mb-3">{page.errorMessage || 'Terjadi kesalahan saat memproses gambar.'}</p>
                <button
                  onClick={onReprocess}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Coba Proses Ulang
                </button>
              </div>
            ) : (
              <>
                {page.analysis?.notes && (
                  <p className="text-xs text-gray-600 mb-3 bg-gray-50 p-2.5 rounded-lg border border-gray-100 leading-relaxed">
                    {page.analysis.notes}
                  </p>
                )}

                {/* Cropped panels thumbnails grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {page.panels.map((panel, pIdx) => (
                    <div
                      key={panel.id || pIdx}
                      onClick={() => onSelectPanel(panel)}
                      className="group cursor-pointer border border-gray-200 hover:border-blue-400 rounded-xl p-2 bg-white hover:shadow transition flex flex-col"
                    >
                      <div className="relative bg-gray-50 rounded-lg overflow-hidden h-24 flex items-center justify-center border border-gray-100">
                        <img
                          src={panel.dataUrl}
                          alt={panel.description || `Panel ${pIdx + 1}`}
                          className="max-h-full max-w-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold gap-1">
                          <ZoomIn className="w-4 h-4" />
                          <span>Lihat</span>
                        </div>
                      </div>

                      <div className="mt-1.5 flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-gray-800">
                          Panel {String(pIdx + 1).padStart(2, '0')}
                        </span>
                        <span className="text-gray-400 text-[10px]">
                          {panel.box.height}px
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Action buttons footer */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-gray-400">
              {page.isKeptIntact
                ? 'Halaman akan diekspor sebagai 1 file utuh'
                : `Akan diekspor menjadi ${page.panels.length} file terpisah`}
            </span>

            <div className="flex flex-wrap items-center gap-2">
              {/* Quick Intact Toggle Button */}
              <button
                onClick={onToggleIntact}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
                  page.isKeptIntact
                    ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                    : 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                }`}
                title={page.isKeptIntact ? 'Aktifkan pemotongan panel' : 'Biarkan halaman ini utuh tanpa dipotong'}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{page.isKeptIntact ? 'Potong Panel' : 'Jadikan Utuh'}</span>
              </button>

              {/* Gemini AI Layout Analysis Button */}
              <button
                onClick={onAnalyzeAi}
                disabled={isAiAnalyzing}
                className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
                title="Gunakan kecerdasan visual Gemini AI untuk mendeteksi panel secara semantik"
              >
                {isAiAnalyzing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                )}
                <span>{isAiAnalyzing ? 'Menganalisis...' : 'Analisis Gemini AI'}</span>
              </button>

              {/* Reprocess Button */}
              <button
                onClick={onReprocess}
                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-medium transition flex items-center gap-1.5"
                title="Deteksi ulang dengan komputer vision lokal"
              >
                <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
                Deteksi Ulang
              </button>

              {/* Manual Correction Modal Button */}
              <button
                onClick={onEdit}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
                title="Buka editor untuk menambah, menggeser, atau menghapus garis potong"
              >
                <Scissors className="w-3.5 h-3.5" />
                Koreksi Manual
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

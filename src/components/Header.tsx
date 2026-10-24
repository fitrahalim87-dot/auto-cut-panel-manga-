import { Scissors, HelpCircle, BookOpen, Layers } from 'lucide-react';
import PWAInstallButton from './PWAInstallButton';

interface HeaderProps {
  totalPages: number;
  totalPanels: number;
  onOpenGuide: () => void;
}

export default function Header({ totalPages, totalPanels, onOpenGuide }: HeaderProps) {
  return (
    <header className="bg-white shadow-xs border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Scissors className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Auto Cut Panel Manga
              </h1>
              <span className="hidden sm:inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                Hybrid CV
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Deteksi batas panel horizontal otomatis, gabung panel pendek, & ekspor ZIP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {totalPages > 0 && (
            <div className="hidden md:flex items-center gap-3 text-xs font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
              <span>Halaman: <b className="text-blue-600">{totalPages}</b></span>
              <span className="text-gray-300">•</span>
              <span>Total Hasil: <b className="text-emerald-600">{totalPanels}</b></span>
            </div>
          )}

          <PWAInstallButton />

          <button
            onClick={onOpenGuide}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition flex items-center gap-1.5"
            title="Lihat diagram 4 aturan cara kerja pemotongan"
          >
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Panduan Aturan</span>
          </button>
        </div>
      </div>
    </header>
  );
}

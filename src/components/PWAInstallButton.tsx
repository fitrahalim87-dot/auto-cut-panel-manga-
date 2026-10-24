import { useState } from 'react';
import { Smartphone, Download, X, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export default function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showGeneralGuide, setShowGeneralGuide] = useState(false);

  // If already running as standalone PWA, hide button
  if (isInstalled) {
    return null;
  }

  // Android / Chromium / Desktop direct install
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition flex items-center gap-1.5 animate-pulse hover:animate-none"
        title="Instal Auto Cut Manga ke Layar Utama perangkat Anda"
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>Instal Aplikasi</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition flex items-center gap-1.5"
          title="Instal di iPhone atau iPad"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Instal di iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 text-gray-900 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm">Instal di iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-gray-600 mb-5">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <Share2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p>1. Ketuk tombol <b>Bagikan (Share)</b> di bilah bawah browser Safari.</p>
                </div>
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <PlusSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p>2. Gulir ke bawah lalu pilih <b>Tambah ke Layar Utama (Add to Home Screen)</b>.</p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback for browsers where beforeinstallprompt hasn't fired yet
  return (
    <>
      <button
        onClick={() => setShowGeneralGuide(true)}
        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition flex items-center gap-1.5"
        title="Petunjuk pemasangan aplikasi PWA"
      >
        <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
        <span className="hidden sm:inline">Pasang PWA</span>
      </button>

      {showGeneralGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 text-gray-900 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-sm">Pasang ke Layar Utama</h3>
              </div>
              <button
                onClick={() => setShowGeneralGuide(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              Aplikasi ini adalah <b>PWA (Progressive Web App)</b> yang dapat diinstal langsung tanpa melalui App Store / Play Store:
            </p>

            <ul className="text-xs text-gray-600 space-y-2 mb-5 list-disc pl-4">
              <li>Di Chrome/Edge: Klik ikon <b>Install</b> di bilah alamat atas atau menu titik tiga [⋮] &gt; <i>Instal Aplikasi</i>.</li>
              <li>Di HP Android: Buka menu Chrome &gt; <i>Tambahkan ke Layar Utama</i>.</li>
              <li>Di iPhone/iPad: Buka menu Safari &gt; <i>Add to Home Screen</i>.</li>
            </ul>

            <button
              onClick={() => setShowGeneralGuide(false)}
              className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}

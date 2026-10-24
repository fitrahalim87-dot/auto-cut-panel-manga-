import { X, CheckCircle2, Split, Layers, ShieldCheck, HelpCircle } from 'lucide-react';

interface RuleGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RuleGuideModal({ isOpen, onClose }: RuleGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              <span>Panduan & Aturan Pemotongan Panel Manga</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Sistem mendeteksi layout manga dan memotong sesuai 4 prinsip struktural berikut.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Reference Infographic Image */}
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-gray-50 flex flex-col items-center p-2">
            <img
              src="/public/assets/aistudio/file_00000000ef408207a63688b2a3b5da76_fb5cac0e.png"
              alt="Panduan Cara Kerja Auto Cut Panel Manga"
              className="max-h-[380px] w-auto object-contain rounded-lg shadow-sm"
              onError={(e) => {
                // Fallback if public path is slightly different
                (e.target as HTMLImageElement).src = '/assets/aistudio/file_00000000ef408207a63688b2a3b5da76_fb5cac0e.png';
              }}
            />
            <span className="text-[11px] text-gray-400 mt-2">
              Diagram resmi alur deteksi dan pemotongan panel manga
            </span>
          </div>

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h4 className="font-bold text-sm text-gray-900">Tiga Panel Horizontal</h4>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Jika ada 3 panel yang tersusun rapi secara vertikal dan dipisahkan batas gutter yang jelas melintasi halaman, sistem memotongnya menjadi <b>3 gambar terpisah</b>.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h4 className="font-bold text-sm text-gray-900">Dua Panel Horizontal</h4>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Jika ada 2 panel yang terpisah oleh satu pembatas horizontal jelas, sistem memotongnya menjadi <b>2 gambar terpisah</b>.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <h4 className="font-bold text-sm text-gray-900">Panel Pendek Digabung</h4>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Jika terdapat panel pendek yang tidak sampai lebar penuh (misalnya 2 panel berdampingan di baris tengah), sistem <b>menggabungkannya dalam 1 potongan strip horizontal</b> agar konteks cerita tidak terpecah ganjil.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-rose-600 text-white font-bold text-xs flex items-center justify-center">
                  4
                </span>
                <h4 className="font-bold text-sm text-gray-900">Tidak Ada Pola Jelas</h4>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Jika susunan panel rumit, garis miring/diagonal, atau panel saling menyambung tanpa pembatas meyakinkan, <b>halaman dibiarkan utuh (1 gambar)</b> dan ditandai untuk pemeriksaan manual.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

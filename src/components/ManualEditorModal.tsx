import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Plus, RotateCcw, Check, Eye, Trash2, ShieldAlert, Sparkles } from 'lucide-react';
import { CutLine, MangaPage, PanelCrop } from '../types';
import { generatePanelCrops } from '../lib/cropUtils';
import { loadImage } from '../lib/cvDetector';

interface ManualEditorModalProps {
  page: MangaPage;
  pageIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPage: MangaPage) => void;
}

export default function ManualEditorModal({
  page,
  pageIndex,
  isOpen,
  onClose,
  onSave,
}: ManualEditorModalProps) {
  const [cuts, setCuts] = useState<CutLine[]>([]);
  const [isKeptIntact, setIsKeptIntact] = useState<boolean>(false);
  const [draggingCutId, setDraggingCutId] = useState<string | null>(null);
  const [previewPanels, setPreviewPanels] = useState<PanelCrop[]>(page.panels || []);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Initialize cuts from page
  useEffect(() => {
    if (isOpen) {
      setCuts([...page.cutLines]);
      setIsKeptIntact(page.isKeptIntact);
      setPreviewPanels(page.panels || []);

      loadImage(page.originalUrl)
        .then((img) => setImgElement(img))
        .catch((err) => console.error(err));
    }
  }, [isOpen, page]);

  // Update live preview panels whenever cuts or intact state changes
  useEffect(() => {
    if (!imgElement) return;

    let isMounted = true;
    generatePanelCrops(imgElement, cuts, pageIndex, isKeptIntact).then((panels) => {
      if (isMounted) {
        setPreviewPanels(panels);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [cuts, isKeptIntact, imgElement, pageIndex]);

  // Convert client Y coordinate to native image pixel Y coordinate
  const clientYToImagePixel = useCallback(
    (clientY: number): number | null => {
      if (!imageRef.current) return null;
      const rect = imageRef.current.getBoundingClientRect();
      const relativeY = clientY - rect.top;
      const ratio = relativeY / rect.height;
      const clampedRatio = Math.max(0.02, Math.min(0.98, ratio));
      const naturalH = imageRef.current.naturalHeight || page.height;
      return Math.round(clampedRatio * naturalH);
    },
    [page.height]
  );

  // Add cut line on click
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only add if not dragging and not clicking on existing line
    if (draggingCutId) return;
    if ((e.target as HTMLElement).closest('.cut-line-handle')) return;

    const yPixel = clientYToImagePixel(e.clientY);
    if (yPixel === null) return;

    const naturalH = imgElement?.naturalHeight || page.height;
    const newCut: CutLine = {
      id: `manual-cut-${Date.now()}`,
      yRatio: yPixel / naturalH,
      yPixel,
      isUserAdded: true,
    };

    setCuts((prev) => [...prev, newCut].sort((a, b) => a.yPixel - b.yPixel));
    setIsKeptIntact(false);
  };

  // Handle cut line dragging
  const handleMouseDown = (cutId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingCutId(cutId);
  };

  const handleTouchStart = (cutId: string, e: React.TouchEvent) => {
    e.stopPropagation();
    setDraggingCutId(cutId);
  };

  const handlePointerMove = useCallback(
    (clientY: number) => {
      if (!draggingCutId || !imageRef.current) return;
      const yPixel = clientYToImagePixel(clientY);
      if (yPixel === null) return;

      const naturalH = imageRef.current.naturalHeight || page.height;

      setCuts((prev) =>
        prev.map((c) =>
          c.id === draggingCutId
            ? { ...c, yPixel, yRatio: yPixel / naturalH }
            : c
        )
      );
    },
    [draggingCutId, clientYToImagePixel, page.height]
  );

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (draggingCutId) {
        handlePointerMove(e.clientY);
      }
    };

    const onMouseUp = () => {
      if (draggingCutId) {
        setDraggingCutId(null);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (draggingCutId && e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientY);
      }
    };

    const onTouchEnd = () => {
      if (draggingCutId) {
        setDraggingCutId(null);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [draggingCutId, handlePointerMove]);

  const handleDeleteCut = (cutId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCuts((prev) => prev.filter((c) => c.id !== cutId));
  };

  const handleReset = () => {
    setCuts([...page.cutLines]);
    setIsKeptIntact(page.isKeptIntact);
  };

  const handleSave = () => {
    const updatedPage: MangaPage = {
      ...page,
      cutLines: cuts,
      isKeptIntact,
      panels: previewPanels,
      status: 'done',
    };
    onSave(updatedPage);
    onClose();
  };

  if (!isOpen) return null;

  const naturalH = imgElement?.naturalHeight || page.height;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>Koreksi Manual Garis Potong</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                {page.name}
              </span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Klik pada gambar untuk menambah garis baru, geser garis untuk memindahkan, atau hapus garis yang salah.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-blue-50/50 border-b border-blue-100/60 text-xs text-gray-700">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsKeptIntact(!isKeptIntact)}
              className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5 ${
                isKeptIntact
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              {isKeptIntact ? 'Halaman Dibiarkan Utuh (Aktif)' : 'Jadikan Halaman Utuh'}
            </button>

            <button
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
              Reset ke Deteksi Awal
            </button>
          </div>

          <div className="flex items-center gap-3 font-medium text-gray-600">
            <span>Jumlah Garis: <b className="text-blue-600">{isKeptIntact ? 0 : cuts.length}</b></span>
            <span>Hasil Potongan: <b className="text-emerald-600">{isKeptIntact ? 1 : Math.max(1, previewPanels.length || cuts.length + 1)}</b></span>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6 bg-gray-50">
          {/* Main Visual Editor (Left: 7 cols) */}
          <div className="md:col-span-7 flex flex-col items-center">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 self-start flex items-center gap-1.5">
              <span>Editor Interaktif Garis Potong</span>
              <span className="text-[10px] lowercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                (Klik gambar untuk tambah)
              </span>
            </div>

            <div
              ref={containerRef}
              onClick={handleImageClick}
              className="relative border-2 border-gray-300 rounded-xl overflow-hidden shadow-sm bg-white cursor-crosshair max-w-full select-none"
              style={{ maxHeight: '60vh' }}
            >
              <img
                ref={imageRef}
                src={page.originalUrl}
                alt={page.name}
                className="max-h-[60vh] w-auto object-contain block mx-auto pointer-events-none"
              />

              {/* Render cut lines overlay */}
              {!isKeptIntact &&
                cuts.map((cut, index) => {
                  const percent = (cut.yPixel / naturalH) * 100;
                  return (
                    <div
                      key={cut.id}
                      className="cut-line-handle absolute left-0 right-0 z-20 group"
                      style={{ top: `${percent}%` }}
                    >
                      {/* Interactive hit area */}
                      <div
                        onMouseDown={(e) => handleMouseDown(cut.id, e)}
                        onTouchStart={(e) => handleTouchStart(cut.id, e)}
                        className="h-6 -translate-y-3 cursor-row-resize flex items-center justify-between px-2"
                      >
                        {/* Cut line visual */}
                        <div className="w-full h-1 bg-red-500 shadow-md group-hover:h-1.5 group-hover:bg-red-600 transition-all flex items-center justify-center">
                          <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm pointer-events-none">
                            Potongan {index + 1}
                          </span>
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={(e) => handleDeleteCut(cut.id, e)}
                          title="Hapus garis pemisah ini"
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

              {isKeptIntact && (
                <div className="absolute inset-0 bg-amber-500/10 border-4 border-dashed border-amber-400 pointer-events-none flex items-center justify-center">
                  <span className="bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow">
                    Halaman Dibiarkan Utuh (Tidak Dipotong)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Live Preview Panel (Right: 5 cols) */}
          <div className="md:col-span-5 flex flex-col">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Preview Hasil Potongan ({previewPanels.length})</span>
              <span className="text-[11px] text-gray-400">Urutan Atas ke Bawah</span>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-3 flex-1 overflow-y-auto max-h-[60vh] space-y-3 shadow-inner">
              {previewPanels.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs">
                  Tidak ada potongan
                </div>
              ) : (
                previewPanels.map((panel, idx) => (
                  <div
                    key={panel.id || idx}
                    className="border border-gray-100 rounded-lg overflow-hidden bg-gray-50 p-2 hover:border-blue-300 transition"
                  >
                    <div className="flex items-center justify-between mb-1 text-[11px] font-medium text-gray-700">
                      <span className="flex items-center gap-1">
                        <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                          {idx + 1}
                        </span>
                        {panel.description || `Panel ${idx + 1}`}
                      </span>
                      <span className="text-gray-400 text-[10px]">
                        {panel.box.width} × {panel.box.height} px
                      </span>
                    </div>

                    <div className="bg-white rounded border border-gray-200 p-1 flex items-center justify-center">
                      <img
                        src={panel.dataUrl}
                        alt={`Panel ${idx + 1}`}
                        className="max-h-28 w-auto object-contain rounded"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Terapkan & Simpan Hasil
          </button>
        </div>
      </div>
    </div>
  );
}

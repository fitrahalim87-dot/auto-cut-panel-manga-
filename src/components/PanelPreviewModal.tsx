import { X, Download } from 'lucide-react';
import { PanelCrop } from '../types';
import { saveAs } from 'file-saver';

interface PanelPreviewModalProps {
  panel: PanelCrop | null;
  pageName: string;
  onClose: () => void;
}

export default function PanelPreviewModal({
  panel,
  pageName,
  onClose,
}: PanelPreviewModalProps) {
  if (!panel) return null;

  const handleDownloadSingle = () => {
    const baseName = pageName.replace(/\.[^/.]+$/, '');
    const fileName = `${baseName}_panel${String(panel.panelIndex).padStart(2, '0')}.jpg`;
    if (panel.blob) {
      saveAs(panel.blob, fileName);
    } else if (panel.dataUrl) {
      const a = document.createElement('a');
      a.href = panel.dataUrl;
      a.download = fileName;
      a.click();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span>{panel.description || `Panel ${panel.panelIndex}`}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                {panel.box.width} × {panel.box.height} px
              </span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Sumber: {pageName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSingle}
              className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition flex items-center gap-1.5 text-xs font-semibold"
              title="Unduh panel ini saja"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Panel</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 bg-gray-900/90 flex items-center justify-center min-h-[300px]">
          <img
            src={panel.dataUrl}
            alt={panel.description || 'Panel Preview'}
            className="max-h-[70vh] max-w-full object-contain rounded shadow-lg border border-gray-700"
          />
        </div>

        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Potongan resolusi asli tanpa distorsi atau resampling</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

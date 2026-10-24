import { useState, useRef } from 'react';
import { Upload, Sparkles, FolderUp, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';
import { generateAllSampleCases } from '../lib/samplePages';

interface UploadAreaProps {
  onFilesSelected: (files: File[]) => void;
  isLoadingSample: boolean;
  onLoadSamples: () => void;
}

export default function UploadArea({
  onFilesSelected,
  isLoadingSample,
  onLoadSamples,
}: UploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fileList = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/')
      );
      if (fileList.length > 0) {
        onFilesSelected(fileList);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileList = Array.from(e.target.files).filter((file) =>
        file.type.startsWith('image/')
      );
      if (fileList.length > 0) {
        onFilesSelected(fileList);
      }
      e.target.value = ''; // Reset input to allow selecting same files again if needed
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 transition">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>Unggah Halaman Manga</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">
              Multi-Image & Drag & Drop
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            File akan otomatis diurutkan berdasarkan nama file secara natural (1, 2, 10).
          </p>
        </div>

        <button
          onClick={onLoadSamples}
          disabled={isLoadingSample}
          className="px-3.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          title="Muat 4 contoh halaman sesuai aturan (3 Panel, 2 Panel, Panel Pendek Digabung, Halaman Utuh)"
        >
          {isLoadingSample ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          )}
          <span>{isLoadingSample ? 'Memuat Sampel...' : 'Coba 4 Contoh Kasus Manga'}</span>
        </button>
      </div>

      {/* Drag & Drop Dropzone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center w-full min-h-[160px] p-6 border-2 border-dashed rounded-2xl cursor-pointer transition duration-200 ${
          isDragOver
            ? 'border-blue-500 bg-blue-100/60 scale-[1.01]'
            : 'border-blue-200 bg-blue-50/40 hover:bg-blue-50/90 hover:border-blue-300'
        }`}
      >
        <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-blue-100 flex items-center justify-center mb-3">
          <Upload className={`w-6 h-6 transition ${isDragOver ? 'text-blue-600 animate-bounce' : 'text-blue-500'}`} />
        </div>

        <div className="text-center">
          <p className="text-sm font-semibold text-gray-800">
            {isDragOver
              ? 'Lepaskan file gambar di sini!'
              : 'Tarik & lepas banyak halaman manga ke sini, atau klik untuk memilih file'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Mendukung file PNG, JPG, JPEG, WEBP • Batch multi-file • Otomatis diurutkan rapi
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}

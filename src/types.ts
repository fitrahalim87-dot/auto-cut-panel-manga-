export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PanelCrop {
  id: string;
  pageIndex: number;
  panelIndex: number;
  box: BoundingBox;
  dataUrl?: string;
  blob?: Blob;
  type: 'full_panel' | 'grouped_panel' | 'full_page';
  description?: string;
}

export interface CutLine {
  id: string;
  yRatio: number; // 0 to 1 relative to image height
  yPixel: number; // absolute pixel in original image
  isUserAdded?: boolean;
}

export type PageStatus = 'idle' | 'processing' | 'done' | 'manual_review' | 'error';

export interface AnalysisResult {
  detectedRule: 1 | 2 | 3 | 4; // 1: 3 horizontal, 2: 2 horizontal, 3: panel pendek digabung, 4: pola tidak jelas (utuh)
  ruleName: string;
  confidenceScore: number; // 0 to 1
  candidateCuts: number[]; // y pixel positions
  requiresManualReview: boolean;
  notes: string;
}

export interface MangaPage {
  id: string;
  file: File;
  name: string;
  originalUrl: string;
  width: number;
  height: number;
  status: PageStatus;
  progress: number;
  analysis?: AnalysisResult;
  cutLines: CutLine[];
  panels: PanelCrop[];
  isKeptIntact: boolean;
  errorMessage?: string;
}

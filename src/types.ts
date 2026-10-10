export interface Screenshot {
  id: string;
  url: string;
  blob: Blob;
  filename: string;
  timestamp: number;
  frame: number;
}

export type ExtractionStatus = 
  | 'idle' 
  | 'analyzing' 
  | 'extracting' 
  | 'packaging' 
  | 'completed' 
  | 'cancelled' 
  | 'error';

export interface ExtractionProgress {
  current: number;
  total: number;
  percentage: number;
  fps: number;
  savedCount: number;
  statusText: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

export interface ErrorModalState {
  isOpen: boolean;
  type: 'no_video' | 'invalid_timing' | 'invalid_format' | 'general';
  title: string;
  message: string;
  image: string;
}

export type ImageFormat = 'image/jpeg' | 'image/png' | 'image/webp';

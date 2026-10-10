import React, { useEffect } from 'react';
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Screenshot } from '../types';
import { formatTime } from '../utils/formatters';

interface LightboxProps {
  screenshots: Screenshot[];
  currentIndex: number | null;
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
}

export const Lightbox: React.FC<LightboxProps> = ({
  screenshots,
  currentIndex,
  onClose,
  onNavigate,
}) => {
  useEffect(() => {
    if (currentIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') {
        onNavigate((currentIndex + 1) % screenshots.length);
      }
      if (e.key === 'ArrowLeft') {
        onNavigate((currentIndex - 1 + screenshots.length) % screenshots.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [currentIndex, screenshots.length, onClose, onNavigate]);

  if (currentIndex === null || !screenshots[currentIndex]) return null;

  const currentShot = screenshots[currentIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        onClick={onClose} 
      />

      {/* Dialog */}
      <div className="relative z-10 max-w-5xl w-full max-h-[92vh] flex flex-col bg-[#121826]/95 border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Topbar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-black/40 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-semibold text-slate-200">
              {currentShot.filename}
            </span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-cyan-300">
              {formatTime(currentShot.timestamp)} (Frame #{currentShot.frame})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={currentShot.url}
              download={currentShot.filename}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-indigo-600 text-slate-200 hover:text-white flex items-center justify-center transition-colors"
              title="Download image"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-rose-600 text-slate-200 hover:text-white flex items-center justify-center transition-colors"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Image Viewer Stage */}
        <div className="relative flex-1 flex items-center justify-center p-4 sm:p-6 overflow-hidden min-h-[300px]">
          <img
            src={currentShot.url}
            alt={currentShot.filename}
            className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
          />

          {/* Navigation Buttons */}
          {screenshots.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => onNavigate((currentIndex - 1 + screenshots.length) % screenshots.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-indigo-600 border border-white/10 text-white flex items-center justify-center transition-all hover:scale-110 shadow-xl"
                title="Previous (←)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate((currentIndex + 1) % screenshots.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-indigo-600 border border-white/10 text-white flex items-center justify-center transition-all hover:scale-110 shadow-xl"
                title="Next (→)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Download, RefreshCw, ZoomIn, Film } from 'lucide-react';
import { Screenshot } from '../types';
import { formatTime } from '../utils/formatters';

interface GalleryProps {
  screenshots: Screenshot[];
  isDownloadingZip: boolean;
  zipProgress: number;
  onDownloadZip: () => void;
  onReset: () => void;
  onSelectScreenshot: (index: number) => void;
}

export const Gallery: React.FC<GalleryProps> = ({
  screenshots,
  isDownloadingZip,
  zipProgress,
  onDownloadZip,
  onReset,
  onSelectScreenshot,
}) => {
  if (!screenshots || screenshots.length === 0) return null;

  return (
    <section className="glass-panel rounded-2xl p-6 md:p-8 flex flex-col gap-6 animate-fadeIn">
      {/* Gallery Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-100 tracking-tight">
              Captured Screenshots
            </h2>
            <span className="text-xs font-mono font-semibold text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20 inline-block mt-0.5">
              {screenshots.length} Images Extracted
            </span>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onDownloadZip}
            disabled={isDownloadingZip}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-[0_4px_15px_rgba(16,185,129,0.35)] hover:shadow-[0_8px_25px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>
              {isDownloadingZip 
                ? `Packaging ZIP (${zipProgress}%)...` 
                : 'Download All as ZIP'}
            </span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold text-sm text-slate-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 transition-all hover:-translate-y-0.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Extract Another</span>
          </button>
        </div>
      </div>

      {/* Screenshots Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
        {screenshots.map((shot, index) => (
          <div
            key={shot.id}
            onClick={() => onSelectScreenshot(index)}
            className="group relative bg-black/40 border border-white/10 hover:border-indigo-500/60 rounded-xl overflow-hidden shadow-lg cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/20 flex flex-col"
          >
            <div className="relative aspect-video w-full bg-black/60 overflow-hidden">
              <img
                src={shot.url}
                alt={shot.filename}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity duration-200">
                <div className="w-8 h-8 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                  <ZoomIn className="w-4 h-4" />
                </div>
                <a
                  href={shot.url}
                  download={shot.filename}
                  onClick={(e) => e.stopPropagation()}
                  className="w-8 h-8 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                  title="Download Image"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>

              {/* Timestamp Badge */}
              <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-black/75 text-cyan-300 backdrop-blur-sm border border-white/10">
                {formatTime(shot.timestamp)}
              </span>
            </div>

            <div className="p-2 flex items-center justify-between text-xs text-slate-400 bg-white/[0.02]">
              <span className="font-mono truncate">{shot.filename}</span>
              <span className="font-mono text-[10px] text-slate-500">#{shot.frame}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

import React from 'react';
import { Loader2, XCircle } from 'lucide-react';
import { ExtractionProgress } from '../types';

interface ProgressHUDProps {
  progress: ExtractionProgress;
  onCancel: () => void;
}

export const ProgressHUD: React.FC<ProgressHUDProps> = ({ progress, onCancel }) => {
  return (
    <div className="glass-panel rounded-2xl p-6 md:p-8 flex flex-col gap-6 border-indigo-500/30 animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
          <span className="font-bold text-lg text-slate-100">
            {progress.statusText || 'Extracting frames in browser...'}
          </span>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500 hover:text-white transition-all"
        >
          <XCircle className="w-4 h-4" />
          Cancel Extraction
        </button>
      </div>

      {/* Progress Track */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Processing video buffer</span>
          <span className="font-mono font-bold text-cyan-400 text-base">
            {progress.percentage}%
          </span>
        </div>

        <div className="w-full h-4 bg-white/5 border border-white/10 rounded-full overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-200 relative"
            style={{ width: `${Math.min(100, progress.percentage)}%` }}
          >
            {/* Laser effect */}
            <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/70 filter blur-[2px] animate-laser" />
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 flex flex-col gap-1">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Extracted
          </span>
          <span className="text-2xl font-bold font-mono text-slate-100">
            {progress.savedCount}
          </span>
        </div>

        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 flex flex-col gap-1">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Current Frame
          </span>
          <span className="text-2xl font-bold font-mono text-slate-100">
            {progress.current}
          </span>
        </div>

        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 flex flex-col gap-1">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Total Target
          </span>
          <span className="text-2xl font-bold font-mono text-slate-100">
            {progress.total}
          </span>
        </div>

        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 flex flex-col gap-1">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
            Engine FPS
          </span>
          <span className="text-2xl font-bold font-mono text-cyan-400">
            ~{progress.fps}
          </span>
        </div>
      </div>
    </div>
  );
};

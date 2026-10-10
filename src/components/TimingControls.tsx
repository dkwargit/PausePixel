import React from 'react';
import { Sparkles, Play, Clock, Sliders } from 'lucide-react';
import { ImageFormat } from '../types';

interface TimingControlsProps {
  startTime: string;
  endTime: string;
  interval: string;
  videoDuration: number;
  format: ImageFormat;
  onStartTimeChange: (val: string) => void;
  onEndTimeChange: (val: string) => void;
  onIntervalChange: (val: string) => void;
  onFormatChange: (val: ImageFormat) => void;
  onSubmit: (e: React.FormEvent) => void;
  isProcessing: boolean;
}

export const TimingControls: React.FC<TimingControlsProps> = ({
  startTime,
  endTime,
  interval,
  videoDuration,
  format,
  onStartTimeChange,
  onEndTimeChange,
  onIntervalChange,
  onFormatChange,
  onSubmit,
  isProcessing,
}) => {
  const presets = ['0.5', '1.0', '2.0', '5.0', '10.0'];

  // Calculate estimated frames
  const startNum = parseFloat(startTime) || 0;
  let endNum = parseFloat(endTime);
  if (isNaN(endNum) || endNum <= 0) {
    endNum = videoDuration > 0 ? videoDuration : 0;
  }
  const intervalNum = parseFloat(interval) || 1.0;
  const estimatedYield =
    endNum > startNum && intervalNum > 0
      ? Math.floor((endNum - startNum) / intervalNum) + 1
      : 0;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Time */}
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 flex flex-col gap-2">
          <label htmlFor="start_time" className="flex items-center justify-between text-sm font-bold text-slate-200">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" />
              Start Time (seconds)
            </span>
            <span className="text-xs font-normal text-slate-400">Default: 0.0s</span>
          </label>
          <div className="relative flex items-center">
            <input
              type="number"
              id="start_time"
              step="0.1"
              min="0"
              placeholder="0.0"
              value={startTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
              className="w-full bg-[#0b101c]/90 border border-white/10 rounded-lg px-4 py-2.5 font-mono text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            <span className="absolute right-3.5 text-xs font-semibold text-slate-500 pointer-events-none">sec</span>
          </div>
        </div>

        {/* End Time */}
        <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 flex flex-col gap-2">
          <label htmlFor="end_time" className="flex items-center justify-between text-sm font-bold text-slate-200">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              End Time (seconds)
            </span>
            <span className="text-xs font-normal text-slate-400">
              {videoDuration > 0 ? `Max: ${videoDuration.toFixed(1)}s` : 'Full video'}
            </span>
          </label>
          <div className="relative flex items-center">
            <input
              type="number"
              id="end_time"
              step="0.1"
              min="0"
              placeholder={videoDuration > 0 ? videoDuration.toFixed(1) : 'Full video'}
              value={endTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
              className="w-full bg-[#0b101c]/90 border border-white/10 rounded-lg px-4 py-2.5 font-mono text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            <span className="absolute right-3.5 text-xs font-semibold text-slate-500 pointer-events-none">sec</span>
          </div>
        </div>

        {/* Capture Interval */}
        <div className="md:col-span-2 bg-white/[0.02] border border-white/10 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label htmlFor="interval_input" className="flex items-center gap-1.5 text-sm font-bold text-slate-200">
              <Sliders className="w-4 h-4 text-pink-400" />
              Capture Interval (seconds)
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-400 mr-1">Presets:</span>
              {presets.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => onIntervalChange(p)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                    interval === p
                      ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.5)]'
                      : 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.12]'
                  }`}
                >
                  {p}s
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <input
                type="number"
                id="interval_input"
                step="any"
                min="0.05"
                placeholder="1.0"
                value={interval}
                onChange={(e) => onIntervalChange(e.target.value)}
                className="w-full bg-[#0b101c]/90 border border-white/10 rounded-lg px-4 py-2.5 font-mono text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              <span className="absolute right-3.5 top-3 text-xs font-semibold text-slate-500 pointer-events-none">sec</span>
            </div>

            {/* Format Selector */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-400 font-medium">Format:</span>
              <div className="flex bg-[#0b101c] p-1 rounded-lg border border-white/10">
                {(['image/jpeg', 'image/png', 'image/webp'] as ImageFormat[]).map((fmt) => {
                  const label = fmt === 'image/jpeg' ? 'JPG' : fmt === 'image/png' ? 'PNG' : 'WEBP';
                  return (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => onFormatChange(fmt)}
                      className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                        format === fmt
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estimate Banner */}
      <div className="flex items-center gap-3 px-4 py-3 bg-cyan-500/[0.08] border border-cyan-500/20 rounded-xl text-cyan-200 text-sm">
        <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
        <div>
          Estimated yield: <strong className="font-mono text-white text-base">~{estimatedYield} screenshots</strong>
          <span className="text-xs text-cyan-300/80 ml-2">
            ({((estimatedYield * 0.15)).toFixed(1)} MB estimated ZIP size)
          </span>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center pt-2">
        <button
          type="submit"
          disabled={isProcessing}
          className="relative group w-full max-w-md py-4 px-8 rounded-full font-bold text-base md:text-lg text-white bg-gradient-to-r from-indigo-500 via-indigo-600 to-cyan-500 shadow-[0_10px_30px_rgba(99,102,241,0.4)] hover:shadow-[0_15px_40px_rgba(99,102,241,0.6)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
          <Play className="w-5 h-5 fill-current" />
          <span>Start Screenshot Extraction</span>
        </button>
      </div>
    </form>
  );
};

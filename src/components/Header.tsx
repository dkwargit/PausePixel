import React from 'react';
import { Cpu, ShieldCheck, Download, Zap } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="flex flex-col items-center text-center gap-6 py-4">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-20 h-20 rounded-2xl p-1 bg-gradient-to-br from-indigo-500/80 to-cyan-500/80 shadow-[0_8px_30px_rgba(99,102,241,0.4)]">
          <img
            src="/assets/GE7fM-TX0AAxE4h.jpeg"
            alt="PausePixel Icon"
            className="w-full h-full rounded-xl object-cover"
          />
          <div className="absolute -inset-1.5 rounded-3xl border-2 border-indigo-500/40 animate-ping opacity-25 pointer-events-none" />
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gradient">
              PausePixel
            </h1>
          </div>
          <p className="text-slate-400 text-base md:text-lg max-w-xl font-normal">
            Frame-accurate screenshot extraction from video at custom intervals & ranges
          </p>
        </div>
      </div>

      {/* Feature Pill Badges */}
      <div className="flex flex-wrap justify-center gap-2.5">
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/[0.04] border border-white/[0.08] text-slate-300">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          In-Browser GPU Engine
        </span>
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/[0.04] border border-white/[0.08] text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          100% Private (No Upload)
        </span>
        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/[0.04] border border-white/[0.08] text-slate-300">
          <Download className="w-3.5 h-3.5 text-indigo-400" />
          Instant ZIP Batch Export
        </span>
      </div>
    </header>
  );
};

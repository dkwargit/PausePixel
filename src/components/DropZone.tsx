import React, { useRef, useState } from 'react';
import { UploadCloud, Film, X } from 'lucide-react';
import { formatBytes } from '../utils/formatters';

interface DropZoneProps {
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
  onFileClear: () => void;
}

export const DropZone: React.FC<DropZoneProps> = ({
  selectedFile,
  onFileSelect,
  onFileClear,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave' || e.type === 'drop') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      onClick={() => {
        if (!selectedFile) fileInputRef.current?.click();
      }}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all duration-300 cursor-pointer ${
        isDragActive
          ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_25px_rgba(6,182,212,0.25)] scale-[1.01]'
          : 'border-white/15 bg-white/[0.02] hover:border-indigo-500 hover:bg-indigo-500/[0.03] hover:-translate-y-0.5'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/x-m4v,video/*,.mkv,.mov,.avi,.webm"
        className="hidden"
        onChange={handleFileInput}
      />

      {!selectedFile ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 transition-transform duration-300 group-hover:scale-110">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-100">
            Drag & drop your video here
          </h3>
          <p className="text-slate-400 text-sm">
            or <span className="text-indigo-400 underline underline-offset-4 font-semibold">browse from your computer</span>
          </p>
          <span className="text-xs text-slate-500 uppercase tracking-widest font-mono mt-1">
            Supports MP4, MKV, MOV, WEBM, AVI (Any Size)
          </span>
        </div>
      ) : (
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="flex items-center gap-4 p-4 max-w-lg mx-auto bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-left"
        >
          <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Film className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-slate-100 truncate text-sm md:text-base">
              {selectedFile.name}
            </div>
            <div className="text-xs text-indigo-300 font-mono mt-0.5">
              {formatBytes(selectedFile.size)}
            </div>
          </div>
          <button
            type="button"
            onClick={onFileClear}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-rose-500 text-slate-200 hover:text-white flex items-center justify-center transition-colors shrink-0"
            title="Remove video"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

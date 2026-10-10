import React, { useRef, useState, useEffect } from 'react';
import { Camera, MapPin, Flag } from 'lucide-react';
import { formatTime } from '../utils/formatters';

interface VideoScrubberProps {
  videoFile: File | null;
  onDurationLoaded: (duration: number) => void;
  onSetStart: (time: number) => void;
  onSetEnd: (time: number) => void;
  onInstantSnap?: (canvas: HTMLCanvasElement, timestamp: number) => void;
}

export const VideoScrubber: React.FC<VideoScrubberProps> = ({
  videoFile,
  onDurationLoaded,
  onSetStart,
  onSetEnd,
  onInstantSnap,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setVideoUrl(null);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [videoFile]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration || 0;
      setDuration(dur);
      onDurationLoaded(dur);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleInstantCapture = () => {
    if (videoRef.current && onInstantSnap) {
      const vid = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = vid.videoWidth || 1920;
      canvas.height = vid.videoHeight || 1080;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
        onInstantSnap(canvas, vid.currentTime);
      }
    }
  };

  if (!videoUrl) return null;

  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-4 md:p-6 flex flex-col gap-4 animate-fadeIn">
      <div className="relative w-full max-h-[380px] bg-black rounded-xl overflow-hidden flex items-center justify-center shadow-2xl">
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          playsInline
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          className="w-full max-h-[380px] object-contain rounded-xl"
        />
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1 px-1">
        <div className="flex items-center gap-6 text-sm text-slate-400">
          <div>
            Playhead: <strong className="text-slate-100 font-mono">{formatTime(currentTime)}</strong> ({currentTime.toFixed(1)}s)
          </div>
          <div>
            Duration: <strong className="text-slate-100 font-mono">{formatTime(duration)}</strong> ({duration.toFixed(1)}s)
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onSetStart(Number(currentTime.toFixed(1)))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-indigo-600/30 hover:border-indigo-500 text-slate-200 border border-white/10 transition-all hover:-translate-y-0.5"
          >
            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
            Set Start ({currentTime.toFixed(1)}s)
          </button>

          <button
            type="button"
            onClick={() => onSetEnd(Number(currentTime.toFixed(1)))}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-cyan-600/30 hover:border-cyan-500 text-slate-200 border border-white/10 transition-all hover:-translate-y-0.5"
          >
            <Flag className="w-3.5 h-3.5 text-cyan-400" />
            Set End ({currentTime.toFixed(1)}s)
          </button>

          {onInstantSnap && (
            <button
              type="button"
              onClick={handleInstantCapture}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-pink-600/30 hover:border-pink-500 text-slate-200 border border-white/10 transition-all hover:-translate-y-0.5"
              title="Snap current frame immediately"
            >
              <Camera className="w-3.5 h-3.5 text-pink-400" />
              Snap Frame
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

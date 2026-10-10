import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { VideoScrubber } from './components/VideoScrubber';
import { TimingControls } from './components/TimingControls';
import { ProgressHUD } from './components/ProgressHUD';
import { Gallery } from './components/Gallery';
import { Lightbox } from './components/Lightbox';
import { ErrorModal } from './components/ErrorModal';
import { ToastContainer } from './components/Toast';
import { 
  Screenshot, 
  ExtractionProgress, 
  ImageFormat, 
  ToastMessage, 
  ErrorModalState 
} from './types';
import { extractScreenshotsFromVideo } from './utils/videoExtractor';
import { createAndDownloadZip } from './utils/zipArchiver';

export const App: React.FC = () => {
  // Video & Timing State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [interval, setInterval] = useState<string>('1.0');
  const [format, setFormat] = useState<ImageFormat>('image/jpeg');

  // Extraction State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<ExtractionProgress>({
    current: 0,
    total: 0,
    percentage: 0,
    fps: 30,
    savedCount: 0,
    statusText: '',
  });
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ZIP Download State
  const [isDownloadingZip, setIsDownloadingZip] = useState<boolean>(false);
  const [zipProgress, setZipProgress] = useState<number>(0);

  // Modals & UI Feedback
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [errorModal, setErrorModal] = useState<ErrorModalState>({
    isOpen: false,
    type: 'no_video',
    title: '',
    message: '',
    image: '/assets/mb_mock.png',
  });

  // Toast Helper
  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Error Modal Helper
  const triggerError = (
    type: 'no_video' | 'invalid_timing' | 'invalid_format' | 'general',
    title: string,
    message: string,
    image?: string
  ) => {
    const defaultImage =
      type === 'invalid_timing'
        ? '/assets/Microsoft-Fluentui-Emoji-Flat-Unamused-Face-Flat.512.png'
        : '/assets/mb_mock.png';

    setErrorModal({
      isOpen: true,
      type,
      title,
      message,
      image: image || defaultImage,
    });
  };

  // File Handlers
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setStartTime('0.0');
    setEndTime('');
    setScreenshots([]);
    showToast(`Loaded ${file.name}`, 'info');
  };

  const handleFileClear = () => {
    setSelectedFile(null);
    setVideoDuration(0);
    setStartTime('');
    setEndTime('');
    setScreenshots([]);
  };

  // Instant Snapshot from Scrubber
  const handleInstantSnapshot = (canvas: HTMLCanvasElement, timestamp: number) => {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const shotIndex = screenshots.length + 1;
      const extension = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';
      const filename = `snap_${shotIndex}_${timestamp.toFixed(1)}s.${extension}`;
      const url = URL.createObjectURL(blob);

      const newShot: Screenshot = {
        id: `snap-${shotIndex}-${Date.now()}`,
        url,
        blob,
        filename,
        timestamp,
        frame: Math.round(timestamp * 30),
      };

      setScreenshots((prev) => [newShot, ...prev]);
      showToast(`Captured snapshot at ${timestamp.toFixed(1)}s!`, 'success');
    }, format, 0.95);
  };

  // Form Submit / Extraction Launch
  const handleStartExtraction = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validation: check video presence
    if (!selectedFile) {
      triggerError(
        'no_video',
        'No Video Uploaded!',
        'No video uploaded! At least give me something to work with. Duh!! 😐',
        '/assets/mb_mock.png'
      );
      return;
    }

    const startVal = parseFloat(startTime) || 0;
    const endVal = parseFloat(endTime) || videoDuration;
    const intervalVal = parseFloat(interval) || 1.0;

    // 2. Validation: check timing bounds
    if (startVal < 0) {
      triggerError(
        'invalid_timing',
        'Invalid Timing Inputs!',
        'Start time cannot be negative. Please enter a valid non-negative second timestamp.',
        '/assets/Microsoft-Fluentui-Emoji-Flat-Unamused-Face-Flat.512.png'
      );
      return;
    }

    if (endVal <= startVal) {
      triggerError(
        'invalid_timing',
        'Invalid Timing Inputs!',
        'End time must be greater than start time. What are these numbers even supposed to mean? 🤨',
        '/assets/Microsoft-Fluentui-Emoji-Flat-Unamused-Face-Flat.512.png'
      );
      return;
    }

    if (intervalVal <= 0) {
      triggerError(
        'invalid_timing',
        'Invalid Timing Inputs!',
        'Capture interval must be greater than 0 seconds.',
        '/assets/Microsoft-Fluentui-Emoji-Flat-Unamused-Face-Flat.512.png'
      );
      return;
    }

    // 3. Begin In-Browser Extraction
    try {
      setIsProcessing(true);
      setScreenshots([]);
      abortControllerRef.current = new AbortController();

      const extracted = await extractScreenshotsFromVideo({
        videoFile: selectedFile,
        startTime: startVal,
        endTime: endVal,
        interval: intervalVal,
        format,
        quality: 0.95,
        signal: abortControllerRef.current.signal,
        onProgress: (p) => setProgress(p),
      });

      setScreenshots(extracted);
      setIsProcessing(false);

      // Trigger Confetti Celebration
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.65 },
      });

      showToast(`Extraction complete! Extracted ${extracted.length} screenshots.`, 'success');
    } catch (err: any) {
      setIsProcessing(false);
      if (err.name === 'AbortError') {
        showToast('Extraction was cancelled.', 'info');
      } else {
        triggerError(
          'general',
          'Extraction Failed',
          err.message || 'An error occurred while decoding frames.'
        );
      }
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // ZIP Download
  const handleDownloadZip = async () => {
    if (screenshots.length === 0) return;
    try {
      setIsDownloadingZip(true);
      setZipProgress(0);

      const baseName = selectedFile?.name.replace(/\.[^/.]+$/, '') || 'pausepixel';
      await createAndDownloadZip(
        screenshots,
        `${baseName}_screenshots.zip`,
        (pct) => setZipProgress(pct)
      );

      setIsDownloadingZip(false);
      showToast('ZIP downloaded successfully!', 'success');
    } catch (err: any) {
      setIsDownloadingZip(false);
      showToast(err.message || 'Failed to package ZIP archive.', 'error');
    }
  };

  const handleReset = () => {
    handleFileClear();
  };

  return (
    <div className="relative min-h-screen">
      {/* Ambient Lighting Blobs */}
      <div className="fixed top-[-100px] left-[10%] w-[550px] h-[550px] rounded-full blur-[140px] pointer-events-none opacity-45 bg-radial-glow-1 animate-pulse-glow" />
      <div className="fixed top-[40%] right-[-100px] w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none opacity-40 bg-radial-glow-2 animate-pulse-glow [animation-delay:-4s]" />
      <div className="fixed bottom-[-150px] left-[25%] w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none opacity-35 bg-radial-glow-3 animate-pulse-glow [animation-delay:-8s]" />

      {/* Main Layout Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 flex flex-col gap-8 relative z-10">
        {/* Header */}
        <Header />

        <main className="flex flex-col gap-8">
          {/* Studio Card */}
          <section className="glass-panel glass-panel-hover rounded-3xl p-6 sm:p-10 flex flex-col gap-6 shadow-2xl">
            <DropZone
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
              onFileClear={handleFileClear}
            />

            <VideoScrubber
              videoFile={selectedFile}
              onDurationLoaded={(dur) => {
                setVideoDuration(dur);
                setEndTime(dur.toFixed(1));
              }}
              onSetStart={(t) => setStartTime(t.toString())}
              onSetEnd={(t) => setEndTime(t.toString())}
              onInstantSnap={handleInstantSnapshot}
            />

            <TimingControls
              startTime={startTime}
              endTime={endTime}
              interval={interval}
              videoDuration={videoDuration}
              format={format}
              onStartTimeChange={setStartTime}
              onEndTimeChange={setEndTime}
              onIntervalChange={setInterval}
              onFormatChange={setFormat}
              onSubmit={handleStartExtraction}
              isProcessing={isProcessing}
            />
          </section>

          {/* Live Extraction Progress HUD */}
          {isProcessing && (
            <ProgressHUD progress={progress} onCancel={handleCancel} />
          )}

          {/* Captured Screenshots Gallery */}
          {screenshots.length > 0 && !isProcessing && (
            <Gallery
              screenshots={screenshots}
              isDownloadingZip={isDownloadingZip}
              zipProgress={zipProgress}
              onDownloadZip={handleDownloadZip}
              onReset={handleReset}
              onSelectScreenshot={(idx) => setLightboxIndex(idx)}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="text-center py-6 text-sm text-slate-400">
          <p>
            PausePixel • Frame Extraction Suite • Made by{' '}
            <a
              href="https://github.com/dkwargit"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-4 transition-colors"
            >
              Divyanshu Kumar
            </a>
          </p>
        </footer>
      </div>

      {/* Modals & Overlays */}
      <Lightbox
        screenshots={screenshots}
        currentIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={(newIdx) => setLightboxIndex(newIdx)}
      />

      <ErrorModal
        modalState={errorModal}
        onClose={() => setErrorModal((prev) => ({ ...prev, isOpen: false }))}
      />

      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
};

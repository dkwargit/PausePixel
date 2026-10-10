import { Screenshot, ExtractionProgress, ImageFormat } from '../types';

export interface ExtractionOptions {
  videoFile: File;
  startTime: number;
  endTime?: number;
  interval: number;
  format?: ImageFormat;
  quality?: number;
  onProgress?: (progress: ExtractionProgress) => void;
  signal?: AbortSignal;
}

export async function extractScreenshotsFromVideo({
  videoFile,
  startTime = 0,
  endTime,
  interval = 1.0,
  format = 'image/jpeg',
  quality = 0.95,
  onProgress,
  signal,
}: ExtractionOptions): Promise<Screenshot[]> {
  const videoUrl = URL.createObjectURL(videoFile);
  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;

  try {
    // 1. Wait for video metadata to load
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('Could not decode video file metadata.'));
      video.src = videoUrl;
    });

    const duration = video.duration;
    if (isNaN(duration) || duration <= 0) {
      throw new Error('Invalid video duration detected.');
    }

    const actualStartTime = Math.max(0, startTime);
    const actualEndTime = (endTime && endTime > actualStartTime) 
      ? Math.min(endTime, duration) 
      : duration;

    if (actualStartTime >= actualEndTime) {
      throw new Error('Start time must be strictly less than end time.');
    }

    if (interval <= 0) {
      throw new Error('Extraction interval must be greater than 0 seconds.');
    }

    // 2. Prepare canvas with native video dimensions
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1920;
    canvas.height = video.videoHeight || 1080;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      throw new Error('Canvas 2D rendering context is not available.');
    }

    // 3. Calculate target timestamps
    const targetTimestamps: number[] = [];
    for (let t = actualStartTime; t <= actualEndTime; t += interval) {
      targetTimestamps.push(Number(t.toFixed(2)));
    }
    // Ensure final edge timestamp is included if needed
    if (targetTimestamps.length === 0) {
      targetTimestamps.push(actualStartTime);
    }

    const totalFrames = targetTimestamps.length;
    const screenshots: Screenshot[] = [];

    // Approximate FPS based on typical media
    const estimatedFps = 30;

    // 4. Extraction loop
    for (let i = 0; i < totalFrames; i++) {
      if (signal?.aborted) {
        throw new DOMException('Aborted by user', 'AbortError');
      }

      const targetTime = targetTimestamps[i];

      // Seek to target frame
      await new Promise<void>((resolve, reject) => {
        let isDone = false;
        const onSeeked = () => {
          if (!isDone) {
            isDone = true;
            video.removeEventListener('seeked', onSeeked);
            resolve();
          }
        };

        const timeout = setTimeout(() => {
          if (!isDone) {
            isDone = true;
            video.removeEventListener('seeked', onSeeked);
            resolve(); // proceed even if slight lag
          }
        }, 1500);

        video.addEventListener('seeked', onSeeked, { once: true });
        video.currentTime = targetTime;
      });

      // Draw frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to Blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error(`Failed to encode screenshot frame at ${targetTime}s`));
          },
          format,
          quality
        );
      });

      const shotIndex = i + 1;
      const extension = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';
      const filename = `ss_${shotIndex}.${extension}`;
      const url = URL.createObjectURL(blob);

      screenshots.push({
        id: `shot-${shotIndex}-${Date.now()}`,
        url,
        blob,
        filename,
        timestamp: targetTime,
        frame: Math.round(targetTime * estimatedFps),
      });

      // Emit progress callback
      if (onProgress) {
        const percent = Math.round(((i + 1) / totalFrames) * 100);
        onProgress({
          current: i + 1,
          total: totalFrames,
          percentage: percent,
          fps: estimatedFps,
          savedCount: screenshots.length,
          statusText: `Captured ${screenshots.length} of ${totalFrames} frames (${percent}%)`,
        });
      }

      // Brief tick to allow browser UI thread to breathe
      await new Promise((r) => setTimeout(r, 8));
    }

    return screenshots;
  } finally {
    // Cleanup video instance and object URL
    video.src = '';
    video.load();
    URL.revokeObjectURL(videoUrl);
  }
}

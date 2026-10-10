import JSZip from 'jszip';
import { Screenshot } from '../types';

export async function createAndDownloadZip(
  screenshots: Screenshot[], 
  zipName: string = 'pausepixel_screenshots.zip',
  onProgress?: (percent: number) => void
): Promise<void> {
  if (!screenshots || screenshots.length === 0) {
    throw new Error('No screenshots available to package.');
  }

  const zip = new JSZip();
  const folder = zip.folder('screenshots') || zip;

  for (let i = 0; i < screenshots.length; i++) {
    const shot = screenshots[i];
    folder.file(shot.filename, shot.blob);
  }

  const content = await zip.generateAsync(
    { 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    },
    (metadata) => {
      if (onProgress) {
        onProgress(Math.round(metadata.percent));
      }
    }
  );

  // Trigger browser download
  const downloadUrl = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = zipName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}

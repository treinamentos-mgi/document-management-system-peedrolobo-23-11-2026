import { useState } from 'react';
import { downloadDocument } from '../services/documentApi.js';

export default function DownloadButton({ id, originalName, onError }) {
  const [isDownloading, setIsDownloading] = useState(false);

  async function handleDownload() {
    if (isDownloading) return;

    setIsDownloading(true);
    try {
      await downloadDocument(id, originalName);
    } catch (error) {
      onError(error.message);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <button
      className="download-button"
      type="button"
      title={`Baixar ${originalName}`}
      aria-label={`Baixar ${originalName}`}
      disabled={isDownloading}
      onClick={handleDownload}
    >
      {isDownloading ? 'Baixando...' : 'Baixar'}
    </button>
  );
}
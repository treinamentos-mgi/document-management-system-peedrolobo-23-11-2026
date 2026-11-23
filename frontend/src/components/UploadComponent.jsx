import { useRef, useState } from 'react';
import { uploadDocument } from '../services/documentApi.js';
import { formatFileSize } from '../utils/documentFormatting.js';

export default function UploadComponent({ onUploadComplete, onError }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef(null);

  function selectFile(file) {
    if (file) setSelectedFile(file);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    selectFile(event.dataTransfer.files[0]);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!selectedFile || isUploading) return;

    setIsUploading(true);
    try {
      await uploadDocument(selectedFile);
      setSelectedFile(null);
      if (inputRef.current) inputRef.current.value = '';
      onUploadComplete();
    } catch (error) {
      onError(error.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <label
        className={`drop-zone${isDragging ? ' drop-zone--active' : ''}`}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setIsDragging(false);
        }}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          className="visually-hidden"
          type="file"
          onChange={(event) => selectFile(event.target.files[0])}
        />
        <span className="drop-zone-mark" aria-hidden="true">+</span>
        <span className="drop-zone-title">
          {isDragging ? 'Solte o arquivo aqui' : 'Arraste um arquivo para cá'}
        </span>
        <span className="drop-zone-caption">ou clique para escolher no dispositivo</span>
      </label>

      {selectedFile && (
        <div className="selected-file" aria-live="polite">
          <span className="file-type-mark" aria-hidden="true">DOC</span>
          <span className="selected-file-name" title={selectedFile.name}>
            {selectedFile.name}
          </span>
          <span className="selected-file-size">
            {formatFileSize(selectedFile.size)}
          </span>
          <button
            className="remove-file"
            type="button"
            aria-label="Remover arquivo selecionado"
            onClick={() => {
              setSelectedFile(null);
              if (inputRef.current) inputRef.current.value = '';
            }}
          >
            Remover
          </button>
        </div>
      )}

      <button className="primary-button upload-button" type="submit" disabled={!selectedFile || isUploading}>
        {isUploading ? 'Enviando...' : 'Enviar documento'}
      </button>
      <p className="upload-footnote">Os arquivos são armazenados localmente.</p>
    </form>
  );
}
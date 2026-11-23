import DownloadButton from './DownloadButton.jsx';
import { formatFileSize } from '../utils/documentFormatting.js';

export default function DocumentList({ documents, isLoading, onError }) {
  if (isLoading) {
    return <p className="list-message" role="status">Carregando documentos...</p>;
  }

  if (documents.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-state-mark" aria-hidden="true">00</span>
        <p>Nenhum documento por aqui.</p>
        <span>Os arquivos enviados aparecerão nesta lista.</span>
      </div>
    );
  }

  return (
    <ul className="document-list">
      {documents.map((document) => (
        <li className="document-row" key={document.id}>
          <span className="file-type-mark" aria-hidden="true">
            {getFileLabel(document.originalName)}
          </span>
          <div className="document-details">
            <span className="document-name" title={document.originalName}>
              {document.originalName}
            </span>
            <span className="document-meta">
              {formatDate(document.uploadedAt)} <span aria-hidden="true">·</span> {formatFileSize(document.size)}
            </span>
          </div>
          <DownloadButton
            id={document.id}
            originalName={document.originalName}
            onError={onError}
          />
        </li>
      ))}
    </ul>
  );
}

function getFileLabel(name) {
  const extension = name.split('.').pop();
  return extension && extension !== name ? extension.slice(0, 3).toUpperCase() : 'DOC';
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Data indisponível'
    : date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

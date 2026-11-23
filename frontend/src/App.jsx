import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { listDocuments } from './services/documentApi.js';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    let isCurrent = true;

    setIsLoading(true);
    listDocuments()
      .then((items) => {
        if (isCurrent) setDocuments(items);
      })
      .catch((error) => {
        if (isCurrent) {
          setFeedback({ type: 'error', message: error.message });
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [refreshVersion]);

  function handleUploadComplete() {
    setFeedback({ type: 'success', message: 'Documento enviado com sucesso.' });
    setRefreshVersion((version) => version + 1);
  }

  function handleError(message) {
    setFeedback({ type: 'error', message });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="DMS, início">
          <span className="brand-mark">D</span>
          <span className="brand-name">DMS</span>
        </a>
        <div className="storage-indicator">
          <span className="status-dot" aria-hidden="true" />
          Armazenamento local
        </div>
      </header>

      <main id="inicio" className="page-shell">
        <section className="page-intro" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">ARQUIVO DE DOCUMENTOS</p>
            <h1 id="page-title">Tudo em seu <em>lugar.</em></h1>
          </div>
          <p className="intro-note">
            Envie, organize e encontre seus arquivos em um só lugar.
          </p>
        </section>

        {feedback && (
          <div
            className={`feedback feedback--${feedback.type}`}
            role={feedback.type === 'error' ? 'alert' : 'status'}
          >
            <span>{feedback.message}</span>
            <button
              className="feedback-dismiss"
              type="button"
              aria-label="Fechar mensagem"
              onClick={() => setFeedback(null)}
            >
              Fechar
            </button>
          </div>
        )}

        <div className="workspace-grid">
          <section className="upload-section" aria-labelledby="upload-title">
            <div className="section-heading">
              <span className="section-index">01</span>
              <div>
                <h2 id="upload-title">Adicionar documento</h2>
                <p>Envie um arquivo para o seu espaço.</p>
              </div>
            </div>
            <UploadComponent onUploadComplete={handleUploadComplete} onError={handleError} />
          </section>

          <section className="library-section" aria-labelledby="library-title">
            <div className="library-heading">
              <div className="section-heading">
                <span className="section-index">02</span>
                <div>
                  <h2 id="library-title">Seus documentos</h2>
                  <p>Arquivos disponíveis para consulta e download.</p>
                </div>
              </div>
              <span className="document-count" aria-label={`${documents.length} documentos`}>
                {String(documents.length).padStart(2, '0')}
              </span>
            </div>
            <DocumentList
              documents={documents}
              isLoading={isLoading}
              onError={handleError}
            />
          </section>
        </div>
      </main>

      <footer className="page-footer">
        <span>DMS</span>
        <span>Documentos armazenados localmente</span>
      </footer>
    </div>
  );
}
